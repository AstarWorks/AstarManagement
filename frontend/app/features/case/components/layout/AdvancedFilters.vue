<!--
  詳細フィルター - Simple over Easy
  Advanced Filters - Configuration-driven component
-->
<template>
  <div class="advanced-filters space-y-4">
    <!-- Tags Filter -->
    <div class="space-y-2">
      <Label>{{ t('matter.filters.tags.label') }}</Label>
      <ToggleGroup 
        type="multiple" 
        :model-value="filters.tags"
        class="flex flex-wrap gap-2"
        @update:model-value="(tags) => updateFilter('tags', tags as string[])"
      >
        <ToggleGroupItem 
          v-for="tag in availableTags"
          :key="tag"
          :value="tag"
          variant="outline"
          size="sm"
        >
          <Icon 
            :name="filters.tags.includes(tag) ? 'lucide:check' : 'lucide:plus'" 
            class="h-3 w-3 mr-1" 
          />
          {{ tag }}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>

    <!-- Sort Options -->
    <div class="space-y-2">
      <Label>{{ t('matter.filters.sort.label') }}</Label>
      <div class="grid grid-cols-2 gap-4">
        <Select
          :model-value="filters.sortBy"
          @update:model-value="(value) => updateFilter('sortBy', value as string)"
        >
          <SelectTrigger>
            <SelectValue :placeholder="t('matter.filters.sort.label')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem 
              v-for="option in sortByOptions" 
              :key="option.value" 
              :value="option.value"
            >
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        
        <Select
          :model-value="filters.sortOrder"
          @update:model-value="(value) => updateFilter('sortOrder', value as string)"
        >
          <SelectTrigger>
            <SelectValue :placeholder="t('matter.filters.sort.order.asc')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem 
              v-for="option in sortOrderOptions" 
              :key="option.value" 
              :value="option.value"
            >
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type {  ICaseFilters  } from '@case/types/case'
import { LEGAL_PRACTICE_TAGS } from '@infrastructure/config/filterConfig'
import { ToggleGroup, ToggleGroupItem } from '@ui/toggle-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/select'
import { Label } from '@ui/label'

interface Props {
  filters: ICaseFilters
}

interface Emits {
  (e: 'update:filters', filters: Partial<ICaseFilters>): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

// 利用可能なタグ（readonly配列を通常の配列に変換）
const availableTags = computed(() => [...LEGAL_PRACTICE_TAGS])

// ソートオプション
// i18n - use standard useI18n since all keys are static
const { t } = useI18n()

const sortByOptions = computed(() => [
  { value: 'dueDate', label: t('matter.filters.sort.by.dueDate') },
  { value: 'priority', label: t('matter.filters.sort.by.priority') },
  { value: 'createdAt', label: t('matter.filters.sort.by.createdAt') },
  { value: 'updatedAt', label: t('matter.filters.sort.by.updatedAt') },
  { value: 'title', label: t('matter.filters.sort.by.title') }
])

const sortOrderOptions = computed(() => [
  { value: 'asc', label: t('matter.filters.sort.order.asc') },
  { value: 'desc', label: t('matter.filters.sort.order.desc') }
])

// フィルター更新処理
const updateFilter = (key: keyof ICaseFilters, value: string | string[] | unknown) => {
  emit('update:filters', { [key]: value })
}
</script>
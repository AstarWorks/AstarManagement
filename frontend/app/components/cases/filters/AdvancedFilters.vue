<!--
  詳細フィルター - Simple over Easy
  Advanced Filters - Configuration-driven component
-->
<template>
  <div class="advanced-filters space-y-4">
    <!-- Tags Filter -->
    <FilterGroup :label="$t('matter.filters.tags.label')">
      <TagSelector
        :available-tags="availableTags"
        :selected-tags="filters.tags"
        @update:selected-tags="(tags) => updateFilter('tags', tags)"
      />
    </FilterGroup>

    <!-- Sort Options -->
    <FilterGroup :label="$t('matter.filters.sort.label')">
      <div class="grid grid-cols-2 gap-4">
        <FilterSelect
          :model-value="filters.sortBy"
          :placeholder="$t('matter.filters.sort.label')"
          :options="sortByOptions"
          @update:model-value="(value) => updateFilter('sortBy', value)"
        />
        
        <FilterSelect
          :model-value="filters.sortOrder"
          :placeholder="$t('matter.filters.sort.order.asc')"
          :options="sortOrderOptions"
          @update:model-value="(value) => updateFilter('sortOrder', value)"
        />
      </div>
    </FilterGroup>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CaseFilters } from '~/types/case'
import { getAdvancedFilterConfigs, LEGAL_PRACTICE_TAGS } from '~/config/filterConfig'
import { FilterGroup } from '~/components/ui/filter-group'
import { FilterSelect } from '~/components/ui/filter-select'
import { TagSelector } from '~/components/ui/tag-selector'

interface Props {
  filters: CaseFilters
}

interface Emits {
  (e: 'update:filters', filters: Partial<CaseFilters>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 利用可能なタグ（readonly配列を通常の配列に変換）
const availableTags = computed(() => [...LEGAL_PRACTICE_TAGS])

// ソートオプション
const sortByOptions = computed(() => [
  { value: 'dueDate', label: $t('matter.filters.sort.by.dueDate') },
  { value: 'priority', label: $t('matter.filters.sort.by.priority') },
  { value: 'createdAt', label: $t('matter.filters.sort.by.createdAt') },
  { value: 'updatedAt', label: $t('matter.filters.sort.by.updatedAt') },
  { value: 'title', label: $t('matter.filters.sort.by.title') }
])

const sortOrderOptions = computed(() => [
  { value: 'asc', label: $t('matter.filters.sort.order.asc') },
  { value: 'desc', label: $t('matter.filters.sort.order.desc') }
])

// フィルター更新処理
const updateFilter = (key: keyof CaseFilters, value: any) => {
  emit('update:filters', { [key]: value })
}
</script>
<!--
  アクティブフィルター表示 - Simple over Easy
  Active Filters Summary - Dynamic and accessible
-->
<template>
  <div v-if="hasActiveFilters" class="active-filters mt-4 pt-4 border-t border-border">
    <div class="flex flex-wrap gap-2">
      <!-- Search Filter Badge -->
      <Badge 
        v-if="filters.search"
        variant="secondary" 
        class="flex items-center gap-1"
      >
        {{ $t('matter.filters.activeFilters.search', { query: filters.search }) }}
        <Button
          variant="ghost"
          size="sm"
          class="h-4 w-4 p-0 hover:bg-transparent"
          @click="clearFilter('search')"
        >
          <Icon name="lucide:x" class="h-3 w-3" />
        </Button>
      </Badge>
      
      <!-- Client Type Filter Badge -->
      <Badge
        v-if="filters.clientType !== 'all'"
        variant="secondary"
        class="flex items-center gap-1"
      >
        {{ $t('matter.filters.activeFilters.clientType', { 
          type: $t(`matter.filters.clientType.options.${filters.clientType}`) 
        }) }}
        <Button
          variant="ghost"
          size="sm"
          class="h-4 w-4 p-0 hover:bg-transparent"
          @click="clearFilter('clientType')"
        >
          <Icon name="lucide:x" class="h-3 w-3" />
        </Button>
      </Badge>
      
      <!-- Priority Filter Badge -->
      <Badge
        v-if="filters.priority !== 'all'"
        variant="secondary"
        class="flex items-center gap-1"
      >
        {{ $t('matter.filters.activeFilters.priority', { 
          priority: $t(`matter.filters.priority.options.${filters.priority}`) 
        }) }}
        <Button
          variant="ghost"
          size="sm"
          class="h-4 w-4 p-0 hover:bg-transparent"
          @click="clearFilter('priority')"
        >
          <Icon name="lucide:x" class="h-3 w-3" />
        </Button>
      </Badge>
      
      <!-- Assigned Lawyer Filter Badge -->
      <Badge
        v-if="filters.assignedLawyer !== 'all'"
        variant="secondary"
        class="flex items-center gap-1"
      >
        {{ $t('matter.filters.activeFilters.assignedLawyer', { 
          lawyer: getLawyerName(filters.assignedLawyer) 
        }) }}
        <Button
          variant="ghost"
          size="sm"
          class="h-4 w-4 p-0 hover:bg-transparent"
          @click="clearFilter('assignedLawyer')"
        >
          <Icon name="lucide:x" class="h-3 w-3" />
        </Button>
      </Badge>
      
      <!-- Date Range Filter Badge -->
      <Badge
        v-if="filters.dateRange"
        variant="secondary"
        class="flex items-center gap-1"
      >
        {{ $t('matter.filters.activeFilters.dateRange') }}
        <Button
          variant="ghost"
          size="sm"
          class="h-4 w-4 p-0 hover:bg-transparent"
          @click="clearFilter('dateRange')"
        >
          <Icon name="lucide:x" class="h-3 w-3" />
        </Button>
      </Badge>
      
      <!-- Tag Filter Badges -->
      <Badge
        v-for="tag in filters.tags"
        :key="tag"
        variant="secondary"
        class="flex items-center gap-1"
      >
        {{ tag }}
        <Button
          variant="ghost"
          size="sm"
          class="h-4 w-4 p-0 hover:bg-transparent"
          @click="removeTag(tag)"
        >
          <Icon name="lucide:x" class="h-3 w-3" />
        </Button>
      </Badge>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type {  ICaseFilters  } from '~/types/case'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'

interface Props {
  filters: ICaseFilters
  availableLawyers?: Array<{ id: string; name: string }>
}

interface Emits {
  (e: 'clearFilter', key: keyof ICaseFilters): void
  (e: 'removeTag', tag: string): void
}

const props = withDefaults(defineProps<Props>(), {
  availableLawyers: () => []
})

const emit = defineEmits<Emits>()

// アクティブフィルターの存在チェック
const hasActiveFilters = computed(() => {
  return (
    props.filters.search !== '' ||
    props.filters.clientType !== 'all' ||
    props.filters.priority !== 'all' ||
    props.filters.assignedLawyer !== 'all' ||
    props.filters.tags.length > 0 ||
    props.filters.dateRange !== null
  )  
})

// 弁護士名の取得
const getLawyerName = (lawyerId: string): string => {
  const lawyer = props.availableLawyers.find(l => l.id === lawyerId)
  return lawyer?.name || lawyerId
}

// フィルタークリア処理
const clearFilter = (key: keyof ICaseFilters) => {
  emit('clearFilter', key)
}

// タグ削除処理
const removeTag = (tag: string) => {
  emit('removeTag', tag)
}
</script>

<style scoped>
@media (max-width: 768px) {
  .active-filters {
    overflow-x: auto;
  }
  
  .active-filters > div {
    min-width: max-content;
  }
}
</style>
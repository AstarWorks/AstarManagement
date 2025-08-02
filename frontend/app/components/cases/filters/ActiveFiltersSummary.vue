<!--
  アクティブフィルター表示 - Simple over Easy
  Active Filters Summary - Dynamic and accessible
-->
<template>
  <div v-if="hasActiveFilters" class="active-filters mt-4 pt-4 border-t border-border">
    <div class="flex flex-wrap gap-2">
      <!-- Search Filter Badge -->
      <ActiveFilterBadge
        v-if="filters.search"
        :label="$t('matter.filters.activeFilters.search', { query: filters.search })"
        @remove="clearFilter('search')"
      />
      
      <!-- Client Type Filter Badge -->
      <ActiveFilterBadge
        v-if="filters.clientType !== 'all'"
        :label="$t('matter.filters.activeFilters.clientType', { 
          type: $t(`matter.filters.clientType.options.${filters.clientType}`) 
        })"
        @remove="clearFilter('clientType')"
      />
      
      <!-- Priority Filter Badge -->
      <ActiveFilterBadge
        v-if="filters.priority !== 'all'"
        :label="$t('matter.filters.activeFilters.priority', { 
          priority: $t(`matter.filters.priority.options.${filters.priority}`) 
        })"
        @remove="clearFilter('priority')"
      />
      
      <!-- Assigned Lawyer Filter Badge -->
      <ActiveFilterBadge
        v-if="filters.assignedLawyer !== 'all'"
        :label="$t('matter.filters.activeFilters.assignedLawyer', { 
          lawyer: getLawyerName(filters.assignedLawyer) 
        })"
        @remove="clearFilter('assignedLawyer')"
      />
      
      <!-- Date Range Filter Badge -->
      <ActiveFilterBadge
        v-if="filters.dateRange"
        :label="$t('matter.filters.activeFilters.dateRange')"
        @remove="clearFilter('dateRange')"
      />
      
      <!-- Tag Filter Badges -->
      <ActiveFilterBadge
        v-for="tag in filters.tags"
        :key="tag"
        :label="tag"
        @remove="removeTag(tag)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CaseFilters } from '~/types/case'
import { ActiveFilterBadge } from '~/components/ui/active-filter-badge'

interface Props {
  filters: CaseFilters
  availableLawyers?: Array<{ id: string; name: string }>
}

interface Emits {
  (e: 'clear-filter', key: keyof CaseFilters): void
  (e: 'remove-tag', tag: string): void
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
const clearFilter = (key: keyof CaseFilters) => {
  emit('clear-filter', key)
}

// タグ削除処理
const removeTag = (tag: string) => {
  emit('remove-tag', tag)
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
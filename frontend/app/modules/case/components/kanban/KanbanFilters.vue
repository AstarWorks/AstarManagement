<!--
  案件フィルター - Simple over Easy リファクタリング版
  Kanban Filters - Refactored with configuration-based approach
-->
<template>
  <div class="kanban-filters bg-card border border-border rounded-lg p-4 shadow-sm">
    <!-- ヘッダー -->
    <div class="filters-header flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-foreground">{{ $t('matter.filters.title') }}</h3>
      <div class="header-actions flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          :disabled="!hasActiveFilters"
          @click="handleClearAll"
        >
          <Icon name="lucide:x" class="h-4 w-4 mr-1" />
          {{ $t('matter.filters.actions.clear') }}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          @click="showAdvanced = !showAdvanced"
        >
          <Icon 
            :name="showAdvanced ? 'lucide:chevron-up' : 'lucide:chevron-down'" 
            class="h-4 w-4 mr-1" 
          />
          {{ $t('matter.filters.actions.advanced') }}
        </Button>
      </div>
    </div>

    <!-- 基本フィルター -->
    <BasicFilters
      :filters="filters"
      :available-lawyers="filterOptions.assignedLawyers"
      class="mb-4"
      @update:filters="handleUpdateFilters"
    />

    <!-- 詳細フィルター -->
    <Collapsible v-model:open="showAdvanced">
      <CollapsibleContent>
        <AdvancedFilters
          :filters="filters"
          @update:filters="handleUpdateFilters"
        />
      </CollapsibleContent>
    </Collapsible>

    <!-- アクティブフィルター表示 -->
    <ActiveFiltersSummary
      :filters="filters"
      :available-lawyers="filterOptions.assignedLawyers"
      @clear-filter="handleClearFilter"
      @remove-tag="handleRemoveTag"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ICaseFilters } from '~/modules/case/types/case'
import { useCaseFilterStore } from '~/modules/case/stores/caseFilter'
import { useFilteredCases } from '~/modules/case/composables/useFilteredCases'
import BasicFilters from '../filters/CaseBasicFilters.vue'
import AdvancedFilters from '../filters/CaseAdvancedFilters.vue'
import ActiveFiltersSummary from '../filters/CaseActiveFiltersSummary.vue'

// No props needed - using store directly
const filterStore = useCaseFilterStore()
const { filterOptions } = useFilteredCases()
const { filters, hasActiveFilters } = storeToRefs(filterStore)

// Local UI state
const showAdvanced = ref(false)

// Filter update handlers
const handleUpdateFilters = (updates: Partial<ICaseFilters>) => {
  filterStore.updateFilters(updates)
}

// Clear all filters
const handleClearAll = () => {
  filterStore.resetAllFilters()
}

// Clear individual filter
const handleClearFilter = (key: keyof ICaseFilters) => {
  filterStore.clearFilter(key)
}

// Remove tag
const handleRemoveTag = (tag: string) => {
  filterStore.removeTag(tag)
}
</script>


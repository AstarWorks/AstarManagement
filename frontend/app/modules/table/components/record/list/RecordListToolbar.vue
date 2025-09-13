<template>
  <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
    <!-- Search & Filters -->
    <div class="flex flex-1 items-center gap-2">
      <SearchBar
        :model-value="searchQuery"
        @update:model-value="$emit('update:search', $event)"
      />
      
      <FilterDropdown
        :filterable-columns="filterableColumns"
        :filters="filters"
        :active-filter-count="activeFilterCount"
        @filter="(columnKey: string, value: unknown) => $emit('filter', columnKey, value)"
        @clear-filters="$emit('clear-filters')"
      />

      <ColumnSelector
        :available-columns="availableColumns"
        :visible-columns="visibleColumns"
        @toggle-column="$emit('toggle-column', $event)"
      />

      <ViewSettings
        :density="density"
        :show-pinning-controls="showPinningControls"
        @change-density="$emit('change-density', $event)"
        @clear-all-pins="$emit('clear-all-pins')"
        @reset-to-default="$emit('reset-to-default')"
      />
    </div>

    <!-- Actions -->
    <BatchActions
      :selected-count="selectedCount"
      @clear-selection="$emit('clear-selection')"
      @duplicate-selected="$emit('duplicate-selected')"
      @delete-selected="$emit('delete-selected')"
      @export="$emit('export', $event)"
      @create="$emit('create')"
    />
  </div>
</template>

<script setup lang="ts">
import SearchBar from '../toolbar/SearchBar.vue'
import FilterDropdown from '../toolbar/FilterDropdown.vue'
import ColumnSelector from '../toolbar/ColumnSelector.vue'
import ViewSettings from '../toolbar/ViewSettings.vue'
import BatchActions from '../toolbar/BatchActions.vue'
import type { PropertyDefinitionDto } from '../../../types'

// Props
const props = defineProps<{
  searchQuery: string
  filterableColumns: Array<PropertyDefinitionDto & { key: string }>
  availableColumns: Array<PropertyDefinitionDto & { key: string }>
  visibleColumns: string[]
  filters: Record<string, unknown>
  activeFilterCount: number
  selectedCount: number
  density: 'compact' | 'normal' | 'comfortable'
  showPinningControls?: boolean
}>()

// Emits
const emit = defineEmits<{
  'update:search': [value: string]
  filter: [columnKey: string, value: unknown]
  'clear-filters': []
  'toggle-column': [columnKey: string]
  'change-density': [density: 'compact' | 'normal' | 'comfortable']
  'clear-all-pins': []
  'reset-to-default': []
  'clear-selection': []
  'duplicate-selected': []
  'delete-selected': []
  export: [format: 'csv' | 'json' | 'excel']
  create: []
}>()
</script>
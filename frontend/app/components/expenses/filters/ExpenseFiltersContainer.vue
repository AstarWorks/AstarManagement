<template>
  <Card class="expense-filters">
    <CardHeader>
      <div class="filter-header flex justify-between items-center">
        <CardTitle class="flex items-center gap-2">
          <Icon name="lucide:filter" class="w-5 h-5" />
          {{ $t('expense.filters.title') }}
          <Badge 
            v-if="hasActiveFilters" 
            variant="secondary" 
            class="ml-2 bg-blue-100 text-blue-800 text-xs"
          >
            {{ activeFilterCount }}
          </Badge>
        </CardTitle>
        <div class="filter-actions flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            :disabled="!hasActiveFilters"
            @click="resetFilters"
          >
            <Icon name="lucide:x" class="w-4 h-4 mr-1" />
            {{ $t('expense.filters.clear') }}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            @click="toggleAdvanced"
          >
            <Icon
              :name="showAdvanced ? 'lucide:chevron-up' : 'lucide:chevron-down'"
              class="w-4 h-4 mr-1"
            />
            {{ $t('expense.filters.advanced') }}
          </Button>
        </div>
      </div>
    </CardHeader>
    
    <CardContent>
      <!-- Quick Date Filters -->
      <QuickDateFilters
        :start-date="filters.dateFrom"
        :end-date="filters.dateTo"
        @apply-preset="handleDatePreset"
      />

      <!-- Basic Filters -->
      <BasicFilters
        :start-date="filters.dateFrom"
        :end-date="filters.dateTo"
        :category="filters.categories?.[0]"
        :search-query="filters.searchTerm"
        :available-categories="availableCategories"
        @update:start-date="updateFilter('dateFrom', $event)"
        @update:end-date="updateFilter('dateTo', $event)"
        @update:category="updateFilter('categories', $event ? [$event] : undefined)"
        @update:search-query="updateFilter('searchTerm', $event)"
      />

      <!-- Advanced Filters -->
      <Collapsible v-model:open="showAdvanced">
        <CollapsibleContent>
          <AdvancedFilters
            :min-amount="filters.amountMin"
            :max-amount="filters.amountMax"
            :case-id="filters.caseIds?.[0]"
            :available-cases="availableCases"
            @update:min-amount="updateFilter('amountMin', $event)"
            @update:max-amount="updateFilter('amountMax', $event)"
            @update:case-id="updateFilter('caseIds', $event ? [$event] : undefined)"
          />
        </CollapsibleContent>
      </Collapsible>

      <!-- Active Filters Summary -->
      <ActiveFiltersSummary
        :active-filters="activeFilterSummary"
        @clear-filter="clearFilter"
      />

      <!-- Filter Statistics -->
      <FilterStatistics
        v-if="hasActiveFilters"
        :stats="stats"
        :show-stats="hasActiveFilters"
      />
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useDebounceFn, useToggle } from '@vueuse/core'
import type { IExpenseFilters } from '~/types/expense'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
} from '~/components/ui/collapsible'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { useExpenseFilters } from '~/composables/useExpenseFilters'

// Import child components
import QuickDateFilters from './QuickDateFilters.vue'
import BasicFilters from './BasicFilters.vue'
import AdvancedFilters from './AdvancedFilters.vue'
import ActiveFiltersSummary from './ActiveFiltersSummary.vue'
import FilterStatistics from './FilterStatistics.vue'

interface CaseOption {
  id: string
  title: string
}

interface Props {
  /** Current filter values */
  modelValue: IExpenseFilters
  /** Available category options */
  availableCategories?: string[]
  /** Available case options */
  availableCases?: CaseOption[]
  /** Statistics for filtered results */
  stats?: {
    totalMatched: number
    totalIncome: number
    totalExpense: number
    netBalance: number
  }
  /** Debounce delay for filter changes */
  debounceMs?: number
}

interface Emits {
  /** Filter update and change events */
  (event: 'update:modelValue' | 'filterChange', filters: IExpenseFilters): void
}

const props = withDefaults(defineProps<Props>(), {
  availableCategories: () => ['交通費', '印紙代', 'コピー代', '郵送料', 'その他'],
  availableCases: () => [],
  stats: () => ({
    totalMatched: 0,
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0
  }),
  debounceMs: 300
})

const emit = defineEmits<Emits>()

// Use expense filters composable for state management
const {
  filters,
  hasActiveFilters,
  activeFilterCount,
  activeFilterSummary,
  resetFilters: resetFiltersInternal,
  clearFilter: clearFilterInternal
} = useExpenseFilters(props.modelValue)

// Advanced filters toggle using VueUse
const [showAdvanced, toggleAdvanced] = useToggle(false)

// Debounced emit for performance
const debouncedEmit = useDebounceFn(() => {
  const mutableFilters: IExpenseFilters = {
    ...filters.value,
    // Ensure arrays are mutable
    tagIds: filters.value.tagIds ? [...filters.value.tagIds] : undefined,
    categories: filters.value.categories ? [...filters.value.categories] : undefined,
    caseIds: filters.value.caseIds ? [...filters.value.caseIds] : undefined
  }
  
  emit('update:modelValue', mutableFilters)
  emit('filterChange', mutableFilters)
}, props.debounceMs)

/**
 * Update a specific filter value
 * Simple over Easy: Single responsibility for filter updates
 */
const updateFilter = (key: keyof IExpenseFilters, value: unknown) => {
  // Handle undefined/empty values appropriately
  if (value === '' || value === null) {
    value = undefined
  }
  
  // Handle readonly array conversion if needed
  const newValue = Array.isArray(value) && 'slice' in value ? value.slice() : value
  Object.assign(filters.value, { [key]: newValue })
  debouncedEmit()
}

/**
 * Handle date preset application
 * Dumb UI: Just update the filters, let composable handle logic
 */
const handleDatePreset = (dateRange: { startDate: string; endDate: string }) => {
  Object.assign(filters.value, {
    dateFrom: dateRange.startDate,
    dateTo: dateRange.endDate
  })
  debouncedEmit()
}

/**
 * Reset all filters
 */
const resetFilters = () => {
  resetFiltersInternal()
  debouncedEmit()
}

/**
 * Clear a specific filter
 */
const clearFilter = (filterKey: string) => {
  clearFilterInternal(filterKey)
  debouncedEmit()
}

// Watch for external prop changes
watch(() => props.modelValue, (newValue) => {
  Object.assign(filters.value, newValue)
}, { deep: true })
</script>

<style scoped>
.expense-filters {
  /* Card styles handled by shadcn/ui */
}

.filter-header {
  /* Layout styles handled by Tailwind classes */
}

.filter-actions {
  /* Layout styles handled by Tailwind classes */
}
</style>
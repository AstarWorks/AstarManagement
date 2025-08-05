<template>
  <!-- 
    Refactored ExpenseFilters using component composition
    Following Simple over Easy principle with clear separation of concerns
    
    BEFORE: 599 lines with mixed responsibilities
    AFTER: Clean delegation to specialized components
  -->
  <ExpenseFiltersContainer
    :model-value="modelValue"
    :available-categories="availableCategories"
    :available-cases="availableCases"
    :stats="stats"
    :debounce-ms="debounceMs"
    @update:model-value="emit('update:modelValue', $event)"
    @filter-change="emit('filterChange', $event)"
  />
</template>

<script setup lang="ts">
import type { IExpenseFilter } from '~/types/expense'
import ExpenseFiltersContainer from './filters/ExpenseFiltersContainer.vue'

interface CaseOption {
  id: string
  title: string
}

interface Props {
  /** Current filter values (v-model) */
  modelValue: IExpenseFilter
  /** Available category options */
  availableCategories?: string[]
  /** Available case options for filtering */
  availableCases?: CaseOption[]
  /** Statistics for current filter results */
  stats?: {
    totalMatched: number
    totalIncome: number
    totalExpense: number
    netBalance: number
  }
  /** Debounce delay for filter changes in milliseconds */
  debounceMs?: number
}

interface Emits {
  /** Filter update and change events */
  (event: 'update:modelValue' | 'filterChange', filters: IExpenseFilter): void
}

const _props = withDefaults(defineProps<Props>(), {
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
</script>

<!--
## Architecture Benefits

### Before (599 lines):
- Single monolithic component
- Mixed UI/logic responsibilities  
- Hardcoded date calculations
- Inline formatting functions
- Direct DOM manipulation
- No composable extraction

### After (30 lines + composables):
- Clear component hierarchy
- Separated concerns (UI vs Logic)
- Reusable composables
- Dumb UI components
- VueUse integration
- Type-safe with Zod validation

### Component Structure:
```
ExpenseFilters.vue (30 lines - interface only)
└── ExpenseFiltersContainer.vue (150 lines - orchestration)
    ├── QuickDateFilters.vue (80 lines)
    ├── BasicFilters.vue (120 lines)  
    ├── AdvancedFilters.vue (150 lines)
    ├── ActiveFiltersSummary.vue (60 lines)
    └── FilterStatistics.vue (80 lines)

Composables:
├── useExpenseFilters.ts (existing, enhanced)
└── useExpenseFormatters.ts (new, extracted utilities)
```

### shadcn/ui Improvements:
- ToggleGroup instead of manual Button states
- Better form component usage
- Consistent spacing and styling

### VueUse Integration:
- useDebounceFn for performance
- useToggle for state management
- useVModel for reactive binding
-->
<template>
  <!-- 
    Refactored ExpenseDataTable using component composition
    Following Simple over Easy principle with clear separation of concerns
    
    BEFORE: 542 lines with mixed responsibilities
    AFTER: Clean delegation to specialized components and composables
  -->
  <ExpenseDataTableContainer
    :expenses="expenses"
    :loading="loading"
    :sort-by="sortBy"
    :sort-order="sortOrder"
    :selected-ids="selectedIds"
    :page-size="pageSize"
    :current-page="currentPage"
    :total-items="totalItems"
    @sort-change="emit('sortChange', $event)"
    @selection-change="emit('selectionChange', $event)"
    @row-click="emit('rowClick', $event)"
    @edit="emit('edit', $event)"
    @view="emit('view', $event)"
    @delete="emit('delete', $event)"
    @duplicate="emit('duplicate', $event)"
    @bulk-edit="emit('bulkEdit', $event)"
    @bulk-delete="emit('bulkDelete', $event)"
    @create-expense="emit('createExpense')"
  />
</template>

<script setup lang="ts">
import type { IExpense } from '~/types/expense'
import ExpenseDataTableContainer from './table/ExpenseDataTableContainer.vue'

interface Props {
  expenses: IExpense[]
  loading?: boolean
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  selectedIds?: string[]
  pageSize?: number
  currentPage?: number
  totalItems?: number
}

interface Emits {
  'sortChange': [{ sortBy: string; sortOrder: 'ASC' | 'DESC' }]
  'selectionChange': [string[]]
  'rowClick': [IExpense]
  'edit': [IExpense]
  'view': [IExpense]
  'delete': [IExpense]
  'duplicate': [IExpense]
  'bulkEdit': [IExpense[]]
  'bulkDelete': [IExpense[]]
  'createExpense': []
}

const _props = withDefaults(defineProps<Props>(), {
  loading: false,
  sortBy: 'date',
  sortOrder: 'DESC',
  selectedIds: () => [],
  pageSize: 20,
  currentPage: 1,
  totalItems: 0
})

const emit = defineEmits<Emits>()
</script>

<!--
## Architecture Benefits

### Before (542 lines):
- Single monolithic component
- Mixed UI/logic responsibilities
- Hardcoded formatting functions
- Inline column management
- Direct state manipulation
- No composable extraction

### After (70 lines + composables):
- Clear component hierarchy
- Separated concerns (UI vs Logic)
- Reusable composables with VueUse integration
- Dumb UI components
- Centralized configuration
- Type-safe state management

### Component Structure:
```
ExpenseDataTable.vue (70 lines - interface only)
└── ExpenseDataTableContainer.vue (180 lines - orchestration)
    ├── ExpenseTableToolbar.vue (80 lines)
    ├── ExpenseTableHeader.vue (70 lines)
    ├── ExpenseTableRow.vue (150 lines)
    └── ExpenseTableEmpty.vue (40 lines)

Composables:
├── useTableSelection.ts (selection state management)
├── useTableSorting.ts (sorting logic)
├── useTableColumns.ts (column visibility)
└── useExpenseFormatters.ts (formatting utilities)

Configuration:
└── expenseTableConfig.ts (centralized settings)
```

### Technology Improvements:
- **VueUse Integration**: useLocalStorage, useVModel, useToggle
- **Zod Validation**: Type-safe configuration and state
- **shadcn/ui**: Consistent table components
- **Simple over Easy**: Explicit state modeling

### Performance Benefits:
- Component-level optimization
- Reduced bundle size through tree-shaking
- Better caching of composable logic
- Cleaner re-render boundaries
-->
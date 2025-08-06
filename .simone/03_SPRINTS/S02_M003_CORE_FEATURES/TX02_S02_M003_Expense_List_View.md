---
task_id: T02_S02_M003_Expense_List_View
status: completed
priority: Medium
dependencies: T01_S01_M003_TypeScript_Interfaces, T09_S01_Expense_Tracking_UI
sprint: S02_M003_CORE_FEATURES
updated: 2025-08-05 04:19
completed: 2025-08-04 12:00
estimated_hours: 6
actual_hours: 6
assigned_to: Claude
completion_notes: |
  Task implementation completed with comprehensive expense list functionality
---

# T02_S02_M003 - Expense List View with Filtering and Pagination

## Task Overview
**Duration**: 6 hours  
**Priority**: Medium  
**Dependencies**: T01_S01_M003_TypeScript_Interfaces, T09_S01_Expense_Tracking_UI  
**Sprint**: S02_M003_CORE_FEATURES  

## Objective
Implement comprehensive expense list view with advanced filtering, sorting, pagination, and table management capabilities optimized for legal practice expense management workflows. Focus on data table implementation with performance optimizations and seamless user experience.

## Background
This task builds upon the basic expense tracking UI (T09_S01) to create a robust, feature-rich expense list interface. Legal professionals need to efficiently browse, filter, and analyze expense data across different time periods, categories, and cases. The implementation should handle large datasets gracefully while providing intuitive filtering and sorting capabilities.

## Technical Requirements

### 1. Enhanced Data Table Implementation
Comprehensive expense table with advanced functionality:

**Location**: `components/expenses/ExpenseDataTable.vue`

**Core Features**:
- Sortable columns (date, category, description, amount, balance)
- Selectable rows for bulk operations
- Column visibility toggle
- Responsive design with mobile-optimized view
- Virtual scrolling for large datasets
- Loading skeleton states
- Empty state with call-to-action

**Codebase Research Findings**:
- Existing shadcn-vue table components in `/frontend/app/components/ui/table/`
- Table structure uses `Table.vue`, `TableHeader.vue`, `TableBody.vue`, `TableRow.vue`, `TableCell.vue`
- Current expense types defined in `/frontend/app/types/expense/expense.ts`
- Existing filter patterns in `/frontend/app/composables/useFilters.ts`

### 2. Advanced Filtering System
Comprehensive filtering interface for expense data:

**Location**: `components/expenses/ExpenseFilters.vue`

**Filter Components**:
- Date range picker with presets (今月, 前月, 今四半期, 今年)
- Category multi-select dropdown
- Amount range filter (minimum/maximum)
- Case association filter
- Tag-based filtering
- Full-text search across description and memo
- Quick filter buttons for common scenarios

**Filter Patterns From Research**:
- Follow `/frontend/app/components/cases/filters/KanbanFilters.vue` structure
- Use collapsible advanced filters pattern
- Implement active filters summary display
- Support filter history with undo/redo capability

### 3. Pagination and Performance
Efficient data handling for large expense lists:

**Features**:
- Server-side pagination with configurable page sizes
- Virtual scrolling for client-side performance
- Infinite scroll option for mobile
- Jump-to-page functionality
- Total count and page information display
- URL query parameter synchronization

**Performance Considerations**:
- Debounced filter inputs (300ms)
- Optimistic updates for sorting
- Skeleton loading states
- Error boundary for graceful failure handling

### 4. Bulk Operations Interface
Multi-select functionality for expense management:

**Operations**:
- Bulk tag assignment/removal
- Bulk category updates
- Bulk deletion with confirmation
- Export selected expenses to CSV
- Bulk archive/unarchive functionality

## Implementation Guidance

### Data Table Component Structure
Advanced table with filtering and sorting:

```vue
<!-- components/expenses/ExpenseDataTable.vue -->
<template>
  <div class="expense-data-table">
    <!-- Table Toolbar -->
    <div class="table-toolbar flex justify-between items-center mb-4">
      <div class="table-actions flex items-center gap-2">
        <Button 
          v-if="selectedExpenses.length > 0"
          variant="outline" 
          size="sm"
          @click="handleBulkEdit"
        >
          <Icon name="lucide:edit" class="w-4 h-4 mr-2" />
          編集 ({{ selectedExpenses.length }})
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm">
              <Icon name="lucide:columns" class="w-4 h-4 mr-2" />
              表示列
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem
              v-for="column in columns"
              :key="column.key"
              :checked="column.visible"
              @update:checked="toggleColumn(column.key)"
            >
              {{ column.label }}
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div class="table-meta text-sm text-muted-foreground">
        {{ paginationInfo }}
      </div>
    </div>

    <!-- Main Table -->
    <div class="table-container border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-12">
              <Checkbox
                :checked="isAllSelected"
                :indeterminate="isPartiallySelected"
                @update:checked="toggleSelectAll"
              />
            </TableHead>
            <TableHead
              v-for="column in visibleColumns"
              :key="column.key"
              :class="getSortableHeaderClass(column)"
              @click="handleSort(column.key)"
            >
              <div class="flex items-center gap-2">
                {{ column.label }}
                <Icon
                  v-if="column.sortable && sortBy === column.key"
                  :name="sortOrder === 'ASC' ? 'lucide:chevron-up' : 'lucide:chevron-down'"
                  class="w-4 h-4"
                />
              </div>
            </TableHead>
            <TableHead class="w-20">操作</TableHead>
          </TableRow>
        </TableHeader>
        
        <TableBody>
          <!-- Loading Skeleton -->
          <template v-if="loading">
            <TableRow v-for="i in pageSize" :key="`skeleton-${i}`">
              <TableCell v-for="j in visibleColumns.length + 2" :key="j">
                <Skeleton class="h-4 w-full" />
              </TableCell>
            </TableRow>
          </template>
          
          <!-- Empty State -->
          <TableRow v-else-if="expenses.length === 0">
            <TableCell :colspan="visibleColumns.length + 2" class="text-center py-12">
              <div class="empty-state">
                <Icon name="lucide:receipt" class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 class="text-lg font-medium mb-2">{{ $t('expense.list.empty.title') }}</h3>
                <p class="text-muted-foreground mb-4">
                  {{ $t('expense.list.empty.description') }}
                </p>
                <Button @click="$emit('create-expense')">
                  <Icon name="lucide:plus" class="w-4 h-4 mr-2" />
                  {{ $t('expense.actions.create') }}
                </Button>
              </div>
            </TableCell>
          </TableRow>
          
          <!-- Expense Rows -->
          <TableRow
            v-for="expense in expenses"
            :key="expense.id"
            :class="getRowClass(expense)"
            @click="handleRowClick(expense)"
          >
            <TableCell>
              <Checkbox
                :checked="isSelected(expense.id)"
                @update:checked="toggleSelection(expense.id)"
                @click.stop
              />
            </TableCell>
            <TableCell v-if="isColumnVisible('date')">
              {{ formatDate(expense.date) }}
            </TableCell>
            <TableCell v-if="isColumnVisible('category')">
              <Badge variant="outline">
                {{ expense.category }}
              </Badge>
            </TableCell>
            <TableCell v-if="isColumnVisible('description')" class="max-w-xs">
              <div class="truncate" :title="expense.description">
                {{ expense.description }}
              </div>
            </TableCell>
            <TableCell v-if="isColumnVisible('amount')" class="text-right">
              <div class="expense-amounts">
                <div v-if="expense.incomeAmount > 0" class="text-green-600">
                  +{{ formatCurrency(expense.incomeAmount) }}
                </div>
                <div v-if="expense.expenseAmount > 0" class="text-red-600">
                  -{{ formatCurrency(expense.expenseAmount) }}
                </div>
              </div>
            </TableCell>
            <TableCell v-if="isColumnVisible('balance')" class="text-right font-mono">
              <span :class="getBalanceClass(expense.balance)">
                {{ formatCurrency(expense.balance) }}
              </span>
            </TableCell>
            <TableCell v-if="isColumnVisible('tags')">
              <div class="flex gap-1">
                <Badge
                  v-for="tag in expense.tags.slice(0, 2)"
                  :key="tag.id"
                  variant="secondary"
                  class="text-xs"
                >
                  {{ tag.name }}
                </Badge>
                <Badge
                  v-if="expense.tags.length > 2"
                  variant="outline"
                  class="text-xs"
                >
                  +{{ expense.tags.length - 2 }}
                </Badge>
              </div>
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="sm" @click.stop>
                    <Icon name="lucide:more-horizontal" class="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click="handleEdit(expense)">
                    <Icon name="lucide:edit" class="w-4 h-4 mr-2" />
                    編集
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="handleView(expense)">
                    <Icon name="lucide:eye" class="w-4 h-4 mr-2" />
                    詳細
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    class="text-destructive"
                    @click="handleDelete(expense)"
                  >
                    <Icon name="lucide:trash" class="w-4 h-4 mr-2" />
                    削除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Pagination -->
    <div class="pagination-container mt-4">
      <ExpensePagination
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-items="totalItems"
        :page-size="pageSize"
        :page-size-options="pageSizeOptions"
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      />
    </div>
  </div>
</template>
```

### Advanced Filter Component
Comprehensive filtering with performance optimizations:

```vue
<!-- components/expenses/ExpenseFilters.vue -->
<template>
  <Card class="expense-filters">
    <CardHeader>
      <div class="filter-header flex justify-between items-center">
        <CardTitle class="flex items-center gap-2">
          <Icon name="lucide:filter" class="w-5 h-5" />
          フィルター
        </CardTitle>
        <div class="filter-actions flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            :disabled="!hasActiveFilters"
            @click="resetFilters"
          >
            <Icon name="lucide:x" class="w-4 h-4 mr-1" />
            クリア
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
            詳細
          </Button>
        </div>
      </div>
    </CardHeader>
    
    <CardContent>
      <!-- Quick Filters -->
      <div class="quick-filters mb-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button
            v-for="preset in datePresets"
            :key="preset.key"
            variant="outline"
            size="sm"
            :class="{ 'bg-primary text-primary-foreground': isPresetActive(preset) }"
            @click="applyDatePreset(preset)"
          >
            {{ preset.label }}
          </Button>
        </div>
      </div>

      <!-- Basic Filters -->
      <div class="basic-filters grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="date-range">
          <Label>期間</Label>
          <DateRangePicker
            v-model="localFilters.dateRange"
            :presets="datePresets"
            @change="debouncedApply"
          />
        </div>
        
        <div class="category-filter">
          <Label>カテゴリ</Label>
          <Select
            v-model="localFilters.category"
            @change="debouncedApply"
          >
            <SelectTrigger>
              <SelectValue placeholder="カテゴリを選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">すべて</SelectItem>
              <SelectItem
                v-for="category in availableCategories"
                :key="category"
                :value="category"
              >
                {{ category }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div class="search-filter">
          <Label>検索</Label>
          <div class="relative">
            <Input
              v-model="localFilters.searchQuery"
              placeholder="説明やメモを検索..."
              @input="debouncedApply"
            />
            <Icon
              name="lucide:search"
              class="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground"
            />
          </div>
        </div>
      </div>

      <!-- Advanced Filters -->
      <Collapsible v-model:open="showAdvanced">
        <CollapsibleContent>
          <div class="advanced-filters border-t pt-4 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="amount-range">
                <Label>金額範囲</Label>
                <div class="flex gap-2 items-center">
                  <Input
                    v-model="localFilters.minAmount"
                    type="number"
                    placeholder="最小額"
                    @input="debouncedApply"
                  />
                  <span class="text-muted-foreground">〜</span>
                  <Input
                    v-model="localFilters.maxAmount"
                    type="number"
                    placeholder="最大額"
                    @input="debouncedApply"
                  />
                </div>
              </div>
              
              <div class="case-filter">
                <Label>案件</Label>
                <Select
                  v-model="localFilters.caseId"
                  @change="debouncedApply"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="案件を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">すべて</SelectItem>
                    <SelectItem
                      v-for="case_ in availableCases"
                      :key="case_.id"
                      :value="case_.id"
                    >
                      {{ case_.title }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div class="tag-filter">
              <Label>タグ</Label>
              <TagSelector
                v-model="localFilters.tagIds"
                :available-tags="availableTags"
                @change="debouncedApply"
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <!-- Active Filters Summary -->
      <div v-if="hasActiveFilters" class="active-filters mt-4 pt-4 border-t">
        <div class="flex flex-wrap gap-2">
          <Badge
            v-for="filter in activeFilterSummary"
            :key="filter.key"
            variant="secondary"
            class="flex items-center gap-1"
          >
            {{ filter.label }}
            <Button
              variant="ghost"
              size="xs"
              @click="clearFilter(filter.key)"
            >
              <Icon name="lucide:x" class="w-3 h-3" />
            </Button>
          </Badge>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
```

### Filter Composable Enhancement
Enhanced filtering with expense-specific features:

```typescript
// composables/useExpenseFilters.ts
import { ref, computed, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import type { IExpenseFilter, IExpense } from '~/types/expense'

export function useExpenseFilters(
  initialFilters: IExpenseFilter = {},
  options: {
    debounceMs?: number
    onFiltersChange?: (filters: IExpenseFilter) => void
    enableUrlSync?: boolean
  } = {}
) {
  const { debounceMs = 300, onFiltersChange, enableUrlSync = true } = options
  
  const filters = ref<IExpenseFilter>({ ...initialFilters })
  const isLoading = ref(false)
  
  // URL synchronization
  const route = useRoute()
  const router = useRouter()
  
  // Computed properties
  const hasActiveFilters = computed(() => {
    return !!(
      filters.value.startDate ||
      filters.value.endDate ||
      filters.value.category ||
      filters.value.caseId ||
      filters.value.tagIds?.length ||
      filters.value.searchQuery ||
      filters.value.minAmount ||
      filters.value.maxAmount
    )
  })
  
  const activeFilterSummary = computed(() => {
    const summary = []
    if (filters.value.startDate && filters.value.endDate) {
      summary.push({
        key: 'dateRange',
        label: `${formatDate(filters.value.startDate)} - ${formatDate(filters.value.endDate)}`
      })
    }
    if (filters.value.category) {
      summary.push({
        key: 'category',
        label: `カテゴリ: ${filters.value.category}`
      })
    }
    if (filters.value.searchQuery) {
      summary.push({
        key: 'searchQuery',
        label: `検索: "${filters.value.searchQuery}"`
      })
    }
    // Add more filter summaries...
    return summary
  })
  
  // Debounced filter application
  const debouncedApply = useDebounceFn(() => {
    if (onFiltersChange) {
      onFiltersChange(filters.value)
    }
    
    if (enableUrlSync) {
      syncFiltersToUrl()
    }
  }, debounceMs)
  
  // URL synchronization
  const syncFiltersToUrl = () => {
    const query = Object.entries(filters.value).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value) && value.length > 0) {
          acc[key] = value
        } else if (!Array.isArray(value)) {
          acc[key] = String(value)
        }
      }
      return acc
    }, {} as Record<string, any>)
    
    router.push({ query })
  }
  
  // Date presets
  const datePresets = [
    {
      key: 'thisMonth',
      label: '今月',
      getValue: () => {
        const now = new Date()
        return {
          startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
          endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
        }
      }
    },
    {
      key: 'lastMonth',
      label: '前月',
      getValue: () => {
        const now = new Date()
        return {
          startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0],
          endDate: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
        }
      }
    },
    {
      key: 'thisQuarter',
      label: '今四半期',
      getValue: () => {
        const now = new Date()
        const quarter = Math.floor(now.getMonth() / 3)
        return {
          startDate: new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0],
          endDate: new Date(now.getFullYear(), quarter * 3 + 3, 0).toISOString().split('T')[0]
        }
      }
    },
    {
      key: 'thisYear',
      label: '今年',
      getValue: () => {
        const now = new Date()
        return {
          startDate: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0],
          endDate: new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0]
        }
      }
    }
  ]
  
  // Filter manipulation methods
  const applyDatePreset = (preset: typeof datePresets[0]) => {
    const range = preset.getValue()
    filters.value.startDate = range.startDate
    filters.value.endDate = range.endDate
    debouncedApply()
  }
  
  const clearFilter = (filterKey: keyof IExpenseFilter) => {
    switch (filterKey) {
      case 'dateRange':
        filters.value.startDate = undefined
        filters.value.endDate = undefined
        break
      case 'searchQuery':
        filters.value.searchQuery = undefined
        break
      case 'category':
        filters.value.category = undefined
        break
      case 'caseId':
        filters.value.caseId = undefined
        break
      case 'tagIds':
        filters.value.tagIds = undefined
        break
      default:
        delete filters.value[filterKey]
    }
    debouncedApply()
  }
  
  const resetFilters = () => {
    filters.value = {}
    debouncedApply()
  }
  
  // Watch for URL changes
  if (enableUrlSync) {
    watch(() => route.query, (newQuery) => {
      filters.value = {
        startDate: newQuery.startDate as string,
        endDate: newQuery.endDate as string,
        category: newQuery.category as string,
        caseId: newQuery.caseId as string,
        tagIds: Array.isArray(newQuery.tagIds) 
          ? newQuery.tagIds as string[]
          : newQuery.tagIds 
            ? [newQuery.tagIds as string]
            : undefined,
        searchQuery: newQuery.searchQuery as string,
        sortBy: newQuery.sortBy as any,
        sortOrder: newQuery.sortOrder as any
      }
    }, { immediate: true })
  }
  
  return {
    filters: readonly(filters),
    hasActiveFilters,
    activeFilterSummary,
    datePresets,
    isLoading: readonly(isLoading),
    
    // Methods
    applyDatePreset,
    clearFilter,
    resetFilters,
    debouncedApply
  }
}
```

### Virtual Scrolling Implementation
Performance optimization for large datasets:

```vue
<!-- components/expenses/VirtualExpenseList.vue -->
<template>
  <div class="virtual-expense-list" ref="containerRef">
    <RecycleScroller
      v-slot="{ item }"
      :items="expenses"
      :item-size="estimatedItemSize"
      key-field="id"
      :buffer="buffer"
      class="scroller"
    >
      <ExpenseListItem
        :expense="item"
        :selected="isSelected(item.id)"
        @select="toggleSelection"
        @edit="handleEdit"
        @view="handleView"
        @delete="handleDelete"
      />
    </RecycleScroller>
  </div>
</template>

<script setup lang="ts">
import { RecycleScroller } from 'vue-virtual-scroller'
import type { IExpense } from '~/types/expense'

interface Props {
  expenses: IExpense[]
  selectedIds: string[]
  estimatedItemSize?: number
  buffer?: number
}

const props = withDefaults(defineProps<Props>(), {
  estimatedItemSize: 80,
  buffer: 10
})

// Component logic...
</script>
```

## Integration with Mock Data Service

### Enhanced Mock Service
Extended mock service with filtering and pagination:

```typescript
// services/mockExpenseService.ts
export class MockExpenseService {
  async getExpenses(filter: IExpenseFilter = {}, pagination: IPagination = { offset: 0, limit: 20 }): Promise<IExpenseList> {
    // Apply filters
    let filteredExpenses = this.mockExpenses.filter(expense => {
      if (filter.startDate && expense.date < filter.startDate) return false
      if (filter.endDate && expense.date > filter.endDate) return false
      if (filter.category && expense.category !== filter.category) return false
      if (filter.caseId && expense.caseId !== filter.caseId) return false
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase()
        if (!expense.description.toLowerCase().includes(query) && 
            !expense.memo?.toLowerCase().includes(query)) {
          return false
        }
      }
      return true
    })
    
    // Apply sorting
    if (filter.sortBy) {
      filteredExpenses.sort((a, b) => {
        const aVal = a[filter.sortBy!]
        const bVal = b[filter.sortBy!]
        const order = filter.sortOrder === 'DESC' ? -1 : 1
        return aVal < bVal ? -order : aVal > bVal ? order : 0
      })
    }
    
    // Apply pagination
    const total = filteredExpenses.length
    const items = filteredExpenses.slice(pagination.offset, pagination.offset + pagination.limit)
    
    return {
      items,
      total,
      offset: pagination.offset,
      limit: pagination.limit,
      hasMore: pagination.offset + pagination.limit < total
    }
  }
}
```

## Definition of Done

### Functionality Requirements
- [ ] Data table displays expenses with sortable columns
- [ ] Filtering works for all specified criteria (date, category, amount, search)
- [ ] Pagination handles large datasets efficiently
- [ ] Column visibility can be toggled
- [ ] Bulk selection and operations function correctly
- [ ] Virtual scrolling improves performance for 1000+ items
- [ ] URL query parameters sync with filter state
- [ ] Loading states display during data operations
- [ ] Empty states provide helpful guidance
- [ ] Error handling manages API failures gracefully

### Technical Requirements
- [ ] TypeScript interfaces match backend API specifications
- [ ] Component follows shadcn-vue patterns and styling
- [ ] Filter debouncing prevents excessive API calls
- [ ] Composables provide reusable filtering logic
- [ ] Responsive design works on mobile devices
- [ ] Accessibility standards met (ARIA labels, keyboard navigation)
- [ ] Unit tests cover critical filtering and pagination logic
- [ ] Performance benchmarks meet targets (< 100ms filter response)

### Integration Requirements
- [ ] Mock data service provides realistic test data
- [ ] Components integrate with existing expense routing
- [ ] Filter state persists during navigation
- [ ] Breadcrumb navigation updates correctly
- [ ] Export functionality generates proper CSV format
- [ ] Bulk operations confirm before execution

## Notes

This task significantly enhances the basic expense list from T09_S01 by adding comprehensive filtering, advanced table features, and performance optimizations. The implementation should follow the established patterns from the case management filters while adapting them for expense-specific requirements.

Key considerations:
- Use the existing shadcn-vue table components as the foundation
- Follow the filter patterns established in `useFilters.ts` composable
- Implement virtual scrolling for datasets over 100 items
- Ensure URL synchronization for shareable filtered views
- Maintain responsive design for mobile users
- Provide comprehensive empty and loading states

The virtual scrolling and advanced filtering features will set the foundation for handling large expense datasets that legal firms typically accumulate over time.
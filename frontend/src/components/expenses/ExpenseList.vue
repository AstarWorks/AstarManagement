<!--
  Expense List Component
  
  @description Comprehensive expense list with filtering, sorting, pagination,
  and bulk operations. Supports both card and table view modes.
  
  @author Claude
  @created 2025-07-03
  @task T01_S14 - Expense Entry Form
-->

<template>
  <div class="expense-list">
    <!-- Header with Actions -->
    <div class="list-header">
      <div class="header-left">
        <h2 class="list-title">Expenses</h2>
        <div class="stats-summary" v-if="summary">
          <Badge variant="outline">
            Total: {{ formatCurrency(summary.totalAmount, 'JPY') }}
          </Badge>
          <Badge variant="secondary">
            Pending: {{ formatCurrency(summary.pendingAmount, 'JPY') }}
          </Badge>
          <Badge variant="default">
            Approved: {{ formatCurrency(summary.approvedAmount, 'JPY') }}
          </Badge>
        </div>
      </div>
      
      <div class="header-actions">
        <!-- View Mode Toggle -->
        <div class="view-toggle">
          <Button
            variant="ghost"
            size="sm"
            :class="{ 'bg-muted': viewMode === 'cards' }"
            @click="viewMode = 'cards'"
          >
            <Icon name="Grid3X3" class="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            :class="{ 'bg-muted': viewMode === 'table' }"
            @click="viewMode = 'table'"
          >
            <Icon name="List" class="w-4 h-4" />
          </Button>
        </div>

        <!-- Bulk Actions -->
        <div v-if="hasSelection" class="bulk-actions">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Icon name="CheckSquare" class="w-4 h-4 mr-2" />
                {{ selectedCount }} selected
                <Icon name="ChevronDown" class="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @click="handleBulkApprove">
                <Icon name="Check" class="w-4 h-4 mr-2" />
                Approve Selected
              </DropdownMenuItem>
              <DropdownMenuItem @click="handleBulkReject">
                <Icon name="X" class="w-4 h-4 mr-2" />
                Reject Selected
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="handleBulkExport">
                <Icon name="Download" class="w-4 h-4 mr-2" />
                Export Selected
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="clearSelection">
                <Icon name="Square" class="w-4 h-4 mr-2" />
                Clear Selection
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <!-- Create Button -->
        <Button @click="$emit('create')" v-if="canCreate">
          <Icon name="Plus" class="w-4 h-4 mr-2" />
          New Expense
        </Button>
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="filters-section">
      <ExpenseFilters
        :filters="filters"
        :loading="isLoading"
        @update:filters="updateFilters"
        @reset="resetFilters"
      />
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && !expenses.length" class="loading-state">
      <div class="flex items-center justify-center py-12">
        <Icon name="Loader2" class="w-6 h-6 animate-spin mr-2" />
        <span>Loading expenses...</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!expenses.length" class="empty-state">
      <div class="text-center py-12">
        <Icon name="Receipt" class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 class="text-lg font-semibold mb-2">No expenses found</h3>
        <p class="text-muted-foreground mb-4">
          {{ hasActiveFilters ? 'Try adjusting your filters' : 'Get started by creating your first expense' }}
        </p>
        <Button v-if="!hasActiveFilters && canCreate" @click="$emit('create')">
          <Icon name="Plus" class="w-4 h-4 mr-2" />
          Create First Expense
        </Button>
        <Button v-else-if="hasActiveFilters" variant="outline" @click="resetFilters">
          <Icon name="X" class="w-4 h-4 mr-2" />
          Clear Filters
        </Button>
      </div>
    </div>

    <!-- Cards View -->
    <div v-else-if="viewMode === 'cards'" class="expenses-grid">
      <div 
        v-for="expense in expenses" 
        :key="expense.id"
        class="expense-item"
        @click="toggleSelection(expense.id)"
      >
        <div class="selection-overlay" v-if="selectedIds.has(expense.id)">
          <Icon name="Check" class="w-5 h-5 text-primary-foreground" />
        </div>
        
        <ExpenseCard
          :expense="expense"
          :can-edit="canEdit(expense)"
          :can-approve="canApprove(expense)"
          :can-reject="canReject(expense)"
          :can-delete="canDelete(expense)"
          :highlighted="selectedIds.has(expense.id)"
          @view="handleView"
          @edit="handleEdit"
          @approve="handleApprove"
          @reject="handleReject"
          @delete="handleDelete"
          @view-receipt="handleViewReceipt"
        />
      </div>
    </div>

    <!-- Table View -->
    <div v-else class="expenses-table">
      <ExpenseTable
        :expenses="expenses"
        :loading="isLoading"
        :selected-ids="selectedIds"
        :can-edit="canEdit"
        :can-approve="canApprove"
        :can-reject="canReject"
        :can-delete="canDelete"
        @select="toggleSelection"
        @select-all="toggleSelectAll"
        @view="handleView"
        @edit="handleEdit"
        @approve="handleApprove"
        @reject="handleReject"
        @delete="handleDelete"
        @sort="handleSort"
      />
    </div>

    <!-- Pagination -->
    <div v-if="pagination && pagination.pages > 1" class="pagination-section">
      <div class="pagination-info">
        Showing {{ (pagination.page - 1) * pagination.limit + 1 }} to 
        {{ Math.min(pagination.page * pagination.limit, pagination.total) }} of 
        {{ pagination.total }} expenses
      </div>
      <div class="pagination-controls">
        <Button
          variant="outline"
          size="sm"
          :disabled="pagination.page <= 1"
          @click="goToPage(pagination.page - 1)"
        >
          <Icon name="ChevronLeft" class="w-4 h-4" />
          Previous
        </Button>
        
        <div class="page-numbers">
          <Button
            v-for="page in visiblePages"
            :key="page"
            variant="ghost"
            size="sm"
            :class="{ 'bg-primary text-primary-foreground': page === pagination.page }"
            @click="goToPage(page)"
          >
            {{ page }}
          </Button>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          :disabled="pagination.page >= pagination.pages"
          @click="goToPage(pagination.page + 1)"
        >
          Next
          <Icon name="ChevronRight" class="w-4 h-4" />
        </Button>
      </div>
    </div>

    <!-- Bulk Approval Modal -->
    <BulkApprovalModal
      v-if="showBulkModal"
      :expenses="selectedExpenses"
      :action="bulkAction"
      @confirm="handleBulkConfirm"
      @cancel="showBulkModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useExpenses } from '~/composables/useExpenses'
import { useAuthStore } from '~/stores/auth'
import { formatCurrency } from '~/utils/currencyFormatters'
import type { 
  Expense, 
  ExpenseFilters, 
  ExpenseListParams 
} from '~/types/expense'
import ExpenseCard from './ExpenseCard.vue'
import ExpenseTable from './ExpenseTable.vue'
import ExpenseFilters from './ExpenseFilters.vue'
import BulkApprovalModal from './BulkApprovalModal.vue'

// Component Props
interface Props {
  /** Initial filters */
  initialFilters?: ExpenseFilters
  /** Can create new expenses */
  canCreate?: boolean
  /** Matter ID filter */
  matterId?: string
  /** Show only user's expenses */
  showOwnOnly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canCreate: true,
  showOwnOnly: false
})

// Component Emits
const emit = defineEmits<{
  create: []
  view: [expenseId: string]
  edit: [expenseId: string]
  delete: [expenseId: string]
}>()

// Composables
const authStore = useAuthStore()

// Local State
const viewMode = ref<'cards' | 'table'>('cards')
const selectedIds = ref<Set<string>>(new Set())
const showBulkModal = ref(false)
const bulkAction = ref<'approve' | 'reject'>('approve')

const filters = ref<ExpenseFilters>({
  ...props.initialFilters,
  matterId: props.matterId
})

const pagination = ref({
  page: 1,
  limit: 20
})

const sortOptions = ref({
  sortBy: 'createdAt' as keyof Expense,
  sortOrder: 'desc' as 'asc' | 'desc'
})

// Query Parameters
const queryParams = computed<ExpenseListParams>(() => ({
  ...filters.value,
  ...pagination.value,
  ...sortOptions.value
}))

// Data Fetching
const {
  expenses,
  pagination: paginationData,
  summary,
  isLoading,
  refetch
} = useExpenses(queryParams)

// Computed Properties
const hasActiveFilters = computed(() => {
  return Object.values(filters.value).some(value => 
    value !== undefined && value !== null && value !== ''
  )
})

const selectedCount = computed(() => selectedIds.value.size)

const hasSelection = computed(() => selectedCount.value > 0)

const selectedExpenses = computed(() =>
  expenses.value.filter(expense => selectedIds.value.has(expense.id))
)

const visiblePages = computed(() => {
  if (!paginationData.value) return []
  
  const { page, pages } = paginationData.value
  const delta = 2
  const start = Math.max(1, page - delta)
  const end = Math.min(pages, page + delta)
  
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

// Permission Helpers
const canEdit = (expense: Expense) => {
  const user = authStore.user
  if (!user) return false
  
  // Users can edit their own pending expenses
  if (expense.createdBy === user.id && expense.approvalStatus === 'PENDING') {
    return true
  }
  
  // Lawyers can edit any pending expense
  return user.role === 'LAWYER' && expense.approvalStatus === 'PENDING'
}

const canApprove = (expense: Expense) => {
  const user = authStore.user
  if (!user || expense.approvalStatus !== 'PENDING') return false
  
  // Can't approve own expenses
  if (expense.createdBy === user.id) return false
  
  // Role-based approval rules
  if (user.role === 'LAWYER') return true
  if (user.role === 'CLERK' && expense.amount <= 10000) return true
  
  return false
}

const canReject = (expense: Expense) => {
  return canApprove(expense) // Same rules as approval
}

const canDelete = (expense: Expense) => {
  const user = authStore.user
  if (!user) return false
  
  // Users can delete their own pending expenses
  if (expense.createdBy === user.id && expense.approvalStatus === 'PENDING') {
    return true
  }
  
  // Lawyers can delete any pending expense
  return user.role === 'LAWYER' && expense.approvalStatus === 'PENDING'
}

// Event Handlers
const updateFilters = (newFilters: ExpenseFilters) => {
  filters.value = newFilters
  pagination.value.page = 1 // Reset to first page
}

const resetFilters = () => {
  filters.value = {
    status: undefined,
    expenseType: undefined,
    billable: undefined,
    billed: undefined,
    matterId: props.matterId,
    dateRange: undefined,
    amountRange: undefined,
    searchQuery: ''
  }
  pagination.value.page = 1
}

const toggleSelection = (expenseId: string) => {
  if (selectedIds.value.has(expenseId)) {
    selectedIds.value.delete(expenseId)
  } else {
    selectedIds.value.add(expenseId)
  }
}

const toggleSelectAll = () => {
  if (selectedIds.value.size === expenses.value.length) {
    selectedIds.value.clear()
  } else {
    expenses.value.forEach(expense => selectedIds.value.add(expense.id))
  }
}

const clearSelection = () => {
  selectedIds.value.clear()
}

const goToPage = (page: number) => {
  pagination.value.page = page
}

const handleSort = (column: keyof Expense, direction: 'asc' | 'desc') => {
  sortOptions.value.sortBy = column
  sortOptions.value.sortOrder = direction
}

const handleView = (expenseId: string) => {
  emit('view', expenseId)
}

const handleEdit = (expenseId: string) => {
  emit('edit', expenseId)
}

const handleApprove = async (expenseId: string) => {
  // This would typically open an approval modal
  // For now, just emit the event
  console.log('Approve expense:', expenseId)
}

const handleReject = async (expenseId: string) => {
  // This would typically open a rejection modal
  console.log('Reject expense:', expenseId)
}

const handleDelete = (expenseId: string) => {
  emit('delete', expenseId)
}

const handleViewReceipt = (expenseId: string) => {
  // Open receipt viewer
  console.log('View receipt for expense:', expenseId)
}

const handleBulkApprove = () => {
  bulkAction.value = 'approve'
  showBulkModal.value = true
}

const handleBulkReject = () => {
  bulkAction.value = 'reject'
  showBulkModal.value = true
}

const handleBulkExport = () => {
  // Export selected expenses
  console.log('Export expenses:', Array.from(selectedIds.value))
}

const handleBulkConfirm = async (data: { action: string; reason?: string }) => {
  try {
    // Handle bulk approval/rejection
    console.log('Bulk action:', data, 'for expenses:', Array.from(selectedIds.value))
    
    // Clear selection and close modal
    clearSelection()
    showBulkModal.value = false
    
    // Refresh data
    await refetch()
  } catch (error) {
    console.error('Bulk action failed:', error)
  }
}

// Watchers
watch(queryParams, () => {
  refetch()
}, { deep: true })

// Lifecycle
onMounted(() => {
  // Load initial data
  refetch()
})
</script>

<style scoped>
.expense-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.list-header {
  display: flex;
  items-center;
  justify-content: space-between;
  gap: 1rem;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.list-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.stats-summary {
  display: flex;
  gap: 0.5rem;
}

.header-actions {
  display: flex;
  items-center;
  gap: 0.75rem;
}

.view-toggle {
  display: flex;
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  overflow: hidden;
}

.view-toggle button {
  border-radius: 0;
  border: none;
}

.filters-section {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  padding: 1rem;
}

.loading-state, .empty-state {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
}

.expenses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1rem;
}

.expense-item {
  position: relative;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.expense-item:hover {
  transform: translateY(-2px);
}

.selection-overlay {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 24px;
  height: 24px;
  background: hsl(var(--primary));
  border-radius: 50%;
  display: flex;
  items-center;
  justify-content: center;
  z-index: 10;
}

.expenses-table {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  overflow: hidden;
}

.pagination-section {
  display: flex;
  items-center;
  justify-content: between;
  gap: 1rem;
  padding: 1rem;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
}

.pagination-info {
  font-size: 0.875rem;
  color: hsl(var(--muted-foreground));
}

.pagination-controls {
  display: flex;
  items: center;
  gap: 0.5rem;
  margin-left: auto;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

@media (max-width: 768px) {
  .list-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: space-between;
  }
  
  .expenses-grid {
    grid-template-columns: 1fr;
  }
  
  .pagination-section {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .pagination-info {
    text-align: center;
  }
}
</style>
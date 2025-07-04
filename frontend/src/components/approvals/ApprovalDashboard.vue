<!--
  Approval Dashboard Component
  
  @description Comprehensive approval dashboard for managing expense approvals.
  Includes approval queue, statistics, bulk operations, and real-time updates.
  
  @author Claude
  @created 2025-07-03
  @task T07_S14 - Approval Workflow System
-->

<template>
  <div class="approval-dashboard">
    <!-- Dashboard Header -->
    <div class="dashboard-header">
      <div class="header-left">
        <h1 class="dashboard-title">Approval Queue</h1>
        <div class="header-stats" v-if="summary">
          <Badge variant="outline" class="stat-badge">
            <Icon name="Clock" class="w-3 h-3 mr-1" />
            {{ summary.totalPending }} pending
          </Badge>
          <Badge variant="destructive" class="stat-badge" v-if="summary.totalOverdue > 0">
            <Icon name="AlertTriangle" class="w-3 h-3 mr-1" />
            {{ summary.totalOverdue }} overdue
          </Badge>
          <Badge variant="default" class="stat-badge" v-if="summary.totalUrgent > 0">
            <Icon name="Zap" class="w-3 h-3 mr-1" />
            {{ summary.totalUrgent }} urgent
          </Badge>
          <Badge variant="secondary" class="stat-badge">
            <Icon name="DollarSign" class="w-3 h-3 mr-1" />
            {{ formatCurrency(summary.totalAmount, 'JPY') }}
          </Badge>
        </div>
      </div>
      
      <div class="header-actions">
        <!-- Bulk Actions -->
        <div v-if="hasSelection" class="bulk-actions">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Icon name="CheckSquare" class="w-4 h-4 mr-2" />
                {{ selectedCount }} selected
                <Icon name="ChevronDown" class="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @click="handleBulkApprove">
                <Icon name="Check" class="w-4 h-4 mr-2" />
                Bulk Approve
              </DropdownMenuItem>
              <DropdownMenuItem @click="handleBulkReject">
                <Icon name="X" class="w-4 h-4 mr-2" />
                Bulk Reject
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="handleBulkDelegate">
                <Icon name="UserCheck" class="w-4 h-4 mr-2" />
                Bulk Delegate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="clearSelection">
                <Icon name="Square" class="w-4 h-4 mr-2" />
                Clear Selection
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

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

        <!-- Refresh Button -->
        <Button variant="outline" size="sm" @click="refreshQueue" :disabled="isLoading">
          <Icon name="RefreshCw" class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
        </Button>

        <!-- Settings -->
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <Icon name="Settings" class="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="showDelegationModal = true">
              <Icon name="UserCheck" class="w-4 h-4 mr-2" />
              Manage Delegations
            </DropdownMenuItem>
            <DropdownMenuItem @click="showRulesModal = true">
              <Icon name="Settings" class="w-4 h-4 mr-2" />
              Approval Rules
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="exportQueue">
              <Icon name="Download" class="w-4 h-4 mr-2" />
              Export Queue
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="statistics-section" v-if="statistics">
      <ApprovalStatisticsCards :statistics="statistics" />
    </div>

    <!-- Filters Section -->
    <div class="filters-section">
      <ApprovalFilters
        :filters="filters"
        :loading="isLoading"
        @update:filters="updateFilters"
        @reset="resetFilters"
      />
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && !queue.length" class="loading-state">
      <div class="flex items-center justify-center py-12">
        <Icon name="Loader2" class="w-6 h-6 animate-spin mr-2" />
        <span>Loading approval queue...</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!queue.length" class="empty-state">
      <div class="text-center py-12">
        <Icon name="CheckCircle" class="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 class="text-lg font-semibold mb-2">All caught up!</h3>
        <p class="text-muted-foreground mb-4">
          {{ hasActiveFilters ? 'No approvals match your filters' : 'No pending approvals at this time' }}
        </p>
        <Button v-if="hasActiveFilters" variant="outline" @click="resetFilters">
          <Icon name="X" class="w-4 h-4 mr-2" />
          Clear Filters
        </Button>
      </div>
    </div>

    <!-- Approval Queue Content -->
    <div v-else class="queue-content">
      <!-- Priority Alerts -->
      <div v-if="urgentItems.length > 0" class="priority-alerts">
        <Alert class="border-destructive bg-destructive/10">
          <Icon name="AlertTriangle" class="h-4 w-4" />
          <AlertTitle>Urgent Attention Required</AlertTitle>
          <AlertDescription>
            {{ urgentItems.length }} expense{{ urgentItems.length === 1 ? '' : 's' }} 
            require{{ urgentItems.length === 1 ? 's' : '' }} immediate approval.
            <Button variant="link" class="p-0 h-auto" @click="showUrgentOnly">
              View urgent items
            </Button>
          </AlertDescription>
        </Alert>
      </div>

      <!-- Overdue Alerts -->
      <div v-if="overdueItems.length > 0" class="overdue-alerts">
        <Alert class="border-orange-500 bg-orange-50">
          <Icon name="Clock" class="h-4 w-4" />
          <AlertTitle>Overdue Approvals</AlertTitle>
          <AlertDescription>
            {{ overdueItems.length }} expense{{ overdueItems.length === 1 ? '' : 's' }} 
            {{ overdueItems.length === 1 ? 'is' : 'are' }} overdue for approval.
            <Button variant="link" class="p-0 h-auto" @click="showOverdueOnly">
              View overdue items
            </Button>
          </AlertDescription>
        </Alert>
      </div>

      <!-- Cards View -->
      <div v-if="viewMode === 'cards'" class="approval-cards">
        <div 
          v-for="item in queue" 
          :key="item.id"
          class="approval-card-wrapper"
          @click="toggleSelection(item.id)"
        >
          <div class="selection-overlay" v-if="selectedIds.has(item.id)">
            <Icon name="Check" class="w-5 h-5 text-primary-foreground" />
          </div>
          
          <ApprovalQueueCard
            :item="item"
            :permissions="permissions"
            :highlighted="selectedIds.has(item.id)"
            @approve="handleApprove"
            @reject="handleReject"
            @delegate="handleDelegate"
            @escalate="handleEscalate"
            @view="handleView"
          />
        </div>
      </div>

      <!-- Table View -->
      <div v-else class="approval-table">
        <ApprovalQueueTable
          :queue="queue"
          :loading="isLoading"
          :selected-ids="selectedIds"
          :permissions="permissions"
          @select="toggleSelection"
          @select-all="toggleSelectAll"
          @approve="handleApprove"
          @reject="handleReject"
          @delegate="handleDelegate"
          @escalate="handleEscalate"
          @view="handleView"
          @sort="handleSort"
        />
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="paginationData && paginationData.pages > 1" class="pagination-section">
      <ApprovalPagination
        :pagination="paginationData"
        @page-change="handlePageChange"
      />
    </div>

    <!-- Modals -->
    <ApprovalModal
      v-if="showApprovalModal"
      :expense="selectedExpense"
      :action="approvalAction"
      @confirm="handleApprovalConfirm"
      @cancel="showApprovalModal = false"
    />

    <BulkApprovalModal
      v-if="showBulkModal"
      :expenses="selectedExpenses"
      :action="bulkAction"
      @confirm="handleBulkConfirm"
      @cancel="showBulkModal = false"
    />

    <DelegationModal
      v-if="showDelegationModal"
      :expense="selectedExpense"
      :is-bulk="isBulkDelegation"
      :expenses="selectedExpenses"
      @confirm="handleDelegationConfirm"
      @cancel="showDelegationModal = false"
    />

    <ApprovalRulesModal
      v-if="showRulesModal"
      @close="showRulesModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useApprovalQueue, useApprovalWorkflow } from '~/composables/useApprovals'
import { useAuthStore } from '~/stores/auth'
import { formatCurrency } from '~/utils/currencyFormatters'
import type { 
  ApprovalQueueItem, 
  ApprovalQueueParams,
  ApprovalDecision
} from '~/types/approval'

// Composables
const authStore = useAuthStore()
const userId = computed(() => authStore.user?.id || '')

// Local State
const viewMode = ref<'cards' | 'table'>('cards')
const selectedIds = ref<Set<string>>(new Set())
const autoRefreshInterval = ref<NodeJS.Timeout>()

// Modal States
const showApprovalModal = ref(false)
const showBulkModal = ref(false)
const showDelegationModal = ref(false)
const showRulesModal = ref(false)
const approvalAction = ref<'approve' | 'reject'>('approve')
const bulkAction = ref<'approve' | 'reject'>('approve')
const isBulkDelegation = ref(false)
const selectedExpense = ref<ApprovalQueueItem | null>(null)

// Filters and Pagination
const filters = ref<Record<string, any>>({
  status: ['PENDING']
})

const pagination = ref({
  page: 1,
  limit: 20
})

const sortOptions = ref({
  sortBy: 'daysPending' as const,
  sortOrder: 'desc' as 'asc' | 'desc'
})

// Query Parameters
const queryParams = computed(() => ({
  ...filters.value,
  ...pagination.value,
  ...sortOptions.value
}))

// Data Fetching
const {
  queue,
  pagination: paginationData,
  summary,
  statistics,
  isLoading,
  approveExpense,
  bulkApproveExpenses,
  delegateApproval,
  escalateApproval,
  refetch
} = useApprovalQueue(queryParams)

const {
  permissions,
  notifications,
  unreadCount
} = useApprovalWorkflow(userId.value)

// Computed Properties
const hasActiveFilters = computed(() => {
  return Object.values(filters.value || {}).some(value => 
    value !== undefined && value !== null && value !== '' && 
    !(Array.isArray(value) && value.length === 1 && (value as string[])[0] === 'PENDING')
  )
})

const selectedCount = computed(() => selectedIds.value.size)
const hasSelection = computed(() => selectedCount.value > 0)

const selectedExpenses = computed(() =>
  queue.value.filter(item => selectedIds.value.has(item.id))
)

const urgentItems = computed(() =>
  queue.value.filter(item => item.isUrgent || item.priority === 'high')
)

const overdueItems = computed(() =>
  queue.value.filter(item => item.daysPending > 2)
)

// Event Handlers
const updateFilters = (newFilters: any) => {
  filters.value = newFilters
  pagination.value.page = 1 // Reset to first page
}

const resetFilters = () => {
  filters.value = { status: ['PENDING'] }
  pagination.value.page = 1
}

const refreshQueue = () => {
  refetch()
}

const toggleSelection = (itemId: string) => {
  if (selectedIds.value.has(itemId)) {
    selectedIds.value.delete(itemId)
  } else {
    selectedIds.value.add(itemId)
  }
}

const toggleSelectAll = () => {
  if (selectedIds.value.size === queue.value.length) {
    selectedIds.value.clear()
  } else {
    queue.value.forEach(item => selectedIds.value.add(item.id))
  }
}

const clearSelection = () => {
  selectedIds.value.clear()
}

const handlePageChange = (page: number) => {
  pagination.value.page = page
}

const handleSort = (column: string, direction: 'asc' | 'desc') => {
  sortOptions.value.sortBy = column as any
  sortOptions.value.sortOrder = direction
}

// Individual Approval Actions
const handleApprove = (item: ApprovalQueueItem) => {
  selectedExpense.value = item
  approvalAction.value = 'approve'
  showApprovalModal.value = true
}

const handleReject = (item: ApprovalQueueItem) => {
  selectedExpense.value = item
  approvalAction.value = 'reject'
  showApprovalModal.value = true
}

const handleDelegate = (item: ApprovalQueueItem) => {
  selectedExpense.value = item
  isBulkDelegation.value = false
  showDelegationModal.value = true
}

const handleEscalate = async (item: ApprovalQueueItem) => {
  try {
    await escalateApproval({
      expenseId: item.id,
      escalateTo: ['supervisor'], // This would be determined by business rules
      reason: 'Automatic escalation due to extended pending time'
    })
  } catch (error) {
    console.error('Escalation failed:', error)
  }
}

const handleView = (item: ApprovalQueueItem) => {
  // Navigate to expense detail view
  navigateTo(`/expenses/${item.id}`)
}

// Bulk Actions
const handleBulkApprove = () => {
  bulkAction.value = 'approve'
  showBulkModal.value = true
}

const handleBulkReject = () => {
  bulkAction.value = 'reject'
  showBulkModal.value = true
}

const handleBulkDelegate = () => {
  isBulkDelegation.value = true
  showDelegationModal.value = true
}

// Modal Confirmations
const handleApprovalConfirm = async (decision: ApprovalDecision) => {
  if (!selectedExpense.value) return
  
  try {
    await approveExpense({
      expenseId: selectedExpense.value.id,
      decision
    })
    
    showApprovalModal.value = false
    selectedExpense.value = null
  } catch (error) {
    console.error('Approval failed:', error)
  }
}

const handleBulkConfirm = async (data: { action: 'approve' | 'reject'; reason?: string }) => {
  try {
    await bulkApproveExpenses({
      expenseIds: Array.from(selectedIds.value),
      decision: data.action.toUpperCase() as 'APPROVED' | 'REJECTED',
      reason: data.reason
    })
    
    clearSelection()
    showBulkModal.value = false
  } catch (error) {
    console.error('Bulk approval failed:', error)
  }
}

const handleDelegationConfirm = async (data: { delegateeId: string; reason: string }) => {
  try {
    if (isBulkDelegation.value) {
      // Handle bulk delegation
      for (const expenseId of selectedIds.value) {
        await delegateApproval({
          expenseId,
          delegateeId: data.delegateeId,
          reason: data.reason
        })
      }
      clearSelection()
    } else if (selectedExpense.value) {
      await delegateApproval({
        expenseId: selectedExpense.value.id,
        delegateeId: data.delegateeId,
        reason: data.reason
      })
    }
    
    showDelegationModal.value = false
    selectedExpense.value = null
    isBulkDelegation.value = false
  } catch (error) {
    console.error('Delegation failed:', error)
  }
}

// Filter Shortcuts
const showUrgentOnly = () => {
  filters.value = {
    status: ['PENDING'],
    priority: ['high'],
    isUrgent: true
  }
}

const showOverdueOnly = () => {
  filters.value = {
    status: ['PENDING'],
    daysPendingMin: 3
  }
}

// Export
const exportQueue = () => {
  // Export current queue to CSV
  console.log('Exporting approval queue...')
}

// Auto-refresh setup
const setupAutoRefresh = () => {
  autoRefreshInterval.value = setInterval(() => {
    if (!isLoading.value) {
      refetch()
    }
  }, 30000) // Refresh every 30 seconds
}

const clearAutoRefresh = () => {
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value)
  }
}

// Watchers
watch(queryParams, () => {
  refetch()
}, { deep: true })

// Lifecycle
onMounted(() => {
  setupAutoRefresh()
})

onUnmounted(() => {
  clearAutoRefresh()
})
</script>

<style scoped>
.approval-dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem;
}

.dashboard-header {
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

.dashboard-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
}

.header-stats {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.stat-badge {
  display: flex;
  align-items: center;
}

.header-actions {
  display: flex;
  items: center;
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

.statistics-section {
  margin-bottom: 1rem;
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

.priority-alerts, .overdue-alerts {
  margin-bottom: 1rem;
}

.approval-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1rem;
}

.approval-card-wrapper {
  position: relative;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.approval-card-wrapper:hover {
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
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.approval-table {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  overflow: hidden;
}

.pagination-section {
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: space-between;
  }
  
  .approval-cards {
    grid-template-columns: 1fr;
  }
}
</style>
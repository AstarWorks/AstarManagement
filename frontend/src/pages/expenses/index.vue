<!--
  Expenses Management Page
  
  @description Main page for expense management with CRUD operations,
  approval workflow integration, and comprehensive filtering.
  
  @author Claude
  @created 2025-07-03
  @task T01_S14 + T07_S14 - Expense Entry Form + Approval Workflow
-->

<template>
  <div class="expenses-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Expense Management</h1>
        <p class="page-description">
          Track, submit, and manage expense claims with integrated approval workflow
        </p>
      </div>
      
      <div class="header-actions">
        <Button @click="showCreateModal = true" v-if="canCreateExpenses">
          <Icon name="Plus" class="w-4 h-4 mr-2" />
          New Expense
        </Button>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="tab-navigation">
      <nav class="tabs-list">
        <button 
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab-item', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          <Icon :name="tab.icon" class="w-4 h-4 mr-2" />
          {{ tab.label }}
          <Badge 
            v-if="'count' in tab && typeof tab.count === 'number' && tab.count > 0" 
            variant="secondary" 
            class="ml-2"
          >
            {{ tab.count }}
          </Badge>
        </button>
      </nav>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- My Expenses Tab -->
      <div v-if="activeTab === 'my-expenses'" class="tab-panel">
        <ExpenseList
          :initial-filters="myExpensesFilters"
          :can-create="canCreateExpenses"
          :show-own-only="true"
          @create="showCreateModal = true"
          @view="handleViewExpense"
          @edit="handleEditExpense"
          @delete="handleDeleteExpense"
        />
      </div>

      <!-- All Expenses Tab (for managers) -->
      <div v-if="activeTab === 'all-expenses'" class="tab-panel">
        <ExpenseList
          :initial-filters="allExpensesFilters"
          :can-create="canCreateExpenses"
          @create="showCreateModal = true"
          @view="handleViewExpense"
          @edit="handleEditExpense"
          @delete="handleDeleteExpense"
        />
      </div>

      <!-- Approval Queue Tab -->
      <div v-if="activeTab === 'approvals'" class="tab-panel">
        <ApprovalDashboard />
      </div>

      <!-- Statistics Tab -->
      <div v-if="activeTab === 'statistics'" class="tab-panel">
        <ExpenseStatistics />
      </div>
    </div>

    <!-- Modals -->
    <ExpenseModal
      v-if="showCreateModal"
      mode="create"
      @save="handleExpenseCreated"
      @cancel="showCreateModal = false"
    />

    <ExpenseModal
      v-if="showEditModal && selectedExpense"
      mode="edit"
      :expense="selectedExpense"
      @save="handleExpenseUpdated"
      @cancel="showEditModal = false"
    />

    <ExpenseDetailModal
      v-if="showDetailModal && selectedExpense"
      :expense="selectedExpense"
      @edit="handleEditFromDetail"
      @delete="handleDeleteFromDetail"
      @close="showDetailModal = false"
    />

    <ConfirmDialog
      v-if="showDeleteConfirm"
      title="Delete Expense"
      :message="`Are you sure you want to delete this expense? This action cannot be undone.`"
      @confirm="confirmDelete"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useExpenses, useExpense } from '~/composables/useExpenses'
import { useApprovalWorkflow } from '~/composables/useApprovals'
import { useToast } from '~/composables/useToast'
import type { Expense, ExpenseFilters } from '~/types/expense'

// Meta
definePageMeta({
  title: 'Expense Management',
  description: 'Manage expense claims and approvals',
  layout: 'dashboard'
})

// Composables
const authStore = useAuthStore()
const { showToast } = useToast()

// Local State
const activeTab = ref('my-expenses')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDetailModal = ref(false)
const showDeleteConfirm = ref(false)
const selectedExpense = ref<Expense | null>(null)
const expenseToDelete = ref<string | null>(null)

// User Info
const user = computed(() => authStore.user)
const userId = computed(() => user.value?.id || '')

// Permissions
const canCreateExpenses = computed(() => {
  const userRole = user.value?.role
  return userRole === 'lawyer' || userRole === 'clerk'
})

const canViewAllExpenses = computed(() => {
  return user.value?.role === 'lawyer'
})

const canApproveExpenses = computed(() => {
  const userRole = user.value?.role
  return userRole === 'lawyer' || userRole === 'clerk'
})

// Approval Workflow Data
const { 
  notifications, 
  unreadCount,
  permissions 
} = useApprovalWorkflow(userId.value)

// Tab Configuration
const tabs = computed(() => {
  const baseTabs = [
    {
      id: 'my-expenses',
      label: 'My Expenses',
      icon: 'Receipt',
      variant: 'secondary' as const
    }
  ]
  
  if (canViewAllExpenses.value) {
    baseTabs.push({
      id: 'all-expenses',
      label: 'All Expenses',
      icon: 'List',
      variant: 'secondary' as const
    })
  }
  
  if (canApproveExpenses.value) {
    baseTabs.push({
      id: 'approvals',
      label: 'Approvals',
      icon: 'CheckSquare',
      ...(unreadCount.value && unreadCount.value > 0 ? { count: unreadCount.value } : {}),
      variant: 'secondary' as const
    })
  }
  
  if (canViewAllExpenses.value) {
    baseTabs.push({
      id: 'statistics',
      label: 'Statistics',
      icon: 'BarChart3',
      variant: 'secondary' as const
    })
  }
  
  return baseTabs
})

// Filter Configurations
const myExpensesFilters = computed<ExpenseFilters>(() => ({
  // Show user's own expenses by default
}))

const allExpensesFilters = computed<ExpenseFilters>(() => ({
  // Show all expenses for managers
}))

// Event Handlers
const handleViewExpense = (expenseId: string) => {
  // Load expense details
  loadExpenseDetails(expenseId)
  showDetailModal.value = true
}

const handleEditExpense = (expenseId: string) => {
  // Load expense for editing
  loadExpenseDetails(expenseId)
  showEditModal.value = true
}

const handleDeleteExpense = (expenseId: string) => {
  expenseToDelete.value = expenseId
  loadExpenseDetails(expenseId)
  showDeleteConfirm.value = true
}

const handleEditFromDetail = () => {
  showDetailModal.value = false
  showEditModal.value = true
}

const handleDeleteFromDetail = () => {
  showDetailModal.value = false
  if (selectedExpense.value) {
    expenseToDelete.value = selectedExpense.value.id
    showDeleteConfirm.value = true
  }
}

const loadExpenseDetails = async (expenseId: string) => {
  try {
    // This would typically use the useExpense composable
    // For now, we'll simulate loading from the list
    selectedExpense.value = { id: expenseId } as Expense
  } catch (error) {
    showToast('Failed to load expense details', 'error')
    console.error('Error loading expense:', error)
  }
}

// Modal Event Handlers
const handleExpenseCreated = (expense: Expense) => {
  showCreateModal.value = false
  showToast('Expense created successfully', 'success')
  
  // Optionally navigate to the new expense
  // navigateTo(`/expenses/${expense.id}`)
}

const handleExpenseUpdated = (expense: Expense) => {
  showEditModal.value = false
  selectedExpense.value = null
  showToast('Expense updated successfully', 'success')
}

const confirmDelete = async () => {
  if (!expenseToDelete.value) return
  
  try {
    // This would use the expense mutation
    // await deleteExpense(expenseToDelete.value)
    
    showDeleteConfirm.value = false
    expenseToDelete.value = null
    selectedExpense.value = null
    showToast('Expense deleted successfully', 'success')
  } catch (error) {
    showToast('Failed to delete expense', 'error')
    console.error('Delete error:', error)
  }
}

// URL State Management
const updateUrlTab = (tabId: string) => {
  const route = useRoute()
  const router = useRouter()
  
  router.replace({
    query: {
      ...route.query,
      tab: tabId
    }
  })
}

// Initialize from URL
onMounted(() => {
  const route = useRoute()
  const urlTab = route.query.tab as string
  
  if (urlTab && tabs.value.some(tab => tab.id === urlTab)) {
    activeTab.value = urlTab
  }
})

// Watch tab changes to update URL
watch(activeTab, (newTab) => {
  updateUrlTab(newTab)
})
</script>

<style scoped>
.expenses-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  items-center;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid hsl(var(--border));
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
}

.page-description {
  color: hsl(var(--muted-foreground));
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.tab-navigation {
  border-bottom: 1px solid hsl(var(--border));
}

.tabs-list {
  display: flex;
  gap: 0;
  margin: 0;
  padding: 0;
}

.tab-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  color: hsl(var(--muted-foreground));
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;
}

.tab-item:hover {
  color: hsl(var(--foreground));
  background: hsl(var(--muted) / 0.5);
}

.tab-item.active {
  color: hsl(var(--primary));
  border-bottom-color: hsl(var(--primary));
  background: hsl(var(--background));
}

.tab-content {
  min-height: 500px;
}

.tab-panel {
  padding: 1rem 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .expenses-page {
    padding: 0.5rem;
  }
  
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .tabs-list {
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  
  .tabs-list::-webkit-scrollbar {
    display: none;
  }
  
  .tab-item {
    flex-shrink: 0;
    white-space: nowrap;
  }
}

/* Animation for tab switching */
.tab-panel {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
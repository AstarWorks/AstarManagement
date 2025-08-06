---
task_id: T08_S03_M003
title: Bulk Operations with Multi-Select and Batch Processing
status: pending
estimated_hours: 6
actual_hours: null
assigned_to: Claude
dependencies: ["TX02_S02_M003_Expense_List_View", "T07_S03_M003_Tag_Management_UI"]
complexity: Medium
updated: null
completed: null
---

# T08_S03_M003: Bulk Operations with Multi-Select and Batch Processing

## Description
Implement comprehensive bulk operations system for expense management including multi-select functionality, batch delete/update operations, confirmation dialogs with detailed summaries, and progress indicators for long-running batch actions. Build upon the existing useTableSelection composable and expense table infrastructure to provide efficient mass operations for legal firm expense management workflows.

## Acceptance Criteria
- [ ] Implement multi-select functionality across expense tables and lists
- [ ] Add bulk delete operations with confirmation and progress tracking
- [ ] Create bulk update interface for common expense fields
- [ ] Implement bulk tag assignment and removal
- [ ] Build progress indicators for batch operations
- [ ] Add confirmation dialogs with operation summaries
- [ ] Support bulk export of selected expenses
- [ ] Handle error recovery for partial batch failures
- [ ] Implement undo functionality for recent bulk operations
- [ ] Japanese localization for all bulk operation interfaces

## Technical Details

### 1. Enhanced Bulk Operations Toolbar

**Location**: `frontend/app/components/expenses/table/BulkOperationsToolbar.vue`

```vue
<template>
  <div class="bulk-operations-toolbar" :class="{ visible: selectedCount > 0 }">
    <div class="bulk-toolbar-content">
      <!-- Selection Summary -->
      <div class="selection-summary">
        <div class="selection-count">
          <Icon name="lucide:check-square" class="w-4 h-4 mr-2" />
          <span class="font-medium">
            {{ $t('expenses.bulk.selectedCount', { count: selectedCount }) }}
          </span>
        </div>
        
        <div class="selection-meta">
          <span class="total-amount">
            {{ $t('expenses.bulk.totalAmount') }}: {{ formatCurrency(selectedTotalAmount) }}
          </span>
        </div>
      </div>

      <!-- Bulk Actions -->
      <div class="bulk-actions">
        <!-- Tag Operations -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm">
              <Icon name="lucide:tag" class="w-4 h-4 mr-2" />
              {{ $t('expenses.bulk.tags') }}
              <Icon name="lucide:chevron-down" class="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem @click="openBulkTagAssignment">
              <Icon name="lucide:plus" class="w-4 h-4 mr-2" />
              {{ $t('expenses.bulk.addTags') }}
            </DropdownMenuItem>
            <DropdownMenuItem @click="openBulkTagRemoval">
              <Icon name="lucide:minus" class="w-4 h-4 mr-2" />
              {{ $t('expenses.bulk.removeTags') }}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="openBulkTagReplace">
              <Icon name="lucide:replace" class="w-4 h-4 mr-2" />
              {{ $t('expenses.bulk.replaceTags') }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <!-- Status Operations -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm">
              <Icon name="lucide:edit" class="w-4 h-4 mr-2" />
              {{ $t('expenses.bulk.update') }}
              <Icon name="lucide:chevron-down" class="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem @click="openBulkStatusUpdate">
              <Icon name="lucide:flag" class="w-4 h-4 mr-2" />
              {{ $t('expenses.bulk.updateStatus') }}
            </DropdownMenuItem>
            <DropdownMenuItem @click="openBulkCategoryUpdate">
              <Icon name="lucide:folder" class="w-4 h-4 mr-2" />
              {{ $t('expenses.bulk.updateCategory') }}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="openBulkDescriptionUpdate">
              <Icon name="lucide:file-text" class="w-4 h-4 mr-2" />
              {{ $t('expenses.bulk.updateDescription') }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <!-- Export -->
        <Button variant="outline" size="sm" @click="exportSelected">
          <Icon name="lucide:download" class="w-4 h-4 mr-2" />
          {{ $t('expenses.bulk.export') }}
        </Button>

        <!-- Delete -->
        <Button 
          variant="destructive" 
          size="sm" 
          @click="confirmBulkDelete"
          :disabled="bulkOperationInProgress"
        >
          <Icon name="lucide:trash-2" class="w-4 h-4 mr-2" />
          {{ $t('expenses.bulk.delete') }}
        </Button>

        <!-- Clear Selection -->
        <Button variant="ghost" size="sm" @click="clearSelection">
          <Icon name="lucide:x" class="w-4 h-4 mr-2" />
          {{ $t('common.clear') }}
        </Button>
      </div>
    </div>

    <!-- Progress Bar for Bulk Operations -->
    <div v-if="bulkOperationInProgress" class="bulk-progress">
      <div class="progress-info">
        <span class="progress-text">{{ currentOperationText }}</span>
        <span class="progress-count">
          {{ processedCount }} / {{ totalCount }}
        </span>
      </div>
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: `${(processedCount / totalCount) * 100}%` }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IExpense } from '~/types/expense'
import { useBulkOperations } from '~/composables/useBulkOperations'

interface Props {
  selectedExpenses: IExpense[]
  selectedCount: number
}

interface Emits {
  (event: 'clearSelection'): void
  (event: 'operationCompleted', result: BulkOperationResult): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()
const { formatCurrency } = useExpenseFormatters()

// Composables
const {
  bulkOperationInProgress,
  currentOperationText,
  processedCount,
  totalCount,
  executeBulkDelete,
  executeBulkTagAssignment,
  executeBulkStatusUpdate,
  exportExpenses
} = useBulkOperations()

// Computed
const selectedTotalAmount = computed(() => 
  props.selectedExpenses.reduce((sum, expense) => sum + expense.amount, 0)
)

// Bulk operation dialogs
const bulkDeleteDialogOpen = ref(false)
const bulkTagDialogOpen = ref(false)
const bulkUpdateDialogOpen = ref(false)

// Methods
const clearSelection = () => {
  emit('clearSelection')
}

const confirmBulkDelete = () => {
  bulkDeleteDialogOpen.value = true
}

const openBulkTagAssignment = () => {
  bulkTagDialogOpen.value = true
}

const openBulkStatusUpdate = () => {
  bulkUpdateDialogOpen.value = true
}

const exportSelected = async () => {
  try {
    await exportExpenses(props.selectedExpenses)
  } catch (error) {
    console.error('Export failed:', error)
  }
}
</script>
```

### 2. Bulk Operation Confirmation Dialog

**Location**: `frontend/app/components/expenses/dialogs/BulkOperationDialog.vue`

```vue
<template>
  <Dialog v-model:open="dialogOpen">
    <DialogContent class="bulk-operation-dialog">
      <DialogHeader>
        <DialogTitle>
          <Icon :name="operationIcon" class="w-5 h-5 mr-2" />
          {{ operationTitle }}
        </DialogTitle>
        <DialogDescription>
          {{ operationDescription }}
        </DialogDescription>
      </DialogHeader>

      <!-- Operation Summary -->
      <div class="operation-summary">
        <div class="summary-header">
          <h4>{{ $t('expenses.bulk.operationSummary') }}</h4>
        </div>
        
        <div class="summary-stats">
          <div class="stat-item">
            <span class="stat-label">{{ $t('expenses.bulk.affectedExpenses') }}</span>
            <span class="stat-value">{{ selectedExpenses.length }}</span>
          </div>
          
          <div v-if="operation === 'delete'" class="stat-item">
            <span class="stat-label">{{ $t('expenses.bulk.totalAmount') }}</span>
            <span class="stat-value">{{ formatCurrency(totalAmount) }}</span>
          </div>
          
          <div v-if="operation === 'tagAssignment'" class="stat-item">
            <span class="stat-label">{{ $t('expenses.bulk.tagsToAdd') }}</span>
            <span class="stat-value">{{ selectedTags.length }}</span>
          </div>
        </div>

        <!-- Affected Expenses Preview -->
        <div class="affected-expenses-preview">
          <h5>{{ $t('expenses.bulk.affectedExpensesPreview') }}</h5>
          <div class="expenses-list">
            <div
              v-for="expense in previewExpenses"
              :key="expense.id"
              class="expense-preview-item"
            >
              <div class="expense-info">
                <span class="expense-description">{{ expense.description }}</span>
                <span class="expense-amount">{{ formatCurrency(expense.amount) }}</span>
              </div>
              <div class="expense-meta">
                <span class="expense-date">{{ formatDate(expense.expenseDate) }}</span>
                <CategoryBadge :category="expense.category" size="sm" />
              </div>
            </div>
            
            <div v-if="selectedExpenses.length > 5" class="more-expenses">
              {{ $t('expenses.bulk.andXMore', { count: selectedExpenses.length - 5 }) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Operation-Specific Configuration -->
      <div v-if="operation === 'tagAssignment'" class="operation-config">
        <div class="config-header">
          <h4>{{ $t('expenses.bulk.tagConfiguration') }}</h4>
        </div>
        
        <TagAssignment
          v-model:assigned-tag-ids="selectedTagIds"
          :show-current-tags="false"
          mode="bulk"
        />
      </div>

      <div v-if="operation === 'statusUpdate'" class="operation-config">
        <div class="config-header">
          <h4>{{ $t('expenses.bulk.statusConfiguration') }}</h4>
        </div>
        
        <Select v-model="newStatus">
          <SelectTrigger>
            <SelectValue :placeholder="$t('expenses.status.selectNew')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem 
              v-for="status in expenseStatuses"
              :key="status.value"
              :value="status.value"
            >
              <StatusBadge :status="status.value" size="sm" />
              <span class="ml-2">{{ status.label }}</span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Warning Messages -->
      <div v-if="hasWarnings" class="operation-warnings">
        <div class="warning-header">
          <Icon name="lucide:alert-triangle" class="w-4 h-4 mr-2 text-yellow-500" />
          <span>{{ $t('expenses.bulk.warnings') }}</span>
        </div>
        <ul class="warning-list">
          <li v-for="warning in warnings" :key="warning">{{ warning }}</li>
        </ul>
      </div>

      <!-- Progress Indicator -->
      <div v-if="operationInProgress" class="operation-progress">
        <div class="progress-header">
          <span>{{ progressText }}</span>
          <span class="progress-counter">{{ processedCount }} / {{ totalCount }}</span>
        </div>
        <div class="progress-bar">
          <div 
            class="progress-fill"
            :style="{ width: `${progressPercentage}%` }"
          />
        </div>
        
        <!-- Error Summary -->
        <div v-if="errors.length > 0" class="error-summary">
          <div class="error-header">
            <Icon name="lucide:alert-circle" class="w-4 h-4 mr-2 text-red-500" />
            <span>{{ $t('expenses.bulk.errors', { count: errors.length }) }}</span>
          </div>
          <div class="error-details">
            <Button variant="ghost" size="sm" @click="showErrorDetails = !showErrorDetails">
              {{ showErrorDetails ? $t('common.hideDetails') : $t('common.showDetails') }}
            </Button>
          </div>
          
          <div v-if="showErrorDetails" class="error-list">
            <div v-for="error in errors" :key="error.id" class="error-item">
              <span class="error-expense">{{ error.expenseDescription }}</span>
              <span class="error-message">{{ error.message }}</span>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <div class="dialog-footer-content">
          <!-- Cancel -->
          <Button 
            variant="outline" 
            @click="handleCancel"
            :disabled="operationInProgress"
          >
            {{ operationInProgress ? $t('common.close') : $t('common.cancel') }}
          </Button>
          
          <!-- Retry (only if errors occurred) -->
          <Button 
            v-if="errors.length > 0 && !operationInProgress"
            variant="outline"
            @click="retryFailedOperations"
          >
            <Icon name="lucide:refresh-cw" class="w-4 h-4 mr-2" />
            {{ $t('expenses.bulk.retryFailed') }}
          </Button>
          
          <!-- Execute -->
          <Button 
            v-if="!operationComplete"
            :variant="operation === 'delete' ? 'destructive' : 'default'"
            @click="executeOperation"
            :disabled="operationInProgress || !canExecute"
          >
            <Icon v-if="operationInProgress" name="lucide:loader-2" class="w-4 h-4 mr-2 animate-spin" />
            <Icon v-else :name="operationIcon" class="w-4 h-4 mr-2" />
            {{ executeButtonText }}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import type { IExpense, ExpenseStatus } from '~/types/expense'
import type { ITag } from '~/types/expense/tag'

interface Props {
  open: boolean
  operation: 'delete' | 'tagAssignment' | 'statusUpdate' | 'categoryUpdate'
  selectedExpenses: IExpense[]
  selectedTags?: ITag[]
}

interface Emits {
  (event: 'update:open', value: boolean): void
  (event: 'operationComplete', result: BulkOperationResult): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()
const { formatCurrency, formatDate } = useExpenseFormatters()

// Dialog state
const dialogOpen = useVModel(props, 'open', emit)

// Operation state
const operationInProgress = ref(false)
const operationComplete = ref(false)
const processedCount = ref(0)
const totalCount = ref(0)
const errors = ref<Array<{ id: string; expenseDescription: string; message: string }>>([])
const showErrorDetails = ref(false)

// Configuration state
const selectedTagIds = ref<string[]>([])
const newStatus = ref<ExpenseStatus>()

// Computed
const previewExpenses = computed(() => 
  props.selectedExpenses.slice(0, 5)
)

const totalAmount = computed(() => 
  props.selectedExpenses.reduce((sum, expense) => sum + expense.amount, 0)
)

const operationTitle = computed(() => {
  switch (props.operation) {
    case 'delete':
      return t('expenses.bulk.confirmDelete')
    case 'tagAssignment':
      return t('expenses.bulk.confirmTagAssignment')
    case 'statusUpdate':
      return t('expenses.bulk.confirmStatusUpdate')
    default:
      return t('expenses.bulk.confirmOperation')
  }
})

const operationIcon = computed(() => {
  switch (props.operation) {
    case 'delete':
      return 'lucide:trash-2'
    case 'tagAssignment':
      return 'lucide:tag'
    case 'statusUpdate':
      return 'lucide:flag'
    default:
      return 'lucide:edit'
  }
})

const canExecute = computed(() => {
  switch (props.operation) {
    case 'tagAssignment':
      return selectedTagIds.value.length > 0
    case 'statusUpdate':
      return newStatus.value !== undefined
    default:
      return true
  }
})

const progressPercentage = computed(() => 
  totalCount.value > 0 ? (processedCount.value / totalCount.value) * 100 : 0
)

// Methods
const executeOperation = async () => {
  operationInProgress.value = true
  processedCount.value = 0
  totalCount.value = props.selectedExpenses.length
  errors.value = []

  try {
    switch (props.operation) {
      case 'delete':
        await executeBulkDelete()
        break
      case 'tagAssignment':
        await executeBulkTagAssignment()
        break
      case 'statusUpdate':
        await executeBulkStatusUpdate()
        break
    }
  } catch (error) {
    console.error('Bulk operation failed:', error)
  } finally {
    operationInProgress.value = false
    operationComplete.value = true
  }
}

const executeBulkDelete = async () => {
  for (const expense of props.selectedExpenses) {
    try {
      await $fetch(`/api/v1/expenses/${expense.id}`, { method: 'DELETE' })
      processedCount.value++
    } catch (error) {
      errors.value.push({
        id: expense.id,
        expenseDescription: expense.description,
        message: t('expenses.bulk.deleteError')
      })
    }
  }
}

const executeBulkTagAssignment = async () => {
  for (const expense of props.selectedExpenses) {
    try {
      const updatedTagIds = [...new Set([...expense.tagIds, ...selectedTagIds.value])]
      await $fetch(`/api/v1/expenses/${expense.id}`, {
        method: 'PATCH',
        body: { tagIds: updatedTagIds }
      })
      processedCount.value++
    } catch (error) {
      errors.value.push({
        id: expense.id,
        expenseDescription: expense.description,
        message: t('expenses.bulk.tagAssignmentError')
      })
    }
  }
}

const handleCancel = () => {
  if (operationComplete.value) {
    emit('operationComplete', {
      operation: props.operation,
      processed: processedCount.value,
      errors: errors.value.length,
      success: errors.value.length === 0
    })
  }
  dialogOpen.value = false
}
</script>
```

### 3. Bulk Operations Composable

**Location**: `frontend/app/composables/useBulkOperations.ts`

```typescript
import type { IExpense, ExpenseStatus } from '~/types/expense'
import type { ITag } from '~/types/expense/tag'

interface BulkOperationResult {
  operation: string
  processed: number
  errors: number
  success: boolean
  undoable?: boolean
  undoData?: any
}

interface BulkOperationProgress {
  total: number
  processed: number
  errors: Array<{ id: string; message: string }>
  currentItem?: string
}

export function useBulkOperations() {
  const { t } = useI18n()
  
  // State
  const operationInProgress = ref(false)
  const currentOperationText = ref('')
  const progress = ref<BulkOperationProgress>({
    total: 0,
    processed: 0,
    errors: []
  })

  // Recent operations for undo functionality
  const recentOperations = ref<Array<{
    id: string
    operation: string
    timestamp: Date
    data: any
    undoable: boolean
  }>>([])

  // Computed
  const processedCount = computed(() => progress.value.processed)
  const totalCount = computed(() => progress.value.total)
  const hasErrors = computed(() => progress.value.errors.length > 0)
  const progressPercentage = computed(() => 
    progress.value.total > 0 ? (progress.value.processed / progress.value.total) * 100 : 0
  )

  /**
   * Execute bulk delete operation with progress tracking
   * @param expenses Array of expenses to delete
   * @param options Delete options and callbacks
   */
  const executeBulkDelete = async (
    expenses: IExpense[],
    options: {
      onProgress?: (current: number, total: number) => void
      onError?: (expense: IExpense, error: Error) => void
      batchSize?: number
    } = {}
  ): Promise<BulkOperationResult> => {
    const { batchSize = 5, onProgress, onError } = options
    
    operationInProgress.value = true
    currentOperationText.value = t('expenses.bulk.deletingExpenses')
    
    progress.value = {
      total: expenses.length,
      processed: 0,
      errors: []
    }

    const deletedExpenses: IExpense[] = []
    
    try {
      // Process in batches to avoid overwhelming the server
      for (let i = 0; i < expenses.length; i += batchSize) {
        const batch = expenses.slice(i, i + batchSize)
        
        await Promise.allSettled(
          batch.map(async (expense) => {
            try {
              await $fetch(`/api/v1/expenses/${expense.id}`, { 
                method: 'DELETE' 
              })
              deletedExpenses.push(expense)
              progress.value.processed++
              onProgress?.(progress.value.processed, progress.value.total)
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error'
              progress.value.errors.push({
                id: expense.id,
                message: errorMessage
              })
              onError?.(expense, error as Error)
            }
          })
        )
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Store for undo functionality
      const undoData = {
        deletedExpenses,
        timestamp: new Date()
      }
      
      recentOperations.value.unshift({
        id: generateId(),
        operation: 'bulkDelete',
        timestamp: new Date(),
        data: undoData,
        undoable: true
      })

      return {
        operation: 'bulkDelete',
        processed: deletedExpenses.length,
        errors: progress.value.errors.length,
        success: progress.value.errors.length === 0,
        undoable: true,
        undoData
      }
    } finally {
      operationInProgress.value = false
      currentOperationText.value = ''
    }
  }

  /**
   * Execute bulk tag assignment operation
   * @param expenses Array of expenses to update
   * @param tagIds Array of tag IDs to assign
   * @param mode Assignment mode ('add', 'remove', 'replace')
   */
  const executeBulkTagAssignment = async (
    expenses: IExpense[],
    tagIds: string[],
    mode: 'add' | 'remove' | 'replace' = 'add'
  ): Promise<BulkOperationResult> => {
    operationInProgress.value = true
    currentOperationText.value = t('expenses.bulk.updatingTags')
    
    progress.value = {
      total: expenses.length,
      processed: 0,
      errors: []
    }

    const updatedExpenses: Array<{ expense: IExpense; oldTagIds: string[] }> = []
    
    try {
      for (const expense of expenses) {
        try {
          const oldTagIds = [...expense.tagIds]
          let newTagIds: string[]
          
          switch (mode) {
            case 'add':
              newTagIds = [...new Set([...expense.tagIds, ...tagIds])]
              break
            case 'remove':
              newTagIds = expense.tagIds.filter(id => !tagIds.includes(id))
              break
            case 'replace':
              newTagIds = [...tagIds]
              break
          }
          
          await $fetch(`/api/v1/expenses/${expense.id}`, {
            method: 'PATCH',
            body: { tagIds: newTagIds }
          })
          
          updatedExpenses.push({ expense, oldTagIds })
          progress.value.processed++
        } catch (error) {
          progress.value.errors.push({
            id: expense.id,
            message: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      return {
        operation: 'bulkTagAssignment',
        processed: updatedExpenses.length,
        errors: progress.value.errors.length,
        success: progress.value.errors.length === 0
      }
    } finally {
      operationInProgress.value = false
      currentOperationText.value = ''
    }
  }

  /**
   * Execute bulk status update operation
   * @param expenses Array of expenses to update
   * @param newStatus New status to apply
   */
  const executeBulkStatusUpdate = async (
    expenses: IExpense[],
    newStatus: ExpenseStatus
  ): Promise<BulkOperationResult> => {
    operationInProgress.value = true
    currentOperationText.value = t('expenses.bulk.updatingStatus')
    
    progress.value = {
      total: expenses.length,
      processed: 0,
      errors: []
    }

    try {
      for (const expense of expenses) {
        try {
          await $fetch(`/api/v1/expenses/${expense.id}`, {
            method: 'PATCH',
            body: { status: newStatus }
          })
          progress.value.processed++
        } catch (error) {
          progress.value.errors.push({
            id: expense.id,
            message: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      return {
        operation: 'bulkStatusUpdate',
        processed: progress.value.processed,
        errors: progress.value.errors.length,
        success: progress.value.errors.length === 0
      }
    } finally {
      operationInProgress.value = false
      currentOperationText.value = ''
    }
  }

  /**
   * Export selected expenses to various formats
   * @param expenses Array of expenses to export
   * @param format Export format ('csv', 'excel', 'pdf')
   * @param options Export options
   */
  const exportExpenses = async (
    expenses: IExpense[],
    format: 'csv' | 'excel' | 'pdf' = 'csv',
    options: {
      filename?: string
      includeAttachments?: boolean
      dateRange?: { start: Date; end: Date }
    } = {}
  ): Promise<void> => {
    const { filename, includeAttachments = false } = options
    
    operationInProgress.value = true
    currentOperationText.value = t('expenses.bulk.exporting')
    
    try {
      const expenseIds = expenses.map(e => e.id)
      const response = await $fetch('/api/v1/expenses/export', {
        method: 'POST',
        body: {
          expenseIds,
          format,
          options: {
            filename,
            includeAttachments
          }
        },
        responseType: 'blob'
      })
      
      // Create download link
      const url = window.URL.createObjectURL(response as Blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename || `expenses-export.${format}`
      link.click()
      
      // Cleanup
      window.URL.revokeObjectURL(url)
    } finally {
      operationInProgress.value = false
      currentOperationText.value = ''
    }
  }

  /**
   * Undo the last bulk operation if possible
   * @param operationId ID of the operation to undo
   */
  const undoBulkOperation = async (operationId: string): Promise<boolean> => {
    const operation = recentOperations.value.find(op => op.id === operationId)
    if (!operation || !operation.undoable) {
      return false
    }

    try {
      switch (operation.operation) {
        case 'bulkDelete':
          // Restore deleted expenses
          const { deletedExpenses } = operation.data
          for (const expense of deletedExpenses) {
            await $fetch('/api/v1/expenses', {
              method: 'POST',
              body: expense
            })
          }
          break
        
        default:
          return false
      }

      // Remove from recent operations
      const index = recentOperations.value.findIndex(op => op.id === operationId)
      if (index !== -1) {
        recentOperations.value.splice(index, 1)
      }

      return true
    } catch (error) {
      console.error('Undo operation failed:', error)
      return false
    }
  }

  /**
   * Clear old operations from undo history
   * @param maxAge Maximum age in milliseconds (default: 1 hour)
   */
  const cleanupRecentOperations = (maxAge: number = 60 * 60 * 1000) => {
    const cutoff = new Date(Date.now() - maxAge)
    recentOperations.value = recentOperations.value.filter(
      op => op.timestamp > cutoff
    )
  }

  // Cleanup old operations periodically
  onMounted(() => {
    const cleanup = setInterval(() => cleanupRecentOperations(), 10 * 60 * 1000) // Every 10 minutes
    onUnmounted(() => clearInterval(cleanup))
  })

  return {
    // State
    operationInProgress: readonly(operationInProgress),
    currentOperationText: readonly(currentOperationText),
    processedCount,
    totalCount,
    hasErrors,
    progressPercentage,
    recentOperations: readonly(recentOperations),

    // Methods
    executeBulkDelete,
    executeBulkTagAssignment,
    executeBulkStatusUpdate,
    exportExpenses,
    undoBulkOperation,
    cleanupRecentOperations
  }
}

// Utility function to generate unique IDs
function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}
```

## Technical Guidance

### Integration with Existing Components

**Table Selection Enhancement** (update `useTableSelection.ts`):
```typescript
// Add bulk operation helpers
export function useTableSelection<T extends { id: string }>(/* existing params */) {
  // ... existing code ...

  /**
   * Get selection summary with calculated totals
   */
  const getSelectionSummary = <K extends keyof T>(
    sumField?: K
  ): SelectionSummary<T> => {
    const selected = selectedItems.value
    const summary: SelectionSummary<T> = {
      count: selected.length,
      items: selected,
      totalValue: 0
    }

    if (sumField && selected.length > 0) {
      summary.totalValue = selected.reduce((sum, item) => {
        const value = item[sumField]
        return sum + (typeof value === 'number' ? value : 0)
      }, 0)
    }

    return summary
  }

  /**
   * Select items matching criteria
   */
  const selectWhere = (predicate: (item: T) => boolean) => {
    const matchingIds = items.value
      .filter(predicate)
      .map(item => item.id)
    
    selectItems(matchingIds)
  }

  return {
    // ... existing returns ...
    getSelectionSummary,
    selectWhere
  }
}
```

**Expense Table Integration** (update `ExpenseDataTable.vue`):
```vue
<template>
  <div class="expense-data-table">
    <!-- Bulk Operations Toolbar -->
    <BulkOperationsToolbar
      v-if="selection.hasSelection.value"
      :selected-expenses="selection.selectedItems.value"
      :selected-count="selection.selectedCount.value"
      @clear-selection="selection.clearSelection"
      @operation-completed="handleBulkOperationComplete"
    />
    
    <!-- Existing table content -->
    <!-- ... -->
  </div>
</template>

<script setup lang="ts">
// Add bulk operation handling
const handleBulkOperationComplete = (result: BulkOperationResult) => {
  // Refresh data
  await refreshExpenses()
  
  // Show result notification
  if (result.success) {
    showSuccessToast(t('expenses.bulk.operationCompleted', { 
      count: result.processed 
    }))
  } else {
    showErrorToast(t('expenses.bulk.operationPartiallyCompleted', {
      processed: result.processed,
      errors: result.errors
    }))
  }
  
  // Clear selection
  selection.clearSelection()
}
</script>
```

## Research Findings

### Existing Codebase Patterns

**Selection Management** (from `useTableSelection.ts`):
- Generic selection composable with TypeScript safety
- Selection state management with computed properties
- Bulk selection operations (select all, clear, toggle)
- Event emission for external state synchronization

**Table Infrastructure** (from expense table components):
- Card-based layout for mobile responsiveness
- Toolbar patterns for action placement
- Loading states and error handling
- Japanese localization throughout interface

**API Patterns** (from existing expense operations):
- RESTful endpoints with proper HTTP methods
- Batch processing capabilities in backend
- Error handling with detailed messages
- Progress tracking for long operations

### Performance Considerations

**Batch Processing**:
- Process operations in small batches (5-10 items)
- Add delays between batches to prevent server overload
- Use Promise.allSettled for parallel processing within batches
- Implement retry logic for failed operations

**User Experience**:
- Real-time progress indicators
- Cancellation support for long operations
- Undo functionality for reversible actions
- Clear error reporting with recovery options

## Implementation Notes

### Step-by-Step Approach

1. **Enhanced Selection Interface** (25% of effort):
   - Update table selection composable with bulk helpers
   - Add selection summary calculations
   - Implement selection persistence across pagination

2. **Bulk Operations Infrastructure** (35% of effort):
   - Create bulk operations composable with progress tracking
   - Build confirmation dialogs with operation previews
   - Implement batch processing with error handling

3. **User Interface Components** (25% of effort):
   - Build bulk operations toolbar
   - Create progress indicators and status displays
   - Add undo/retry functionality interface

4. **Integration and Testing** (15% of effort):
   - Integrate with existing expense table
   - Add Japanese localization
   - Test error scenarios and recovery

### Error Handling Strategy

**Partial Failure Recovery**:
- Continue processing remaining items after errors
- Collect detailed error information
- Provide retry functionality for failed items
- Allow users to export error reports

**Progress Communication**:
- Real-time progress updates
- Clear status messaging
- Error count tracking
- Completion summaries

## Subtasks
- [ ] Enhance useTableSelection composable with bulk operation helpers
- [ ] Create BulkOperationsToolbar component with action menus
- [ ] Implement BulkOperationDialog with confirmation and progress
- [ ] Build useBulkOperations composable with batch processing
- [ ] Add bulk delete functionality with undo support
- [ ] Implement bulk tag assignment and removal
- [ ] Create bulk status update interface
- [ ] Add bulk export functionality
- [ ] Integrate with existing expense table components
- [ ] Implement error handling and retry mechanisms
- [ ] Add progress indicators and status messaging
- [ ] Create Japanese localization for all bulk operations

## Testing Requirements
- [ ] Multi-select functionality works across pagination
- [ ] Bulk operations handle partial failures gracefully
- [ ] Progress indicators update accurately during operations
- [ ] Confirmation dialogs show correct operation summaries
- [ ] Undo functionality restores data correctly
- [ ] Export operations generate correct file formats
- [ ] Error handling provides useful feedback
- [ ] Performance remains acceptable with large selections

## Success Metrics
- Bulk operations complete within 30 seconds for 100+ items
- Error recovery succeeds for 95% of failed operations
- Selection interface responds within 100ms
- Progress indicators update every 500ms during operations
- Undo functionality works within 1 hour of operations
- Memory usage stays under 50MB during bulk operations
- All operations work on mobile devices

## Notes
- Focus on legal firm batch processing workflows
- Consider regulatory compliance for bulk changes
- Implement proper audit logging for bulk operations
- Support keyboard shortcuts for power users
- Plan for future integration with case management
- Consider offline queue for bulk operations
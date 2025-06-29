<template>
  <div v-if="selectedCount > 0" class="bulk-actions-toolbar">
    <div class="bulk-actions-content">
      <!-- Selection Info -->
      <div class="selection-info">
        <Checkbox
          :checked="isAllSelected"
          :indeterminate="selectedCount > 0 && !isAllSelected"
          @update:checked="handleSelectAll"
        />
        <span class="selection-text">
          {{ selectedCount }} of {{ totalCount }} memos selected
        </span>
      </div>
      
      <!-- Bulk Actions -->
      <div class="bulk-actions">
        <Button
          v-for="action in bulkActions"
          :key="action.id"
          :variant="action.variant"
          size="sm"
          @click="handleBulkAction(action)"
          :disabled="!canPerformAction(action)"
        >
          <component :is="action.icon" class="size-4 mr-2" />
          {{ action.label }}
        </Button>
        
        <!-- Export Dropdown -->
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download class="size-4 mr-2" />
              Export
              <ChevronDown class="size-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Export Format</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="exportMemos('csv')">
              <FileSpreadsheet class="size-4 mr-2" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem @click="exportMemos('pdf')">
              <FileText class="size-4 mr-2" />
              Export as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <!-- Close Button -->
      <Button
        variant="ghost"
        size="sm"
        @click="clearSelection"
      >
        <X class="size-4" />
      </Button>
    </div>
    
    <!-- Progress Bar (shown during bulk operations) -->
    <div v-if="isProcessing" class="bulk-progress">
      <div class="progress-bar">
        <div 
          class="progress-fill"
          :style="{ width: `${progressPercentage}%` }"
        />
      </div>
      <span class="progress-text">
        {{ progressText }}
      </span>
    </div>
  </div>
  
  <!-- Confirmation Dialog -->
  <AlertDialog v-model:open="showConfirmDialog">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ confirmationTitle }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ confirmationMessage }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      
      <div v-if="pendingAction?.type === 'delete'" class="confirmation-warning">
        <AlertTriangle class="size-5 text-destructive" />
        <div class="warning-content">
          <p class="warning-title">This action cannot be undone</p>
          <p class="warning-text">
            The selected memos will be permanently deleted from the system.
          </p>
        </div>
      </div>
      
      <AlertDialogFooter>
        <AlertDialogCancel @click="cancelBulkAction">
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction
          @click="confirmBulkAction"
          :variant="pendingAction?.type === 'delete' ? 'destructive' : 'default'"
        >
          {{ confirmButtonText }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
  
  <!-- Export Options Dialog -->
  <Dialog v-model:open="showExportDialog">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Export Memos</DialogTitle>
        <DialogDescription>
          Configure export options for {{ selectedCount }} selected memos.
        </DialogDescription>
      </DialogHeader>
      
      <div class="export-options">
        <div class="option-group">
          <label class="option-label">Export Format</label>
          <Select v-model="exportOptions.format">
            <SelectTrigger>
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
              <SelectItem value="pdf">PDF (Document)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div class="option-group">
          <label class="option-label">Include</label>
          <div class="option-checkboxes">
            <div class="option-checkbox">
              <Checkbox
                id="include-content"
                v-model:checked="exportOptions.includeContent"
              />
              <label for="include-content" class="checkbox-label">
                Full memo content
              </label>
            </div>
            <div class="option-checkbox">
              <Checkbox
                id="include-attachments"
                v-model:checked="exportOptions.includeAttachments"
              />
              <label for="include-attachments" class="checkbox-label">
                Attachment information
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" @click="showExportDialog = false">
          Cancel
        </Button>
        <Button @click="confirmExport" :disabled="!exportOptions.format">
          <Download class="size-4 mr-2" />
          Export
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  CheckCheck,
  MailOpen,
  Archive,
  Trash2,
  Download,
  ChevronDown,
  X,
  FileSpreadsheet,
  FileText,
  AlertTriangle
} from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '~/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '~/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { useBulkMemoMutation, useExportMemoMutation } from '~/composables/useMemoQueries'
import type { BulkOperation, MemoExportOptions } from '~/types/memo'
import { useToast } from '~/composables/useToast'

interface Props {
  selectedMemoIds: string[]
  totalCount: number
  onSelectionChange: (ids: string[]) => void
  onSelectAll: () => void
  onClearSelection: () => void
  isAllSelected: boolean
}

const props = defineProps<Props>()

// Component state
const showConfirmDialog = ref(false)
const showExportDialog = ref(false)
const pendingAction = ref<BulkOperation | null>(null)
const isProcessing = ref(false)
const processedCount = ref(0)
const progressText = ref('')

// Export options
const exportOptions = ref<MemoExportOptions>({
  format: 'csv',
  includeContent: false,
  includeAttachments: true
})

// Mutations
const bulkMutation = useBulkMemoMutation()
const exportMutation = useExportMemoMutation()
const { toast } = useToast()

// Bulk action definitions
const bulkActions = [
  {
    id: 'mark_read',
    label: 'Mark as Read',
    icon: CheckCheck,
    variant: 'default' as const,
    requiresConfirmation: false,
    requiresPermission: 'memo:update'
  },
  {
    id: 'mark_unread',
    label: 'Mark as Unread',
    icon: MailOpen,
    variant: 'outline' as const,
    requiresConfirmation: false,
    requiresPermission: 'memo:update'
  },
  {
    id: 'archive',
    label: 'Archive',
    icon: Archive,
    variant: 'secondary' as const,
    requiresConfirmation: true,
    requiresPermission: 'memo:archive'
  },
  {
    id: 'unarchive',
    label: 'Unarchive',
    icon: Archive,
    variant: 'outline' as const,
    requiresConfirmation: false,
    requiresPermission: 'memo:archive'
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: Trash2,
    variant: 'destructive' as const,
    requiresConfirmation: true,
    requiresPermission: 'memo:delete'
  }
]

// Computed properties
const selectedCount = computed(() => props.selectedMemoIds.length)

const progressPercentage = computed(() => {
  if (!isProcessing.value || selectedCount.value === 0) return 0
  return (processedCount.value / selectedCount.value) * 100
})

const confirmationTitle = computed(() => {
  if (!pendingAction.value) return ''
  
  const actionLabels: Record<string, string> = {
    mark_read: 'Mark Memos as Read',
    mark_unread: 'Mark Memos as Unread',
    archive: 'Archive Memos',
    unarchive: 'Unarchive Memos',
    delete: 'Delete Memos'
  }
  
  return actionLabels[pendingAction.value.type] || 'Confirm Action'
})

const confirmationMessage = computed(() => {
  if (!pendingAction.value) return ''
  
  const count = selectedCount.value
  const messages: Record<string, string> = {
    mark_read: `Mark ${count} memo${count > 1 ? 's' : ''} as read?`,
    mark_unread: `Mark ${count} memo${count > 1 ? 's' : ''} as unread?`,
    archive: `Archive ${count} memo${count > 1 ? 's' : ''}? Archived memos can be restored later.`,
    unarchive: `Unarchive ${count} memo${count > 1 ? 's' : ''}?`,
    delete: `Permanently delete ${count} memo${count > 1 ? 's' : ''}?`
  }
  
  return messages[pendingAction.value.type] || 'Are you sure you want to perform this action?'
})

const confirmButtonText = computed(() => {
  if (!pendingAction.value) return 'Confirm'
  
  const labels: Record<string, string> = {
    mark_read: 'Mark as Read',
    mark_unread: 'Mark as Unread',
    archive: 'Archive',
    unarchive: 'Unarchive',
    delete: 'Delete'
  }
  
  return labels[pendingAction.value.type] || 'Confirm'
})

// Methods
const canPerformAction = (action: any): boolean => {
  // TODO: Check user permissions
  return selectedCount.value > 0
}

const handleSelectAll = (checked: boolean) => {
  if (checked) {
    props.onSelectAll()
  } else {
    props.onClearSelection()
  }
}

const clearSelection = () => {
  props.onClearSelection()
}

const handleBulkAction = (action: any) => {
  const operation: BulkOperation = {
    type: action.id,
    memoIds: props.selectedMemoIds,
    confirmationRequired: action.requiresConfirmation
  }
  
  if (action.requiresConfirmation) {
    pendingAction.value = operation
    showConfirmDialog.value = true
  } else {
    executeBulkAction(operation)
  }
}

const confirmBulkAction = () => {
  if (pendingAction.value) {
    executeBulkAction(pendingAction.value)
  }
  showConfirmDialog.value = false
  pendingAction.value = null
}

const cancelBulkAction = () => {
  showConfirmDialog.value = false
  pendingAction.value = null
}

const executeBulkAction = async (operation: BulkOperation) => {
  isProcessing.value = true
  processedCount.value = 0
  progressText.value = `Processing ${operation.type.replace('_', ' ')}...`
  
  try {
    // Simulate progress for better UX
    const totalItems = operation.memoIds.length
    const progressInterval = setInterval(() => {
      if (processedCount.value < totalItems) {
        processedCount.value++
        progressText.value = `Processing ${processedCount.value} of ${totalItems} memos...`
      }
    }, 100)
    
    await bulkMutation.mutateAsync(operation)
    
    clearInterval(progressInterval)
    processedCount.value = totalItems
    progressText.value = 'Complete!'
    
    // Show success message
    const actionLabels: Record<string, string> = {
      mark_read: 'marked as read',
      mark_unread: 'marked as unread',
      archive: 'archived',
      unarchive: 'unarchived',
      delete: 'deleted'
    }
    
    const actionLabel = actionLabels[operation.type] || 'processed'
    toast({
      title: 'Success',
      description: `${totalItems} memo${totalItems > 1 ? 's' : ''} ${actionLabel} successfully.`
    })
    
    // Clear selection after successful operation
    clearSelection()
    
  } catch (error) {
    console.error('Bulk operation failed:', error)
    toast({
      title: 'Error',
      description: 'Failed to perform bulk operation. Please try again.',
      variant: 'destructive'
    })
  } finally {
    setTimeout(() => {
      isProcessing.value = false
      processedCount.value = 0
      progressText.value = ''
    }, 1000)
  }
}

const exportMemos = (format: 'csv' | 'pdf') => {
  exportOptions.value.format = format
  showExportDialog.value = true
}

const confirmExport = async () => {
  const options: MemoExportOptions = {
    ...exportOptions.value,
    memoIds: props.selectedMemoIds
  }
  
  try {
    const result = await exportMutation.mutateAsync(options)
    
    // Create download link
    const blob = new Blob([(result as any).data], { 
      type: options.format === 'csv' ? 'text/csv' : 'application/pdf' 
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `memos-export-${new Date().toISOString().split('T')[0]}.${options.format}`
    link.click()
    URL.revokeObjectURL(url)
    
    toast({
      title: 'Export Complete',
      description: `${selectedCount.value} memos exported successfully.`
    })
    
    showExportDialog.value = false
    
  } catch (error) {
    console.error('Export failed:', error)
    toast({
      title: 'Export Failed',
      description: 'Failed to export memos. Please try again.',
      variant: 'destructive'
    })
  }
}
</script>

<style scoped>
.bulk-actions-toolbar {
  @apply fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50;
  @apply bg-card border border-border rounded-lg shadow-lg;
  @apply min-w-96 max-w-4xl;
}

.bulk-actions-content {
  @apply flex items-center justify-between p-4 gap-4;
}

.selection-info {
  @apply flex items-center gap-3;
}

.selection-text {
  @apply text-sm font-medium text-foreground;
}

.bulk-actions {
  @apply flex items-center gap-2;
}

.bulk-progress {
  @apply px-4 pb-4;
}

.progress-bar {
  @apply w-full h-2 bg-muted rounded-full overflow-hidden mb-2;
}

.progress-fill {
  @apply h-full bg-primary transition-all duration-300 ease-out;
}

.progress-text {
  @apply text-xs text-muted-foreground;
}

.confirmation-warning {
  @apply flex gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg;
}

.warning-content {
  @apply space-y-1;
}

.warning-title {
  @apply font-medium text-destructive;
}

.warning-text {
  @apply text-sm text-muted-foreground;
}

.export-options {
  @apply space-y-4;
}

.option-group {
  @apply space-y-2;
}

.option-label {
  @apply block text-sm font-medium text-foreground;
}

.option-checkboxes {
  @apply space-y-2;
}

.option-checkbox {
  @apply flex items-center gap-2;
}

.checkbox-label {
  @apply text-sm text-foreground cursor-pointer;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .bulk-actions-toolbar {
    @apply left-2 right-2 transform-none min-w-0;
  }
  
  .bulk-actions-content {
    @apply flex-col gap-3 p-3;
  }
  
  .bulk-actions {
    @apply flex-wrap justify-center;
  }
}
</style>
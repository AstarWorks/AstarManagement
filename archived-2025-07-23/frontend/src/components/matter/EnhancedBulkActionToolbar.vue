<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Progress } from '~/components/ui/progress'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '~/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '~/components/ui/dialog'
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
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/ui/select'
import { 
  Download, 
  Edit, 
  Trash2, 
  X, 
  Check, 
  Minus,
  Settings,
  Calendar,
  User,
  Tag,
  FileText,
  History,
  AlertTriangle,
  CheckCircle,
  Clock,
  Pause
} from 'lucide-vue-next'
import type { Matter, MatterStatus, MatterPriority } from '~/types/matter'
import { usePdfExport } from '~/composables/usePdfExport'
import { useOperationQueue } from '~/composables/useOperationQueue'
import { useSelectionManager } from '~/composables/useSelectionManager'
import ExportTemplateManager from './ExportTemplateManager.vue'
import OperationProgressTracker from './OperationProgressTracker.vue'

interface Props {
  selectedItems: Matter[]
  totalItems: number
  disabled?: boolean
  allowBulkEdit?: boolean
  allowBulkDelete?: boolean
  allowBulkExport?: boolean
  showOperationHistory?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  allowBulkEdit: true,
  allowBulkDelete: true,
  allowBulkExport: true,
  showOperationHistory: true
})

const emit = defineEmits<{
  'action:delete': [items: Matter[]]
  'action:status-update': [items: Matter[], status: MatterStatus]
  'action:priority-update': [items: Matter[], priority: MatterPriority]
  'action:assignee-update': [items: Matter[], assigneeId: string]
  'action:due-date-update': [items: Matter[], dueDate: string]
  'action:tag-update': [items: Matter[], tags: string[], action: 'add' | 'remove']
  'action:export': [items: Matter[], format: 'csv' | 'excel' | 'pdf', template?: any]
  'selection:clear': []
  'selection:all': []
  'selection:inverse': []
}>()

// Composables
const { downloadPdf, getAvailableTemplates } = usePdfExport()
const { addOperation, queueStats, runningOperations } = useOperationQueue()

// State
const selectedCount = computed(() => props.selectedItems.length)
const isAllSelected = computed(() => 
  selectedCount.value > 0 && selectedCount.value === props.totalItems
)
const isPartialSelection = computed(() => 
  selectedCount.value > 0 && selectedCount.value < props.totalItems
)

// Dialog states
const showBulkEditDialog = ref(false)
const showTemplateManager = ref(false)
const showProgressTracker = ref(false)
const showDeleteDialog = ref(false)
const showOperationHistory = ref(false)
const currentOperationId = ref<string | null>(null)

// Bulk edit form
const bulkEditForm = ref({
  action: 'status', // 'status' | 'priority' | 'assignee' | 'due-date' | 'tags'
  status: '' as MatterStatus | '',
  priority: '' as MatterPriority | '',
  assigneeId: '',
  dueDate: '',
  tags: [] as string[],
  tagAction: 'add' as 'add' | 'remove',
  notes: ''
})

// Operation tracking
const activeOperations = ref<Set<string>>(new Set())

// Constants
const statusOptions = [
  { label: 'Intake', value: 'INTAKE' as MatterStatus },
  { label: 'Initial Review', value: 'INITIAL_REVIEW' as MatterStatus },
  { label: 'In Progress', value: 'IN_PROGRESS' as MatterStatus },
  { label: 'Review', value: 'REVIEW' as MatterStatus },
  { label: 'Waiting Client', value: 'WAITING_CLIENT' as MatterStatus },
  { label: 'Ready Filing', value: 'READY_FILING' as MatterStatus },
  { label: 'Closed', value: 'CLOSED' as MatterStatus }
]

const priorityOptions = [
  { label: 'Low', value: 'LOW' as MatterPriority },
  { label: 'Medium', value: 'MEDIUM' as MatterPriority },
  { label: 'High', value: 'HIGH' as MatterPriority },
  { label: 'Urgent', value: 'URGENT' as MatterPriority }
]

// Computed properties
const hasActiveOperations = computed(() => 
  activeOperations.value.size > 0 || runningOperations.value.length > 0
)

const operationProgress = computed(() => {
  if (runningOperations.value.length === 0) return 0
  
  const totalProgress = runningOperations.value.reduce((sum, op) => 
    sum + (op.progress?.progress || 0), 0
  )
  return totalProgress / runningOperations.value.length
})

// Selection methods
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    emit('selection:clear')
  } else {
    emit('selection:all')
  }
}

const selectInverse = () => {
  emit('selection:inverse')
}

const clearSelection = () => {
  emit('selection:clear')
}

// Quick actions
const quickStatusUpdate = async (status: MatterStatus) => {
  if (selectedCount.value === 0) return

  try {
    const operationId = await addOperation('bulk_update', {
      items: props.selectedItems,
      updates: { status },
      type: 'status_update'
    }, { priority: 'normal' })

    activeOperations.value.add(operationId)
    currentOperationId.value = operationId
    showProgressTracker.value = true

    emit('action:status-update', props.selectedItems, status)
  } catch (error) {
    console.error('Failed to start bulk status update:', error)
  }
}

const quickPriorityUpdate = async (priority: MatterPriority) => {
  if (selectedCount.value === 0) return

  try {
    const operationId = await addOperation('bulk_update', {
      items: props.selectedItems,
      updates: { priority },
      type: 'priority_update'
    }, { priority: 'normal' })

    activeOperations.value.add(operationId)
    emit('action:priority-update', props.selectedItems, priority)
  } catch (error) {
    console.error('Failed to start bulk priority update:', error)
  }
}

// Export actions
const quickExport = async (format: 'csv' | 'excel') => {
  if (selectedCount.value === 0) return

  try {
    const operationId = await addOperation('export', {
      items: props.selectedItems,
      format,
      includeFilters: true
    }, { 
      priority: 'normal',
      estimatedDuration: Math.ceil(selectedCount.value / 100) * 1000 // ~1s per 100 items
    })

    activeOperations.value.add(operationId)
    currentOperationId.value = operationId
    showProgressTracker.value = true

    emit('action:export', props.selectedItems, format)
  } catch (error) {
    console.error('Failed to start export:', error)
  }
}

const exportWithTemplate = (template: any) => {
  showTemplateManager.value = false
  
  if (template.format === 'pdf') {
    // Use PDF export directly for immediate download
    downloadPdf(props.selectedItems, {
      template: template.id,
      filename: `${template.name}-${new Date().toISOString().slice(0, 10)}.pdf`
    })
  } else {
    // Queue CSV/Excel exports
    quickExport(template.format)
  }
  
  emit('action:export', props.selectedItems, template.format, template)
}

// Bulk edit
const openBulkEdit = (action: string) => {
  bulkEditForm.value.action = action
  bulkEditForm.value.status = ''
  bulkEditForm.value.priority = ''
  bulkEditForm.value.assigneeId = ''
  bulkEditForm.value.dueDate = ''
  bulkEditForm.value.tags = []
  bulkEditForm.value.notes = ''
  showBulkEditDialog.value = true
}

const executeBulkEdit = async () => {
  if (selectedCount.value === 0) return

  const { action } = bulkEditForm.value
  let operationPayload: any

  switch (action) {
    case 'status':
      if (!bulkEditForm.value.status) return
      operationPayload = {
        items: props.selectedItems,
        updates: { status: bulkEditForm.value.status },
        type: 'status_update',
        notes: bulkEditForm.value.notes
      }
      break

    case 'priority':
      if (!bulkEditForm.value.priority) return
      operationPayload = {
        items: props.selectedItems,
        updates: { priority: bulkEditForm.value.priority },
        type: 'priority_update',
        notes: bulkEditForm.value.notes
      }
      break

    case 'assignee':
      if (!bulkEditForm.value.assigneeId) return
      operationPayload = {
        items: props.selectedItems,
        updates: { assigneeId: bulkEditForm.value.assigneeId },
        type: 'assignee_update',
        notes: bulkEditForm.value.notes
      }
      break

    case 'due-date':
      if (!bulkEditForm.value.dueDate) return
      operationPayload = {
        items: props.selectedItems,
        updates: { dueDate: bulkEditForm.value.dueDate },
        type: 'due_date_update',
        notes: bulkEditForm.value.notes
      }
      break

    case 'tags':
      if (!bulkEditForm.value.tags.length) return
      operationPayload = {
        items: props.selectedItems,
        updates: { 
          tags: bulkEditForm.value.tags,
          tagAction: bulkEditForm.value.tagAction
        },
        type: 'tag_update',
        notes: bulkEditForm.value.notes
      }
      break

    default:
      return
  }

  try {
    const operationId = await addOperation('bulk_update', operationPayload, {
      priority: 'normal',
      estimatedDuration: Math.ceil(selectedCount.value / 50) * 1000 // ~1s per 50 items
    })

    activeOperations.value.add(operationId)
    currentOperationId.value = operationId
    showBulkEditDialog.value = false
    showProgressTracker.value = true

    // Emit specific action
    switch (action) {
      case 'status':
        emit('action:status-update', props.selectedItems, bulkEditForm.value.status as MatterStatus)
        break
      case 'priority':
        emit('action:priority-update', props.selectedItems, bulkEditForm.value.priority as MatterPriority)
        break
      case 'assignee':
        emit('action:assignee-update', props.selectedItems, bulkEditForm.value.assigneeId)
        break
      case 'due-date':
        emit('action:due-date-update', props.selectedItems, bulkEditForm.value.dueDate)
        break
      case 'tags':
        emit('action:tag-update', props.selectedItems, bulkEditForm.value.tags, bulkEditForm.value.tagAction)
        break
    }
  } catch (error) {
    console.error('Failed to start bulk edit operation:', error)
  }
}

// Delete action
const confirmDelete = () => {
  showDeleteDialog.value = true
}

const executeDelete = async () => {
  if (selectedCount.value === 0) return

  try {
    const operationId = await addOperation('bulk_delete', {
      items: props.selectedItems,
      type: 'permanent_delete'
    }, { 
      priority: 'high',
      estimatedDuration: Math.ceil(selectedCount.value / 25) * 1000 // ~1s per 25 items
    })

    activeOperations.value.add(operationId)
    currentOperationId.value = operationId
    showDeleteDialog.value = false
    showProgressTracker.value = true

    emit('action:delete', props.selectedItems)
  } catch (error) {
    console.error('Failed to start bulk delete:', error)
  }
}

// Operation completion handler
const handleOperationComplete = (operation: any) => {
  activeOperations.value.delete(operation.id)
  
  // Auto-hide progress tracker after successful completion
  if (operation.status === 'completed') {
    setTimeout(() => {
      if (currentOperationId.value === operation.id) {
        showProgressTracker.value = false
        currentOperationId.value = null
      }
    }, 3000)
  }
}

const handleOperationCancel = (operationId: string) => {
  activeOperations.value.delete(operationId)
  if (currentOperationId.value === operationId) {
    showProgressTracker.value = false
    currentOperationId.value = null
  }
}

// Utility functions
const getStatusLabel = (status: MatterStatus) => {
  return statusOptions.find(opt => opt.value === status)?.label || status
}

const getPriorityLabel = (priority: MatterPriority) => {
  return priorityOptions.find(opt => opt.value === priority)?.label || priority
}

const formatOperationCount = (count: number) => {
  if (count === 1) return '1 operation'
  return `${count} operations`
}
</script>

<template>
  <div
    v-if="selectedCount > 0"
    class="enhanced-bulk-toolbar bg-primary text-primary-foreground p-4 rounded-lg shadow-lg border border-primary/20"
  >
    <!-- Main toolbar -->
    <div class="flex items-center justify-between">
      <!-- Selection info and controls -->
      <div class="flex items-center gap-4">
        <!-- Multi-select checkbox -->
        <Button
          variant="ghost"
          size="sm"
          class="text-primary-foreground hover:bg-primary-foreground/10"
          @click="toggleSelectAll"
        >
          <div class="flex items-center gap-2">
            <div 
              class="w-4 h-4 border-2 rounded flex items-center justify-center"
              :class="{
                'bg-primary-foreground text-primary border-primary-foreground': isAllSelected,
                'bg-primary-foreground/20 border-primary-foreground': isPartialSelection,
                'border-primary-foreground/50': !isAllSelected && !isPartialSelection
              }"
            >
              <Check v-if="isAllSelected" class="h-3 w-3" />
              <Minus v-else-if="isPartialSelection" class="h-3 w-3" />
            </div>
            <span class="text-sm font-medium">
              {{ isAllSelected ? 'Deselect All' : 'Select All' }}
            </span>
          </div>
        </Button>

        <!-- Selection count with operation status -->
        <div class="flex items-center gap-2">
          <Badge variant="secondary" class="bg-primary-foreground/20 text-primary-foreground">
            {{ selectedCount }} of {{ totalItems }} selected
          </Badge>
          
          <!-- Active operations indicator -->
          <Badge 
            v-if="hasActiveOperations" 
            variant="secondary" 
            class="bg-yellow-500/20 text-yellow-200"
          >
            <Clock class="h-3 w-3 mr-1" />
            {{ formatOperationCount(activeOperations.size) }}
          </Badge>
        </div>

        <!-- Additional selection controls -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              variant="ghost"
              size="sm"
              class="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Settings class="mr-2 h-4 w-4" />
              Selection
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem @click="selectInverse">
              Select Inverse
            </DropdownMenuItem>
            <DropdownMenuItem @click="clearSelection">
              Clear Selection
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="showOperationHistory = true">
              <History class="mr-2 h-4 w-4" />
              Operation History
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <!-- Action buttons -->
      <div class="flex items-center gap-2">
        <!-- Quick status updates -->
        <DropdownMenu v-if="allowBulkEdit">
          <DropdownMenuTrigger as-child>
            <Button
              variant="ghost"
              size="sm"
              class="text-primary-foreground hover:bg-primary-foreground/10"
              :disabled="disabled"
            >
              <Edit class="mr-2 h-4 w-4" />
              Quick Edit
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem @click="openBulkEdit('status')">
              <CheckCircle class="mr-2 h-4 w-4" />
              Update Status
            </DropdownMenuItem>
            
            <DropdownMenuItem @click="openBulkEdit('priority')">
              <AlertTriangle class="mr-2 h-4 w-4" />
              Update Priority
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            
            <DropdownMenuItem @click="openBulkEdit('assignee')">
              <User class="mr-2 h-4 w-4" />
              Assign Lawyer
            </DropdownMenuItem>
            
            <DropdownMenuItem @click="openBulkEdit('due-date')">
              <Calendar class="mr-2 h-4 w-4" />
              Set Due Date
            </DropdownMenuItem>
            
            <DropdownMenuItem @click="openBulkEdit('tags')">
              <Tag class="mr-2 h-4 w-4" />
              Manage Tags
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <!-- Export options -->
        <DropdownMenu v-if="allowBulkExport">
          <DropdownMenuTrigger as-child>
            <Button
              variant="ghost"
              size="sm"
              class="text-primary-foreground hover:bg-primary-foreground/10"
              :disabled="disabled"
            >
              <Download class="mr-2 h-4 w-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem @click="quickExport('csv')">
              <FileText class="mr-2 h-4 w-4" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem @click="quickExport('excel')">
              <FileText class="mr-2 h-4 w-4" />
              Export as Excel
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="showTemplateManager = true">
              <Settings class="mr-2 h-4 w-4" />
              Advanced Export...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <!-- Delete action -->
        <Button
          v-if="allowBulkDelete"
          variant="ghost"
          size="sm"
          class="text-destructive hover:bg-destructive/10"
          :disabled="disabled"
          @click="confirmDelete"
        >
          <Trash2 class="mr-2 h-4 w-4" />
          Delete
        </Button>

        <!-- Progress indicator for active operations -->
        <Button
          v-if="hasActiveOperations"
          variant="ghost"
          size="sm"
          class="text-primary-foreground hover:bg-primary-foreground/10"
          @click="showProgressTracker = true"
        >
          <div class="flex items-center gap-2">
            <div class="w-4 h-4">
              <Progress :value="operationProgress" class="h-2" />
            </div>
            <span class="text-xs">{{ Math.round(operationProgress) }}%</span>
          </div>
        </Button>
      </div>
    </div>
  </div>

  <!-- Export Template Manager -->
  <ExportTemplateManager
    :is-open="showTemplateManager"
    @template:select="exportWithTemplate"
    @close="showTemplateManager = false"
  />

  <!-- Operation Progress Tracker -->
  <OperationProgressTracker
    :operation-id="currentOperationId || undefined"
    :show-dialog="showProgressTracker"
    @operation:complete="handleOperationComplete"
    @operation:cancel="handleOperationCancel"
    @close="showProgressTracker = false"
  />

  <!-- Bulk Edit Dialog -->
  <Dialog v-model:open="showBulkEditDialog">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Bulk Edit {{ selectedCount }} Matter{{ selectedCount !== 1 ? 's' : '' }}</DialogTitle>
        <DialogDescription>
          Make changes to all selected matters at once
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <!-- Status update -->
        <div v-if="bulkEditForm.action === 'status'">
          <Label for="bulk-status">New Status</Label>
          <Select v-model="bulkEditForm.status">
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="status in statusOptions"
                :key="status.value"
                :value="status.value"
              >
                {{ status.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Priority update -->
        <div v-if="bulkEditForm.action === 'priority'">
          <Label for="bulk-priority">New Priority</Label>
          <Select v-model="bulkEditForm.priority">
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="priority in priorityOptions"
                :key="priority.value"
                :value="priority.value"
              >
                {{ priority.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Assignee update -->
        <div v-if="bulkEditForm.action === 'assignee'">
          <Label for="bulk-assignee">Assign to Lawyer</Label>
          <Select v-model="bulkEditForm.assigneeId">
            <SelectTrigger>
              <SelectValue placeholder="Select lawyer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lawyer1">John Doe</SelectItem>
              <SelectItem value="lawyer2">Jane Smith</SelectItem>
              <SelectItem value="lawyer3">Robert Johnson</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Due date update -->
        <div v-if="bulkEditForm.action === 'due-date'">
          <Label for="bulk-due-date">Due Date</Label>
          <Input
            v-model="bulkEditForm.dueDate"
            type="date"
            id="bulk-due-date"
          />
        </div>

        <!-- Tags update -->
        <div v-if="bulkEditForm.action === 'tags'">
          <Label>Tag Action</Label>
          <Select v-model="bulkEditForm.tagAction">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="add">Add Tags</SelectItem>
              <SelectItem value="remove">Remove Tags</SelectItem>
            </SelectContent>
          </Select>
          
          <div class="mt-2">
            <Label for="bulk-tags">Tags (comma-separated)</Label>
            <Input
              :model-value="bulkEditForm.tags.join(', ')"
              placeholder="urgent, priority, review"
              @input="bulkEditForm.tags = ($event.target as HTMLInputElement).value.split(',').map(t => t.trim()).filter(t => t.length > 0)"
            />
          </div>
        </div>

        <!-- Notes -->
        <div>
          <Label for="bulk-notes">Notes (optional)</Label>
          <Textarea
            v-model="bulkEditForm.notes"
            placeholder="Add notes about this bulk operation..."
            rows="2"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="showBulkEditDialog = false">
          Cancel
        </Button>
        <Button @click="executeBulkEdit">
          Update {{ selectedCount }} Matter{{ selectedCount !== 1 ? 's' : '' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Delete confirmation -->
  <AlertDialog v-model:open="showDeleteDialog">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete Selected Matters</AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to delete {{ selectedCount }} matter{{ selectedCount !== 1 ? 's' : '' }}? 
          This action cannot be undone and will permanently remove all associated data.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          @click="executeDelete"
        >
          Delete {{ selectedCount }} Matter{{ selectedCount !== 1 ? 's' : '' }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<style scoped>
.enhanced-bulk-toolbar {
  @apply sticky top-0 z-20 mb-4;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.operation-progress {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>
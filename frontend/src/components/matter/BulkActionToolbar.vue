<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
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
import type { Matter, MatterStatus } from '~/types/matter'

interface Props {
  selectedItems: Matter[]
  totalItems: number
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<{
  'action:delete': [items: Matter[]]
  'action:status-update': [items: Matter[], status: MatterStatus]
  'action:assign': [items: Matter[], assigneeId: string]
  'action:export': [items: Matter[], format: 'csv' | 'excel']
  'selection:clear': []
  'selection:all': []
}>()

const selectedCount = computed(() => props.selectedItems.length)
const isAllSelected = computed(() => 
  selectedCount.value > 0 && selectedCount.value === props.totalItems
)

const isPartialSelection = computed(() => 
  selectedCount.value > 0 && selectedCount.value < props.totalItems
)

const showDeleteDialog = ref(false)
const showStatusDialog = ref(false)
const pendingStatusChange = ref<MatterStatus | null>(null)

const statusOptions = [
  { label: 'Intake', value: 'INTAKE' as MatterStatus },
  { label: 'Initial Review', value: 'INITIAL_REVIEW' as MatterStatus },
  { label: 'In Progress', value: 'IN_PROGRESS' as MatterStatus },
  { label: 'Review', value: 'REVIEW' as MatterStatus },
  { label: 'Waiting Client', value: 'WAITING_CLIENT' as MatterStatus },
  { label: 'Ready Filing', value: 'READY_FILING' as MatterStatus },
  { label: 'Closed', value: 'CLOSED' as MatterStatus }
]

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    emit('selection:clear')
  } else {
    emit('selection:all')
  }
}

const confirmDelete = () => {
  emit('action:delete', props.selectedItems)
  showDeleteDialog.value = false
}

const initiateStatusChange = (status: MatterStatus) => {
  pendingStatusChange.value = status
  showStatusDialog.value = true
}

const confirmStatusChange = () => {
  if (pendingStatusChange.value) {
    emit('action:status-update', props.selectedItems, pendingStatusChange.value)
    showStatusDialog.value = false
    pendingStatusChange.value = null
  }
}

const exportSelected = (format: 'csv' | 'excel') => {
  emit('action:export', props.selectedItems, format)
}

const clearSelection = () => {
  emit('selection:clear')
}

const getStatusLabel = (status: MatterStatus) => {
  return statusOptions.find(opt => opt.value === status)?.label || status
}
</script>

<template>
  <div
    v-if="selectedCount > 0"
    class="bulk-action-toolbar bg-primary text-primary-foreground p-4 rounded-lg shadow-lg border border-primary/20"
  >
    <div class="flex items-center justify-between">
      <!-- Selection info and controls -->
      <div class="flex items-center gap-4">
        <!-- Select all checkbox -->
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
              <Icon 
                v-if="isAllSelected" 
                name="lucide:check" 
                class="h-3 w-3" 
              />
              <Icon 
                v-else-if="isPartialSelection" 
                name="lucide:minus" 
                class="h-3 w-3" 
              />
            </div>
            <span class="text-sm font-medium">
              {{ isAllSelected ? 'Deselect All' : 'Select All' }}
            </span>
          </div>
        </Button>

        <!-- Selection count -->
        <Badge variant="secondary" class="bg-primary-foreground/20 text-primary-foreground">
          {{ selectedCount }} of {{ totalItems }} selected
        </Badge>

        <!-- Clear selection -->
        <Button
          variant="ghost"
          size="sm"
          class="text-primary-foreground hover:bg-primary-foreground/10"
          @click="clearSelection"
        >
          <Icon name="lucide:x" class="mr-2 h-4 w-4" />
          Clear
        </Button>
      </div>

      <!-- Bulk actions -->
      <div class="flex items-center gap-2">
        <!-- Status update dropdown -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              variant="ghost"
              size="sm"
              class="text-primary-foreground hover:bg-primary-foreground/10"
              :disabled="disabled"
            >
              <Icon name="lucide:edit" class="mr-2 h-4 w-4" />
              Update Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              v-for="status in statusOptions"
              :key="status.value"
              @click="initiateStatusChange(status.value)"
            >
              {{ status.label }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <!-- Export dropdown -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              variant="ghost"
              size="sm"
              class="text-primary-foreground hover:bg-primary-foreground/10"
              :disabled="disabled"
            >
              <Icon name="lucide:download" class="mr-2 h-4 w-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem @click="exportSelected('csv')">
              <Icon name="lucide:file-text" class="mr-2 h-4 w-4" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem @click="exportSelected('excel')">
              <Icon name="lucide:file-spreadsheet" class="mr-2 h-4 w-4" />
              Export as Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenuSeparator />

        <!-- Delete action -->
        <Button
          variant="ghost"
          size="sm"
          class="text-destructive hover:bg-destructive/10"
          :disabled="disabled"
          @click="showDeleteDialog = true"
        >
          <Icon name="lucide:trash-2" class="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>

    <!-- Delete confirmation dialog -->
    <AlertDialog v-model:open="showDeleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Selected Matters</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {{ selectedCount }} matter{{ selectedCount !== 1 ? 's' : '' }}? 
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click="confirmDelete"
          >
            Delete {{ selectedCount }} Matter{{ selectedCount !== 1 ? 's' : '' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Status update confirmation dialog -->
    <AlertDialog v-model:open="showStatusDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Update Matter Status</AlertDialogTitle>
          <AlertDialogDescription>
            Change the status of {{ selectedCount }} matter{{ selectedCount !== 1 ? 's' : '' }} 
            to "{{ pendingStatusChange ? getStatusLabel(pendingStatusChange) : '' }}"?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="pendingStatusChange = null">Cancel</AlertDialogCancel>
          <AlertDialogAction @click="confirmStatusChange">
            Update Status
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<style scoped>
.bulk-action-toolbar {
  @apply sticky top-0 z-10 mb-4;
  animation: slideDown 0.2s ease-out;
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
</style>
<template>
  <Transition name="slide-up">
    <div v-if="hasSelection || batchOperation" class="batch-operation-bar">
      <!-- Selection Info -->
      <div class="selection-info">
        <Checkbox 
          :checked="allSelected"
          :indeterminate="someSelected && !allSelected"
          @update:checked="toggleSelectAll"
          :disabled="!!batchOperation"
        />
        <span class="selection-count">
          {{ selectionCount }} {{ selectionCount === 1 ? 'item' : 'items' }} selected
        </span>
        
        <Button
          v-if="!batchOperation"
          variant="ghost"
          size="sm"
          @click="clearSelection"
          class="ml-2"
        >
          Clear
        </Button>
      </div>
      
      <!-- Batch Actions -->
      <div v-if="!batchOperation" class="batch-actions">
        <Button 
          @click="startBatchMove" 
          variant="outline" 
          size="sm"
          :disabled="!canMove"
        >
          <FolderInput class="h-4 w-4 mr-2" />
          Move
        </Button>
        
        <Button 
          @click="startBatchDelete" 
          variant="outline" 
          size="sm"
          :disabled="!canDelete"
        >
          <Trash2 class="h-4 w-4 mr-2" />
          Delete
        </Button>
        
        <Button 
          @click="startBatchDownload" 
          variant="outline" 
          size="sm"
          :disabled="!canDownload"
        >
          <Download class="h-4 w-4 mr-2" />
          Download
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal class="h-4 w-4 mr-2" />
              More
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              @click="startBatchTag"
              :disabled="!canTag"
            >
              <Tag class="h-4 w-4 mr-2" />
              Add Tags
            </DropdownMenuItem>
            <DropdownMenuItem 
              @click="startBatchShare"
              :disabled="!canShare"
            >
              <Share2 class="h-4 w-4 mr-2" />
              Share
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              @click="exportSelection"
              :disabled="selectedDocuments.length === 0"
            >
              <FileDown class="h-4 w-4 mr-2" />
              Export List
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <!-- Batch Operation Progress -->
      <div v-else class="batch-progress">
        <div class="progress-info">
          <span class="progress-title">
            {{ getBatchOperationTitle() }}
          </span>
          <span class="progress-status">
            {{ getBatchOperationStatus() }}
          </span>
        </div>
        
        <Progress 
          :value="batchOperation.progress" 
          class="w-48"
        />
        
        <Button
          v-if="batchOperation.status === 'confirming'"
          variant="default"
          size="sm"
          @click="confirmBatchOperation"
        >
          Confirm
        </Button>
        
        <Button
          v-if="batchOperation.status !== 'complete'"
          variant="outline"
          size="sm"
          @click="cancelBatchOperation"
        >
          Cancel
        </Button>
        
        <Button
          v-if="batchOperation.status === 'complete'"
          variant="ghost"
          size="sm"
          @click="closeBatchOperation"
        >
          <X class="h-4 w-4" />
        </Button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  FolderInput, 
  Trash2, 
  Download, 
  MoreHorizontal,
  Tag,
  Share2,
  FileDown,
  X
} from 'lucide-vue-next'

// UI Components
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import { Progress } from '~/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'

// Store
import { useDocumentOrganizationStore } from '~/stores/documentOrganization'
import { storeToRefs } from 'pinia'

// Types
import type { Document } from '~/types/document'

interface Props {
  documents: Document[]
  allSelected: boolean
  someSelected: boolean
}

interface Emits {
  (e: 'toggle-select-all', checked: boolean): void
  (e: 'batch-move'): void
  (e: 'batch-delete'): void
  (e: 'batch-download'): void
  (e: 'batch-tag'): void
  (e: 'batch-share'): void
  (e: 'export-list'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Store
const store = useDocumentOrganizationStore()
const {
  selectedDocuments,
  selectedFolders,
  batchOperation,
  hasSelection,
  selectionCount
} = storeToRefs(store)

// Computed
const canMove = computed(() => {
  // Can move if any items are selected and user has write permission
  return hasSelection.value
})

const canDelete = computed(() => {
  // Can delete if user has delete permission on all selected items
  return hasSelection.value
})

const canDownload = computed(() => {
  // Can only download documents, not folders
  return selectedDocuments.value.length > 0
})

const canTag = computed(() => {
  // Can only tag documents
  return selectedDocuments.value.length > 0
})

const canShare = computed(() => {
  // Can share both documents and folders
  return hasSelection.value
})

// Methods
const toggleSelectAll = (checked: boolean) => {
  emit('toggle-select-all', checked)
}

const clearSelection = () => {
  store.clearSelection()
}

const startBatchMove = () => {
  emit('batch-move')
}

const startBatchDelete = () => {
  emit('batch-delete')
}

const startBatchDownload = () => {
  emit('batch-download')
}

const startBatchTag = () => {
  emit('batch-tag')
}

const startBatchShare = () => {
  emit('batch-share')
}

const exportSelection = () => {
  emit('export-list')
}

const confirmBatchOperation = () => {
  store.executeBatchOperation()
}

const cancelBatchOperation = () => {
  store.cancelBatchOperation()
}

const closeBatchOperation = () => {
  store.cancelBatchOperation()
}

const getBatchOperationTitle = () => {
  if (!batchOperation.value) return ''
  
  const count = batchOperation.value.items.length
  const itemText = count === 1 ? 'item' : 'items'
  
  switch (batchOperation.value.type) {
    case 'move':
      return `Moving ${count} ${itemText}`
    case 'delete':
      return `Deleting ${count} ${itemText}`
    case 'download':
      return `Downloading ${count} ${itemText}`
    case 'tag':
      return `Tagging ${count} ${itemText}`
    default:
      return `Processing ${count} ${itemText}`
  }
}

const getBatchOperationStatus = () => {
  if (!batchOperation.value) return ''
  
  switch (batchOperation.value.status) {
    case 'confirming':
      return 'Waiting for confirmation...'
    case 'processing':
      return `${Math.round(batchOperation.value.progress || 0)}% complete`
    case 'complete':
      return 'Complete!'
    case 'error':
      return batchOperation.value.error || 'Operation failed'
    default:
      return ''
  }
}
</script>

<style scoped>
.batch-operation-bar {
  @apply flex items-center justify-between px-4 py-3;
  @apply bg-accent border-y;
  @apply transition-all duration-200;
}

.selection-info {
  @apply flex items-center gap-3;
}

.selection-count {
  @apply text-sm font-medium;
}

.batch-actions {
  @apply flex items-center gap-2;
}

.batch-progress {
  @apply flex items-center gap-4 flex-1;
}

.progress-info {
  @apply flex flex-col flex-1;
}

.progress-title {
  @apply text-sm font-medium;
}

.progress-status {
  @apply text-xs text-muted-foreground;
}

/* Slide up animation */
.slide-up-enter-active,
.slide-up-leave-active {
  @apply transition-all duration-200 ease-out;
}

.slide-up-enter-from {
  @apply transform translate-y-full opacity-0;
}

.slide-up-leave-to {
  @apply transform translate-y-full opacity-0;
}

/* Mobile adjustments */
@media (max-width: 640px) {
  .batch-operation-bar {
    @apply flex-col items-start gap-3;
  }
  
  .batch-actions {
    @apply w-full justify-start flex-wrap;
  }
  
  .batch-progress {
    @apply flex-col items-start gap-2 w-full;
  }
  
  .batch-progress .progress {
    @apply w-full;
  }
}
</style>
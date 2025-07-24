<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>{{ options?.title || 'Select Folder' }}</DialogTitle>
        <DialogDescription v-if="options?.description">
          {{ options.description }}
        </DialogDescription>
      </DialogHeader>
      
      <div class="folder-selector-content">
        <!-- Search -->
        <div class="mb-4">
          <div class="relative">
            <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              v-model="searchQuery"
              placeholder="Search folders..."
              class="pl-8"
            />
          </div>
        </div>
        
        <!-- Folder Tree -->
        <ScrollArea class="h-[300px] pr-4">
          <div v-if="loading" class="loading-state">
            Loading folders...
          </div>
          
          <div v-else-if="filteredFolders.length === 0" class="empty-state">
            <Folder class="h-8 w-8 text-muted-foreground mb-2" />
            <p class="text-sm text-muted-foreground">
              {{ searchQuery ? 'No folders found' : 'No folders available' }}
            </p>
          </div>
          
          <div v-else class="folder-tree">
            <!-- Root level option -->
            <div
              v-if="options?.allowRoot"
              class="folder-item root-folder"
              :class="{ selected: selectedFolderId === null }"
              @click="selectFolder(null)"
            >
              <Home class="h-4 w-4" />
              <span>Root / All Documents</span>
            </div>
            
            <!-- Folder nodes -->
            <FolderSelectorNode
              v-for="folder in filteredFolders"
              :key="folder.id"
              :folder="folder"
              :selected-id="selectedFolderId"
              :excluded-ids="options?.excludeFolders || []"
              :expanded-ids="expandedFolders"
              @select="selectFolder"
              @toggle="toggleFolder"
            />
          </div>
        </ScrollArea>
        
        <!-- Selected folder info -->
        <div v-if="selectedFolder || (selectedFolderId === null && options?.allowRoot)" 
             class="selected-info">
          <div class="text-sm text-muted-foreground">Selected:</div>
          <div class="font-medium">
            {{ selectedFolder ? getFullPath(selectedFolder) : 'Root / All Documents' }}
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <Button
          variant="outline"
          @click="handleCancel"
        >
          Cancel
        </Button>
        <Button
          @click="handleConfirm"
          :disabled="!canConfirm"
        >
          Select Folder
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Search, Folder, Home } from 'lucide-vue-next'

// UI Components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { ScrollArea } from '~/components/ui/scroll-area'

// Store
import { useDocumentOrganizationStore } from '~/stores/documentOrganization'
import { storeToRefs } from 'pinia'

// Components
import FolderSelectorNode from './FolderSelectorNode.vue'

// Types
import type { FolderNode } from '~/types/folder'

interface FolderSelectorOptions {
  title: string
  description?: string
  excludeFolders?: string[]
  allowRoot?: boolean
}

interface Props {
  open: boolean
  options: FolderSelectorOptions | null
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'select', folderId: string | null): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Store
const store = useDocumentOrganizationStore()
const { folders, loading } = storeToRefs(store)

// Local state
const searchQuery = ref('')
const selectedFolderId = ref<string | null>(null)
const expandedFolders = ref<Set<string>>(new Set())

// Computed
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const rootFolders = computed(() => 
  folders.value.filter(f => f.parentId === null)
)

const filteredFolders = computed(() => {
  if (!searchQuery.value) return rootFolders.value
  
  const query = searchQuery.value.toLowerCase()
  return filterFoldersRecursive(rootFolders.value, query)
})

const selectedFolder = computed(() => 
  selectedFolderId.value ? store.findFolderById(selectedFolderId.value) : null
)

const canConfirm = computed(() => {
  if (props.options?.allowRoot && selectedFolderId.value === null) {
    return true
  }
  return selectedFolderId.value !== null
})

// Methods
function filterFoldersRecursive(folders: FolderNode[], query: string): FolderNode[] {
  const result: FolderNode[] = []
  
  for (const folder of folders) {
    const matchesQuery = folder.name.toLowerCase().includes(query)
    const isExcluded = props.options?.excludeFolders?.includes(folder.id)
    
    const filteredChildren = filterFoldersRecursive(folder.children, query)
    
    if (!isExcluded && (matchesQuery || filteredChildren.length > 0)) {
      result.push({
        ...folder,
        children: filteredChildren
      })
      
      // Auto-expand folders with matching children
      if (filteredChildren.length > 0) {
        expandedFolders.value.add(folder.id)
      }
    }
  }
  
  return result
}

function getFullPath(folder: FolderNode): string {
  const path: string[] = [folder.name]
  let current = folder
  
  while (current.parentId) {
    const parent = store.findFolderById(current.parentId)
    if (!parent) break
    path.unshift(parent.name)
    current = parent
  }
  
  return path.join(' / ')
}

function selectFolder(folderId: string | null) {
  selectedFolderId.value = folderId
}

function toggleFolder(folderId: string) {
  if (expandedFolders.value.has(folderId)) {
    expandedFolders.value.delete(folderId)
  } else {
    expandedFolders.value.add(folderId)
  }
}

function handleConfirm() {
  emit('select', selectedFolderId.value)
  isOpen.value = false
}

function handleCancel() {
  isOpen.value = false
}

// Reset state when dialog opens
watch(isOpen, (open) => {
  if (open) {
    searchQuery.value = ''
    selectedFolderId.value = null
    expandedFolders.value.clear()
    
    // Load folders if needed
    if (folders.value.length === 0) {
      store.loadFolders()
    }
  }
})
</script>

<style scoped>
.folder-selector-content {
  @apply space-y-4;
}

.loading-state,
.empty-state {
  @apply flex flex-col items-center justify-center py-8;
}

.folder-tree {
  @apply space-y-1;
}

.folder-item {
  @apply flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer;
  @apply hover:bg-accent/50 transition-colors;
}

.folder-item.selected {
  @apply bg-accent;
}

.folder-item.root-folder {
  @apply mb-2 pb-2 border-b;
}

.selected-info {
  @apply p-3 bg-muted rounded-md;
}
</style>
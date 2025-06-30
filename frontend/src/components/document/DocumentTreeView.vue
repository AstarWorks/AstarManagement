<template>
  <div class="document-tree-view">
    <!-- Tree Header -->
    <div class="tree-header">
      <div class="tree-title">
        <FolderTree class="h-4 w-4" />
        <span>Folders</span>
      </div>
      
      <Button 
        @click="createRootFolder" 
        size="sm" 
        variant="ghost"
        class="create-folder-button"
      >
        <FolderPlus class="h-4 w-4" />
      </Button>
    </div>
    
    <!-- Quick Access -->
    <div v-if="showQuickAccess" class="quick-access">
      <!-- Favorites -->
      <div v-if="favoriteFolders.length > 0" class="quick-section">
        <div class="quick-section-title">
          <Star class="h-3 w-3" />
          <span>Favorites</span>
        </div>
        <div class="quick-items">
          <button
            v-for="folderId in favoriteFolders"
            :key="`fav-${folderId}`"
            @click="selectFolder(folderId)"
            class="quick-item"
            :class="{ active: currentFolder === folderId }"
          >
            <Folder class="h-3 w-3" />
            <span>{{ getFolderName(folderId) }}</span>
          </button>
        </div>
      </div>
      
      <!-- Recent -->
      <div v-if="recentFolders.length > 0" class="quick-section">
        <div class="quick-section-title">
          <Clock class="h-3 w-3" />
          <span>Recent</span>
        </div>
        <div class="quick-items">
          <button
            v-for="folderId in recentFoldersLimited"
            :key="`recent-${folderId}`"
            @click="selectFolder(folderId)"
            class="quick-item"
            :class="{ active: currentFolder === folderId }"
          >
            <Folder class="h-3 w-3" />
            <span>{{ getFolderName(folderId) }}</span>
          </button>
        </div>
      </div>
    </div>
    
    <Separator v-if="showQuickAccess" class="my-2" />
    
    <!-- Search -->
    <div v-if="showSearch" class="tree-search">
      <div class="relative">
        <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="Search folders..."
          class="pl-8 h-9"
        />
      </div>
    </div>
    
    <!-- Tree Content -->
    <ScrollArea class="tree-content">
      <div v-if="loading" class="loading-state">
        <div class="animate-pulse space-y-2">
          <div v-for="i in 3" :key="i" class="flex items-center gap-2 p-2">
            <div class="w-4 h-4 bg-muted rounded" />
            <div class="flex-1 h-4 bg-muted rounded" />
          </div>
        </div>
      </div>
      
      <div v-else-if="error" class="error-state">
        <AlertCircle class="h-4 w-4" />
        <span>{{ error }}</span>
        <Button size="sm" variant="outline" @click="loadFolders">
          Retry
        </Button>
      </div>
      
      <div v-else-if="filteredFolders.length === 0" class="empty-state">
        <Folder class="h-8 w-8 text-muted-foreground" />
        <p class="text-sm text-muted-foreground">
          {{ searchQuery ? 'No folders found' : 'No folders yet' }}
        </p>
        <Button 
          v-if="!searchQuery"
          size="sm" 
          variant="outline" 
          @click="createRootFolder"
          class="mt-2"
        >
          Create First Folder
        </Button>
      </div>
      
      <div v-else class="folder-tree">
        <FolderNode
          v-for="folder in filteredFolders"
          :key="folder.id"
          :folder="folder"
          :expanded="expandedFolders"
          :selected="currentFolder"
          :favorites="favoriteFolders"
          @toggle="toggleFolder"
          @select="selectFolder"
          @drop="handleDrop"
          @context-menu="handleContextMenu"
          @create-subfolder="createSubfolder"
          @rename="renameFolder"
          @delete="deleteFolder"
          @share="shareFolder"
          @toggle-favorite="toggleFavorite"
        />
      </div>
    </ScrollArea>
    
    <!-- Footer Stats -->
    <div v-if="showStats" class="tree-footer">
      <div class="text-xs text-muted-foreground">
        {{ folderCount }} folder{{ folderCount !== 1 ? 's' : '' }}
        <span v-if="totalDocuments > 0">
          • {{ totalDocuments }} document{{ totalDocuments !== 1 ? 's' : '' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { 
  FolderTree, 
  FolderPlus, 
  Folder,
  Star,
  Clock,
  Search,
  AlertCircle
} from 'lucide-vue-next'

// UI Components
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Separator } from '~/components/ui/separator'

// Store
import { useDocumentOrganizationStore } from '~/stores/documentOrganization'
import { storeToRefs } from 'pinia'

// Components
import FolderNode from './FolderNode.vue'

// Types
import type { FolderNode as FolderNodeType, DraggedItem } from '~/types/folder'

interface Props {
  showQuickAccess?: boolean
  showSearch?: boolean
  showStats?: boolean
  maxRecentFolders?: number
}

interface Emits {
  (e: 'folder-selected', folder: FolderNodeType | null): void
  (e: 'create-folder', parentId: string | null): void
  (e: 'context-menu', data: { folder: FolderNodeType; event: MouseEvent }): void
}

const props = withDefaults(defineProps<Props>(), {
  showQuickAccess: true,
  showSearch: true,
  showStats: true,
  maxRecentFolders: 5
})

const emit = defineEmits<Emits>()

// Store
const store = useDocumentOrganizationStore()

// Local state
const searchQuery = ref('')

// Computed
const {
  rootFolders,
  expandedFolders,
  currentFolderId: currentFolder,
  recentFolders,
  favoritesFolders: favoriteFolders,
  loading,
  error
} = storeToRefs(store)

const recentFoldersLimited = computed(() => 
  recentFolders.value.slice(0, props.maxRecentFolders)
)

const filteredFolders = computed(() => {
  if (!searchQuery.value) return rootFolders.value
  
  const query = searchQuery.value.toLowerCase()
  return filterFoldersRecursive(rootFolders.value, query)
})

const folderCount = computed(() => countFoldersRecursive(rootFolders.value))

const totalDocuments = computed(() => 
  rootFolders.value.reduce((sum, folder) => sum + folder.documentCount, 0)
)

// Helper functions
function filterFoldersRecursive(folders: FolderNodeType[], query: string): FolderNodeType[] {
  const result: FolderNodeType[] = []
  
  for (const folder of folders) {
    const matchesQuery = folder.name.toLowerCase().includes(query)
    const filteredChildren = filterFoldersRecursive(folder.children, query)
    
    if (matchesQuery || filteredChildren.length > 0) {
      result.push({
        ...folder,
        children: filteredChildren
      })
      
      // Auto-expand folders with matching children
      if (filteredChildren.length > 0 && !expandedFolders.value.has(folder.id)) {
        store.toggleFolderExpanded(folder.id)
      }
    }
  }
  
  return result
}

function countFoldersRecursive(folders: FolderNodeType[]): number {
  let count = folders.length
  for (const folder of folders) {
    count += countFoldersRecursive(folder.children)
  }
  return count
}

function getFolderName(folderId: string): string {
  const folder = store.findFolderById(folderId)
  return folder?.name ?? 'Unknown'
}

// Event handlers
const toggleFolder = (folderId: string) => {
  store.toggleFolderExpanded(folderId)
}

const selectFolder = (folderId: string) => {
  store.selectFolder(folderId)
  const folder = store.findFolderById(folderId)
  emit('folder-selected', folder ?? null)
}

const handleDrop = async ({ item, targetId }: { item: DraggedItem; targetId: string }) => {
  try {
    await store.moveItems(item, targetId)
  } catch (err) {
    console.error('Failed to move items:', err)
  }
}

const handleContextMenu = (data: { folder: FolderNodeType; event: MouseEvent }) => {
  emit('context-menu', data)
}

const createRootFolder = () => {
  emit('create-folder', null)
}

const createSubfolder = (parentId: string) => {
  emit('create-folder', parentId)
}

const renameFolder = (folderId: string) => {
  // TODO: Implement inline rename or modal
  console.log('Rename folder:', folderId)
}

const deleteFolder = async (folderId: string) => {
  // TODO: Show confirmation dialog
  try {
    await store.deleteFolder(folderId)
  } catch (err) {
    console.error('Failed to delete folder:', err)
  }
}

const shareFolder = (folderId: string) => {
  // TODO: Implement share dialog
  console.log('Share folder:', folderId)
}

const toggleFavorite = (folderId: string) => {
  store.toggleFavorite(folderId)
}

const loadFolders = () => {
  store.loadFolders()
}

// Lifecycle
onMounted(() => {
  if (rootFolders.value.length === 0) {
    loadFolders()
  }
})

// Watch for folder selection changes
watch(currentFolder, (folderId) => {
  const folder = folderId ? store.findFolderById(folderId) ?? null : null
  emit('folder-selected', folder)
})
</script>

<style scoped>
.document-tree-view {
  @apply flex flex-col h-full bg-background border-r;
  @apply w-64 min-w-[200px] max-w-[320px];
}

.tree-header {
  @apply flex items-center justify-between p-3 border-b;
}

.tree-title {
  @apply flex items-center gap-2 text-sm font-medium;
}

.create-folder-button {
  @apply h-8 w-8;
}

/* Quick Access */
.quick-access {
  @apply px-3 py-2 space-y-3;
}

.quick-section-title {
  @apply flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1;
}

.quick-items {
  @apply space-y-0.5;
}

.quick-item {
  @apply flex items-center gap-2 w-full px-2 py-1 text-sm rounded;
  @apply hover:bg-accent/50 transition-colors text-left;
}

.quick-item.active {
  @apply bg-accent;
}

.quick-item span {
  @apply truncate;
}

/* Search */
.tree-search {
  @apply px-3 py-2;
}

/* Tree Content */
.tree-content {
  @apply flex-1 px-2 py-2;
}

.folder-tree {
  @apply space-y-0.5;
}

/* States */
.loading-state,
.error-state,
.empty-state {
  @apply flex flex-col items-center justify-center p-8 text-center;
}

.error-state {
  @apply space-y-2 text-destructive;
}

.empty-state {
  @apply space-y-2;
}

/* Footer */
.tree-footer {
  @apply px-3 py-2 border-t;
}

/* Responsive */
@media (max-width: 768px) {
  .document-tree-view {
    @apply w-full max-w-none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .folder-tree {
    @apply border border-border rounded;
  }
}
</style>
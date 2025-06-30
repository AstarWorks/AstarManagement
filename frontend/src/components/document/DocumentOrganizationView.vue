<template>
  <div class="document-organization-view">
    <!-- Split Layout -->
    <div class="organization-layout">
      <!-- Folder Tree Sidebar -->
      <aside 
        v-if="showFolderTree" 
        class="folder-sidebar"
        :class="{ 'collapsed': isSidebarCollapsed }"
      >
        <DocumentTreeView
          :show-quick-access="true"
          :show-search="true"
          :show-stats="true"
          @folder-selected="handleFolderSelected"
          @create-folder="handleCreateFolder"
          @context-menu="handleFolderContextMenu"
        />
        
        <!-- Collapse Toggle -->
        <button
          class="sidebar-toggle"
          @click="isSidebarCollapsed = !isSidebarCollapsed"
          :aria-label="isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        >
          <ChevronLeft :class="{ 'rotate-180': isSidebarCollapsed }" />
        </button>
      </aside>
      
      <!-- Main Content -->
      <main class="organization-content">
        <!-- Breadcrumb Navigation -->
        <DocumentBreadcrumbs
          @navigate="handleNavigate"
          @create-folder="handleCreateFolder"
          @folder-settings="handleFolderSettings"
        />
        
        <!-- Batch Operation Bar -->
        <BatchOperationBar
          :documents="filteredDocuments"
          :all-selected="allSelected"
          :some-selected="someSelected"
          @toggle-select-all="toggleSelectAll"
          @batch-move="handleBatchMove"
          @batch-delete="handleBatchDelete"
          @batch-download="handleBatchDownload"
          @batch-tag="handleBatchTag"
          @batch-share="handleBatchShare"
          @export-list="handleExportList"
        />
        
        <!-- Document List with Organization Features -->
        <div class="document-list-container">
          <DocumentListView
            :matter-id="matterId"
            :folder-id="currentFolderId"
            :enable-bulk-actions="true"
            :enable-filters="true"
            :enable-drag-drop="true"
            :page-size="50"
            @document-action="handleDocumentAction"
            @upload-documents="handleUploadDocuments"
            @selection-change="handleSelectionChange"
            @drag-start="handleDragStart"
            @drag-end="handleDragEnd"
          />
        </div>
      </main>
    </div>
    
    <!-- Modals -->
    <CreateFolderDialog
      v-model:open="showCreateFolderDialog"
      :parent-folder-id="createFolderParentId"
      @create="handleFolderCreated"
    />
    
    <FolderSelectorDialog
      v-model:open="showFolderSelectorDialog"
      :options="folderSelectorOptions"
      @select="handleFolderSelectorResult"
    />
    
    <ConfirmDialog
      v-model:open="showConfirmDialog"
      :options="confirmOptions"
      @confirm="handleConfirmResult"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, toRefs } from 'vue'
import { ChevronLeft } from 'lucide-vue-next'

// Components
import DocumentTreeView from './DocumentTreeView.vue'
import DocumentBreadcrumbs from './DocumentBreadcrumbs.vue'
import BatchOperationBar from './BatchOperationBar.vue'
import DocumentListView from './DocumentListView.vue'
import CreateFolderDialog from './dialogs/CreateFolderDialog.vue'
import FolderSelectorDialog from './dialogs/FolderSelectorDialog.vue'
import ConfirmDialog from './dialogs/ConfirmDialog.vue'

// Composables
import { useDocumentDragDrop } from '~/composables/useDocumentDragDrop'
import { useBatchOperations } from '~/composables/useBatchOperations'
import { useDocumentListView } from '~/composables/useDocumentListView'

// Store
import { useDocumentOrganizationStore } from '~/stores/documentOrganization'
import { storeToRefs } from 'pinia'

// Types
import type { Document, DocumentAction } from '~/types/document'
import type { FolderNode } from '~/types/folder'

interface Props {
  matterId?: string
  showFolderTree?: boolean
  initialFolderId?: string
}

interface Emits {
  (e: 'folder-changed', folder: FolderNode | null): void
  (e: 'document-action', action: DocumentAction, document: Document): void
}

const props = withDefaults(defineProps<Props>(), {
  showFolderTree: true
})

const emit = defineEmits<Emits>()

// Store
const organizationStore = useDocumentOrganizationStore()
const { currentFolderId, selectedDocuments } = storeToRefs(organizationStore)

// Composables
const { handleDragStart, handleDragEnd } = useDocumentDragDrop()
const batchOps = useBatchOperations()

// Local state
const isSidebarCollapsed = ref(false)
const showCreateFolderDialog = ref(false)
const createFolderParentId = ref<string | null>(null)

// Use document list composable
const { documents, loading, refreshDocuments } = useDocumentListView(props.matterId)

// Computed
const filteredDocuments = computed(() => {
  if (!currentFolderId.value) return documents.value
  
  // Filter documents by current folder
  // In a real app, this would be handled by the API
  return documents.value.filter(doc => {
    // Mock folder association
    return true // Show all for now
  })
})

const allSelected = computed(() => {
  return filteredDocuments.value.length > 0 && 
         filteredDocuments.value.every(doc => selectedDocuments.value.includes(doc.id))
})

const someSelected = computed(() => {
  return selectedDocuments.value.length > 0 && !allSelected.value
})

// Re-export batch operation state for templates
const {
  showConfirmDialog,
  showFolderSelector: showFolderSelectorDialog,
  confirmOptions,
  folderSelectorOptions
} = toRefs(batchOps)

// Event handlers
const handleFolderSelected = (folder: FolderNode | null) => {
  emit('folder-changed', folder)
  refreshDocuments()
}

const handleNavigate = (folderId: string | null) => {
  organizationStore.selectFolder(folderId)
  refreshDocuments()
}

const handleCreateFolder = (parentId: string | null) => {
  createFolderParentId.value = parentId
  showCreateFolderDialog.value = true
}

const handleFolderCreated = async (folder: FolderNode) => {
  showCreateFolderDialog.value = false
  organizationStore.selectFolder(folder.id)
  refreshDocuments()
}

const handleFolderSettings = (folderId: string) => {
  // TODO: Implement folder settings dialog
  console.log('Folder settings:', folderId)
}

const handleFolderContextMenu = (data: { folder: FolderNode; event: MouseEvent }) => {
  // TODO: Implement context menu
  console.log('Context menu for folder:', data.folder.name)
}

const handleDocumentAction = (action: DocumentAction, document: Document) => {
  emit('document-action', action, document)
}

const handleUploadDocuments = () => {
  // TODO: Open upload dialog with current folder as destination
  console.log('Upload to folder:', currentFolderId.value)
}

const handleSelectionChange = (documents: Document[]) => {
  organizationStore.selectedDocuments = documents.map(d => d.id)
}

const toggleSelectAll = (checked: boolean) => {
  if (checked) {
    organizationStore.toggleSelectAll(filteredDocuments.value)
  } else {
    organizationStore.clearSelection()
  }
}

// Batch operations
const handleBatchMove = async () => {
  const items = [...organizationStore.selectedDocuments, ...organizationStore.selectedFolders]
  await batchOps.batchMove(items)
}

const handleBatchDelete = async () => {
  const items = [...organizationStore.selectedDocuments, ...organizationStore.selectedFolders]
  await batchOps.confirmBatchDelete(items)
}

const handleBatchDownload = async () => {
  await batchOps.batchDownload(organizationStore.selectedDocuments)
}

const handleBatchTag = async () => {
  await batchOps.batchTag(organizationStore.selectedDocuments)
}

const handleBatchShare = async () => {
  const items = [...organizationStore.selectedDocuments, ...organizationStore.selectedFolders]
  await batchOps.batchShare(items)
}

const handleExportList = async () => {
  const items = [...organizationStore.selectedDocuments, ...organizationStore.selectedFolders]
  await batchOps.exportList(items)
}

// Dialog handlers
const handleConfirmResult = (confirmed: boolean) => {
  batchOps.handleConfirm(confirmed)
}

const handleFolderSelectorResult = (folderId: string | null) => {
  batchOps.handleFolderSelect(folderId)
}

// Initialize
onMounted(() => {
  if (props.initialFolderId) {
    organizationStore.selectFolder(props.initialFolderId)
  }
  
  // Load folders if not already loaded
  if (organizationStore.folders.length === 0) {
    organizationStore.loadFolders()
  }
})

// Watch for folder changes
watch(currentFolderId, () => {
  refreshDocuments()
})
</script>

<style scoped>
.document-organization-view {
  @apply h-full flex flex-col bg-background;
}

.organization-layout {
  @apply flex flex-1 overflow-hidden;
}

/* Sidebar */
.folder-sidebar {
  @apply relative flex-shrink-0 transition-all duration-300;
  @apply border-r bg-muted/20;
  width: 280px;
}

.folder-sidebar.collapsed {
  width: 0;
  overflow: hidden;
}

.sidebar-toggle {
  @apply absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2;
  @apply w-6 h-12 bg-background border rounded-full;
  @apply flex items-center justify-center;
  @apply hover:bg-accent transition-colors;
  @apply focus:outline-none focus:ring-2 focus:ring-ring;
  z-index: 10;
}

.sidebar-toggle svg {
  @apply h-3 w-3 transition-transform;
}

/* Main content */
.organization-content {
  @apply flex-1 flex flex-col overflow-hidden;
}

.document-list-container {
  @apply flex-1 overflow-hidden;
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .folder-sidebar {
    @apply absolute inset-y-0 left-0 z-20;
    @apply shadow-lg;
  }
  
  .folder-sidebar.collapsed {
    @apply -translate-x-full;
  }
  
  .sidebar-toggle {
    @apply translate-x-full;
  }
}

/* Animation */
.rotate-180 {
  @apply transform rotate-180;
}
</style>
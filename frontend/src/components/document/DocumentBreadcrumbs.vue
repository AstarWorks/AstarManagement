<template>
  <nav 
    class="document-breadcrumbs"
    :aria-label="ariaLabel"
  >
    <ol class="breadcrumb-list">
      <!-- Root/Home -->
      <li class="breadcrumb-item">
        <Button 
          @click="navigateToRoot" 
          variant="ghost" 
          size="sm"
          class="breadcrumb-button"
          :disabled="!currentFolder"
        >
          <Home class="h-4 w-4" />
          <span v-if="showLabels" class="ml-1.5">{{ rootLabel }}</span>
        </Button>
      </li>
      
      <!-- Path items -->
      <template v-for="(folder, index) in breadcrumbPath" :key="folder.id">
        <li class="breadcrumb-separator">
          <ChevronRight class="h-4 w-4" />
        </li>
        <li class="breadcrumb-item">
          <Button
            @click="navigateToFolder(folder.id)"
            variant="ghost"
            size="sm"
            class="breadcrumb-button"
            :disabled="index === breadcrumbPath.length - 1"
          >
            <Folder 
              v-if="showIcons" 
              class="h-4 w-4 mr-1.5" 
              :style="{ color: getFolderColor(folder.id) }"
            />
            <span class="breadcrumb-text">{{ folder.name }}</span>
          </Button>
        </li>
      </template>
      
      <!-- Extra items indicator -->
      <li v-if="hasHiddenItems" class="breadcrumb-item">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              class="breadcrumb-button"
            >
              <MoreHorizontal class="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              v-for="folder in hiddenItems"
              :key="folder.id"
              @click="navigateToFolder(folder.id)"
            >
              <Folder class="h-4 w-4 mr-2" />
              {{ folder.name }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </li>
    </ol>
    
    <!-- Quick Actions -->
    <div v-if="showActions" class="breadcrumb-actions">
      <Button
        v-if="canCreateFolder"
        @click="$emit('create-folder', currentFolder)"
        variant="ghost"
        size="sm"
        class="action-button"
        title="Create subfolder"
      >
        <FolderPlus class="h-4 w-4" />
      </Button>
      
      <Button
        v-if="currentFolder"
        @click="$emit('folder-settings', currentFolder)"
        variant="ghost"
        size="sm"
        class="action-button"
        title="Folder settings"
      >
        <Settings class="h-4 w-4" />
      </Button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  Home, 
  ChevronRight, 
  Folder,
  FolderPlus,
  Settings,
  MoreHorizontal
} from 'lucide-vue-next'

// UI Components
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'

// Store
import { useDocumentOrganizationStore } from '~/stores/documentOrganization'

// Types
import type { FolderPath } from '~/types/folder'

interface Props {
  rootLabel?: string
  showLabels?: boolean
  showIcons?: boolean
  showActions?: boolean
  maxVisibleItems?: number
  ariaLabel?: string
}

interface Emits {
  (e: 'navigate', folderId: string | null): void
  (e: 'create-folder', parentId: string | null): void
  (e: 'folder-settings', folderId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  rootLabel: 'All Documents',
  showLabels: true,
  showIcons: true,
  showActions: true,
  maxVisibleItems: 4,
  ariaLabel: 'Folder navigation'
})

const emit = defineEmits<Emits>()

// Store
const store = useDocumentOrganizationStore()
const { breadcrumbPath, currentFolderId: currentFolder } = storeToRefs(store)

// Computed
const visiblePath = computed(() => {
  if (breadcrumbPath.value.length <= props.maxVisibleItems) {
    return breadcrumbPath.value
  }
  
  // Show first item, ellipsis, and last N-1 items
  return [
    breadcrumbPath.value[0],
    ...breadcrumbPath.value.slice(-(props.maxVisibleItems - 1))
  ]
})

const hiddenItems = computed(() => {
  if (breadcrumbPath.value.length <= props.maxVisibleItems) {
    return []
  }
  
  return breadcrumbPath.value.slice(1, -(props.maxVisibleItems - 1))
})

const hasHiddenItems = computed(() => hiddenItems.value.length > 0)

const canCreateFolder = computed(() => {
  if (!currentFolder.value) return true // Can create root folders
  
  const folder = store.findFolderById(currentFolder.value)
  return folder?.permissions.canWrite ?? false
})

// Methods
const navigateToRoot = () => {
  emit('navigate', null)
  store.selectFolder(null)
}

const navigateToFolder = (folderId: string) => {
  emit('navigate', folderId)
  store.selectFolder(folderId)
}

const getFolderColor = (folderId: string) => {
  const folder = store.findFolderById(folderId)
  return folder?.metadata.color
}
</script>

<style scoped>
.document-breadcrumbs {
  @apply flex items-center justify-between;
  @apply px-4 py-2 border-b bg-background/95 backdrop-blur;
  @apply min-h-[48px];
}

.breadcrumb-list {
  @apply flex items-center flex-1 min-w-0;
  @apply overflow-x-auto scrollbar-hide;
}

.breadcrumb-item {
  @apply flex items-center flex-shrink-0;
}

.breadcrumb-separator {
  @apply flex items-center text-muted-foreground/50 mx-1;
}

.breadcrumb-button {
  @apply h-8 px-2;
  @apply hover:bg-accent;
}

.breadcrumb-text {
  @apply max-w-[200px] truncate;
}

.breadcrumb-actions {
  @apply flex items-center gap-1 ml-4 flex-shrink-0;
}

.action-button {
  @apply h-8 w-8;
}

/* Mobile adjustments */
@media (max-width: 640px) {
  .document-breadcrumbs {
    @apply px-2;
  }
  
  .breadcrumb-text {
    @apply max-w-[120px];
  }
  
  .breadcrumb-actions {
    @apply ml-2;
  }
}

/* Scrollbar hide utility */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .breadcrumb-separator {
    @apply text-foreground;
  }
}
</style>
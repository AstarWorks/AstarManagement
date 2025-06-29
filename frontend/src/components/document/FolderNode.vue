<template>
  <div 
    class="folder-node"
    :class="{ 
      'is-expanded': isExpanded,
      'is-selected': isSelected,
      'is-drag-over': isDragOver,
      'can-drop': canDrop
    }"
    :style="{ paddingLeft: `${depth * 20}px` }"
  >
    <!-- Folder Item -->
    <div 
      class="folder-item"
      @click="handleSelect"
      @contextmenu.prevent="handleContextMenu"
      @dragstart="handleDragStart"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
      :draggable="folder.permissions.canWrite"
    >
      <!-- Expand/Collapse Button -->
      <button
        v-if="hasChildren"
        class="expand-button"
        @click.stop="toggleExpand"
        :aria-label="isExpanded ? 'Collapse folder' : 'Expand folder'"
      >
        <ChevronRight 
          class="expand-icon" 
          :class="{ 'rotate-90': isExpanded }"
        />
      </button>
      <div v-else class="expand-spacer" />
      
      <!-- Folder Icon -->
      <div class="folder-icon" :style="{ color: folder.metadata.color }">
        <component 
          :is="getFolderIcon()" 
          class="h-4 w-4"
        />
      </div>
      
      <!-- Folder Name -->
      <span class="folder-name">
        {{ folder.name }}
      </span>
      
      <!-- Badges -->
      <div class="folder-badges">
        <!-- Document Count -->
        <Badge 
          v-if="folder.documentCount > 0" 
          variant="secondary"
          class="document-count"
        >
          {{ folder.documentCount }}
        </Badge>
        
        <!-- Unread Count -->
        <Badge 
          v-if="folder.unreadCount > 0" 
          variant="default"
          class="unread-count"
        >
          {{ folder.unreadCount }}
        </Badge>
        
        <!-- Shared Indicator -->
        <Share2 
          v-if="folder.permissions.sharedWith?.length" 
          class="h-3 w-3 text-muted-foreground"
        />
      </div>
      
      <!-- Actions -->
      <div class="folder-actions">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              class="action-button"
              @click.stop
            >
              <MoreVertical class="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              v-if="folder.permissions.canWrite"
              @click="createSubfolder"
            >
              <FolderPlus class="h-4 w-4 mr-2" />
              New Subfolder
            </DropdownMenuItem>
            <DropdownMenuItem 
              v-if="folder.permissions.canWrite"
              @click="renameFolder"
            >
              <Edit3 class="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="toggleFavorite">
              <Star 
                class="h-4 w-4 mr-2" 
                :class="{ 'fill-current': isFavorite }"
              />
              {{ isFavorite ? 'Remove from' : 'Add to' }} Favorites
            </DropdownMenuItem>
            <DropdownMenuItem 
              v-if="folder.permissions.canShare"
              @click="shareFolder"
            >
              <Share2 class="h-4 w-4 mr-2" />
              Share
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              v-if="folder.permissions.canDelete"
              @click="deleteFolder"
              class="text-destructive"
            >
              <Trash2 class="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
    
    <!-- Children -->
    <Transition name="folder-expand">
      <div v-if="isExpanded && hasChildren" class="folder-children">
        <FolderNode
          v-for="child in children"
          :key="child.id"
          :folder="child"
          :depth="depth + 1"
          :expanded="expanded"
          :selected="selected"
          :favorites="favorites"
          @toggle="$emit('toggle', $event)"
          @select="$emit('select', $event)"
          @drop="$emit('drop', $event)"
          @context-menu="$emit('context-menu', $event)"
          @create-subfolder="$emit('create-subfolder', $event)"
          @rename="$emit('rename', $event)"
          @delete="$emit('delete', $event)"
          @share="$emit('share', $event)"
          @toggle-favorite="$emit('toggle-favorite', $event)"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  ChevronRight, 
  Folder, 
  FolderOpen, 
  FolderPlus,
  Archive,
  FileText,
  Briefcase,
  Users,
  MoreVertical,
  Edit3,
  Trash2,
  Share2,
  Star
} from 'lucide-vue-next'

// UI Components
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'

// Types
import type { FolderNode as FolderNodeType, DraggedItem } from '~/types/folder'

interface Props {
  folder: FolderNodeType
  depth?: number
  expanded: Set<string>
  selected: string | null
  favorites: string[]
}

interface Emits {
  (e: 'toggle', folderId: string): void
  (e: 'select', folderId: string): void
  (e: 'drop', data: { item: DraggedItem; targetId: string }): void
  (e: 'context-menu', data: { folder: FolderNodeType; event: MouseEvent }): void
  (e: 'create-subfolder', folderId: string): void
  (e: 'rename', folderId: string): void
  (e: 'delete', folderId: string): void
  (e: 'share', folderId: string): void
  (e: 'toggle-favorite', folderId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  depth: 0
})

const emit = defineEmits<Emits>()

// Local state
const isDragOver = ref(false)
const canDrop = ref(false)

// Computed
const isExpanded = computed(() => props.expanded.has(props.folder.id))
const isSelected = computed(() => props.selected === props.folder.id)
const isFavorite = computed(() => props.favorites.includes(props.folder.id))
const hasChildren = computed(() => props.folder.children.length > 0)

const children = computed(() => props.folder.children)

// Methods
const toggleExpand = () => {
  emit('toggle', props.folder.id)
}

const handleSelect = () => {
  emit('select', props.folder.id)
}

const handleContextMenu = (event: MouseEvent) => {
  emit('context-menu', { folder: props.folder, event })
}

const handleDragStart = (event: DragEvent) => {
  if (!props.folder.permissions.canWrite) return
  
  const dragData: DraggedItem = {
    type: 'folder',
    id: props.folder.id,
    sourceFolder: props.folder.parentId ?? undefined
  }
  
  event.dataTransfer!.effectAllowed = 'move'
  event.dataTransfer!.setData('application/json', JSON.stringify(dragData))
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  
  if (!props.folder.permissions.canWrite) {
    event.dataTransfer!.dropEffect = 'none'
    canDrop.value = false
    return
  }
  
  try {
    const data = JSON.parse(event.dataTransfer!.getData('application/json') || '{}')
    
    // Can't drop folder into itself or its children
    if (data.type === 'folder' && data.id === props.folder.id) {
      event.dataTransfer!.dropEffect = 'none'
      canDrop.value = false
      return
    }
    
    event.dataTransfer!.dropEffect = 'move'
    isDragOver.value = true
    canDrop.value = true
  } catch {
    // Handle external drops
    event.dataTransfer!.dropEffect = 'none'
    canDrop.value = false
  }
}

const handleDragLeave = () => {
  isDragOver.value = false
  canDrop.value = false
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  
  isDragOver.value = false
  canDrop.value = false
  
  if (!props.folder.permissions.canWrite) return
  
  try {
    const data = JSON.parse(event.dataTransfer!.getData('application/json'))
    emit('drop', { item: data, targetId: props.folder.id })
  } catch (err) {
    console.error('Failed to parse drop data:', err)
  }
}

const getFolderIcon = () => {
  if (props.folder.metadata.icon === 'archive') return Archive
  if (props.folder.metadata.icon === 'file-text') return FileText
  if (props.folder.metadata.icon === 'briefcase') return Briefcase
  if (props.folder.metadata.icon === 'users') return Users
  return isExpanded.value ? FolderOpen : Folder
}

// Action handlers
const createSubfolder = () => {
  emit('create-subfolder', props.folder.id)
}

const renameFolder = () => {
  emit('rename', props.folder.id)
}

const deleteFolder = () => {
  emit('delete', props.folder.id)
}

const shareFolder = () => {
  emit('share', props.folder.id)
}

const toggleFavorite = () => {
  emit('toggle-favorite', props.folder.id)
}
</script>

<style scoped>
.folder-node {
  @apply select-none;
}

.folder-item {
  @apply flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer;
  @apply hover:bg-accent/50 transition-colors;
}

.folder-node.is-selected .folder-item {
  @apply bg-accent;
}

.folder-node.is-drag-over.can-drop .folder-item {
  @apply bg-primary/10 ring-2 ring-primary/50;
}

.expand-button {
  @apply p-0.5 hover:bg-accent rounded;
  @apply focus:outline-none focus:ring-2 focus:ring-ring;
}

.expand-spacer {
  @apply w-5;
}

.expand-icon {
  @apply h-4 w-4 transition-transform duration-200;
}

.folder-icon {
  @apply flex-shrink-0;
}

.folder-name {
  @apply flex-1 text-sm font-medium truncate;
}

.folder-badges {
  @apply flex items-center gap-1 ml-auto mr-2;
}

.document-count {
  @apply h-5 px-1.5 text-xs;
}

.unread-count {
  @apply h-5 px-1.5 text-xs;
}

.folder-actions {
  @apply opacity-0 transition-opacity;
}

.folder-item:hover .folder-actions,
.folder-item:focus-within .folder-actions {
  @apply opacity-100;
}

.action-button {
  @apply h-7 w-7;
}

.folder-children {
  @apply ml-2 border-l border-border/50;
}

/* Expand animation */
.folder-expand-enter-active,
.folder-expand-leave-active {
  @apply transition-all duration-200 ease-in-out;
  @apply transform-origin-top;
}

.folder-expand-enter-from,
.folder-expand-leave-to {
  @apply opacity-0 scale-y-0;
}

/* Mobile adjustments */
@media (max-width: 640px) {
  .folder-item {
    @apply py-2;
  }
  
  .folder-actions {
    @apply opacity-100;
  }
}
</style>
<template>
  <div class="folder-selector-node">
    <div
      class="node-item"
      :class="{ 
        selected: selectedId === folder.id,
        disabled: isExcluded
      }"
      :style="{ paddingLeft: `${depth * 20 + 12}px` }"
      @click="!isExcluded && $emit('select', folder.id)"
    >
      <!-- Expand/Collapse -->
      <button
        v-if="hasChildren"
        class="expand-button"
        @click.stop="$emit('toggle', folder.id)"
        :aria-label="isExpanded ? 'Collapse' : 'Expand'"
      >
        <ChevronRight 
          class="h-3 w-3 transition-transform" 
          :class="{ 'rotate-90': isExpanded }"
        />
      </button>
      <div v-else class="expand-spacer" />
      
      <!-- Folder Icon -->
      <Folder 
        class="h-4 w-4 flex-shrink-0" 
        :class="{ 'text-muted-foreground': isExcluded }"
        :style="{ color: !isExcluded && folder.metadata.color ? folder.metadata.color : undefined }"
      />
      
      <!-- Folder Name -->
      <span class="node-name" :class="{ 'text-muted-foreground': isExcluded }">
        {{ folder.name }}
      </span>
      
      <!-- Excluded indicator -->
      <span v-if="isExcluded" class="excluded-badge">
        Excluded
      </span>
      
      <!-- Document count -->
      <span v-if="folder.documentCount > 0" class="document-count">
        {{ folder.documentCount }}
      </span>
    </div>
    
    <!-- Children -->
    <div v-if="isExpanded && hasChildren" class="node-children">
      <FolderSelectorNode
        v-for="child in folder.children"
        :key="child.id"
        :folder="child"
        :selected-id="selectedId"
        :excluded-ids="excludedIds"
        :expanded-ids="expandedIds"
        :depth="depth + 1"
        @select="$emit('select', $event)"
        @toggle="$emit('toggle', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronRight, Folder } from 'lucide-vue-next'

// Types
import type { FolderNode } from '~/types/folder'

interface Props {
  folder: FolderNode
  selectedId: string | null
  excludedIds: string[]
  expandedIds: Set<string>
  depth?: number
}

interface Emits {
  (e: 'select', folderId: string): void
  (e: 'toggle', folderId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  depth: 0
})

defineEmits<Emits>()

// Computed
const isExpanded = computed(() => props.expandedIds.has(props.folder.id))
const isExcluded = computed(() => props.excludedIds.includes(props.folder.id))
const hasChildren = computed(() => props.folder.children.length > 0)
</script>

<style scoped>
.folder-selector-node {
  @apply select-none;
}

.node-item {
  @apply flex items-center gap-2 py-1.5 px-3 rounded cursor-pointer;
  @apply hover:bg-accent/50 transition-colors;
}

.node-item.selected {
  @apply bg-accent;
}

.node-item.disabled {
  @apply cursor-not-allowed opacity-60;
  @apply hover:bg-transparent;
}

.expand-button {
  @apply p-0.5 hover:bg-accent rounded;
  @apply focus:outline-none focus:ring-1 focus:ring-ring;
}

.expand-spacer {
  @apply w-5;
}

.node-name {
  @apply flex-1 text-sm truncate;
}

.excluded-badge {
  @apply text-xs px-1.5 py-0.5 bg-muted rounded;
}

.document-count {
  @apply text-xs text-muted-foreground;
}

.node-children {
  @apply mt-0.5;
}
</style>
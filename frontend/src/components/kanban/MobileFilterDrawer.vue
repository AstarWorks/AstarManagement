<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, Filter, RotateCcw } from 'lucide-vue-next'
import { useSwipe } from '@vueuse/core'
import type { FilterState } from '~/types/matter'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Switch } from '~/components/ui/switch'
import { Label } from '~/components/ui/label'
import { Input } from '~/components/ui/input'
import { cn } from '~/lib/utils'

interface Props {
  modelValue: boolean
  filters: FilterState
  availableTags?: string[]
  availableAssignees?: Array<{ id: string; name: string }>
}

const props = withDefaults(defineProps<Props>(), {
  availableTags: () => [],
  availableAssignees: () => []
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:filters': [filters: FilterState]
  'apply': [filters: FilterState]
  'reset': []
}>()

// Template refs
const drawerRef = ref<HTMLElement>()
const contentRef = ref<HTMLElement>()

// Local filter state
const localFilters = ref<FilterState>({ ...props.filters })

// Drawer state
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const dragOffset = ref(0)
const isDragging = ref(false)

// Watch for external filter changes
watch(() => props.filters, (newFilters) => {
  localFilters.value = { ...newFilters }
}, { deep: true })

// Swipe to close
const { lengthY } = useSwipe(drawerRef, {
  threshold: 50,
  onSwipe() {
    if (lengthY.value > 50) {
      closeDrawer()
    }
  }
})

// Touch drag handling for visual feedback
const handleTouchStart = (e: TouchEvent) => {
  isDragging.value = true
  const touch = e.touches[0]
  const startY = touch.clientY
  
  const handleTouchMove = (e: TouchEvent) => {
    const touch = e.touches[0]
    const deltaY = touch.clientY - startY
    
    if (deltaY > 0) {
      dragOffset.value = Math.min(deltaY, 200)
    }
  }
  
  const handleTouchEnd = () => {
    isDragging.value = false
    
    if (dragOffset.value > 100) {
      closeDrawer()
    } else {
      dragOffset.value = 0
    }
    
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
  }
  
  document.addEventListener('touchmove', handleTouchMove)
  document.addEventListener('touchend', handleTouchEnd)
}

// Computed properties
const activeFilterCount = computed(() => {
  let count = 0
  if (localFilters.value.search) count++
  if (localFilters.value.priority?.length) count += localFilters.value.priority.length
  if (localFilters.value.status?.length) count += localFilters.value.status.length
  if (localFilters.value.assigneeIds?.length) count += localFilters.value.assigneeIds.length
  if (localFilters.value.tags?.length) count += localFilters.value.tags.length
  if (localFilters.value.dateRange?.start || localFilters.value.dateRange?.end) count++
  return count
})

const hasChanges = computed(() => {
  return JSON.stringify(localFilters.value) !== JSON.stringify(props.filters)
})

// Filter toggle methods
const togglePriority = (priority: string) => {
  if (!localFilters.value.priority) {
    localFilters.value.priority = []
  }
  const index = localFilters.value.priority.indexOf(priority)
  if (index > -1) {
    localFilters.value.priority.splice(index, 1)
  } else {
    localFilters.value.priority.push(priority)
  }
}

const toggleStatus = (status: string) => {
  if (!localFilters.value.status) {
    localFilters.value.status = []
  }
  const index = localFilters.value.status.indexOf(status)
  if (index > -1) {
    localFilters.value.status.splice(index, 1)
  } else {
    localFilters.value.status.push(status)
  }
}

const toggleTag = (tag: string) => {
  if (!localFilters.value.tags) {
    localFilters.value.tags = []
  }
  const index = localFilters.value.tags.indexOf(tag)
  if (index > -1) {
    localFilters.value.tags.splice(index, 1)
  } else {
    localFilters.value.tags.push(tag)
  }
}

const toggleAssignee = (assigneeId: string) => {
  if (!localFilters.value.assigneeIds) {
    localFilters.value.assigneeIds = []
  }
  const index = localFilters.value.assigneeIds.indexOf(assigneeId)
  if (index > -1) {
    localFilters.value.assigneeIds.splice(index, 1)
  } else {
    localFilters.value.assigneeIds.push(assigneeId)
  }
}

// Actions
const applyFilters = () => {
  emit('update:filters', { ...localFilters.value })
  emit('apply', { ...localFilters.value })
  closeDrawer()
}

const resetFilters = () => {
  localFilters.value = {
    searchQuery: '',
    selectedLawyers: [],
    selectedPriorities: [],
    selectedStatuses: [],
    showClosed: false,
    searchMode: 'fuzzy' as const,
    search: '',
    priority: [],
    status: [],
    assigneeIds: [],
    tags: [],
    dateRange: undefined
  }
  emit('reset')
}

const closeDrawer = () => {
  isOpen.value = false
  dragOffset.value = 0
}

// Priority options
const priorities = ['URGENT', 'HIGH', 'MEDIUM', 'LOW']
const statuses = ['DRAFT', 'ACTIVE', 'PENDING', 'REVIEW', 'COMPLETED', 'ARCHIVED']
</script>

<template>
  <teleport to="body">
    <!-- Backdrop -->
    <transition name="backdrop">
      <div 
        v-if="isOpen"
        class="drawer-backdrop"
        @click="closeDrawer"
      />
    </transition>
    
    <!-- Drawer -->
    <transition name="drawer">
      <div 
        v-if="isOpen"
        ref="drawerRef"
        class="drawer-container"
        :style="{
          transform: `translateY(${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease'
        }"
      >
        <!-- Drag Handle -->
        <div 
          class="drag-handle"
          @touchstart="handleTouchStart"
        >
          <div class="drag-indicator" />
        </div>
        
        <!-- Header -->
        <header class="drawer-header">
          <div class="header-content">
            <h2 class="header-title">
              <Filter class="h-5 w-5 mr-2" />
              Filters
            </h2>
            <div class="header-actions">
              <Badge 
                v-if="activeFilterCount > 0"
                variant="secondary"
                class="mr-2"
              >
                {{ activeFilterCount }} active
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                @click="closeDrawer"
                aria-label="Close filters"
              >
                <X class="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>
        
        <!-- Content -->
        <div 
          ref="contentRef"
          class="drawer-content"
        >
          <!-- Search -->
          <div class="filter-section">
            <Label for="search" class="filter-label">Search</Label>
            <Input
              id="search"
              v-model="localFilters.search"
              type="search"
              placeholder="Search matters..."
              class="w-full"
            />
          </div>
          
          <!-- Priority -->
          <div class="filter-section">
            <h3 class="filter-label">Priority</h3>
            <div class="filter-chips">
              <button
                v-for="priority in priorities"
                :key="priority"
                class="filter-chip"
                :class="{
                  'active': localFilters.priority?.includes(priority)
                }"
                @click="togglePriority(priority)"
              >
                {{ priority }}
              </button>
            </div>
          </div>
          
          <!-- Status -->
          <div class="filter-section">
            <h3 class="filter-label">Status</h3>
            <div class="filter-chips">
              <button
                v-for="status in statuses"
                :key="status"
                class="filter-chip"
                :class="{
                  'active': localFilters.status?.includes(status)
                }"
                @click="toggleStatus(status)"
              >
                {{ status }}
              </button>
            </div>
          </div>
          
          <!-- Assignees -->
          <div v-if="availableAssignees.length > 0" class="filter-section">
            <h3 class="filter-label">Assignees</h3>
            <div class="filter-list">
              <label
                v-for="assignee in availableAssignees"
                :key="assignee.id"
                class="filter-option"
              >
                <input
                  type="checkbox"
                  :checked="localFilters.assigneeIds?.includes(assignee.id)"
                  @change="toggleAssignee(assignee.id)"
                  class="filter-checkbox"
                />
                <span class="filter-option-label">{{ assignee.name }}</span>
              </label>
            </div>
          </div>
          
          <!-- Tags -->
          <div v-if="availableTags.length > 0" class="filter-section">
            <h3 class="filter-label">Tags</h3>
            <div class="filter-chips">
              <button
                v-for="tag in availableTags"
                :key="tag"
                class="filter-chip"
                :class="{
                  'active': localFilters.tags?.includes(tag)
                }"
                @click="toggleTag(tag)"
              >
                {{ tag }}
              </button>
            </div>
          </div>
          
          <!-- Show completed toggle -->
          <div class="filter-section">
            <div class="filter-toggle">
              <Label for="show-completed" class="filter-toggle-label">
                Show completed matters
              </Label>
              <Switch
                id="show-completed"
                v-model="localFilters.showCompleted"
              />
            </div>
          </div>
        </div>
        
        <!-- Footer Actions -->
        <footer class="drawer-footer">
          <Button
            variant="outline"
            size="sm"
            @click="resetFilters"
            :disabled="activeFilterCount === 0"
          >
            <RotateCcw class="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            variant="default"
            size="sm"
            @click="applyFilters"
            :disabled="!hasChanges"
          >
            Apply Filters
          </Button>
        </footer>
      </div>
    </transition>
  </teleport>
</template>

<style scoped>
/* Backdrop */
.drawer-backdrop {
  @apply fixed inset-0 bg-black/50 z-40;
  -webkit-tap-highlight-color: transparent;
}

/* Drawer Container */
.drawer-container {
  @apply fixed bottom-0 left-0 right-0 z-50;
  @apply bg-background rounded-t-2xl shadow-2xl;
  @apply flex flex-col;
  max-height: 85vh;
  touch-action: pan-y;
}

/* Drag Handle */
.drag-handle {
  @apply py-2 cursor-grab active:cursor-grabbing;
  touch-action: pan-y;
}

.drag-indicator {
  @apply w-12 h-1 bg-muted rounded-full mx-auto;
}

/* Header */
.drawer-header {
  @apply border-b px-4 py-3;
}

.header-content {
  @apply flex items-center justify-between;
}

.header-title {
  @apply text-lg font-semibold flex items-center;
}

.header-actions {
  @apply flex items-center;
}

/* Content */
.drawer-content {
  @apply flex-1 overflow-y-auto px-4 py-4;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

/* Filter Sections */
.filter-section {
  @apply mb-6;
}

.filter-section:last-child {
  @apply mb-0;
}

.filter-label {
  @apply text-sm font-medium mb-3 block;
}

/* Filter Chips */
.filter-chips {
  @apply flex flex-wrap gap-2;
}

.filter-chip {
  @apply px-3 py-1.5 rounded-full text-sm font-medium;
  @apply bg-muted text-muted-foreground;
  @apply transition-colors duration-200;
  @apply border-2 border-transparent;
  -webkit-tap-highlight-color: transparent;
}

.filter-chip:active {
  @apply scale-95;
}

.filter-chip.active {
  @apply bg-primary text-primary-foreground;
  @apply border-primary;
}

/* Filter List */
.filter-list {
  @apply space-y-2;
}

.filter-option {
  @apply flex items-center gap-3 py-2 cursor-pointer;
  -webkit-tap-highlight-color: transparent;
}

.filter-checkbox {
  @apply h-4 w-4 rounded border-gray-300;
  @apply text-primary focus:ring-primary;
}

.filter-option-label {
  @apply text-sm;
}

/* Filter Toggle */
.filter-toggle {
  @apply flex items-center justify-between py-2;
}

.filter-toggle-label {
  @apply text-sm font-medium;
}

/* Footer */
.drawer-footer {
  @apply border-t px-4 py-3 flex items-center justify-between gap-3;
  @apply bg-muted/50;
}

/* Transitions */
.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.3s ease;
}

.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.3s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  transform: translateY(100%);
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .drawer-container {
    @apply bg-gray-900;
  }
  
  .filter-chip {
    @apply bg-gray-800 text-gray-300;
  }
  
  .filter-chip.active {
    @apply bg-primary text-primary-foreground;
  }
}

/* Landscape adjustments */
@media (orientation: landscape) {
  .drawer-container {
    max-height: 90vh;
  }
}

/* Safe area handling */
.drawer-footer {
  padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
}
</style>
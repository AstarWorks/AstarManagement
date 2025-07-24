<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted, computed, watch } from 'vue'
import type { MatterCard } from '~/types/kanban'
import { useKanbanDragDropEnhanced } from '~/composables/useKanbanDragDropEnhanced'
import { useTouchGestures } from '~/composables/useTouchGestures'
import { useBreakpoints } from '@vueuse/core'
import { useKanbanMattersQuery, useKanbanRealTimeQuery } from '~/composables/useKanbanQuery'
import { useQueryClient } from '@tanstack/vue-query'

// Development mode flag
const $dev = process.env.NODE_ENV === 'development'

// Props for progressive enhancement
interface Props {
  filters?: any // MatterFilters
  dragEnabled?: boolean
  realTimeEnabled?: boolean
  touchGesturesEnabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  filters: undefined,
  dragEnabled: true,
  realTimeEnabled: true,
  touchGesturesEnabled: true
})

// Emits for interactive features
const emit = defineEmits<{
  matterMove: [matterId: string, newStatus: string, oldStatus: string]
  realTimeUpdate: [updates: any[]]
  dragStart: [matter: MatterCard]
  dragEnd: [matter: MatterCard]
}>()

// Responsive design
const breakpoints = useBreakpoints({
  mobile: 0,
  tablet: 768,
  desktop: 1024,
})

const isMobile = breakpoints.smaller('tablet')

// Query client for cache management
const queryClient = useQueryClient()

// TanStack Query data fetching
const {
  matterCards,
  mattersByStatus,
  isLoading,
  isError,
  error,
  refetch
} = useKanbanMattersQuery(props.filters)

// Real-time updates with TanStack Query
const {
  isConnected,
  lastUpdate,
  pendingUpdates,
  syncNow,
  subscribeToUpdates
} = useKanbanRealTimeQuery()

// Enhanced drag and drop with TanStack Query mutations
const kanbanContainer = ref<HTMLElement>()
const {
  isDragging,
  draggedMatter,
  dragOverColumn,
  onDragStart,
  onDragEnd,
  onDragChange,
  onDragOver,
  onDragLeave,
  isMatterProcessing,
  performanceMetrics,
  averageDragTime,
  successRate
} = useKanbanDragDropEnhanced()

// Additional drag state for interactive overlay
const dragStartPosition = ref<{ x: number; y: number } | null>(null)
const dragOffset = ref<{ x: number; y: number }>({ x: 0, y: 0 })
const dropZoneStatus = ref<string | null>(null)

// Initialize drag and drop functionality
const initializeDragDrop = (container: HTMLElement) => {
  // Basic drag setup - in production this would integrate with a drag library
  console.log('Drag and drop initialized for container:', container)
}

const handleDragStart = (event: DragEvent, matter: MatterCard) => {
  // onDragStart is already wrapped by performanceMonitor and expects to be called from drag library
  // For manual invocation, we need to simulate the drag library event structure
  const dragEvent = {
    item: {
      _underlying_vm_: matter,
      classList: {
        add: (className: string) => {
          // Simulate adding class to dragged element
          console.log(`Adding class: ${className}`)
        }
      }
    }
  }
  
  // Call the wrapped function directly without additional arguments
  onDragStart(dragEvent)
  
  dragStartPosition.value = { x: event.clientX, y: event.clientY }
  emit('dragStart', matter)
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (dragStartPosition.value) {
    dragOffset.value = {
      x: event.clientX - dragStartPosition.value.x,
      y: event.clientY - dragStartPosition.value.y
    }
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  // Implementation would handle the actual drop logic
}

const handleDragEnd = (event: DragEvent) => {
  // onDragEnd is already wrapped by performanceMonitor and expects to be called from drag library
  // For manual invocation, we need to simulate the drag library event structure
  const dragEvent = {
    item: {
      classList: {
        remove: (className: string) => {
          // Simulate removing class from dragged element
          console.log(`Removing class: ${className}`)
        }
      }
    },
    from: event.target,
    to: event.target
  }
  
  // Call the wrapped function directly without additional arguments
  onDragEnd(dragEvent)
  
  dragStartPosition.value = null
  dragOffset.value = { x: 0, y: 0 }
  dropZoneStatus.value = null
}

const cleanup = () => {
  // Cleanup drag event listeners if needed
}

// Touch gestures for mobile - simplified implementation
const setupTouchGestures = (container: HTMLElement) => {
  if (!props.touchGesturesEnabled || !isMobile.value) return
  
  // Basic touch gesture setup - would integrate with actual touch library
  console.log('Touch gestures initialized for container:', container)
}

const cleanupTouchGestures = () => {
  // Cleanup touch gesture listeners if needed
}

// Real-time updates subscription
let unsubscribeRealTime: (() => void) | null = null

const setupRealTime = () => {
  if (!props.realTimeEnabled || !isConnected.value) return
  
  // Subscribe to real-time updates using TanStack Query integration
  unsubscribeRealTime = subscribeToUpdates((update) => {
    // Invalidate relevant queries based on update type
    if (update.type === 'matter_update') {
      queryClient.invalidateQueries({ queryKey: ['matters'] })
    } else if (update.type === 'status_change') {
      queryClient.invalidateQueries({ queryKey: ['kanban'] })
    }
    
    emit('realTimeUpdate', [update])
  })
}

const cleanupRealTime = () => {
  if (unsubscribeRealTime) {
    unsubscribeRealTime()
    unsubscribeRealTime = null
  }
}

// Computed properties for overlay positioning
const dragOverlayStyle = computed(() => {
  if (!isDragging.value || !dragOffset.value || !dragStartPosition.value) {
    return { display: 'none' }
  }
  
  return {
    position: 'fixed' as const,
    left: `${dragStartPosition.value.x + dragOffset.value.x}px`,
    top: `${dragStartPosition.value.y + dragOffset.value.y}px`,
    zIndex: 1000,
    pointerEvents: 'none' as const,
    transform: 'rotate(5deg)',
    opacity: 0.9
  }
})

// Component lifecycle
onMounted(async () => {
  await nextTick()
  
  if (kanbanContainer.value) {
    // Initialize drag and drop
    if (props.dragEnabled) {
      initializeDragDrop(kanbanContainer.value)
    }
    
    // Setup touch gestures for mobile
    if (props.touchGesturesEnabled && isMobile.value) {
      setupTouchGestures(kanbanContainer.value)
    }
  }
  
  // Setup real-time connection
  if (props.realTimeEnabled) {
    setupRealTime()
  }
})

onUnmounted(() => {
  cleanup()
  cleanupTouchGestures()
  cleanupRealTime()
})

// Performance optimization: throttle drag events
const throttledDragOver = computed(() => {
  let lastCall = 0
  return (event: DragEvent) => {
    const now = Date.now()
    if (now - lastCall >= 16) { // ~60fps
      lastCall = now
      handleDragOver(event)
    }
  }
})

// Accessibility improvements
const announceToScreenReader = (message: string) => {
  if (typeof window !== 'undefined') {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.style.position = 'absolute'
    announcement.style.left = '-10000px'
    announcement.textContent = message
    document.body.appendChild(announcement)
    
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }
}

// Handle matter movement with accessibility announcement
const handleMatterMoved = (matterId: string, newStatus: string, oldStatus: string) => {
  const matter = matterCards.value.find((m: MatterCard) => m.id === matterId)
  if (matter) {
    announceToScreenReader(
      `Matter ${matter.caseNumber} moved from ${oldStatus} to ${newStatus}`
    )
  }
  emit('matterMove', matterId, newStatus, oldStatus)
}

// Watch for filter changes
watch(() => props.filters, () => {
  refetch()
}, { deep: true })

// Performance monitoring
const performanceStats = computed(() => ({
  avgDragTime: averageDragTime.value,
  successRate: successRate.value,
  totalOps: performanceMetrics.value.totalOperations,
  failedOps: performanceMetrics.value.failedOperations
}))
</script>

<template>
  <div
    ref="kanbanContainer"
    class="kanban-interactive-overlay"
    :class="{
      'drag-active': isDragging,
      'touch-enabled': touchGesturesEnabled && isMobile,
      'real-time-connected': isConnected
    }"
  >
    <!-- Real-time connection indicator -->
    <div
      v-if="realTimeEnabled"
      class="real-time-indicator"
      :class="{
        'connected': isConnected,
        'disconnected': !isConnected
      }"
      :aria-label="isConnected ? 'Real-time updates active' : 'Real-time updates disconnected'"
    >
      <div class="indicator-dot" />
      <span class="indicator-text">
        {{ isConnected ? 'Live' : 'Offline' }}
      </span>
    </div>

    <!-- Drop zone indicators -->
    <div
      v-if="isDragging"
      class="drop-zones"
    >
      <div
        v-for="status in ['intake', 'investigation', 'negotiation', 'litigation', 'settlement', 'collection', 'closed']"
        :key="status"
        :data-drop-zone="status"
        class="drop-zone"
        :class="{
          'drop-zone-active': dropZoneStatus === status,
          'drop-zone-valid': dropZoneStatus === status
        }"
        @dragover.prevent="throttledDragOver"
        @drop="handleDrop"
      />
    </div>

    <!-- Drag overlay for visual feedback -->
    <div
      v-if="isDragging && draggedMatter"
      class="drag-overlay"
      :style="dragOverlayStyle"
    >
      <div class="drag-preview">
        <div class="drag-preview-card">
          <h3>{{ draggedMatter.title }}</h3>
          <p>#{{ draggedMatter.caseNumber }}</p>
        </div>
      </div>
    </div>

    <!-- Touch gesture feedback for mobile -->
    <div
      v-if="isMobile && touchGesturesEnabled"
      class="touch-feedback"
    >
      <!-- Visual indicators for swipe actions -->
      <div class="swipe-hints">
        <div class="swipe-hint swipe-left">
          <span>Swipe left for actions</span>
        </div>
        <div class="swipe-hint swipe-right">
          <span>Swipe right for menu</span>
        </div>
      </div>
    </div>

    <!-- Performance monitoring overlay (development only) -->
    <div
      v-if="$dev"
      class="performance-overlay"
    >
      <div class="performance-stats">
        <div>Drag Active: {{ isDragging }}</div>
        <div>Real-time: {{ isConnected ? 'Connected' : 'Disconnected' }}</div>
        <div>Touch: {{ isMobile ? 'Mobile' : 'Desktop' }}</div>
        <div>Queries: {{ isLoading ? 'Loading' : 'Ready' }}</div>
        <div>Avg Drag: {{ performanceStats.avgDragTime }}ms</div>
        <div>Success: {{ performanceStats.successRate }}%</div>
      </div>
    </div>

    <!-- Screen reader announcements -->
    <div
      class="sr-only"
      aria-live="polite"
      aria-atomic="true"
    >
      <span v-if="isDragging">
        Dragging {{ draggedMatter?.title }}. Use arrow keys to move between columns.
      </span>
    </div>
  </div>
</template>

<style scoped>
/* Interactive overlay positioned above SSR content */
.kanban-interactive-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10;
}

.kanban-interactive-overlay.drag-active {
  pointer-events: auto;
}

/* Real-time connection indicator */
.real-time-indicator {
  position: fixed;
  top: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  pointer-events: auto;
  z-index: 100;
}

.indicator-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: hsl(var(--destructive));
  transition: background-color 0.3s ease;
}

.real-time-indicator.connected .indicator-dot {
  background: hsl(var(--success) / 1);
  animation: pulse 2s infinite;
}

.indicator-text {
  color: hsl(var(--foreground));
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Drop zones for drag and drop */
.drop-zones {
  position: absolute;
  inset: 0;
  pointer-events: auto;
}

.drop-zone {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 320px;
  margin-left: 1rem;
  border: 2px dashed transparent;
  border-radius: var(--radius);
  background: transparent;
  transition: all 0.2s ease;
}

.drop-zone:nth-child(1) { left: 0; }
.drop-zone:nth-child(2) { left: 340px; }
.drop-zone:nth-child(3) { left: 680px; }
.drop-zone:nth-child(4) { left: 1020px; }
.drop-zone:nth-child(5) { left: 1360px; }
.drop-zone:nth-child(6) { left: 1700px; }
.drop-zone:nth-child(7) { left: 2040px; }

.drop-zone-active {
  border-color: hsl(var(--primary));
  background: hsl(var(--primary) / 0.1);
}

.drop-zone-valid {
  border-color: hsl(var(--success));
  background: hsl(var(--success) / 0.1);
}

/* Drag overlay and preview */
.drag-overlay {
  pointer-events: none;
  z-index: 1000;
}

.drag-preview {
  transform: rotate(5deg);
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3));
}

.drag-preview-card {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  padding: 1rem;
  min-width: 200px;
  max-width: 250px;
}

.drag-preview-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: hsl(var(--foreground));
  truncate: true;
}

.drag-preview-card p {
  margin: 0;
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
}

/* Touch gesture feedback */
.touch-feedback {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.swipe-hints {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 1rem;
}

.swipe-hint {
  background: hsl(var(--card) / 0.9);
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
  backdrop-filter: blur(4px);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.touch-enabled .swipe-hint {
  opacity: 1;
}

/* Performance overlay (development) */
.performance-overlay {
  position: fixed;
  bottom: 1rem;
  left: 1rem;
  background: hsl(var(--card) / 0.9);
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  padding: 0.5rem;
  font-size: 0.625rem;
  font-family: monospace;
  pointer-events: auto;
  backdrop-filter: blur(4px);
  z-index: 100;
}

.performance-stats > div {
  margin-bottom: 0.25rem;
  color: hsl(var(--foreground));
}

.performance-stats > div:last-child {
  margin-bottom: 0;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .drop-zone {
    width: 280px;
  }
  
  .drop-zone:nth-child(1) { left: 0; }
  .drop-zone:nth-child(2) { left: 300px; }
  .drop-zone:nth-child(3) { left: 600px; }
  .drop-zone:nth-child(4) { left: 900px; }
  .drop-zone:nth-child(5) { left: 1200px; }
  .drop-zone:nth-child(6) { left: 1500px; }
  .drop-zone:nth-child(7) { left: 1800px; }
  
  .real-time-indicator {
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.375rem 0.5rem;
    font-size: 0.6875rem;
  }
  
  .indicator-dot {
    width: 0.375rem;
    height: 0.375rem;
  }
  
  .swipe-hints {
    bottom: 1rem;
    gap: 0.5rem;
  }
  
  .swipe-hint {
    padding: 0.375rem 0.5rem;
    font-size: 0.6875rem;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .drop-zone-active,
  .drop-zone-valid {
    border-width: 3px;
  }
  
  .real-time-indicator {
    border-width: 2px;
  }
  
  .drag-preview-card {
    border-width: 2px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .drop-zone,
  .indicator-dot,
  .swipe-hint {
    transition: none;
  }
  
  .indicator-dot {
    animation: none;
  }
  
  .drag-overlay {
    transform: none !important;
  }
}

/* Focus styles for accessibility */
.drop-zone:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}

/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Ensure overlay doesn't interfere with interactions when not active */
.kanban-interactive-overlay:not(.drag-active) {
  pointer-events: none;
}

.kanban-interactive-overlay:not(.drag-active) .real-time-indicator,
.kanban-interactive-overlay:not(.drag-active) .performance-overlay {
  pointer-events: auto;
}

/* GPU acceleration for smooth animations */
.drag-overlay,
.drop-zone,
.indicator-dot {
  will-change: transform, opacity;
  transform: translateZ(0);
}
</style>
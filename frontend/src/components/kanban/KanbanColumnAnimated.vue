<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import draggable from 'vuedraggable'
import { useBreakpoints } from '@vueuse/core'
import type { KanbanColumn, MatterCard, ViewPreferences, MatterStatus } from '~/types/kanban'
import { Badge } from '~/components/ui/badge'
import MatterCardEnhanced from './MatterCardEnhanced.vue'
import { DEFAULT_VIEW_PREFERENCES } from '~/constants/kanban'
import { useKanbanDragDropEnhanced } from '~/composables/useKanbanDragDropEnhanced'
import { useTouchGestures, useMobileInteractions } from '~/composables/useTouchGestures'
import { useAnimations, useFLIPAnimation } from '~/composables/useAnimations'
import { ANIMATION_DURATION, ANIMATION_EASING } from '~/constants/animations'

interface Props {
  column: KanbanColumn
  matters?: MatterCard[]
  showJapanese?: boolean
  viewPreferences?: ViewPreferences
  className?: string
  isCollapsed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  matters: () => [],
  showJapanese: true,
  viewPreferences: () => DEFAULT_VIEW_PREFERENCES,
  className: '',
  isCollapsed: false
})

const emit = defineEmits<{
  headerClick: [column: KanbanColumn]
  matterClick: [matter: MatterCard]
  matterEdit: [matter: MatterCard]
  matterUpdate: [matter: MatterCard, field: string, value: any]
  'update:matters': [matters: MatterCard[]]
  'matter-moved': [matter: MatterCard, fromStatus: MatterStatus, toStatus: MatterStatus]
  'keyboard-navigation': [direction: 'up' | 'down' | 'left' | 'right', matter: MatterCard]
  'column-collapse': [column: KanbanColumn]
  'swipe-action': [direction: string, column: KanbanColumn]
}>()

// Template refs
const columnRef = ref<HTMLElement | null>(null)
const scrollContainerRef = ref<HTMLElement | null>(null)
const draggableRef = ref<InstanceType<typeof draggable> | null>(null)

// Responsive breakpoints
const breakpoints = useBreakpoints({
  mobile: 0,
  tablet: 768,
  laptop: 1024,
  desktop: 1280,
})

const isMobile = breakpoints.smaller('tablet')
const isTablet = breakpoints.between('tablet', 'laptop')
const isDesktop = breakpoints.greaterOrEqual('laptop')

// Touch gestures and mobile interactions
const { isTouchDevice, orientation, safeAreaInsets, useTouchClick } = useMobileInteractions()

// Enhanced touch gestures for the column
const {
  isPressed,
  isLongPress,
  swipeDirection,
  dragOffset,
  velocity,
  reset: resetGestures
} = useTouchGestures(columnRef)

// Animation composables
const { animationsEnabled, prefersReducedMotion, getAnimationDuration } = useAnimations()
const { flip } = useFLIPAnimation()

// Enhanced drag and drop functionality with TanStack Query mutations
const { 
  canAcceptDrop, 
  onDragStart, 
  onDragEnd, 
  onDragChange, 
  isColumnDragTarget,
  isMatterProcessing,
  isAnyMutationPending,
  performanceMetrics,
  averageDragTime,
  successRate
} = useKanbanDragDropEnhanced()

// Animation state
const isDragHovering = ref(false)
const draggedMatter = ref<MatterCard | null>(null)
const dropIndicatorPosition = ref<number | null>(null)
const expandedCards = ref<Set<string>>(new Set())

// Mobile-specific state
const isCollapsedMobile = ref(props.isCollapsed)
const showSwipeHint = ref(true)
const isScrolling = ref(false)

// Get the first status from the column for validation
const columnStatus = computed(() => props.column.status as MatterStatus)

// Computed properties
const columnTitle = computed(() => 
  props.showJapanese ? props.column.titleJa : props.column.title
)

const matterCount = computed(() => props.matters.length)

const columnClasses = computed(() => [
  'kanban-column-animated',
  props.className,
  props.column.color,
  {
    'drag-over': isDragHovering.value,
    'drag-target': isColumnDragTarget(props.column.id),
    'mobile-device': isMobile.value,
    'tablet-device': isTablet.value,
    'touch-device': isTouchDevice.value,
    'collapsed-mobile': isCollapsedMobile.value && isMobile.value,
    'orientation-landscape': orientation.value === 'landscape',
    'is-pressed': isPressed.value,
    'is-scrolling': isScrolling.value,
    'mutations-pending': showLoadingOverlay.value,
    'high-performance': successRate.value > 90,
    'performance-warning': successRate.value < 80 && successRate.value > 0,
    'animations-enabled': animationsEnabled.value
  }
])

// Reactive matters list for v-model
const matters = computed({
  get: () => props.matters,
  set: (value) => emit('update:matters', value)
})

// Enhanced loading state with mutation tracking
const showLoadingOverlay = computed(() => isAnyMutationPending.value)
const showPerformanceMetrics = computed(() => performanceMetrics.value.totalOperations > 0)

// Mobile-optimized sortable configuration
const sortableConfig = computed(() => {
  const baseConfig = {
    animation: animationsEnabled.value ? getAnimationDuration(ANIMATION_DURATION.normal) : 0,
    ghostClass: 'drag-ghost-animated',
    chosenClass: 'drag-chosen-animated',
    dragClass: 'drag-active-animated',
    forceFallback: isTouchDevice.value,
    fallbackClass: 'drag-fallback-animated',
    removeCloneOnHide: true,
    preventOnFilter: false,
    scrollSensitivity: 30,
    scrollSpeed: 10,
    setData: (dataTransfer: DataTransfer, dragEl: HTMLElement) => {
      // Set custom drag image
      const dragImage = dragEl.cloneNode(true) as HTMLElement
      dragImage.style.transform = 'rotate(2deg)'
      dragImage.style.opacity = '0.8'
      document.body.appendChild(dragImage)
      dataTransfer.setDragImage(dragImage, 0, 0)
      setTimeout(() => document.body.removeChild(dragImage), 0)
    }
  }

  if (isMobile.value) {
    return {
      ...baseConfig,
      delay: 200,
      delayOnTouchStart: true,
      touchStartThreshold: 15,
      fallbackTolerance: 5,
      dragoverBubble: false,
      scrollSensitivity: 50,
      scrollSpeed: 20
    }
  }

  if (isTablet.value) {
    return {
      ...baseConfig,
      delay: 100,
      delayOnTouchStart: true,
      touchStartThreshold: 10,
      fallbackTolerance: 3
    }
  }

  return baseConfig
})

// Methods
const handleHeaderClick = useTouchClick(() => {
  if (isMobile.value) {
    isCollapsedMobile.value = !isCollapsedMobile.value
  }
  emit('headerClick', props.column)
})

const handleMatterClick = (matter: MatterCard) => {
  emit('matterClick', matter)
}

const handleMatterEdit = (matter: MatterCard) => {
  emit('matterEdit', matter)
}

const handleMatterUpdate = (matter: MatterCard, field: string, value: any) => {
  emit('matterUpdate', matter, field, value)
}

// Enhanced drag and drop event handlers with animations
const handleDragStart = (event: any) => {
  const matter = event.item._underlying_vm_
  draggedMatter.value = matter
  
  // Apply drag start animation
  if (animationsEnabled.value) {
    event.item.style.transition = `all ${ANIMATION_DURATION.dragStart}ms ${ANIMATION_EASING.sharp}`
  }
  
  onDragStart(event)
}

const handleDragEnd = async (event: any) => {
  draggedMatter.value = null
  dropIndicatorPosition.value = null
  
  // Apply drop animation
  if (animationsEnabled.value && event.item) {
    event.item.style.transition = `all ${ANIMATION_DURATION.dragEnd}ms ${ANIMATION_EASING.decelerate}`
  }
  
  await onDragEnd(event)
}

const handleDragChange = async (event: any) => {
  const status = columnStatus.value
  if (!status) return
  
  // Perform FLIP animation for list reordering
  if (animationsEnabled.value && draggableRef.value) {
    const items = Array.from(scrollContainerRef.value?.querySelectorAll('.matter-item') || [])
    await flip(items as HTMLElement[], async () => {
      const result = await onDragChange(event, status)
      
      if (result && result.success) {
        if (result.type === 'status_change') {
          emit('matter-moved', result.matter, result.fromStatus as MatterStatus, result.toStatus as MatterStatus)
        }
      }
    })
  } else {
    // No animation fallback
    const result = await onDragChange(event, status)
    
    if (result && result.success) {
      if (result.type === 'status_change') {
        emit('matter-moved', result.matter, result.fromStatus as MatterStatus, result.toStatus as MatterStatus)
      }
    }
  }
}

// Drag over animations
const handleDragEnter = () => {
  isDragHovering.value = true
  
  if (animationsEnabled.value && columnRef.value) {
    columnRef.value.style.transition = `all ${ANIMATION_DURATION.fast}ms ${ANIMATION_EASING.standard}`
  }
}

const handleDragLeave = () => {
  isDragHovering.value = false
  dropIndicatorPosition.value = null
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  
  // Calculate drop indicator position
  if (scrollContainerRef.value && animationsEnabled.value) {
    const rect = scrollContainerRef.value.getBoundingClientRect()
    const y = event.clientY - rect.top
    const items = scrollContainerRef.value.querySelectorAll('.matter-item')
    
    let insertIndex = items.length
    for (let i = 0; i < items.length; i++) {
      const itemRect = items[i].getBoundingClientRect()
      const itemMiddle = itemRect.top + itemRect.height / 2 - rect.top
      
      if (y < itemMiddle) {
        insertIndex = i
        break
      }
    }
    
    dropIndicatorPosition.value = insertIndex
  }
}

// Custom drop validation
const handleCanAcceptDrop = (to: any, from: any, dragEl: any): boolean => {
  return canAcceptDrop(to, from, dragEl)
}

// Keyboard navigation for accessibility
const handleKeyboardNavigation = (event: KeyboardEvent, matter: MatterCard, index: number) => {
  const target = event.currentTarget as HTMLElement
  switch (event.key) {
    case 'ArrowUp':
      event.preventDefault()
      if (index > 0 && target.parentElement) {
        const previousCard = target.parentElement.previousElementSibling?.querySelector('[tabindex]') as HTMLElement
        previousCard?.focus()
      }
      emit('keyboard-navigation', 'up', matter)
      break
      
    case 'ArrowDown':
      event.preventDefault()
      if (index < props.matters.length - 1 && target.parentElement) {
        const nextCard = target.parentElement.nextElementSibling?.querySelector('[tabindex]') as HTMLElement
        nextCard?.focus()
      }
      emit('keyboard-navigation', 'down', matter)
      break
      
    case 'ArrowLeft':
      event.preventDefault()
      emit('keyboard-navigation', 'left', matter)
      break
      
    case 'ArrowRight':
      event.preventDefault()
      emit('keyboard-navigation', 'right', matter)
      break
  }
}

// Watch for swipe gestures on mobile
watch(swipeDirection, (direction) => {
  if (!isMobile.value || !direction) return
  
  emit('swipe-action', direction, props.column)
  
  if (showSwipeHint.value) {
    showSwipeHint.value = false
  }
})

// Watch for long press to toggle collapse on mobile
watch(isLongPress, (pressed) => {
  if (!isMobile.value || !pressed) return
  
  isCollapsedMobile.value = !isCollapsedMobile.value
  emit('column-collapse', props.column)
  resetGestures()
})

// Initialize animations
onMounted(() => {
  if (animationsEnabled.value && columnRef.value) {
    columnRef.value.style.willChange = 'transform, opacity'
  }
})
</script>

<template>
  <div 
    ref="columnRef" 
    :class="columnClasses" 
    :data-column-id="column.id"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @dragover="handleDragOver"
  >
    <!-- Mobile Swipe Hint -->
    <Transition name="fade">
      <div 
        v-if="isMobile && showSwipeHint && matters.length > 0"
        class="swipe-hint"
        aria-label="Swipe left or right for actions"
      >
        <span class="swipe-icon">👆</span>
        <span class="swipe-text">Swipe for actions</span>
      </div>
    </Transition>

    <!-- Column Header -->
    <header 
      class="column-header"
      :id="`column-header-${column.id}`"
      @click="handleHeaderClick"
    >
      <div class="header-content">
        <div class="header-main">
          <h2 class="column-title">
            {{ columnTitle }}
          </h2>
          <div class="header-badges">
            <Badge 
              variant="secondary" 
              class="matter-count"
              :aria-label="`${matterCount} matters in ${columnTitle}`"
            >
              {{ matterCount }}
            </Badge>
            
            <!-- Animation status -->
            <Transition name="fade">
              <Badge 
                v-if="!animationsEnabled"
                variant="outline"
                class="animation-status"
                aria-label="Animations disabled"
              >
                <span class="text-xs">No motion</span>
              </Badge>
            </Transition>
            
            <!-- Mutation status indicator -->
            <Transition name="scale">
              <Badge 
                v-if="showLoadingOverlay"
                variant="outline"
                class="mutation-indicator"
                aria-label="Processing updates"
              >
                <span class="loading-spinner animate-spin" />
                Syncing
              </Badge>
            </Transition>
          </div>
        </div>
        
        <!-- Mobile collapse indicator -->
        <div v-if="isMobile" class="collapse-indicator">
          <svg 
            :class="['chevron', { 'collapsed': isCollapsedMobile }]"
            width="16" 
            height="16" 
            viewBox="0 0 16 16"
          >
            <path 
              fill="currentColor" 
              d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"
            />
          </svg>
        </div>
      </div>
    </header>

    <!-- Column Body with Drag & Drop -->
    <Transition 
      name="collapse"
    >
      <div 
        v-if="!isCollapsedMobile || !isMobile"
        ref="scrollContainerRef"
        class="column-body" 
        :data-testid="`column-${column.id}`"
      >
        <!-- Drop indicator -->
        <Transition name="fade">
          <div 
            v-if="isDragHovering && dropIndicatorPosition !== null"
            class="drop-indicator"
            :style="{ 
              top: `${dropIndicatorPosition * 120}px`,
              opacity: animationsEnabled ? 1 : 0.5
            }"
          />
        </Transition>

        <!-- Draggable Matter Cards -->
        <draggable
          ref="draggableRef"
          v-model="matters"
          :group="{ name: 'kanban', pull: true, put: handleCanAcceptDrop }"
          v-bind="sortableConfig"
          :data-status="columnStatus"
          class="matters-container"
          tag="div"
          item-key="id"
          @start="handleDragStart"
          @end="handleDragEnd"
          @change="handleDragChange"
        >
          <template #item="{ element: matter, index }">
            <div class="matter-item" :class="{ 'processing': isMatterProcessing(matter) }">
              <TransitionGroup name="list" tag="div">
                <MatterCardEnhanced
                  :key="matter.id"
                  :matter="matter"
                  :viewPreferences="viewPreferences"
                  :isDragging="draggedMatter?.id === matter.id"
                  @click="handleMatterClick"
                  @edit="handleMatterEdit"
                  @update="handleMatterUpdate"
                  @keydown="(event: KeyboardEvent) => handleKeyboardNavigation(event, matter, index)"
                  :tabindex="0"
                  :class="{ 
                    'touch-optimized': isTouchDevice,
                    'mobile-card': isMobile,
                    'matter-processing': isMatterProcessing(matter)
                  }"
                  :aria-busy="isMatterProcessing(matter)"
                />
              </TransitionGroup>
              
              <!-- Processing overlay for individual matters -->
              <Transition name="fade">
                <div 
                  v-if="isMatterProcessing(matter)"
                  class="matter-processing-overlay"
                  aria-hidden="true"
                >
                  <span class="processing-spinner animate-spin" />
                </div>
              </Transition>
            </div>
          </template>
          
          <!-- Empty State Template -->
          <template #footer>
            <Transition name="scale">
              <div 
                v-if="matters.length === 0"
                class="empty-state"
                :aria-label="`No matters in ${columnTitle}`"
              >
                <div class="empty-content">
                  <div class="empty-icon animate-bounce">📋</div>
                  <div class="empty-text">No matters</div>
                  <div class="empty-hint">
                    <span v-if="isMobile">Tap to add</span>
                    <span v-else>Drag matters here</span>
                  </div>
                </div>
              </div>
            </Transition>
          </template>
        </draggable>
        
        <!-- Safe area padding for iOS -->
        <div 
          v-if="isMobile && safeAreaInsets.bottom > 0"
          class="safe-area-padding"
          :style="{ height: `${safeAreaInsets.bottom}px` }"
        />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Import animations */
@import '~/assets/css/animations.css';

/* Column container */
.kanban-column-animated {
  --column-width: 320px;
  --column-gap: 1rem;
  --mobile-column-width: 280px;
  --tablet-column-width: 300px;
  --touch-target-min: 44px;
  
  @apply flex flex-col h-full border border-gray-200 rounded-lg bg-white;
  @apply min-h-0 relative;
  width: var(--column-width);
  max-height: calc(100vh - 200px);
  transition: all 0.3s var(--animation-easing-standard);
  will-change: transform, box-shadow;
}

/* Animations enabled state */
.kanban-column-animated.animations-enabled {
  @apply animate-gpu;
}

/* Mobile-specific column states */
.kanban-column-animated.mobile-device {
  width: var(--mobile-column-width);
  @apply shadow-sm;
}

.kanban-column-animated.tablet-device {
  width: var(--tablet-column-width);
}

/* Drag states with enhanced animations */
.kanban-column-animated.drag-over {
  @apply bg-primary/5 scale-[1.02];
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.kanban-column-animated.drag-target {
  @apply ring-2 ring-primary ring-offset-2;
}

/* Enhanced drag ghost */
.drag-ghost-animated {
  @apply opacity-60 rotate-2 scale-95;
  transition: all var(--animation-duration-fast) var(--animation-easing-sharp);
}

.drag-chosen-animated {
  @apply cursor-grabbing z-50;
  transform: scale(1.05) rotate(2deg);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.drag-active-animated {
  @apply z-50;
  animation: drag-wiggle 0.3s ease-in-out infinite;
}

@keyframes drag-wiggle {
  0%, 100% { transform: rotate(2deg) scale(1.05); }
  50% { transform: rotate(-2deg) scale(1.05); }
}

/* Drop indicator */
.drop-indicator {
  @apply absolute left-3 right-3 h-0.5 bg-primary rounded-full;
  @apply transition-all duration-200;
  z-index: 10;
}

/* Column header */
.column-header {
  @apply flex-shrink-0 p-3 border-b border-gray-200 cursor-pointer relative;
  @apply hover:bg-gray-50;
  min-height: var(--touch-target-min);
  transition: background-color 0.2s var(--animation-easing-standard);
}

.header-content {
  @apply flex items-center justify-between;
}

.header-main {
  @apply flex items-center gap-2 flex-1 min-w-0;
}

.column-title {
  @apply text-sm font-semibold text-gray-900 truncate;
}

.header-badges {
  @apply flex items-center gap-2;
}

.matter-count {
  @apply text-xs font-medium flex-shrink-0;
}

.animation-status {
  font-size: 0.75rem; line-height: 1rem;
}

.mutation-indicator {
  @apply text-xs flex items-center gap-1;
}

.loading-spinner {
  @apply w-3 h-3 border border-transparent border-t-current rounded-full;
}

/* Column body */
.column-body {
  @apply flex-1 overflow-hidden relative;
}

/* Draggable container */
.matters-container {
  @apply h-full p-3 overflow-y-auto;
  min-height: 200px;
  scroll-behavior: smooth;
}

/* Matter item wrapper */
.matter-item {
  @apply mb-3 relative;
}

.matter-item.processing {
  @apply opacity-75;
}

.matter-processing-overlay {
  @apply absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center z-10;
  backdrop-filter: blur(2px);
}

.processing-spinner {
  @apply w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full;
}

/* Empty state with animation */
.empty-state {
  @apply flex items-center justify-center py-8;
  min-height: 120px;
}

.empty-content {
  @apply text-center;
}

.empty-icon {
  @apply text-2xl mb-2 opacity-50;
}

.empty-text {
  @apply text-sm text-gray-500 mb-1;
}

.empty-hint {
  @apply text-xs text-gray-400;
}

/* Collapse transition classes */
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s var(--animation-easing-standard);
  overflow: hidden;
}

.collapse-enter-from {
  opacity: 0;
  height: 0;
}

.collapse-leave-to {
  opacity: 0;
  height: 0;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .kanban-column-animated {
    --column-width: calc(100vw - 2rem);
    max-width: var(--mobile-column-width);
    margin: 0 auto;
  }
  
  .matters-container {
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .kanban-column-animated {
    transition: none !important;
  }
  
  .drag-ghost-animated,
  .drag-chosen-animated,
  .drag-active-animated {
    animation: none !important;
    transform: none !important;
  }
  
  .empty-icon {
    animation: none !important;
  }
}
</style>
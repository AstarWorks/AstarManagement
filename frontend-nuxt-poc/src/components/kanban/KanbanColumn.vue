<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import draggable from 'vuedraggable'
import { useBreakpoints } from '@vueuse/core'
import type { KanbanColumn, MatterCard, ViewPreferences, MatterStatus } from '~/types/kanban'
import { Badge } from '~/components/ui/badge'
import MatterCardComponent from './MatterCard.vue'
import { DEFAULT_VIEW_PREFERENCES } from '~/constants/kanban'
import { useKanbanDragDrop } from '~/composables/useKanbanDragDrop'
import { useTouchGestures, useMobileInteractions } from '~/composables/useTouchGestures'

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
  'update:matters': [matters: MatterCard[]]
  'matter-moved': [matter: MatterCard, fromStatus: MatterStatus, toStatus: MatterStatus]
  'keyboard-navigation': [direction: 'up' | 'down' | 'left' | 'right', matter: MatterCard]
  'column-collapse': [column: KanbanColumn]
  'swipe-action': [direction: string, column: KanbanColumn]
}>()

// Template refs
const columnRef = ref<HTMLElement | null>(null)
const scrollContainerRef = ref<HTMLElement | null>(null)

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

// Drag and drop functionality
const { canAcceptDrop, onDragStart, onDragEnd, onDragChange, isColumnDragTarget } = useKanbanDragDrop()

// Mobile-specific state
const isCollapsedMobile = ref(props.isCollapsed)
const showSwipeHint = ref(true)
const isScrolling = ref(false)

// Watch for swipe gestures on mobile
watch(swipeDirection, (direction) => {
  if (!isMobile.value || !direction) return
  
  emit('swipe-action', direction, props.column)
  
  // Hide swipe hint after first use
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

// Get the first status from the column for validation
const columnStatus = computed(() => props.column.status as MatterStatus)

// Computed properties
const columnTitle = computed(() => 
  props.showJapanese ? props.column.titleJa : props.column.title
)

const matterCount = computed(() => props.matters.length)

const columnClasses = computed(() => [
  'kanban-column',
  props.className,
  props.column.color,
  {
    'drag-over': isColumnDragTarget(props.column.id),
    'mobile-device': isMobile.value,
    'tablet-device': isTablet.value,
    'touch-device': isTouchDevice.value,
    'collapsed-mobile': isCollapsedMobile.value && isMobile.value,
    'orientation-landscape': orientation.value === 'landscape',
    'is-pressed': isPressed.value,
    'is-scrolling': isScrolling.value
  }
])

// Reactive matters list for v-model
const matters = computed({
  get: () => props.matters,
  set: (value) => emit('update:matters', value)
})

// Mobile-optimized sortable configuration
const sortableConfig = computed(() => {
  const baseConfig = {
    animation: 150,
    ghostClass: 'drag-ghost',
    chosenClass: 'drag-chosen',
    dragClass: 'drag-active',
    forceFallback: isTouchDevice.value,
    fallbackClass: 'drag-fallback',
    removeCloneOnHide: true,
    preventOnFilter: false,
    scrollSensitivity: 30,
    scrollSpeed: 10
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

// Drag and drop event handlers
const handleDragChange = (event: any) => {
  const status = columnStatus.value
  if (!status) return
  
  const result = onDragChange(event, status)
  
  if (result && result.type === 'status_change') {
    emit('matter-moved', result.matter, result.fromStatus as MatterStatus, result.toStatus as MatterStatus)
  }
}

// Custom drop validation
const handleCanAcceptDrop = (to: any, from: any, dragEl: any): boolean => {
  return canAcceptDrop(to, from, dragEl)
}

// Scroll detection for mobile
const handleScrollStart = () => {
  isScrolling.value = true
}

const handleScrollEnd = () => {
  setTimeout(() => {
    isScrolling.value = false
  }, 150)
}

// Keyboard navigation for accessibility
const handleKeyboardNavigation = (event: KeyboardEvent, matter: MatterCard, index: number) => {
  const target = event.currentTarget as HTMLElement
  switch (event.key) {
    case 'ArrowUp':
      event.preventDefault()
      if (index > 0 && target.parentElement) {
        // Focus previous matter card
        const previousCard = target.parentElement.previousElementSibling?.querySelector('[tabindex]') as HTMLElement
        previousCard?.focus()
      }
      emit('keyboard-navigation', 'up', matter)
      break
      
    case 'ArrowDown':
      event.preventDefault()
      if (index < props.matters.length - 1 && target.parentElement) {
        // Focus next matter card
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
      
    case 'Enter':
    case ' ':
      event.preventDefault()
      handleMatterClick(matter)
      break
  }
}

// Collapse transition handlers
const onCollapseEnter = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = '0'
  element.style.overflow = 'hidden'
  element.offsetHeight // Force reflow
  element.style.transition = 'height 0.3s ease'
  element.style.height = `${element.scrollHeight}px`
  
  setTimeout(() => {
    element.style.height = ''
    element.style.overflow = ''
    element.style.transition = ''
  }, 300)
}

const onCollapseLeave = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = `${element.scrollHeight}px`
  element.style.overflow = 'hidden'
  element.offsetHeight // Force reflow
  element.style.transition = 'height 0.3s ease'
  element.style.height = '0'
}
</script>

<template>
  <div ref="columnRef" :class="columnClasses" :data-column-id="column.id">
    <!-- Mobile Swipe Hint -->
    <transition name="fade">
      <div 
        v-if="isMobile && showSwipeHint && matters.length > 0"
        class="swipe-hint"
        aria-label="Swipe left or right for actions"
      >
        <span class="swipe-icon">👆</span>
        <span class="swipe-text">Swipe for actions</span>
      </div>
    </transition>

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
          <Badge 
            variant="secondary" 
            class="matter-count"
            :aria-label="`${matterCount} matters in ${columnTitle}`"
          >
            {{ matterCount }}
          </Badge>
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
      
      <!-- Long press indicator -->
      <transition name="scale">
        <div 
          v-if="isMobile && isPressed && !isLongPress"
          class="long-press-indicator"
          aria-hidden="true"
        />
      </transition>
    </header>

    <!-- Column Body with Drag & Drop -->
    <transition 
      name="collapse"
      @enter="onCollapseEnter"
      @leave="onCollapseLeave"
    >
      <div 
        v-if="!isCollapsedMobile || !isMobile"
        ref="scrollContainerRef"
        class="column-body" 
        :data-testid="`column-${column.id}`"
        @touchstart="handleScrollStart"
        @touchend="handleScrollEnd"
        @scroll="handleScrollStart"
        @scrollend="handleScrollEnd"
      >
        <!-- Mobile drag indicator -->
        <div 
          v-if="isMobile && dragOffset[1] !== 0"
          class="drag-indicator"
          :style="{
            transform: `translateY(${dragOffset[1]}px)`,
            opacity: Math.min(Math.abs(dragOffset[1]) / 100, 1)
          }"
        >
          <span class="drag-arrow">↕</span>
        </div>

        <!-- Draggable Matter Cards -->
        <draggable
          v-model="matters"
          :group="{ name: 'kanban', pull: true, put: handleCanAcceptDrop }"
          v-bind="sortableConfig"
          :data-status="columnStatus"
          class="matters-container"
          tag="div"
          item-key="id"
          @start="onDragStart"
          @end="onDragEnd"
          @change="handleDragChange"
        >
          <template #item="{ element: matter, index }">
            <div class="matter-item">
              <MatterCardComponent
                :matter="matter"
                :viewPreferences="viewPreferences"
                @click="handleMatterClick"
                @edit="handleMatterEdit"
                @keydown="(event: KeyboardEvent) => handleKeyboardNavigation(event, matter, index)"
                :tabindex="0"
                :class="{ 
                  'touch-optimized': isTouchDevice,
                  'mobile-card': isMobile
                }"
              />
            </div>
          </template>
          
          <!-- Empty State Template -->
          <template #footer>
            <div 
              v-if="matters.length === 0"
              class="empty-state"
              :aria-label="`No matters in ${columnTitle}`"
            >
              <div class="empty-content">
                <div class="empty-icon">📋</div>
                <div class="empty-text">No matters</div>
                <div class="empty-hint">
                  <span v-if="isMobile">Tap to add</span>
                  <span v-else>Drag matters here</span>
                </div>
              </div>
            </div>
          </template>
        </draggable>
        
        <!-- Safe area padding for iOS -->
        <div 
          v-if="isMobile && safeAreaInsets.bottom > 0"
          class="safe-area-padding"
          :style="{ height: `${safeAreaInsets.bottom}px` }"
        />
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* Column container */
.kanban-column {
  --column-width: 320px;
  --column-gap: 1rem;
  --animation-duration: 150ms;
  --mobile-column-width: 280px;
  --tablet-column-width: 300px;
  --touch-target-min: 44px;
  
  @apply flex flex-col h-full border border-gray-200 rounded-lg bg-white;
  @apply min-h-0 relative; /* Allow column to shrink */
  width: var(--column-width);
  max-height: calc(100vh - 200px);
  transition: all 0.3s ease;
}

/* Mobile-specific column states */
.kanban-column.mobile-device {
  width: var(--mobile-column-width);
  @apply shadow-sm;
}

.kanban-column.tablet-device {
  width: var(--tablet-column-width);
}

.kanban-column.touch-device {
  touch-action: pan-y;
  -webkit-tap-highlight-color: transparent;
}

.kanban-column.collapsed-mobile {
  width: auto;
  min-width: 80px;
}

.kanban-column.is-pressed {
  @apply scale-[0.98] shadow-lg;
}

.kanban-column.is-scrolling .matters-container {
  pointer-events: none;
}

/* Column header */
.column-header {
  @apply flex-shrink-0 p-3 border-b border-gray-200 cursor-pointer relative;
  @apply hover:bg-gray-50 transition-colors;
  min-height: var(--touch-target-min);
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

.matter-count {
  @apply text-xs font-medium flex-shrink-0;
}

/* Mobile collapse indicator */
.collapse-indicator {
  @apply ml-2 flex-shrink-0;
}

.chevron {
  @apply text-gray-400 transition-transform duration-300;
  transform: rotate(90deg);
}

.chevron.collapsed {
  transform: rotate(0deg);
}

/* Long press indicator */
.long-press-indicator {
  @apply absolute inset-0 bg-primary/10 rounded-lg;
  animation: pulse 0.5s ease-in-out;
}

/* Swipe hint */
.swipe-hint {
  @apply absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full;
  @apply bg-gray-900 text-white text-xs rounded-full px-3 py-1 mb-2;
  @apply flex items-center gap-1 whitespace-nowrap;
  z-index: 10;
}

.swipe-icon {
  @apply text-sm;
  animation: swipe 2s ease-in-out infinite;
}

/* Drag indicator */
.drag-indicator {
  @apply absolute top-0 left-0 right-0 flex items-center justify-center;
  @apply text-gray-400 text-2xl font-bold;
  pointer-events: none;
  transition: transform 0.1s ease-out;
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

/* Mobile-optimized scrolling */
.mobile-device .matters-container {
  -webkit-overflow-scrolling: touch;
  scroll-snap-type: y proximity;
  overscroll-behavior: contain;
}

/* Matter item wrapper */
.matter-item {
  @apply mb-3;
}

.mobile-device .matter-item {
  scroll-snap-align: start;
  margin-bottom: 12px;
}

/* Touch-optimized matter cards */
.matter-item :deep(.touch-optimized) {
  min-height: var(--touch-target-min);
  @apply active:scale-[0.98] transition-transform;
}

.matter-item :deep(.mobile-card) {
  @apply shadow-sm active:shadow-md;
}

/* Drag-and-drop visual states */
.kanban-column :deep(.drag-ghost) {
  opacity: 0.5;
  transform: scale(0.95);
  transition: transform var(--animation-duration) ease;
}

.kanban-column :deep(.drag-chosen) {
  cursor: grabbing !important;
  z-index: 1000;
}

.kanban-column :deep(.drag-active) {
  transform: rotate(2deg);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  z-index: 1001;
}

.kanban-column :deep(.drag-fallback) {
  cursor: grabbing !important;
  background: hsl(var(--card));
  border: 2px dashed hsl(var(--primary));
  border-radius: var(--radius);
}

/* Mobile drag states */
.mobile-device :deep(.drag-active) {
  transform: scale(1.05) rotate(1deg);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
}

/* Column drag over state */
.kanban-column.drag-over {
  background: hsl(var(--primary) / 0.05);
  border-color: hsl(var(--primary));
}

/* Empty state */
.empty-state {
  @apply flex items-center justify-center py-8;
  min-height: 120px;
}

.mobile-device .empty-state {
  min-height: var(--touch-target-min);
  @apply py-12;
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

/* Safe area padding */
.safe-area-padding {
  @apply flex-shrink-0;
}

/* Performance optimizations */
.kanban-column * {
  transform: translateZ(0); /* Enable hardware acceleration */
}

/* Animations */
@keyframes pulse {
  0% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes swipe {
  0%, 100% { transform: translateX(-3px); }
  50% { transform: translateX(3px); }
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scale-enter-active,
.scale-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.scale-enter-from,
.scale-leave-to {
  transform: scale(0.8);
  opacity: 0;
}

/* Mobile-specific layout */
@media (max-width: 768px) {
  .kanban-column {
    --column-width: calc(100vw - 2rem);
    max-width: var(--mobile-column-width);
    margin: 0 auto;
  }
  
  .column-header {
    @apply px-4 py-3;
    position: sticky;
    top: 0;
    z-index: 10;
    background: inherit;
  }
  
  .matters-container {
    padding-bottom: calc(80px + env(safe-area-inset-bottom));
  }
  
  /* Landscape mode adjustments */
  .orientation-landscape .kanban-column {
    --column-width: 320px;
    max-height: calc(100vh - 120px);
  }
}

/* Tablet adjustments */
@media (min-width: 768px) and (max-width: 1024px) {
  .kanban-column {
    --column-width: var(--tablet-column-width);
  }
  
  .column-header {
    @apply px-4;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .kanban-column {
    border-width: 2px;
  }
  
  .kanban-column.drag-over {
    border-width: 3px;
  }
  
  .swipe-hint {
    @apply border-2 border-white;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .kanban-column,
  .kanban-column.is-pressed,
  .kanban-column :deep(.drag-ghost),
  .kanban-column :deep(.drag-active),
  .chevron,
  .long-press-indicator,
  .swipe-icon {
    transition: none !important;
    animation: none !important;
    transform: none !important;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .kanban-column {
    @apply bg-gray-800 border-gray-700;
  }
  
  .column-header {
    @apply hover:bg-gray-700 border-gray-700;
  }
  
  .column-title {
    @apply text-gray-100;
  }
  
  .swipe-hint {
    @apply bg-gray-100 text-gray-900;
  }
}

/* Prevent text selection during drag */
:global(.dragging) {
  user-select: none;
  -webkit-user-select: none;
}

/* Touch interaction utilities */
.touch-action-none {
  touch-action: none;
}

.touch-action-pan-y {
  touch-action: pan-y;
}

.touch-action-manipulation {
  touch-action: manipulation;
}
</style>
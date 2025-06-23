---
task_id: T07_S07
sprint_sequence_id: S07
status: ready
complexity: High
last_updated: 2025-06-22T12:00:00Z
---

# Task: Mobile-Responsive Vue 3 Patterns and Touch Interaction Implementation

## Description
Implement comprehensive mobile-responsive design patterns for Vue 3/Nuxt.js with advanced touch gesture handling using @vueuse/gesture. This task focuses on converting mobile layout patterns from React to Vue 3, implementing sophisticated touch interactions for Kanban board manipulation, and optimizing mobile UX patterns specific to legal case management workflows. The implementation will establish mobile-first responsive design patterns, touch gesture systems, and performance optimizations for mobile devices.

## Goal / Objectives
- Convert React mobile layout patterns to Vue 3 responsive design with Composition API
- Implement advanced touch gesture handling using @vueuse/gesture for Kanban interactions
- Create mobile-optimized UX patterns for legal case management (swipe actions, touch feedback)
- Establish Vue 3-specific mobile performance optimizations and best practices
- Integrate touch interactions with shadcn-vue components and Nuxt.js patterns
- Implement progressive enhancement for desktop-to-mobile responsive design
- Create mobile-specific navigation patterns and touch-friendly interface elements

## Acceptance Criteria
- [ ] Mobile-first responsive design implemented with Vue 3 Composition API patterns
- [ ] @vueuse/gesture integration for advanced touch interactions (swipe, pinch, long-press)
- [ ] Touch-optimized Kanban card manipulation (swipe-to-reveal actions, drag gestures)
- [ ] Mobile navigation patterns with Vue transitions and touch feedback
- [ ] Performance optimizations for mobile devices (60fps scrolling, touch responsiveness)
- [ ] Accessibility features for mobile users (touch targets, screen reader support)
- [ ] Progressive enhancement from mobile to desktop layouts
- [ ] Integration with existing shadcn-vue components for mobile patterns
- [ ] Comprehensive Storybook documentation for mobile interaction patterns
- [ ] Mobile-specific testing suite with touch event simulation

## Subtasks
- [ ] Research and document Vue 3 mobile-responsive design patterns
- [ ] Install and configure @vueuse/gesture for Vue 3 touch handling
- [ ] Implement mobile-first CSS Grid/Flexbox layouts with Vue reactive classes
- [ ] Create touch-optimized Kanban card interactions (swipe actions, drag previews)
- [ ] Develop mobile navigation patterns with Vue Router and transitions
- [ ] Add mobile-specific performance optimizations (virtual scrolling, lazy loading)
- [ ] Implement touch feedback systems (haptic feedback, visual feedback)
- [ ] Create mobile-responsive form patterns for legal case management
- [ ] Add mobile accessibility features (focus management, touch targets)
- [ ] Integrate with Vue 3 lifecycle hooks for mobile-specific behavior
- [ ] Create comprehensive mobile Storybook stories and documentation
- [ ] Implement mobile-specific testing patterns with touch event simulation

## Technical Guidance

### Vue 3 Mobile-Responsive Design Architecture

**Mobile-First Component Pattern:**
```vue
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useBreakpoints, useMobile, useSwipe, usePointerSwipe } from '@vueuse/core'
import type { TouchGestureOptions, SwipeDirection } from '~/types/mobile'

// Mobile-responsive breakpoints using VueUse
const breakpoints = useBreakpoints({
  mobile: 0,
  tablet: 768,
  laptop: 1024,
  desktop: 1280,
})

const isMobile = breakpoints.smaller('tablet')
const isTablet = breakpoints.between('tablet', 'laptop')
const isDesktop = breakpoints.greaterOrEqual('laptop')

// Touch gesture configuration
const touchTarget = ref<HTMLElement>()
const { lengthX, lengthY, direction } = useSwipe(touchTarget, {
  threshold: 50,
  onSwipe(e: TouchEvent) {
    handleSwipeGesture(direction.value, lengthX.value, lengthY.value)
  },
  onSwipeEnd(e: TouchEvent, direction: SwipeDirection) {
    handleSwipeEnd(direction)
  }
})

// Mobile-specific reactive state
const mobileMenuOpen = ref(false)
const touchStartY = ref(0)
const isDragging = ref(false)
const currentGesture = ref<string | null>(null)

// Computed properties for responsive layout
const layoutClasses = computed(() => ({
  'mobile-layout': isMobile.value,
  'tablet-layout': isTablet.value,
  'desktop-layout': isDesktop.value,
  'touch-enabled': isMobile.value || isTablet.value
}))

const cardInteractionClasses = computed(() => ({
  'touch-optimized': isMobile.value,
  'hover-enabled': isDesktop.value,
  'gesture-active': currentGesture.value !== null
}))

// Mobile-specific methods
const handleSwipeGesture = (dir: SwipeDirection, deltaX: number, deltaY: number) => {
  currentGesture.value = dir
  
  switch (dir) {
    case 'left':
      handleSwipeLeft(deltaX)
      break
    case 'right':
      handleSwipeRight(deltaX)
      break
    case 'up':
      handleSwipeUp(deltaY)
      break
    case 'down':
      handleSwipeDown(deltaY)
      break
  }
}

const handleSwipeEnd = (direction: SwipeDirection) => {
  currentGesture.value = null
  // Implement swipe action completion logic
}

// Performance optimization for mobile
const { pause: pauseGestures, resume: resumeGestures } = useSwipe(touchTarget)

// Lifecycle hooks for mobile optimization
onMounted(() => {
  if (isMobile.value) {
    // Initialize mobile-specific features
    setupMobileOptimizations()
  }
})

watch(isMobile, (newValue) => {
  if (newValue) {
    setupMobileOptimizations()
  } else {
    cleanupMobileFeatures()
  }
})
</script>

<template>
  <div 
    ref="touchTarget"
    :class="[layoutClasses, 'responsive-container']"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <!-- Mobile Layout -->
    <div v-if="isMobile" class="mobile-kanban-layout">
      <MobileHeader 
        :menu-open="mobileMenuOpen"
        @toggle-menu="mobileMenuOpen = !mobileMenuOpen"
      />
      
      <Transition name="slide-mobile" mode="out-in">
        <MobileKanbanView 
          :current-gesture="currentGesture"
          :is-dragging="isDragging"
          @swipe-action="handleMobileSwipeAction"
        />
      </Transition>
      
      <MobileBottomNavigation 
        :active-section="activeSection"
        @navigate="handleMobileNavigation"
      />
    </div>

    <!-- Tablet Layout -->
    <div v-else-if="isTablet" class="tablet-kanban-layout">
      <TabletSplitView 
        :touch-enabled="true"
        @gesture="handleTabletGesture"
      />
    </div>

    <!-- Desktop Layout -->
    <div v-else class="desktop-kanban-layout">
      <DesktopKanbanView 
        :show-mobile-features="false"
      />
    </div>
  </div>
</template>

<style scoped>
.responsive-container {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: relative;
}

/* Mobile-First CSS */
.mobile-kanban-layout {
  @apply flex flex-col h-full;
  touch-action: pan-y;
}

.tablet-kanban-layout {
  @apply grid grid-cols-2 h-full gap-4 p-4;
  touch-action: manipulation;
}

.desktop-kanban-layout {
  @apply flex h-full;
  touch-action: auto;
}

/* Touch Optimization */
.touch-optimized {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  touch-action: manipulation;
}

/* Mobile Transitions */
.slide-mobile-enter-active,
.slide-mobile-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-mobile-enter-from {
  transform: translateX(100%);
}

.slide-mobile-leave-to {
  transform: translateX(-100%);
}

/* Performance Optimizations */
@media (max-width: 768px) {
  .responsive-container {
    -webkit-overflow-scrolling: touch;
    transform: translateZ(0); /* Force GPU acceleration */
  }
}
</style>
```

### @vueuse/gesture Integration Patterns

**Advanced Touch Gesture Handling:**
```typescript
// composables/useTouchGestures.ts
import { ref, computed } from 'vue'
import { useSwipe, useDraggable, usePointerSwipe, useGesture } from '@vueuse/core'
import type { 
  SwipeGestureConfig, 
  DragGestureConfig, 
  TouchGestureState 
} from '~/types/mobile'

export function useTouchGestures(
  target: Ref<HTMLElement | undefined>,
  options: TouchGestureConfig = {}
) {
  const gestureState = ref<TouchGestureState>({
    isActive: false,
    direction: null,
    velocity: 0,
    deltaX: 0,
    deltaY: 0
  })

  // Swipe gesture configuration
  const { 
    direction: swipeDirection,
    lengthX,
    lengthY,
    isSwiping 
  } = useSwipe(target, {
    threshold: options.swipeThreshold || 50,
    onSwipe: (e: TouchEvent) => {
      gestureState.value.isActive = true
      gestureState.value.direction = swipeDirection.value
      gestureState.value.deltaX = lengthX.value
      gestureState.value.deltaY = lengthY.value
      
      options.onSwipe?.(gestureState.value)
    },
    onSwipeEnd: (e: TouchEvent, direction: SwipeDirection) => {
      gestureState.value.isActive = false
      options.onSwipeEnd?.(direction, gestureState.value)
    }
  })

  // Draggable gesture for Kanban cards
  const { 
    x: dragX, 
    y: dragY, 
    isDragging,
    style: dragStyle 
  } = useDraggable(target, {
    initialValue: { x: 0, y: 0 },
    onStart: (position, event) => {
      gestureState.value.isActive = true
      options.onDragStart?.(position, event)
    },
    onMove: (position, event) => {
      gestureState.value.deltaX = position.x
      gestureState.value.deltaY = position.y
      options.onDragMove?.(position, event)
    },
    onEnd: (position, event) => {
      gestureState.value.isActive = false
      options.onDragEnd?.(position, event)
    }
  })

  // Long press gesture for context menus
  const { isPressed: isLongPressed } = useLongPress(target, {
    delay: 500,
    onPress: () => {
      options.onLongPress?.(gestureState.value)
    }
  })

  // Multi-touch pinch gesture
  const pinchGesture = useGesture({
    onPinch: ({ scale, origin }) => {
      options.onPinch?.(scale, origin)
    }
  })

  // Combined gesture state
  const combinedGestureState = computed(() => ({
    ...gestureState.value,
    isDragging: isDragging.value,
    isSwiping: isSwiping.value,
    isLongPressed: isLongPressed.value,
    dragPosition: { x: dragX.value, y: dragY.value }
  }))

  return {
    gestureState: combinedGestureState,
    dragStyle,
    // Individual gesture controls
    swipeDirection,
    isDragging,
    isLongPressed,
    // Methods
    resetGesture: () => {
      gestureState.value = {
        isActive: false,
        direction: null,
        velocity: 0,
        deltaX: 0,
        deltaY: 0
      }
    }
  }
}
```

**Kanban Card Touch Interactions:**
```vue
<script setup lang="ts">
// components/kanban/MobileKanbanCard.vue
import { ref, computed } from 'vue'
import { useTouchGestures } from '~/composables/useTouchGestures'
import type { MatterCard, SwipeAction } from '~/types/kanban'

interface Props {
  matter: MatterCard
  swipeActions?: SwipeAction[]
  touchEnabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  touchEnabled: true,
  swipeActions: () => []
})

const emit = defineEmits<{
  swipeAction: [action: string, matter: MatterCard]
  dragStart: [matter: MatterCard]
  dragEnd: [matter: MatterCard, targetColumn: string]
  longPress: [matter: MatterCard]
}>()

const cardRef = ref<HTMLElement>()
const { gestureState, dragStyle } = useTouchGestures(cardRef, {
  swipeThreshold: 80,
  onSwipe: (state) => {
    handleCardSwipe(state.direction, state.deltaX)
  },
  onSwipeEnd: (direction, state) => {
    completeSwipeAction(direction, state.deltaX)
  },
  onDragStart: () => {
    emit('dragStart', props.matter)
  },
  onDragEnd: (position) => {
    const targetColumn = getDropTargetColumn(position)
    if (targetColumn) {
      emit('dragEnd', props.matter, targetColumn)
    }
  },
  onLongPress: () => {
    emit('longPress', props.matter)
  }
})

// Swipe action configuration
const leftSwipeAction = computed(() => 
  props.swipeActions.find(action => action.direction === 'left')
)

const rightSwipeAction = computed(() => 
  props.swipeActions.find(action => action.direction === 'right')
)

// Dynamic classes based on gesture state
const cardClasses = computed(() => ({
  'is-dragging': gestureState.value.isDragging,
  'is-swiping': gestureState.value.isSwiping,
  'is-long-pressed': gestureState.value.isLongPressed,
  'swipe-left-active': gestureState.value.direction === 'left',
  'swipe-right-active': gestureState.value.direction === 'right'
}))

// Swipe reveal animation
const swipeRevealStyle = computed(() => {
  const deltaX = gestureState.value.deltaX
  
  if (!gestureState.value.isSwiping) return {}
  
  return {
    transform: `translateX(${Math.max(-100, Math.min(100, deltaX))}px)`,
    transition: gestureState.value.isActive ? 'none' : 'transform 0.3s ease'
  }
})

const handleCardSwipe = (direction: SwipeDirection, deltaX: number) => {
  // Provide haptic feedback on mobile
  if ('vibrate' in navigator) {
    navigator.vibrate(10)
  }
  
  // Show swipe action preview
  showSwipeActionPreview(direction, deltaX)
}

const completeSwipeAction = (direction: SwipeDirection, deltaX: number) => {
  const threshold = 80
  
  if (Math.abs(deltaX) > threshold) {
    const action = direction === 'left' ? leftSwipeAction.value : rightSwipeAction.value
    if (action) {
      emit('swipeAction', action.id, props.matter)
    }
  }
}
</script>

<template>
  <div 
    ref="cardRef"
    :class="['mobile-kanban-card', cardClasses]"
    :style="[dragStyle, swipeRevealStyle]"
  >
    <!-- Swipe Action Backgrounds -->
    <div 
      v-if="leftSwipeAction"
      class="swipe-action-left"
      :class="{ active: gestureState.direction === 'right' }"
    >
      <Icon :name="leftSwipeAction.icon" />
      <span>{{ leftSwipeAction.label }}</span>
    </div>
    
    <div 
      v-if="rightSwipeAction"
      class="swipe-action-right"
      :class="{ active: gestureState.direction === 'left' }"
    >
      <Icon :name="rightSwipeAction.icon" />
      <span>{{ rightSwipeAction.label }}</span>
    </div>

    <!-- Card Content -->
    <div class="card-content">
      <div class="card-header">
        <Badge :variant="matter.priority">{{ matter.priority }}</Badge>
        <span class="matter-id">{{ matter.id }}</span>
      </div>
      
      <h3 class="matter-title">{{ matter.title }}</h3>
      
      <div class="matter-meta">
        <span class="client-name">{{ matter.clientName }}</span>
        <span class="due-date">{{ formatDate(matter.dueDate) }}</span>
      </div>
      
      <div class="card-actions">
        <Button 
          v-for="action in matter.quickActions"
          :key="action.id"
          variant="ghost" 
          size="sm"
          @click="$emit('quickAction', action.id, matter)"
        >
          <Icon :name="action.icon" class="w-4 h-4" />
        </Button>
      </div>
    </div>

    <!-- Touch Feedback Overlay -->
    <div 
      v-if="gestureState.isActive"
      class="touch-feedback-overlay"
    />
  </div>
</template>

<style scoped>
.mobile-kanban-card {
  @apply relative bg-white rounded-lg shadow-md border border-gray-200;
  @apply transform-gpu; /* GPU acceleration for smooth animations */
  position: relative;
  overflow: hidden;
  min-height: 120px;
  touch-action: pan-y;
}

.card-content {
  @apply p-4 relative z-10;
  background: white;
  transition: transform 0.2s ease;
}

/* Swipe Action Backgrounds */
.swipe-action-left,
.swipe-action-right {
  @apply absolute inset-y-0 flex items-center justify-center;
  @apply text-white font-medium;
  width: 80px;
  z-index: 1;
  transition: all 0.2s ease;
}

.swipe-action-left {
  @apply left-0 bg-red-500;
  transform: translateX(-100%);
}

.swipe-action-right {
  @apply right-0 bg-green-500;
  transform: translateX(100%);
}

.swipe-action-left.active {
  transform: translateX(0);
}

.swipe-action-right.active {
  transform: translateX(0);
}

/* Gesture States */
.is-dragging {
  @apply shadow-xl scale-105;
  z-index: 50;
}

.is-dragging .card-content {
  transform: rotate(3deg);
}

.is-long-pressed {
  @apply scale-98;
}

.is-long-pressed::before {
  content: '';
  @apply absolute inset-0 bg-blue-100 rounded-lg;
  animation: pulse 0.5s ease-in-out;
}

/* Touch Feedback */
.touch-feedback-overlay {
  @apply absolute inset-0 bg-blue-500 rounded-lg;
  opacity: 0.1;
  animation: touchFeedback 0.2s ease-out;
}

@keyframes touchFeedback {
  0% { 
    opacity: 0.2; 
    transform: scale(0.95); 
  }
  100% { 
    opacity: 0.1; 
    transform: scale(1); 
  }
}

/* Responsive Touch Targets */
@media (max-width: 768px) {
  .card-actions button {
    @apply min-w-[44px] min-h-[44px]; /* WCAG touch target size */
  }
  
  .mobile-kanban-card {
    @apply mx-2 mb-3; /* Better mobile spacing */
  }
}
</style>
```

### Mobile Navigation Patterns

**Vue 3 Mobile Navigation with Touch Gestures:**
```vue
<script setup lang="ts">
// components/navigation/MobileNavigation.vue
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSwipe } from '@vueuse/core'

const router = useRouter()
const route = useRoute()

const navigationRef = ref<HTMLElement>()
const isMenuOpen = ref(false)
const activeTab = ref(0)

// Swipe navigation between tabs
const { direction, lengthX } = useSwipe(navigationRef, {
  threshold: 50,
  onSwipeEnd: (e, direction) => {
    if (direction === 'left' && activeTab.value < navigationItems.length - 1) {
      activeTab.value += 1
    } else if (direction === 'right' && activeTab.value > 0) {
      activeTab.value -= 1
    }
  }
})

const navigationItems = [
  { id: 'kanban', label: 'Cases', labelJa: 'ケース', icon: 'layout-grid', route: '/kanban' },
  { id: 'matters', label: 'Matters', labelJa: '案件', icon: 'file-text', route: '/matters' },
  { id: 'documents', label: 'Documents', labelJa: '書類', icon: 'folder', route: '/documents' },
  { id: 'clients', label: 'Clients', labelJa: 'クライアント', icon: 'users', route: '/clients' },
  { id: 'calendar', label: 'Calendar', labelJa: 'カレンダー', icon: 'calendar', route: '/calendar' }
]

const currentRoute = computed(() => 
  navigationItems.find(item => route.path.startsWith(item.route))
)

// Watch for route changes to update active tab
watch(() => route.path, (newPath) => {
  const index = navigationItems.findIndex(item => newPath.startsWith(item.route))
  if (index !== -1) {
    activeTab.value = index
  }
})

const handleTabNavigation = (index: number, item: NavigationItem) => {
  activeTab.value = index
  router.push(item.route)
  
  // Haptic feedback
  if ('vibrate' in navigator) {
    navigator.vibrate(5)
  }
}
</script>

<template>
  <nav class="mobile-navigation" ref="navigationRef">
    <!-- Top Navigation Bar -->
    <div class="mobile-nav-header">
      <button 
        class="menu-toggle"
        @click="isMenuOpen = !isMenuOpen"
        :aria-expanded="isMenuOpen"
      >
        <Icon name="menu" class="w-6 h-6" />
      </button>
      
      <h1 class="nav-title">
        {{ currentRoute?.label || 'Aster Management' }}
      </h1>
      
      <button class="user-menu">
        <Avatar size="sm" />
      </button>
    </div>

    <!-- Swipeable Tab Content -->
    <div class="tab-content-container">
      <div 
        class="tab-content-slider"
        :style="{ transform: `translateX(-${activeTab * 100}%)` }"
      >
        <div 
          v-for="(item, index) in navigationItems"
          :key="item.id"
          class="tab-content-panel"
        >
          <RouterView v-if="index === activeTab" />
        </div>
      </div>
    </div>

    <!-- Bottom Tab Navigation -->
    <div class="bottom-tab-bar">
      <button
        v-for="(item, index) in navigationItems"
        :key="item.id"
        :class="['tab-button', { active: activeTab === index }]"
        @click="handleTabNavigation(index, item)"
      >
        <Icon :name="item.icon" class="tab-icon" />
        <span class="tab-label">{{ item.label }}</span>
        <div v-if="activeTab === index" class="active-indicator" />
      </button>
    </div>

    <!-- Slide-out Menu -->
    <Transition name="slide-menu">
      <div 
        v-if="isMenuOpen"
        class="mobile-menu-overlay"
        @click="isMenuOpen = false"
      >
        <div class="mobile-menu" @click.stop>
          <MobileMenuContent @close="isMenuOpen = false" />
        </div>
      </div>
    </Transition>
  </nav>
</template>

<style scoped>
.mobile-navigation {
  @apply flex flex-col h-full bg-white;
  touch-action: pan-x;
}

.mobile-nav-header {
  @apply flex items-center justify-between p-4 border-b bg-white;
  @apply sticky top-0 z-20;
}

.tab-content-container {
  @apply flex-1 overflow-hidden relative;
}

.tab-content-slider {
  @apply flex h-full transition-transform duration-300 ease-out;
  width: calc(100% * 5); /* 5 tabs */
}

.tab-content-panel {
  @apply flex-1 overflow-auto;
  width: 20%; /* 100% / 5 tabs */
}

.bottom-tab-bar {
  @apply flex bg-white border-t safe-area-pb;
  @apply sticky bottom-0 z-20;
}

.tab-button {
  @apply flex-1 flex flex-col items-center justify-center;
  @apply py-2 px-1 relative min-h-[60px];
  @apply text-gray-600 active:text-blue-600;
  @apply transition-all duration-200;
  touch-action: manipulation;
}

.tab-button.active {
  @apply text-blue-600;
}

.tab-icon {
  @apply w-6 h-6 mb-1;
}

.tab-label {
  @apply text-xs font-medium;
}

.active-indicator {
  @apply absolute bottom-0 left-1/2 transform -translate-x-1/2;
  @apply w-4 h-0.5 bg-blue-600 rounded-full;
}

/* Menu Transitions */
.slide-menu-enter-active,
.slide-menu-leave-active {
  transition: opacity 0.3s ease;
}

.slide-menu-enter-from,
.slide-menu-leave-to {
  opacity: 0;
}

.mobile-menu-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 z-50;
  @apply flex items-end;
}

.mobile-menu {
  @apply w-full bg-white rounded-t-xl;
  @apply transform transition-transform duration-300 ease-out;
  max-height: 80vh;
}

/* Safe Area Support */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .safe-area-pb {
    padding-bottom: env(safe-area-inset-bottom);
  }
}
</style>
```

### Mobile Performance Optimizations

**Vue 3 Mobile Performance Patterns:**
```typescript
// composables/useMobileOptimizations.ts
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useIntersectionObserver, useVirtualList, useThrottleFn } from '@vueuse/core'

export function useMobileOptimizations() {
  const isLowEndDevice = ref(false)
  const memoryInfo = ref<any>(null)
  const connectionInfo = ref<any>(null)

  // Device capability detection
  onMounted(() => {
    // Memory detection
    if ('memory' in navigator) {
      memoryInfo.value = (navigator as any).memory
      isLowEndDevice.value = memoryInfo.value.jsHeapSizeLimit < 1073741824 // < 1GB
    }

    // Connection detection
    if ('connection' in navigator) {
      connectionInfo.value = (navigator as any).connection
    }
  })

  // Virtual scrolling for large lists
  const useVirtualScrolling = (
    items: Ref<any[]>,
    containerHeight: number,
    itemHeight: number
  ) => {
    const { list, containerProps, wrapperProps } = useVirtualList(
      items,
      {
        itemHeight,
        overscan: 5,
      }
    )

    return {
      virtualList: list,
      containerProps: {
        ...containerProps,
        style: {
          ...containerProps.style,
          height: `${containerHeight}px`
        }
      },
      wrapperProps
    }
  }

  // Intersection observer for lazy loading
  const useLazyLoading = (targetSelector: string) => {
    const targets = ref<HTMLElement[]>([])
    const { stop } = useIntersectionObserver(
      targets,
      ([{ isIntersecting, target }]) => {
        if (isIntersecting) {
          const img = target as HTMLImageElement
          if (img.dataset.src) {
            img.src = img.dataset.src
            img.removeAttribute('data-src')
            targets.value = targets.value.filter(t => t !== target)
          }
        }
      }
    )

    return { targets, stop }
  }

  // Throttled scroll handling
  const useThrottledScroll = (callback: Function, delay = 16) => {
    return useThrottleFn(callback, delay)
  }

  // Touch-friendly hit targets
  const useTouchTargets = () => {
    const ensureMinTouchTarget = (element: HTMLElement, minSize = 44) => {
      const rect = element.getBoundingClientRect()
      if (rect.width < minSize || rect.height < minSize) {
        element.style.minWidth = `${minSize}px`
        element.style.minHeight = `${minSize}px`
      }
    }

    return { ensureMinTouchTarget }
  }

  return {
    isLowEndDevice,
    memoryInfo,
    connectionInfo,
    useVirtualScrolling,
    useLazyLoading,
    useThrottledScroll,
    useTouchTargets
  }
}
```

**Mobile-Optimized Kanban Board:**
```vue
<script setup lang="ts">
// components/kanban/MobileOptimizedKanbanBoard.vue
import { ref, computed, onMounted } from 'vue'
import { useMobileOptimizations } from '~/composables/useMobileOptimizations'
import { useTouchGestures } from '~/composables/useTouchGestures'

const props = defineProps<{
  matters: MatterCard[]
  columns: KanbanColumn[]
}>()

const { 
  isLowEndDevice, 
  useVirtualScrolling,
  useLazyLoading,
  useThrottledScroll 
} = useMobileOptimizations()

const boardContainer = ref<HTMLElement>()
const activeColumnIndex = ref(0)

// Virtual scrolling for large matter lists
const { virtualList, containerProps, wrapperProps } = useVirtualScrolling(
  computed(() => props.matters),
  600, // container height
  120  // item height
)

// Lazy loading for matter card images
const { targets: lazyImages } = useLazyLoading('img[data-src]')

// Touch gestures for column navigation
const { gestureState } = useTouchGestures(boardContainer, {
  onSwipe: (state) => {
    if (state.direction === 'left' && activeColumnIndex.value < props.columns.length - 1) {
      activeColumnIndex.value += 1
    } else if (state.direction === 'right' && activeColumnIndex.value > 0) {
      activeColumnIndex.value -= 1
    }
  }
})

// Performance-optimized rendering
const visibleMatters = computed(() => {
  const column = props.columns[activeColumnIndex.value]
  return props.matters.filter(matter => 
    column.status.includes(matter.status)
  )
})

// Reduced animations for low-end devices
const animationClasses = computed(() => ({
  'reduced-motion': isLowEndDevice.value,
  'full-animations': !isLowEndDevice.value
}))

// Throttled scroll handler
const handleScroll = useThrottledScroll((event: Event) => {
  // Handle scroll events efficiently
  const target = event.target as HTMLElement
  const scrollPercent = target.scrollTop / (target.scrollHeight - target.clientHeight)
  
  // Update scroll indicators or load more content
}, 16) // 60fps throttling
</script>

<template>
  <div 
    ref="boardContainer"
    :class="['mobile-kanban-board', animationClasses]"
    @scroll="handleScroll"
  >
    <!-- Column Navigation -->
    <div class="column-navigation">
      <div class="column-tabs">
        <button
          v-for="(column, index) in columns"
          :key="column.id"
          :class="['column-tab', { active: index === activeColumnIndex }]"
          @click="activeColumnIndex = index"
        >
          {{ column.titleJa || column.title }}
          <Badge variant="secondary" class="ml-2">
            {{ visibleMatters.length }}
          </Badge>
        </button>
      </div>
    </div>

    <!-- Virtual Scrolling Container -->
    <div v-bind="containerProps" class="matters-container">
      <div v-bind="wrapperProps">
        <div
          v-for="{ data: matter, index } in virtualList"
          :key="matter.id"
          class="matter-item"
        >
          <MobileKanbanCard
            :matter="matter"
            :lazy-load="true"
            @swipe-action="handleSwipeAction"
            @drag-end="handleDragEnd"
          />
        </div>
      </div>
    </div>

    <!-- Performance Overlay for Low-End Devices -->
    <div v-if="isLowEndDevice" class="performance-notice">
      <Icon name="zap-off" class="w-4 h-4" />
      <span class="text-sm">Optimized for your device</span>
    </div>
  </div>
</template>

<style scoped>
.mobile-kanban-board {
  @apply flex flex-col h-full bg-gray-50;
  touch-action: pan-y;
}

.column-navigation {
  @apply flex-shrink-0 bg-white border-b;
  @apply sticky top-0 z-10;
}

.column-tabs {
  @apply flex overflow-x-auto scrollbar-hide;
  @apply px-4 py-2;
}

.column-tab {
  @apply flex items-center px-4 py-2 rounded-lg;
  @apply text-sm font-medium whitespace-nowrap;
  @apply text-gray-600 bg-gray-100 mr-2;
  @apply transition-colors duration-200;
  @apply min-w-[120px] justify-center;
}

.column-tab.active {
  @apply text-blue-600 bg-blue-100;
}

.matters-container {
  @apply flex-1 px-4;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.matter-item {
  @apply mb-3;
}

/* Performance Optimizations */
.reduced-motion * {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
}

.performance-notice {
  @apply fixed bottom-20 right-4 flex items-center;
  @apply px-3 py-2 bg-amber-100 text-amber-800;
  @apply rounded-full text-xs shadow-md;
}

/* GPU Acceleration */
.mobile-kanban-board {
  transform: translateZ(0);
  backface-visibility: hidden;
}

/* Smooth Scrolling */
@media (prefers-reduced-motion: no-preference) {
  .matters-container {
    scroll-behavior: smooth;
  }
}
</style>
```

### Mobile-Specific Form Patterns

**Touch-Optimized Form Components:**
```vue
<script setup lang="ts">
// components/forms/MobileOptimizedForm.vue
import { ref, computed } from 'vue'
import { useForm } from 'vee-validate'
import { useMobile } from '@vueuse/core'

const isMobile = useMobile()

const { handleSubmit, errors, values, setFieldValue } = useForm({
  validationSchema: formSchema
})

// Mobile-specific form behavior
const activeFieldIndex = ref(0)
const showVirtualKeyboard = ref(false)

const formFields = [
  { name: 'title', type: 'text', label: 'Matter Title', required: true },
  { name: 'client', type: 'select', label: 'Client', required: true },
  { name: 'description', type: 'textarea', label: 'Description' },
  { name: 'priority', type: 'radio', label: 'Priority', required: true },
  { name: 'dueDate', type: 'date', label: 'Due Date' }
]

// Auto-advance to next field on mobile
const handleFieldComplete = (fieldIndex: number) => {
  if (isMobile.value && fieldIndex < formFields.length - 1) {
    activeFieldIndex.value = fieldIndex + 1
    nextTick(() => {
      const nextField = document.querySelector(`[data-field-index="${fieldIndex + 1}"]`) as HTMLElement
      nextField?.focus()
    })
  }
}

const handleVirtualKeyboard = (show: boolean) => {
  showVirtualKeyboard.value = show
  
  // Adjust viewport for virtual keyboard
  if (show) {
    document.documentElement.style.setProperty('--keyboard-height', '300px')
  } else {
    document.documentElement.style.removeProperty('--keyboard-height')
  }
}
</script>

<template>
  <form 
    :class="['mobile-form', { 'keyboard-open': showVirtualKeyboard }]"
    @submit="handleSubmit(onSubmit)"
  >
    <!-- Progress Indicator -->
    <div class="form-progress">
      <div 
        class="progress-bar"
        :style="{ width: `${((activeFieldIndex + 1) / formFields.length) * 100}%` }"
      />
    </div>

    <!-- Mobile Field Navigation -->
    <div v-if="isMobile" class="field-navigation">
      <button
        v-for="(field, index) in formFields"
        :key="field.name"
        :class="['field-nav-dot', { 
          active: index === activeFieldIndex,
          completed: index < activeFieldIndex,
          error: errors[field.name]
        }]"
        @click="activeFieldIndex = index"
      />
    </div>

    <!-- Form Fields -->
    <div class="form-fields">
      <div
        v-for="(field, index) in formFields"
        :key="field.name"
        :class="['field-container', { 
          active: index === activeFieldIndex || !isMobile,
          hidden: isMobile && index !== activeFieldIndex 
        }]"
        :data-field-index="index"
      >
        <FormField
          :name="field.name"
          :type="field.type"
          :label="field.label"
          :required="field.required"
          :mobile-optimized="isMobile"
          @focus="handleVirtualKeyboard(true)"
          @blur="handleVirtualKeyboard(false)"
          @complete="handleFieldComplete(index)"
        />
      </div>
    </div>

    <!-- Mobile Form Actions -->
    <div class="form-actions">
      <Button
        v-if="activeFieldIndex > 0 && isMobile"
        variant="outline"
        @click="activeFieldIndex -= 1"
      >
        Previous
      </Button>
      
      <Button
        v-if="activeFieldIndex < formFields.length - 1 && isMobile"
        @click="activeFieldIndex += 1"
      >
        Next
      </Button>
      
      <Button
        v-if="activeFieldIndex === formFields.length - 1 || !isMobile"
        type="submit"
        class="submit-button"
      >
        Save Matter
      </Button>
    </div>
  </form>
</template>

<style scoped>
.mobile-form {
  @apply flex flex-col h-full;
  transition: padding-bottom 0.3s ease;
}

.mobile-form.keyboard-open {
  padding-bottom: var(--keyboard-height, 0px);
}

.form-progress {
  @apply w-full h-1 bg-gray-200 mb-4;
}

.progress-bar {
  @apply h-full bg-blue-500 transition-all duration-300;
}

.field-navigation {
  @apply flex justify-center space-x-2 mb-6;
}

.field-nav-dot {
  @apply w-3 h-3 rounded-full bg-gray-300;
  @apply transition-all duration-200;
}

.field-nav-dot.active {
  @apply bg-blue-500 scale-125;
}

.field-nav-dot.completed {
  @apply bg-green-500;
}

.field-nav-dot.error {
  @apply bg-red-500;
}

.form-fields {
  @apply flex-1 relative;
}

.field-container {
  @apply transition-all duration-300;
}

.field-container.hidden {
  @apply absolute inset-0 opacity-0 pointer-events-none;
  transform: translateX(20px);
}

.field-container.active {
  @apply opacity-100;
  transform: translateX(0);
}

.form-actions {
  @apply flex justify-between mt-6 p-4;
  @apply sticky bottom-0 bg-white border-t;
}

.submit-button {
  @apply flex-1 ml-4 min-h-[48px]; /* WCAG touch target */
}

/* Mobile-specific optimizations */
@media (max-width: 768px) {
  .mobile-form {
    @apply px-4;
  }
  
  /* Larger touch targets */
  .field-nav-dot {
    @apply w-4 h-4;
  }
  
  /* Prevent zoom on input focus */
  input, select, textarea {
    font-size: 16px;
  }
}
</style>
```

### Accessibility and Testing Patterns

**Mobile Accessibility Implementation:**
```typescript
// composables/useMobileAccessibility.ts
import { ref, onMounted, onUnmounted } from 'vue'

export function useMobileAccessibility() {
  const isScreenReaderActive = ref(false)
  const currentFocusElement = ref<HTMLElement | null>(null)
  
  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    
    document.body.appendChild(announcement)
    
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }
  
  const manageFocusForMobile = (element: HTMLElement) => {
    if (window.innerWidth < 768) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      })
    }
    element.focus()
  }
  
  const setupKeyboardNavigation = () => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Custom keyboard navigation for mobile
      if (event.key === 'Tab') {
        // Ensure focus is visible on mobile
        const focusedElement = document.activeElement as HTMLElement
        if (focusedElement) {
          focusedElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
          })
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }
  
  onMounted(() => {
    const cleanup = setupKeyboardNavigation()
    onUnmounted(cleanup)
  })
  
  return {
    announceToScreenReader,
    manageFocusForMobile,
    isScreenReaderActive
  }
}
```

**Mobile Testing Utilities:**
```typescript
// utils/mobile-testing.ts
import { mount, VueWrapper } from '@vue/test-utils'

export class MobileTestUtils {
  static simulateTouch(wrapper: VueWrapper<any>, type: string, options: any = {}) {
    const touchEvent = new TouchEvent(type, {
      touches: [{
        clientX: options.clientX || 0,
        clientY: options.clientY || 0,
        identifier: 0,
        target: wrapper.element
      } as Touch],
      changedTouches: [{
        clientX: options.clientX || 0,
        clientY: options.clientY || 0,
        identifier: 0,
        target: wrapper.element
      } as Touch],
      bubbles: true,
      ...options
    })
    
    wrapper.element.dispatchEvent(touchEvent)
  }
  
  static simulateSwipe(
    wrapper: VueWrapper<any>, 
    direction: 'left' | 'right' | 'up' | 'down',
    distance: number = 100
  ) {
    const startX = direction === 'right' ? 0 : distance
    const startY = direction === 'down' ? 0 : distance
    const endX = direction === 'left' ? 0 : distance
    const endY = direction === 'up' ? 0 : distance
    
    this.simulateTouch(wrapper, 'touchstart', { clientX: startX, clientY: startY })
    this.simulateTouch(wrapper, 'touchmove', { clientX: endX, clientY: endY })
    this.simulateTouch(wrapper, 'touchend', { clientX: endX, clientY: endY })
  }
  
  static setMobileViewport() {
    Object.defineProperty(window, 'innerWidth', { value: 375 })
    Object.defineProperty(window, 'innerHeight', { value: 667 })
    window.dispatchEvent(new Event('resize'))
  }
  
  static setTabletViewport() {
    Object.defineProperty(window, 'innerWidth', { value: 768 })
    Object.defineProperty(window, 'innerHeight', { value: 1024 })
    window.dispatchEvent(new Event('resize'))
  }
}

// Example test
describe('MobileKanbanCard', () => {
  beforeEach(() => {
    MobileTestUtils.setMobileViewport()
  })
  
  it('handles swipe left gesture', async () => {
    const wrapper = mount(MobileKanbanCard, {
      props: { matter: mockMatter }
    })
    
    MobileTestUtils.simulateSwipe(wrapper, 'left', 100)
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.emitted('swipeAction')).toBeTruthy()
  })
})
```

## Implementation Steps

**Phase 1: Foundation Setup**
1. Install and configure @vueuse/gesture and @vueuse/core
2. Create mobile-responsive design system with Tailwind CSS
3. Set up TypeScript interfaces for touch gestures and mobile components
4. Implement basic mobile breakpoint detection and responsive utilities

**Phase 2: Touch Gesture System**
5. Create useTouchGestures composable with swipe, drag, and long-press support
6. Implement mobile-optimized Kanban card with swipe actions
7. Add touch feedback systems (haptic feedback, visual feedback)
8. Create mobile navigation patterns with Vue Router integration

**Phase 3: Performance Optimization**
9. Implement virtual scrolling for large matter lists
10. Add mobile-specific performance optimizations (lazy loading, throttling)
11. Create low-end device detection and optimization strategies
12. Optimize bundle size and implement code splitting for mobile

**Phase 4: UX and Accessibility**
13. Implement mobile-specific form patterns and validation
14. Add accessibility features for mobile users (focus management, screen reader support)
15. Create mobile-optimized error handling and notification systems
16. Implement progressive enhancement patterns

**Phase 5: Testing and Documentation**
17. Create comprehensive Storybook stories for mobile interaction patterns
18. Implement mobile-specific testing utilities and test suites
19. Add performance testing for mobile devices
20. Create documentation for mobile development patterns

## Success Criteria

- [ ] Mobile-first responsive design works flawlessly across iOS/Android devices
- [ ] Touch gestures provide intuitive interaction patterns for legal workflows
- [ ] Performance targets met on mobile devices (60fps, <100ms touch response)
- [ ] Accessibility standards exceeded for mobile users (WCAG 2.1 AA+)
- [ ] Comprehensive test coverage for mobile-specific functionality (>95%)
- [ ] Storybook documentation covers all mobile interaction patterns
- [ ] Integration with existing Vue 3/Nuxt.js architecture maintained
- [ ] Touch interactions enhance rather than replace keyboard/mouse workflows

## Key Architectural Decisions

**Mobile-First Design Philosophy:**
- Progressive enhancement from mobile to desktop
- Touch interactions as primary input method
- Performance optimizations prioritize mobile experience
- Accessibility considerations include both touch and keyboard users

**Vue 3 Integration Strategy:**
- Leverage Composition API for mobile-specific logic separation
- Use VueUse ecosystem for touch gesture handling
- Maintain SSR compatibility for mobile SEO
- Integrate seamlessly with existing Pinia stores and shadcn-vue components

**Performance Optimization Approach:**
- Virtual scrolling for large datasets on mobile
- Lazy loading and intersection observer patterns
- Device capability detection for adaptive performance
- Bundle splitting and code splitting for mobile-first loading

## Scope Boundaries

**IN SCOPE (T07_S07):**
- Mobile-responsive design patterns for Vue 3/Nuxt.js
- Advanced touch gesture handling with @vueuse/gesture
- Mobile-optimized Kanban board interactions
- Touch-friendly form patterns and navigation
- Mobile performance optimizations and accessibility
- Comprehensive mobile testing and documentation

**OUT OF SCOPE (Future Tasks):**
- Native mobile app development (React Native/Flutter)
- Offline-first mobile capabilities (PWA features)
- Advanced mobile-specific features (camera integration, push notifications)
- Multi-platform mobile deployment strategies

## Output Log
*(This section will be populated as work progresses on the task)*

[2025-06-22 12:00]: Task created - Mobile-Responsive Vue 3 Patterns and Touch Interaction Implementation
[2025-06-22 12:00]: Comprehensive mobile architecture defined with Vue 3 Composition API patterns
[2025-06-22 12:00]: @vueuse/gesture integration strategy established for advanced touch interactions
[2025-06-22 12:00]: Mobile performance optimization and accessibility framework designed
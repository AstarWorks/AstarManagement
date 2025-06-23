# T03_S07_Vue_Drag_Drop_Implementation.md

## Task: Vue 3 Drag-and-Drop Implementation for Kanban Board

### Overview
Replace @dnd-kit/sortable with Vue 3 compatible drag-and-drop solution, implementing touch support, status validation, and optimizing for 60fps performance. This task focuses on providing a smooth, responsive drag-and-drop experience for matter cards across Kanban columns on both desktop and mobile devices.

### Problem Statement
The current Kanban implementation uses @dnd-kit/sortable which is React-specific. We need a Vue 3 compatible solution that:
- Supports touch gestures for mobile devices
- Maintains 60fps performance during drag operations
- Validates matter status transitions
- Provides visual feedback during drag states
- Handles scroll vs drag conflicts on mobile

### Technical Requirements

#### Core Functionality
- [ ] Replace @dnd-kit/sortable with Vue 3 compatible drag-and-drop library
- [ ] Implement matter card dragging between Kanban columns
- [ ] Support both mouse and touch interactions
- [ ] Validate status transitions before allowing drops
- [ ] Maintain matter card visual state during drag operations
- [ ] Handle drag cancellation and error states

#### Performance Requirements
- [ ] Achieve 60fps during drag operations
- [ ] Minimize layout thrashing during drag
- [ ] Use CSS transforms for smooth animations
- [ ] Implement proper event handling to prevent scroll interference
- [ ] Optimize for low-end mobile devices

#### Mobile Touch Support
- [ ] Implement touch gesture recognition
- [ ] Handle scroll vs drag conflicts
- [ ] Add touch-specific visual feedback
- [ ] Support long-press to initiate drag
- [ ] Implement drag delay for better UX

### Recommended Libraries Analysis

#### 1. Vue Draggable Next (Primary Recommendation)
**Library**: `vuedraggable@next`
**Based on**: Sortable.js

**Pros**:
- Official Vue 3 port of the popular Vue Draggable
- Excellent touch support via Sortable.js
- High performance with minimal overhead
- Extensive documentation and community support
- Built-in animations and transitions
- Supports all Sortable.js options

**Cons**:
- Larger bundle size due to Sortable.js dependency
- Some advanced customization requires Sortable.js knowledge

**Installation**:
```bash
bun add vuedraggable@next
```

**Basic Usage**:
```vue
<template>
  <draggable
    v-model="matterCards"
    group="kanban"
    @start="onDragStart"
    @end="onDragEnd"
    :animation="200"
    :touch-start-threshold="10"
    :delay="isMobile ? 200 : 0"
    class="kanban-column"
  >
    <template #item="{ element }">
      <MatterCard :matter="element" />
    </template>
  </draggable>
</template>
```

#### 2. Vue Draggable Plus (Alternative)
**Library**: `vue-draggable-plus`

**Pros**:
- Built specifically for Vue 3
- Multiple usage patterns (component, composable, directive)
- Better Vue 3 integration
- Supports element selectors for complex layouts

**Cons**:
- Newer library with smaller community
- Less documentation available

### Implementation Strategy

#### Phase 1: Core Drag-and-Drop Setup
```typescript
// composables/useKanbanDragDrop.ts
import { ref, computed } from 'vue'
import type { Matter, MatterStatus } from '~/types/matter'

export function useKanbanDragDrop() {
  const draggedMatter = ref<Matter | null>(null)
  const dragOverColumn = ref<string | null>(null)
  
  const statusTransitions = computed(() => ({
    'new': ['in-progress', 'cancelled'],
    'in-progress': ['completed', 'on-hold', 'cancelled'],
    'on-hold': ['in-progress', 'cancelled'],
    'completed': [],
    'cancelled': ['new']
  }))
  
  const canDropInColumn = (matter: Matter, targetStatus: MatterStatus): boolean => {
    return statusTransitions.value[matter.status]?.includes(targetStatus) ?? false
  }
  
  const onDragStart = (event: any) => {
    draggedMatter.value = event.item._underlying_vm_
    // Add drag start visual feedback
    document.body.classList.add('dragging')
  }
  
  const onDragEnd = async (event: any) => {
    draggedMatter.value = null
    dragOverColumn.value = null
    document.body.classList.remove('dragging')
    
    // Handle status update
    const newStatus = event.to.dataset.status as MatterStatus
    const matter = event.item._underlying_vm_
    
    if (matter.status !== newStatus) {
      await updateMatterStatus(matter.id, newStatus)
    }
  }
  
  return {
    draggedMatter: readonly(draggedMatter),
    dragOverColumn: readonly(dragOverColumn),
    canDropInColumn,
    onDragStart,
    onDragEnd
  }
}
```

#### Phase 2: Touch Gesture Optimization
```typescript
// composables/useTouchGestures.ts
import { ref, onMounted, onUnmounted } from 'vue'

export function useTouchGestures() {
  const isMobile = ref(false)
  const touchStartTime = ref(0)
  const dragDelay = ref(0)
  
  const detectMobile = () => {
    isMobile.value = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    dragDelay.value = isMobile.value ? 200 : 0
  }
  
  onMounted(() => {
    detectMobile()
    window.addEventListener('resize', detectMobile)
  })
  
  onUnmounted(() => {
    window.removeEventListener('resize', detectMobile)
  })
  
  return {
    isMobile: readonly(isMobile),
    dragDelay: readonly(dragDelay)
  }
}
```

#### Phase 3: Performance Optimization
```vue
<!-- KanbanColumn.vue -->
<template>
  <div
    class="kanban-column"
    :data-status="status"
    :class="{ 'drag-over': isDragOver }"
  >
    <header class="column-header">
      <h3>{{ title }}</h3>
      <Badge :variant="status">{{ matters.length }}</Badge>
    </header>
    
    <draggable
      v-model="matters"
      :group="{ name: 'kanban', pull: true, put: canAcceptDrop }"
      :animation="150"
      :delay="dragDelay"
      :touch-start-threshold="10"
      :force-fallback="true"
      :fallback-class="'drag-fallback'"
      ghost-class="drag-ghost"
      chosen-class="drag-chosen"
      drag-class="drag-active"
      @start="onDragStart"
      @end="onDragEnd"
      @change="onDragChange"
      class="matters-container"
    >
      <template #item="{ element }">
        <MatterCard
          :matter="element"
          :class="{ 'dragging': isDragging(element) }"
        />
      </template>
    </draggable>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import draggable from 'vuedraggable'
import type { Matter, MatterStatus } from '~/types/matter'

interface Props {
  status: MatterStatus
  title: string
  matters: Matter[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:matters': [matters: Matter[]]
  'matter-moved': [matter: Matter, fromStatus: MatterStatus, toStatus: MatterStatus]
}>()

const { dragDelay, isMobile } = useTouchGestures()
const { canDropInColumn, onDragStart, onDragEnd } = useKanbanDragDrop()

const matters = computed({
  get: () => props.matters,
  set: (value) => emit('update:matters', value)
})

const canAcceptDrop = (to: any, from: any, dragEl: any) => {
  const matter = dragEl._underlying_vm_ as Matter
  return canDropInColumn(matter, props.status)
}

const onDragChange = (event: any) => {
  if (event.moved) {
    // Handle reordering within same column
    const { element, newIndex, oldIndex } = event.moved
    // Emit reorder event if needed
  }
  
  if (event.added) {
    // Handle matter added to this column
    const { element } = event.added
    emit('matter-moved', element, element.status, props.status)
  }
}
</script>

<style scoped>
.kanban-column {
  --column-width: 320px;
  --column-gap: 1rem;
  --animation-duration: 150ms;
  
  width: var(--column-width);
  background: hsl(var(--card));
  border-radius: var(--radius);
  border: 1px solid hsl(var(--border));
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 200px);
}

.column-header {
  padding: 1rem;
  border-bottom: 1px solid hsl(var(--border));
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.matters-container {
  flex: 1;
  padding: 0.5rem;
  overflow-y: auto;
  min-height: 200px;
}

/* Drag-and-drop visual states */
.drag-ghost {
  opacity: 0.5;
  transform: scale(0.95);
  transition: transform var(--animation-duration) ease;
}

.drag-chosen {
  cursor: grabbing;
  z-index: 1000;
}

.drag-active {
  transform: rotate(2deg);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.drag-fallback {
  cursor: grabbing !important;
  background: hsl(var(--card));
  border: 2px dashed hsl(var(--primary));
  border-radius: var(--radius);
}

.drag-over {
  background: hsl(var(--primary) / 0.05);
  border-color: hsl(var(--primary));
}

/* Performance optimizations */
.kanban-column * {
  transform: translateZ(0); /* Enable hardware acceleration */
}

/* Mobile-specific optimizations */
@media (max-width: 768px) {
  .kanban-column {
    --column-width: 280px;
    touch-action: pan-y; /* Allow vertical scrolling */
  }
  
  .matters-container {
    -webkit-overflow-scrolling: touch;
  }
}

/* Prevent text selection during drag */
:global(.dragging) {
  user-select: none;
  -webkit-user-select: none;
}
</style>
```

### Performance Optimization Techniques

#### 1. CSS Transform Animations
```css
/* Use CSS transforms for better performance */
.drag-ghost {
  /* GPU acceleration */
  transform: translateZ(0) scale(0.95);
  will-change: transform;
}

.drag-active {
  /* Avoid layout thrashing */
  transform: translateZ(0) rotate(2deg);
  will-change: transform;
}
```

#### 2. Event Throttling
```typescript
// utils/performance.ts
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  let lastCall = 0
  return ((...args: any[]) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      return fn(...args)
    }
  }) as T
}

// Usage in drag handlers
const throttledDragOver = throttle((event: DragEvent) => {
  // Handle drag over logic
}, 16) // ~60fps
```

#### 3. Virtual Scrolling for Large Lists
```typescript
// For columns with many items, consider virtual scrolling
import { RecycleScroller } from 'vue-virtual-scroller'

// In large columns
<RecycleScroller
  class="matters-container"
  :items="matters"
  :item-size="120"
  key-field="id"
  v-slot="{ item }"
>
  <MatterCard :matter="item" />
</RecycleScroller>
```

### Mobile Touch Optimization

#### 1. Touch Event Configuration
```typescript
// Sortable.js configuration for mobile
const sortableOptions = {
  animation: 150,
  delay: isMobile.value ? 200 : 0,
  delayOnTouchStart: true,
  touchStartThreshold: 10,
  forceFallback: true,
  fallbackTolerance: 5,
  dragoverBubble: false,
  removeCloneOnHide: true,
  preventOnFilter: false
}
```

#### 2. Scroll Conflict Resolution
```typescript
// Prevent scroll during drag
const onTouchStart = (event: TouchEvent) => {
  if (isDragging.value) {
    event.preventDefault()
  }
}

// Allow scroll when not dragging
const onTouchMove = (event: TouchEvent) => {
  if (!isDragging.value) {
    // Allow normal scrolling
    return
  }
  
  // Prevent scroll during drag
  event.preventDefault()
}
```

### Status Validation Rules

#### 1. Matter Status Transition Matrix
```typescript
// types/matter.ts
export type MatterStatus = 'new' | 'in-progress' | 'on-hold' | 'completed' | 'cancelled'

export const MATTER_STATUS_TRANSITIONS: Record<MatterStatus, MatterStatus[]> = {
  'new': ['in-progress', 'cancelled'],
  'in-progress': ['completed', 'on-hold', 'cancelled'],
  'on-hold': ['in-progress', 'cancelled'],
  'completed': [], // Terminal state
  'cancelled': ['new'] // Can be reopened
}
```

#### 2. Validation Implementation
```typescript
// composables/useMatterValidation.ts
export function useMatterValidation() {
  const validateStatusTransition = (
    fromStatus: MatterStatus,
    toStatus: MatterStatus
  ): { valid: boolean; reason?: string } => {
    const allowedTransitions = MATTER_STATUS_TRANSITIONS[fromStatus]
    
    if (!allowedTransitions.includes(toStatus)) {
      return {
        valid: false,
        reason: `Cannot move matter from ${fromStatus} to ${toStatus}`
      }
    }
    
    return { valid: true }
  }
  
  const getAvailableStatuses = (currentStatus: MatterStatus): MatterStatus[] => {
    return MATTER_STATUS_TRANSITIONS[currentStatus] || []
  }
  
  return {
    validateStatusTransition,
    getAvailableStatuses
  }
}
```

### Testing Strategy

#### 1. Unit Tests
```typescript
// tests/composables/useKanbanDragDrop.test.ts
import { describe, it, expect } from 'vitest'
import { useKanbanDragDrop } from '~/composables/useKanbanDragDrop'

describe('useKanbanDragDrop', () => {
  it('should validate status transitions correctly', () => {
    const { canDropInColumn } = useKanbanDragDrop()
    
    const matter = { id: '1', status: 'new' } as Matter
    expect(canDropInColumn(matter, 'in-progress')).toBe(true)
    expect(canDropInColumn(matter, 'completed')).toBe(false)
  })
})
```

#### 2. E2E Tests
```typescript
// tests/e2e/kanban-drag-drop.spec.ts
import { test, expect } from '@playwright/test'

test('should drag matter between columns', async ({ page }) => {
  await page.goto('/matters')
  
  // Drag matter from "New" to "In Progress"
  await page.dragAndDrop(
    '[data-testid="matter-card-1"]',
    '[data-testid="column-in-progress"]'
  )
  
  // Verify matter moved
  await expect(page.locator('[data-testid="column-in-progress"] [data-testid="matter-card-1"]')).toBeVisible()
})

test('should prevent invalid status transitions', async ({ page }) => {
  await page.goto('/matters')
  
  // Try to drag completed matter to new column (should fail)
  await page.dragAndDrop(
    '[data-testid="completed-matter"]',
    '[data-testid="column-new"]'
  )
  
  // Verify matter didn't move
  await expect(page.locator('[data-testid="column-completed"] [data-testid="completed-matter"]')).toBeVisible()
})
```

### Accessibility Considerations

#### 1. Keyboard Navigation
```vue
<template>
  <div
    class="matter-card"
    :tabindex="0"
    role="button"
    :aria-label="`Matter: ${matter.title}. Status: ${matter.status}. Press space to move.`"
    @keydown="handleKeydown"
  >
    <!-- Card content -->
  </div>
</template>

<script setup lang="ts">
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === ' ' || event.key === 'Enter') {
    // Open status selection modal
    showStatusModal.value = true
  }
}
</script>
```

#### 2. Screen Reader Support
```typescript
// Announce drag operations to screen readers
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
```

### Implementation Timeline

#### Sprint 1 (Week 1-2)
- [ ] Set up Vue Draggable Next library
- [ ] Implement basic drag-and-drop between columns
- [ ] Add status validation logic
- [ ] Create basic visual feedback

#### Sprint 2 (Week 3-4)
- [ ] Implement touch gesture support
- [ ] Add mobile-specific optimizations
- [ ] Optimize performance for 60fps
- [ ] Add comprehensive error handling

#### Sprint 3 (Week 5-6)
- [ ] Implement accessibility features
- [ ] Add keyboard navigation support
- [ ] Create comprehensive test suite
- [ ] Performance profiling and optimization

### Success Criteria

#### Functional Requirements
- [ ] Drag-and-drop works smoothly on desktop and mobile
- [ ] Status transitions are properly validated
- [ ] Visual feedback is clear and intuitive
- [ ] Error states are handled gracefully

#### Performance Requirements
- [ ] Maintains 60fps during drag operations
- [ ] No layout thrashing or visual jank
- [ ] Smooth animations and transitions
- [ ] Responsive on low-end mobile devices

#### Accessibility Requirements
- [ ] Keyboard navigation support
- [ ] Screen reader compatibility
- [ ] Clear focus indicators
- [ ] Proper ARIA labels and roles

### Risk Mitigation

#### Technical Risks
- **Performance Issues**: Implement virtual scrolling for large lists
- **Mobile Conflicts**: Use touch-specific configuration and event handling
- **Browser Compatibility**: Test across major browsers and devices
- **Memory Leaks**: Proper cleanup of event listeners and references

#### User Experience Risks
- **Accidental Drags**: Implement drag delay for mobile devices
- **Invalid Moves**: Clear validation feedback and prevention
- **Accessibility**: Comprehensive keyboard and screen reader support

### Dependencies

#### Libraries
- `vuedraggable@next` - Primary drag-and-drop library
- `@vueuse/core` - Vue composition utilities
- `@vueuse/gesture` - Touch gesture utilities (if needed)

#### Internal Dependencies
- Matter store and API integration
- Notification system for feedback
- Permission system for validation
- Responsive design system

### Resources

#### Documentation
- [Vue Draggable Next Documentation](https://github.com/SortableJS/vue.draggable.next)
- [Sortable.js Options](https://github.com/SortableJS/Sortable#options)
- [Vue 3 Composition API Guide](https://vuejs.org/guide/extras/composition-api-faq.html)

#### Performance Resources
- [Web Performance Optimization](https://web.dev/optimize-cls/)
- [Touch Gesture Guidelines](https://material.io/design/interaction/gestures.html)
- [Vue 3 Performance Best Practices](https://vuejs.org/guide/best-practices/performance.html)

### Completion Checklist

- [ ] Vue Draggable Next library integrated and configured
- [ ] Drag-and-drop functionality implemented for all Kanban columns
- [ ] Touch gesture support added with proper mobile optimization
- [ ] Status validation implemented with clear user feedback
- [ ] Performance optimized to maintain 60fps during operations
- [ ] Accessibility features implemented (keyboard navigation, screen readers)
- [ ] Comprehensive test suite created (unit, integration, e2e)
- [ ] Documentation updated with usage patterns and examples
- [ ] Cross-browser and cross-device testing completed
- [ ] Performance profiling and optimization validated
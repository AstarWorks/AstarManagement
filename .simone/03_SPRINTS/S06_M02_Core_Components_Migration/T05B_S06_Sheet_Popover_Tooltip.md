---
task_id: T05B_S06
sprint_sequence_id: S06
status: open
complexity: Medium
last_updated: 2025-06-21T00:00:00Z
---

# Task: Sheet, Popover, and Tooltip Components Migration

## Description
Migrate the overlay components that provide contextual UI elements: Sheet (slide-over panels), Popover (floating content), and Tooltip (hover hints). These components require precise positioning logic, collision detection, and different trigger mechanisms while maintaining smooth animations and mobile support.

## Goal / Objectives
- Migrate Sheet component with directional sliding
- Migrate Popover with smart positioning
- Migrate Tooltip with hover delay logic
- Implement mobile gesture support
- Ensure proper z-index management

## Acceptance Criteria
- [ ] Sheet slides smoothly from all four directions
- [ ] Popover positions correctly with collision detection
- [ ] Tooltip shows on hover with appropriate delays
- [ ] Mobile gestures work for dismissing Sheet
- [ ] Components stack properly when nested
- [ ] Touch device support is implemented
- [ ] Animations are smooth and interruptible
- [ ] Keyboard navigation works correctly

## Subtasks
- [ ] Migrate Sheet component
  - [ ] Support top, right, bottom, left variants
  - [ ] Implement size variants (sm, md, lg, xl, full)
  - [ ] Add slide animations for each direction
  - [ ] Implement swipe-to-dismiss on mobile
  - [ ] Create SheetHeader, SheetContent, SheetFooter
  - [ ] Handle overlay and backdrop behavior

- [ ] Migrate Popover component
  - [ ] Integrate Radix Vue Popover primitive
  - [ ] Implement smart positioning with Floating UI
  - [ ] Support all placement options (12 positions)
  - [ ] Add arrow/caret pointing to trigger
  - [ ] Handle collision detection and flipping
  - [ ] Support both click and hover triggers

- [ ] Migrate Tooltip component
  - [ ] Implement hover delay logic (show/hide delays)
  - [ ] Support keyboard trigger (focus shows tooltip)
  - [ ] Handle long content with max-width
  - [ ] Add touch device long-press support
  - [ ] Ensure tooltips don't block interactions
  - [ ] Support disabled state explanations

- [ ] Implement positioning system
  - [ ] Set up Floating UI for Vue
  - [ ] Create positioning composables
  - [ ] Handle viewport boundaries
  - [ ] Implement auto-placement fallbacks
  - [ ] Add offset and alignment options

- [ ] Add mobile-specific features
  - [ ] Touch gesture recognition
  - [ ] Swipe direction detection
  - [ ] Momentum scrolling in Sheet
  - [ ] Long press for tooltips
  - [ ] Prevent scroll-through

- [ ] Create animation utilities
  - [ ] Direction-based slide animations
  - [ ] Scale and fade for popovers
  - [ ] Smooth position updates
  - [ ] Handle animation interruption
  - [ ] Respect prefers-reduced-motion

## Technical Notes

### Sheet Animation Pattern
```vue
<template>
  <Teleport to="body">
    <Transition
      :enter-active-class="enterActiveClass"
      :leave-active-class="leaveActiveClass"
      :enter-from-class="enterFromClass"
      :leave-to-class="leaveToClass"
    >
      <div v-if="open" class="fixed inset-0 z-50">
        <div class="absolute inset-0 bg-black/50" @click="close" />
        <div :class="sheetClasses" ref="sheetRef">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSwipe } from '@vueuse/core'

const props = defineProps<{
  open: boolean
  side: 'top' | 'right' | 'bottom' | 'left'
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}>()

const emit = defineEmits<{
  'update:open': [boolean]
}>()

const sheetRef = ref<HTMLElement>()

// Swipe to dismiss
const { direction, lengthX, lengthY } = useSwipe(sheetRef, {
  threshold: 50,
  onSwipeEnd() {
    if (shouldDismiss()) {
      emit('update:open', false)
    }
  }
})

const sheetClasses = computed(() => {
  const baseClasses = 'absolute bg-background shadow-lg'
  const sideClasses = {
    top: 'top-0 left-0 right-0',
    right: 'top-0 right-0 bottom-0',
    bottom: 'bottom-0 left-0 right-0',
    left: 'top-0 left-0 bottom-0'
  }
  const sizeClasses = {
    sm: props.side === 'left' || props.side === 'right' ? 'w-80' : 'h-80',
    md: props.side === 'left' || props.side === 'right' ? 'w-96' : 'h-96',
    // ... other sizes
  }
  
  return `${baseClasses} ${sideClasses[props.side]} ${sizeClasses[props.size || 'md']}`
})
</script>
```

### Popover with Floating UI
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useFloating, autoUpdate, offset, flip, shift } from '@floating-ui/vue'

const referenceRef = ref()
const floatingRef = ref()

const { x, y, strategy, placement } = useFloating(referenceRef, floatingRef, {
  placement: props.placement || 'bottom',
  middleware: [
    offset(8),
    flip(),
    shift({ padding: 8 })
  ],
  whileElementsMounted: autoUpdate
})
</script>
```

### Dependencies
- Requires T05A_S06 to establish modal patterns
- Uses Radix Vue for Popover and Tooltip
- Integrates with Floating UI for positioning

## Output Log
*(This section is populated as work progresses on the task)*

[2025-06-21 00:00:00] Task created by splitting T05_S06
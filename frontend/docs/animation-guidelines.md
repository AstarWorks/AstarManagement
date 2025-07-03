# Animation Guidelines for Aster Management

## Overview
This document outlines the animation principles, patterns, and implementation guidelines for the Aster Management application. All animations should enhance user experience while maintaining performance and accessibility.

## Core Principles

### 1. Material Design Motion
We follow Material Design motion principles:
- **Informative**: Motion should help users understand changes
- **Focused**: Direct attention to what's important
- **Expressive**: Add character while being subtle

### 2. Performance First
- All animations must maintain 60fps (16ms frame budget)
- Use GPU-accelerated properties: `transform`, `opacity`
- Avoid animating `width`, `height`, `top`, `left`
- Leverage `will-change` for complex animations

### 3. Accessibility
- Respect `prefers-reduced-motion` system preference
- Provide animation toggle in user settings
- Ensure animations don't interfere with screen readers
- Maintain keyboard navigation during animations

## Animation System Architecture

### Constants (`constants/animations.ts`)
```typescript
import { ANIMATION_DURATION, ANIMATION_EASING } from '~/constants/animations'

// Use predefined durations
const duration = ANIMATION_DURATION.normal // 200ms
const easing = ANIMATION_EASING.standard // cubic-bezier(0.4, 0.0, 0.2, 1)
```

### Composables (`composables/useAnimations.ts`)
```typescript
const { animationsEnabled, getAnimationDuration } = useAnimations()

// Automatically handles reduced motion preferences
const duration = getAnimationDuration(ANIMATION_DURATION.normal)
```

### CSS Classes (`assets/css/animations.css`)
```css
/* Pre-built animation classes */
.animate-fade-in
.animate-slide-in-up
.animate-scale-in
.card-hover
```

## Common Animation Patterns

### 1. Card Hover States
```vue
<template>
  <div class="card card-hover animate-gpu">
    <!-- Content -->
  </div>
</template>

<style scoped>
.card-hover {
  transition: all var(--animation-duration-fast) var(--animation-easing-standard);
}

.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
```

### 2. Drag and Drop
```typescript
// Use enhanced drag composable
const { startDrag, endDrag, isDragging } = useDragAnimation(elementRef)

// Animations handled automatically
onDragStart: startDrag
onDragEnd: endDrag
```

### 3. State Transitions
```vue
<template>
  <Transition name="fade" mode="out-in">
    <component :is="currentView" :key="viewKey" />
  </Transition>
</template>
```

### 4. List Animations (FLIP)
```typescript
const { flip } = useFLIPAnimation()

// Animate layout changes smoothly
await flip(elements, async () => {
  // Make DOM changes
  reorderItems()
})
```

### 5. Loading States
```vue
<template>
  <MatterCardSkeleton v-if="loading" :count="3" />
  <TransitionGroup v-else name="list" tag="div">
    <MatterCard v-for="matter in matters" :key="matter.id" />
  </TransitionGroup>
</template>
```

## Implementation Examples

### Quick Edit Mode
```vue
<script setup>
const isEditMode = ref(false)

const enterEditMode = () => {
  isEditMode.value = true
  // Smooth transition handled by CSS
}
</script>

<template>
  <Transition name="edit-mode" mode="out-in">
    <div v-if="isEditMode" key="edit">
      <!-- Edit UI -->
    </div>
    <div v-else key="view">
      <!-- View UI -->
    </div>
  </Transition>
</template>
```

### Micro-interactions
```vue
<template>
  <!-- Success feedback -->
  <button @click="save" :class="{ 'animate-success': saved }">
    Save
  </button>
  
  <!-- Error feedback -->
  <div :class="{ 'animate-error': hasError }">
    <!-- Content -->
  </div>
</template>
```

### Performance Monitoring
```vue
<template>
  <AnimationPerformanceMonitor 
    v-if="isDevelopment" 
    :show="showPerfMonitor"
    position="bottom-right"
  />
</template>
```

## Animation Timings

| Use Case | Duration | Easing |
|----------|----------|--------|
| Micro-interactions | 150ms | Sharp |
| State changes | 200ms | Standard |
| Complex transitions | 300ms | Decelerate |
| Page transitions | 400ms | Standard |
| Drag animations | 150-200ms | Sharp |

## Performance Guidelines

### Do's ✅
- Use `transform` and `opacity` for animations
- Batch DOM updates within animation frames
- Use CSS animations when possible
- Enable GPU acceleration with `will-change`
- Test on low-end devices

### Don'ts ❌
- Animate `width`, `height`, or layout properties
- Use complex `box-shadow` animations
- Animate more than 5 elements simultaneously
- Use JavaScript for simple transitions
- Forget to remove `will-change` after animation

## Accessibility Checklist

- [ ] Test with `prefers-reduced-motion: reduce`
- [ ] Ensure animations can be paused/disabled
- [ ] Verify keyboard navigation works during animations
- [ ] Check screen reader announcements aren't interrupted
- [ ] Provide alternative feedback for critical animations
- [ ] Test with browser zoom at 200%

## Testing Animations

### Visual Testing
```typescript
// Storybook story for animation testing
export const AnimationShowcase: Story = {
  render: () => ({
    template: `
      <div class="animation-grid">
        <div v-for="animation in animations" 
             :key="animation" 
             :class="animation"
        >
          {{ animation }}
        </div>
      </div>
    `
  })
}
```

### Performance Testing
```typescript
// Use performance monitoring composable
const { fps, jankFrames, isPerformant } = useAnimationPerformance()

// Assert performance in tests
expect(fps.value).toBeGreaterThan(55)
expect(jankFrames.value).toBeLessThan(5)
```

## Browser Support

All animations gracefully degrade in older browsers:
- Modern browsers: Full animation support
- Older browsers: Instant transitions (no animation)
- Reduced motion: Minimal or no animation

## Resources

- [Material Design Motion](https://material.io/design/motion)
- [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)
- [FLIP Technique](https://aerotwist.com/blog/flip-your-animations/)
- [GPU Acceleration](https://web.dev/animations-guide/)
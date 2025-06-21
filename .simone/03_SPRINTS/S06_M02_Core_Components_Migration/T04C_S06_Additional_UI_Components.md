---
task_id: T04C_S06
sprint_sequence_id: S06
status: open
complexity: Low
last_updated: 2025-06-21T00:00:00Z
---

# Task: Additional UI Components Migration

## Description
Migrate the remaining UI components from React/shadcn-ui to Vue/shadcn-vue, including Avatar, Skeleton, Separator, ScrollArea, and the Form component family. These components complete the core UI library and enable full feature parity with the React implementation.

## Goal / Objectives
- Migrate auxiliary UI components that enhance user experience
- Implement Form component family for structured form layouts
- Ensure all components maintain design consistency
- Complete the core component library migration

## Acceptance Criteria
- [ ] Avatar component supports image loading with fallback
- [ ] Skeleton component provides smooth loading states
- [ ] Separator works in both horizontal and vertical orientations
- [ ] ScrollArea implements custom scrollbar styling
- [ ] Form components provide consistent form structure
- [ ] All components support theming and dark mode
- [ ] Components are fully documented with examples

## Subtasks
- [ ] Migrate Avatar component
  - [ ] Implement image loading with fallback text
  - [ ] Add loading and error states
  - [ ] Support different sizes
  - [ ] Create AvatarGroup pattern

- [ ] Migrate Skeleton component
  - [ ] Create base skeleton with animation
  - [ ] Add shape variants (text, circular, rectangular)
  - [ ] Implement skeleton patterns for common layouts
  - [ ] Ensure smooth pulse animation

- [ ] Migrate Separator component
  - [ ] Support horizontal and vertical orientations
  - [ ] Add decorative vs semantic variants
  - [ ] Implement proper ARIA attributes
  - [ ] Support custom styling

- [ ] Migrate ScrollArea component
  - [ ] Integrate with Radix Vue ScrollArea
  - [ ] Implement custom scrollbar styling
  - [ ] Support both vertical and horizontal scrolling
  - [ ] Add auto-hide scrollbar option

- [ ] Migrate Form components
  - [ ] Create FormField wrapper component
  - [ ] Implement FormItem, FormLabel, FormControl
  - [ ] Add FormDescription and FormMessage
  - [ ] Ensure integration with form validation

- [ ] Create component documentation
  - [ ] Write API documentation
  - [ ] Add usage examples
  - [ ] Document accessibility features
  - [ ] Create Storybook stories

## Technical Notes

### Avatar Component Pattern
```vue
<template>
  <AvatarRoot :class="avatarClasses">
    <AvatarImage
      v-if="src"
      :src="src"
      :alt="alt"
      @loadingStatusChange="handleStatusChange"
    />
    <AvatarFallback v-if="showFallback">
      {{ fallbackText }}
    </AvatarFallback>
  </AvatarRoot>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { AvatarRoot, AvatarImage, AvatarFallback } from 'radix-vue'

const props = defineProps<{
  src?: string
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg'
}>()

const isLoading = ref(true)
const hasError = ref(false)

const showFallback = computed(() => !props.src || hasError.value)
const fallbackText = computed(() => props.fallback || props.alt?.charAt(0) || '?')
</script>
```

### Dependencies
- Requires T04A_S06 and T04B_S06 to be completed
- Uses utilities and patterns established in earlier tasks

## Output Log
*(This section is populated as work progresses on the task)*

[2025-06-21 00:00:00] Task created by splitting T04_S06
---
task_id: T04A_S06
sprint_sequence_id: S06
status: open
complexity: Medium
last_updated: 2025-06-21T00:00:00Z
---

# Task: Basic UI Components Migration (Button, Badge, Card)

## Description
Migrate the foundational UI components from React/shadcn-ui to Vue/shadcn-vue, focusing on the most essential components: Button, Badge, and Card. These components are the most frequently used building blocks and need to be migrated first to unblock other development work.

## Goal / Objectives
- Migrate Button component with all variants and states
- Migrate Badge component with proper styling
- Migrate Card component family (Card, CardHeader, CardTitle, etc.)
- Ensure dark mode support for all components
- Maintain full TypeScript support and accessibility

## Acceptance Criteria
- [ ] Button component supports all variants (default, destructive, outline, secondary, ghost, link)
- [ ] Button supports all sizes (default, sm, lg, icon) and states (loading, disabled)
- [ ] Badge component supports all variants with proper text truncation
- [ ] Card components support proper composition and nesting
- [ ] All components work correctly in dark mode
- [ ] TypeScript props are fully typed with IntelliSense
- [ ] Components pass accessibility tests
- [ ] Visual appearance matches React versions exactly

## Subtasks
- [ ] Migrate Button component
  - [ ] Create Button.vue with all variants using CVA
  - [ ] Implement loading state with spinner
  - [ ] Support asChild pattern for polymorphic components
  - [ ] Add comprehensive TypeScript types
  - [ ] Write unit tests for all variants

- [ ] Migrate Badge component
  - [ ] Create Badge.vue with all variants
  - [ ] Implement proper text truncation
  - [ ] Add icon support within badges
  - [ ] Ensure proper color contrast in all themes
  - [ ] Write visual regression tests

- [ ] Migrate Card components
  - [ ] Create Card.vue as container component
  - [ ] Implement CardHeader, CardTitle, CardDescription
  - [ ] Create CardContent and CardFooter
  - [ ] Test component composition patterns
  - [ ] Add hover and focus states

- [ ] Create shared utilities
  - [ ] Port cn() utility function
  - [ ] Set up CVA (class-variance-authority)
  - [ ] Create shared TypeScript types
  - [ ] Configure component auto-imports

- [ ] Write comprehensive tests
  - [ ] Unit tests for each component
  - [ ] Visual regression tests
  - [ ] Accessibility tests with axe-core
  - [ ] Dark mode toggle tests

## Technical Notes

### Button Component Example
```vue
<template>
  <component
    :is="asChild ? 'slot' : 'button'"
    :class="cn(buttonVariants({ variant, size }), $attrs.class)"
    :disabled="disabled || loading"
    v-bind="asChild ? {} : $attrs"
  >
    <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
    <slot />
  </component>
</template>

<script setup lang="ts">
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 ...",
  {
    variants: {
      variant: { ... },
      size: { ... }
    }
  }
)
</script>
```

### Dependencies
- Requires T03_S06 (Shadcn-vue Setup) to be completed
- These components will be used by all other UI component tasks

## Output Log
*(This section is populated as work progresses on the task)*

[2025-06-21 00:00:00] Task created by splitting T04_S06
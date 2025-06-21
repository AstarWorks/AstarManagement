---
task_id: T05A_S06
sprint_sequence_id: S06
status: open
complexity: Medium
last_updated: 2025-06-21T00:00:00Z
---

# Task: Dialog and AlertDialog Components Migration

## Description
Migrate the core Dialog and AlertDialog components from React/shadcn-ui to Vue/shadcn-vue. These components are essential for user confirmations, forms in modals, and general overlay interactions. Focus on establishing the foundational modal patterns with proper focus management and accessibility.

## Goal / Objectives
- Migrate Dialog component with all sub-components
- Migrate AlertDialog for confirmation patterns
- Implement proper focus trapping and keyboard navigation
- Establish Vue Teleport patterns for portal behavior
- Ensure accessibility compliance (ARIA, focus management)

## Acceptance Criteria
- [ ] Dialog component supports controlled and uncontrolled modes
- [ ] AlertDialog provides proper confirmation flow with callbacks
- [ ] Focus is trapped within modal when open
- [ ] Escape key and backdrop click close modals correctly
- [ ] Scroll is locked when modals are open
- [ ] Components meet WCAG 2.1 AA standards
- [ ] Smooth enter/exit animations work correctly
- [ ] StatusConfirmationDialog is migrated and functional

## Subtasks
- [ ] Set up modal infrastructure
  - [ ] Configure Vue Teleport for body portal
  - [ ] Implement scroll lock composable
  - [ ] Create focus trap composable
  - [ ] Set up backdrop/overlay component

- [ ] Migrate Dialog component
  - [ ] Create Dialog, DialogTrigger, DialogContent
  - [ ] Implement DialogHeader, DialogTitle, DialogDescription
  - [ ] Add DialogFooter for action buttons
  - [ ] Support v-model:open for controlled state
  - [ ] Add close on escape and outside click

- [ ] Migrate AlertDialog component
  - [ ] Port all AlertDialog sub-components
  - [ ] Implement action and cancel callbacks
  - [ ] Add async action support with loading states
  - [ ] Ensure destructive action safety
  - [ ] Create common confirmation patterns

- [ ] Migrate StatusConfirmationDialog
  - [ ] Port business logic from React version
  - [ ] Implement status validation rules
  - [ ] Add note field with optional validation
  - [ ] Show appropriate warnings
  - [ ] Handle loading and error states

- [ ] Implement focus management
  - [ ] Use @vueuse/integrations/useFocusTrap
  - [ ] Store and restore previous focus
  - [ ] Handle tab cycling within modal
  - [ ] Support initial focus element
  - [ ] Test with screen readers

- [ ] Add animations and transitions
  - [ ] Use Vue's Transition component
  - [ ] Port animation classes from React
  - [ ] Handle interrupted animations
  - [ ] Add reduced motion support

## Technical Notes

### Dialog Implementation Pattern
```vue
<template>
  <DialogRoot v-model:open="isOpen">
    <DialogTrigger as-child>
      <slot name="trigger" />
    </DialogTrigger>
    <Teleport to="body">
      <Transition name="dialog">
        <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center">
          <DialogOverlay class="fixed inset-0 bg-black/50" />
          <DialogContent
            ref="contentRef"
            class="relative bg-background rounded-lg shadow-lg"
          >
            <slot />
          </DialogContent>
        </div>
      </Transition>
    </Teleport>
  </DialogRoot>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useScrollLock, useFocusTrap } from '@vueuse/core'

const props = defineProps<{
  modelValue?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [boolean]
}>()

const isOpen = ref(props.modelValue ?? false)
const contentRef = ref<HTMLElement>()

// Scroll lock
const isLocked = useScrollLock(document.body)
watch(isOpen, (value) => {
  isLocked.value = value
})

// Focus trap
const { activate, deactivate } = useFocusTrap(contentRef)
watch(isOpen, (value) => {
  if (value) {
    nextTick(() => activate())
  } else {
    deactivate()
  }
})
</script>
```

### Dependencies
- Requires T03_S06 (Shadcn-vue Setup) to be completed
- Uses Radix Vue Dialog primitives
- Integrates with @vueuse/core for utilities

## Output Log
*(This section is populated as work progresses on the task)*

[2025-06-21 00:00:00] Task created by splitting T05_S06
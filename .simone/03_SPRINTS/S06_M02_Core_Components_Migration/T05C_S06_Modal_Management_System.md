---
task_id: T05C_S06
sprint_sequence_id: S06
status: open
complexity: Low
last_updated: 2025-06-21T00:00:00Z
---

# Task: Modal Management System

## Description
Create a comprehensive modal management system for handling multiple modals, z-index stacking, global modal state, and route-based modal closing. This task focuses on the infrastructure and utilities needed to manage complex modal interactions across the application.

## Goal / Objectives
- Create modal management store with Pinia
- Implement z-index stacking for nested modals
- Handle route changes and modal cleanup
- Create reusable modal composables
- Establish modal queue for sequential displays

## Acceptance Criteria
- [ ] Modal store tracks all open modals
- [ ] Z-index automatically calculated for stacked modals
- [ ] Modals close appropriately on route changes
- [ ] Modal queue handles sequential modal display
- [ ] Composables provide easy modal management
- [ ] Global modal state is accessible throughout app
- [ ] Memory leaks are prevented with proper cleanup

## Subtasks
- [ ] Create modal management store
  - [ ] Implement Pinia store for modal state
  - [ ] Track modal stack with IDs
  - [ ] Calculate z-index dynamically
  - [ ] Handle modal registration/cleanup
  - [ ] Support modal metadata storage

- [ ] Implement modal composables
  - [ ] Create useModal() composable
  - [ ] Add useModalStack() for nested modals
  - [ ] Implement useModalQueue() for sequences
  - [ ] Create useConfirmDialog() helper
  - [ ] Add useModalRouter() for route integration

- [ ] Handle route-based behavior
  - [ ] Close modals on route change
  - [ ] Support persistent modals option
  - [ ] Implement back button handling
  - [ ] Add route-based modal opening
  - [ ] Handle browser history correctly

- [ ] Create modal utilities
  - [ ] Modal ID generator
  - [ ] Focus management utilities
  - [ ] Scroll position restoration
  - [ ] Animation coordination
  - [ ] Event bus for modal communication

- [ ] Add testing utilities
  - [ ] Modal testing helpers
  - [ ] Mock modal store
  - [ ] Assertion utilities
  - [ ] Integration test patterns

- [ ] Write comprehensive documentation
  - [ ] Modal patterns guide
  - [ ] Best practices document
  - [ ] Migration guide from React
  - [ ] API reference

## Technical Notes

### Modal Store Implementation
```typescript
// stores/modal.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface ModalEntry {
  id: string
  component?: Component
  props?: Record<string, any>
  options?: ModalOptions
  zIndex?: number
}

interface ModalOptions {
  persistent?: boolean
  closeOnRouteChange?: boolean
  closeOnEscape?: boolean
  closeOnBackdrop?: boolean
}

export const useModalStore = defineStore('modal', () => {
  const modals = ref<ModalEntry[]>([])
  const baseZIndex = 1000
  
  const activeModal = computed(() => 
    modals.value[modals.value.length - 1]
  )
  
  const registerModal = (modal: ModalEntry) => {
    const zIndex = baseZIndex + (modals.value.length * 10)
    modals.value.push({ ...modal, zIndex })
    return zIndex
  }
  
  const unregisterModal = (id: string) => {
    const index = modals.value.findIndex(m => m.id === id)
    if (index > -1) {
      modals.value.splice(index, 1)
    }
  }
  
  const closeAll = (options?: { force?: boolean }) => {
    if (options?.force) {
      modals.value = []
    } else {
      modals.value = modals.value.filter(m => m.options?.persistent)
    }
  }
  
  return {
    modals: readonly(modals),
    activeModal: readonly(activeModal),
    registerModal,
    unregisterModal,
    closeAll
  }
})
```

### Modal Composable
```typescript
// composables/useModal.ts
import { ref, onUnmounted } from 'vue'
import { useModalStore } from '@/stores/modal'
import { nanoid } from 'nanoid'

export function useModal(options?: ModalOptions) {
  const modalStore = useModalStore()
  const modalId = ref(nanoid())
  const isOpen = ref(false)
  const zIndex = ref(1000)
  
  const open = (props?: Record<string, any>) => {
    if (!isOpen.value) {
      zIndex.value = modalStore.registerModal({
        id: modalId.value,
        props,
        options
      })
      isOpen.value = true
    }
  }
  
  const close = () => {
    if (isOpen.value) {
      modalStore.unregisterModal(modalId.value)
      isOpen.value = false
    }
  }
  
  onUnmounted(() => {
    close()
  })
  
  return {
    modalId: readonly(modalId),
    isOpen: readonly(isOpen),
    zIndex: readonly(zIndex),
    open,
    close
  }
}
```

### Route Integration
```typescript
// plugins/modal-router.ts
export default defineNuxtPlugin((nuxtApp) => {
  const modalStore = useModalStore()
  const router = useRouter()
  
  router.beforeEach((to, from) => {
    // Close non-persistent modals on route change
    modalStore.closeAll({ force: false })
  })
  
  // Handle browser back button
  window.addEventListener('popstate', () => {
    const activeModal = modalStore.activeModal
    if (activeModal && !activeModal.options?.persistent) {
      modalStore.unregisterModal(activeModal.id)
    }
  })
})
```

### Dependencies
- Requires T05A_S06 and T05B_S06 for modal components
- Uses Pinia for state management
- Integrates with Vue Router

## Output Log
*(This section is populated as work progresses on the task)*

[2025-06-21 00:00:00] Task created by splitting T05_S06
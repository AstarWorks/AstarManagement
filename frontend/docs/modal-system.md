# Modal Management System Documentation

## Overview

The Modal Management System provides a comprehensive solution for handling modals, dialogs, and overlay components across the Vue.js application. It includes centralized state management, automatic z-index stacking, route integration, and accessibility features.

## Architecture

### Core Components

1. **Modal Store (`stores/modal.ts`)** - Pinia store for centralized modal state
2. **Modal Composables (`composables/useModal.ts`)** - Vue composables for modal management
3. **Router Integration (`plugins/modal-router.client.ts`)** - Route-based modal behavior
4. **Utilities (`utils/modal.ts`)** - Focus, scroll, animation utilities
5. **Testing Utilities (`utils/modal-testing.ts`)** - Comprehensive testing support

### Key Features

- **Centralized State Management**: All modal state managed through Pinia store
- **Z-Index Stacking**: Automatic z-index calculation for nested modals
- **Route Integration**: Close modals on navigation with persistence options
- **Accessibility**: Focus management, keyboard navigation, ARIA support
- **Mobile Support**: Touch gestures, scroll prevention, responsive behavior
- **Animation Coordination**: Smooth transitions with reduced motion support
- **Queue Management**: Sequential modal display with priority support
- **Memory Leak Prevention**: Automatic cleanup and lifecycle management

## Basic Usage

### Opening a Simple Modal

```vue
<template>
  <div>
    <button @click="openModal">Open Modal</button>
    
    <Dialog v-model:open="isOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ props.title }}</DialogTitle>
        </DialogHeader>
        <p>{{ props.message }}</p>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { useModal } from '~/composables/useModal'

const { isOpen, open, close, props } = useModal({
  closeOnEscape: true,
  closeOnBackdrop: true
})

const openModal = () => {
  open({
    title: 'Welcome',
    message: 'This is a simple modal example.'
  })
}
</script>
```

### Using the Modal Store Directly

```typescript
import { useModalStore } from '~/stores/modal'

const modalStore = useModalStore()

// Register a modal
const zIndex = modalStore.registerModal({
  id: 'my-modal',
  props: { title: 'Hello World' },
  options: {
    persistent: false,
    closeOnEscape: true
  }
})

// Close the modal
modalStore.unregisterModal('my-modal')

// Close all modals
modalStore.closeAll()
```

## Advanced Usage

### Modal Stacking

```typescript
import { useModalStack } from '~/composables/useModal'

const { pushModal, popModal, stack, topModal } = useModalStack()

// Open nested modals
pushModal({ id: 'modal-1', props: { title: 'First Modal' } })
pushModal({ id: 'modal-2', props: { title: 'Second Modal' } })

// Close top modal
popModal()

// Current stack height
console.log(stack.value.length) // 1
```

### Modal Queue

```typescript
import { useModalQueue } from '~/composables/useModal'

const { enqueue, processNext, queue } = useModalQueue()

// Queue modals for sequential display
enqueue({ props: { title: 'First in Queue' } }, 'normal')
enqueue({ props: { title: 'High Priority' } }, 'high')
enqueue({ props: { title: 'Low Priority' } }, 'low')

// Process next modal (high priority will go first)
processNext()
```

### Confirmation Dialogs

```typescript
import { useConfirmDialog } from '~/composables/useModal'

const { confirm, alert } = useConfirmDialog()

// Show confirmation
const confirmed = await confirm({
  title: 'Delete Item',
  message: 'Are you sure you want to delete this item?',
  confirmText: 'Delete',
  cancelText: 'Cancel',
  variant: 'destructive'
})

if (confirmed) {
  // User confirmed
  console.log('Item deleted')
}

// Show alert
await alert('Operation completed successfully!')
```

### Route Integration

```typescript
import { useModalRouter } from '~/composables/useModal'

const { openModalWithRoute, closeModalWithRoute } = useModalRouter()

// Open modal and update route
await openModalWithRoute(
  { id: 'settings-modal', props: { title: 'Settings' } },
  { query: { modal: 'settings' } }
)

// Close modal and navigate
await closeModalWithRoute('settings-modal', { query: {} })
```

## Configuration Options

### Modal Options

```typescript
interface ModalOptions {
  persistent?: boolean           // Persist through route changes
  closeOnRouteChange?: boolean  // Close on navigation (default: true)
  closeOnEscape?: boolean       // Close on Escape key (default: true)
  closeOnBackdrop?: boolean     // Close on backdrop click (default: true)
  zIndexOffset?: number         // Custom z-index offset
  priority?: 'low' | 'normal' | 'high' // Queue priority
  onClose?: () => void          // Callback when modal closes
}
```

### Store Configuration

```typescript
// Default configuration in modal store
const baseZIndex = 1000        // Starting z-index
const zIndexIncrement = 10     // Increment per modal
```

## Accessibility Features

### Focus Management

The system automatically:
- Stores focus before opening modal
- Focuses first focusable element in modal
- Traps focus within modal boundaries
- Restores focus when modal closes

### Keyboard Navigation

- **Escape**: Close modal (if `closeOnEscape: true`)
- **Tab/Shift+Tab**: Navigate within modal with focus trapping
- **Enter**: Activate focused element

### Screen Reader Support

```vue
<template>
  <Dialog
    v-model:open="isOpen"
    role="dialog"
    aria-labelledby="modal-title"
    aria-describedby="modal-description"
  >
    <DialogContent>
      <DialogTitle id="modal-title">Modal Title</DialogTitle>
      <p id="modal-description">Modal description for screen readers</p>
    </DialogContent>
  </Dialog>
</template>
```

## Mobile Considerations

### Touch Gestures

```vue
<template>
  <Sheet v-model:open="isOpen" side="bottom">
    <SheetContent>
      <!-- Swipe down to dismiss on mobile -->
      <p>Swipe down to close</p>
    </SheetContent>
  </Sheet>
</template>
```

### Scroll Prevention

```typescript
import { scrollManager } from '~/utils/modal'

// Prevent body scroll when modal opens
scrollManager.preventBodyScroll()

// Restore scroll when modal closes
scrollManager.restoreBodyScroll()
```

## Animation Support

### CSS Transitions

```css
.modal-enter {
  opacity: 0;
  transform: scale(0.95);
  transition: all 0.2s ease-out;
}

.modal-enter-active {
  opacity: 1;
  transform: scale(1);
}

.modal-exit {
  opacity: 1;
  transform: scale(1);
  transition: all 0.2s ease-in;
}

.modal-exit-active {
  opacity: 0;
  transform: scale(0.95);
}
```

### Animation Utilities

```typescript
import { animationManager } from '~/utils/modal'

// Wait for animation to complete
await animationManager.waitForAnimation(element)

// Check for reduced motion preference
if (animationManager.prefersReducedMotion()) {
  // Skip animations
}

// Get appropriate duration
const duration = animationManager.getAnimationDuration(300)
```

## Testing

### Unit Testing

```typescript
import { createMockModalStore, ModalTestingHelpers, modalAssertions } from '~/utils/modal-testing'

describe('Modal System', () => {
  let store: ReturnType<typeof createMockModalStore>
  let helpers: ModalTestingHelpers

  beforeEach(() => {
    store = createMockModalStore()
    helpers = new ModalTestingHelpers(store)
  })

  it('should open and close modals', async () => {
    const modalId = 'test-modal'
    
    // Open modal
    store.registerModal({ id: modalId, props: { title: 'Test' } })
    modalAssertions.assertModalOpen(store, modalId)
    
    // Close modal
    store.unregisterModal(modalId)
    modalAssertions.assertModalClosed(store, modalId)
  })

  it('should handle modal stacking', async () => {
    await modalTestPatterns.testModalStacking(helpers)
  })
})
```

### Integration Testing

```typescript
import { mount } from '@vue/test-utils'
import { ModalTestingHelpers } from '~/utils/modal-testing'

describe('Modal Component Integration', () => {
  it('should open modal on button click', async () => {
    const helpers = new ModalTestingHelpers()
    const wrapper = mount(MyModalComponent)
    
    // Click open button
    await wrapper.find('[data-testid="open-modal"]').trigger('click')
    
    // Wait for modal to appear
    const opened = await helpers.waitForModal('my-modal', 1000)
    expect(opened).toBe(true)
  })
})
```

## Best Practices

### 1. Modal Hierarchy

- Use a maximum of 3 stacked modals
- Prefer sheets/popovers for secondary actions
- Consider modal queues for sequential flows

### 2. Performance

```typescript
// Lazy load modal content
const LazyModalContent = defineAsyncComponent(() => import('./HeavyModalContent.vue'))

// Use modal queues for heavy operations
const { enqueue } = useModalQueue()
enqueue({ component: LazyModalContent }, 'low')
```

### 3. Error Handling

```typescript
const { confirm } = useConfirmDialog()

try {
  const confirmed = await confirm({
    title: 'Dangerous Action',
    message: 'This cannot be undone.'
  })
  
  if (confirmed) {
    await performDangerousAction()
  }
} catch (error) {
  await alert('An error occurred: ' + error.message)
}
```

### 4. Memory Management

```typescript
// Always clean up in onUnmounted
onUnmounted(() => {
  modalStore.unregisterModal(modalId)
})

// Use the useModal composable for automatic cleanup
const modal = useModal() // Automatically cleans up on unmount
```

## Migration from React

### Modal State Management

```typescript
// React (before)
const [isOpen, setIsOpen] = useState(false)

// Vue (after)
const { isOpen, open, close } = useModal()
```

### Programmatic Modal Control

```typescript
// React (before)
import { useModal } from '@/hooks/useModal'
const modal = useModal()
modal.open({ title: 'Hello' })

// Vue (after)
import { useModalStore } from '~/stores/modal'
const modalStore = useModalStore()
modalStore.registerModal({
  id: 'hello-modal',
  props: { title: 'Hello' }
})
```

### Route Integration

```typescript
// React (before)
useEffect(() => {
  const handleRouteChange = () => setIsOpen(false)
  router.events.on('routeChangeStart', handleRouteChange)
  return () => router.events.off('routeChangeStart', handleRouteChange)
}, [])

// Vue (after)
// Automatic via modal-router plugin - no manual setup needed
```

## Troubleshooting

### Common Issues

1. **Modal not closing on route change**
   ```typescript
   // Ensure plugin is loaded
   // Check modal options
   const modal = useModal({
     closeOnRouteChange: true // Default is true
   })
   ```

2. **Z-index conflicts**
   ```typescript
   // Use custom z-index offset
   modalStore.registerModal({
     id: 'high-priority',
     options: { zIndexOffset: 100 }
   })
   ```

3. **Focus not trapped**
   ```typescript
   // Ensure focusable elements exist
   // Check DOM structure
   // Use focus utilities manually if needed
   import { focusManager } from '~/utils/modal'
   focusManager.focusFirst(modalElement)
   ```

4. **Memory leaks**
   ```typescript
   // Always use useModal composable for auto-cleanup
   // Or manually clean up in onUnmounted
   onUnmounted(() => {
     modalStore.reset() // Only in testing/development
   })
   ```

## API Reference

### Modal Store

- `registerModal(modal)` - Register and open a modal
- `unregisterModal(id)` - Close and remove a modal
- `updateModal(id, updates)` - Update modal properties
- `getModal(id)` - Get modal by ID
- `isModalOpen(id)` - Check if modal is open
- `closeAll(options)` - Close all modals
- `closeTop()` - Close top modal
- `queueModal(modal, priority)` - Add modal to queue
- `processQueue()` - Process next queued modal
- `handleRouteChange()` - Handle navigation
- `reset()` - Reset all state

### Composables

- `useModal(options)` - Basic modal management
- `useModalStack()` - Modal stacking utilities
- `useModalQueue()` - Queue management
- `useConfirmDialog()` - Confirmation dialogs
- `useModalRouter()` - Route integration

### Utilities

- `generateModalId(prefix)` - Generate unique ID
- `FocusManager` - Focus management class
- `ScrollManager` - Scroll management class
- `AnimationManager` - Animation utilities
- `ModalEventBus` - Event communication
- `modalUtils` - High-level utilities

This documentation provides a comprehensive guide to the Modal Management System. For more specific examples and advanced use cases, refer to the test files and component implementations.
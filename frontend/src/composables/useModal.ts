import { ref, onUnmounted, computed, readonly } from 'vue'
import { useModalStore, type ModalEntry, type ModalOptions } from '~/stores/modal'

/**
 * Options for the useModal composable
 */
export interface UseModalOptions extends ModalOptions {
  /** Auto-generate unique ID if not provided */
  autoId?: boolean
  /** Custom modal ID */
  id?: string
}

/**
 * Core modal composable for managing individual modal state
 * 
 * Provides a simple interface for opening, closing, and managing a single modal
 * with automatic cleanup and integration with the global modal store.
 * 
 * @param options - Configuration options for the modal
 * @returns Modal management interface
 */
export function useModal(options: UseModalOptions = {}) {
  const modalStore = useModalStore()
  
  // Generate unique ID if not provided
  const modalId = ref(options.id ?? `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  const isOpen = ref(false)
  const zIndex = ref(1000)
  const props = ref<Record<string, any>>({})
  
  // Computed properties
  const modalEntry = computed(() => modalStore.getModal(modalId.value))
  const isActive = computed(() => modalStore.activeModal?.id === modalId.value)
  
  /**
   * Open the modal with optional props
   */
  const open = (modalProps?: Record<string, any>) => {
    if (isOpen.value) return
    
    if (modalProps) {
      props.value = modalProps
    }
    
    const entry: Omit<ModalEntry, 'zIndex' | 'openedAt'> = {
      id: modalId.value,
      props: props.value,
      options: {
        closeOnRouteChange: true,
        closeOnEscape: true,
        closeOnBackdrop: true,
        persistent: false,
        ...options,
        onClose: () => {
          isOpen.value = false
          if (options.onClose) {
            options.onClose()
          }
        }
      }
    }
    
    zIndex.value = modalStore.registerModal(entry)
    isOpen.value = true
  }
  
  /**
   * Close the modal
   */
  const close = () => {
    if (!isOpen.value) return
    
    modalStore.unregisterModal(modalId.value)
    // isOpen will be set to false by onClose callback
  }
  
  /**
   * Toggle modal open/closed state
   */
  const toggle = (modalProps?: Record<string, any>) => {
    if (isOpen.value) {
      close()
    } else {
      open(modalProps)
    }
  }
  
  /**
   * Update modal props without reopening
   */
  const updateProps = (newProps: Record<string, any>) => {
    props.value = { ...props.value, ...newProps }
    if (isOpen.value) {
      modalStore.updateModal(modalId.value, { props: props.value })
    }
  }
  
  /**
   * Check if this modal is registered in the store
   */
  const isRegistered = computed(() => modalStore.isModalOpen(modalId.value))
  
  // Cleanup on unmount
  onUnmounted(() => {
    if (isOpen.value) {
      close()
    }
  })
  
  return {
    // State (readonly)
    modalId: readonly(modalId),
    isOpen: readonly(isOpen),
    isActive: readonly(isActive),
    isRegistered: readonly(isRegistered),
    zIndex: readonly(zIndex),
    props: readonly(props),
    modalEntry: readonly(modalEntry),
    
    // Actions
    open,
    close,
    toggle,
    updateProps
  }
}

/**
 * Composable for managing modal stacks and nested modals
 * 
 * Provides utilities for handling complex modal interactions where
 * multiple modals need to be coordinated or stacked.
 */
export function useModalStack() {
  const modalStore = useModalStore()
  
  /**
   * Open a modal on top of the current stack
   */
  const pushModal = (modal: Omit<ModalEntry, 'zIndex' | 'openedAt'>) => {
    return modalStore.registerModal(modal)
  }
  
  /**
   * Close the top modal in the stack
   */
  const popModal = () => {
    return modalStore.closeTop()
  }
  
  /**
   * Close all modals in the stack
   */
  const clearStack = (options?: { force?: boolean; except?: string[] }) => {
    return modalStore.closeAll(options)
  }
  
  /**
   * Get the current modal stack
   */
  const stack = computed(() => modalStore.modals)
  const stackHeight = computed(() => modalStore.modalCount)
  const topModal = computed(() => modalStore.activeModal)
  
  return {
    // State
    stack: readonly(stack),
    stackHeight: readonly(stackHeight),
    topModal: readonly(topModal),
    
    // Actions
    pushModal,
    popModal,
    clearStack
  }
}

/**
 * Composable for managing modal queues and sequential display
 * 
 * Useful for scenarios where multiple modals need to be shown
 * in sequence, such as onboarding flows or error handling.
 */
export function useModalQueue() {
  const modalStore = useModalStore()
  
  /**
   * Add a modal to the queue
   */
  const enqueue = (
    modal: Omit<ModalEntry, 'id' | 'zIndex' | 'openedAt'>, 
    priority: 'low' | 'normal' | 'high' = 'normal'
  ) => {
    return modalStore.queueModal(modal, priority)
  }
  
  /**
   * Remove a modal from the queue
   */
  const dequeue = (id: string) => {
    return modalStore.removeFromQueue(id)
  }
  
  /**
   * Process the next modal in the queue
   */
  const processNext = () => {
    return modalStore.processQueue()
  }
  
  /**
   * Clear all queued modals
   */
  const clearQueue = () => {
    return modalStore.clearQueue()
  }
  
  // Queue state
  const queue = computed(() => modalStore.modalQueue)
  const queueLength = computed(() => modalStore.modalQueue.length)
  const hasQueue = computed(() => queueLength.value > 0)
  
  return {
    // State
    queue: readonly(queue),
    queueLength: readonly(queueLength),
    hasQueue: readonly(hasQueue),
    
    // Actions
    enqueue,
    dequeue,
    processNext,
    clearQueue
  }
}

/**
 * Specialized composable for confirmation dialogs
 * 
 * Provides a simple interface for showing confirmation dialogs
 * with Promise-based responses.
 */
export function useConfirmDialog() {
  const modalStore = useModalStore()
  
  interface ConfirmOptions {
    title?: string
    message?: string
    confirmText?: string
    cancelText?: string
    variant?: 'default' | 'destructive'
    persistent?: boolean
  }
  
  /**
   * Show a confirmation dialog and return a promise
   */
  const confirm = (options: ConfirmOptions = {}): Promise<boolean> => {
    return new Promise((resolve) => {
      const id = `confirm-${Date.now()}`
      const defaultOptions = {
        title: 'Confirm Action',
        message: 'Are you sure you want to continue?',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        variant: 'default' as const,
        persistent: false
      }
      
      const finalOptions = { ...defaultOptions, ...options }
      
      modalStore.registerModal({
        id,
        props: {
          ...finalOptions,
          onConfirm: () => {
            modalStore.unregisterModal(id)
            resolve(true)
          },
          onCancel: () => {
            modalStore.unregisterModal(id)
            resolve(false)
          }
        },
        options: {
          persistent: finalOptions.persistent,
          closeOnEscape: true,
          closeOnBackdrop: !finalOptions.persistent,
          onClose: () => resolve(false)
        }
      })
    })
  }
  
  /**
   * Show a simple alert dialog
   */
  const alert = (message: string, title = 'Alert'): Promise<void> => {
    return new Promise((resolve) => {
      const id = `alert-${Date.now()}`
      
      modalStore.registerModal({
        id,
        props: {
          title,
          message,
          onOk: () => {
            modalStore.unregisterModal(id)
            resolve()
          }
        },
        options: {
          closeOnEscape: true,
          closeOnBackdrop: true,
          onClose: () => resolve()
        }
      })
    })
  }
  
  return {
    confirm,
    alert
  }
}

/**
 * Composable for integrating modals with Vue Router
 * 
 * Handles route-based modal behavior including opening modals
 * from routes and managing modal state during navigation.
 */
export function useModalRouter() {
  const modalStore = useModalStore()
  const router = useRouter()
  
  /**
   * Open a modal and optionally update the route
   */
  const openModalWithRoute = async (
    modal: Omit<ModalEntry, 'zIndex' | 'openedAt'>,
    route?: { name?: string; params?: Record<string, any>; query?: Record<string, any> }
  ) => {
    const zIndex = modalStore.registerModal(modal)
    
    if (route) {
      await router.push({
        name: route.name ?? router.currentRoute.value.name ?? undefined,
        params: { ...router.currentRoute.value.params, ...route.params },
        query: { ...router.currentRoute.value.query, ...route.query }
      })
    }
    
    return zIndex
  }
  
  /**
   * Close modal and optionally navigate to a route
   */
  const closeModalWithRoute = async (
    modalId: string,
    route?: { name?: string; params?: Record<string, any>; query?: Record<string, any> }
  ) => {
    const success = modalStore.unregisterModal(modalId)
    
    if (success && route) {
      await router.push({
        name: route.name ?? router.currentRoute.value.name ?? undefined,
        params: { ...router.currentRoute.value.params, ...route.params },
        query: { ...router.currentRoute.value.query, ...route.query }
      })
    }
    
    return success
  }
  
  /**
   * Handle browser back button for modal navigation
   */
  const handleBackButton = () => {
    const activeModal = modalStore.activeModal
    if (activeModal && !activeModal.options?.persistent) {
      modalStore.unregisterModal(activeModal.id)
      return true // Indicate that we handled the back navigation
    }
    return false
  }
  
  return {
    openModalWithRoute,
    closeModalWithRoute,
    handleBackButton
  }
}
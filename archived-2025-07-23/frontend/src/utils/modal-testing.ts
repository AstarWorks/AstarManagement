import { ref, computed } from 'vue'
import type { ModalEntry, ModalOptions, ModalQueueEntry } from '~/stores/modal'

/**
 * Testing utilities for modal management system
 * 
 * Provides mock implementations, testing helpers, and assertion utilities
 * for testing modal behavior in isolation and integration tests.
 */

/**
 * Mock modal store for testing
 */
export function createMockModalStore() {
  const modals = ref<ModalEntry[]>([])
  const modalQueue = ref<ModalQueueEntry[]>([])
  const baseZIndex = 1000
  const zIndexIncrement = 10

  // Computed properties
  const activeModal = computed(() => 
    modals.value.length > 0 ? modals.value[modals.value.length - 1] : null
  )
  const hasModals = computed(() => modals.value.length > 0)
  const modalCount = computed(() => modals.value.length)
  const topZIndex = computed(() => {
    if (modals.value.length === 0) return baseZIndex
    return baseZIndex + (modals.value.length * zIndexIncrement)
  })

  // Track method calls for testing
  const methodCalls = ref<Array<{ method: string; args: any[]; timestamp: number }>>([])
  
  const trackCall = (method: string, ...args: any[]) => {
    methodCalls.value.push({
      method,
      args,
      timestamp: Date.now()
    })
  }

  // Modal management
  const registerModal = (modal: Omit<ModalEntry, 'zIndex' | 'openedAt'>): number => {
    trackCall('registerModal', modal)
    
    const zIndex = baseZIndex + (modals.value.length * zIndexIncrement) + (modal.options?.zIndexOffset ?? 0)
    const entry: ModalEntry = {
      ...modal,
      zIndex,
      openedAt: Date.now()
    }
    
    modals.value.push(entry)
    return zIndex
  }

  const unregisterModal = (id: string): boolean => {
    trackCall('unregisterModal', id)
    
    const index = modals.value.findIndex(m => m.id === id)
    if (index === -1) return false
    
    const modal = modals.value[index]
    if (modal.options?.onClose) {
      modal.options.onClose()
    }
    
    modals.value.splice(index, 1)
    return true
  }

  const updateModal = (id: string, updates: Partial<ModalEntry>): boolean => {
    trackCall('updateModal', id, updates)
    
    const index = modals.value.findIndex(m => m.id === id)
    if (index === -1) return false
    
    modals.value[index] = { ...modals.value[index], ...updates }
    return true
  }

  const getModal = (id: string): ModalEntry | null => {
    trackCall('getModal', id)
    return modals.value.find(m => m.id === id) ?? null
  }

  const isModalOpen = (id: string): boolean => {
    trackCall('isModalOpen', id)
    return modals.value.some(m => m.id === id)
  }

  const closeAll = (options?: { force?: boolean; except?: string[] }): number => {
    trackCall('closeAll', options)
    
    const except = options?.except ?? []
    let closedCount = 0
    
    if (options?.force) {
      const toClose = modals.value.filter(m => !except.includes(m.id))
      toClose.forEach(modal => {
        if (modal.options?.onClose) {
          modal.options.onClose()
        }
      })
      modals.value = modals.value.filter(m => except.includes(m.id))
      closedCount = toClose.length
    } else {
      const toClose = modals.value.filter(m => 
        !m.options?.persistent && !except.includes(m.id)
      )
      toClose.forEach(modal => {
        if (modal.options?.onClose) {
          modal.options.onClose()
        }
      })
      modals.value = modals.value.filter(m => 
        m.options?.persistent || except.includes(m.id)
      )
      closedCount = toClose.length
    }
    
    return closedCount
  }

  const closeTop = (): boolean => {
    trackCall('closeTop')
    
    if (modals.value.length === 0) return false
    const topModal = modals.value[modals.value.length - 1]
    return unregisterModal(topModal.id)
  }

  const queueModal = (modal: Omit<ModalEntry, 'id' | 'zIndex' | 'openedAt'>, priority: 'low' | 'normal' | 'high' = 'normal'): string => {
    trackCall('queueModal', modal, priority)
    
    const id = `queued-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const queueEntry: ModalQueueEntry = {
      id,
      modal,
      priority,
      queuedAt: Date.now()
    }
    
    if (priority === 'high') {
      modalQueue.value.unshift(queueEntry)
    } else if (priority === 'low') {
      modalQueue.value.push(queueEntry)
    } else {
      const firstNormalIndex = modalQueue.value.findIndex(item => item.priority !== 'high')
      if (firstNormalIndex === -1) {
        modalQueue.value.push(queueEntry)
      } else {
        modalQueue.value.splice(firstNormalIndex, 0, queueEntry)
      }
    }
    
    return id
  }

  const processQueue = (): boolean => {
    trackCall('processQueue')
    
    if (modalQueue.value.length === 0 || modals.value.length > 0) {
      return false
    }
    
    const nextModal = modalQueue.value.shift()
    if (!nextModal) return false
    
    registerModal({
      ...nextModal.modal,
      id: nextModal.id
    })
    
    return true
  }

  const clearQueue = (): number => {
    trackCall('clearQueue')
    
    const count = modalQueue.value.length
    modalQueue.value = []
    return count
  }

  const removeFromQueue = (id: string): boolean => {
    trackCall('removeFromQueue', id)
    
    const index = modalQueue.value.findIndex(item => item.id === id)
    if (index === -1) return false
    
    modalQueue.value.splice(index, 1)
    return true
  }

  const handleRouteChange = (): number => {
    trackCall('handleRouteChange')
    
    return closeAll({ 
      force: false,
      except: modals.value
        .filter(m => m.options?.closeOnRouteChange === false)
        .map(m => m.id)
    })
  }

  const reset = (): void => {
    trackCall('reset')
    
    modals.value.forEach(modal => {
      if (modal.options?.onClose) {
        modal.options.onClose()
      }
    })
    
    modals.value = []
    modalQueue.value = []
    methodCalls.value = []
  }

  const getModalMetrics = () => {
    trackCall('getModalMetrics')
    
    return {
      totalModals: modals.value.length,
      queuedModals: modalQueue.value.length,
      oldestModal: modals.value.length > 0 
        ? Math.min(...modals.value.map(m => m.openedAt ?? 0))
        : null,
      newestModal: modals.value.length > 0
        ? Math.max(...modals.value.map(m => m.openedAt ?? 0))
        : null,
      currentZIndex: topZIndex.value
    }
  }

  // Testing-specific methods
  const getMethodCalls = () => [...methodCalls.value]
  const clearMethodCalls = () => { methodCalls.value = [] }
  const getLastMethodCall = () => methodCalls.value[methodCalls.value.length - 1]
  const hasMethodBeenCalled = (method: string) => methodCalls.value.some(call => call.method === method)

  return {
    // State
    modals,
    modalQueue,
    activeModal,
    hasModals,
    modalCount,
    topZIndex,
    
    // Modal management
    registerModal,
    unregisterModal,
    updateModal,
    getModal,
    isModalOpen,
    
    // Bulk operations
    closeAll,
    closeTop,
    
    // Queue management
    queueModal,
    processQueue,
    clearQueue,
    removeFromQueue,
    
    // System integration
    handleRouteChange,
    reset,
    getModalMetrics,
    
    // Testing utilities
    getMethodCalls,
    clearMethodCalls,
    getLastMethodCall,
    hasMethodBeenCalled
  }
}

/**
 * Modal testing helpers for component and integration tests
 */
export class ModalTestingHelpers {
  private modalStore: ReturnType<typeof createMockModalStore>

  constructor(modalStore?: ReturnType<typeof createMockModalStore>) {
    this.modalStore = modalStore ?? createMockModalStore()
  }

  /**
   * Wait for a modal to be registered
   */
  async waitForModal(id: string, timeout = 1000): Promise<boolean> {
    const start = Date.now()
    
    return new Promise((resolve) => {
      const checkModal = () => {
        if (this.modalStore.isModalOpen(id)) {
          resolve(true)
          return
        }
        
        if (Date.now() - start > timeout) {
          resolve(false)
          return
        }
        
        setTimeout(checkModal, 10)
      }
      
      checkModal()
    })
  }

  /**
   * Wait for a modal to be closed
   */
  async waitForModalClose(id: string, timeout = 1000): Promise<boolean> {
    const start = Date.now()
    
    return new Promise((resolve) => {
      const checkModal = () => {
        if (!this.modalStore.isModalOpen(id)) {
          resolve(true)
          return
        }
        
        if (Date.now() - start > timeout) {
          resolve(false)
          return
        }
        
        setTimeout(checkModal, 10)
      }
      
      checkModal()
    })
  }

  /**
   * Wait for modal count to reach specific number
   */
  async waitForModalCount(count: number, timeout = 1000): Promise<boolean> {
    const start = Date.now()
    
    return new Promise((resolve) => {
      const checkCount = () => {
        if (this.modalStore.modalCount.value === count) {
          resolve(true)
          return
        }
        
        if (Date.now() - start > timeout) {
          resolve(false)
          return
        }
        
        setTimeout(checkCount, 10)
      }
      
      checkCount()
    })
  }

  /**
   * Simulate escape key press
   */
  simulateEscapeKey(): void {
    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      code: 'Escape',
      keyCode: 27,
      bubbles: true,
      cancelable: true
    })
    document.dispatchEvent(event)
  }

  /**
   * Simulate tab key press
   */
  simulateTabKey(shiftKey = false): void {
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      code: 'Tab',
      keyCode: 9,
      shiftKey,
      bubbles: true,
      cancelable: true
    })
    document.dispatchEvent(event)
  }

  /**
   * Create a test modal entry
   */
  createTestModal(overrides: Partial<ModalEntry> = {}): ModalEntry {
    return {
      id: `test-modal-${Date.now()}`,
      props: { title: 'Test Modal', message: 'This is a test modal' },
      options: {
        persistent: false,
        closeOnEscape: true,
        closeOnBackdrop: true,
        closeOnRouteChange: true
      },
      zIndex: 1000,
      openedAt: Date.now(),
      ...overrides
    }
  }

  /**
   * Get modal store for advanced testing
   */
  getStore() {
    return this.modalStore
  }
}

/**
 * Assertion utilities for modal testing
 */
export const modalAssertions = {
  /**
   * Assert that a modal is open
   */
  assertModalOpen(store: ReturnType<typeof createMockModalStore>, id: string): void {
    if (!store.isModalOpen(id)) {
      throw new Error(`Expected modal "${id}" to be open, but it is not`)
    }
  },

  /**
   * Assert that a modal is closed
   */
  assertModalClosed(store: ReturnType<typeof createMockModalStore>, id: string): void {
    if (store.isModalOpen(id)) {
      throw new Error(`Expected modal "${id}" to be closed, but it is open`)
    }
  },

  /**
   * Assert modal count
   */
  assertModalCount(store: ReturnType<typeof createMockModalStore>, expectedCount: number): void {
    const actualCount = store.modalCount.value
    if (actualCount !== expectedCount) {
      throw new Error(`Expected ${expectedCount} modals, but found ${actualCount}`)
    }
  },

  /**
   * Assert that a method was called
   */
  assertMethodCalled(store: ReturnType<typeof createMockModalStore>, method: string): void {
    if (!store.hasMethodBeenCalled(method)) {
      throw new Error(`Expected method "${method}" to have been called, but it was not`)
    }
  },

  /**
   * Assert modal z-index order
   */
  assertModalOrder(store: ReturnType<typeof createMockModalStore>, expectedOrder: string[]): void {
    const actualOrder = store.modals.value.map(m => m.id)
    if (JSON.stringify(actualOrder) !== JSON.stringify(expectedOrder)) {
      throw new Error(`Expected modal order [${expectedOrder.join(', ')}], but got [${actualOrder.join(', ')}]`)
    }
  },

  /**
   * Assert active modal
   */
  assertActiveModal(store: ReturnType<typeof createMockModalStore>, expectedId: string | null): void {
    const activeModalId = store.activeModal.value?.id ?? null
    if (activeModalId !== expectedId) {
      throw new Error(`Expected active modal to be "${expectedId}", but got "${activeModalId}"`)
    }
  }
}

/**
 * Integration test patterns for modal system
 */
export const modalTestPatterns = {
  /**
   * Test basic modal lifecycle
   */
  async testModalLifecycle(helpers: ModalTestingHelpers) {
    const store = helpers.getStore()
    const modalId = 'test-lifecycle'
    
    // Initial state
    modalAssertions.assertModalCount(store, 0)
    modalAssertions.assertModalClosed(store, modalId)
    
    // Open modal
    store.registerModal({ id: modalId, props: { title: 'Test' } })
    modalAssertions.assertModalOpen(store, modalId)
    modalAssertions.assertModalCount(store, 1)
    modalAssertions.assertActiveModal(store, modalId)
    
    // Close modal
    store.unregisterModal(modalId)
    modalAssertions.assertModalClosed(store, modalId)
    modalAssertions.assertModalCount(store, 0)
    modalAssertions.assertActiveModal(store, null)
  },

  /**
   * Test modal stacking
   */
  async testModalStacking(helpers: ModalTestingHelpers) {
    const store = helpers.getStore()
    const modal1 = 'test-stack-1'
    const modal2 = 'test-stack-2'
    
    // Open first modal
    const zIndex1 = store.registerModal({ id: modal1, props: { title: 'Modal 1' } })
    modalAssertions.assertActiveModal(store, modal1)
    
    // Open second modal
    const zIndex2 = store.registerModal({ id: modal2, props: { title: 'Modal 2' } })
    modalAssertions.assertActiveModal(store, modal2)
    modalAssertions.assertModalCount(store, 2)
    
    // Check z-index order
    if (zIndex2 <= zIndex1) {
      throw new Error('Second modal should have higher z-index')
    }
    
    // Close top modal
    store.closeTop()
    modalAssertions.assertActiveModal(store, modal1)
    modalAssertions.assertModalCount(store, 1)
    
    // Close remaining modal
    store.closeAll()
    modalAssertions.assertModalCount(store, 0)
  },

  /**
   * Test modal queue
   */
  async testModalQueue(helpers: ModalTestingHelpers) {
    const store = helpers.getStore()
    
    // Queue modals while one is open
    store.registerModal({ id: 'blocking-modal', props: { title: 'Blocking' } })
    
    const queuedId1 = store.queueModal({ props: { title: 'Queued 1' } }, 'normal')
    const queuedId2 = store.queueModal({ props: { title: 'Queued 2' } }, 'high')
    
    // High priority should be first in queue
    modalAssertions.assertModalCount(store, 1) // Only blocking modal is open
    
    // Close blocking modal - should process queue
    store.unregisterModal('blocking-modal')
    
    // High priority modal should open first
    modalAssertions.assertActiveModal(store, queuedId2)
    
    // Close and next should open
    store.unregisterModal(queuedId2)
    modalAssertions.assertActiveModal(store, queuedId1)
  }
}
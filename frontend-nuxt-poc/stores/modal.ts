import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { Component } from 'vue'

/**
 * Modal entry representing an active modal in the system
 */
export interface ModalEntry {
  /** Unique identifier for the modal */
  id: string
  /** Vue component to render (optional for non-component modals) */
  component?: Component
  /** Props to pass to the modal component */
  props?: Record<string, any>
  /** Modal configuration options */
  options?: ModalOptions
  /** Calculated z-index for stacking */
  zIndex?: number
  /** Timestamp when modal was opened */
  openedAt?: number
}

/**
 * Configuration options for modal behavior
 */
export interface ModalOptions {
  /** Whether modal persists through route changes */
  persistent?: boolean
  /** Whether to close modal on route change (default: true) */
  closeOnRouteChange?: boolean
  /** Whether to close modal on Escape key (default: true) */
  closeOnEscape?: boolean
  /** Whether to close modal on backdrop click (default: true) */
  closeOnBackdrop?: boolean
  /** Custom z-index offset */
  zIndexOffset?: number
  /** Modal priority for queue management */
  priority?: 'low' | 'normal' | 'high'
  /** Callback when modal is closed */
  onClose?: () => void
}

/**
 * Modal queue entry for sequential modal display
 */
export interface ModalQueueEntry {
  id: string
  modal: Omit<ModalEntry, 'id' | 'zIndex' | 'openedAt'>
  priority: 'low' | 'normal' | 'high'
  queuedAt: number
}

/**
 * Pinia store for managing modal state across the application
 * 
 * Features:
 * - Modal registration and cleanup
 * - Z-index stacking management
 * - Modal queue for sequential display
 * - Route change integration
 * - Memory leak prevention
 */
export const useModalStore = defineStore('modal', () => {
  // Core state
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

  // Modal registration and management
  const registerModal = (modal: Omit<ModalEntry, 'zIndex' | 'openedAt'>): number => {
    const zIndex = baseZIndex + (modals.value.length * zIndexIncrement) + (modal.options?.zIndexOffset ?? 0)
    const entry: ModalEntry = {
      ...modal,
      zIndex,
      openedAt: Date.now()
    }
    
    modals.value.push(entry)
    
    // Call onOpen callback if provided
    if (modal.options?.onClose) {
      // Store callback for later use
    }
    
    return zIndex
  }

  const unregisterModal = (id: string): boolean => {
    const index = modals.value.findIndex(m => m.id === id)
    if (index === -1) return false
    
    const modal = modals.value[index]
    
    // Call onClose callback if provided
    if (modal.options?.onClose) {
      modal.options.onClose()
    }
    
    modals.value.splice(index, 1)
    
    // Process queue after closing modal
    processQueue()
    
    return true
  }

  const updateModal = (id: string, updates: Partial<ModalEntry>): boolean => {
    const index = modals.value.findIndex(m => m.id === id)
    if (index === -1) return false
    
    modals.value[index] = { ...modals.value[index], ...updates }
    return true
  }

  const getModal = (id: string): ModalEntry | null => {
    return modals.value.find(m => m.id === id) ?? null
  }

  const isModalOpen = (id: string): boolean => {
    return modals.value.some(m => m.id === id)
  }

  // Bulk modal operations
  const closeAll = (options?: { force?: boolean; except?: string[] }): number => {
    const except = options?.except ?? []
    let closedCount = 0
    
    if (options?.force) {
      // Force close all modals
      const toClose = modals.value.filter(m => !except.includes(m.id))
      toClose.forEach(modal => {
        if (modal.options?.onClose) {
          modal.options.onClose()
        }
      })
      modals.value = modals.value.filter(m => except.includes(m.id))
      closedCount = toClose.length
    } else {
      // Close only non-persistent modals
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
    
    // Process queue after bulk close
    processQueue()
    
    return closedCount
  }

  const closeTop = (): boolean => {
    if (modals.value.length === 0) return false
    const topModal = modals.value[modals.value.length - 1]
    return unregisterModal(topModal.id)
  }

  // Modal queue management
  const queueModal = (modal: Omit<ModalEntry, 'id' | 'zIndex' | 'openedAt'>, priority: 'low' | 'normal' | 'high' = 'normal'): string => {
    const id = `queued-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const queueEntry: ModalQueueEntry = {
      id,
      modal,
      priority,
      queuedAt: Date.now()
    }
    
    // Insert based on priority
    if (priority === 'high') {
      modalQueue.value.unshift(queueEntry)
    } else if (priority === 'low') {
      modalQueue.value.push(queueEntry)
    } else {
      // Normal priority - insert after high priority items
      const firstNormalIndex = modalQueue.value.findIndex(item => item.priority !== 'high')
      if (firstNormalIndex === -1) {
        modalQueue.value.push(queueEntry)
      } else {
        modalQueue.value.splice(firstNormalIndex, 0, queueEntry)
      }
    }
    
    // Process queue if no modals are currently open
    if (modals.value.length === 0) {
      processQueue()
    }
    
    return id
  }

  const processQueue = (): boolean => {
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
    const count = modalQueue.value.length
    modalQueue.value = []
    return count
  }

  const removeFromQueue = (id: string): boolean => {
    const index = modalQueue.value.findIndex(item => item.id === id)
    if (index === -1) return false
    
    modalQueue.value.splice(index, 1)
    return true
  }

  // Route change handling
  const handleRouteChange = (): number => {
    return closeAll({ 
      force: false,
      except: modals.value
        .filter(m => m.options?.closeOnRouteChange === false)
        .map(m => m.id)
    })
  }

  // Utility methods
  const reset = (): void => {
    // Call all onClose callbacks
    modals.value.forEach(modal => {
      if (modal.options?.onClose) {
        modal.options.onClose()
      }
    })
    
    modals.value = []
    modalQueue.value = []
  }

  const getModalMetrics = () => {
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

  return {
    // State (readonly)
    modals: readonly(modals),
    modalQueue: readonly(modalQueue),
    activeModal: readonly(activeModal),
    hasModals: readonly(hasModals),
    modalCount: readonly(modalCount),
    topZIndex: readonly(topZIndex),
    
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
    getModalMetrics
  }
})

// Type exports for external use
export type { ModalEntry, ModalOptions, ModalQueueEntry }
import { useModalStore } from '~/stores/modal'

/**
 * Client-side plugin for integrating modal management with Vue Router
 * 
 * This plugin handles:
 * - Closing modals on route changes
 * - Browser back button behavior
 * - Route-based modal persistence
 * - History state management
 */
export default defineNuxtPlugin((nuxtApp) => {
  const modalStore = useModalStore()
  const router = useRouter()
  
  // Track whether we're currently in a programmatic navigation
  let isProgrammaticNavigation = false
  
  /**
   * Handle route changes - close non-persistent modals
   */
  router.beforeEach((to, from) => {
    // Only close modals if this is a real navigation (not programmatic)
    if (!isProgrammaticNavigation) {
      const closedCount = modalStore.handleRouteChange()
      
      // Log for debugging if modals were closed
      if (closedCount > 0) {
        console.debug(`[ModalRouter] Closed ${closedCount} modal(s) on route change`)
      }
    }
    
    // Reset flag after processing
    isProgrammaticNavigation = false
    
    return true
  })
  
  /**
   * Handle browser back/forward button
   */
  const handlePopState = (event: PopStateEvent) => {
    const activeModal = modalStore.activeModal
    
    if (activeModal) {
      // If there's an active modal, check if it should close on back
      if (!activeModal.options?.persistent) {
        // Prevent the default back navigation
        event.preventDefault()
        
        // Close the modal instead
        modalStore.unregisterModal(activeModal.id)
        
        // Push the current state back to prevent actual navigation
        window.history.pushState(null, '', window.location.href)
        
        return
      }
    }
    
    // If no modal is open or modal is persistent, allow normal navigation
  }
  
  /**
   * Enhanced router navigation that considers modal state
   */
  const navigate = async (
    to: string | { name?: string; params?: Record<string, any>; query?: Record<string, any> },
    options: { force?: boolean; closeModals?: boolean } = {}
  ) => {
    const { force = false, closeModals = true } = options
    
    if (closeModals && !force) {
      // Close all non-persistent modals before navigation
      modalStore.closeAll({ force: false })
    } else if (force) {
      // Force close all modals
      modalStore.closeAll({ force: true })
    }
    
    // Mark as programmatic navigation
    isProgrammaticNavigation = true
    
    // Perform the navigation
    if (typeof to === 'string') {
      await router.push(to)
    } else {
      await router.push(to)
    }
  }
  
  /**
   * Check if navigation should be blocked by modal state
   */
  const canNavigate = (): boolean => {
    const persistentModals = modalStore.modals.filter(m => m.options?.persistent)
    return persistentModals.length === 0
  }
  
  /**
   * Get current modal context for route state
   */
  const getModalContext = () => {
    return {
      hasModals: modalStore.hasModals,
      modalCount: modalStore.modalCount,
      activeModalId: modalStore.activeModal?.id,
      persistentModalCount: modalStore.modals.filter(m => m.options?.persistent).length
    }
  }
  
  // Browser back button handler
  if (process.client) {
    window.addEventListener('popstate', handlePopState)
    
    // Cleanup will be handled by browser when page unloads
    // The event listener will be automatically removed when the page is unloaded
  }
  
  // Provide router utilities globally
  return {
    provide: {
      modalRouter: {
        navigate,
        canNavigate,
        getModalContext,
        handlePopState
      }
    }
  }
})
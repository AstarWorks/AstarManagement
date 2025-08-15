/**
 * Form Navigation Guards Composable
 * Prevents accidental data loss by implementing navigation guards
 */

import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router'

export interface INavigationGuardOptions {
  /** Whether the form has unsaved changes */
  isDirty: Ref<boolean> | ComputedRef<boolean>
  /** Custom confirmation message */
  confirmMessage?: string
  /** Whether to enable browser beforeunload event */
  enableBrowserGuard?: boolean
  /** Whether to enable Vue Router guard */
  enableRouterGuard?: boolean
  /** Custom confirmation handler */
  confirmHandler?: () => Promise<boolean>
  /** Callback when navigation is prevented */
  onNavigationPrevented?: () => void
  /** Callback when navigation is allowed */
  onNavigationAllowed?: () => void
}

export interface INavigationGuardReturn {
  /** Enable all guards */
  enableGuards: () => void
  /** Disable all guards */
  disableGuards: () => void
  /** Force allow next navigation */
  allowNextNavigation: () => void
  /** Check if navigation should be prevented */
  shouldPreventNavigation: () => boolean
  /** Router navigation guard function */
  routerGuard: (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => void
}

/**
 * Composable for implementing form navigation guards
 */
export const useFormNavigationGuards = (options: INavigationGuardOptions): INavigationGuardReturn => {
  const {
    isDirty,
    confirmMessage,
    enableBrowserGuard = true,
    enableRouterGuard = true,
    confirmHandler,
    onNavigationPrevented,
    onNavigationAllowed
  } = options

  const { t } = useI18n()
  const router = useRouter()

  // Internal state
  const guardsEnabled = ref(true)
  const allowNext = ref(false)

  // Get confirmation message
  const getConfirmMessage = () => {
    return confirmMessage || t('common.confirm.discardChanges')
  }

  // Browser beforeunload handler
  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (!guardsEnabled.value || !isDirty.value || allowNext.value) {
      return
    }

    event.preventDefault()
    event.returnValue = getConfirmMessage()
    return event.returnValue
  }

  // Check if navigation should be prevented
  const shouldPreventNavigation = (): boolean => {
    return guardsEnabled.value && isDirty.value && !allowNext.value
  }

  // Custom confirmation handler or default
  const confirmNavigation = async (): Promise<boolean> => {
    if (confirmHandler) {
      return await confirmHandler()
    }
    
    // Default browser confirm
    return confirm(getConfirmMessage())
  }

  // Vue Router navigation guard
  const routerGuard = async (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
  ) => {
    // Always allow if guards are disabled or no changes
    if (!shouldPreventNavigation()) {
      if (onNavigationAllowed) {
        onNavigationAllowed()
      }
      next()
      return
    }

    // Confirm navigation
    const confirmed = await confirmNavigation()
    
    if (confirmed) {
      // User wants to leave - allow navigation
      allowNext.value = true
      if (onNavigationAllowed) {
        onNavigationAllowed()
      }
      next()
      // Reset the flag after navigation
      nextTick(() => {
        allowNext.value = false
      })
    } else {
      // User wants to stay - prevent navigation
      if (onNavigationPrevented) {
        onNavigationPrevented()
      }
      next(false)
    }
  }

  // Enable guards
  const enableGuards = () => {
    guardsEnabled.value = true
    
    // Browser guard
    if (enableBrowserGuard && typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload)
    }
    
    // Router guard
    if (enableRouterGuard && router) {
      router.beforeEach(routerGuard)
    }
  }

  // Disable guards
  const disableGuards = () => {
    guardsEnabled.value = false
    
    // Remove browser guard
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }

  // Force allow next navigation
  const allowNextNavigation = () => {
    allowNext.value = true
    // Auto-reset after next tick
    nextTick(() => {
      allowNext.value = false
    })
  }

  // Lifecycle hooks
  onMounted(() => {
    enableGuards()
  })

  onUnmounted(() => {
    disableGuards()
  })

  // Also clean up when component is deactivated (keep-alive)
  onDeactivated(() => {
    disableGuards()
  })

  onActivated(() => {
    enableGuards()
  })

  return {
    enableGuards,
    disableGuards,
    allowNextNavigation,
    shouldPreventNavigation,
    routerGuard
  }
}

/**
 * Simplified composable for basic navigation guard functionality
 */
export const useSimpleNavigationGuard = (isDirty: Ref<boolean> | ComputedRef<boolean>) => {
  return useFormNavigationGuards({
    isDirty,
    enableBrowserGuard: true,
    enableRouterGuard: true
  })
}
import { ref, onMounted, onUnmounted, watch } from 'vue'
import type { FormInstance } from './useForm'

/**
 * Navigation guard options
 */
export interface NavigationGuardOptions {
  /** Custom message for unsaved changes */
  message?: string
  /** Callback when user tries to navigate away */
  onNavigationAttempt?: () => boolean | Promise<boolean>
  /** Whether to show browser confirmation dialog */
  showBrowserDialog?: boolean
  /** Custom confirmation function */
  confirmNavigation?: (message: string) => boolean | Promise<boolean>
}

/**
 * Navigation guard state
 */
export interface NavigationGuardState {
  /** Whether the guard is active */
  isActive: boolean
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean
  /** Last attempted navigation */
  lastNavigationAttempt?: Date
}

/**
 * Form navigation guard composable
 * 
 * Prevents users from navigating away when there are unsaved form changes.
 * Provides both browser-level and application-level protection.
 * 
 * @param form - Form instance to monitor
 * @param options - Configuration options
 * @returns Navigation guard state and controls
 */
export function useFormNavigationGuard(
  form: FormInstance<any>,
  options: NavigationGuardOptions = {}
) {
  const {
    message = 'You have unsaved changes. Are you sure you want to leave?',
    onNavigationAttempt,
    showBrowserDialog = true,
    confirmNavigation = (msg: string) => window.confirm(msg)
  } = options

  // Navigation guard state
  const state = ref<NavigationGuardState>({
    isActive: false,
    hasUnsavedChanges: false,
    lastNavigationAttempt: undefined
  })

  // Browser beforeunload handler
  const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
    if (state.value.hasUnsavedChanges && state.value.isActive) {
      if (showBrowserDialog) {
        event.preventDefault()
        event.returnValue = message
        return message
      }
    }
  }

  // Check if navigation should be blocked
  const shouldBlockNavigation = async (): Promise<boolean> => {
    if (!state.value.hasUnsavedChanges || !state.value.isActive) {
      return false
    }

    state.value.lastNavigationAttempt = new Date()

    // Call custom navigation attempt handler
    if (onNavigationAttempt) {
      const result = await onNavigationAttempt()
      if (!result) return true // Block navigation
    }

    // Show confirmation dialog
    const shouldLeave = await confirmNavigation(message)
    return !shouldLeave // Block if user chooses to stay
  }

  // Enable navigation guard
  const enable = () => {
    if (state.value.isActive) return

    state.value.isActive = true

    // Add browser beforeunload listener
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', beforeUnloadHandler)
    }
  }

  // Disable navigation guard
  const disable = () => {
    if (!state.value.isActive) return

    state.value.isActive = false

    // Remove browser beforeunload listener
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', beforeUnloadHandler)
    }
  }

  // Force allow navigation (temporarily disable guard)
  const allowNavigation = () => {
    const wasActive = state.value.isActive
    disable()
    
    // Re-enable after a short delay to allow navigation to complete
    if (wasActive) {
      setTimeout(() => {
        enable()
      }, 100)
    }
  }

  // Clear unsaved changes flag
  const markAsSaved = () => {
    state.value.hasUnsavedChanges = false
  }

  // Watch form dirty state
  watch(
    () => form.isDirty.value,
    (isDirty) => {
      state.value.hasUnsavedChanges = isDirty
    },
    { immediate: true }
  )

  // Watch form submit count to auto-clear unsaved changes
  watch(
    () => form.submitCount.value,
    (newCount, oldCount) => {
      if (newCount > oldCount) {
        // Form was submitted successfully
        markAsSaved()
      }
    }
  )

  // Auto-enable on mount if form is dirty
  onMounted(() => {
    if (form.isDirty.value) {
      enable()
    }
  })

  // Cleanup on unmount
  onUnmounted(() => {
    disable()
  })

  return {
    // State
    state: readonly(state),
    
    // Controls
    enable,
    disable,
    allowNavigation,
    markAsSaved,
    shouldBlockNavigation,
    
    // Computed shortcuts
    isActive: readonly(computed(() => state.value.isActive)),
    hasUnsavedChanges: readonly(computed(() => state.value.hasUnsavedChanges)),
    lastNavigationAttempt: readonly(computed(() => state.value.lastNavigationAttempt))
  }
}

/**
 * Nuxt.js route middleware for form navigation guard
 * 
 * Use this in your Nuxt.js pages to protect against navigation
 * when forms have unsaved changes.
 */
export function createFormRouteGuard(
  guard: ReturnType<typeof useFormNavigationGuard>
) {
  return defineNuxtRouteMiddleware(async (to: any, from: any) => {
    if (guard.hasUnsavedChanges.value && guard.isActive.value) {
      const shouldBlock = await guard.shouldBlockNavigation()
      
      if (shouldBlock) {
        // Block navigation by throwing an error or returning false
        throw createError({
          statusCode: 409,
          statusMessage: 'Navigation blocked due to unsaved changes'
        })
      }
    }
  })
}

/**
 * Vue Router navigation guard for form protection
 * 
 * Use this with Vue Router to protect against navigation
 * when forms have unsaved changes.
 */
export function createVueRouterGuard(
  guard: ReturnType<typeof useFormNavigationGuard>
) {
  return async (to: any, from: any, next: (arg?: any) => void) => {
    if (guard.hasUnsavedChanges.value && guard.isActive.value) {
      const shouldBlock = await guard.shouldBlockNavigation()
      
      if (shouldBlock) {
        next(false) // Block navigation
      } else {
        next() // Allow navigation
      }
    } else {
      next() // Allow navigation
    }
  }
}

/**
 * Type for the return value of useFormNavigationGuard
 */
export type FormNavigationGuardInstance = ReturnType<typeof useFormNavigationGuard>
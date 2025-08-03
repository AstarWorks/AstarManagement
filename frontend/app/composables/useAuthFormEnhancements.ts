/**
 * Auth Form Enhancements Composable
 * Advanced VueUse integrations for enhanced UX
 * Simple over Easy: Each enhancement is optional and composable
 */

export interface IUseAuthFormEnhancementsOptions {
  /** Enable keyboard shortcuts */
  enableKeyboardShortcuts?: boolean
  /** Enable "Remember Me" persistence */
  enableRememberMePersistence?: boolean
  /** Enable offline state detection */
  enableOfflineDetection?: boolean
  /** Enable clipboard security monitoring */
  enableClipboardSecurity?: boolean
  /** Enable dynamic page titles */
  enableDynamicTitles?: boolean
  /** Enable tab visibility pause */
  enableVisibilityPause?: boolean
}

export interface IUseAuthFormEnhancementsReturn {
  /** Whether app is online */
  isOnline: Ref<boolean>
  /** Whether tab is visible */
  isVisible: Ref<boolean>
  /** Remember me preference from localStorage */
  rememberMePreference: Ref<boolean>
  /** Page title management */
  setTitle: (title: string) => void
  /** Clipboard text (if permission granted) */
  clipboardText: Ref<string>
  /** Copy text to clipboard */
  copyToClipboard: (text: string) => Promise<void>
  /** Cleanup function */
  cleanup: () => void
}

/**
 * Enhanced auth form functionality with VueUse
 */
export const useAuthFormEnhancements = (
  options: IUseAuthFormEnhancementsOptions = {}
): IUseAuthFormEnhancementsReturn => {
  const {
    enableKeyboardShortcuts = true,
    enableRememberMePersistence = true,
    enableOfflineDetection = true,
    enableClipboardSecurity = false, // Disabled by default for privacy
    enableDynamicTitles = true,
    enableVisibilityPause = true
  } = options

  // Network status detection
  const { isOnline } = useNetwork()

  // Document visibility detection
  const visibility = useDocumentVisibility()
  const isVisible = computed(() => unref(visibility) === 'visible')

  // Remember Me persistence
  const rememberMePreference = enableRememberMePersistence 
    ? useLocalStorage('auth:rememberMe', false)
    : ref(false)

  // Clipboard management (with permission handling)
  const { text: clipboardText, copy: copyToClipboard } = useClipboard({
    read: enableClipboardSecurity
  })

  // Page title management
  const title = useTitle()
  const setTitle = (newTitle: string) => {
    if (enableDynamicTitles) {
      title.value = newTitle
    }
  }

  // Keyboard shortcuts
  let keyboardCleanup: (() => void) | undefined

  if (enableKeyboardShortcuts) {
    // Ctrl/Cmd + Enter for form submission
    const stopListening = useEventListener('keydown', (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        // Emit custom event that parent can listen to
        const submitEvent = new CustomEvent('keyboard-submit', {
          bubbles: true,
          detail: { originalEvent: e }
        })
        e.target?.dispatchEvent(submitEvent)
      }
    })
    keyboardCleanup = stopListening
  }

  // Clipboard security monitoring (if enabled)
  let clipboardCleanup: (() => void) | undefined

  if (enableClipboardSecurity && clipboardText) {
    // Watch for potential credential paste patterns
    const stopWatching = watch(clipboardText, (newText) => {
      if (newText && typeof newText === 'string') {
        // Simple pattern detection for potential credentials
        const hasEmailPattern = /@/.test(newText)
        const hasPasswordPattern = /^.{8,}$/.test(newText)
        
        if (hasEmailPattern || hasPasswordPattern) {
          console.warn('[Security] Potential credential detected in clipboard')
          // Could emit event for parent to handle
        }
      }
    })
    clipboardCleanup = stopWatching
  }

  // Tab visibility pause functionality
  if (enableVisibilityPause) {
    watch(isVisible, (visible) => {
      if (!visible) {
        // Pause certain activities when tab is not visible
        console.log('[Auth] Tab hidden - pausing activities')
      } else {
        console.log('[Auth] Tab visible - resuming activities')
      }
    })
  }

  // Offline state handling
  if (enableOfflineDetection) {
    watch(isOnline, (online) => {
      if (!online) {
        setTitle('Aster Management (Offline)')
      } else {
        setTitle('Aster Management')
      }
    })
  }

  // Cleanup function
  const cleanup = () => {
    if (keyboardCleanup) keyboardCleanup()
    if (clipboardCleanup) clipboardCleanup()
  }

  // Auto-cleanup on unmount
  onUnmounted(cleanup)

  return {
    isOnline,
    isVisible,
    rememberMePreference,
    setTitle,
    clipboardText,
    copyToClipboard,
    cleanup,
  }
}
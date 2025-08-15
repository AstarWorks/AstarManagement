/**
 * Auth Form Focus Management Composable
 * Simple over Easy: Centralized focus logic for all auth forms
 * Uses VueUse for clean, declarative focus management
 */

export interface IUseAuthFormFocusOptions {
  /** Which field should receive initial focus */
  initialFocus?: 'email' | 'password' | 'none'
  /** Whether to enable keyboard shortcuts */
  enableKeyboardShortcuts?: boolean
  /** Custom focus delay in milliseconds */
  focusDelay?: number
}

export interface IUseAuthFormFocusReturn {
  /** Email input ref */
  emailInputRef: Ref<HTMLInputElement | undefined>
  /** Password input ref */
  passwordInputRef: Ref<HTMLInputElement | undefined>
  /** Email field focus state */
  emailFocused: Ref<boolean>
  /** Password field focus state */
  passwordFocused: Ref<boolean>
  /** Focus the email field */
  focusEmail: () => void
  /** Focus the password field */
  focusPassword: () => void
  /** Focus the next field in sequence */
  focusNext: () => void
  /** Clear all focus */
  blur: () => void
}

/**
 * Auth form focus management with VueUse integration
 */
export const useAuthFormFocus = (options: IUseAuthFormFocusOptions = {}): IUseAuthFormFocusReturn => {
  const {
    initialFocus = 'email',
    enableKeyboardShortcuts = true,
    focusDelay = 100
  } = options

  // Template refs for inputs
  const emailInputRef = ref<HTMLInputElement>()
  const passwordInputRef = ref<HTMLInputElement>()

  // VueUse focus management
  const { focused: emailFocused } = useFocus(emailInputRef, {
    initialValue: initialFocus === 'email'
  })
  
  const { focused: passwordFocused } = useFocus(passwordInputRef, {
    initialValue: initialFocus === 'password'
  })

  // Focus management functions
  const focusEmail = () => {
    nextTick(() => {
      setTimeout(() => {
        emailInputRef.value?.focus()
      }, focusDelay)
    })
  }

  const focusPassword = () => {
    nextTick(() => {
      setTimeout(() => {
        passwordInputRef.value?.focus()
      }, focusDelay)
    })
  }

  const focusNext = () => {
    if (emailFocused.value) {
      focusPassword()
    } else {
      focusEmail()
    }
  }

  const blur = () => {
    emailInputRef.value?.blur()
    passwordInputRef.value?.blur()
  }

  // Keyboard shortcuts with VueUse
  if (enableKeyboardShortcuts) {
    // Tab to next field (in addition to native tab)
    useEventListener('keydown', (e: KeyboardEvent) => {
      // Enter in email field focuses password
      if (e.key === 'Enter' && emailFocused.value) {
        e.preventDefault()
        focusPassword()
      }
      
      // Escape to blur all fields
      if (e.key === 'Escape') {
        blur()
      }
    })
  }

  // Auto-focus on mount if specified
  onMounted(() => {
    if (initialFocus === 'email') {
      focusEmail()
    } else if (initialFocus === 'password') {
      focusPassword()
    }
  })

  return {
    emailInputRef,
    passwordInputRef,
    emailFocused,
    passwordFocused,
    focusEmail,
    focusPassword,
    focusNext,
    blur,
  }
}
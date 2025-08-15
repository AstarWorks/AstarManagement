/**
 * Auth Form Configuration
 * Simple over Easy: Centralized configuration for all auth forms
 * Following the "Configuration over Convention" principle
 */

import type { ILoginCredentials } from '@auth/types/auth'

export interface IAuthFormConfig {
  /** Form behavior settings */
  form: {
    /** Default initial values for login form */
    defaultValues: ILoginCredentials
    /** Whether to enable auto-focus on mount */
    autoFocus: boolean
    /** Which field receives initial focus */
    initialFocus: 'email' | 'password' | 'none'
    /** Auto-fill credentials in development */
    enableDebugFill: boolean
    /** Delay before focusing fields (ms) */
    focusDelay: number
  }
  
  /** Validation settings */
  validation: {
    /** Minimum password length */
    passwordMinLength: number
    /** Password pattern requirements */
    passwordPattern: RegExp
    /** Whether to validate on input or blur */
    validateOnInput: boolean
    /** Real-time validation debounce delay (ms) */
    validationDebounce: number
  }

  /** UI/UX settings */
  ui: {
    /** Whether to show password toggle button */
    showPasswordToggle: boolean
    /** Whether to enable keyboard shortcuts */
    enableKeyboardShortcuts: boolean
    /** Whether to enable "Remember Me" persistence */
    enableRememberMePersistence: boolean
    /** Animation durations */
    animations: {
      /** Form transition duration (ms) */
      formTransition: number
      /** Button loading animation duration (ms) */
      buttonLoading: number
    }
  }

  /** Security settings */
  security: {
    /** Whether to enable clipboard monitoring */
    enableClipboardSecurity: boolean
    /** Whether to pause validation when tab is hidden */
    enableVisibilityPause: boolean
    /** Whether to detect offline state */
    enableOfflineDetection: boolean
    /** Maximum login attempts before lockout */
    maxLoginAttempts: number
  }

  /** Debug settings (development only) */
  debug: {
    /** Whether to show debug panel in development */
    showDebugPanel: boolean
    /** Whether to show advanced debug options */
    showAdvancedDebug: boolean
    /** Debug credentials for testing */
    credentials: Array<{
      key: string
      labelKey: string
      icon: string
      credentials: ILoginCredentials
    }>
  }

  /** Analytics settings */
  analytics: {
    /** Whether to enable auth event tracking */
    enableTracking: boolean
    /** Events to track */
    events: {
      formSubmit: boolean
      debugCredentialUse: boolean
      keyboardShortcuts: boolean
      passwordToggle: boolean
    }
  }
}

/**
 * Default auth form configuration
 */
export const defaultAuthFormConfig: IAuthFormConfig = {
  form: {
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    autoFocus: true,
    initialFocus: 'email',
    enableDebugFill: true,
    focusDelay: 100,
  },

  validation: {
    passwordMinLength: 8,
    passwordPattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    validateOnInput: false,
    validationDebounce: 300,
  },

  ui: {
    showPasswordToggle: true,
    enableKeyboardShortcuts: true,
    enableRememberMePersistence: true,
    animations: {
      formTransition: 200,
      buttonLoading: 300,
    },
  },

  security: {
    enableClipboardSecurity: false, // Disabled by default for privacy
    enableVisibilityPause: true,
    enableOfflineDetection: true,
    maxLoginAttempts: 5,
  },

  debug: {
    showDebugPanel: true,
    showAdvancedDebug: false,
    credentials: [
      {
        key: 'demo',
        labelKey: 'auth.debug.demoUser',
        icon: 'lucide:user',
        credentials: {
          email: 'lawyer@test.com',
          password: 'password123',
          rememberMe: false
        }
      },
      {
        key: 'twoFactor',
        labelKey: 'auth.debug.twoFactorUser',
        icon: 'lucide:shield-check',
        credentials: {
          email: 'clerk@test.com',
          password: 'password123',
          rememberMe: false
        }
      },
      {
        key: 'admin',
        labelKey: 'auth.debug.adminUser',
        icon: 'lucide:crown',
        credentials: {
          email: 'client@test.com',
          password: 'password123',
          rememberMe: true
        }
      }
    ],
  },

  analytics: {
    enableTracking: false,
    events: {
      formSubmit: true,
      debugCredentialUse: true,
      keyboardShortcuts: false,
      passwordToggle: false,
    },
  },
}

/**
 * Get auth form configuration with environment-specific overrides
 */
export const getAuthFormConfig = (): IAuthFormConfig => {
  const config = { ...defaultAuthFormConfig }

  // Production overrides
  if (process.env.NODE_ENV === 'production') {
    config.debug.showDebugPanel = false
    config.debug.showAdvancedDebug = false
    config.form.enableDebugFill = false
    config.analytics.enableTracking = true
  }

  // Test environment overrides
  if (process.env.NODE_ENV === 'test') {
    config.ui.animations.formTransition = 0
    config.ui.animations.buttonLoading = 0
    config.form.focusDelay = 0
    config.validation.validationDebounce = 0
  }

  return config
}

/**
 * Type-safe config getter for specific sections
 */
export const getAuthFormConfigSection = <K extends keyof IAuthFormConfig>(
  section: K
): IAuthFormConfig[K] => {
  return getAuthFormConfig()[section]
}
import { ref, computed, reactive, watch, type Ref } from 'vue'
import type { z } from 'zod'

/**
 * Form state tracking for complex forms
 */
export interface FormState {
  /** Whether form has been modified */
  isDirty: boolean
  /** Whether form has been touched */
  isTouched: boolean
  /** Whether form is currently being submitted */
  isSubmitting: boolean
  /** Whether form is valid */
  isValid: boolean
  /** Number of submission attempts */
  submitCount: number
  /** Last successful submission timestamp */
  lastSubmit?: Date
  /** Form errors */
  errors: Record<string, string>
  /** Form warnings (non-blocking) */
  warnings: Record<string, string>
}

/**
 * Form state management composable
 * 
 * Provides centralized state management for complex forms with
 * multiple steps, conditional validation, and advanced UX features.
 */
export function useFormState<TSchema extends z.ZodSchema>(
  initialState?: Partial<FormState>
) {
  // Core form state
  const state = reactive<FormState>({
    isDirty: false,
    isTouched: false,
    isSubmitting: false,
    isValid: false,
    submitCount: 0,
    errors: {},
    warnings: {},
    ...initialState
  })

  // Progress tracking for multi-step forms
  const currentStep = ref(0)
  const totalSteps = ref(1)
  const stepProgress = computed(() => {
    if (totalSteps.value === 0) return 0
    return ((currentStep.value + 1) / totalSteps.value) * 100
  })

  // Auto-save functionality
  const autoSaveEnabled = ref(false)
  const autoSaveInterval = ref(30000) // 30 seconds default
  const lastAutoSave = ref<Date>()
  let autoSaveTimer: NodeJS.Timeout | null = null

  /**
   * Start auto-save functionality
   */
  const startAutoSave = (saveCallback: () => Promise<void>) => {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
    }

    autoSaveTimer = setInterval(async () => {
      if (state.isDirty && !state.isSubmitting) {
        try {
          await saveCallback()
          lastAutoSave.value = new Date()
        } catch (error) {
          console.warn('Auto-save failed:', error)
        }
      }
    }, autoSaveInterval.value)

    autoSaveEnabled.value = true
  }

  /**
   * Stop auto-save functionality
   */
  const stopAutoSave = () => {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
      autoSaveTimer = null
    }
    autoSaveEnabled.value = false
  }

  /**
   * Update form state
   */
  const updateState = (updates: Partial<FormState>) => {
    Object.assign(state, updates)
  }

  /**
   * Mark form as dirty
   */
  const markDirty = () => {
    state.isDirty = true
  }

  /**
   * Mark form as pristine
   */
  const markPristine = () => {
    state.isDirty = false
  }

  /**
   * Mark form as touched
   */
  const markTouched = () => {
    state.isTouched = true
  }

  /**
   * Set form validity
   */
  const setValid = (valid: boolean) => {
    state.isValid = valid
  }

  /**
   * Add error to form state
   */
  const addError = (field: string, message: string) => {
    state.errors[field] = message
    state.isValid = false
  }

  /**
   * Remove error from form state
   */
  const removeError = (field: string) => {
    delete state.errors[field]
    if (Object.keys(state.errors).length === 0) {
      state.isValid = true
    }
  }

  /**
   * Clear all errors
   */
  const clearErrors = () => {
    state.errors = {}
    state.isValid = true
  }

  /**
   * Add warning to form state
   */
  const addWarning = (field: string, message: string) => {
    state.warnings[field] = message
  }

  /**
   * Remove warning from form state
   */
  const removeWarning = (field: string) => {
    delete state.warnings[field]
  }

  /**
   * Clear all warnings
   */
  const clearWarnings = () => {
    state.warnings = {}
  }

  /**
   * Start submission
   */
  const startSubmission = () => {
    state.isSubmitting = true
    state.submitCount++
  }

  /**
   * End submission
   */
  const endSubmission = (success: boolean = true) => {
    state.isSubmitting = false
    if (success) {
      state.lastSubmit = new Date()
      markPristine()
    }
  }

  /**
   * Reset form state
   */
  const reset = () => {
    Object.assign(state, {
      isDirty: false,
      isTouched: false,
      isSubmitting: false,
      isValid: false,
      submitCount: 0,
      errors: {},
      warnings: {},
      lastSubmit: undefined
    })
    currentStep.value = 0
    stopAutoSave()
  }

  /**
   * Multi-step form navigation
   */
  const goToStep = (step: number) => {
    if (step >= 0 && step < totalSteps.value) {
      currentStep.value = step
    }
  }

  const nextStep = () => {
    if (currentStep.value < totalSteps.value - 1) {
      currentStep.value++
    }
  }

  const previousStep = () => {
    if (currentStep.value > 0) {
      currentStep.value--
    }
  }

  const setTotalSteps = (total: number) => {
    totalSteps.value = total
  }

  // Computed properties
  const hasErrors = computed(() => Object.keys(state.errors).length > 0)
  const hasWarnings = computed(() => Object.keys(state.warnings).length > 0)
  const errorMessages = computed(() => Object.values(state.errors))
  const warningMessages = computed(() => Object.values(state.warnings))
  const isFirstStep = computed(() => currentStep.value === 0)
  const isLastStep = computed(() => currentStep.value === totalSteps.value - 1)
  const canProceed = computed(() => state.isValid && !state.isSubmitting)

  // Cleanup on unmount
  const cleanup = () => {
    stopAutoSave()
  }

  return {
    // State
    state: readonly(state),
    
    // Progress
    currentStep: readonly(currentStep),
    totalSteps: readonly(totalSteps),
    stepProgress: readonly(stepProgress),
    
    // Auto-save
    autoSaveEnabled: readonly(autoSaveEnabled),
    lastAutoSave: readonly(lastAutoSave),
    startAutoSave,
    stopAutoSave,
    
    // State management
    updateState,
    markDirty,
    markPristine,
    markTouched,
    setValid,
    
    // Error management
    addError,
    removeError,
    clearErrors,
    
    // Warning management
    addWarning,
    removeWarning,
    clearWarnings,
    
    // Submission
    startSubmission,
    endSubmission,
    
    // Navigation
    goToStep,
    nextStep,
    previousStep,
    setTotalSteps,
    
    // Computed
    hasErrors: readonly(hasErrors),
    hasWarnings: readonly(hasWarnings),
    errorMessages: readonly(errorMessages),
    warningMessages: readonly(warningMessages),
    isFirstStep: readonly(isFirstStep),
    isLastStep: readonly(isLastStep),
    canProceed: readonly(canProceed),
    
    // Cleanup
    reset,
    cleanup
  }
}

/**
 * Form persistence utility for draft saving
 */
export function useFormPersistence<TValues extends Record<string, any>>(
  formId: string,
  storage: 'localStorage' | 'sessionStorage' = 'localStorage'
) {
  const storageKey = `form_draft_${formId}`
  
  /**
   * Save form values to storage
   */
  const saveDraft = (values: TValues) => {
    try {
      const draft = {
        values,
        timestamp: Date.now(),
        formId
      }
      
      if (typeof window !== 'undefined') {
        window[storage].setItem(storageKey, JSON.stringify(draft))
      }
    } catch (error) {
      console.warn('Failed to save form draft:', error)
    }
  }

  /**
   * Load form values from storage
   */
  const loadDraft = (): TValues | null => {
    try {
      if (typeof window === 'undefined') return null
      
      const stored = window[storage].getItem(storageKey)
      if (!stored) return null
      
      const draft = JSON.parse(stored)
      
      // Check if draft is not too old (24 hours default)
      const maxAge = 24 * 60 * 60 * 1000
      if (Date.now() - draft.timestamp > maxAge) {
        clearDraft()
        return null
      }
      
      return draft.values
    } catch (error) {
      console.warn('Failed to load form draft:', error)
      return null
    }
  }

  /**
   * Clear saved draft
   */
  const clearDraft = () => {
    try {
      if (typeof window !== 'undefined') {
        window[storage].removeItem(storageKey)
      }
    } catch (error) {
      console.warn('Failed to clear form draft:', error)
    }
  }

  /**
   * Check if draft exists
   */
  const hasDraft = (): boolean => {
    return loadDraft() !== null
  }

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    hasDraft
  }
}
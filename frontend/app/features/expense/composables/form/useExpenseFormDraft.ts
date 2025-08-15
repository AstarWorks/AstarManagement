import { ref, watch, type Ref } from 'vue'
import { debounce } from 'lodash-es'
import type { ExpenseFormData } from '~/schemas/expense'

/**
 * Draft operation result
 */
export interface IDraftOperationResult {
  readonly success: boolean
  readonly error?: string
}

/**
 * Draft storage options
 */
export interface IDraftStorageOptions {
  readonly storageKey?: string
  readonly debounceMs?: number
  readonly excludeFields?: readonly (keyof ExpenseFormData)[]
  readonly enableAutoSave?: boolean
}

/**
 * Draft composable return type
 */
export interface IExpenseFormDraftReturn {
  readonly hasDraft: Ref<boolean>
  readonly draftError: Ref<string | null>
  readonly isDraftLoading: Ref<boolean>
  saveDraft: (data: Partial<ExpenseFormData>) => Promise<IDraftOperationResult>
  loadDraft: () => Promise<Partial<ExpenseFormData> | null>
  clearDraft: () => Promise<IDraftOperationResult>
  restoreDraft: (setFieldValue: (key: keyof ExpenseFormData, value: unknown) => void) => Promise<IDraftOperationResult>
}

/**
 * Type guard to check if localStorage is available
 */
const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = '__localStorage_test__'
    localStorage.setItem(testKey, 'test')
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

/**
 * Sanitize form data for storage (remove undefined/null values)
 */
const sanitizeForStorage = (
  data: Partial<ExpenseFormData>, 
  excludeFields: readonly (keyof ExpenseFormData)[] = []
): Record<string, unknown> => {
  const sanitized: Record<string, unknown> = {}
  
  for (const [key, value] of Object.entries(data)) {
    if (excludeFields.includes(key as keyof ExpenseFormData)) {
      continue
    }
    
    if (value !== undefined && value !== null && value !== '') {
      sanitized[key] = value
    }
  }
  
  return sanitized
}

/**
 * Validate restored draft data
 */
const validateDraftData = (data: unknown): data is Partial<ExpenseFormData> => {
  if (!data || typeof data !== 'object') {
    return false
  }
  
  // Basic validation - at least check if it looks like expense form data
  const obj = data as Record<string, unknown>
  const hasValidFields = ['date', 'category', 'description', 'incomeAmount', 'expenseAmount']
    .some(field => field in obj)
  
  return hasValidFields
}

/**
 * Composable for managing expense form draft functionality with localStorage
 * Provides debounced auto-save, error handling, and data validation
 */
export function useExpenseFormDraft(
  formValues: Ref<Partial<ExpenseFormData>>,
  options: IDraftStorageOptions = {}
): IExpenseFormDraftReturn {
  const {
    storageKey = 'expense-form-draft',
    debounceMs = 1000,
    excludeFields = [],
    enableAutoSave = true
  } = options

  // State
  const hasDraft = ref(false)
  const draftError = ref<string | null>(null)
  const isDraftLoading = ref(false)

  // Check if localStorage is available
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available - draft functionality disabled')
    return {
      hasDraft,
      draftError: ref('localStorage not available'),
      isDraftLoading,
      saveDraft: async () => ({ success: false, error: 'localStorage not available' }),
      loadDraft: async () => null,
      clearDraft: async () => ({ success: false, error: 'localStorage not available' }),
      restoreDraft: async () => ({ success: false, error: 'localStorage not available' })
    }
  }

  // Save draft operation
  const saveDraft = async (data: Partial<ExpenseFormData>): Promise<IDraftOperationResult> => {
    try {
      draftError.value = null
      const sanitizedData = sanitizeForStorage(data, excludeFields)
      
      // Only save if there's meaningful data
      if (Object.keys(sanitizedData).length === 0) {
        return { success: true }
      }
      
      localStorage.setItem(storageKey, JSON.stringify({
        data: sanitizedData,
        timestamp: Date.now(),
        version: '1.0' // For future compatibility
      }))
      
      hasDraft.value = true
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      draftError.value = errorMessage
      console.error('Failed to save expense form draft:', error)
      return { success: false, error: errorMessage }
    }
  }

  // Load draft operation
  const loadDraft = async (): Promise<Partial<ExpenseFormData> | null> => {
    try {
      isDraftLoading.value = true
      draftError.value = null
      
      const storedData = localStorage.getItem(storageKey)
      if (!storedData) {
        hasDraft.value = false
        return null
      }
      
      const parsed = JSON.parse(storedData)
      
      // Handle both old format (direct data) and new format (with metadata)
      const draftData = parsed.data || parsed
      
      if (!validateDraftData(draftData)) {
        console.warn('Invalid draft data found, clearing...')
        await clearDraft()
        return null
      }
      
      hasDraft.value = true
      return draftData as Partial<ExpenseFormData>
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load draft'
      draftError.value = errorMessage
      console.error('Failed to load expense form draft:', error)
      
      // Clear corrupted data
      await clearDraft()
      return null
    } finally {
      isDraftLoading.value = false
    }
  }

  // Clear draft operation
  const clearDraft = async (): Promise<IDraftOperationResult> => {
    try {
      localStorage.removeItem(storageKey)
      hasDraft.value = false
      draftError.value = null
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear draft'
      draftError.value = errorMessage
      return { success: false, error: errorMessage }
    }
  }

  // Restore draft to form
  const restoreDraft = async (
    setFieldValue: (key: keyof ExpenseFormData, value: unknown) => void
  ): Promise<IDraftOperationResult> => {
    try {
      const draftData = await loadDraft()
      
      if (!draftData) {
        return { success: false, error: 'No draft data available' }
      }
      
      // Restore each field value
      Object.entries(draftData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          setFieldValue(key as keyof ExpenseFormData, value)
        }
      })
      
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to restore draft'
      draftError.value = errorMessage
      return { success: false, error: errorMessage }
    }
  }

  // Debounced auto-save function
  const debouncedSaveDraft = debounce((data: Partial<ExpenseFormData>) => {
    saveDraft(data)
  }, debounceMs)

  // Auto-save watcher
  if (enableAutoSave) {
    watch(
      formValues,
      (newValues) => {
        if (newValues && Object.keys(newValues).length > 0) {
          debouncedSaveDraft(newValues)
        }
      },
      { deep: true, immediate: false }
    )
  }

  // Check for existing draft on initialization
  loadDraft().catch(() => {
    // Error handling already done in loadDraft
  })

  return {
    hasDraft,
    draftError,
    isDraftLoading,
    saveDraft,
    loadDraft,
    clearDraft,
    restoreDraft
  }
}
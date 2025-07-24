import { ref, watch, onMounted, onUnmounted } from 'vue'
import { watchDebounced } from '@vueuse/core'
import type { FormInstance } from './useForm'

/**
 * Auto-save configuration options
 */
export interface AutoSaveOptions {
  /** Storage key for saving form data */
  key: string
  /** Debounce delay in milliseconds */
  debounce?: number
  /** Storage type */
  storage?: 'localStorage' | 'sessionStorage'
  /** Custom save function */
  onSave?: (values: any) => Promise<void>
  /** Custom load function */
  onLoad?: () => Promise<any>
  /** Callback when save succeeds */
  onSaveSuccess?: (values: any) => void
  /** Callback when save fails */
  onSaveError?: (error: Error) => void
  /** Whether to save only when form is dirty */
  saveOnlyWhenDirty?: boolean
  /** Maximum age of saved data in milliseconds */
  maxAge?: number
  /** Whether to compress saved data */
  compress?: boolean
  /** Version for data migration */
  version?: string
}

/**
 * Auto-save state interface
 */
export interface AutoSaveState {
  /** Whether auto-save is enabled */
  isEnabled: boolean
  /** Whether currently saving */
  isSaving: boolean
  /** Last save timestamp */
  lastSave?: Date
  /** Last save error */
  lastError?: Error
  /** Whether there's saved data available */
  hasSavedData: boolean
}

/**
 * Auto-save composable for form persistence
 * 
 * Provides automatic saving and loading of form data with configurable
 * storage options, debouncing, and error handling.
 * 
 * @param form - Form instance from useForm
 * @param options - Configuration options
 * @returns Auto-save state and controls
 */
export function useAutoSave<T = any>(
  form: FormInstance<any>,
  options: AutoSaveOptions
) {
  const {
    key,
    debounce = 2000,
    storage = 'localStorage',
    onSave,
    onLoad,
    onSaveSuccess,
    onSaveError,
    saveOnlyWhenDirty = true,
    maxAge = 24 * 60 * 60 * 1000, // 24 hours
    compress = false,
    version = '1.0'
  } = options

  // Auto-save state
  const state = ref<AutoSaveState>({
    isEnabled: false,
    isSaving: false,
    lastSave: undefined,
    lastError: undefined,
    hasSavedData: false
  })

  // Storage utilities
  const getStorage = () => {
    if (typeof window === 'undefined') return null
    return window[storage]
  }

  const getStorageKey = () => `autosave_${key}_v${version}`

  // Data compression (simple base64 encoding)
  const compressData = (data: string): string => {
    if (!compress) return data
    try {
      return btoa(data)
    } catch {
      return data
    }
  }

  const decompressData = (data: string): string => {
    if (!compress) return data
    try {
      return atob(data)
    } catch {
      return data
    }
  }

  // Save form data
  const save = async (values?: any): Promise<boolean> => {
    if (state.value.isSaving) return false

    state.value.isSaving = true
    state.value.lastError = undefined

    try {
      const dataToSave = values || form.values.value

      if (onSave) {
        // Use custom save function
        await onSave(dataToSave)
      } else {
        // Use browser storage
        const storageInstance = getStorage()
        if (!storageInstance) return false

        const saveData = {
          data: dataToSave,
          timestamp: Date.now(),
          version,
          formMeta: {
            isDirty: form.isDirty.value,
            isTouched: form.isTouched.value,
            submitCount: form.submitCount.value
          }
        }

        const serialized = JSON.stringify(saveData)
        const compressed = compressData(serialized)
        
        storageInstance.setItem(getStorageKey(), compressed)
      }

      state.value.lastSave = new Date()
      state.value.hasSavedData = true

      if (onSaveSuccess) {
        onSaveSuccess(dataToSave)
      }

      return true
    } catch (error) {
      const saveError = error instanceof Error ? error : new Error('Save failed')
      state.value.lastError = saveError

      if (onSaveError) {
        onSaveError(saveError)
      }

      console.error('Auto-save failed:', saveError)
      return false
    } finally {
      state.value.isSaving = false
    }
  }

  // Load form data
  const load = async (): Promise<any> => {
    try {
      if (onLoad) {
        // Use custom load function
        return await onLoad()
      } else {
        // Use browser storage
        const storageInstance = getStorage()
        if (!storageInstance) return null

        const stored = storageInstance.getItem(getStorageKey())
        if (!stored) return null

        const decompressed = decompressData(stored)
        const saveData = JSON.parse(decompressed)

        // Check version compatibility
        if (saveData.version !== version) {
          console.warn(`Auto-save version mismatch: expected ${version}, got ${saveData.version}`)
          return null
        }

        // Check data age
        if (maxAge && Date.now() - saveData.timestamp > maxAge) {
          console.warn('Auto-save data is too old, discarding')
          await clear()
          return null
        }

        state.value.hasSavedData = true
        state.value.lastSave = new Date(saveData.timestamp)

        return saveData.data
      }
    } catch (error) {
      console.error('Failed to load auto-save data:', error)
      return null
    }
  }

  // Clear saved data
  const clear = async (): Promise<void> => {
    try {
      const storageInstance = getStorage()
      if (storageInstance) {
        storageInstance.removeItem(getStorageKey())
      }

      state.value.hasSavedData = false
      state.value.lastSave = undefined
      state.value.lastError = undefined
    } catch (error) {
      console.error('Failed to clear auto-save data:', error)
    }
  }

  // Check if saved data exists
  const checkSavedData = (): boolean => {
    try {
      const storageInstance = getStorage()
      if (!storageInstance) return false

      const stored = storageInstance.getItem(getStorageKey())
      const exists = !!stored

      state.value.hasSavedData = exists
      return exists
    } catch {
      return false
    }
  }

  // Restore form from saved data
  const restore = async (): Promise<boolean> => {
    try {
      const savedData = await load()
      if (!savedData) return false

      form.setValues(savedData)
      return true
    } catch (error) {
      console.error('Failed to restore form data:', error)
      return false
    }
  }

  // Enable auto-save
  const enable = () => {
    if (state.value.isEnabled) return

    state.value.isEnabled = true

    // Watch form values and auto-save
    watchDebounced(
      () => form.values.value,
      async (newValues) => {
        if (!state.value.isEnabled) return
        
        // Only save if form is dirty (unless disabled)
        if (saveOnlyWhenDirty && !form.isDirty.value) return

        await save(newValues)
      },
      { debounce, deep: true }
    )
  }

  // Disable auto-save
  const disable = () => {
    state.value.isEnabled = false
  }

  // Initialize on mount
  onMounted(async () => {
    checkSavedData()
    
    // Auto-enable if there's existing data or if explicitly enabled
    if (state.value.hasSavedData) {
      enable()
    }
  })

  // Cleanup on unmount
  onUnmounted(() => {
    disable()
  })

  // Clean up on successful form submission
  watch(
    () => form.submitCount.value,
    (newCount, oldCount) => {
      if (newCount > oldCount) {
        // Form was submitted successfully, clear auto-save
        clear()
      }
    }
  )

  return {
    // State
    state: readonly(state),
    
    // Actions
    save,
    load,
    clear,
    restore,
    enable,
    disable,
    
    // Utilities
    checkSavedData,
    getStorageKey,
    
    // Computed shortcuts
    isEnabled: readonly(computed(() => state.value.isEnabled)),
    isSaving: readonly(computed(() => state.value.isSaving)),
    lastSave: readonly(computed(() => state.value.lastSave)),
    lastError: readonly(computed(() => state.value.lastError)),
    hasSavedData: readonly(computed(() => state.value.hasSavedData))
  }
}

/**
 * Type for the return value of useAutoSave
 */
export type AutoSaveInstance = ReturnType<typeof useAutoSave>
import { useEffect, useCallback, useRef, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { debounce } from 'lodash-es'

/**
 * Configuration options for auto-save functionality
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
  /** Fields to exclude from auto-save */
  exclude?: string[]
  /** Whether auto-save is enabled */
  enabled?: boolean
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
 * Enhanced auto-save hook for form persistence
 * 
 * Provides automatic saving and loading of form data with configurable
 * storage options, debouncing, error handling, and data compression.
 * 
 * @param form - React Hook Form instance
 * @param options - Configuration options
 * @returns Auto-save state and controls
 */
export function useAutoSave<T extends Record<string, any>>(
  form: UseFormReturn<T>,
  options: AutoSaveOptions
) {
  const {
    key,
    debounce: debounceMs = 2000,
    storage = 'localStorage',
    onSave,
    onLoad,
    onSaveSuccess,
    onSaveError,
    saveOnlyWhenDirty = true,
    maxAge = 24 * 60 * 60 * 1000, // 24 hours
    compress = false,
    version = '1.0',
    exclude = [],
    enabled = true
  } = options

  // Internal state
  const [state, setState] = useState<AutoSaveState>({
    isEnabled: false,
    isSaving: false,
    lastSave: undefined,
    lastError: undefined,
    hasSavedData: false
  })

  const isRestoring = useRef(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()

  // Storage utilities
  const getStorage = useCallback(() => {
    if (typeof window === 'undefined') return null
    return window[storage]
  }, [storage])

  const getStorageKey = useCallback(() => `autosave_${key}_v${version}`, [key, version])

  // Data compression utilities
  const compressData = useCallback((data: string): string => {
    if (!compress) return data
    try {
      return btoa(data)
    } catch {
      return data
    }
  }, [compress])

  const decompressData = useCallback((data: string): string => {
    if (!compress) return data
    try {
      return atob(data)
    } catch {
      return data
    }
  }, [compress])

  // Filter out excluded fields
  const filterData = useCallback((data: any) => {
    if (!exclude.length) return data
    
    const filtered = { ...data }
    exclude.forEach(field => {
      delete filtered[field]
    })
    return filtered
  }, [exclude])

  // Save form data
  const save = useCallback(async (values?: any): Promise<boolean> => {
    if (!enabled || state.isSaving) return false

    setState(prev => ({ ...prev, isSaving: true, lastError: undefined }))

    try {
      const dataToSave = filterData(values || form.getValues())

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
            isDirty: form.formState.isDirty,
            submitCount: form.formState.submitCount,
            touchedFields: Object.keys(form.formState.touchedFields)
          }
        }

        const serialized = JSON.stringify(saveData)
        const compressed = compressData(serialized)
        
        storageInstance.setItem(getStorageKey(), compressed)
      }

      const now = new Date()
      setState(prev => ({
        ...prev,
        lastSave: now,
        hasSavedData: true,
        isSaving: false
      }))

      if (onSaveSuccess) {
        onSaveSuccess(dataToSave)
      }

      return true
    } catch (error) {
      const saveError = error instanceof Error ? error : new Error('Save failed')
      
      setState(prev => ({
        ...prev,
        lastError: saveError,
        isSaving: false
      }))

      if (onSaveError) {
        onSaveError(saveError)
      }

      console.error('Auto-save failed:', saveError)
      return false
    }
  }, [enabled, state.isSaving, form, onSave, onSaveSuccess, onSaveError, getStorage, getStorageKey, compressData, filterData, version])

  // Debounced save function
  const debouncedSave = useCallback(
    debounce((values: T) => {
      if (!enabled || isRestoring.current) return
      
      // Only save if form is dirty (unless disabled)
      if (saveOnlyWhenDirty && !form.formState.isDirty) return

      save(values)
    }, debounceMs),
    [enabled, save, saveOnlyWhenDirty, form, debounceMs]
  )

  // Load form data
  const load = useCallback(async (): Promise<any> => {
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

        setState(prev => ({
          ...prev,
          hasSavedData: true,
          lastSave: new Date(saveData.timestamp)
        }))

        return saveData.data
      }
    } catch (error) {
      console.error('Failed to load auto-save data:', error)
      return null
    }
  }, [onLoad, getStorage, getStorageKey, decompressData, version, maxAge])

  // Clear saved data
  const clear = useCallback(async (): Promise<void> => {
    try {
      const storageInstance = getStorage()
      if (storageInstance) {
        storageInstance.removeItem(getStorageKey())
      }

      setState(prev => ({
        ...prev,
        hasSavedData: false,
        lastSave: undefined,
        lastError: undefined
      }))
    } catch (error) {
      console.error('Failed to clear auto-save data:', error)
    }
  }, [getStorage, getStorageKey])

  // Check if saved data exists
  const checkSavedData = useCallback((): boolean => {
    try {
      const storageInstance = getStorage()
      if (!storageInstance) return false

      const stored = storageInstance.getItem(getStorageKey())
      const exists = !!stored

      setState(prev => ({ ...prev, hasSavedData: exists }))
      return exists
    } catch {
      return false
    }
  }, [getStorage, getStorageKey])

  // Restore form from saved data
  const restore = useCallback(async (): Promise<boolean> => {
    try {
      const savedData = await load()
      if (!savedData) return false

      isRestoring.current = true
      form.reset(savedData)
      
      // Dispatch custom event for notifications
      const event = new CustomEvent('formDraftRestored', { 
        detail: { key, data: savedData } 
      })
      window.dispatchEvent(event)
      
      setTimeout(() => {
        isRestoring.current = false
      }, 100)

      return true
    } catch (error) {
      console.error('Failed to restore form data:', error)
      return false
    }
  }, [load, form, key])

  // Enable auto-save
  const enable = useCallback(() => {
    setState(prev => ({ ...prev, isEnabled: true }))
  }, [])

  // Disable auto-save
  const disable = useCallback(() => {
    setState(prev => ({ ...prev, isEnabled: false }))
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    debouncedSave.cancel()
  }, [debouncedSave])

  // Initialize on mount
  useEffect(() => {
    if (!enabled) return

    checkSavedData()
    
    // Auto-enable and restore if there's existing data
    if (state.hasSavedData) {
      enable()
      restore()
    } else {
      enable()
    }

    return () => {
      disable()
    }
  }, [enabled]) // Only run on mount and when enabled changes

  // Watch form changes for auto-save
  useEffect(() => {
    if (!enabled || !state.isEnabled) return

    const subscription = form.watch((values) => {
      debouncedSave(values as T)
    })

    return () => {
      subscription.unsubscribe()
      debouncedSave.cancel()
    }
  }, [form, debouncedSave, enabled, state.isEnabled])

  // Clean up on successful form submission
  useEffect(() => {
    const submitCount = form.formState.submitCount
    
    if (submitCount > 0 && form.formState.isSubmitSuccessful) {
      // Form was submitted successfully, clear auto-save
      clear()
    }
  }, [form.formState.submitCount, form.formState.isSubmitSuccessful, clear])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disable()
    }
  }, [disable])

  return {
    // State
    state,
    
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
    
    // Convenience getters
    isEnabled: state.isEnabled,
    isSaving: state.isSaving,
    lastSave: state.lastSave,
    lastError: state.lastError,
    hasSavedData: state.hasSavedData,
    
    // Cleanup
    cleanup: disable
  }
}

/**
 * Type for the return value of useAutoSave
 */
export type AutoSaveInstance = ReturnType<typeof useAutoSave>

/**
 * Simplified auto-save hook with common defaults
 */
export function useSimpleAutoSave<T extends Record<string, any>>(
  form: UseFormReturn<T>,
  key: string,
  options?: Partial<AutoSaveOptions>
) {
  return useAutoSave(form, {
    key,
    debounce: 1000,
    saveOnlyWhenDirty: true,
    enabled: true,
    ...options
  })
}
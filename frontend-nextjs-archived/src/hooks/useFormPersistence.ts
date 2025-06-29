import { useEffect, useCallback, useRef, useMemo } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { debounce } from 'lodash-es'

interface UseFormPersistenceOptions {
  key: string
  exclude?: string[]
  debounceMs?: number
  enabled?: boolean
}

export function useFormPersistence<T extends Record<string, any>>(
  form: UseFormReturn<T>,
  options: UseFormPersistenceOptions
) {
  const { key, exclude = [], debounceMs = 1000, enabled = true } = options
  const isRestoring = useRef(false)

  // Load persisted data on mount
  useEffect(() => {
    if (!enabled) return

    try {
      const persistedData = localStorage.getItem(key)
      if (persistedData) {
        isRestoring.current = true
        const parsed = JSON.parse(persistedData)
        
        // Check if data has expired
        if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
          localStorage.removeItem(key)
          return
        }
        
        const data = parsed.data || parsed // Support old format
        
        // Filter out excluded fields
        const filteredData = Object.keys(data).reduce((acc, field) => {
          if (!exclude.includes(field)) {
            acc[field as keyof T] = data[field]
          }
          return acc
        }, {} as Partial<T>)

        // Reset form with persisted data
        form.reset(filteredData as T)
        
        // Show notification that draft was restored
        const event = new CustomEvent('formDraftRestored', { 
          detail: { key, data: filteredData } 
        })
        window.dispatchEvent(event)
        
        setTimeout(() => {
          isRestoring.current = false
        }, 100)
      }
    } catch (error) {
      console.error('Failed to restore form data:', error)
      localStorage.removeItem(key)
    }
  }, [key, enabled])

  // Save form data on changes
  const saveFormData = useMemo(
    () => debounce((values: T) => {
      if (!enabled || isRestoring.current) return

      try {
        // Filter out excluded fields
        const filteredData = Object.keys(values).reduce((acc, field) => {
          if (!exclude.includes(field)) {
            acc[field] = values[field as keyof T]
          }
          return acc
        }, {} as Record<string, any>)

        const dataToStore = {
          data: filteredData,
          timestamp: Date.now(),
          expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        }

        localStorage.setItem(key, JSON.stringify(dataToStore))
      } catch (error) {
        console.error('Failed to persist form data:', error)
      }
    }, debounceMs),
    [key, exclude, enabled, debounceMs]
  )

  // Watch form changes
  useEffect(() => {
    if (!enabled) return

    const subscription = form.watch((values) => {
      saveFormData(values as T)
    })

    return () => {
      subscription.unsubscribe()
      saveFormData.cancel()
    }
  }, [form, saveFormData, enabled])

  // Clear persisted data
  const clearPersistedData = useCallback(() => {
    localStorage.removeItem(key)
  }, [key])

  // Check if draft exists
  const hasDraft = useCallback(() => {
    return !!localStorage.getItem(key)
  }, [key])

  return {
    clearPersistedData,
    hasDraft,
    isRestoring: isRestoring.current
  }
}
/**
 * Memo Auto-save Composable
 * Provides automatic saving with conflict resolution and draft management
 */

import { ref, readonly, watch, onMounted, onUnmounted, computed } from 'vue'
import { debounce } from 'lodash-es'
import type { UploadedFile } from './useFileUpload'

export interface MemoContent {
  html: string
  attachments: UploadedFile[]
  recipients: string[]
  subject: string
  templateId?: string
  priority: 'low' | 'medium' | 'high'
  isConfidential: boolean
  tags: string[]
}

export interface MemoAutoSaveOptions {
  /** Matter ID for draft storage */
  matterId: string
  /** Auto-save interval in milliseconds */
  interval?: number
  /** Save callback function */
  onSave?: (content: MemoContent) => Promise<void>
  /** Success callback */
  onSaveSuccess?: () => void
  /** Error callback */
  onSaveError?: (error: Error) => void
  /** Conflict resolution callback */
  onConflict?: (localDraft: MemoContent, serverVersion: MemoContent) => Promise<MemoContent>
  /** Enable local storage backup */
  enableLocalBackup?: boolean
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'conflict'

export function useMemoAutoSave(options: MemoAutoSaveOptions) {
  const { 
    matterId, 
    interval = 30000, // 30 seconds
    enableLocalBackup = true 
  } = options
  
  const draftKey = `memo-draft-${matterId}`
  const metaKey = `memo-meta-${matterId}`
  
  // State
  const content = ref<MemoContent>({
    html: '',
    attachments: [],
    recipients: [],
    subject: '',
    priority: 'medium',
    isConfidential: false,
    tags: [],
  })

  const saveStatus = ref<SaveStatus>('idle')
  const lastSaved = ref<Date | null>(null)
  const hasUnsavedChanges = ref(false)
  const saveError = ref<string | null>(null)
  const isOnline = ref(navigator.onLine)

  // Computed
  const canSave = computed(() => 
    hasUnsavedChanges.value && 
    saveStatus.value !== 'saving' &&
    isOnline.value
  )

  const saveStatusText = computed(() => {
    switch (saveStatus.value) {
      case 'idle':
        return hasUnsavedChanges.value ? 'Unsaved changes' : 'No changes'
      case 'saving':
        return 'Saving...'
      case 'saved':
        return lastSaved.value 
          ? `Saved at ${lastSaved.value.toLocaleTimeString()}`
          : 'Saved'
      case 'error':
        return saveError.value || 'Save failed'
      case 'conflict':
        return 'Conflict detected'
      default:
        return 'Unknown status'
    }
  })

  // Local storage operations
  const saveDraftLocally = () => {
    if (!enableLocalBackup) return
    
    try {
      const draftData = {
        content: content.value,
        timestamp: new Date().toISOString(),
        version: Date.now()
      }
      
      localStorage.setItem(draftKey, JSON.stringify(draftData))
      localStorage.setItem(metaKey, JSON.stringify({
        lastSaved: lastSaved.value?.toISOString(),
        hasUnsavedChanges: hasUnsavedChanges.value,
        matterId
      }))
    } catch (error) {
      console.error('Failed to save draft locally:', error)
    }
  }

  const loadDraftLocally = (): boolean => {
    if (!enableLocalBackup) return false
    
    try {
      const draftData = localStorage.getItem(draftKey)
      const metaData = localStorage.getItem(metaKey)
      
      if (draftData) {
        const parsed = JSON.parse(draftData)
        content.value = { ...content.value, ...parsed.content }
        
        if (metaData) {
          const meta = JSON.parse(metaData)
          if (meta.lastSaved) {
            lastSaved.value = new Date(meta.lastSaved)
          }
          hasUnsavedChanges.value = meta.hasUnsavedChanges || false
        }
        
        return true
      }
    } catch (error) {
      console.error('Failed to load draft locally:', error)
    }
    
    return false
  }

  const clearLocalDraft = () => {
    if (!enableLocalBackup) return
    
    try {
      localStorage.removeItem(draftKey)
      localStorage.removeItem(metaKey)
    } catch (error) {
      console.error('Failed to clear local draft:', error)
    }
  }

  // Save operations
  const save = async (force = false, attempt = 1): Promise<boolean> => {
    if (!force && (saveStatus.value === 'saving' || !hasUnsavedChanges.value)) {
      return false
    }

    saveStatus.value = 'saving'
    saveError.value = null
    hasUnsavedChanges.value = false

    try {
      await options.onSave?.(content.value)
      
      saveStatus.value = 'saved'
      lastSaved.value = new Date()
      options.onSaveSuccess?.()
      
      // Clear local draft after successful save
      clearLocalDraft()
      
      return true
    } catch (error) {
      saveStatus.value = 'error'
      saveError.value = error instanceof Error ? error.message : 'Save failed'
      hasUnsavedChanges.value = true
      
      options.onSaveError?.(error as Error)
      
      // Keep local draft on error
      saveDraftLocally()
      
      // Retry with exponential backoff (max 3 attempts)
      if (attempt < 3 && isOnline.value) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
        setTimeout(() => save(force, attempt + 1), delay)
      }
      
      return false
    }
  }

  // Manual save trigger
  const saveNow = () => save(true)

  // Debounced auto-save
  const debouncedSave = debounce(() => {
    if (canSave.value) {
      save()
    }
  }, interval)

  // Recovery operations
  const recoverFromCrash = (): boolean => {
    return loadDraftLocally()
  }

  const getLocalDraftInfo = () => {
    if (!enableLocalBackup) return null
    
    try {
      const draftData = localStorage.getItem(draftKey)
      const metaData = localStorage.getItem(metaKey)
      
      if (draftData && metaData) {
        const draft = JSON.parse(draftData)
        const meta = JSON.parse(metaData)
        
        return {
          hasLocalDraft: true,
          timestamp: new Date(draft.timestamp),
          matterId: meta.matterId,
          hasUnsavedChanges: meta.hasUnsavedChanges
        }
      }
    } catch (error) {
      console.error('Failed to get local draft info:', error)
    }
    
    return { hasLocalDraft: false }
  }

  // Conflict resolution
  const resolveConflict = async (serverVersion: MemoContent) => {
    saveStatus.value = 'conflict'
    
    try {
      if (options.onConflict) {
        const resolved = await options.onConflict(content.value, serverVersion)
        content.value = resolved
        return await save(true)
      } else {
        // Default: use server version
        content.value = serverVersion
        hasUnsavedChanges.value = false
        saveStatus.value = 'saved'
        return true
      }
    } catch (error) {
      saveStatus.value = 'error'
      saveError.value = 'Conflict resolution failed'
      return false
    }
  }

  // Network status monitoring
  const handleOnline = () => {
    isOnline.value = true
    if (hasUnsavedChanges.value) {
      debouncedSave()
    }
  }

  const handleOffline = () => {
    isOnline.value = false
    saveStatus.value = 'error'
    saveError.value = 'Offline - changes saved locally'
    saveDraftLocally()
  }

  // Content modification helpers
  const updateContent = (updates: Partial<MemoContent>) => {
    content.value = { ...content.value, ...updates }
  }

  const setHtml = (html: string) => {
    content.value.html = html
  }

  const setSubject = (subject: string) => {
    content.value.subject = subject
  }

  const addAttachment = (file: UploadedFile) => {
    if (!content.value.attachments.find(f => f.id === file.id)) {
      content.value.attachments.push(file)
    }
  }

  const removeAttachment = (fileId: string) => {
    content.value.attachments = content.value.attachments.filter(f => f.id !== fileId)
  }

  // Watchers
  watch(content, () => {
    hasUnsavedChanges.value = true
    saveDraftLocally()
    debouncedSave()
  }, { deep: true })

  // Lifecycle hooks
  onMounted(() => {
    // Load draft on mount
    loadDraftLocally()
    
    // Set up network listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Update online status
    isOnline.value = navigator.onLine
  })

  onUnmounted(() => {
    // Cancel pending saves
    debouncedSave.cancel()
    
    // Save final state locally
    if (hasUnsavedChanges.value) {
      saveDraftLocally()
    }
    
    // Clean up listeners
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })

  return {
    // State
    content,
    saveStatus: readonly(saveStatus),
    lastSaved: readonly(lastSaved),
    hasUnsavedChanges: readonly(hasUnsavedChanges),
    saveError: readonly(saveError),
    isOnline: readonly(isOnline),
    
    // Computed
    canSave,
    saveStatusText,
    
    // Actions
    saveNow,
    updateContent,
    setHtml,
    setSubject,
    addAttachment,
    removeAttachment,
    
    // Recovery
    recoverFromCrash,
    getLocalDraftInfo,
    clearLocalDraft,
    
    // Conflict resolution
    resolveConflict,
  }
}
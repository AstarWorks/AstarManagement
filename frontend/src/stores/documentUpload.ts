import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  UploadItem, 
  UploadStatus, 
  UploadMetadata, 
  UploadQueueStats,
  DocumentUploadOptions 
} from '~/types/document'
import { generateId } from '~/utils/helpers'

export const useDocumentUploadStore = defineStore('documentUpload', () => {
  // State
  const queue = ref<UploadItem[]>([])
  const activeUploads = ref<Map<string, AbortController>>(new Map())
  const options = ref<DocumentUploadOptions>({
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxConcurrentUploads: 3,
    acceptedFileTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'text/plain'
    ],
    autoRetry: true,
    maxRetries: 3
  })
  
  // Computed
  const stats = computed<UploadQueueStats>(() => {
    const statuses = queue.value.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1
      return acc
    }, {} as Record<UploadStatus, number>)
    
    return {
      total: queue.value.length,
      pending: statuses.pending || 0,
      uploading: statuses.uploading || 0,
      completed: statuses.completed || 0,
      failed: statuses.failed || 0,
      cancelled: statuses.cancelled || 0,
      paused: statuses.paused || 0
    }
  })
  
  const hasActiveUploads = computed(() => stats.value.uploading > 0)
  const hasPendingUploads = computed(() => stats.value.pending > 0)
  const hasFailedUploads = computed(() => stats.value.failed > 0)
  
  const completedUploads = computed(() => 
    queue.value.filter(item => item.status === 'completed')
  )
  
  const activeQueue = computed(() =>
    queue.value.filter(item => 
      ['pending', 'uploading', 'paused', 'failed'].includes(item.status)
    )
  )
  
  // Actions
  const addToQueue = (files: File[], defaultMetadata?: Partial<UploadMetadata>) => {
    const items: UploadItem[] = files.map(file => ({
      id: generateId(),
      file,
      status: 'pending' as UploadStatus,
      progress: 0,
      speed: 0,
      timeRemaining: null,
      error: null,
      metadata: {
        title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
        description: '',
        category: 'other',
        tags: [],
        confidential: false,
        ...defaultMetadata
      },
      retryCount: 0
    }))
    
    queue.value.push(...items)
    
    // Persist queue to localStorage
    persistQueue()
    
    // Start processing queue
    processQueue()
    
    return items.map(item => item.id)
  }
  
  const removeFromQueue = (id: string) => {
    const index = queue.value.findIndex(item => item.id === id)
    if (index === -1) return
    
    const item = queue.value[index]
    
    // Cancel if uploading
    if (item.status === 'uploading') {
      cancelUpload(id)
    }
    
    // Remove from queue
    queue.value.splice(index, 1)
    persistQueue()
  }
  
  const clearCompleted = () => {
    queue.value = queue.value.filter(item => item.status !== 'completed')
    persistQueue()
  }
  
  const clearAll = () => {
    // Cancel all active uploads
    activeUploads.value.forEach((controller, id) => {
      controller.abort()
    })
    activeUploads.value.clear()
    
    // Clear queue
    queue.value = []
    persistQueue()
  }
  
  const pauseUpload = (id: string) => {
    const item = queue.value.find(item => item.id === id)
    if (!item || item.status !== 'uploading') return
    
    // Cancel the upload
    const controller = activeUploads.value.get(id)
    if (controller) {
      controller.abort()
      activeUploads.value.delete(id)
    }
    
    // Update status
    item.status = 'paused'
    item.pausedAt = Date.now()
    persistQueue()
  }
  
  const resumeUpload = (id: string) => {
    const item = queue.value.find(item => item.id === id)
    if (!item || item.status !== 'paused') return
    
    // Reset to pending and process
    item.status = 'pending'
    item.pausedAt = undefined
    persistQueue()
    processQueue()
  }
  
  const retryUpload = (id: string) => {
    const item = queue.value.find(item => item.id === id)
    if (!item || item.status !== 'failed') return
    
    // Reset status and error
    item.status = 'pending'
    item.error = null
    item.progress = 0
    persistQueue()
    processQueue()
  }
  
  const cancelUpload = (id: string) => {
    const item = queue.value.find(item => item.id === id)
    if (!item) return
    
    // Cancel if uploading
    if (item.status === 'uploading') {
      const controller = activeUploads.value.get(id)
      if (controller) {
        controller.abort()
        activeUploads.value.delete(id)
      }
    }
    
    // Update status
    item.status = 'cancelled'
    persistQueue()
  }
  
  const updateMetadata = (id: string, metadata: Partial<UploadMetadata>) => {
    const item = queue.value.find(item => item.id === id)
    if (!item) return
    
    item.metadata = { ...item.metadata, ...metadata }
    persistQueue()
  }
  
  const reorderQueue = (fromIndex: number, toIndex: number) => {
    const [movedItem] = queue.value.splice(fromIndex, 1)
    queue.value.splice(toIndex, 0, movedItem)
    persistQueue()
  }
  
  const processQueue = async () => {
    const pending = queue.value.filter(item => item.status === 'pending')
    const uploading = queue.value.filter(item => item.status === 'uploading')
    
    const slotsAvailable = options.value.maxConcurrentUploads - uploading.length
    const toUpload = pending.slice(0, slotsAvailable)
    
    for (const item of toUpload) {
      uploadFile(item)
    }
  }
  
  const uploadFile = async (item: UploadItem) => {
    // Mark as uploading
    item.status = 'uploading'
    item.startTime = Date.now()
    
    const formData = new FormData()
    formData.append('file', item.file)
    formData.append('metadata', JSON.stringify(item.metadata))
    
    const controller = new AbortController()
    activeUploads.value.set(item.id, controller)
    
    try {
      const startTime = Date.now()
      let lastLoaded = 0
      let lastTime = startTime
      
      // Note: $fetch doesn't support upload progress tracking or cancellation
      // In a real implementation, you would use axios or a similar library
      // For now, we'll simulate progress
      const uploadSimulation = setInterval(() => {
        if (item.progress < 90) {
          item.progress += Math.random() * 20
          item.speed = Math.random() * 1024 * 1024 // Random speed between 0-1MB/s
          const remainingPercent = 100 - item.progress
          item.timeRemaining = remainingPercent / 10 // Rough estimate
        }
      }, 500)
      
      const response = await $fetch<{ id: string }>('/api/documents/upload', {
        method: 'POST',
        body: formData
      })
      
      clearInterval(uploadSimulation)
      
      // Upload completed
      item.status = 'completed'
      item.documentId = response.id
      item.progress = 100
      item.speed = 0
      item.timeRemaining = null
      
      // Process next in queue
      processQueue()
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Don't change status if cancelled/paused - already handled
        if (item.status === 'uploading') {
          item.status = 'cancelled'
        }
      } else {
        // Upload failed
        item.status = 'failed'
        item.error = error instanceof Error ? error.message : 'Upload failed'
        
        // Auto-retry if enabled
        if (options.value.autoRetry && item.retryCount < options.value.maxRetries) {
          item.retryCount++
          
          // Exponential backoff
          const retryDelay = Math.pow(2, item.retryCount) * 1000
          
          setTimeout(() => {
            if (item.status === 'failed') {
              retryUpload(item.id)
            }
          }, retryDelay)
        }
      }
    } finally {
      activeUploads.value.delete(item.id)
      persistQueue()
    }
  }
  
  const persistQueue = () => {
    // Save queue to localStorage for persistence
    if (typeof window !== 'undefined') {
      const queueData = queue.value.map(item => ({
        ...item,
        file: {
          name: item.file.name,
          size: item.file.size,
          type: item.file.type,
          lastModified: item.file.lastModified
        }
      }))
      
      localStorage.setItem('document-upload-queue', JSON.stringify(queueData))
    }
  }
  
  const restoreQueue = () => {
    // Restore queue from localStorage
    if (typeof window !== 'undefined') {
      const savedQueue = localStorage.getItem('document-upload-queue')
      if (savedQueue) {
        try {
          const queueData = JSON.parse(savedQueue)
          // Note: We can't restore actual File objects from localStorage
          // This would need to be handled differently in a real app
          console.log('Found saved queue with', queueData.length, 'items')
        } catch (error) {
          console.error('Failed to restore upload queue:', error)
        }
      }
    }
  }
  
  // Initialize
  restoreQueue()
  
  return {
    // State
    queue: readonly(queue),
    options: readonly(options),
    stats: readonly(stats),
    
    // Computed
    hasActiveUploads: readonly(hasActiveUploads),
    hasPendingUploads: readonly(hasPendingUploads),
    hasFailedUploads: readonly(hasFailedUploads),
    completedUploads: readonly(completedUploads),
    activeQueue: readonly(activeQueue),
    
    // Actions
    addToQueue,
    removeFromQueue,
    clearCompleted,
    clearAll,
    pauseUpload,
    resumeUpload,
    retryUpload,
    cancelUpload,
    updateMetadata,
    reorderQueue,
    processQueue
  }
})
import { ref, computed, readonly } from 'vue'
import { useWebSocketConnection } from './useWebSocketConnection'
import { useAccessibility } from './useAccessibility'

interface UploadProgress {
  fileId: string
  fileName: string
  progress: number
  speed: number
  timeRemaining?: number
  status: 'uploading' | 'paused' | 'completed' | 'failed' | 'cancelled'
  error?: string
}

interface GlobalUploadStats {
  totalFiles: number
  completedFiles: number
  totalBytes: number
  uploadedBytes: number
  averageSpeed: number
  estimatedTimeRemaining: number
}

interface UploadProgressEvent {
  fileId: string
  fileName: string
  progress: number
  speed: number
  timeRemaining?: number
  status: 'uploading' | 'paused' | 'completed' | 'failed' | 'cancelled'
  uploadedBytes: number
  totalBytes: number
}

interface UploadCompleteEvent {
  fileId: string
  fileName: string
  documentId: string
  success: boolean
  error?: string
}

interface UploadErrorEvent {
  fileId: string
  fileName: string
  error: string
  retryable: boolean
}

/**
 * Composable for real-time upload progress tracking
 * Integrates with WebSocket for live progress updates
 */
export function useUploadProgress() {
  const { announceUploadProgress, announceToScreenReader } = useAccessibility()

  // State
  const uploadProgress = ref<Map<string, UploadProgress>>(new Map())
  const globalStats = ref<GlobalUploadStats>({
    totalFiles: 0,
    completedFiles: 0,
    totalBytes: 0,
    uploadedBytes: 0,
    averageSpeed: 0,
    estimatedTimeRemaining: 0
  })

  // WebSocket connection for real-time updates
  const { send, on, isConnected } = useWebSocketConnection({
    url: '/ws/upload-progress',
    reconnect: true,
    heartbeatInterval: 30000
  })

  // Computed properties
  const activeUploads = computed(() => 
    Array.from(uploadProgress.value.values()).filter(p => 
      ['uploading', 'paused'].includes(p.status)
    )
  )

  const completedUploads = computed(() =>
    Array.from(uploadProgress.value.values()).filter(p => 
      p.status === 'completed'
    )
  )

  const failedUploads = computed(() =>
    Array.from(uploadProgress.value.values()).filter(p => 
      p.status === 'failed'
    )
  )

  const hasActiveUploads = computed(() => activeUploads.value.length > 0)
  const hasFailedUploads = computed(() => failedUploads.value.length > 0)

  const overallProgress = computed(() => {
    if (globalStats.value.totalFiles === 0) return 0
    return Math.round((globalStats.value.completedFiles / globalStats.value.totalFiles) * 100)
  })

  // Methods
  const startTracking = (fileId: string, fileName: string, fileSize: number) => {
    uploadProgress.value.set(fileId, {
      fileId,
      fileName,
      progress: 0,
      speed: 0,
      timeRemaining: undefined,
      status: 'uploading'
    })

    // Update global stats
    globalStats.value.totalFiles++
    globalStats.value.totalBytes += fileSize

    // Send start tracking message via WebSocket
    if (isConnected.value) {
      send({
        type: 'start-tracking',
        fileId,
        fileName,
        fileSize
      })
    }

    announceUploadProgress(fileName, 0)
  }

  const pauseUpload = (fileId: string) => {
    const progress = uploadProgress.value.get(fileId)
    if (!progress) return

    progress.status = 'paused'
    uploadProgress.value.set(fileId, progress)

    if (isConnected.value) {
      send({
        type: 'pause',
        fileId
      })
    }

    announceToScreenReader(`Paused upload of ${progress.fileName}`)
  }

  const resumeUpload = (fileId: string) => {
    const progress = uploadProgress.value.get(fileId)
    if (!progress) return

    progress.status = 'uploading'
    uploadProgress.value.set(fileId, progress)

    if (isConnected.value) {
      send({
        type: 'resume',
        fileId
      })
    }

    announceToScreenReader(`Resumed upload of ${progress.fileName}`)
  }

  const cancelUpload = (fileId: string) => {
    const progress = uploadProgress.value.get(fileId)
    if (!progress) return

    progress.status = 'cancelled'
    uploadProgress.value.set(fileId, progress)

    if (isConnected.value) {
      send({
        type: 'cancel',
        fileId
      })
    }

    announceToScreenReader(`Cancelled upload of ${progress.fileName}`)
  }

  const retryUpload = (fileId: string) => {
    const progress = uploadProgress.value.get(fileId)
    if (!progress) return

    progress.status = 'uploading'
    progress.progress = 0
    progress.error = undefined
    uploadProgress.value.set(fileId, progress)

    if (isConnected.value) {
      send({
        type: 'retry',
        fileId
      })
    }

    announceToScreenReader(`Retrying upload of ${progress.fileName}`)
  }

  const clearCompleted = () => {
    const completedCount = completedUploads.value.length
    
    for (const upload of completedUploads.value) {
      uploadProgress.value.delete(upload.fileId)
    }

    // Update global stats
    globalStats.value.completedFiles -= completedCount
    globalStats.value.totalFiles -= completedCount

    announceToScreenReader(`Cleared ${completedCount} completed upload${completedCount !== 1 ? 's' : ''}`)
  }

  const clearAll = () => {
    const totalCount = uploadProgress.value.size

    // Cancel all active uploads
    for (const upload of activeUploads.value) {
      cancelUpload(upload.fileId)
    }

    uploadProgress.value.clear()
    
    // Reset global stats
    globalStats.value = {
      totalFiles: 0,
      completedFiles: 0,
      totalBytes: 0,
      uploadedBytes: 0,
      averageSpeed: 0,
      estimatedTimeRemaining: 0
    }

    announceToScreenReader(`Cleared all ${totalCount} upload${totalCount !== 1 ? 's' : ''}`)
  }

  const updateGlobalStats = () => {
    const allUploads = Array.from(uploadProgress.value.values())
    
    globalStats.value.completedFiles = allUploads.filter(u => u.status === 'completed').length
    globalStats.value.totalFiles = allUploads.length
    
    // Calculate average speed and time remaining
    const activeFiles = allUploads.filter(u => u.status === 'uploading')
    if (activeFiles.length > 0) {
      const totalSpeed = activeFiles.reduce((sum, file) => sum + file.speed, 0)
      globalStats.value.averageSpeed = totalSpeed / activeFiles.length
      
      const totalProgress = activeFiles.reduce((sum, file) => sum + file.progress, 0)
      const averageProgress = totalProgress / activeFiles.length
      
      if (globalStats.value.averageSpeed > 0 && averageProgress < 100) {
        const remainingPercent = 100 - averageProgress
        globalStats.value.estimatedTimeRemaining = remainingPercent / (globalStats.value.averageSpeed / 1024 / 1024) // Convert to seconds
      }
    }
  }

  // WebSocket event handlers
  on('upload-progress', (data: UploadProgressEvent) => {
    const progress = uploadProgress.value.get(data.fileId)
    if (!progress) return

    const previousProgress = progress.progress
    progress.progress = data.progress
    progress.speed = data.speed
    progress.timeRemaining = data.timeRemaining
    progress.status = data.status

    uploadProgress.value.set(data.fileId, progress)
    updateGlobalStats()

    // Announce significant progress milestones
    announceUploadProgress(progress.fileName, data.progress)
  })

  on('upload-complete', (data: UploadCompleteEvent) => {
    const progress = uploadProgress.value.get(data.fileId)
    if (!progress) return

    if (data.success) {
      progress.status = 'completed'
      progress.progress = 100
      progress.speed = 0
      progress.timeRemaining = undefined
      
      announceToScreenReader(`${progress.fileName} uploaded successfully`)
    } else {
      progress.status = 'failed'
      progress.error = data.error
      
      announceToScreenReader(`${progress.fileName} upload failed: ${data.error}`)
    }

    uploadProgress.value.set(data.fileId, progress)
    updateGlobalStats()
  })

  on('upload-error', (data: UploadErrorEvent) => {
    const progress = uploadProgress.value.get(data.fileId)
    if (!progress) return

    progress.status = 'failed'
    progress.error = data.error
    uploadProgress.value.set(data.fileId, progress)

    announceToScreenReader(`${progress.fileName} upload error: ${data.error}`)
    updateGlobalStats()
  })

  // Format helpers
  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond === 0) return '0 B/s'
    
    const units = ['B/s', 'KB/s', 'MB/s', 'GB/s']
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(1024))
    
    return `${(bytesPerSecond / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
  }

  const formatTimeRemaining = (seconds?: number): string => {
    if (!seconds || seconds <= 0) return '--'
    
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.round((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  return {
    // State
    uploadProgress: readonly(uploadProgress),
    globalStats: readonly(globalStats),
    
    // Computed
    activeUploads,
    completedUploads,
    failedUploads,
    hasActiveUploads,
    hasFailedUploads,
    overallProgress,
    
    // Methods
    startTracking,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    retryUpload,
    clearCompleted,
    clearAll,
    
    // Helpers
    formatSpeed,
    formatTimeRemaining,
    
    // Connection state
    isConnected
  }
}
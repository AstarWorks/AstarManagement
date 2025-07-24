import { ref, readonly, computed } from 'vue'
import type { 
  ReceiptQueueItem 
} from '~/types/receipt'
import type { 
  Receipt,
  OcrResult,
  OcrProcessingRequest,
  OcrStatus 
} from '~/schemas/receipt'

/**
 * OCR Processing Composable
 * 
 * Manages OCR processing queue and operations for receipt text extraction.
 * Handles batch processing, retry logic, and real-time status updates.
 */

export interface UseOcrProcessingOptions {
  autoRetry?: boolean
  maxRetries?: number
  retryDelay?: number
}

export function useOcrProcessing(options: UseOcrProcessingOptions = {}) {
  const {
    autoRetry = true,
    maxRetries = 3,
    retryDelay = 5000 // 5 seconds
  } = options

  // Reactive state
  const processingQueue = ref<ReceiptQueueItem[]>([])
  const results = ref<Map<string, OcrResult>>(new Map())
  const processing = ref(false)
  const error = ref<string | null>(null)
  const currentlyProcessing = ref<string | null>(null)

  // Computed properties
  const queuedItems = computed(() => 
    processingQueue.value.filter(item => item.status === 'queued')
  )

  const processingItems = computed(() => 
    processingQueue.value.filter(item => item.status === 'processing')
  )

  const completedItems = computed(() => 
    processingQueue.value.filter(item => item.status === 'completed')
  )

  const failedItems = computed(() => 
    processingQueue.value.filter(item => item.status === 'failed')
  )

  const isQueueEmpty = computed(() => 
    queuedItems.value.length === 0 && processingItems.value.length === 0
  )

  const queueStats = computed(() => ({
    total: processingQueue.value.length,
    queued: queuedItems.value.length,
    processing: processingItems.value.length,
    completed: completedItems.value.length,
    failed: failedItems.value.length
  }))

  // Add receipt to processing queue
  const queueForProcessing = async (
    receiptId: string,
    priority: 'low' | 'normal' | 'high' = 'normal',
    options?: Partial<OcrProcessingRequest['options']>
  ): Promise<void> => {
    console.log('Queueing receipt for OCR processing:', receiptId)

    // Check if already in queue
    const existingItem = processingQueue.value.find(item => item.receiptId === receiptId)
    if (existingItem) {
      console.log('Receipt already in queue:', receiptId)
      return
    }

    // Add to queue
    const queueItem: ReceiptQueueItem = {
      receiptId,
      status: 'queued',
      queuedAt: new Date().toISOString(),
      retryCount: 0
    }

    // Insert based on priority
    if (priority === 'high') {
      processingQueue.value.unshift(queueItem)
    } else {
      processingQueue.value.push(queueItem)
    }

    // Start processing if not already running
    if (!processing.value) {
      processQueue()
    }
  }

  // Process OCR queue
  const processQueue = async (): Promise<void> => {
    if (processing.value || isQueueEmpty.value) {
      return
    }

    processing.value = true
    error.value = null

    console.log('Starting OCR queue processing...')

    try {
      while (queuedItems.value.length > 0) {
        const item = queuedItems.value[0]
        await processReceiptOcr(item)
        
        // Small delay between items to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    } catch (err) {
      console.error('Queue processing error:', err)
      error.value = err instanceof Error ? err.message : 'Queue processing failed'
    } finally {
      processing.value = false
      currentlyProcessing.value = null
      console.log('OCR queue processing completed')
    }
  }

  // Process single receipt OCR
  const processReceiptOcr = async (queueItem: ReceiptQueueItem): Promise<void> => {
    const { receiptId } = queueItem

    try {
      console.log('Processing OCR for receipt:', receiptId)

      // Update queue item status
      updateQueueItemStatus(receiptId, 'processing', {
        startedAt: new Date().toISOString()
      })

      currentlyProcessing.value = receiptId

      // Call OCR API
      const ocrRequest: OcrProcessingRequest = {
        receiptId,
        priority: 'normal',
        options: {
          extractAmount: true,
          extractDate: true,
          extractVendor: true,
          extractLineItems: false,
          language: 'auto',
          confidence: 0.7
        }
      }

      const result = await $fetch<OcrResult>(`/api/receipts/${receiptId}/ocr`, {
        method: 'POST',
        body: ocrRequest
      })

      console.log('OCR processing completed:', receiptId, result)

      // Store result
      results.value.set(receiptId, result)

      // Update receipt with extracted data
      await $fetch(`/api/receipts/${receiptId}`, {
        method: 'PATCH',
        body: {
          id: receiptId,
          ocrStatus: 'COMPLETED' as OcrStatus,
          ocrText: result.text,
          ocrConfidence: result.confidence,
          extractedAmount: result.extractedAmount,
          extractedDate: result.extractedDate,
          extractedVendor: result.extractedVendor
        }
      })

      // Update queue item status
      updateQueueItemStatus(receiptId, 'completed', {
        completedAt: new Date().toISOString()
      })

      console.log('Receipt OCR completed successfully:', receiptId)

    } catch (err) {
      console.error('OCR processing failed for receipt:', receiptId, err)

      const errorMessage = err instanceof Error ? err.message : 'OCR processing failed'

      // Update receipt status to failed
      try {
        await $fetch(`/api/receipts/${receiptId}`, {
          method: 'PATCH',
          body: {
            id: receiptId,
            ocrStatus: 'FAILED' as OcrStatus
          }
        })
      } catch (updateError) {
        console.error('Failed to update receipt status:', updateError)
      }

      // Handle retry logic
      if (autoRetry && queueItem.retryCount < maxRetries) {
        console.log(`Retrying OCR for receipt ${receiptId} (attempt ${queueItem.retryCount + 1}/${maxRetries})`)
        
        // Schedule retry
        setTimeout(() => {
          retryOcrProcessing(receiptId)
        }, retryDelay)
      } else {
        // Mark as failed
        updateQueueItemStatus(receiptId, 'failed', {
          completedAt: new Date().toISOString(),
          errorMessage
        })
      }
    }
  }

  // Retry OCR processing
  const retryOcrProcessing = async (receiptId: string): Promise<void> => {
    const queueItem = processingQueue.value.find(item => item.receiptId === receiptId)
    if (!queueItem) return

    console.log('Retrying OCR processing for receipt:', receiptId)

    // Increment retry count
    queueItem.retryCount++
    
    // Reset status to queued
    updateQueueItemStatus(receiptId, 'queued', {
      queuedAt: new Date().toISOString()
    })

    // Process immediately if queue is not running
    if (!processing.value) {
      processQueue()
    }
  }

  // Update queue item status
  const updateQueueItemStatus = (
    receiptId: string, 
    status: ReceiptQueueItem['status'],
    updates: Partial<ReceiptQueueItem> = {}
  ): void => {
    const item = processingQueue.value.find(item => item.receiptId === receiptId)
    if (item) {
      item.status = status
      Object.assign(item, updates)
    }
  }

  // Remove from queue
  const removeFromQueue = (receiptId: string): void => {
    processingQueue.value = processingQueue.value.filter(
      item => item.receiptId !== receiptId
    )
    results.value.delete(receiptId)
  }

  // Clear completed items from queue
  const clearCompleted = (): void => {
    processingQueue.value = processingQueue.value.filter(
      item => item.status !== 'completed'
    )
  }

  // Clear failed items from queue
  const clearFailed = (): void => {
    processingQueue.value = processingQueue.value.filter(
      item => item.status !== 'failed'
    )
  }

  // Get OCR result for receipt
  const getResult = (receiptId: string): OcrResult | undefined => {
    return results.value.get(receiptId)
  }

  // Get queue item for receipt
  const getQueueItem = (receiptId: string): ReceiptQueueItem | undefined => {
    return processingQueue.value.find(item => item.receiptId === receiptId)
  }

  // Check if receipt is in queue
  const isInQueue = (receiptId: string): boolean => {
    return processingQueue.value.some(item => item.receiptId === receiptId)
  }

  // Check if receipt is currently processing
  const isProcessing = (receiptId: string): boolean => {
    return currentlyProcessing.value === receiptId
  }

  // Batch queue multiple receipts
  const queueBatch = async (
    receiptIds: string[],
    priority: 'low' | 'normal' | 'high' = 'normal'
  ): Promise<void> => {
    console.log('Queueing batch OCR processing for receipts:', receiptIds)

    for (const receiptId of receiptIds) {
      await queueForProcessing(receiptId, priority)
    }
  }

  // Force process specific receipt (skip queue)
  const forceProcess = async (receiptId: string): Promise<OcrResult | null> => {
    try {
      console.log('Force processing OCR for receipt:', receiptId)

      const ocrRequest: OcrProcessingRequest = {
        receiptId,
        priority: 'high',
        options: {
          extractAmount: true,
          extractDate: true,
          extractVendor: true,
          extractLineItems: true,
          language: 'auto',
          confidence: 0.7
        }
      }

      const result = await $fetch<OcrResult>(`/api/receipts/${receiptId}/ocr`, {
        method: 'POST',
        body: ocrRequest
      })

      // Store result
      results.value.set(receiptId, result)

      return result

    } catch (err) {
      console.error('Force OCR processing failed:', err)
      error.value = err instanceof Error ? err.message : 'Force processing failed'
      return null
    }
  }

  // Get processing progress for a receipt
  const getProgress = (receiptId: string): {
    status: ReceiptQueueItem['status'] | 'not_queued'
    position?: number
    retryCount?: number
    queuedAt?: string
    startedAt?: string
    completedAt?: string
    errorMessage?: string
  } => {
    const queueItem = getQueueItem(receiptId)
    
    if (!queueItem) {
      return { status: 'not_queued' }
    }

    const position = queueItem.status === 'queued' 
      ? queuedItems.value.findIndex(item => item.receiptId === receiptId) + 1
      : undefined

    return {
      status: queueItem.status,
      position,
      retryCount: queueItem.retryCount,
      queuedAt: queueItem.queuedAt,
      startedAt: queueItem.startedAt,
      completedAt: queueItem.completedAt,
      errorMessage: queueItem.errorMessage
    }
  }

  // Pause queue processing
  const pauseQueue = (): void => {
    processing.value = false
    console.log('OCR queue processing paused')
  }

  // Resume queue processing
  const resumeQueue = (): void => {
    if (!isQueueEmpty.value) {
      processQueue()
      console.log('OCR queue processing resumed')
    }
  }

  return {
    // State
    processingQueue: readonly(processingQueue),
    results: readonly(results),
    processing: readonly(processing),
    error: readonly(error),
    currentlyProcessing: readonly(currentlyProcessing),

    // Computed
    queuedItems,
    processingItems,
    completedItems,
    failedItems,
    isQueueEmpty,
    queueStats,

    // Methods
    queueForProcessing,
    processQueue,
    retryOcrProcessing,
    removeFromQueue,
    clearCompleted,
    clearFailed,
    getResult,
    getQueueItem,
    isInQueue,
    isProcessing,
    queueBatch,
    forceProcess,
    getProgress,
    pauseQueue,
    resumeQueue
  }
}
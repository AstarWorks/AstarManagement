import { ref, readonly, computed } from 'vue'
import type { 
  ReceiptFilters, 
  ReceiptStats,
  ReceiptUploadResponse,
  BatchReceiptUpload 
} from '~/types/receipt'
import type { 
  Receipt,
  ReceiptUpload,
  ReceiptSearch,
  ReceiptUpdate 
} from '~/schemas/receipt'

/**
 * Receipts Composable
 * 
 * Provides receipt management functionality including upload, search, filtering,
 * and integration with expense entries. Handles both single and batch operations.
 */

export interface UseReceiptsOptions {
  expenseId?: string
  autoLoad?: boolean
  cacheKey?: string
}

export function useReceipts(options: UseReceiptsOptions = {}) {
  // Reactive state
  const receipts = ref<Receipt[]>([])
  const loading = ref(false)
  const uploading = ref(false)
  const error = ref<string | null>(null)
  const uploadProgress = ref<{ current: number; total: number }>({ current: 0, total: 0 })
  const stats = ref<ReceiptStats>({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    totalFileSize: 0
  })

  // Current filters
  const filters = ref<ReceiptFilters>({
    search: '',
    ocrStatus: undefined,
    expenseId: options.expenseId,
    dateFrom: undefined,
    dateTo: undefined,
    hasOcrData: undefined,
    mimeType: undefined
  })

  // Computed properties
  const filteredReceipts = computed(() => {
    let result = receipts.value

    // Apply expense filter if specified
    if (filters.value.expenseId) {
      result = result.filter(r => r.expenseId === filters.value.expenseId)
    }

    // Apply search filter
    if (filters.value.search) {
      const search = filters.value.search.toLowerCase()
      result = result.filter(r => 
        r.originalFilename.toLowerCase().includes(search) ||
        r.extractedVendor?.toLowerCase().includes(search) ||
        r.ocrText?.toLowerCase().includes(search)
      )
    }

    // Apply OCR status filter
    if (filters.value.ocrStatus) {
      result = result.filter(r => r.ocrStatus === filters.value.ocrStatus)
    }

    // Apply date range filter
    if (filters.value.dateFrom) {
      const fromDate = new Date(filters.value.dateFrom)
      result = result.filter(r => new Date(r.createdAt) >= fromDate)
    }

    if (filters.value.dateTo) {
      const toDate = new Date(filters.value.dateTo)
      result = result.filter(r => new Date(r.createdAt) <= toDate)
    }

    // Apply OCR data filter
    if (filters.value.hasOcrData !== undefined) {
      if (filters.value.hasOcrData) {
        result = result.filter(r => r.extractedAmount || r.extractedVendor || r.extractedDate)
      } else {
        result = result.filter(r => !r.extractedAmount && !r.extractedVendor && !r.extractedDate)
      }
    }

    // Apply MIME type filter
    if (filters.value.mimeType) {
      result = result.filter(r => r.mimeType === filters.value.mimeType)
    }

    return result
  })

  const hasReceipts = computed(() => receipts.value.length > 0)
  const hasFilters = computed(() => {
    return !!(
      filters.value.search ||
      filters.value.ocrStatus ||
      filters.value.dateFrom ||
      filters.value.dateTo ||
      filters.value.hasOcrData !== undefined ||
      filters.value.mimeType
    )
  })

  // Fetch receipts from API
  const fetchReceipts = async (expenseId?: string, searchParams?: Partial<ReceiptSearch>) => {
    loading.value = true
    error.value = null

    try {
      const queryParams: Record<string, any> = {
        ...(expenseId && { expenseId }),
        ...searchParams,
        limit: 100 // Default limit
      }

      const response = await $fetch<{
        receipts: Receipt[]
        stats: ReceiptStats
        total: number
      }>('/api/receipts', {
        query: queryParams
      })

      receipts.value = response.receipts
      stats.value = response.stats

      console.log('Receipts fetched:', {
        count: response.receipts.length,
        total: response.total,
        stats: response.stats
      })

    } catch (err) {
      console.error('Failed to fetch receipts:', err)
      error.value = err instanceof Error ? err.message : 'Failed to fetch receipts'
    } finally {
      loading.value = false
    }
  }

  // Upload single receipt
  const uploadReceipt = async (
    file: File | Blob,
    metadata: Partial<ReceiptUpload> = {}
  ): Promise<Receipt | null> => {
    uploading.value = true
    error.value = null

    try {
      console.log('Starting receipt upload:', {
        filename: metadata.originalFilename || 'unknown',
        size: file.size,
        type: file.type
      })

      // Create form data
      const formData = new FormData()
      formData.append('file', file)
      
      if (metadata.originalFilename) {
        formData.append('originalFilename', metadata.originalFilename)
      }
      
      if (metadata.expenseId) {
        formData.append('expenseId', metadata.expenseId)
      }
      
      if (metadata.metadata) {
        formData.append('metadata', JSON.stringify(metadata.metadata))
      }

      // Upload receipt
      const response = await $fetch<ReceiptUploadResponse>('/api/receipts/upload', {
        method: 'POST',
        body: formData
      })

      // Add to local state
      receipts.value.unshift(response.receipt)
      
      // Update stats
      await updateStats()

      console.log('Receipt uploaded successfully:', response.receipt.id)
      return response.receipt

    } catch (err) {
      console.error('Receipt upload failed:', err)
      error.value = err instanceof Error ? err.message : 'Failed to upload receipt'
      return null
    } finally {
      uploading.value = false
    }
  }

  // Batch upload receipts
  const uploadBatchReceipts = async (
    uploads: Array<{ file: File | Blob; metadata: Partial<ReceiptUpload> }>,
    options: { expenseId?: string; autoProcess?: boolean } = {}
  ): Promise<Receipt[]> => {
    uploading.value = true
    error.value = null
    uploadProgress.value = { current: 0, total: uploads.length }

    const uploadedReceipts: Receipt[] = []

    try {
      console.log('Starting batch receipt upload:', {
        count: uploads.length,
        expenseId: options.expenseId
      })

      // Upload receipts sequentially to avoid overwhelming the server
      for (let i = 0; i < uploads.length; i++) {
        const { file, metadata } = uploads[i]
        
        try {
          const receipt = await uploadReceipt(file, {
            ...metadata,
            expenseId: options.expenseId || metadata.expenseId
          })
          
          if (receipt) {
            uploadedReceipts.push(receipt)
          }
          
          uploadProgress.value.current = i + 1
          
        } catch (uploadError) {
          console.error(`Failed to upload receipt ${i + 1}:`, uploadError)
          // Continue with other uploads
        }
      }

      console.log('Batch upload completed:', {
        successful: uploadedReceipts.length,
        total: uploads.length
      })

      return uploadedReceipts

    } catch (err) {
      console.error('Batch upload failed:', err)
      error.value = err instanceof Error ? err.message : 'Batch upload failed'
      return uploadedReceipts
    } finally {
      uploading.value = false
      uploadProgress.value = { current: 0, total: 0 }
    }
  }

  // Update receipt metadata
  const updateReceipt = async (receiptId: string, updates: Partial<ReceiptUpdate>): Promise<Receipt | null> => {
    try {
      console.log('Updating receipt:', receiptId, updates)

      const updatedReceipt = await $fetch<Receipt>(`/api/receipts/${receiptId}`, {
        method: 'PATCH',
        body: {
          id: receiptId,
          ...updates
        }
      })

      // Update local state
      const index = receipts.value.findIndex(r => r.id === receiptId)
      if (index !== -1) {
        receipts.value[index] = updatedReceipt
      }

      console.log('Receipt updated successfully:', receiptId)
      return updatedReceipt

    } catch (err) {
      console.error('Failed to update receipt:', err)
      error.value = err instanceof Error ? err.message : 'Failed to update receipt'
      return null
    }
  }

  // Delete receipt
  const deleteReceipt = async (receiptId: string): Promise<boolean> => {
    try {
      console.log('Deleting receipt:', receiptId)

      await $fetch(`/api/receipts/${receiptId}`, {
        method: 'DELETE'
      })

      // Remove from local state
      receipts.value = receipts.value.filter(r => r.id !== receiptId)
      
      // Update stats
      await updateStats()

      console.log('Receipt deleted successfully:', receiptId)
      return true

    } catch (err) {
      console.error('Failed to delete receipt:', err)
      error.value = err instanceof Error ? err.message : 'Failed to delete receipt'
      return false
    }
  }

  // Link receipt to expense
  const linkToExpense = async (receiptId: string, expenseId: string): Promise<boolean> => {
    return await updateReceipt(receiptId, { expenseId }) !== null
  }

  // Unlink receipt from expense
  const unlinkFromExpense = async (receiptId: string): Promise<boolean> => {
    return await updateReceipt(receiptId, { expenseId: undefined }) !== null
  }

  // Update filters
  const updateFilters = (newFilters: Partial<ReceiptFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  // Clear filters
  const clearFilters = () => {
    filters.value = {
      search: '',
      ocrStatus: undefined,
      expenseId: options.expenseId, // Keep expense filter if set in options
      dateFrom: undefined,
      dateTo: undefined,
      hasOcrData: undefined,
      mimeType: undefined
    }
  }

  // Update statistics
  const updateStats = async () => {
    try {
      const response = await $fetch<ReceiptStats>('/api/receipts/stats')
      stats.value = response
    } catch (err) {
      console.warn('Failed to update receipt stats:', err)
    }
  }

  // Get receipt by ID
  const getReceiptById = (receiptId: string): Receipt | undefined => {
    return receipts.value.find(r => r.id === receiptId)
  }

  // Get receipts by expense ID
  const getReceiptsByExpense = (expenseId: string): Receipt[] => {
    return receipts.value.filter(r => r.expenseId === expenseId)
  }

  // Check if receipt exists
  const hasReceiptForExpense = (expenseId: string): boolean => {
    return receipts.value.some(r => r.expenseId === expenseId)
  }

  // Refresh receipts (reload from server)
  const refresh = async () => {
    await fetchReceipts(options.expenseId)
  }

  // Initialize if auto-load is enabled
  if (options.autoLoad) {
    fetchReceipts(options.expenseId)
  }

  return {
    // State
    receipts: readonly(receipts),
    loading: readonly(loading),
    uploading: readonly(uploading),
    error: readonly(error),
    uploadProgress: readonly(uploadProgress),
    stats: readonly(stats),
    filters: readonly(filters),

    // Computed
    filteredReceipts,
    hasReceipts,
    hasFilters,

    // Methods
    fetchReceipts,
    uploadReceipt,
    uploadBatchReceipts,
    updateReceipt,
    deleteReceipt,
    linkToExpense,
    unlinkFromExpense,
    updateFilters,
    clearFilters,
    updateStats,
    getReceiptById,
    getReceiptsByExpense,
    hasReceiptForExpense,
    refresh
  }
}
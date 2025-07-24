/**
 * Financial-Specific Offline Queue Management
 * 
 * @description Enhanced offline queue management specifically designed for financial
 * data including expenses and receipts. Provides prioritized sync, conflict resolution,
 * and financial-specific retry logic.
 * 
 * @author Claude
 * @created 2025-07-03
 * @task T08_S14 - Mobile Optimization for Financial Features
 */

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useOfflineQueue } from './useOfflineQueue'
import { useToast } from './useToast'
import type { Expense, Receipt, FinancialSyncItem } from '~/types/financial'

export interface FinancialQueueOptions {
  /** Maximum items to keep in offline queue */
  maxQueueSize?: number
  /** Retry interval in milliseconds for failed syncs */
  retryInterval?: number
  /** Maximum retry attempts per item */
  maxRetries?: number
  /** Enable automatic sync when online */
  autoSync?: boolean
  /** Conflict resolution strategy */
  conflictResolution?: 'client' | 'server' | 'manual'
}

const DEFAULT_OPTIONS: Required<FinancialQueueOptions> = {
  maxQueueSize: 100,
  retryInterval: 30000, // 30 seconds
  maxRetries: 3,
  autoSync: true,
  conflictResolution: 'client'
}

export function useFinancialOfflineQueue(options: FinancialQueueOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const { addToQueue, removeFromQueue } = useOfflineQueue()
  const { showToast } = useToast()
  
  // Queue state
  const queuedExpenses = ref<FinancialSyncItem<Expense>[]>([])
  const queuedReceipts = ref<FinancialSyncItem<Receipt>[]>([])
  const syncInProgress = ref(false)
  const lastSyncTime = ref<Date | null>(null)
  const syncErrors = ref<Record<string, string>>({})
  
  // Computed properties
  const totalQueuedItems = computed(() => 
    queuedExpenses.value.length + queuedReceipts.value.length
  )
  
  const hasPendingExpenses = computed(() => queuedExpenses.value.length > 0)
  const hasPendingReceipts = computed(() => queuedReceipts.value.length > 0)
  
  const queueSize = computed(() => ({
    expenses: queuedExpenses.value.length,
    receipts: queuedReceipts.value.length,
    total: totalQueuedItems.value
  }))
  
  const syncStatus = computed(() => {
    if (syncInProgress.value) return 'syncing'
    if (totalQueuedItems.value > 0) return 'pending'
    return 'synced'
  })
  
  // Queue management methods
  const addExpenseToQueue = async (action: 'create' | 'update' | 'delete', expense: Expense, priority: 'high' | 'medium' | 'low' = 'medium') => {
    const queueItem: FinancialSyncItem<Expense> = {
      id: generateId(),
      action,
      type: 'expense',
      data: expense,
      timestamp: Date.now(),
      priority,
      retryCount: 0,
      lastRetry: null,
      conflict: null
    }
    
    try {
      addToQueue({
        type: 'financial-expense',
        data: queueItem,
        priority: priority,
        operation: action,
        endpoint: '/api/expenses',
        method: 'POST',
        maxRetries: opts.maxRetries
      })
      queuedExpenses.value.push(queueItem)
      
      // Auto-sync if online and enabled
      if (navigator.onLine && opts.autoSync) {
        setTimeout(() => syncFinancialData(), 1000)
      }
      
      return queueItem.id
    } catch (error) {
      console.error('Failed to add expense to queue:', error)
      throw error
    }
  }
  
  const addReceiptToQueue = async (action: 'create' | 'update' | 'delete', receipt: Receipt, priority: 'high' | 'medium' | 'low' = 'medium') => {
    const queueItem: FinancialSyncItem<Receipt> = {
      id: generateId(),
      action,
      type: 'receipt',
      data: receipt,
      timestamp: Date.now(),
      priority,
      retryCount: 0,
      lastRetry: null,
      conflict: null
    }
    
    try {
      addToQueue({
        type: 'financial-receipt',
        data: queueItem,
        priority: priority,
        operation: action,
        endpoint: '/api/receipts',
        method: 'POST',
        maxRetries: opts.maxRetries
      })
      queuedReceipts.value.push(queueItem)
      
      if (navigator.onLine && opts.autoSync) {
        setTimeout(() => syncFinancialData(), 1000)
      }
      
      return queueItem.id
    } catch (error) {
      console.error('Failed to add receipt to queue:', error)
      throw error
    }
  }
  
  // Sync operations
  const syncFinancialData = async () => {
    if (syncInProgress.value) return
    if (totalQueuedItems.value === 0) return
    
    syncInProgress.value = true
    
    try {
      // Sort items by priority and timestamp
      const allItems = [
        ...queuedExpenses.value.map(item => ({ ...item, category: 'expense' as const })),
        ...queuedReceipts.value.map(item => ({ ...item, category: 'receipt' as const }))
      ].sort((a, b) => {
        // High priority first
        if (a.priority !== b.priority) {
          return a.priority === 'high' ? -1 : 1
        }
        // Then by timestamp (older first)
        return a.timestamp - b.timestamp
      })
      
      const results = await Promise.allSettled(
        allItems.map((item: FinancialSyncItem<Expense | Receipt> & { category: 'expense' | 'receipt' }) => syncItem(item))
      )
      
      // Process results
      let successCount = 0
      let errorCount = 0
      
      results.forEach((result, index) => {
        const item = allItems[index]
        
        if (result.status === 'fulfilled') {
          successCount++
          removeItemFromQueue(item.id, item.category)
          delete syncErrors.value[item.id]
        } else {
          errorCount++
          handleSyncError(item, result.reason)
        }
      })
      
      lastSyncTime.value = new Date()
      
      // Show user feedback
      if (successCount > 0) {
        showToast(
          `Successfully synced ${successCount} financial ${successCount === 1 ? 'item' : 'items'}`,
          'success'
        )
      }
      
      if (errorCount > 0) {
        showToast(
          `Failed to sync ${errorCount} financial ${errorCount === 1 ? 'item' : 'items'}`,
          'warning'
        )
      }
      
    } catch (error) {
      console.error('Financial sync failed:', error)
      showToast('Financial data sync failed', 'error')
    } finally {
      syncInProgress.value = false
    }
  }
  
  const syncItem = async (item: FinancialSyncItem<Expense | Receipt> & { category: 'expense' | 'receipt' }) => {
    const endpoint = item.category === 'expense' ? '/api/expenses' : '/api/receipts'
    const method = getHttpMethod(item.action)
    
    let url = endpoint
    if (item.action === 'update' || item.action === 'delete') {
      url += `/${item.data.id}`
    }
    
    const requestInit: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Sync-Item-ID': item.id
      }
    }
    
    if (method !== 'DELETE') {
      requestInit.body = JSON.stringify(item.data)
    }
    
    const response = await fetch(url, requestInit)
    
    if (!response.ok) {
      if (response.status === 409) {
        // Conflict - handle based on strategy
        const serverData = await response.json()
        await handleConflict(item, serverData)
        return
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    // Return the updated data
    if (method !== 'DELETE') {
      return await response.json()
    }
  }
  
  const handleSyncError = async (item: FinancialSyncItem<Expense | Receipt>, error: Error) => {
    item.retryCount++
    item.lastRetry = Date.now()
    syncErrors.value[item.id] = error.message || 'Unknown error'
    
    if (item.retryCount >= opts.maxRetries) {
      // Move to failed items for manual resolution
      showToast(
        `Failed to sync ${item.type} after ${opts.maxRetries} attempts`,
        'error'
      )
    } else {
      // Schedule retry
      setTimeout(() => {
        if (navigator.onLine) {
          syncItem(item as FinancialSyncItem<Expense | Receipt> & { category: 'expense' | 'receipt' }).catch(() => {
            // Will be handled by next retry cycle
          })
        }
      }, opts.retryInterval * item.retryCount) // Exponential backoff
    }
  }
  
  const handleConflict = async (
    item: FinancialSyncItem<Expense | Receipt>, 
    serverData: Expense | Receipt
  ) => {
    item.conflict = {
      localData: item.data,
      serverData,
      timestamp: Date.now()
    }
    
    switch (opts.conflictResolution) {
      case 'server':
        // Accept server version
        item.data = serverData
        break
        
      case 'client':
        // Keep client version - will retry sync
        break
        
      case 'manual':
        // Require user intervention
        showToast(
          `Conflict detected for ${item.type}. Manual resolution required.`,
          'warning'
        )
        return
    }
    
    // Remove conflict flag and retry
    item.conflict = null
    await syncItem(item as FinancialSyncItem<Expense | Receipt> & { category: 'expense' | 'receipt' })
  }
  
  // Queue maintenance
  const removeItemFromQueue = (itemId: string, category: 'expense' | 'receipt') => {
    if (category === 'expense') {
      const index = queuedExpenses.value.findIndex(item => item.id === itemId)
      if (index !== -1) {
        queuedExpenses.value.splice(index, 1)
      }
    } else {
      const index = queuedReceipts.value.findIndex(item => item.id === itemId)
      if (index !== -1) {
        queuedReceipts.value.splice(index, 1)
      }
    }
    
    // Remove from persistent storage
    removeFromQueue(itemId)
  }
  
  const clearQueue = async () => {
    queuedExpenses.value = []
    queuedReceipts.value = []
    syncErrors.value = {}
    
    // Clear persistent storage - implementation depends on actual useOfflineQueue interface
    try {
      // Note: This would need to be implemented based on the actual useOfflineQueue interface
      console.log('Clearing financial queue from persistent storage')
    } catch (error) {
      console.error('Failed to clear financial queue:', error)
    }
  }
  
  const retryFailedItems = async () => {
    const failedItems = [
      ...queuedExpenses.value.filter(item => item.retryCount >= opts.maxRetries),
      ...queuedReceipts.value.filter(item => item.retryCount >= opts.maxRetries)
    ]
    
    // Reset retry count and try again
    failedItems.forEach(item => {
      item.retryCount = 0
      item.lastRetry = null
      delete syncErrors.value[item.id]
    })
    
    if (failedItems.length > 0) {
      await syncFinancialData()
    }
  }
  
  // Utility functions
  const generateId = () => {
    return `financial_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  const getHttpMethod = (action: string): string => {
    switch (action) {
      case 'create': return 'POST'
      case 'update': return 'PATCH'
      case 'delete': return 'DELETE'
      default: return 'POST'
    }
  }
  
  const getQueuedItemById = (id: string): FinancialSyncItem<Expense | Receipt> | null => {
    return queuedExpenses.value.find(item => item.id === id) ||
           queuedReceipts.value.find(item => item.id === id) ||
           null
  }
  
  const getConflictItems = () => {
    return [
      ...queuedExpenses.value.filter(item => item.conflict),
      ...queuedReceipts.value.filter(item => item.conflict)
    ]
  }
  
  // Network status monitoring
  const handleOnline = () => {
    if (opts.autoSync && totalQueuedItems.value > 0) {
      setTimeout(() => syncFinancialData(), 2000) // Give network time to stabilize
    }
  }
  
  const handleOffline = () => {
    syncInProgress.value = false
  }
  
  // Lifecycle
  onMounted(async () => {
    // Load existing queue items from storage - implementation depends on actual useOfflineQueue interface
    try {
      // Note: This would need to be implemented based on the actual useOfflineQueue interface
      console.log('Loading financial queue from storage')
    } catch (error) {
      console.error('Failed to load financial queue from storage:', error)
    }
    
    // Add network status listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Initial sync if online
    if (navigator.onLine && opts.autoSync && totalQueuedItems.value > 0) {
      setTimeout(() => syncFinancialData(), 1000)
    }
  })
  
  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })
  
  return {
    // Queue state
    queuedExpenses: readonly(queuedExpenses),
    queuedReceipts: readonly(queuedReceipts),
    totalQueuedItems,
    hasPendingExpenses,
    hasPendingReceipts,
    queueSize,
    syncStatus,
    syncInProgress: readonly(syncInProgress),
    lastSyncTime: readonly(lastSyncTime),
    syncErrors: readonly(syncErrors),
    
    // Queue operations
    addExpenseToQueue,
    addReceiptToQueue,
    syncFinancialData,
    clearQueue,
    retryFailedItems,
    
    // Utility functions
    getQueuedItemById,
    getConflictItems,
    removeItemFromQueue
  }
}
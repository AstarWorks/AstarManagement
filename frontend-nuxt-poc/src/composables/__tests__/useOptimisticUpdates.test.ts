import { describe, it, expect, beforeEach } from 'vitest'
import { useOptimisticUpdates } from '../useOptimisticUpdates'

interface TestData {
  id: string
  title: string
  status: string
}

describe('useOptimisticUpdates', () => {
  let optimisticUpdates: ReturnType<typeof useOptimisticUpdates<TestData>>
  
  beforeEach(() => {
    optimisticUpdates = useOptimisticUpdates<TestData>()
  })
  
  it('should add optimistic updates', () => {
    const update = {
      id: 'update-1',
      operation: 'update' as const,
      optimisticData: { id: '1', title: 'Test', status: 'pending' },
      timestamp: new Date(),
      status: 'pending' as const
    }
    
    optimisticUpdates.addOptimisticUpdate(update)
    
    expect(optimisticUpdates.hasPendingUpdates.value).toBe(true)
    expect(optimisticUpdates.pendingUpdatesList.value).toHaveLength(1)
    expect(optimisticUpdates.getPendingUpdate('update-1')).toEqual(update)
  })
  
  it('should confirm updates with server data', () => {
    const update = {
      id: 'update-1',
      operation: 'update' as const,
      optimisticData: { id: '1', title: 'Test', status: 'pending' },
      timestamp: new Date(),
      status: 'pending' as const
    }
    
    optimisticUpdates.addOptimisticUpdate(update)
    
    const serverData = { id: '1', title: 'Test Updated', status: 'completed' }
    optimisticUpdates.confirmUpdate('update-1', serverData)
    
    expect(optimisticUpdates.hasPendingUpdates.value).toBe(false)
    expect(optimisticUpdates.pendingUpdatesList.value).toHaveLength(0)
  })
  
  it('should revert failed updates', () => {
    const update = {
      id: 'update-1',
      operation: 'update' as const,
      optimisticData: { id: '1', title: 'Test', status: 'pending' },
      timestamp: new Date(),
      status: 'pending' as const
    }
    
    optimisticUpdates.addOptimisticUpdate(update)
    
    const revertedData = optimisticUpdates.revertUpdate('update-1')
    
    expect(revertedData).toEqual(update.optimisticData)
    const pendingUpdate = optimisticUpdates.getPendingUpdate('update-1')
    expect(pendingUpdate?.status).toBe('failed')
  })
  
  it('should handle multiple pending updates', () => {
    const updates = [
      {
        id: 'update-1',
        operation: 'create' as const,
        optimisticData: { id: '1', title: 'Test 1', status: 'new' },
        timestamp: new Date(),
        status: 'pending' as const
      },
      {
        id: 'update-2',
        operation: 'update' as const,
        optimisticData: { id: '2', title: 'Test 2', status: 'updated' },
        timestamp: new Date(),
        status: 'pending' as const
      }
    ]
    
    updates.forEach(update => optimisticUpdates.addOptimisticUpdate(update))
    
    expect(optimisticUpdates.pendingUpdatesList.value).toHaveLength(2)
    expect(optimisticUpdates.hasPendingUpdates.value).toBe(true)
  })
  
  it('should clear all pending updates', () => {
    const updates = [
      {
        id: 'update-1',
        operation: 'create' as const,
        optimisticData: { id: '1', title: 'Test 1', status: 'new' },
        timestamp: new Date(),
        status: 'pending' as const
      },
      {
        id: 'update-2',
        operation: 'update' as const,
        optimisticData: { id: '2', title: 'Test 2', status: 'updated' },
        timestamp: new Date(),
        status: 'pending' as const
      }
    ]
    
    updates.forEach(update => optimisticUpdates.addOptimisticUpdate(update))
    
    optimisticUpdates.clearPendingUpdates()
    
    expect(optimisticUpdates.hasPendingUpdates.value).toBe(false)
    expect(optimisticUpdates.pendingUpdatesList.value).toHaveLength(0)
  })
  
  it('should return undefined for non-existent updates', () => {
    expect(optimisticUpdates.getPendingUpdate('non-existent')).toBeUndefined()
    expect(optimisticUpdates.revertUpdate('non-existent')).toBeUndefined()
  })
  
  it('should not remove update when confirming non-existent update', () => {
    const update = {
      id: 'update-1',
      operation: 'update' as const,
      optimisticData: { id: '1', title: 'Test', status: 'pending' },
      timestamp: new Date(),
      status: 'pending' as const
    }
    
    optimisticUpdates.addOptimisticUpdate(update)
    optimisticUpdates.confirmUpdate('non-existent', { id: '2', title: 'Other', status: 'done' })
    
    expect(optimisticUpdates.hasPendingUpdates.value).toBe(true)
    expect(optimisticUpdates.pendingUpdatesList.value).toHaveLength(1)
  })
})
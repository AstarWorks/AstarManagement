import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { QueryClient } from '@tanstack/vue-query'
import {
  QUERY_KEYS,
  INVALIDATION_CONFIG,
  InvalidationExecutor,
  createInvalidationExecutor,
  getEntityQueryKeys,
  batchInvalidate,
} from '../query-invalidation'

describe('Query Invalidation Configuration', () => {
  let queryClient: QueryClient
  let executor: InvalidationExecutor
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
    executor = createInvalidationExecutor(queryClient)
    vi.useFakeTimers()
  })
  
  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })
  
  describe('QUERY_KEYS', () => {
    it('should generate correct query keys for matters', () => {
      expect(QUERY_KEYS.matters.all).toEqual(['matters'])
      expect(QUERY_KEYS.matters.list({ status: 'active' })).toEqual([
        'matters',
        'list',
        { status: 'active' },
      ])
      expect(QUERY_KEYS.matters.detail('123')).toEqual(['matters', 'detail', '123'])
    })
    
    it('should generate correct query keys for kanban', () => {
      expect(QUERY_KEYS.kanban.column('in_progress')).toEqual([
        'kanban',
        'column',
        'in_progress',
      ])
    })
    
    it('should generate correct query keys for activity', () => {
      expect(QUERY_KEYS.activity.matter('123')).toEqual(['activity', 'matter', '123'])
      expect(QUERY_KEYS.activity.user('user456')).toEqual(['activity', 'user', 'user456'])
    })
  })
  
  describe('InvalidationExecutor', () => {
    it('should invalidate queries for matter:create', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
      
      await executor.execute('matter:create')
      
      // Check immediate invalidations
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.matters.lists(),
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.kanban.boards(),
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.stats.dashboard(),
      })
      
      // Background invalidations should not be called immediately
      expect(invalidateSpy).not.toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.activity.recent(),
      })
      
      // Fast-forward timers to trigger background invalidations
      vi.runAllTimers()
      
      // Now background invalidations should be called
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.activity.recent(),
      })
    })
    
    it('should handle conditional invalidations', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
      
      // Test with status that should trigger conditional invalidation
      await executor.execute('matter:status-change', {
        matterId: '123',
        newStatus: 'completed',
      })
      
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.stats.dashboard(),
      })
      
      invalidateSpy.mockClear()
      
      // Test with status that should NOT trigger conditional invalidation
      await executor.execute('matter:status-change', {
        matterId: '456',
        newStatus: 'in_progress',
      })
      
      expect(invalidateSpy).not.toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.stats.dashboard(),
      })
    })
    
    it('should handle bulk move invalidations with delay', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
      
      await executor.execute('matter:bulk-move', {
        matterIds: ['1', '2', '3'],
        targetStatus: 'done',
      })
      
      // Immediate invalidations
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.kanban.all,
      })
      
      // Background invalidations should not be called yet
      expect(invalidateSpy).not.toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.activity.recent(),
      })
      
      // Fast-forward by 500ms (the configured delay)
      vi.advanceTimersByTime(500)
      
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.activity.recent(),
      })
    })
    
    it('should skip background invalidations when requested', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
      
      await executor.execute('matter:create', undefined, {
        skipBackground: true,
      })
      
      // Only immediate invalidations should be called
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.matters.lists(),
      })
      
      // Fast-forward timers
      vi.runAllTimers()
      
      // Background invalidations should still not be called
      expect(invalidateSpy).not.toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.activity.recent(),
      })
    })
    
    it('should force immediate execution when requested', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
      
      await executor.execute('matter:create', undefined, {
        forceImmediate: true,
      })
      
      // All invalidations should be called immediately
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.activity.recent(),
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.stats.kanban(),
      })
    })
    
    it('should handle nested query key arrays from matter:move', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
      
      await executor.execute('matter:move', {
        matterId: '123',
        fromStatus: 'todo',
        toStatus: 'in_progress',
      })
      
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.matters.detail('123'),
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.kanban.column('todo'),
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.kanban.column('in_progress'),
      })
    })
  })
  
  describe('getEntityQueryKeys', () => {
    it('should return all query keys for a specific matter', () => {
      const keys = getEntityQueryKeys('matter', '123')
      
      expect(keys).toContainEqual(QUERY_KEYS.matters.detail('123'))
      expect(keys).toContainEqual(QUERY_KEYS.activity.matter('123'))
      expect(keys).toContainEqual(QUERY_KEYS.stats.matter('123'))
    })
    
    it('should return all query keys for matter type without ID', () => {
      const keys = getEntityQueryKeys('matter')
      
      expect(keys).toContainEqual(QUERY_KEYS.matters.all)
      expect(keys).toContainEqual(QUERY_KEYS.activity.all)
      expect(keys).toContainEqual(QUERY_KEYS.stats.all)
    })
    
    it('should return kanban query keys', () => {
      const keys = getEntityQueryKeys('kanban')
      
      expect(keys).toContainEqual(QUERY_KEYS.kanban.all)
      expect(keys).toContainEqual(QUERY_KEYS.stats.kanban())
    })
  })
  
  describe('batchInvalidate', () => {
    it('should invalidate multiple query keys in parallel', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
      
      const queryKeys = [
        QUERY_KEYS.matters.detail('123'),
        QUERY_KEYS.kanban.column('todo'),
        QUERY_KEYS.activity.recent(),
      ]
      
      await batchInvalidate(queryClient, queryKeys)
      
      expect(invalidateSpy).toHaveBeenCalledTimes(3)
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.matters.detail('123'),
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.kanban.column('todo'),
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.activity.recent(),
      })
    })
  })
  
  describe('INVALIDATION_CONFIG completeness', () => {
    it('should have configurations for all mutation types', () => {
      const mutationTypes: Array<keyof typeof INVALIDATION_CONFIG> = [
        'matter:create',
        'matter:update',
        'matter:delete',
        'matter:move',
        'matter:bulk-move',
        'matter:status-change',
        'matter:assign',
        'matter:archive',
        'matter:restore',
        'document:upload',
        'document:delete',
        'comment:create',
        'comment:update',
        'comment:delete',
      ]
      
      mutationTypes.forEach(type => {
        expect(INVALIDATION_CONFIG[type]).toBeDefined()
        expect(Array.isArray(INVALIDATION_CONFIG[type])).toBe(true)
        expect(INVALIDATION_CONFIG[type].length).toBeGreaterThan(0)
      })
    })
    
    it('should have valid query functions in all patterns', () => {
      Object.entries(INVALIDATION_CONFIG).forEach(([mutationType, patterns]) => {
        patterns.forEach((pattern, index) => {
          pattern.queries.forEach((queryFn, queryIndex) => {
            expect(typeof queryFn).toBe('function')
            
            // Test that query functions return valid arrays
            const result = queryFn({ id: 'test', matterId: 'test' })
            expect(Array.isArray(result)).toBe(true)
          })
        })
      })
    })
  })
})
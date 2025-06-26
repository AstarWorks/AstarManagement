/**
 * Tests for Position Management Utility
 * 
 * @description Comprehensive test suite for position calculation,
 * conflict resolution, and optimization algorithms.
 * 
 * @author Claude
 * @created 2025-06-26
 * @task T12_S08 - Drag & Drop Mutations
 */

import { describe, it, expect } from 'vitest'
import type { MatterCard, MatterStatus } from '~/types/kanban'
import {
  calculateInsertPosition,
  normalizeColumnPositions,
  detectPositionConflicts,
  resolvePositionConflicts,
  calculateBatchPositions,
  optimizePositions,
  needsNormalization,
  getSafeInsertPosition,
  getPositionStatistics,
  POSITION_CONFIG
} from '../positionManager'

// Mock data helpers
const createMockMatter = (id: string, position: number, status: MatterStatus = 'DRAFT'): MatterCard => ({
  id,
  caseNumber: `CASE-${id}`,
  title: `Matter ${id}`,
  description: 'Test matter',
  clientName: 'Test Client',
  status,
  priority: 'MEDIUM',
  position,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  assignedLawyer: 'lawyer-1',
  tags: ['test']
})

describe('positionManager', () => {
  describe('calculateInsertPosition', () => {
    it('should return default position for empty list', () => {
      const result = calculateInsertPosition(0, [])
      
      expect(result.position).toBe(POSITION_CONFIG.DEFAULT_INCREMENT)
      expect(result.needsNormalization).toBe(false)
      expect(result.conflictResolved).toBe(true)
    })

    it('should calculate position at beginning', () => {
      const matters = [
        createMockMatter('1', 2000),
        createMockMatter('2', 3000)
      ]

      const result = calculateInsertPosition(0, matters)
      
      expect(result.position).toBe(1000) // 2000 - 1000
      expect(result.needsNormalization).toBe(false)
    })

    it('should calculate position at end', () => {
      const matters = [
        createMockMatter('1', 1000),
        createMockMatter('2', 2000)
      ]

      const result = calculateInsertPosition(2, matters)
      
      expect(result.position).toBe(3000) // 2000 + 1000
      expect(result.needsNormalization).toBe(false)
    })

    it('should calculate position in middle with sufficient gap', () => {
      const matters = [
        createMockMatter('1', 1000),
        createMockMatter('2', 3000)
      ]

      const result = calculateInsertPosition(1, matters)
      
      expect(result.position).toBe(2000) // (1000 + 3000) / 2
      expect(result.needsNormalization).toBe(false)
      expect(result.originalGap).toBe(2000)
    })

    it('should detect need for normalization with small gap', () => {
      const matters = [
        createMockMatter('1', 1000),
        createMockMatter('2', 1050) // Small gap
      ]

      const result = calculateInsertPosition(1, matters)
      
      expect(result.position).toBe(1025) // (1000 + 1050) / 2
      expect(result.needsNormalization).toBe(true)
      expect(result.conflictResolved).toBe(false)
    })

    it('should exclude specified matter from calculations', () => {
      const matters = [
        createMockMatter('1', 1000),
        createMockMatter('2', 2000),
        createMockMatter('3', 3000)
      ]

      const result = calculateInsertPosition(1, matters, '2')
      
      // Should calculate as if matter '2' doesn't exist
      expect(result.position).toBe(2000) // (1000 + 3000) / 2
    })

    it('should handle edge case at position 0', () => {
      const matters = [createMockMatter('1', 100)]

      const result = calculateInsertPosition(0, matters)
      
      expect(result.position).toBe(0) // max(100 - 1000, 0)
      expect(result.needsNormalization).toBe(true)
    })
  })

  describe('normalizeColumnPositions', () => {
    it('should normalize positions with default increment', () => {
      const matters = [
        createMockMatter('1', 150),
        createMockMatter('2', 175),
        createMockMatter('3', 200)
      ]

      const normalized = normalizeColumnPositions(matters)
      
      expect(normalized).toHaveLength(3)
      expect(normalized[0].position).toBe(1000)
      expect(normalized[1].position).toBe(2000)
      expect(normalized[2].position).toBe(3000)
    })

    it('should maintain order when normalizing', () => {
      const matters = [
        createMockMatter('3', 300),
        createMockMatter('1', 100),
        createMockMatter('2', 200)
      ]

      const normalized = normalizeColumnPositions(matters)
      
      expect(normalized[0].id).toBe('1') // Lowest position first
      expect(normalized[1].id).toBe('2')
      expect(normalized[2].id).toBe('3')
    })

    it('should handle empty array', () => {
      const normalized = normalizeColumnPositions([])
      expect(normalized).toHaveLength(0)
    })
  })

  describe('detectPositionConflicts', () => {
    it('should detect duplicate positions', () => {
      const matters = [
        createMockMatter('1', 1000),
        createMockMatter('2', 1000), // Conflict
        createMockMatter('3', 1000), // Another conflict
        createMockMatter('4', 2000)
      ]

      const conflicts = detectPositionConflicts(matters)
      
      expect(conflicts).toHaveLength(2) // Two matters conflict with the first
      expect(conflicts[0].matterId).toBe('2')
      expect(conflicts[0].currentPosition).toBe(1000)
      expect(conflicts[0].suggestedPosition).toBe(1100) // 1000 + 100
      expect(conflicts[1].matterId).toBe('3')
      expect(conflicts[1].suggestedPosition).toBe(1200) // 1000 + 200
    })

    it('should return empty array for no conflicts', () => {
      const matters = [
        createMockMatter('1', 1000),
        createMockMatter('2', 2000),
        createMockMatter('3', 3000)
      ]

      const conflicts = detectPositionConflicts(matters)
      expect(conflicts).toHaveLength(0)
    })

    it('should handle position at max limit', () => {
      const matters = [
        createMockMatter('1', POSITION_CONFIG.MAX_POSITION),
        createMockMatter('2', POSITION_CONFIG.MAX_POSITION)
      ]

      const conflicts = detectPositionConflicts(matters)
      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].suggestedPosition).toBe(POSITION_CONFIG.MAX_POSITION)
    })
  })

  describe('resolvePositionConflicts', () => {
    it('should resolve conflicts by updating positions', () => {
      const matters = [
        createMockMatter('1', 1000),
        createMockMatter('2', 1000),
        createMockMatter('3', 2000)
      ]

      const conflicts = detectPositionConflicts(matters)
      const resolved = resolvePositionConflicts(matters, conflicts)
      
      expect(resolved[1].position).toBe(1100) // Conflict resolved
      expect(resolved[0].position).toBe(1000) // Original position maintained
      expect(resolved[2].position).toBe(2000) // Unaffected
    })

    it('should return unchanged array for no conflicts', () => {
      const matters = [
        createMockMatter('1', 1000),
        createMockMatter('2', 2000)
      ]

      const resolved = resolvePositionConflicts(matters, [])
      expect(resolved).toEqual(matters)
    })
  })

  describe('calculateBatchPositions', () => {
    it('should calculate positions for batch operations', () => {
      const operations = [
        { matterId: '1', targetStatus: 'ACTIVE' as MatterStatus, targetIndex: 0 },
        { matterId: '2', targetStatus: 'ACTIVE' as MatterStatus, targetIndex: 1 }
      ]

      const mattersByStatus = {
        'DRAFT': [],
        'ACTIVE': [createMockMatter('3', 2000)],
        'REVIEW': [],
        'COMPLETED': [],
        'ARCHIVED': []
      } as Record<MatterStatus, MatterCard[]>

      const positions = calculateBatchPositions(operations, mattersByStatus)
      
      expect(positions['1']).toBeDefined()
      expect(positions['2']).toBeDefined()
      expect(positions['1']).toBeLessThan(positions['2']) // Maintain order
    })

    it('should handle operations targeting same status', () => {
      const operations = [
        { matterId: '1', targetStatus: 'DRAFT' as MatterStatus, targetIndex: 0 },
        { matterId: '2', targetStatus: 'DRAFT' as MatterStatus, targetIndex: 1 },
        { matterId: '3', targetStatus: 'ACTIVE' as MatterStatus, targetIndex: 0 }
      ]

      const mattersByStatus = {
        'DRAFT': [],
        'ACTIVE': [],
        'REVIEW': [],
        'COMPLETED': [],
        'ARCHIVED': []
      } as Record<MatterStatus, MatterCard[]>

      const positions = calculateBatchPositions(operations, mattersByStatus)
      
      expect(Object.keys(positions)).toHaveLength(3)
      expect(positions['1']).toBeLessThan(positions['2'])
    })
  })

  describe('optimizePositions', () => {
    it('should optimize positions with regular intervals', () => {
      const matters = [
        createMockMatter('1', 105),
        createMockMatter('2', 203),
        createMockMatter('3', 501)
      ]

      const optimized = optimizePositions(matters)
      
      expect(optimized[0].position).toBe(1000)
      expect(optimized[1].position).toBe(2000)
      expect(optimized[2].position).toBe(3000)
    })

    it('should maintain original order', () => {
      const matters = [
        createMockMatter('2', 200),
        createMockMatter('1', 100),
        createMockMatter('3', 300)
      ]

      const optimized = optimizePositions(matters)
      
      expect(optimized[0].id).toBe('1') // Lowest original position
      expect(optimized[1].id).toBe('2')
      expect(optimized[2].id).toBe('3')
    })
  })

  describe('needsNormalization', () => {
    it('should detect when normalization is needed', () => {
      const matters = [
        createMockMatter('1', 1000),
        createMockMatter('2', 1050) // Gap too small
      ]

      expect(needsNormalization(matters)).toBe(true)
    })

    it('should detect conflicts requiring normalization', () => {
      const matters = [
        createMockMatter('1', 1000),
        createMockMatter('2', 1000) // Duplicate position
      ]

      expect(needsNormalization(matters)).toBe(true)
    })

    it('should detect positions near limits', () => {
      const matters = [
        createMockMatter('1', 50), // Too close to 0
        createMockMatter('2', 2000)
      ]

      expect(needsNormalization(matters)).toBe(true)
    })

    it('should return false for well-positioned matters', () => {
      const matters = [
        createMockMatter('1', 1000),
        createMockMatter('2', 2000),
        createMockMatter('3', 3000)
      ]

      expect(needsNormalization(matters)).toBe(false)
    })

    it('should handle empty array', () => {
      expect(needsNormalization([])).toBe(false)
    })
  })

  describe('getSafeInsertPosition', () => {
    it('should return safe position without normalization', () => {
      const matters = [
        createMockMatter('1', 1000),
        createMockMatter('2', 3000)
      ]

      const position = getSafeInsertPosition(1, matters)
      expect(position).toBe(2000)
    })

    it('should normalize and return safe position when needed', () => {
      const matters = [
        createMockMatter('1', 1000),
        createMockMatter('2', 1050) // Small gap
      ]

      const position = getSafeInsertPosition(1, matters)
      expect(position).toBeGreaterThan(1000)
      expect(position).toBeLessThan(3000) // Should be normalized
    })
  })

  describe('getPositionStatistics', () => {
    it('should calculate statistics for matter positions', () => {
      const matters = [
        createMockMatter('1', 1000),
        createMockMatter('2', 2000),
        createMockMatter('3', 4000)
      ]

      const stats = getPositionStatistics(matters)
      
      expect(stats.count).toBe(3)
      expect(stats.minPosition).toBe(1000)
      expect(stats.maxPosition).toBe(4000)
      expect(stats.averageGap).toBe(1500) // (1000 + 2000) / 2
      expect(stats.minGap).toBe(1000)
      expect(stats.maxGap).toBe(2000)
      expect(stats.conflicts).toBe(0)
      expect(stats.needsNormalization).toBe(false)
    })

    it('should handle empty array', () => {
      const stats = getPositionStatistics([])
      
      expect(stats.count).toBe(0)
      expect(stats.minPosition).toBe(0)
      expect(stats.maxPosition).toBe(0)
      expect(stats.averageGap).toBe(0)
      expect(stats.conflicts).toBe(0)
      expect(stats.needsNormalization).toBe(false)
    })

    it('should detect conflicts in statistics', () => {
      const matters = [
        createMockMatter('1', 1000),
        createMockMatter('2', 1000), // Conflict
        createMockMatter('3', 2000)
      ]

      const stats = getPositionStatistics(matters)
      
      expect(stats.conflicts).toBe(1)
      expect(stats.needsNormalization).toBe(true)
    })

    it('should handle single matter', () => {
      const matters = [createMockMatter('1', 1000)]
      
      const stats = getPositionStatistics(matters)
      
      expect(stats.count).toBe(1)
      expect(stats.minPosition).toBe(1000)
      expect(stats.maxPosition).toBe(1000)
      expect(stats.averageGap).toBe(0)
      expect(stats.minGap).toBe(0)
      expect(stats.maxGap).toBe(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle maximum position limit', () => {
      const matters = [
        createMockMatter('1', POSITION_CONFIG.MAX_POSITION - 1000)
      ]

      const result = calculateInsertPosition(1, matters)
      expect(result.position).toBe(POSITION_CONFIG.MAX_POSITION)
    })

    it('should handle minimum position edge', () => {
      const matters = [createMockMatter('1', 500)]

      const result = calculateInsertPosition(0, matters)
      expect(result.position).toBe(0) // Can't go below 0
    })

    it('should handle very large number of matters', () => {
      const matters = Array.from({ length: 1000 }, (_, i) => 
        createMockMatter(String(i), i * 10)
      )

      const result = calculateInsertPosition(500, matters)
      expect(result.position).toBeGreaterThan(0)
      expect(result.position).toBeLessThan(POSITION_CONFIG.MAX_POSITION)
    })

    it('should handle irregular position distribution', () => {
      const matters = [
        createMockMatter('1', 1),
        createMockMatter('2', 999999),
        createMockMatter('3', 500000)
      ]

      const normalized = normalizeColumnPositions(matters)
      expect(normalized[0].position).toBe(1000)
      expect(normalized[1].position).toBe(2000)
      expect(normalized[2].position).toBe(3000)
    })
  })
})
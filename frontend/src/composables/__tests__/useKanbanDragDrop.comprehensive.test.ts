/**
 * Comprehensive unit tests for useKanbanDragDrop composable
 * 
 * @description Tests drag-drop state management, event handling,
 * business rule validation, and integration with DOM events.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useKanbanDragDrop } from '~/composables/useKanbanDragDrop'
import type { MatterStatus, Matter } from '~/types/matter'
import {
  createMockMatter,
  createMockDragEvent,
  createMockTouchEvent
} from '../../test/utils/kanban-test-utils'

// Mock Nuxt composables
vi.mock('#app', () => ({
  useNuxtApp: () => ({
    $toast: {
      error: vi.fn(),
      success: vi.fn()
    }
  })
}))

describe('useKanbanDragDrop', () => {
  let dragDrop: ReturnType<typeof useKanbanDragDrop>
  let mockMatters: Matter[]

  beforeEach(() => {
    setActivePinia(createPinia())
    
    mockMatters = [
      createMockMatter({ id: 'matter-1', status: 'intake', position: 0 }),
      createMockMatter({ id: 'matter-2', status: 'intake', position: 1 }),
      createMockMatter({ id: 'matter-3', status: 'investigation', position: 0 })
    ]

    dragDrop = useKanbanDragDrop()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  // ===== INITIALIZATION =====

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      expect(dragDrop.isDragging.value).toBe(false)
      expect(dragDrop.draggedItem.value).toBeNull()
      expect(dragDrop.dropZone.value).toBeNull()
    })

    it('should provide reactive state references', () => {
      expect(dragDrop.isDragging).toHaveProperty('value')
      expect(dragDrop.draggedItem).toHaveProperty('value')
      expect(dragDrop.dropZone).toHaveProperty('value')
    })

    it('should expose required methods', () => {
      expect(typeof dragDrop.startDrag).toBe('function')
      expect(typeof dragDrop.endDrag).toBe('function')
      expect(typeof dragDrop.onDrop).toBe('function')
      expect(typeof dragDrop.canDrop).toBe('function')
    })
  })

  // ===== DRAG START =====

  describe('Drag Start', () => {
    it('should start drag operation with matter', () => {
      const matter = mockMatters[0]
      const event = createMockDragEvent('dragstart')

      dragDrop.startDrag(matter, event)

      expect(dragDrop.isDragging.value).toBe(true)
      expect(dragDrop.draggedItem.value).toEqual(matter)
      expect(event.dataTransfer!.setData).toHaveBeenCalledWith('text/plain', matter.id)
    })

    it('should set drag effect and cursor', () => {
      const matter = mockMatters[0]
      const event = createMockDragEvent('dragstart')

      dragDrop.startDrag(matter, event)

      expect(event.dataTransfer!.effectAllowed).toBe('move')
      expect(event.dataTransfer!.dropEffect).toBe('move')
    })

    it('should create ghost element for drag preview', () => {
      const matter = mockMatters[0]
      const event = createMockDragEvent('dragstart')
      
      // Mock DOM element
      const mockElement = document.createElement('div')
      mockElement.innerHTML = `<div class="matter-card">${matter.title}</div>`
      
      dragDrop.startDrag(matter, event, mockElement)

      expect(event.dataTransfer!.setDragImage).toHaveBeenCalled()
    })

    it('should prevent starting drag if already dragging', () => {
      const matter1 = mockMatters[0]
      const matter2 = mockMatters[1]
      const event1 = createMockDragEvent('dragstart')
      const event2 = createMockDragEvent('dragstart')

      dragDrop.startDrag(matter1, event1)
      dragDrop.startDrag(matter2, event2)

      // Should still be dragging first matter
      expect(dragDrop.draggedItem.value).toEqual(matter1)
    })
  })

  // ===== BUSINESS RULE VALIDATION =====

  describe('Business Rule Validation', () => {
    it('should allow valid status transitions', () => {
      const testCases = [
        { from: 'intake', to: 'investigation', expected: true },
        { from: 'investigation', to: 'negotiation', expected: true },
        { from: 'negotiation', to: 'litigation', expected: true },
        { from: 'litigation', to: 'settlement', expected: true },
        { from: 'settlement', to: 'closed', expected: true }
      ]

      testCases.forEach(({ from, to, expected }) => {
        const matter = createMockMatter({ status: from as MatterStatus })
        const result = dragDrop.canDrop(to as MatterStatus, matter)
        expect(result).toBe(expected)
      })
    })

    it('should prevent invalid status transitions', () => {
      const invalidCases = [
        { from: 'intake', to: 'settlement' }, // Skip multiple steps
        { from: 'closed', to: 'intake' }, // Backward movement
        { from: 'litigation', to: 'intake' } // Backward movement
      ]

      invalidCases.forEach(({ from, to }) => {
        const matter = createMockMatter({ status: from as MatterStatus })
        const result = dragDrop.canDrop(to as MatterStatus, matter)
        expect(result).toBe(false)
      })
    })
  })

  // ===== DROP HANDLING =====

  describe('Drop Handling', () => {
    beforeEach(() => {
      const matter = mockMatters[0]
      const event = createMockDragEvent('dragstart')
      dragDrop.startDrag(matter, event)
    })

    it('should handle successful drop operation', async () => {
      const dropEvent = createMockDragEvent('drop')
      dropEvent.dataTransfer!.getData = vi.fn(() => mockMatters[0].id)
      
      const result = await dragDrop.onDrop(dropEvent)
      
      expect(result).toBe(true)
      expect(dragDrop.isDragging.value).toBe(false)
      expect(dragDrop.draggedItem.value).toBeNull()
    })

    it('should handle malformed drop data', async () => {
      const dropEvent = createMockDragEvent('drop')
      dropEvent.dataTransfer!.getData = vi.fn(() => '') // Empty data
      
      const result = await dragDrop.onDrop(dropEvent)
      
      expect(result).toBe(false)
      expect(dragDrop.isDragging.value).toBe(false) // Should reset state
    })
  })

  // ===== DRAG END =====

  describe('Drag End', () => {
    beforeEach(() => {
      const matter = mockMatters[0]
      const event = createMockDragEvent('dragstart')
      dragDrop.startDrag(matter, event)
    })

    it('should reset state on drag end', () => {
      const dragEndEvent = createMockDragEvent('dragend')
      
      dragDrop.endDrag(dragEndEvent)
      
      expect(dragDrop.isDragging.value).toBe(false)
      expect(dragDrop.draggedItem.value).toBeNull()
      expect(dragDrop.dropZone.value).toBeNull()
    })

    it('should handle drag end without drop', () => {
      const dragEndEvent = createMockDragEvent('dragend')
      
      dragDrop.endDrag(dragEndEvent)
      
      expect(dragDrop.isDragging.value).toBe(false)
      expect(dragDrop.dropZone.value).toBeNull()
    })
  })

  // ===== ERROR HANDLING =====

  describe('Error Handling', () => {
    it('should handle missing matter data gracefully', () => {
      const event = createMockDragEvent('dragstart')
      
      expect(() => {
        dragDrop.startDrag(null as any, event)
      }).not.toThrow()
      
      expect(dragDrop.isDragging.value).toBe(false)
    })

    it('should handle malformed events', () => {
      const matter = mockMatters[0]
      const malformedEvent = {} as DragEvent
      
      expect(() => {
        dragDrop.startDrag(matter, malformedEvent)
      }).not.toThrow()
    })

    it('should handle concurrent drag operations', () => {
      const matter1 = mockMatters[0]
      const matter2 = mockMatters[1]
      const event1 = createMockDragEvent('dragstart')
      const event2 = createMockDragEvent('dragstart')
      
      dragDrop.startDrag(matter1, event1)
      dragDrop.startDrag(matter2, event2)
      
      // Should prevent concurrent drags
      expect(dragDrop.draggedItem.value).toEqual(matter1)
    })
  })

  // ===== PERFORMANCE =====

  describe('Performance', () => {
    it('should handle rapid drag events efficiently', () => {
      const matter = mockMatters[0]
      const startTime = performance.now()
      
      // Simulate rapid events
      for (let i = 0; i < 100; i++) {
        const event = createMockDragEvent('dragstart')
        dragDrop.startDrag(matter, event)
        dragDrop.endDrag(createMockDragEvent('dragend'))
      }
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // Should complete quickly (under 100ms for 100 operations)
      expect(duration).toBeLessThan(100)
    })
  })
})
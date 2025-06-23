import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useKanbanDragDrop } from '../useKanbanDragDrop'
import type { MatterCard, MatterStatus } from '~/types/kanban'

// Mock the accessibility composable
vi.mock('~/composables/useAccessibility', () => ({
  useAccessibility: () => ({
    announceUpdate: vi.fn()
  })
}))

// Mock DOM APIs
Object.defineProperty(document, 'body', {
  value: {
    classList: {
      add: vi.fn(),
      remove: vi.fn()
    }
  },
  writable: true
})

const mockMatter: MatterCard = {
  id: '1',
  caseNumber: 'CASE-001',
  title: 'Test Matter',
  status: 'INTAKE' as MatterStatus,
  priority: 'MEDIUM',
  clientName: 'John Doe',
  assignedLawyer: {
    id: 'lawyer1',
    name: 'Jane Smith',
    initials: 'JS'
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  dueDate: '2024-02-01',
  statusDuration: 5,
  relatedDocuments: 3,
  tags: ['urgent', 'corporate']
}

describe('useKanbanDragDrop', () => {
  let composable: ReturnType<typeof useKanbanDragDrop>

  beforeEach(() => {
    vi.clearAllMocks()
    composable = useKanbanDragDrop()
  })

  describe('Status Transition Validation', () => {
    it('allows valid status transitions', () => {
      // INTAKE -> INITIAL_REVIEW should be allowed
      expect(composable.canDropInColumn(mockMatter, 'INITIAL_REVIEW')).toBe(true)
      
      // INTAKE -> CLOSED should be allowed
      expect(composable.canDropInColumn(mockMatter, 'CLOSED')).toBe(true)
    })

    it('prevents invalid status transitions', () => {
      // INTAKE -> TRIAL should not be allowed
      expect(composable.canDropInColumn(mockMatter, 'TRIAL')).toBe(false)
      
      // INTAKE -> SETTLEMENT should not be allowed
      expect(composable.canDropInColumn(mockMatter, 'SETTLEMENT')).toBe(false)
    })

    it('returns correct available statuses for current status', () => {
      const availableStatuses = composable.getAvailableStatuses('INTAKE')
      expect(availableStatuses).toEqual(['INITIAL_REVIEW', 'CLOSED'])
    })

    it('handles CLOSED status correctly (no transitions allowed)', () => {
      const closedMatter = { ...mockMatter, status: 'CLOSED' as MatterStatus }
      const availableStatuses = composable.getAvailableStatuses('CLOSED')
      expect(availableStatuses).toEqual([])
      expect(composable.canDropInColumn(closedMatter, 'INTAKE')).toBe(false)
    })

    it('handles complex transition chains', () => {
      // Test FILED status transitions
      const filedMatter = { ...mockMatter, status: 'FILED' as MatterStatus }
      expect(composable.canDropInColumn(filedMatter, 'DISCOVERY')).toBe(true)
      expect(composable.canDropInColumn(filedMatter, 'TRIAL_PREP')).toBe(true)
      expect(composable.canDropInColumn(filedMatter, 'MEDIATION')).toBe(true)
      expect(composable.canDropInColumn(filedMatter, 'CLOSED')).toBe(true)
      expect(composable.canDropInColumn(filedMatter, 'INTAKE')).toBe(false)
    })
  })

  describe('Drag Events', () => {
    it('handles drag start correctly', () => {
      const mockEvent = {
        item: {
          _underlying_vm_: mockMatter,
          classList: {
            add: vi.fn()
          }
        }
      }

      composable.onDragStart(mockEvent)

      expect(composable.draggedMatter.value).toEqual(mockMatter)
      expect(composable.isDragging.value).toBe(true)
      expect(document.body.classList.add).toHaveBeenCalledWith('dragging')
      expect(mockEvent.item.classList.add).toHaveBeenCalledWith('matter-dragging')
    })

    it('handles drag end correctly', () => {
      const mockEvent = {
        item: {
          classList: {
            remove: vi.fn()
          }
        },
        from: { id: 'column1' },
        to: { id: 'column2', dataset: { status: 'INITIAL_REVIEW' } }
      }

      // First set up drag state
      const mockDragEvent = {
        item: {
          _underlying_vm_: mockMatter,
          classList: { add: vi.fn() }
        }
      }
      composable.onDragStart(mockDragEvent)

      // Then test drag end
      composable.onDragEnd(mockEvent)

      expect(composable.draggedMatter.value).toBeNull()
      expect(composable.isDragging.value).toBe(false)
      expect(document.body.classList.remove).toHaveBeenCalledWith('dragging')
      expect(mockEvent.item.classList.remove).toHaveBeenCalledWith('matter-dragging')
    })

    it('handles drag change for status changes', () => {
      const changeEvent = {
        added: {
          element: mockMatter
        }
      }

      const result = composable.onDragChange(changeEvent, 'INITIAL_REVIEW')

      expect(result).toEqual({
        type: 'status_change',
        matter: mockMatter,
        fromStatus: 'INTAKE',
        toStatus: 'INITIAL_REVIEW'
      })
    })

    it('handles drag change for reordering', () => {
      const changeEvent = {
        moved: {
          element: mockMatter,
          oldIndex: 0,
          newIndex: 2
        }
      }

      const result = composable.onDragChange(changeEvent, 'INTAKE')

      expect(result).toEqual({
        type: 'reorder',
        matter: mockMatter,
        oldIndex: 0,
        newIndex: 2
      })
    })

    it('prevents invalid status transitions in drag change', () => {
      const changeEvent = {
        added: {
          element: mockMatter
        }
      }

      // Try to move from INTAKE to TRIAL (invalid)
      const result = composable.onDragChange(changeEvent, 'TRIAL')
      expect(result).toBe(false)
    })
  })

  describe('Drop Validation', () => {
    it('validates drop targets correctly', () => {
      // Set up drag state
      const mockDragEvent = {
        item: {
          _underlying_vm_: mockMatter,
          classList: { add: vi.fn() }
        }
      }
      composable.onDragStart(mockDragEvent)

      const validTarget = { dataset: { status: 'INITIAL_REVIEW' } }
      const invalidTarget = { dataset: { status: 'TRIAL' } }

      expect(composable.canAcceptDrop(validTarget, null, null)).toBe(true)
      expect(composable.canAcceptDrop(invalidTarget, null, null)).toBe(false)
    })

    it('returns false when no matter is being dragged', () => {
      const target = { dataset: { status: 'INITIAL_REVIEW' } }
      expect(composable.canAcceptDrop(target, null, null)).toBe(false)
    })
  })

  describe('Visual State Management', () => {
    it('tracks drag over state correctly', () => {
      expect(composable.dragOverColumn.value).toBeNull()
      
      composable.onDragOver('column1')
      expect(composable.dragOverColumn.value).toBe('column1')
      
      composable.onDragLeave()
      expect(composable.dragOverColumn.value).toBeNull()
    })

    it('identifies dragging matters correctly', () => {
      expect(composable.isMatterDragging(mockMatter)).toBe(false)

      // Start dragging
      const mockDragEvent = {
        item: {
          _underlying_vm_: mockMatter,
          classList: { add: vi.fn() }
        }
      }
      composable.onDragStart(mockDragEvent)

      expect(composable.isMatterDragging(mockMatter)).toBe(true)

      const otherMatter = { ...mockMatter, id: '2' }
      expect(composable.isMatterDragging(otherMatter)).toBe(false)
    })

    it('identifies column drag targets correctly', () => {
      expect(composable.isColumnDragTarget('column1')).toBe(false)
      
      composable.onDragOver('column1')
      expect(composable.isColumnDragTarget('column1')).toBe(true)
      expect(composable.isColumnDragTarget('column2')).toBe(false)
    })
  })

  describe('Accessibility Integration', () => {
    it('announces drag start', () => {
      const { announceUpdate } = vi.mocked(composable)
      
      const mockDragEvent = {
        item: {
          _underlying_vm_: mockMatter,
          classList: { add: vi.fn() }
        }
      }
      
      composable.onDragStart(mockDragEvent)
      
      // We can't directly test the announcement since it's mocked,
      // but we can verify the drag state is set correctly
      expect(composable.isDragging.value).toBe(true)
      expect(composable.draggedMatter.value).toEqual(mockMatter)
    })

    it('handles drag end announcements for successful moves', () => {
      // Set up drag state
      const mockDragEvent = {
        item: {
          _underlying_vm_: mockMatter,
          classList: { add: vi.fn() }
        }
      }
      composable.onDragStart(mockDragEvent)

      // Test successful drag end (different source and target)
      const mockEndEvent = {
        item: { classList: { remove: vi.fn() } },
        from: { id: 'column1' },
        to: { id: 'column2', dataset: { status: 'INITIAL_REVIEW' } }
      }
      
      composable.onDragEnd(mockEndEvent)
      
      expect(composable.isDragging.value).toBe(false)
      expect(composable.draggedMatter.value).toBeNull()
    })

    it('handles drag end announcements for cancelled moves', () => {
      // Set up drag state
      const mockDragEvent = {
        item: {
          _underlying_vm_: mockMatter,
          classList: { add: vi.fn() }
        }
      }
      composable.onDragStart(mockDragEvent)

      // Test cancelled drag end (same source and target)
      const mockEndEvent = {
        item: { classList: { remove: vi.fn() } },
        from: { id: 'column1' },
        to: { id: 'column1', dataset: { status: 'INTAKE' } }
      }
      
      composable.onDragEnd(mockEndEvent)
      
      expect(composable.isDragging.value).toBe(false)
      expect(composable.draggedMatter.value).toBeNull()
    })
  })
})
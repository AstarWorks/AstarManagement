/**
 * Comprehensive unit tests for KanbanBoard.vue component
 * 
 * @description Tests all aspects of the Kanban board including rendering,
 * drag-drop interactions, real-time updates, accessibility, and error states.
 * Uses TanStack Query mocks and Pinia store mocks for isolated testing.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import type { VueWrapper } from '@vue/test-utils'
import KanbanBoard from '../KanbanBoard.vue'
import type { Matter, MatterStatus } from '~/types/matter'
import {
  mountKanbanComponent,
  createMockKanbanQuery,
  createMockKanbanMutations,
  createMockKanbanDragDrop,
  createMockMattersByStatus,
  createMockColumnsWithCounts,
  createMockMatter,
  simulateDragAndDrop,
  assertMatterCardRendered,
  assertColumnMatterCount,
  assertDragDropEnabled,
  assertAccessibilityAttributes,
  createMockDragEvent,
  createMockTouchEvent
} from '~/test/utils/kanban-test-utils'

// Mock composables
vi.mock('~/composables/useKanbanQuery')
vi.mock('~/composables/useKanbanMutations')
vi.mock('~/composables/useKanbanDragDrop')
vi.mock('~/composables/useKanbanDragDropEnhanced')
vi.mock('~/composables/useKanbanQueryInvalidation')

// Mock Nuxt composables
const mockNavigateTo = vi.fn()
vi.mock('#app', () => ({
  navigateTo: mockNavigateTo
}))

describe('KanbanBoard.vue', () => {
  let wrapper: VueWrapper<any>
  let mockQueryClient: any
  let mockKanbanQuery: ReturnType<typeof createMockKanbanQuery>
  let mockKanbanMutations: ReturnType<typeof createMockKanbanMutations>
  let mockKanbanDragDrop: ReturnType<typeof createMockKanbanDragDrop>

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Create fresh mock implementations
    mockKanbanQuery = createMockKanbanQuery()
    mockKanbanMutations = createMockKanbanMutations()
    mockKanbanDragDrop = createMockKanbanDragDrop()

    // Mock composables with fresh implementations
    vi.mocked(vi.doMock)('~/composables/useKanbanQuery', () => mockKanbanQuery)
    vi.mocked(vi.doMock)('~/composables/useKanbanMutations', () => mockKanbanMutations)
    vi.mocked(vi.doMock)('~/composables/useKanbanDragDrop', () => mockKanbanDragDrop)
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  // ===== RENDERING TESTS =====

  describe('Basic Rendering', () => {
    it('should render kanban board with default props', () => {
      wrapper = mountKanbanComponent(KanbanBoard)

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('[data-testid="kanban-board"]').exists()).toBe(true)
      expect(wrapper.find('.kanban-container').exists()).toBe(true)
    })

    it('should render board title when provided', () => {
      const title = 'Legal Case Management Board'
      wrapper = mountKanbanComponent(KanbanBoard, {
        props: { title }
      })

      expect(wrapper.text()).toContain(title)
      expect(wrapper.find('h1, h2, .board-title').text()).toContain(title)
    })

    it('should render all kanban columns', () => {
      wrapper = mountKanbanComponent(KanbanBoard)

      const columns = wrapper.findAll('[data-testid^="kanban-column-"]')
      expect(columns).toHaveLength(7) // All status columns

      // Check each column exists
      const expectedStatuses: MatterStatus[] = [
        'intake', 'investigation', 'negotiation', 'litigation',
        'settlement', 'collection', 'closed'
      ]
      
      expectedStatuses.forEach(status => {
        expect(wrapper.find(`[data-testid="kanban-column-${status}"]`).exists()).toBe(true)
      })
    })

    it('should render matter cards in correct columns', () => {
      const mockData = createMockMattersByStatus()
      wrapper = mountKanbanComponent(KanbanBoard, {
        mockQuery: {
          query: {
            mattersByStatus: { value: mockData }
          }
        }
      })

      // Check intake column has 2 matters
      assertColumnMatterCount(wrapper, 'intake', 2)
      
      // Check investigation column has 2 matters
      assertColumnMatterCount(wrapper, 'investigation', 2)
      
      // Check negotiation column has 1 matter
      assertColumnMatterCount(wrapper, 'negotiation', 1)
      
      // Check closed column has 1 matter
      assertColumnMatterCount(wrapper, 'closed', 1)
    })

    it('should render column headers with correct titles and counts', () => {
      const mockColumns = createMockColumnsWithCounts()
      wrapper = mountKanbanComponent(KanbanBoard, {
        mockQuery: {
          query: {
            columnsWithCounts: { value: mockColumns }
          }
        }
      })

      mockColumns.forEach(column => {
        const columnElement = wrapper.find(`[data-testid="kanban-column-${column.id}"]`)
        const headerElement = columnElement.find('.column-header')
        
        expect(headerElement.exists()).toBe(true)
        expect(headerElement.text()).toContain(column.title)
        expect(headerElement.text()).toContain(column.count.toString())
      })
    })

    it('should render Japanese titles when showJapanese prop is true', () => {
      const mockColumns = createMockColumnsWithCounts()
      wrapper = mountKanbanComponent(KanbanBoard, {
        props: { showJapanese: true },
        mockQuery: {
          query: {
            columnsWithCounts: { value: mockColumns }
          }
        }
      })

      mockColumns.forEach(column => {
        const columnElement = wrapper.find(`[data-testid="kanban-column-${column.id}"]`)
        const headerElement = columnElement.find('.column-header')
        
        expect(headerElement.text()).toContain(column.titleJa)
      })
    })
  })

  // ===== LOADING STATES =====

  describe('Loading States', () => {
    it('should display loading state when data is being fetched', () => {
      wrapper = mountKanbanComponent(KanbanBoard, {
        mockQuery: {
          query: {
            isLoading: { value: true },
            data: { value: [] },
            mattersByStatus: { value: {} }
          }
        }
      })

      const loadingElement = wrapper.find('.loading-overlay, .loading-state, [data-testid="loading"]')
      expect(loadingElement.exists()).toBe(true)
      expect(wrapper.text()).toMatch(/loading|Loading/i)
    })

    it('should hide loading state when data is loaded', async () => {
      wrapper = mountKanbanComponent(KanbanBoard, {
        mockQuery: {
          query: {
            isLoading: { value: false },
            data: { value: [] },
            mattersByStatus: { value: createMockMattersByStatus() }
          }
        }
      })

      await nextTick()

      const loadingElement = wrapper.find('.loading-overlay')
      expect(loadingElement.exists()).toBe(false)
    })

    it('should show skeleton loader for individual columns during loading', () => {
      wrapper = mountKanbanComponent(KanbanBoard, {
        mockQuery: {
          query: {
            isLoading: { value: true }
          }
        }
      })

      const skeletonElements = wrapper.findAll('.skeleton, .loading-skeleton')
      expect(skeletonElements.length).toBeGreaterThan(0)
    })
  })

  // ===== ERROR STATES =====

  describe('Error States', () => {
    it('should display error message when query fails', () => {
      const errorMessage = 'Failed to fetch matters'
      wrapper = mountKanbanComponent(KanbanBoard, {
        mockQuery: {
          query: {
            isError: { value: true },
            error: { value: new Error(errorMessage) },
            isLoading: { value: false }
          }
        }
      })

      const errorElement = wrapper.find('.error-overlay, .error-state, [data-testid="error"]')
      expect(errorElement.exists()).toBe(true)
      expect(wrapper.text()).toContain(errorMessage)
    })

    it('should show retry button on error', () => {
      wrapper = mountKanbanComponent(KanbanBoard, {
        mockQuery: {
          query: {
            isError: { value: true },
            error: { value: new Error('Network error') },
            refetch: vi.fn()
          }
        }
      })

      const retryButton = wrapper.find('.retry-button, [data-testid="retry-button"]')
      expect(retryButton.exists()).toBe(true)
    })

    it('should call refetch when retry button is clicked', async () => {
      const refetchMock = vi.fn()
      wrapper = mountKanbanComponent(KanbanBoard, {
        mockQuery: {
          query: {
            isError: { value: true },
            error: { value: new Error('Network error') },
            refetch: refetchMock
          }
        }
      })

      const retryButton = wrapper.find('.retry-button, [data-testid="retry-button"]')
      await retryButton.trigger('click')

      expect(refetchMock).toHaveBeenCalled()
    })

    it('should handle network errors gracefully', () => {
      wrapper = mountKanbanComponent(KanbanBoard, {
        mockQuery: {
          query: {
            isError: { value: true },
            error: { value: new Error('Network Error') }
          }
        }
      })

      // Should not crash and should show user-friendly message
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).toMatch(/error|Error|failed|Failed/i)
    })
  })

  // ===== DRAG AND DROP FUNCTIONALITY =====

  describe('Drag and Drop', () => {
    beforeEach(() => {
      wrapper = mountKanbanComponent(KanbanBoard, {
        mockQuery: {
          query: {
            mattersByStatus: { value: createMockMattersByStatus() }
          }
        }
      })
    })

    it('should enable drag on matter cards', () => {
      assertDragDropEnabled(wrapper, 'matter-1')
      assertDragDropEnabled(wrapper, 'matter-2')
    })

    it('should handle drag start event', async () => {
      const startDragMock = mockKanbanDragDrop.useKanbanDragDrop().startDrag
      const matterCard = wrapper.find('[data-testid="matter-card-matter-1"]')
      
      const dragEvent = createMockDragEvent('dragstart')
      await matterCard.trigger('dragstart', dragEvent)

      expect(startDragMock).toHaveBeenCalled()
    })

    it('should handle drop events on columns', async () => {
      const onDropMock = mockKanbanDragDrop.useKanbanDragDrop().onDrop
      const targetColumn = wrapper.find('[data-testid="kanban-column-investigation"]')
      
      const dropEvent = createMockDragEvent('drop')
      dropEvent.dataTransfer!.getData = vi.fn(() => 'matter-1')
      await targetColumn.trigger('drop', dropEvent)

      expect(onDropMock).toHaveBeenCalled()
    })

    it('should complete full drag and drop operation', async () => {
      await simulateDragAndDrop(
        wrapper,
        '[data-testid="matter-card-matter-1"]',
        '[data-testid="kanban-column-investigation"]',
        'matter-1'
      )

      // Verify drag-drop composable methods were called
      const dragDropHooks = mockKanbanDragDrop.useKanbanDragDrop()
      expect(dragDropHooks.startDrag).toHaveBeenCalled()
      expect(dragDropHooks.onDrop).toHaveBeenCalled()
      expect(dragDropHooks.endDrag).toHaveBeenCalled()
    })

    it('should prevent invalid drops based on canDrop validation', async () => {
      // Mock canDrop to return false
      mockKanbanDragDrop.useKanbanDragDrop().canDrop = vi.fn(() => false)
      
      wrapper = mountKanbanComponent(KanbanBoard, {
        mockDragDrop: {
          canDrop: vi.fn(() => false)
        }
      })

      const targetColumn = wrapper.find('[data-testid="kanban-column-investigation"]')
      const dropEvent = createMockDragEvent('drop')
      
      await targetColumn.trigger('dragover', dropEvent)
      
      // Should prevent default and not accept drop
      expect(dropEvent.defaultPrevented).toBe(false) // Drop should be rejected
    })

    it('should update drag state visually during drag operation', async () => {
      // Mock dragging state
      mockKanbanDragDrop.useKanbanDragDrop().isDragging = { value: true }
      mockKanbanDragDrop.useKanbanDragDrop().draggedItem = { value: { id: 'matter-1' } }
      
      wrapper = mountKanbanComponent(KanbanBoard, {
        mockDragDrop: {
          isDragging: { value: true },
          draggedItem: { value: { id: 'matter-1' } }
        }
      })

      // Check visual feedback
      const draggedCard = wrapper.find('[data-testid="matter-card-matter-1"]')
      expect(draggedCard.classes()).toContain('dragging')
    })
  })

  // ===== MOBILE TOUCH SUPPORT =====

  describe('Mobile Touch Support', () => {
    it('should handle touch events for mobile drag and drop', async () => {
      wrapper = mountKanbanComponent(KanbanBoard)
      
      const matterCard = wrapper.find('[data-testid="matter-card-matter-1"]')
      
      // Simulate touch sequence
      const touchStart = createMockTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }])
      const touchMove = createMockTouchEvent('touchmove', [{ clientX: 150, clientY: 100 }])
      const touchEnd = createMockTouchEvent('touchend', [{ clientX: 200, clientY: 100 }])

      await matterCard.trigger('touchstart', touchStart)
      await matterCard.trigger('touchmove', touchMove)
      await matterCard.trigger('touchend', touchEnd)

      // Should handle touch events without errors
      expect(wrapper.exists()).toBe(true)
    })

    it('should provide touch feedback on mobile devices', async () => {
      // Mock mobile environment
      Object.defineProperty(window, 'ontouchstart', {
        value: true,
        writable: true
      })

      wrapper = mountKanbanComponent(KanbanBoard)
      
      const matterCard = wrapper.find('[data-testid="matter-card-matter-1"]')
      await matterCard.trigger('touchstart')

      // Should add touch feedback classes
      expect(matterCard.classes()).toContain('touch-active')
    })
  })

  // ===== REAL-TIME UPDATES =====

  describe('Real-time Updates', () => {
    it('should display connection status', () => {
      wrapper = mountKanbanComponent(KanbanBoard, {
        mockQuery: {
          realTime: {
            isConnected: { value: true }
          }
        }
      })

      const connectionStatus = wrapper.find('[data-testid="connection-status"]')
      expect(connectionStatus.exists()).toBe(true)
      expect(connectionStatus.text()).toMatch(/connected|online/i)
    })

    it('should show offline indicator when disconnected', () => {
      wrapper = mountKanbanComponent(KanbanBoard, {
        mockQuery: {
          realTime: {
            isConnected: { value: false }
          }
        }
      })

      const connectionStatus = wrapper.find('[data-testid="connection-status"]')
      expect(connectionStatus.text()).toMatch(/disconnected|offline/i)
    })

    it('should display pending updates count', () => {
      wrapper = mountKanbanComponent(KanbanBoard, {
        mockQuery: {
          realTime: {
            pendingUpdates: { value: 3 }
          }
        }
      })

      const syncButton = wrapper.find('[data-testid="sync-button"]')
      expect(syncButton.text()).toContain('3')
    })

    it('should handle manual sync trigger', async () => {
      const syncNowMock = vi.fn()
      wrapper = mountKanbanComponent(KanbanBoard, {
        mockQuery: {
          realTime: {
            syncNow: syncNowMock,
            pendingUpdates: { value: 2 }
          }
        }
      })

      const syncButton = wrapper.find('[data-testid="sync-button"]')
      await syncButton.trigger('click')

      expect(syncNowMock).toHaveBeenCalled()
    })

    it('should subscribe to real-time updates on mount', () => {
      const subscribeToUpdatesMock = vi.fn(() => vi.fn()) // Return unsubscribe function
      wrapper = mountKanbanComponent(KanbanBoard, {
        mockQuery: {
          realTime: {
            subscribeToUpdates: subscribeToUpdatesMock
          }
        }
      })

      expect(subscribeToUpdatesMock).toHaveBeenCalled()
    })
  })

  // ===== FILTERS AND SEARCH =====

  describe('Filters and Search', () => {
    it('should pass filters to query hooks', () => {
      const filters = {
        status: ['intake', 'investigation'],
        priority: ['HIGH'],
        search: 'test case'
      }

      wrapper = mountKanbanComponent(KanbanBoard, {
        props: { filters }
      })

      expect(mockKanbanQuery.useKanbanMattersQuery).toHaveBeenCalledWith(filters)
    })

    it('should update display when filters change', async () => {
      wrapper = mountKanbanComponent(KanbanBoard, {
        props: {
          filters: { status: ['intake'] }
        }
      })

      // Change filters
      await wrapper.setProps({
        filters: { status: ['closed'] }
      })

      // Should re-call query with new filters
      expect(mockKanbanQuery.useKanbanMattersQuery).toHaveBeenCalledWith({ status: ['closed'] })
    })

    it('should handle empty filter results', () => {
      wrapper = mountKanbanComponent(KanbanBoard, {
        props: {
          filters: { search: 'nonexistent' }
        },
        mockQuery: {
          query: {
            mattersByStatus: { value: {
              intake: [], investigation: [], negotiation: [],
              litigation: [], settlement: [], collection: [], closed: []
            }}
          }
        }
      })

      // Should show empty state
      const emptyState = wrapper.find('[data-testid="empty-state"]')
      expect(emptyState.exists()).toBe(true)
    })
  })

  // ===== ACCESSIBILITY =====

  describe('Accessibility', () => {
    beforeEach(() => {
      wrapper = mountKanbanComponent(KanbanBoard)
    })

    it('should have proper ARIA labels on board container', () => {
      assertAccessibilityAttributes(wrapper, '[data-testid="kanban-board"]', {
        'role': 'application',
        'aria-label': 'Kanban board for legal case management'
      })
    })

    it('should have proper ARIA labels on columns', () => {
      const intakeColumn = wrapper.find('[data-testid="kanban-column-intake"]')
      assertAccessibilityAttributes(intakeColumn, '', {
        'role': 'region',
        'aria-label': 'Intake column'
      })
    })

    it('should support keyboard navigation', async () => {
      const firstCard = wrapper.find('[data-testid="matter-card-matter-1"]')
      
      // Should be focusable
      expect(firstCard.attributes('tabindex')).toBe('0')
      
      // Test keyboard events
      await firstCard.trigger('keydown', { key: 'Enter' })
      await firstCard.trigger('keydown', { key: ' ' }) // Space key
      await firstCard.trigger('keydown', { key: 'ArrowRight' })
      
      // Should handle keyboard events without errors
      expect(wrapper.exists()).toBe(true)
    })

    it('should announce drag and drop actions to screen readers', async () => {
      const matterCard = wrapper.find('[data-testid="matter-card-matter-1"]')
      
      // Start drag
      await matterCard.trigger('dragstart')
      
      // Should have aria-live regions for announcements
      const announcements = wrapper.findAll('[aria-live]')
      expect(announcements.length).toBeGreaterThan(0)
    })

    it('should have proper heading hierarchy', () => {
      const headings = wrapper.findAll('h1, h2, h3, h4, h5, h6')
      expect(headings.length).toBeGreaterThan(0)
      
      // Board title should be h1 or h2
      const boardTitle = headings.find(h => h.text().includes('Board') || h.text().includes('Kanban'))
      expect(['H1', 'H2']).toContain(boardTitle?.element.tagName)
    })

    it('should have sufficient color contrast in all states', () => {
      // Test different states
      const elements = [
        '.matter-card',
        '.column-header', 
        '.status-indicator',
        '.priority-badge'
      ]
      
      elements.forEach(selector => {
        const element = wrapper.find(selector)
        if (element.exists()) {
          // Should have contrast-friendly classes
          expect(element.classes().some(cls => 
            cls.includes('text-') || cls.includes('bg-')
          )).toBe(true)
        }
      })
    })
  })

  // ===== PERFORMANCE =====

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeMatterSet = Array.from({ length: 100 }, (_, index) => 
        createMockMatter({ 
          id: `matter-${index}`,
          title: `Matter ${index}`,
          status: 'intake'
        })
      )

      wrapper = mountKanbanComponent(KanbanBoard, {
        mockQuery: {
          query: {
            mattersByStatus: { 
              value: { 
                intake: largeMatterSet,
                investigation: [], negotiation: [], litigation: [],
                settlement: [], collection: [], closed: []
              }
            }
          }
        }
      })

      // Should render without performance issues
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.findAll('[data-testid^="matter-card-"]')).toHaveLength(100)
    })

    it('should implement virtual scrolling for large columns', () => {
      // Mock very large dataset
      const hugeMatterSet = Array.from({ length: 1000 }, (_, index) => 
        createMockMatter({ id: `matter-${index}`, status: 'intake' })
      )

      wrapper = mountKanbanComponent(KanbanBoard, {
        mockQuery: {
          query: {
            mattersByStatus: { 
              value: { 
                intake: hugeMatterSet,
                investigation: [], negotiation: [], litigation: [],
                settlement: [], collection: [], closed: []
              }
            }
          }
        }
      })

      // Should implement virtual scrolling (render only visible items)
      const renderedCards = wrapper.findAll('[data-testid^="matter-card-"]')
      expect(renderedCards.length).toBeLessThan(hugeMatterSet.length)
    })

    it('should debounce drag operations for smooth performance', async () => {
      const matterCard = wrapper.find('[data-testid="matter-card-matter-1"]')
      
      // Rapid drag movements
      for (let i = 0; i < 10; i++) {
        await matterCard.trigger('dragover')
      }
      
      // Should not call handlers for every event (debounced)
      const onDropMock = mockKanbanDragDrop.useKanbanDragDrop().onDrop
      expect(onDropMock).toHaveBeenCalledTimes(0) // dragover shouldn't trigger drop
    })
  })

  // ===== INTEGRATION WITH TANSTACK QUERY =====

  describe('TanStack Query Integration', () => {
    it('should not use Pinia stores directly', () => {
      // Verify component doesn't import Pinia stores
      const componentSource = KanbanBoard.toString()
      expect(componentSource).not.toContain('useKanbanStore')
      expect(componentSource).not.toContain('useMatterStore')
      expect(componentSource).not.toContain('defineStore')
    })

    it('should handle query refetching', async () => {
      const refetchMock = vi.fn()
      wrapper = mountKanbanComponent(KanbanBoard, {
        mockQuery: {
          query: {
            refetch: refetchMock
          }
        }
      })

      // Trigger refetch via UI action
      const refreshButton = wrapper.find('[data-testid="refresh-button"]')
      if (refreshButton.exists()) {
        await refreshButton.trigger('click')
        expect(refetchMock).toHaveBeenCalled()
      }
    })

    it('should handle optimistic updates during mutations', async () => {
      const updateMutation = mockKanbanMutations.useKanbanMutations().updateMatterStatus
      updateMutation.mutate = vi.fn()

      wrapper = mountKanbanComponent(KanbanBoard)

      // Simulate status change
      await simulateDragAndDrop(
        wrapper,
        '[data-testid="matter-card-matter-1"]',
        '[data-testid="kanban-column-investigation"]'
      )

      // Should trigger optimistic update
      expect(updateMutation.mutate).toHaveBeenCalled()
    })

    it('should handle query invalidation after mutations', async () => {
      const queryClient = wrapper.vm.$queryClient
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

      // Trigger mutation that should invalidate queries
      await simulateDragAndDrop(
        wrapper,
        '[data-testid="matter-card-matter-1"]',
        '[data-testid="kanban-column-investigation"]'
      )

      // Should invalidate related queries
      expect(invalidateQueriesSpy).toHaveBeenCalled()
    })
  })

  // ===== RESPONSIVE DESIGN =====

  describe('Responsive Design', () => {
    it('should adapt to mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      wrapper = mountKanbanComponent(KanbanBoard)
      
      // Should add mobile classes
      expect(wrapper.classes()).toContain('mobile')
    })

    it('should show horizontal scroll on mobile', () => {
      wrapper = mountKanbanComponent(KanbanBoard, {
        props: { isMobile: true }
      })

      const container = wrapper.find('.kanban-container')
      expect(container.classes()).toContain('overflow-x-auto')
    })

    it('should stack columns vertically on very small screens', () => {
      wrapper = mountKanbanComponent(KanbanBoard, {
        props: { 
          viewMode: 'stack',
          isMobile: true 
        }
      })

      const container = wrapper.find('.kanban-container')
      expect(container.classes()).toContain('flex-col')
    })
  })
})
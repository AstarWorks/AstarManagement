/**
 * Comprehensive unit tests for KanbanColumn.vue component
 * 
 * @description Tests column rendering, drag-drop acceptance logic,
 * matter card management, and accessibility features for Kanban columns.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import type { VueWrapper } from '@vue/test-utils'
import KanbanColumn from '../KanbanColumn.vue'
import type { MatterStatus, MatterCard } from '~/types/matter'
import {
  mountKanbanComponent,
  createMockMatterCard,
  createMockDragEvent,
  createMockTouchEvent,
  assertMatterCardRendered,
  assertDragDropEnabled,
  assertAccessibilityAttributes,
  simulateDragAndDrop
} from '~/test/utils/kanban-test-utils'

// Mock drag and drop composables
vi.mock('~/composables/useKanbanDragDrop')
vi.mock('~/composables/useKanbanDragDropEnhanced')

describe('KanbanColumn.vue', () => {
  let wrapper: VueWrapper<any>
  const defaultProps = {
    status: 'investigation' as MatterStatus,
    title: 'Investigation',
    titleJa: '調査',
    matters: [
      createMockMatterCard({ 
        id: 'matter-1', 
        title: 'Case Investigation', 
        status: 'investigation',
        position: 0 
      }),
      createMockMatterCard({ 
        id: 'matter-2', 
        title: 'Evidence Review', 
        status: 'investigation',
        position: 1 
      })
    ] as MatterCard[],
    count: 2,
    showJapanese: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  // ===== BASIC RENDERING =====

  describe('Basic Rendering', () => {
    it('should render column with correct status', () => {
      wrapper = mountKanbanComponent(KanbanColumn, {
        props: defaultProps
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find(`[data-testid="kanban-column-${defaultProps.status}"]`).exists()).toBe(true)
      expect(wrapper.attributes('data-status')).toBe(defaultProps.status)
    })

    it('should display column title in header', () => {
      wrapper = mountKanbanComponent(KanbanColumn, {
        props: defaultProps
      })

      const header = wrapper.find('.column-header')
      expect(header.exists()).toBe(true)
      expect(header.text()).toContain(defaultProps.title)
    })

    it('should display Japanese title when showJapanese is true', () => {
      wrapper = mountKanbanComponent(KanbanColumn, {
        props: {
          ...defaultProps,
          showJapanese: true
        }
      })

      const header = wrapper.find('.column-header')
      expect(header.text()).toContain(defaultProps.titleJa)
    })

    it('should display matter count in header', () => {
      wrapper = mountKanbanComponent(KanbanColumn, {
        props: defaultProps
      })

      const header = wrapper.find('.column-header')
      expect(header.text()).toContain(defaultProps.count.toString())
      expect(header.text()).toMatch(/\(2\)|\b2\b/)
    })

    it('should render correct number of matter cards', () => {
      wrapper = mountKanbanComponent(KanbanColumn, {
        props: defaultProps
      })

      const matterCards = wrapper.findAll('[data-testid^="matter-card-"]')
      expect(matterCards).toHaveLength(defaultProps.matters.length)
    })

    it('should render matter cards in correct order', () => {
      const sortedMatters = [
        createMockMatterCard({ id: 'matter-1', position: 0, title: 'First Matter' }),
        createMockMatterCard({ id: 'matter-2', position: 1, title: 'Second Matter' }),
        createMockMatterCard({ id: 'matter-3', position: 2, title: 'Third Matter' })
      ]

      wrapper = mountKanbanComponent(KanbanColumn, {
        props: {
          ...defaultProps,
          matters: sortedMatters
        }
      })

      const matterCards = wrapper.findAll('[data-testid^="matter-card-"]')
      expect(matterCards[0].text()).toContain('First Matter')
      expect(matterCards[1].text()).toContain('Second Matter')
      expect(matterCards[2].text()).toContain('Third Matter')
    })
  })

  // ===== EMPTY STATES =====

  describe('Empty States', () => {
    it('should show empty state when no matters', () => {
      wrapper = mountKanbanComponent(KanbanColumn, {
        props: {
          ...defaultProps,
          matters: [],
          count: 0
        }
      })

      const emptyState = wrapper.find('.empty-state, [data-testid="empty-column"]')
      expect(emptyState.exists()).toBe(true)
      expect(wrapper.text()).toMatch(/empty|no matters|add matter/i)
    })

    it('should display appropriate empty state message', () => {
      wrapper = mountKanbanComponent(KanbanColumn, {
        props: {
          ...defaultProps,
          matters: [],
          count: 0
        }
      })

      const emptyMessage = wrapper.find('.empty-message')
      expect(emptyMessage.text()).toMatch(/drop matters here|no items/i)
    })

    it('should show add button in empty state', () => {
      wrapper = mountKanbanComponent(KanbanColumn, {
        props: {
          ...defaultProps,
          matters: [],
          count: 0
        }
      })

      const addButton = wrapper.find('[data-testid="add-matter-button"]')
      expect(addButton.exists()).toBe(true)
    })

    it('should emit add-matter event when add button clicked', async () => {
      wrapper = mountKanbanComponent(KanbanColumn, {
        props: {
          ...defaultProps,
          matters: [],
          count: 0
        }
      })

      const addButton = wrapper.find('[data-testid="add-matter-button"]')
      await addButton.trigger('click')

      expect(wrapper.emitted('add-matter')).toBeTruthy()
      expect(wrapper.emitted('add-matter')?.[0]).toEqual([defaultProps.status])
    })
  })

  // ===== DRAG AND DROP ACCEPTANCE =====

  describe('Drag and Drop Acceptance', () => {
    beforeEach(() => {
      wrapper = mountKanbanComponent(KanbanColumn, {
        props: defaultProps
      })
    })

    it('should accept dragover events', async () => {
      const dropZone = wrapper.find('.drop-zone, [data-testid="drop-zone"]')
      const dragOverEvent = createMockDragEvent('dragover')
      
      await dropZone.trigger('dragover', dragOverEvent)
      
      expect(dragOverEvent.defaultPrevented).toBe(true)
    })

    it('should highlight drop zone during dragover', async () => {
      const dropZone = wrapper.find('.drop-zone, [data-testid="drop-zone"]')
      const dragOverEvent = createMockDragEvent('dragover')
      
      await dropZone.trigger('dragover', dragOverEvent)
      await nextTick()
      
      expect(dropZone.classes()).toContain('drag-over')
    })

    it('should remove highlight on dragleave', async () => {
      const dropZone = wrapper.find('.drop-zone, [data-testid="drop-zone"]')
      
      // Enter drag over state
      await dropZone.trigger('dragover', createMockDragEvent('dragover'))
      await nextTick()
      expect(dropZone.classes()).toContain('drag-over')
      
      // Leave drag over state
      await dropZone.trigger('dragleave', createMockDragEvent('dragleave'))
      await nextTick()
      expect(dropZone.classes()).not.toContain('drag-over')
    })

    it('should handle drop events and emit matter-dropped', async () => {
      const dropZone = wrapper.find('.drop-zone, [data-testid="drop-zone"]')
      const dropEvent = createMockDragEvent('drop')
      const matterId = 'matter-3'
      
      dropEvent.dataTransfer!.getData = vi.fn(() => matterId)
      await dropZone.trigger('drop', dropEvent)
      
      expect(wrapper.emitted('matter-dropped')).toBeTruthy()
      expect(wrapper.emitted('matter-dropped')?.[0]).toEqual([{
        matterId,
        targetStatus: defaultProps.status,
        targetPosition: defaultProps.matters.length
      }])
    })

    it('should calculate correct drop position based on cursor position', async () => {
      wrapper = mountKanbanComponent(KanbanColumn, {
        props: {
          ...defaultProps,
          matters: [
            createMockMatterCard({ id: 'matter-1', position: 0 }),
            createMockMatterCard({ id: 'matter-2', position: 1 }),
            createMockMatterCard({ id: 'matter-3', position: 2 })
          ]
        }
      })

      const dropZone = wrapper.find('.drop-zone')
      const dropEvent = createMockDragEvent('drop')
      
      // Mock getBoundingClientRect for position calculation
      const mockCard = wrapper.find('[data-testid="matter-card-matter-2"]')
      vi.spyOn(mockCard.element, 'getBoundingClientRect').mockReturnValue({
        top: 100,
        bottom: 150,
        left: 0,
        right: 300,
        height: 50,
        width: 300
      } as DOMRect)
      
      // Drop in middle of second card (should insert at position 1)
      Object.defineProperty(dropEvent, 'clientY', { value: 125 })
      dropEvent.dataTransfer!.getData = vi.fn(() => 'matter-new')
      
      await dropZone.trigger('drop', dropEvent)
      
      expect(wrapper.emitted('matter-dropped')?.[0][0].targetPosition).toBe(1)
    })

    it('should validate drop based on business rules', async () => {
      // Mock canDrop validation
      const mockCanDrop = vi.fn(() => false)
      
      wrapper = mountKanbanComponent(KanbanColumn, {
        props: defaultProps,
        mockDragDrop: {
          canDrop: mockCanDrop
        }
      })

      const dropZone = wrapper.find('.drop-zone')
      const dropEvent = createMockDragEvent('drop')
      dropEvent.dataTransfer!.getData = vi.fn(() => 'matter-invalid')
      
      await dropZone.trigger('drop', dropEvent)
      
      // Should not emit matter-dropped for invalid drops
      expect(wrapper.emitted('matter-dropped')).toBeFalsy()
    })
  })

  // ===== ACCESSIBILITY =====

  describe('Accessibility', () => {
    beforeEach(() => {
      wrapper = mountKanbanComponent(KanbanColumn, {
        props: defaultProps
      })
    })

    it('should have proper ARIA labels', () => {
      assertAccessibilityAttributes(wrapper, `[data-testid="kanban-column-${defaultProps.status}"]`, {
        'role': 'region',
        'aria-label': `${defaultProps.title} column with ${defaultProps.count} matters`
      })
    })

    it('should have proper heading hierarchy', () => {
      const columnHeader = wrapper.find('.column-header h2, .column-header h3')
      expect(columnHeader.exists()).toBe(true)
      expect(columnHeader.text()).toContain(defaultProps.title)
    })

    it('should announce drop zone to screen readers', () => {
      const dropZone = wrapper.find('.drop-zone')
      assertAccessibilityAttributes(dropZone, '', {
        'role': 'group',
        'aria-label': 'Drop zone for investigation matters'
      })
    })

    it('should support keyboard navigation for column actions', async () => {
      const menuButton = wrapper.find('[data-testid="column-menu-button"]')
      
      // Should be focusable
      expect(menuButton.attributes('tabindex')).toBe('0')
      
      // Test keyboard activation
      await menuButton.trigger('keydown', { key: 'Enter' })
      await menuButton.trigger('keydown', { key: ' ' })
      
      const menu = wrapper.find('[data-testid="column-menu"]')
      expect(menu.isVisible()).toBe(true)
    })

    it('should have proper ARIA live regions for dynamic updates', () => {
      const liveRegion = wrapper.find('[aria-live]')
      expect(liveRegion.exists()).toBe(true)
      expect(['polite', 'assertive']).toContain(liveRegion.attributes('aria-live'))
    })
  })

  // ===== PERFORMANCE =====

  describe('Performance', () => {
    it('should handle large numbers of matters efficiently', () => {
      const manyMatters = Array.from({ length: 50 }, (_, index) => 
        createMockMatterCard({ 
          id: `matter-${index}`,
          title: `Matter ${index}`,
          position: index 
        })
      )

      wrapper = mountKanbanComponent(KanbanColumn, {
        props: {
          ...defaultProps,
          matters: manyMatters,
          count: manyMatters.length
        }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.findAll('[data-testid^="matter-card-"]')).toHaveLength(50)
    })

    it('should implement virtual scrolling for very large columns', () => {
      const hugeMatterList = Array.from({ length: 200 }, (_, index) => 
        createMockMatterCard({ id: `matter-${index}`, position: index })
      )

      wrapper = mountKanbanComponent(KanbanColumn, {
        props: {
          ...defaultProps,
          matters: hugeMatterList,
          enableVirtualScrolling: true
        }
      })

      // Should render only visible items
      const renderedCards = wrapper.findAll('[data-testid^="matter-card-"]')
      expect(renderedCards.length).toBeLessThan(hugeMatterList.length)
      expect(renderedCards.length).toBeLessThanOrEqual(20) // Typical viewport
    })
  })
})
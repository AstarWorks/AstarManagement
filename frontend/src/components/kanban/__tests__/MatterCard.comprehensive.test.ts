/**
 * Comprehensive unit tests for MatterCard.vue component
 * 
 * @description Tests matter card rendering, interactions, drag-drop behavior,
 * accessibility features, and all display states for legal case management.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import type { VueWrapper } from '@vue/test-utils'
import MatterCard from '../MatterCard.vue'
import type { MatterCard as MatterCardType, MatterPriority } from '~/types/matter'
import {
  mountKanbanComponent,
  createMockMatterCard,
  createMockDragEvent,
  createMockTouchEvent,
  assertAccessibilityAttributes,
  assertDragDropEnabled
} from '~/test/utils/kanban-test-utils'

// Mock composables
vi.mock('~/composables/useKanbanMutations')
vi.mock('~/composables/useKanbanDragDrop')

// Mock Nuxt composables
const mockNavigateTo = vi.fn()
vi.mock('#app', () => ({
  navigateTo: mockNavigateTo
}))

describe('MatterCard.vue', () => {
  let wrapper: VueWrapper<any>
  const defaultMatter = createMockMatterCard({
    id: 'matter-1',
    caseNumber: 'CASE-001',
    title: 'Personal Injury Case',
    titleJa: '人身傷害事件',
    clientName: 'John Doe',
    clientNameJa: 'ジョン・ドウ',
    status: 'investigation',
    priority: 'HIGH',
    description: 'Motor vehicle accident case',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    assignedTo: 'lawyer-1',
    tags: ['motor-vehicle', 'personal-injury'],
    estimatedHours: 40,
    billableRate: 350,
    position: 0,
    isDragging: false,
    isDropTarget: false
  })

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
    it('should render matter card with essential information', () => {
      wrapper = mountKanbanComponent(MatterCard, {
        props: { matter: defaultMatter }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find(`[data-testid="matter-card-${defaultMatter.id}"]`).exists()).toBe(true)
      
      // Check essential content
      expect(wrapper.text()).toContain(defaultMatter.caseNumber)
      expect(wrapper.text()).toContain(defaultMatter.title)
      expect(wrapper.text()).toContain(defaultMatter.clientName)
    })

    it('should display Japanese text when showJapanese is true', () => {
      wrapper = mountKanbanComponent(MatterCard, {
        props: { 
          matter: defaultMatter,
          showJapanese: true 
        }
      })

      expect(wrapper.text()).toContain(defaultMatter.titleJa)
      expect(wrapper.text()).toContain(defaultMatter.clientNameJa)
    })

    it('should display priority badge with correct styling', () => {
      wrapper = mountKanbanComponent(MatterCard, {
        props: { matter: defaultMatter }
      })

      const priorityBadge = wrapper.find(`[data-testid="priority-badge"]`)
      expect(priorityBadge.exists()).toBe(true)
      expect(priorityBadge.text()).toContain('HIGH')
      expect(priorityBadge.classes()).toContain('priority-high')
    })

    it('should display due date when present', () => {
      wrapper = mountKanbanComponent(MatterCard, {
        props: { matter: defaultMatter }
      })

      const dueDate = wrapper.find('[data-testid="due-date"]')
      expect(dueDate.exists()).toBe(true)
      
      // Should format date appropriately
      const dueDateText = dueDate.text()
      expect(dueDateText).toMatch(/\d{1,2}\/\d{1,2}|\d{4}-\d{2}-\d{2}/)
    })

    it('should display assignee information', () => {
      wrapper = mountKanbanComponent(MatterCard, {
        props: { matter: defaultMatter }
      })

      const assignee = wrapper.find('[data-testid="assignee"]')
      expect(assignee.exists()).toBe(true)
      expect(assignee.text()).toContain(defaultMatter.assignedTo)
    })

    it('should render tags when present', () => {
      wrapper = mountKanbanComponent(MatterCard, {
        props: { matter: defaultMatter }
      })

      const tags = wrapper.findAll('[data-testid^="tag-"]')
      expect(tags).toHaveLength(defaultMatter.tags!.length)
      
      defaultMatter.tags!.forEach((tag, index) => {
        expect(tags[index].text()).toContain(tag)
      })
    })

    it('should show estimated hours and billable rate', () => {
      wrapper = mountKanbanComponent(MatterCard, {
        props: { matter: defaultMatter }
      })

      const estimatedHours = wrapper.find('[data-testid="estimated-hours"]')
      expect(estimatedHours.text()).toContain('40')
      
      const billableRate = wrapper.find('[data-testid="billable-rate"]')
      expect(billableRate.text()).toContain('350')
    })
  })

  // ===== PRIORITY VARIANTS =====

  describe('Priority Variants', () => {
    const priorities: MatterPriority[] = ['LOW', 'MEDIUM', 'HIGH']

    priorities.forEach(priority => {
      it(`should render ${priority} priority correctly`, () => {
        const matterWithPriority = { ...defaultMatter, priority }
        wrapper = mountKanbanComponent(MatterCard, {
          props: { matter: matterWithPriority }
        })

        const priorityBadge = wrapper.find('[data-testid="priority-badge"]')
        expect(priorityBadge.text()).toContain(priority)
        expect(priorityBadge.classes()).toContain(`priority-${priority.toLowerCase()}`)
      })
    })

    it('should apply urgent styling for high priority overdue items', () => {
      const overdueHighPriorityMatter = {
        ...defaultMatter,
        priority: 'HIGH' as MatterPriority,
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
      }

      wrapper = mountKanbanComponent(MatterCard, {
        props: { matter: overdueHighPriorityMatter }
      })

      const card = wrapper.find(`[data-testid="matter-card-${defaultMatter.id}"]`)
      expect(card.classes()).toContain('urgent')
      expect(card.classes()).toContain('overdue')
    })
  })

  // ===== INTERACTION STATES =====

  describe('Interaction States', () => {
    it('should apply dragging styles when isDragging is true', () => {
      const draggingMatter = { ...defaultMatter, isDragging: true }
      wrapper = mountKanbanComponent(MatterCard, {
        props: { matter: draggingMatter }
      })

      const card = wrapper.find(`[data-testid="matter-card-${defaultMatter.id}"]`)
      expect(card.classes()).toContain('dragging')
    })

    it('should apply drop target styles when isDropTarget is true', () => {
      const dropTargetMatter = { ...defaultMatter, isDropTarget: true }
      wrapper = mountKanbanComponent(MatterCard, {
        props: { matter: dropTargetMatter }
      })

      const card = wrapper.find(`[data-testid="matter-card-${defaultMatter.id}"]`)
      expect(card.classes()).toContain('drop-target')
    })

    it('should show hover state on mouse over', async () => {
      wrapper = mountKanbanComponent(MatterCard, {
        props: { matter: defaultMatter }
      })

      const card = wrapper.find(`[data-testid="matter-card-${defaultMatter.id}"]`)
      await card.trigger('mouseenter')

      expect(card.classes()).toContain('hover')
    })

    it('should remove hover state on mouse leave', async () => {
      wrapper = mountKanbanComponent(MatterCard, {
        props: { matter: defaultMatter }
      })

      const card = wrapper.find(`[data-testid="matter-card-${defaultMatter.id}"]`)
      await card.trigger('mouseenter')
      await card.trigger('mouseleave')

      expect(card.classes()).not.toContain('hover')
    })

    it('should apply focus state on keyboard focus', async () => {
      wrapper = mountKanbanComponent(MatterCard, {
        props: { matter: defaultMatter }
      })

      const card = wrapper.find(`[data-testid="matter-card-${defaultMatter.id}"]`)
      await card.trigger('focus')

      expect(card.classes()).toContain('focused')
    })
  })

  // ===== DRAG AND DROP BEHAVIOR =====

  describe('Drag and Drop Behavior', () => {
    beforeEach(() => {
      wrapper = mountKanbanComponent(MatterCard, {
        props: { matter: defaultMatter }
      })
    })

    it('should be draggable', () => {
      assertDragDropEnabled(wrapper, defaultMatter.id)
    })

    it('should handle drag start event', async () => {
      const card = wrapper.find(`[data-testid="matter-card-${defaultMatter.id}"]`)
      const dragStartEvent = createMockDragEvent('dragstart')
      
      await card.trigger('dragstart', dragStartEvent)
      
      expect(dragStartEvent.dataTransfer!.setData).toHaveBeenCalledWith('text/plain', defaultMatter.id)
      expect(wrapper.emitted('drag-start')).toBeTruthy()
    })

    it('should handle drag end event', async () => {
      const card = wrapper.find(`[data-testid="matter-card-${defaultMatter.id}"]`)
      const dragEndEvent = createMockDragEvent('dragend')
      
      await card.trigger('dragend', dragEndEvent)
      
      expect(wrapper.emitted('drag-end')).toBeTruthy()
    })

    it('should set drag image on drag start', async () => {
      const card = wrapper.find(`[data-testid="matter-card-${defaultMatter.id}"]`)
      const dragStartEvent = createMockDragEvent('dragstart')
      
      await card.trigger('dragstart', dragStartEvent)
      
      expect(dragStartEvent.dataTransfer!.setDragImage).toHaveBeenCalled()
    })

    it('should handle touch-based drag on mobile', async () => {
      wrapper = mountKanbanComponent(MatterCard, {
        props: { matter: defaultMatter }
      })

      const card = wrapper.find(`[data-testid="matter-card-${defaultMatter.id}"]`)
      
      const touchStart = createMockTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }])
      const touchMove = createMockTouchEvent('touchmove', [{ clientX: 150, clientY: 100 }])
      const touchEnd = createMockTouchEvent('touchend', [{ clientX: 200, clientY: 100 }])

      await card.trigger('touchstart', touchStart)
      await card.trigger('touchmove', touchMove)
      await card.trigger('touchend', touchEnd)

      expect(wrapper.emitted('touch-drag')).toBeTruthy()
    })
  })

  // ===== CARD ACTIONS =====

  describe('Card Actions', () => {
    beforeEach(() => {
      wrapper = mountKanbanComponent(MatterCard, {
        props: { matter: defaultMatter }
      })
    })

    it('should show action menu on button click', async () => {
      const actionButton = wrapper.find('[data-testid="matter-actions-button"]')
      await actionButton.trigger('click')

      const actionMenu = wrapper.find('[data-testid="matter-actions-menu"]')
      expect(actionMenu.isVisible()).toBe(true)
    })

    it('should emit view event on view action', async () => {
      const actionButton = wrapper.find('[data-testid="matter-actions-button"]')
      await actionButton.trigger('click')

      const viewAction = wrapper.find('[data-testid="action-view"]')
      await viewAction.trigger('click')

      expect(wrapper.emitted('view-matter')).toBeTruthy()
      expect(wrapper.emitted('view-matter')?.[0]).toEqual([defaultMatter.id])
    })

    it('should emit edit event on edit action', async () => {
      const actionButton = wrapper.find('[data-testid="matter-actions-button"]')
      await actionButton.trigger('click')

      const editAction = wrapper.find('[data-testid="action-edit"]')
      await editAction.trigger('click')

      expect(wrapper.emitted('edit-matter')).toBeTruthy()
      expect(wrapper.emitted('edit-matter')?.[0]).toEqual([defaultMatter.id])
    })

    it('should emit delete event on delete action with confirmation', async () => {
      // Mock window.confirm
      global.confirm = vi.fn(() => true)

      const actionButton = wrapper.find('[data-testid="matter-actions-button"]')
      await actionButton.trigger('click')

      const deleteAction = wrapper.find('[data-testid="action-delete"]')
      await deleteAction.trigger('click')

      expect(global.confirm).toHaveBeenCalled()
      expect(wrapper.emitted('delete-matter')).toBeTruthy()
      expect(wrapper.emitted('delete-matter')?.[0]).toEqual([defaultMatter.id])
    })

    it('should not emit delete event if confirmation is cancelled', async () => {
      global.confirm = vi.fn(() => false)

      const actionButton = wrapper.find('[data-testid="matter-actions-button"]')
      await actionButton.trigger('click')

      const deleteAction = wrapper.find('[data-testid="action-delete"]')
      await deleteAction.trigger('click')

      expect(wrapper.emitted('delete-matter')).toBeFalsy()
    })

    it('should navigate to matter detail on card click', async () => {
      const card = wrapper.find(`[data-testid="matter-card-${defaultMatter.id}"]`)
      await card.trigger('click')

      expect(mockNavigateTo).toHaveBeenCalledWith(`/matters/${defaultMatter.id}`)
    })

    it('should prevent navigation when clicking action button', async () => {
      const actionButton = wrapper.find('[data-testid="matter-actions-button"]')
      const clickEvent = new Event('click', { bubbles: true })
      await actionButton.element.dispatchEvent(clickEvent)

      expect(mockNavigateTo).not.toHaveBeenCalled()
    })
  })

  // ===== KEYBOARD NAVIGATION =====

  describe('Keyboard Navigation', () => {
    beforeEach(() => {
      wrapper = mountKanbanComponent(MatterCard, {
        props: { matter: defaultMatter }
      })
    })

    it('should be focusable with tab key', () => {
      const card = wrapper.find(`[data-testid="matter-card-${defaultMatter.id}"]`)
      expect(card.attributes('tabindex')).toBe('0')
    })

    it('should open matter on Enter key', async () => {
      const card = wrapper.find(`[data-testid="matter-card-${defaultMatter.id}"]`)
      await card.trigger('keydown', { key: 'Enter' })

      expect(mockNavigateTo).toHaveBeenCalledWith(`/matters/${defaultMatter.id}`)
    })

    it('should open matter on Space key', async () => {
      const card = wrapper.find(`[data-testid="matter-card-${defaultMatter.id}"]`)
      await card.trigger('keydown', { key: ' ' })

      expect(mockNavigateTo).toHaveBeenCalledWith(`/matters/${defaultMatter.id}`)
    })

    it('should open action menu on context menu key', async () => {
      const card = wrapper.find(`[data-testid="matter-card-${defaultMatter.id}"]`)
      await card.trigger('keydown', { key: 'ContextMenu' })

      const actionMenu = wrapper.find('[data-testid="matter-actions-menu"]')
      expect(actionMenu.isVisible()).toBe(true)
    })

    it('should handle arrow key navigation for focus management', async () => {
      const card = wrapper.find(`[data-testid="matter-card-${defaultMatter.id}"]`)
      
      await card.trigger('keydown', { key: 'ArrowDown' })
      expect(wrapper.emitted('navigate-focus')).toBeTruthy()
      expect(wrapper.emitted('navigate-focus')?.[0]).toEqual(['down'])

      await card.trigger('keydown', { key: 'ArrowUp' })
      expect(wrapper.emitted('navigate-focus')?.[1]).toEqual(['up'])

      await card.trigger('keydown', { key: 'ArrowRight' })
      expect(wrapper.emitted('navigate-focus')?.[2]).toEqual(['right'])

      await card.trigger('keydown', { key: 'ArrowLeft' })
      expect(wrapper.emitted('navigate-focus')?.[3]).toEqual(['left'])
    })
  })

  // ===== ACCESSIBILITY =====

  describe('Accessibility', () => {
    beforeEach(() => {
      wrapper = mountKanbanComponent(MatterCard, {
        props: { matter: defaultMatter }
      })
    })

    it('should have proper ARIA labels and roles', () => {
      assertAccessibilityAttributes(wrapper, `[data-testid="matter-card-${defaultMatter.id}"]`, {
        'role': 'button',
        'aria-label': `Matter: ${defaultMatter.title}, Client: ${defaultMatter.clientName}, Priority: ${defaultMatter.priority}`,
        'aria-describedby': `matter-${defaultMatter.id}-description`
      })
    })

    it('should have proper heading hierarchy', () => {
      const title = wrapper.find('.matter-title')
      expect(['H3', 'H4', 'H5']).toContain(title.element.tagName)
    })

    it('should announce priority to screen readers', () => {
      const priorityBadge = wrapper.find('[data-testid="priority-badge"]')
      assertAccessibilityAttributes(priorityBadge, '', {
        'aria-label': `Priority: ${defaultMatter.priority}`
      })
    })

    it('should announce due date status to screen readers', () => {
      const dueDate = wrapper.find('[data-testid="due-date"]')
      expect(dueDate.attributes('aria-label')).toMatch(/due|deadline/i)
    })

    it('should have proper alt text for avatars', () => {
      const assigneeAvatar = wrapper.find('[data-testid="assignee"] img')
      if (assigneeAvatar.exists()) {
        expect(assigneeAvatar.attributes('alt')).toContain(defaultMatter.assignedTo)
      }
    })

    it('should announce drag state changes', async () => {
      const card = wrapper.find(`[data-testid="matter-card-${defaultMatter.id}"]`)
      
      await card.trigger('dragstart')
      
      const announcement = wrapper.find('[aria-live="assertive"]')
      expect(announcement.text()).toMatch(/dragging|picked up/i)
    })

    it('should support high contrast mode', () => {
      const card = wrapper.find(`[data-testid="matter-card-${defaultMatter.id}"]`)
      expect(card.classes()).toContain('border')
    })
  })

  // ===== VISUAL STATES =====

  describe('Visual States', () => {
    it('should show overdue styling for past due items', () => {
      const overdueMatter = {
        ...defaultMatter,
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }

      wrapper = mountKanbanComponent(MatterCard, {
        props: { matter: overdueMatter }
      })

      const card = wrapper.find(`[data-testid="matter-card-${defaultMatter.id}"]`)
      expect(card.classes()).toContain('overdue')
    })

    it('should show due soon styling for items due within 2 days', () => {
      const dueSoonMatter = {
        ...defaultMatter,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
      }

      wrapper = mountKanbanComponent(MatterCard, {
        props: { matter: dueSoonMatter }
      })

      const card = wrapper.find(`[data-testid="matter-card-${defaultMatter.id}"]`)
      expect(card.classes()).toContain('due-soon')
    })

    it('should show blocked status when matter has blockers', () => {
      const blockedMatter = {
        ...defaultMatter,
        isBlocked: true,
        blockedReason: 'Waiting for client documents'
      }

      wrapper = mountKanbanComponent(MatterCard, {
        props: { matter: blockedMatter }
      })

      const card = wrapper.find(`[data-testid="matter-card-${defaultMatter.id}"]`)
      expect(card.classes()).toContain('blocked')
      
      const blockedIndicator = wrapper.find('[data-testid="blocked-indicator"]')
      expect(blockedIndicator.exists()).toBe(true)
    })

    it('should show progress indicators when available', () => {
      const matterWithProgress = {
        ...defaultMatter,
        progress: 65
      }

      wrapper = mountKanbanComponent(MatterCard, {
        props: { matter: matterWithProgress }
      })

      const progressBar = wrapper.find('[data-testid="progress-bar"]')
      expect(progressBar.exists()).toBe(true)
      expect(progressBar.attributes('aria-valuenow')).toBe('65')
    })
  })

  // ===== RESPONSIVE DESIGN =====

  describe('Responsive Design', () => {
    it('should adapt layout for mobile screens', () => {
      wrapper = mountKanbanComponent(MatterCard, {
        props: { 
          matter: defaultMatter,
          isMobile: true 
        }
      })

      const card = wrapper.find(`[data-testid="matter-card-${defaultMatter.id}"]`)
      expect(card.classes()).toContain('mobile')
    })

    it('should hide secondary information on small screens', () => {
      wrapper = mountKanbanComponent(MatterCard, {
        props: { 
          matter: defaultMatter,
          compact: true 
        }
      })

      const estimatedHours = wrapper.find('[data-testid="estimated-hours"]')
      expect(estimatedHours.isVisible()).toBe(false)
    })

    it('should adjust text size for accessibility', () => {
      wrapper = mountKanbanComponent(MatterCard, {
        props: { 
          matter: defaultMatter,
          largeText: true 
        }
      })

      const card = wrapper.find(`[data-testid="matter-card-${defaultMatter.id}"]`)
      expect(card.classes()).toContain('large-text')
    })
  })

  // ===== ERROR HANDLING =====

  describe('Error Handling', () => {
    it('should handle missing matter data gracefully', () => {
      const incompleteMatter = {
        id: 'matter-incomplete',
        title: 'Incomplete Matter'
        // Missing other required fields
      } as MatterCardType

      wrapper = mountKanbanComponent(MatterCard, {
        props: { matter: incompleteMatter }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).toContain('Incomplete Matter')
    })

    it('should handle invalid date formats', () => {
      const matterWithInvalidDate = {
        ...defaultMatter,
        dueDate: 'invalid-date'
      }

      wrapper = mountKanbanComponent(MatterCard, {
        props: { matter: matterWithInvalidDate }
      })

      const dueDate = wrapper.find('[data-testid="due-date"]')
      expect(dueDate.text()).toContain('Invalid date')
    })

    it('should handle missing assignee data', () => {
      const matterWithoutAssignee = {
        ...defaultMatter,
        assignedTo: undefined
      }

      wrapper = mountKanbanComponent(MatterCard, {
        props: { matter: matterWithoutAssignee }
      })

      const assignee = wrapper.find('[data-testid="assignee"]')
      expect(assignee.text()).toContain('Unassigned')
    })
  })

  // ===== PERFORMANCE =====

  describe('Performance', () => {
    it('should not re-render unnecessarily', async () => {
      const renderSpy = vi.fn()
      wrapper = mountKanbanComponent(MatterCard, {
        props: { matter: defaultMatter },
        onUpdated: renderSpy
      })

      // Change unrelated prop
      await wrapper.setProps({ showJapanese: false })
      
      // Should not trigger re-render for same value
      expect(renderSpy).not.toHaveBeenCalled()
    })

    it('should handle rapid hover state changes efficiently', async () => {
      wrapper = mountKanbanComponent(MatterCard, {
        props: { matter: defaultMatter }
      })

      const card = wrapper.find(`[data-testid="matter-card-${defaultMatter.id}"]`)
      
      // Rapid hover changes
      for (let i = 0; i < 10; i++) {
        await card.trigger('mouseenter')
        await card.trigger('mouseleave')
      }

      // Should handle without performance issues
      expect(wrapper.exists()).toBe(true)
    })
  })
})
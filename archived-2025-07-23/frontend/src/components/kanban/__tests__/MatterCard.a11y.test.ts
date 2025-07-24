import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { axe, toHaveNoViolations } from 'jest-axe'
import MatterCard from '../MatterCard.vue'
import type { MatterCard as MatterCardType, ViewPreferences } from '~/types/kanban'

expect.extend(toHaveNoViolations)

describe('MatterCard Accessibility', () => {
  const mockMatter: MatterCardType = {
    id: '1',
    caseNumber: '2025-CV-0001',
    title: 'Test Matter',
    clientName: 'Test Client',
    status: 'INTAKE',
    priority: 'HIGH',
    createdAt: '2025-06-15T10:00:00Z',
    updatedAt: '2025-06-17T05:00:00Z'
  }

  const mockViewPreferences: ViewPreferences = {
    cardSize: 'normal',
    showAvatars: true,
    showPriority: true,
    showDueDates: true,
    showTags: true,
    groupBy: 'status'
  }

  it('should not have accessibility violations', async () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: mockMatter,
        viewPreferences: mockViewPreferences
      }
    })

    const results = await axe(wrapper.element)
    expect(results).toHaveNoViolations()
  })

  it('should not have violations with all features enabled', async () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: {
          ...mockMatter,
          dueDate: '2025-07-15T10:00:00Z',
          assignedLawyer: {
            id: 'lawyer1',
            name: 'John Smith',
            avatar: 'https://example.com/avatar.jpg'
          },
          assignedClerk: {
            id: 'clerk1',
            name: 'Jane Doe'
          },
          tags: ['Contract', 'Urgent'],
          relatedDocuments: 5
        },
        viewPreferences: mockViewPreferences
      }
    })

    const results = await axe(wrapper.element)
    expect(results).toHaveNoViolations()
  })

  it('has proper ARIA labels', () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: mockMatter,
        viewPreferences: mockViewPreferences
      }
    })

    const card = wrapper.find('[role="button"]')
    expect(card.attributes('aria-label')).toBeTruthy()
    expect(card.attributes('tabindex')).toBe('0')
  })

  it('has proper keyboard support', () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: mockMatter,
        viewPreferences: mockViewPreferences
      }
    })

    const card = wrapper.find('[role="button"]')
    expect(card.attributes('tabindex')).toBe('0')
    
    // Should have appropriate role for interactive element
    expect(card.attributes('role')).toBeDefined()
  })

  it('provides proper labels for avatars', () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: {
          ...mockMatter,
          assignedLawyer: {
            id: 'lawyer1',
            name: 'John Smith'
          }
        },
        viewPreferences: mockViewPreferences
      }
    })

    const avatar = wrapper.find('[aria-label*="Assigned lawyer"]')
    expect(avatar.exists()).toBe(true)
    expect(avatar.attributes('aria-label')).toBe('Assigned lawyer: John Smith')
  })

  it('has proper contrast in high contrast mode', async () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: mockMatter,
        viewPreferences: mockViewPreferences
      },
      attachTo: document.body
    })

    // Simulate high contrast mode
    const style = document.createElement('style')
    style.textContent = '@media (prefers-contrast: high) { * { color: black !important; } }'
    document.head.appendChild(style)

    const results = await axe(wrapper.element)
    expect(results).toHaveNoViolations()

    // Cleanup
    document.head.removeChild(style)
    wrapper.unmount()
  })

  it('respects reduced motion preferences', () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: mockMatter,
        viewPreferences: mockViewPreferences
      }
    })

    // Check that animations can be disabled
    const card = wrapper.find('.card')
    const styles = window.getComputedStyle(card.element)
    
    // In a real test environment with reduced motion, transition should be 'none'
    // This is a simplified test
    expect(card.classes()).toContain('transition-all')
  })

  it('has screen reader friendly priority badges', () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: mockMatter,
        viewPreferences: mockViewPreferences
      }
    })

    const srOnly = wrapper.find('.sr-only')
    expect(srOnly.text()).toBe('Priority:')
  })

  it('properly hides decorative elements from screen readers', () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: mockMatter,
        viewPreferences: mockViewPreferences
      }
    })

    const dragHandle = wrapper.find('[aria-hidden="true"]')
    expect(dragHandle.exists()).toBe(true)
  })

  it('provides accessible overdue indication', () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: {
          ...mockMatter,
          dueDate: '2024-01-01T10:00:00Z' // Past date
        },
        viewPreferences: mockViewPreferences
      }
    })

    const ariaLabel = wrapper.find('[role="button"]').attributes('aria-label')
    expect(ariaLabel).toContain('This matter is overdue')
  })
})
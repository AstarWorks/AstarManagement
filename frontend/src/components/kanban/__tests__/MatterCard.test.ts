import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import MatterCard from '../MatterCard.vue'
import type { MatterCard as MatterCardType, ViewPreferences } from '~/types/kanban'

describe('MatterCard', () => {
  const mockMatter: MatterCardType = {
    id: '1',
    caseNumber: '2025-CV-0001',
    title: 'Test Matter',
    clientName: 'Test Client',
    status: 'INTAKE',
    priority: 'HIGH',
    createdAt: '2025-06-15T10:00:00Z',
    updatedAt: '2025-06-17T05:00:00Z',
    statusDuration: 2,
    relatedDocuments: 5
  }

  const mockViewPreferences: ViewPreferences = {
    cardSize: 'normal',
    showAvatars: true,
    showPriority: true,
    showDueDates: true,
    showTags: true,
    groupBy: 'status'
  }

  it('renders matter information correctly', () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: mockMatter,
        viewPreferences: mockViewPreferences
      }
    })

    expect(wrapper.text()).toContain('Test Matter')
    expect(wrapper.text()).toContain('#2025-CV-0001')
    expect(wrapper.text()).toContain('Test Client')
    expect(wrapper.text()).toContain('HIGH')
    expect(wrapper.text()).toContain('2d in status')
  })

  it('applies correct priority colors', () => {
    const priorities = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'] as const
    const expectedClasses = [
      'border-l-red-500',
      'border-l-orange-500',
      'border-l-blue-500',
      'border-l-gray-500'
    ]

    priorities.forEach((priority, index) => {
      const wrapper = mount(MatterCard, {
        props: {
          matter: { ...mockMatter, priority },
          viewPreferences: mockViewPreferences
        }
      })

      const card = wrapper.find('.card')
      expect(card.classes().some(c => c.includes(expectedClasses[index]))).toBe(true)
    })
  })

  it('shows overdue styling for past due dates', () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: {
          ...mockMatter,
          dueDate: '2024-01-01T10:00:00Z' // Past date
        },
        viewPreferences: mockViewPreferences
      }
    })

    const card = wrapper.find('.card')
    expect(card.classes().some(c => c.includes('ring-red-200'))).toBe(true)
    expect(wrapper.text()).toContain('(Overdue)')
  })

  it('emits click event when clicked', async () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: mockMatter,
        viewPreferences: mockViewPreferences
      }
    })

    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')?.[0]).toEqual([mockMatter])
  })

  it('emits edit event when edit button is clicked', async () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: mockMatter,
        viewPreferences: mockViewPreferences
      }
    })

    const editButton = wrapper.find('button[aria-label*="Edit"]')
    await editButton.trigger('click')
    
    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')?.[0]).toEqual([mockMatter])
    // Should not also emit click
    expect(wrapper.emitted('click')).toBeFalsy()
  })

  it('handles keyboard navigation', async () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: mockMatter,
        viewPreferences: mockViewPreferences
      }
    })

    const card = wrapper.find('[role="button"]')
    
    await card.trigger('keydown.enter')
    expect(wrapper.emitted('click')).toBeTruthy()

    await card.trigger('keydown.space')
    expect(wrapper.emitted('click')).toHaveLength(2)
  })

  it('shows avatars when enabled', () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: {
          ...mockMatter,
          assignedLawyer: {
            id: 'lawyer1',
            name: 'John Smith',
            avatar: 'https://example.com/avatar.jpg'
          }
        },
        viewPreferences: mockViewPreferences
      }
    })

    expect(wrapper.find('[aria-label*="Assigned lawyer"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('John Smith')
  })

  it('hides avatars when disabled', () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: {
          ...mockMatter,
          assignedLawyer: {
            id: 'lawyer1',
            name: 'John Smith'
          }
        },
        viewPreferences: {
          ...mockViewPreferences,
          showAvatars: false
        }
      }
    })

    expect(wrapper.find('[aria-label*="Assigned lawyer"]').exists()).toBe(false)
  })

  it('shows initials when avatar image is not provided', () => {
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

    const fallback = wrapper.find('.bg-blue-100')
    expect(fallback.text()).toBe('JS')
  })

  it('applies dragging styles correctly', () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: mockMatter,
        viewPreferences: mockViewPreferences,
        isDragging: true
      }
    })

    const card = wrapper.find('.card')
    expect(card.classes()).toContain('opacity-50')
    expect(card.classes()).toContain('cursor-grabbing')
  })

  it('respects different card sizes', () => {
    const sizes = ['compact', 'normal', 'detailed'] as const
    const expectedHeights = ['h-20', 'h-28', 'h-36']

    sizes.forEach((size, index) => {
      const wrapper = mount(MatterCard, {
        props: {
          matter: mockMatter,
          viewPreferences: {
            ...mockViewPreferences,
            cardSize: size
          }
        }
      })

      const card = wrapper.find('.card')
      expect(card.classes().some(c => c.includes(expectedHeights[index]))).toBe(true)
    })
  })

  it('shows tags when enabled and available', () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: {
          ...mockMatter,
          tags: ['Contract', 'Urgent', 'Review']
        },
        viewPreferences: mockViewPreferences
      }
    })

    expect(wrapper.text()).toContain('Contract')
    expect(wrapper.text()).toContain('Urgent')
    expect(wrapper.text()).toContain('Review')
  })

  it('truncates long tag lists', () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: {
          ...mockMatter,
          tags: ['Tag1', 'Tag2', 'Tag3', 'Tag4', 'Tag5']
        },
        viewPreferences: mockViewPreferences
      }
    })

    expect(wrapper.text()).toContain('Tag1')
    expect(wrapper.text()).toContain('Tag2')
    expect(wrapper.text()).toContain('Tag3')
    expect(wrapper.text()).toContain('+2')
  })

  it('hides elements in compact view', () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: {
          ...mockMatter,
          assignedLawyer: {
            id: 'lawyer1',
            name: 'John Smith'
          },
          tags: ['Contract']
        },
        viewPreferences: {
          ...mockViewPreferences,
          cardSize: 'compact'
        }
      }
    })

    // Should hide avatars and tags in compact view
    expect(wrapper.find('[aria-label*="Assigned lawyer"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Contract')
    // Should hide edit button
    expect(wrapper.find('button[aria-label*="Edit"]').exists()).toBe(false)
  })

  it('has proper ARIA labels for accessibility', () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: mockMatter,
        viewPreferences: mockViewPreferences
      }
    })

    const card = wrapper.find('[role="button"]')
    const ariaLabel = card.attributes('aria-label')
    
    expect(ariaLabel).toContain('2025-CV-0001')
    expect(ariaLabel).toContain('Test Matter')
    expect(ariaLabel).toContain('Priority: HIGH')
    expect(ariaLabel).toContain('Client: Test Client')
  })

  it('includes drag attributes for drag-and-drop', () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: mockMatter,
        viewPreferences: mockViewPreferences
      }
    })

    const card = wrapper.find('.card')
    expect(card.attributes('draggable')).toBe('true')
    expect(card.attributes('data-matter-id')).toBe('1')
    expect(card.attributes('data-priority')).toBe('HIGH')
    expect(card.attributes('data-status')).toBe('INTAKE')
  })

  it('shows document count when available', () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: mockMatter,
        viewPreferences: mockViewPreferences
      }
    })

    expect(wrapper.text()).toContain('5')
    expect(wrapper.find('.lucide-file-text').exists()).toBe(true)
  })

  it('formats dates correctly', () => {
    const wrapper = mount(MatterCard, {
      props: {
        matter: {
          ...mockMatter,
          dueDate: '2025-07-15T10:00:00Z'
        },
        viewPreferences: mockViewPreferences
      }
    })

    expect(wrapper.text()).toContain('Jul 15')
  })
})
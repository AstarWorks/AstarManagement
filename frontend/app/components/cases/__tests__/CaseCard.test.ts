import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CaseCard from '../CaseCard.vue'
import type { Case } from '~/types/case'

// Mock the date-fns functions
vi.mock('date-fns', () => ({
  format: vi.fn(() => '2024年7月24日'),
  parseISO: vi.fn((date: string) => new Date(date)),
  differenceInDays: vi.fn(() => 5),
}))

// Mock the date-fns/locale
vi.mock('date-fns/locale', () => ({
  ja: {}
}))

const mockCase: Case = {
  id: '1',
  caseNumber: 'CASE-2024-001',
  title: '不動産売買契約トラブル',
  client: {
    id: '1',
    name: '田中太郎',
    type: 'individual'
  },
  status: 'new',
  priority: 'high',
  assignedLawyer: '佐藤弁護士',
  dueDate: '2024-08-15',
  tags: ['不動産', '契約'],
  createdAt: '2024-07-01',
  updatedAt: '2024-07-24'
}

describe('CaseCard', () => {
  it('should render case information correctly', () => {
    const wrapper = mount(CaseCard, {
      props: {
        caseData: mockCase
      },
      global: {
        stubs: {
          Icon: true,
          Button: true,
          CasePriorityBadge: true,
          ClientTypeBadge: true,
          CaseTag: true,
          DueDateAlert: true,
          CaseProgressIndicator: true
        }
      }
    })

    // Check if case title is rendered
    expect(wrapper.text()).toContain('不動産売買契約トラブル')
    
    // Check if case number is rendered
    expect(wrapper.text()).toContain('CASE-2024-001')
    
    // Check if client name is rendered
    expect(wrapper.text()).toContain('田中太郎')
    
    // Check if assigned lawyer is rendered
    expect(wrapper.text()).toContain('佐藤弁護士')
  })

  it('should emit clicked event when card is clicked', async () => {
    const wrapper = mount(CaseCard, {
      props: {
        caseData: mockCase
      },
      global: {
        stubs: {
          Icon: true,
          Button: true,
          CasePriorityBadge: true,
          ClientTypeBadge: true,
          CaseTag: true,
          DueDateAlert: true,
          CaseProgressIndicator: true
        }
      }
    })

    await wrapper.trigger('click')
    
    expect(wrapper.emitted('clicked')).toBeTruthy()
    expect(wrapper.emitted('clicked')?.[0]).toEqual([mockCase])
  })

  it('should show loading state when isLoading prop is true', () => {
    const wrapper = mount(CaseCard, {
      props: {
        caseData: mockCase,
        isLoading: true
      },
      global: {
        stubs: {
          Icon: true,
          Button: true,
          CasePriorityBadge: true,
          ClientTypeBadge: true,
          CaseTag: true,
          DueDateAlert: true,
          CaseProgressIndicator: true
        }
      }
    })

    expect(wrapper.find('.animate-spin').exists()).toBe(true)
  })

  it('should apply priority border styling', () => {
    const wrapper = mount(CaseCard, {
      props: {
        caseData: mockCase
      },
      global: {
        stubs: {
          Icon: true,
          Button: true,
          CasePriorityBadge: true,
          ClientTypeBadge: true,
          CaseTag: true,
          DueDateAlert: true,
          CaseProgressIndicator: true
        }
      }
    })

    expect(wrapper.classes()).toContain('priority-high')
  })

  it('should limit visible tags and show count of hidden tags', () => {
    const caseWithManyTags: Case = {
      ...mockCase,
      tags: ['不動産', '契約', 'M&A', '企業法務', '労働法']
    }

    const wrapper = mount(CaseCard, {
      props: {
        caseData: caseWithManyTags,
        viewMode: 'compact'
      },
      global: {
        stubs: {
          Icon: true,
          Button: true,
          CasePriorityBadge: true,
          ClientTypeBadge: true,
          CaseTag: true,
          DueDateAlert: true,
          CaseProgressIndicator: true
        }
      }
    })

    // In compact mode, should show only 2 tags and +3 indicator
    expect(wrapper.text()).toContain('+3')
  })
})
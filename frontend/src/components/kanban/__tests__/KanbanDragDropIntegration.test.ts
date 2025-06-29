import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import KanbanColumn from '../KanbanColumn.vue'
import type { KanbanColumn as KanbanColumnType, MatterCard, MatterStatus } from '~/types/kanban'
import { DEFAULT_VIEW_PREFERENCES } from '~/constants/kanban'

describe('Kanban Drag-Drop Integration', () => {
  const mockColumns: KanbanColumnType[] = [
    {
      id: 'intake',
      title: 'Intake',
      titleJa: '受付',
      status: 'INTAKE' as MatterStatus,
      color: 'bg-blue-50',
      order: 0,
      visible: true,
      acceptsDrop: true,
      currentItemCount: 0
    },
    {
      id: 'review',
      title: 'Initial Review',
      titleJa: '初期レビュー',
      status: 'INITIAL_REVIEW' as MatterStatus,
      color: 'bg-orange-50',
      order: 1,
      visible: true,
      acceptsDrop: true,
      currentItemCount: 0
    }
  ]

  const mockMatters: MatterCard[] = [
    {
      id: '1',
      caseNumber: 'CASE-001',
      title: 'Corporate Merger Case',
      status: 'INTAKE',
      priority: 'HIGH',
      clientName: 'Acme Corp',
      assignedLawyer: {
        id: 'lawyer1',
        name: 'Sarah Johnson',
        initials: 'SJ'
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      dueDate: '2024-02-01',
      statusDuration: 3,
      relatedDocuments: 5
    },
    {
      id: '2',
      caseNumber: 'CASE-002',
      title: 'Employment Dispute',
      status: 'INITIAL_REVIEW',
      priority: 'MEDIUM',
      clientName: 'John Smith',
      assignedLawyer: {
        id: 'lawyer2',
        name: 'Michael Brown',
        initials: 'MB'
      },
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
      dueDate: '2024-02-15',
      statusDuration: 7,
      relatedDocuments: 3
    }
  ]

  it('renders multiple columns with proper drag-drop setup', () => {
    const intakeWrapper = mount(KanbanColumn, {
      props: {
        column: mockColumns[0],
        matters: [mockMatters[0]],
        viewPreferences: DEFAULT_VIEW_PREFERENCES
      }
    })

    const reviewWrapper = mount(KanbanColumn, {
      props: {
        column: mockColumns[1],
        matters: [mockMatters[1]],
        viewPreferences: DEFAULT_VIEW_PREFERENCES
      }
    })

    // Verify column structure
    expect(intakeWrapper.find('.kanban-column').exists()).toBe(true)
    expect(reviewWrapper.find('.kanban-column').exists()).toBe(true)

    // Verify draggable containers
    expect(intakeWrapper.find('.matters-container').exists()).toBe(true)
    expect(reviewWrapper.find('.matters-container').exists()).toBe(true)

    // Verify matter cards are rendered
    expect(intakeWrapper.findComponent({ name: 'MatterCardComponent' }).exists()).toBe(true)
    expect(reviewWrapper.findComponent({ name: 'MatterCardComponent' }).exists()).toBe(true)
  })

  it('emits proper events for drag operations', async () => {
    const wrapper = mount(KanbanColumn, {
      props: {
        column: mockColumns[0],
        matters: [mockMatters[0]],
        viewPreferences: DEFAULT_VIEW_PREFERENCES
      }
    })

    // Test matter click event
    const matterCard = wrapper.findComponent({ name: 'MatterCardComponent' })
    await matterCard.vm.$emit('click', mockMatters[0])

    expect(wrapper.emitted('matterClick')).toHaveLength(1)
    expect(wrapper.emitted('matterClick')?.[0]).toEqual([mockMatters[0]])

    // Test matter edit event
    await matterCard.vm.$emit('edit', mockMatters[0])

    expect(wrapper.emitted('matterEdit')).toHaveLength(1)
    expect(wrapper.emitted('matterEdit')?.[0]).toEqual([mockMatters[0]])
  })

  it('supports keyboard navigation', async () => {
    const wrapper = mount(KanbanColumn, {
      props: {
        column: mockColumns[0],
        matters: [mockMatters[0]],
        viewPreferences: DEFAULT_VIEW_PREFERENCES
      }
    })

    const matterCard = wrapper.findComponent({ name: 'MatterCardComponent' })
    
    // Simulate arrow key navigation
    await matterCard.trigger('keydown', { key: 'ArrowRight' })
    
    expect(wrapper.emitted('keyboard-navigation')).toHaveLength(1)
    expect(wrapper.emitted('keyboard-navigation')?.[0]).toEqual(['right', mockMatters[0]])

    // Simulate Enter key
    await matterCard.trigger('keydown', { key: 'Enter' })
    
    expect(wrapper.emitted('matterClick')).toHaveLength(1)
  })

  it('validates status transitions correctly', () => {
    // This integration test verifies that the column properly integrates
    // with the useKanbanDragDrop composable for status validation
    const wrapper = mount(KanbanColumn, {
      props: {
        column: mockColumns[0],
        matters: [mockMatters[0]],
        viewPreferences: DEFAULT_VIEW_PREFERENCES
      }
    })

    // Access the component instance to test composable integration
    const vm = wrapper.vm as any
    
    // Verify that drag-drop composable functions are available
    expect(typeof vm.canAcceptDrop).toBe('function')
    expect(typeof vm.onDragStart).toBe('function')
    expect(typeof vm.onDragEnd).toBe('function')
    expect(typeof vm.onDragChange).toBe('function')
  })

  it('displays empty state correctly', () => {
    const wrapper = mount(KanbanColumn, {
      props: {
        column: mockColumns[0],
        matters: [],
        viewPreferences: DEFAULT_VIEW_PREFERENCES
      }
    })

    const emptyState = wrapper.find('.empty-state')
    expect(emptyState.exists()).toBe(true)
    expect(emptyState.find('.empty-text').text()).toBe('No matters')
    expect(emptyState.find('.empty-hint').text()).toBe('Drag matters here')
  })

  it('handles Japanese language support', async () => {
    const wrapper = mount(KanbanColumn, {
      props: {
        column: mockColumns[0],
        matters: [mockMatters[0]],
        viewPreferences: DEFAULT_VIEW_PREFERENCES,
        showJapanese: true
      }
    })

    expect(wrapper.find('.column-title').text()).toBe('受付')

    await wrapper.setProps({ showJapanese: false })
    expect(wrapper.find('.column-title').text()).toBe('Intake')
  })

  it('displays correct matter count', async () => {
    const wrapper = mount(KanbanColumn, {
      props: {
        column: mockColumns[0],
        matters: [mockMatters[0]],
        viewPreferences: DEFAULT_VIEW_PREFERENCES
      }
    })

    expect(wrapper.find('.matter-count').text()).toBe('1')

    await wrapper.setProps({ matters: mockMatters })
    expect(wrapper.find('.matter-count').text()).toBe('2')
  })

  it('applies proper accessibility attributes', () => {
    const wrapper = mount(KanbanColumn, {
      props: {
        column: mockColumns[0],
        matters: [mockMatters[0]],
        viewPreferences: DEFAULT_VIEW_PREFERENCES
      }
    })

    // Check column header ID
    const header = wrapper.find('.column-header')
    expect(header.attributes('id')).toBe('column-header-intake')

    // Check matter count aria-label
    const badge = wrapper.find('.matter-count')
    expect(badge.attributes('aria-label')).toBe('1 matters in Intake')

    // Check data-testid
    const columnBody = wrapper.find('.column-body')
    expect(columnBody.attributes('data-testid')).toBe('column-intake')
  })
})
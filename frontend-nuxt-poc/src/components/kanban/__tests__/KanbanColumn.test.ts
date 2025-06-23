import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import KanbanColumn from '../KanbanColumn.vue'
import type { KanbanColumn as KanbanColumnType, MatterCard, MatterStatus } from '~/types/kanban'
import { DEFAULT_VIEW_PREFERENCES } from '~/constants/kanban'

// Mock the composables
vi.mock('~/composables/useKanbanDragDrop', () => ({
  useKanbanDragDrop: () => ({
    canAcceptDrop: vi.fn(() => true),
    onDragStart: vi.fn(),
    onDragEnd: vi.fn(),
    onDragChange: vi.fn(() => ({ type: 'status_change', matter: mockMatter, fromStatus: 'INTAKE', toStatus: 'INITIAL_REVIEW' })),
    isColumnDragTarget: vi.fn(() => false)
  })
}))

vi.mock('~/composables/useTouchGestures', () => ({
  useTouchGestures: () => ({
    getSortableConfig: vi.fn(() => ({
      animation: 150,
      ghostClass: 'drag-ghost',
      chosenClass: 'drag-chosen'
    }))
  })
}))

vi.mock('vuedraggable', () => ({
  default: {
    name: 'draggable',
    props: {
      modelValue: Array,
      group: Object,
      animation: Number,
      ghostClass: String,
      chosenClass: String,
      dragClass: String,
      itemKey: String,
      tag: String
    },
    emits: ['update:modelValue', 'start', 'end', 'change'],
    template: `
      <div class="draggable-container" v-bind="$attrs">
        <div v-for="item in modelValue" :key="item.id" class="draggable-item">
          <slot name="item" :element="item" />
        </div>
        <slot name="footer" />
      </div>
    `
  }
}))

const mockColumn: KanbanColumnType = {
  id: 'intake',
  title: 'Intake',
  titleJa: '受付',
  status: ['INTAKE' as MatterStatus],
  color: 'bg-blue-50 border-blue-200'
}

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

describe('KanbanColumn Drag and Drop', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = mount(KanbanColumn, {
      props: {
        column: mockColumn,
        matters: [mockMatter],
        viewPreferences: DEFAULT_VIEW_PREFERENCES
      }
    })
  })

  describe('Component Structure', () => {
    it('renders column with draggable container', () => {
      expect(wrapper.find('.kanban-column').exists()).toBe(true)
      expect(wrapper.find('.draggable-container').exists()).toBe(true)
    })

    it('displays column title and matter count', () => {
      expect(wrapper.find('.column-title').text()).toBe('Intake')
      expect(wrapper.find('.matter-count').text()).toBe('1')
    })

    it('renders matter cards within draggable items', () => {
      expect(wrapper.find('.draggable-item').exists()).toBe(true)
      expect(wrapper.findComponent({ name: 'MatterCardComponent' }).exists()).toBe(true)
    })
  })

  describe('Drag and Drop Events', () => {
    it('emits headerClick when column header is clicked', async () => {
      await wrapper.find('.column-header').trigger('click')
      expect(wrapper.emitted('headerClick')).toHaveLength(1)
      expect(wrapper.emitted('headerClick')[0]).toEqual([mockColumn])
    })

    it('emits matterClick when matter card is clicked', async () => {
      const matterCard = wrapper.findComponent({ name: 'MatterCardComponent' })
      await matterCard.vm.$emit('click', mockMatter)
      expect(wrapper.emitted('matterClick')).toHaveLength(1)
      expect(wrapper.emitted('matterClick')[0]).toEqual([mockMatter])
    })

    it('emits matterEdit when matter card edit is triggered', async () => {
      const matterCard = wrapper.findComponent({ name: 'MatterCardComponent' })
      await matterCard.vm.$emit('edit', mockMatter)
      expect(wrapper.emitted('matterEdit')).toHaveLength(1)
      expect(wrapper.emitted('matterEdit')[0]).toEqual([mockMatter])
    })

    it('updates matters list when draggable emits change', async () => {
      const newMatters = [{ ...mockMatter, title: 'Updated Matter' }]
      const draggable = wrapper.findComponent({ name: 'draggable' })
      
      await draggable.vm.$emit('update:modelValue', newMatters)
      expect(wrapper.emitted('update:matters')).toHaveLength(1)
      expect(wrapper.emitted('update:matters')[0]).toEqual([newMatters])
    })
  })

  describe('Status Transitions', () => {
    it('handles drag change events and emits matter-moved', async () => {
      const draggable = wrapper.findComponent({ name: 'draggable' })
      const changeEvent = {
        added: {
          element: mockMatter
        }
      }
      
      await draggable.vm.$emit('change', changeEvent)
      await nextTick()
      
      expect(wrapper.emitted('matter-moved')).toHaveLength(1)
      expect(wrapper.emitted('matter-moved')[0]).toEqual([
        mockMatter,
        'INTAKE',
        'INITIAL_REVIEW'
      ])
    })

    it('applies correct data attributes to draggable', () => {
      const draggable = wrapper.findComponent({ name: 'draggable' })
      expect(draggable.attributes('data-status')).toBe('INTAKE')
    })
  })

  describe('Visual States', () => {
    it('applies drag-over class when column is drag target', async () => {
      // Mock the isColumnDragTarget to return true
      vi.mocked(wrapper.vm.isColumnDragTarget).mockReturnValue(true)
      await wrapper.vm.$forceUpdate()
      
      expect(wrapper.find('.kanban-column').classes()).toContain('drag-over')
    })

    it('displays empty state when no matters', async () => {
      await wrapper.setProps({ matters: [] })
      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.find('.empty-text').text()).toBe('No matters')
      expect(wrapper.find('.empty-hint').text()).toBe('Drag matters here')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels for column header', () => {
      const header = wrapper.find('.column-header')
      expect(header.attributes('id')).toBe('column-header-intake')
    })

    it('has proper ARIA label for matter count badge', () => {
      const badge = wrapper.find('.matter-count')
      expect(badge.attributes('aria-label')).toBe('1 matters in Intake')
    })

    it('has proper ARIA label for empty state', async () => {
      await wrapper.setProps({ matters: [] })
      const emptyState = wrapper.find('.empty-state')
      expect(emptyState.attributes('aria-label')).toBe('No matters in Intake')
    })

    it('has proper test-id for column body', () => {
      const columnBody = wrapper.find('.column-body')
      expect(columnBody.attributes('data-testid')).toBe('column-intake')
    })
  })

  describe('Responsive Design', () => {
    it('has mobile-specific CSS classes in template', () => {
      const column = wrapper.find('.kanban-column')
      expect(column.classes()).toContain('kanban-column')
    })

    it('configures touch gestures through composable', () => {
      const draggable = wrapper.findComponent({ name: 'draggable' })
      expect(draggable.props()).toMatchObject({
        animation: 150,
        ghostClass: 'drag-ghost',
        chosenClass: 'drag-chosen'
      })
    })
  })

  describe('Japanese Language Support', () => {
    it('displays Japanese title when showJapanese is true', async () => {
      await wrapper.setProps({ showJapanese: true })
      expect(wrapper.find('.column-title').text()).toBe('受付')
    })

    it('displays English title when showJapanese is false', async () => {
      await wrapper.setProps({ showJapanese: false })
      expect(wrapper.find('.column-title').text()).toBe('Intake')
    })
  })
})
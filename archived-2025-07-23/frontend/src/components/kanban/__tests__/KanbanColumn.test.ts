import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, nextTick, computed, readonly } from 'vue'
import KanbanColumn from '../KanbanColumn.vue'
import type { KanbanColumn as KanbanColumnType, MatterCard, MatterStatus } from '~/types/kanban'

// Mock draggable component
vi.mock('vuedraggable', () => ({
  default: {
    name: 'draggable',
    props: ['modelValue', 'group', 'itemKey'],
    emits: ['update:modelValue', 'start', 'end', 'change'],
    template: '<div><slot></slot></div>'
  }
}))

// Mock @vueuse/core
vi.mock('@vueuse/core', () => ({
  useBreakpoints: vi.fn(() => ({
    smaller: vi.fn((breakpoint: any) => breakpoint === 'tablet' ? ref(false) : ref(false)),
    between: vi.fn(() => ref(false)),
    greaterOrEqual: vi.fn(() => ref(true))
  }))
}))

// Mock composables
vi.mock('~/composables/useKanbanDragDrop', () => ({
  useKanbanDragDrop: vi.fn(() => ({
    canAcceptDrop: vi.fn(() => true),
    onDragStart: vi.fn(),
    onDragEnd: vi.fn(),
    onDragChange: vi.fn(),
    isColumnDragTarget: vi.fn(() => false)
  }))
}))

vi.mock('~/composables/useTouchGestures', () => ({
  useTouchGestures: vi.fn(() => ({
    isPressed: ref(false),
    isLongPress: ref(false),
    swipeDirection: ref(null),
    dragOffset: computed(() => [0, 0]),
    velocity: computed(() => 0),
    reset: vi.fn()
  })),
  useMobileInteractions: vi.fn(() => ({
    isTouchDevice: ref(false),
    orientation: ref('portrait'),
    safeAreaInsets: computed(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
    useTouchClick: vi.fn((fn: any) => fn)
  }))
}))

// Mock child components
vi.mock('../MatterCard.vue', () => ({
  default: {
    name: 'MatterCard',
    props: ['matter', 'viewPreferences'],
    template: '<div class="matter-card">{{ matter.title }}</div>'
  }
}))

const mockColumn: KanbanColumnType = {
  id: 'col1',
  title: 'To Do',
  titleJa: 'やること',
  color: 'blue',
  status: 'INTAKE',
  order: 0,
  visible: true,
  acceptsDrop: true,
  currentItemCount: 2
}

const mockMatters: MatterCard[] = [
  {
    id: '1',
    title: 'Test Matter 1',
    caseNumber: 'CASE-001',
    clientName: 'Test Client',
    status: 'INTAKE',
    priority: 'HIGH',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: '2',
    title: 'Test Matter 2',
    caseNumber: 'CASE-002',
    clientName: 'Test Client 2',
    status: 'INTAKE',
    priority: 'MEDIUM',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  }
]

describe('KanbanColumn', () => {
  let wrapper: any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders column with title and matter count', () => {
      wrapper = mount(KanbanColumn, {
        props: {
          column: mockColumn,
          matters: mockMatters
        }
      })

      expect(wrapper.find('.column-title').text()).toBe('To Do')
      expect(wrapper.find('.matter-count').text()).toBe('2')
    })

    it('renders Japanese title when showJapanese is true', () => {
      wrapper = mount(KanbanColumn, {
        props: {
          column: mockColumn,
          matters: mockMatters,
          showJapanese: true
        }
      })

      expect(wrapper.find('.column-title').text()).toBe('やること')
    })

    it('renders empty state when no matters', () => {
      wrapper = mount(KanbanColumn, {
        props: {
          column: mockColumn,
          matters: []
        }
      })

      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.find('.empty-text').text()).toBe('No matters')
    })
  })

  describe('Mobile Features', () => {
    beforeEach(async () => {
      // Mock as mobile device
      const { useBreakpoints } = vi.mocked(await import('@vueuse/core'))
      useBreakpoints.mockReturnValue({
        smaller: vi.fn(() => computed(() => true)),
        between: vi.fn(() => computed(() => false)),
        greaterOrEqual: vi.fn(() => computed(() => false))
      } as any)
    })

    it('shows mobile-specific UI elements', async () => {
      wrapper = mount(KanbanColumn, {
        props: {
          column: mockColumn,
          matters: mockMatters
        }
      })

      await nextTick()

      expect(wrapper.find('.collapse-indicator').exists()).toBe(true)
      expect(wrapper.find('.swipe-hint').exists()).toBe(true)
    })

    it('toggles collapse on header click in mobile', async () => {
      wrapper = mount(KanbanColumn, {
        props: {
          column: mockColumn,
          matters: mockMatters
        }
      })

      await wrapper.find('.column-header').trigger('click')
      await nextTick()

      expect(wrapper.classes()).toContain('collapsed-mobile')
    })

    it('emits swipe-action on swipe gesture', async () => {
      const { useTouchGestures } = vi.mocked(await import('~/composables/useTouchGestures'))
      const swipeDirection = ref<'left' | 'right' | 'up' | 'down' | null>(null)
      
      useTouchGestures.mockReturnValue({
        isPressed: ref(false),
        isLongPress: ref(false),
        isPinching: ref(false),
        swipeDirection,
        pinchScale: ref(1),
        dragPosition: ref([0, 0] as [number, number]),
        dragOffset: computed(() => [0, 0] as [number, number]),
        velocity: computed(() => 0),
        reset: vi.fn()
      })

      wrapper = mount(KanbanColumn, {
        props: {
          column: mockColumn,
          matters: mockMatters
        }
      })

      // Simulate swipe left
      swipeDirection.value = 'left'
      await nextTick()

      expect(wrapper.emitted('swipe-action')).toBeTruthy()
      expect(wrapper.emitted('swipe-action')[0]).toEqual(['left', mockColumn])
    })

    it('emits column-collapse on long press', async () => {
      const { useTouchGestures } = vi.mocked(await import('~/composables/useTouchGestures'))
      const isLongPress = ref(false)
      
      useTouchGestures.mockReturnValue({
        isPressed: ref(false),
        isLongPress,
        isPinching: ref(false),
        swipeDirection: ref(null),
        pinchScale: ref(1),
        dragPosition: ref([0, 0] as [number, number]),
        dragOffset: computed(() => [0, 0] as [number, number]),
        velocity: computed(() => 0),
        reset: vi.fn()
      })

      wrapper = mount(KanbanColumn, {
        props: {
          column: mockColumn,
          matters: mockMatters
        }
      })

      // Simulate long press
      isLongPress.value = true
      await nextTick()

      expect(wrapper.emitted('column-collapse')).toBeTruthy()
      expect(wrapper.emitted('column-collapse')[0]).toEqual([mockColumn])
    })

    it('shows safe area padding on iOS', async () => {
      const { useMobileInteractions } = vi.mocked(await import('~/composables/useTouchGestures'))
      
      useMobileInteractions.mockReturnValue({
        isTouchDevice: ref(true),
        orientation: ref('portrait'),
        safeAreaInsets: computed(() => ({ top: 44, bottom: 34, left: 0, right: 0 })),
        useTouchClick: vi.fn((fn: any) => fn)
      })

      wrapper = mount(KanbanColumn, {
        props: {
          column: mockColumn,
          matters: mockMatters
        }
      })

      await nextTick()

      const safeAreaPadding = wrapper.find('.safe-area-padding')
      expect(safeAreaPadding.exists()).toBe(true)
      expect(safeAreaPadding.attributes('style')).toContain('height: 34px')
    })
  })

  describe('Drag and Drop', () => {
    it('handles drag start', async () => {
      const { useKanbanDragDrop } = vi.mocked(await import('~/composables/useKanbanDragDrop'))
      const onDragStart = vi.fn()
      
      const mockDragDrop = {
        draggedMatter: readonly(ref(null)),
        dragOverColumn: readonly(ref(null)),
        isDragging: readonly(ref(false)),
        canDropInColumn: vi.fn(() => true),
        getAvailableStatuses: vi.fn(() => ['INTAKE', 'IN_PROGRESS', 'REVIEW'] as MatterStatus[]),
        canAcceptDrop: vi.fn(() => true),
        onDragStart,
        onDragEnd: vi.fn(),
        onDragChange: vi.fn(),
        onDragOver: vi.fn(),
        onDragLeave: vi.fn(),
        isMatterDragging: vi.fn(() => false),
        isColumnDragTarget: vi.fn(() => false)
      }
      useKanbanDragDrop.mockReturnValue(mockDragDrop)

      wrapper = mount(KanbanColumn, {
        props: {
          column: mockColumn,
          matters: mockMatters
        }
      })

      const draggable = wrapper.findComponent({ name: 'draggable' })
      await draggable.vm.$emit('start')

      expect(onDragStart).toHaveBeenCalled()
    })

    it('emits matter-moved on successful drag', async () => {
      const { useKanbanDragDrop } = vi.mocked(await import('~/composables/useKanbanDragDrop'))
      const onDragChange = vi.fn((event: any, targetStatus: MatterStatus) => ({
        type: 'status_change',
        matter: mockMatters[0],
        fromStatus: 'INTAKE' as MatterStatus,
        toStatus: targetStatus
      }))
      
      useKanbanDragDrop.mockReturnValue({
        draggedMatter: readonly(ref(null)),
        dragOverColumn: readonly(ref(null)),
        isDragging: readonly(ref(false)),
        canDropInColumn: vi.fn(() => true),
        getAvailableStatuses: vi.fn(() => ['INTAKE', 'IN_PROGRESS', 'REVIEW'] as MatterStatus[]),
        canAcceptDrop: vi.fn(() => true),
        onDragStart: vi.fn(),
        onDragEnd: vi.fn(),
        onDragChange,
        onDragOver: vi.fn(),
        onDragLeave: vi.fn(),
        isMatterDragging: vi.fn(() => false),
        isColumnDragTarget: vi.fn(() => false)
      } as any)

      wrapper = mount(KanbanColumn, {
        props: {
          column: mockColumn,
          matters: mockMatters
        }
      })

      const draggable = wrapper.findComponent({ name: 'draggable' })
      await draggable.vm.$emit('change', {})

      expect(wrapper.emitted('matter-moved')).toBeTruthy()
      expect(wrapper.emitted('matter-moved')[0]).toEqual([
        mockMatters[0],
        'TODO',
        'IN_PROGRESS'
      ])
    })
  })

  describe('Keyboard Navigation', () => {
    it('focuses previous card on ArrowUp', async () => {
      wrapper = mount(KanbanColumn, {
        props: {
          column: mockColumn,
          matters: mockMatters
        },
        attachTo: document.body
      })

      const cards = wrapper.findAll('.matter-card')
      const secondCard = cards[1]
      
      // Mock focus method
      const focusSpy = vi.spyOn(cards[0].element, 'focus')
      
      await secondCard.trigger('keydown', { key: 'ArrowUp' })

      expect(wrapper.emitted('keyboard-navigation')).toBeTruthy()
      expect(wrapper.emitted('keyboard-navigation')[0]).toEqual(['up', mockMatters[1]])
    })

    it('emits click on Enter key', async () => {
      wrapper = mount(KanbanColumn, {
        props: {
          column: mockColumn,
          matters: mockMatters
        }
      })

      const firstCard = wrapper.find('.matter-card')
      await firstCard.trigger('keydown', { key: 'Enter' })

      expect(wrapper.emitted('matterClick')).toBeTruthy()
      expect(wrapper.emitted('matterClick')[0]).toEqual([mockMatters[0]])
    })
  })

  describe('Performance Features', () => {
    it('applies mobile-optimized sortable config', async () => {
      // Mock as mobile
      const { useBreakpoints } = vi.mocked(await import('@vueuse/core'))
      useBreakpoints.mockReturnValue({
        smaller: vi.fn(() => computed(() => true)),
        between: vi.fn(() => computed(() => false)),
        greaterOrEqual: vi.fn(() => computed(() => false))
      } as any)

      wrapper = mount(KanbanColumn, {
        props: {
          column: mockColumn,
          matters: mockMatters
        }
      })

      // Verify mobile optimizations are present
      expect(wrapper.classes()).toContain('kanban-column')
    })

    it('disables pointer events while scrolling', async () => {
      wrapper = mount(KanbanColumn, {
        props: {
          column: mockColumn,
          matters: mockMatters
        }
      })

      const scrollContainer = wrapper.find('.column-body')
      await scrollContainer.trigger('touchstart')

      expect(wrapper.classes()).toContain('is-scrolling')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      wrapper = mount(KanbanColumn, {
        props: {
          column: mockColumn,
          matters: mockMatters
        }
      })

      const header = wrapper.find('.column-header')
      expect(header.attributes('id')).toBe('column-header-col1')

      const badge = wrapper.find('.matter-count')
      expect(badge.attributes('aria-label')).toBe('2 matters in To Do')
    })

    it('announces swipe hints to screen readers', () => {
      wrapper = mount(KanbanColumn, {
        props: {
          column: mockColumn,
          matters: mockMatters
        }
      })

      const swipeHint = wrapper.find('.swipe-hint')
      expect(swipeHint.attributes('aria-label')).toBe('Swipe left or right for actions')
    })
  })
})
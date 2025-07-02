/**
 * Simple KanbanBoard.vue test to isolate and fix basic issues
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import KanbanBoard from '../KanbanBoard.vue'

// Mock the problematic composables with simple returns
vi.mock('~/composables/useKanbanQuery', () => ({
  useKanbanMattersQuery: vi.fn(() => ({
    data: { value: [] },
    matterCards: { value: [] },
    mattersByStatus: { value: {} },
    columnsWithCounts: { value: [] },
    isLoading: { value: false },
    isError: { value: false },
    error: { value: null },
    refetch: vi.fn()
  })),
  useKanbanRealTimeQuery: vi.fn(() => ({
    isConnected: { value: true },
    lastUpdate: { value: null },
    pendingUpdates: { value: 0 },
    syncNow: vi.fn(),
    subscribeToUpdates: vi.fn(() => vi.fn())
  }))
}))

// Mock TanStack Query
vi.mock('@tanstack/vue-query', () => ({
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn()
  }))
}))

describe('KanbanBoard.vue - Basic Functionality', () => {
  let wrapper: any

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  it('should mount without errors', () => {
    wrapper = mount(KanbanBoard, {
      global: {
        plugins: [createPinia()],
        stubs: {
          // Stub the missing KanbanColumn component
          KanbanColumn: {
            template: '<div class="kanban-column-stub"><slot /></div>',
            props: ['column', 'matters', 'showJapanese', 'style']
          },
          // Stub other complex components
          ScrollArea: {
            template: '<div class="scroll-area-stub"><slot /></div>'
          },
          ScrollBar: {
            template: '<div class="scroll-bar-stub"></div>',
            props: ['orientation']
          },
          UpdateIndicator: {
            template: '<div class="update-indicator-stub"><slot /></div>',
            props: ['isUpdating', 'lastUpdate']
          },
          ConnectionStatus: {
            template: '<div class="connection-status-stub"></div>',
            props: ['isConnected']
          },
          Transition: {
            template: '<div class="transition-stub"><slot /></div>',
            props: ['name', 'mode']
          }
        }
      }
    })

    expect(wrapper.exists()).toBe(true)
  })
})
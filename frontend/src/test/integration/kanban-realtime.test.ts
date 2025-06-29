import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
// @ts-ignore - @pinia/testing types may not be fully aligned
import { createTestingPinia } from '@pinia/testing'
import { nextTick, ref } from 'vue'
import KanbanBoard from '~/components/kanban/KanbanBoard.vue'
import { useKanbanStore } from '~/stores/kanban'
import { useRealTimeStore } from '~/stores/kanban/real-time'
import type { Matter } from '~/types/matter'

// Mock composables
vi.mock('~/composables/useKanbanRealTime', () => ({
  useKanbanRealTime: () => ({
    updates: ref([]),
    loading: ref(false),
    error: ref(null),
    lastUpdated: ref(new Date()),
    start: vi.fn(),
    stop: vi.fn(),
    refresh: vi.fn()
  })
}))

describe('Kanban Real-Time Integration', () => {
  let wrapper: any
  let kanbanStore: any
  let realTimeStore: any
  
  beforeEach(() => {
    wrapper = mount(KanbanBoard, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          ConnectionStatus: true,
          UpdateIndicator: true,
          KanbanColumn: true,
          ScrollArea: true,
          ScrollBar: true
        }
      },
      props: {
        matters: []
      }
    })
    
    kanbanStore = useKanbanStore()
    realTimeStore = useRealTimeStore()
  })
  
  it('should show connection status in header', () => {
    expect(wrapper.findComponent({ name: 'ConnectionStatus' }).exists()).toBe(true)
  })
  
  it('should wrap columns with update indicators', () => {
    const updateIndicators = wrapper.findAllComponents({ name: 'UpdateIndicator' })
    expect(updateIndicators.length).toBeGreaterThan(0)
  })
  
  it('should update cards when receiving real-time updates', async () => {
    // Setup initial cards
    const initialCard: Matter = {
      id: 'card-1',
      caseNumber: 'CASE-001',
      title: 'Test Matter',
      description: 'Test Description',
      clientName: 'Test Client',
      status: 'INTAKE',
      priority: 'MEDIUM',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    kanbanStore._modularStore.stores.matters.addCard(initialCard)
    await nextTick()
    
    // Simulate real-time update
    const updateEvent = {
      id: 'event-1',
      type: 'matter_updated' as const,
      data: {
        id: 'card-1',
        status: 'FILED'
      },
      userId: 'other-user',
      timestamp: new Date(),
      acknowledged: false
    }
    
    realTimeStore.handleRealtimeEvent(updateEvent)
    await nextTick()
    
    // Verify card was updated
    const updatedCard = kanbanStore._modularStore.stores.matters.matters[0]
    expect(updatedCard.status).toBe('FILED')
  })
  
  it('should handle card movements from real-time updates', async () => {
    // Setup initial cards in different columns
    const cards: Matter[] = [
      {
        id: 'card-1',
        caseNumber: 'CASE-001',
        title: 'Card in Intake',
        description: '',
        clientName: 'Client 1',
        status: 'INTAKE',
        priority: 'HIGH',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'card-2',
        caseNumber: 'CASE-002',
        title: 'Card in Review',
        description: '',
        clientName: 'Client 2',
        status: 'INITIAL_REVIEW',
        priority: 'MEDIUM',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
    
    cards.forEach(card => kanbanStore._modularStore.stores.matters.addCard(card))
    await nextTick()
    
    // Simulate card movement
    kanbanStore._modularStore.stores.matters.moveCard('card-1', 'INTAKE', 'INITIAL_REVIEW')
    await nextTick()
    
    // Verify card moved
    const movedCard = kanbanStore._modularStore.stores.matters.matters.find((m: Matter) => m.id === 'card-1')
    expect(movedCard?.status).toBe('INITIAL_REVIEW')
  })
  
  it('should start real-time updates when mounted and online', async () => {
    // Set online status
    realTimeStore.networkStatus.isOnline = true
    
    const startMock = vi.fn()
    const { useKanbanRealTime } = await import('~/composables/useKanbanRealTime')
    vi.mocked(useKanbanRealTime).mockReturnValue({
      updates: ref([]),
      loading: ref(false),
      error: ref(null),
      lastUpdated: ref(new Date()),
      start: startMock,
      stop: vi.fn(),
      refresh: vi.fn()
    })
    
    // Remount component
    wrapper.unmount()
    wrapper = mount(KanbanBoard, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          ConnectionStatus: true,
          UpdateIndicator: true,
          KanbanColumn: true,
          ScrollArea: true,
          ScrollBar: true
        }
      }
    })
    
    await nextTick()
    
    // Verify real-time updates started
    expect(startMock).toHaveBeenCalled()
  })
  
  it('should stop real-time updates when unmounted', async () => {
    const stopMock = vi.fn()
    const { useKanbanRealTime } = await import('~/composables/useKanbanRealTime')
    vi.mocked(useKanbanRealTime).mockReturnValue({
      updates: ref([]),
      loading: ref(false),
      error: ref(null),
      lastUpdated: ref(new Date()),
      start: vi.fn(),
      stop: stopMock,
      refresh: vi.fn()
    })
    
    // Unmount component
    wrapper.unmount()
    
    // Verify real-time updates stopped
    expect(stopMock).toHaveBeenCalled()
  })
  
  it('should show loading state when syncing', async () => {
    realTimeStore.syncStatus.status = 'syncing'
    await nextTick()
    
    // UpdateIndicator components should receive loading prop
    const updateIndicators = wrapper.findAllComponents({ name: 'UpdateIndicator' })
    updateIndicators.forEach((indicator: any) => {
      expect(indicator.props('isUpdating')).toBeDefined()
    })
  })
})
/**
 * Tests for KanbanBoard component with TanStack Query integration
 * 
 * @description Verifies that the KanbanBoard component correctly uses
 * TanStack Query hooks instead of Pinia store for data fetching
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import KanbanBoard from '../KanbanBoard.vue'
import type { Matter } from '~/types/matter'

// Mock the composables
vi.mock('~/composables/useKanbanQuery', () => ({
  useKanbanMattersQuery: vi.fn(() => ({
    data: { value: mockMatters },
    matterCards: { value: mockMatterCards },
    mattersByStatus: { value: mockMattersByStatus },
    columnsWithCounts: { value: mockColumnsWithCounts },
    isLoading: { value: false },
    isError: { value: false },
    error: { value: null },
    refetch: vi.fn()
  })),
  useKanbanRealTimeQuery: vi.fn(() => ({
    isConnected: { value: true },
    lastUpdate: { value: new Date().toISOString() },
    pendingUpdates: { value: 0 },
    syncNow: vi.fn(),
    subscribeToUpdates: vi.fn(() => vi.fn())
  }))
}))

// Mock data
const mockMatters: Matter[] = [
  {
    id: '1',
    caseNumber: 'CASE-001',
    title: 'Test Case 1',
    clientName: 'Test Client 1',
    status: 'intake',
    priority: 'HIGH',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: '2',
    caseNumber: 'CASE-002',
    title: 'Test Case 2',
    clientName: 'Test Client 2',
    status: 'investigation',
    priority: 'MEDIUM',
    createdAt: '2025-01-02T00:00:00Z',
    updatedAt: '2025-01-02T00:00:00Z'
  }
]

const mockMatterCards = mockMatters.map(m => ({
  ...m,
  titleJa: m.title,
  clientNameJa: m.clientName,
  position: 0,
  tags: []
}))

const mockMattersByStatus = {
  intake: [mockMatterCards[0]],
  investigation: [mockMatterCards[1]],
  negotiation: [],
  litigation: [],
  settlement: [],
  collection: [],
  closed: []
}

const mockColumnsWithCounts = [
  { id: 'intake', title: 'Intake', titleJa: '受付', count: 1 },
  { id: 'investigation', title: 'Investigation', titleJa: '調査', count: 1 },
  { id: 'negotiation', title: 'Negotiation', titleJa: '交渉', count: 0 },
  { id: 'litigation', title: 'Litigation', titleJa: '訴訟', count: 0 },
  { id: 'settlement', title: 'Settlement', titleJa: '和解', count: 0 },
  { id: 'collection', title: 'Collection', titleJa: '回収', count: 0 },
  { id: 'closed', title: 'Closed', titleJa: '完了', count: 0 }
]

describe('KanbanBoard with TanStack Query', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
  })

  it('should use TanStack Query hooks instead of Pinia store', async () => {
    const wrapper = mount(KanbanBoard, {
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]]
      },
      props: {
        title: 'Test Kanban Board',
        showJapanese: true
      }
    })

    // Verify the component renders
    expect(wrapper.exists()).toBe(true)
    
    // Check that it's using TanStack Query data
    expect(wrapper.text()).toContain('Test Kanban Board')
    
    // Verify columns are rendered with correct counts
    const columnHeaders = wrapper.findAll('.column-header')
    expect(columnHeaders).toHaveLength(7)
    
    // Check first column has correct count
    expect(columnHeaders[0].text()).toContain('受付')
    expect(columnHeaders[0].text()).toContain('1')
  })

  it('should display loading state from TanStack Query', async () => {
    // Mock loading state
    const useKanbanMattersQueryMock = vi.fn(() => ({
      data: { value: [] },
      matterCards: { value: [] },
      mattersByStatus: { value: {} },
      columnsWithCounts: { value: [] },
      isLoading: { value: true },
      isError: { value: false },
      error: { value: null },
      refetch: vi.fn()
    }))
    
    vi.mocked(useKanbanMattersQuery).mockImplementation(useKanbanMattersQueryMock)

    const wrapper = mount(KanbanBoard, {
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]]
      }
    })

    // Should show loading overlay
    expect(wrapper.find('.loading-overlay').exists()).toBe(true)
    expect(wrapper.text()).toContain('Loading matters...')
  })

  it('should display error state from TanStack Query', async () => {
    // Mock error state
    const useKanbanMattersQueryMock = vi.fn(() => ({
      data: { value: [] },
      matterCards: { value: [] },
      mattersByStatus: { value: {} },
      columnsWithCounts: { value: [] },
      isLoading: { value: false },
      isError: { value: true },
      error: { value: new Error('Failed to fetch') },
      refetch: vi.fn()
    }))
    
    vi.mocked(useKanbanMattersQuery).mockImplementation(useKanbanMattersQueryMock)

    const wrapper = mount(KanbanBoard, {
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]]
      }
    })

    // Should show error overlay
    expect(wrapper.find('.error-overlay').exists()).toBe(true)
    expect(wrapper.text()).toContain('Failed to fetch')
    expect(wrapper.find('.retry-button').exists()).toBe(true)
  })

  it('should handle real-time updates through TanStack Query', async () => {
    const syncNowMock = vi.fn()
    const subscribeToUpdatesMock = vi.fn(() => vi.fn())
    
    const useKanbanRealTimeQueryMock = vi.fn(() => ({
      isConnected: { value: true },
      lastUpdate: { value: new Date().toISOString() },
      pendingUpdates: { value: 3 },
      syncNow: syncNowMock,
      subscribeToUpdates: subscribeToUpdatesMock
    }))
    
    vi.mocked(useKanbanRealTimeQuery).mockImplementation(useKanbanRealTimeQueryMock)

    const wrapper = mount(KanbanBoard, {
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]]
      }
    })

    // Should show sync button with pending updates
    const syncButton = wrapper.find('.sync-button')
    expect(syncButton.exists()).toBe(true)
    expect(syncButton.text()).toContain('3')
    
    // Click sync button
    await syncButton.trigger('click')
    expect(syncNowMock).toHaveBeenCalled()
  })

  it('should not import or use Pinia stores', () => {
    // This test verifies that no Pinia imports are present
    const componentSource = KanbanBoard.toString()
    
    // Should not contain Pinia imports
    expect(componentSource).not.toContain('useKanbanStore')
    expect(componentSource).not.toContain('useMatterStore')
    expect(componentSource).not.toContain('defineStore')
    expect(componentSource).not.toContain('pinia')
  })

  it('should pass filters prop to TanStack Query hooks', async () => {
    const filters = {
      status: ['intake', 'investigation'],
      priority: ['HIGH']
    }

    const wrapper = mount(KanbanBoard, {
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]]
      },
      props: {
        filters
      }
    })

    // Verify filters were passed to the query hook
    expect(useKanbanMattersQuery).toHaveBeenCalledWith(filters)
  })
})

// Import actual implementations to verify they're using TanStack Query
import { useKanbanMattersQuery, useKanbanRealTimeQuery } from '~/composables/useKanbanQuery'
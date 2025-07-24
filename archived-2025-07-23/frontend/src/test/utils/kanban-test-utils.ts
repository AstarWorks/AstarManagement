/**
 * Kanban Testing Utilities
 * 
 * Comprehensive testing utilities for Kanban board components, composables, and stores.
 * Provides mock data, mounting helpers, and assertion utilities.
 */

/// <reference types="vitest/globals" />

// vi is available globally due to vitest config with globals: true
import { mount, shallowMount, type VueWrapper, type MountingOptions } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { ref } from 'vue'
import type { App } from 'vue'
import type { Matter, MatterStatus, MatterPriority } from '~/types/matter'
import type { MatterCard } from '~/types/kanban'

// ===== MOCK DATA FACTORIES =====

/**
 * Creates a mock Matter object with customizable properties
 */
export function createMockMatter(overrides: Partial<Matter> = {}): Matter {
  const baseId = Math.random().toString(36).substr(2, 9)
  
  return {
    id: `matter-${baseId}`,
    caseNumber: `CASE-${baseId.toUpperCase()}`,
    title: `Test Matter ${baseId}`,
    clientName: `Test Client ${baseId}`,
    status: 'INTAKE' as MatterStatus,
    priority: 'MEDIUM' as MatterPriority,
    description: `Test description for matter ${baseId}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    assignedLawyer: 'test-lawyer',
    tags: ['test', 'automation'],
    ...overrides
  }
}

/**
 * Creates a mock MatterCard object with position and drag-drop properties
 */
export function createMockMatterCard(overrides: Partial<MatterCard> = {}): MatterCard {
  const baseId = Math.random().toString(36).substr(2, 9)
  
  return {
    id: overrides.id || `matter-${baseId}`,
    caseNumber: overrides.caseNumber || `CASE-${baseId.toUpperCase()}`,
    title: overrides.title || `Test Matter ${baseId}`,
    clientName: overrides.clientName || `Test Client ${baseId}`,
    status: overrides.status || 'INTAKE',
    priority: overrides.priority || 'MEDIUM',
    description: overrides.description,
    createdAt: overrides.createdAt || new Date().toISOString(),
    updatedAt: overrides.updatedAt || new Date().toISOString(),
    dueDate: overrides.dueDate,
    assignedLawyer: overrides.assignedLawyer,
    assignedClerk: overrides.assignedClerk,
    position: overrides.position ?? 0,
    opponentName: overrides.opponentName,
    statusDuration: overrides.statusDuration,
    isOverdue: overrides.isOverdue,
    relatedDocuments: overrides.relatedDocuments,
    tags: overrides.tags,
    searchHighlights: overrides.searchHighlights,
    relevanceScore: overrides.relevanceScore
  }
}

/**
 * Creates multiple mock matters with different statuses
 */
export function createMockMattersByStatus(): Record<MatterStatus, MatterCard[]> {
  return {
    INTAKE: [
      createMockMatterCard({ id: 'matter-1', title: 'New Case Intake', status: 'INTAKE', position: 0 }),
      createMockMatterCard({ id: 'matter-2', title: 'Client Consultation', status: 'INTAKE', position: 1 })
    ],
    INITIAL_REVIEW: [
      createMockMatterCard({ id: 'matter-3', title: 'Evidence Review', status: 'INITIAL_REVIEW', position: 0 }),
      createMockMatterCard({ id: 'matter-4', title: 'Fact Finding', status: 'INITIAL_REVIEW', position: 1 })
    ],
    IN_PROGRESS: [
      createMockMatterCard({ id: 'matter-5', title: 'Settlement Talks', status: 'IN_PROGRESS', position: 0 })
    ],
    REVIEW: [
      createMockMatterCard({ id: 'matter-6', title: 'Court Filing', status: 'REVIEW', position: 0 })
    ],
    WAITING_CLIENT: [],
    READY_FILING: [],
    CLOSED: [
      createMockMatterCard({ id: 'matter-7', title: 'Case Completed', status: 'CLOSED', position: 0 })
    ]
  }
}

/**
 * Creates mock column data with counts
 */
export function createMockColumnsWithCounts() {
  return [
    { id: 'INTAKE', title: 'Intake', titleJa: '受付', count: 2 },
    { id: 'INITIAL_REVIEW', title: 'Initial Review', titleJa: '初期審査', count: 2 },
    { id: 'IN_PROGRESS', title: 'In Progress', titleJa: '進行中', count: 1 },
    { id: 'REVIEW', title: 'Review', titleJa: 'レビュー', count: 1 },
    { id: 'WAITING_CLIENT', title: 'Waiting Client', titleJa: 'クライアント待ち', count: 0 },
    { id: 'READY_FILING', title: 'Ready for Filing', titleJa: '提出準備完了', count: 0 },
    { id: 'CLOSED', title: 'Closed', titleJa: '完了', count: 1 }
  ]
}

// ===== MOCK COMPOSABLES =====

/**
 * Creates mock TanStack Query hooks for Kanban
 */
export function createMockKanbanQuery(overrides: Record<string, any> = {}) {
  const mockMatters = Object.values(createMockMattersByStatus()).flat()
  const mockMattersByStatus = createMockMattersByStatus()
  const mockColumnsWithCounts = createMockColumnsWithCounts()

  return {
    useKanbanMattersQuery: vi.fn(() => ({
      data: { value: mockMatters },
      matterCards: { value: mockMatters },
      mattersByStatus: { value: mockMattersByStatus },
      columnsWithCounts: { value: mockColumnsWithCounts },
      isLoading: { value: false },
      isError: { value: false },
      error: { value: null },
      refetch: vi.fn(),
      ...overrides.query
    })),
    useKanbanRealTimeQuery: vi.fn(() => ({
      isConnected: { value: true },
      lastUpdate: { value: new Date().toISOString() },
      pendingUpdates: { value: 0 },
      syncNow: vi.fn(),
      subscribeToUpdates: vi.fn(() => vi.fn()),
      ...overrides.realTime
    }))
  }
}

/**
 * Creates mock Kanban mutations
 */
export function createMockKanbanMutations(overrides: Record<string, any> = {}) {
  return {
    useKanbanMutations: vi.fn(() => ({
      updateMatterStatus: {
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isLoading: false,
        isError: false,
        error: null,
        ...overrides.updateMatterStatus
      },
      reorderMatters: {
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isLoading: false,
        isError: false,
        error: null,
        ...overrides.reorderMatters
      },
      updateMatter: {
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isLoading: false,
        isError: false,
        error: null,
        ...overrides.updateMatter
      }
    }))
  }
}

/**
 * Creates mock drag-drop composables
 */
export function createMockKanbanDragDrop(overrides: Record<string, any> = {}) {
  return {
    useKanbanDragDrop: vi.fn(() => ({
      isDragging: { value: false },
      draggedItem: { value: null },
      dropZone: { value: null },
      startDrag: vi.fn(),
      endDrag: vi.fn(),
      onDrop: vi.fn(),
      canDrop: vi.fn(() => true),
      ...overrides
    })),
    useKanbanDragDropEnhanced: vi.fn(() => ({
      isDragging: { value: false },
      draggedItem: { value: null },
      dropZone: { value: null },
      optimisticUpdate: { value: null },
      performanceMetrics: { value: { fps: 60, avgFrameTime: 16 } },
      handleOptimisticDragStart: vi.fn(),
      handleOptimisticDrop: vi.fn(),
      rollbackOptimisticUpdate: vi.fn(),
      ...overrides
    }))
  }
}

// ===== MOCK STORES =====

/**
 * Creates mock Pinia stores for Kanban
 */
export function createMockKanbanStores() {
  return {
    useMattersStore: vi.fn(() => ({
      matters: [],
      mattersByStatus: createMockMattersByStatus(),
      isLoading: false,
      error: null,
      fetchMatters: vi.fn(),
      updateMatterStatus: vi.fn(),
      reorderMatters: vi.fn(),
      addMatter: vi.fn(),
      updateMatter: vi.fn(),
      deleteMatter: vi.fn()
    })),
    useUIStore: vi.fn(() => ({
      kanbanFilters: {
        search: '',
        status: [],
        priority: [],
        assignee: []
      },
      kanbanView: {
        showJapanese: false,
        cardSize: 'normal',
        showAssignee: true,
        showDueDate: true
      },
      updateFilters: vi.fn(),
      updateView: vi.fn(),
      resetFilters: vi.fn()
    })),
    useRealTimeStore: vi.fn(() => ({
      isConnected: true,
      lastUpdate: new Date().toISOString(),
      pendingUpdates: 0,
      connect: vi.fn(),
      disconnect: vi.fn(),
      subscribeToUpdates: vi.fn(),
      syncNow: vi.fn()
    }))
  }
}

// ===== COMPONENT MOUNTING HELPERS =====

/**
 * Configuration for Kanban component mounting
 */
export interface KanbanMountingOptions extends Partial<MountingOptions<any>> {
  queryClient?: QueryClient
  pinia?: Pinia
  mockQuery?: Record<string, any>
  mockMutations?: Record<string, any>
  mockDragDrop?: Record<string, any>
  mockStores?: Record<string, any>
  shallow?: boolean
}

/**
 * Creates a QueryClient for testing
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0
      },
      mutations: {
        retry: false
      }
    }
  })
}

/**
 * Creates test Pinia instance
 */
export function createTestPinia(): Pinia {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

/**
 * Mounts a Kanban component with all necessary providers and mocks
 */
export function mountKanbanComponent(
  component: any,
  options: KanbanMountingOptions = {}
): VueWrapper<any> {
  const {
    queryClient = createTestQueryClient(),
    pinia = createTestPinia(),
    mockQuery = {},
    mockMutations = {},
    mockDragDrop = {},
    mockStores = {},
    shallow = false,
    ...mountingOptions
  } = options

  // Set up global mocks
  const queryMocks = createMockKanbanQuery(mockQuery)
  const mutationMocks = createMockKanbanMutations(mockMutations)
  const dragDropMocks = createMockKanbanDragDrop(mockDragDrop)
  const storeMocks = createMockKanbanStores()

  // Mock composables
  vi.mocked(vi.doMock)('~/composables/useKanbanQuery', () => queryMocks)
  vi.mocked(vi.doMock)('~/composables/useKanbanMutations', () => mutationMocks)
  vi.mocked(vi.doMock)('~/composables/useKanbanDragDrop', () => dragDropMocks.useKanbanDragDrop)
  vi.mocked(vi.doMock)('~/composables/useKanbanDragDropEnhanced', () => dragDropMocks.useKanbanDragDropEnhanced)

  // Mock stores
  Object.entries({ ...storeMocks, ...mockStores }).forEach(([name, mock]) => {
    vi.doMock(`~/stores/${name.replace('use', '').replace('Store', '').toLowerCase()}`, () => ({ [name]: mock }))
  })

  const mountFunction = shallow ? shallowMount : mount

  return mountFunction(component, {
    global: {
      plugins: [
        [VueQueryPlugin, { queryClient }],
        pinia
      ],
      stubs: {
        'Transition': false,
        'TransitionGroup': false,
        'NuxtLink': {
          template: '<a><slot /></a>',
          props: ['to', 'href']
        },
        'RouterLink': {
          template: '<a><slot /></a>',
          props: ['to']
        },
        // Stub Kanban components
        'KanbanColumn': {
          template: '<div class="kanban-column-stub"><slot /></div>',
          props: ['column', 'matters', 'showJapanese', 'style']
        },
        // Stub UI components
        'ScrollArea': {
          template: '<div class="scroll-area-stub"><slot /></div>'
        },
        'ScrollBar': {
          template: '<div class="scroll-bar-stub"></div>',
          props: ['orientation']
        },
        'UpdateIndicator': {
          template: '<div class="update-indicator-stub"><slot /></div>',
          props: ['isUpdating', 'lastUpdate']
        },
        'ConnectionStatus': {
          template: '<div class="connection-status-stub"></div>',
          props: ['isConnected']
        }
      },
      ...mountingOptions.global
    },
    ...mountingOptions
  })
}

// ===== DRAG-DROP EVENT HELPERS =====

/**
 * Creates a mock drag event
 */
export function createMockDragEvent(
  type: 'dragstart' | 'dragover' | 'drop' | 'dragend',
  overrides: Partial<DragEvent> = {}
): DragEvent {
  const dataTransfer = {
    setData: vi.fn(),
    getData: vi.fn(),
    clearData: vi.fn(),
    setDragImage: vi.fn(),
    effectAllowed: 'all' as DataTransfer['effectAllowed'],
    dropEffect: 'move' as DataTransfer['dropEffect'],
    files: [] as unknown as FileList,
    items: [] as unknown as DataTransferItemList,
    types: []
  }

  return new DragEvent(type, {
    bubbles: true,
    cancelable: true,
    dataTransfer,
    ...overrides
  }) as DragEvent
}

/**
 * Creates a mock touch event for mobile testing
 */
export function createMockTouchEvent(
  type: 'touchstart' | 'touchmove' | 'touchend',
  touches: Array<{ clientX: number; clientY: number }> = [{ clientX: 100, clientY: 100 }]
): TouchEvent {
  const touchList = touches.map((touch, index) => ({
    identifier: index,
    target: document.createElement('div'),
    ...touch,
    screenX: touch.clientX,
    screenY: touch.clientY,
    pageX: touch.clientX,
    pageY: touch.clientY,
    radiusX: 10,
    radiusY: 10,
    rotationAngle: 0,
    force: 1
  }))

  return new TouchEvent(type, {
    bubbles: true,
    cancelable: true,
    touches: touchList as any,
    targetTouches: touchList as any,
    changedTouches: touchList as any
  })
}

/**
 * Simulates a complete drag-and-drop operation
 */
export async function simulateDragAndDrop(
  wrapper: VueWrapper<any>,
  sourceSelector: string,
  targetSelector: string,
  matterId: string = 'matter-1'
): Promise<void> {
  const sourceElement = wrapper.find(sourceSelector)
  const targetElement = wrapper.find(targetSelector)

  if (!sourceElement.exists() || !targetElement.exists()) {
    throw new Error(`Source or target element not found: ${sourceSelector} -> ${targetSelector}`)
  }

  // Start drag
  const dragStartEvent = createMockDragEvent('dragstart')
  dragStartEvent.dataTransfer!.setData('text/plain', matterId)
  await sourceElement.trigger('dragstart', dragStartEvent)

  // Drag over target
  const dragOverEvent = createMockDragEvent('dragover')
  await targetElement.trigger('dragover', dragOverEvent)

  // Drop on target
  const dropEvent = createMockDragEvent('drop')
  dropEvent.dataTransfer!.getData = vi.fn(() => matterId)
  await targetElement.trigger('drop', dropEvent)

  // End drag
  const dragEndEvent = createMockDragEvent('dragend')
  await sourceElement.trigger('dragend', dragEndEvent)

  // Allow Vue to process updates
  await wrapper.vm.$nextTick()
}

// ===== ASSERTION HELPERS =====

/**
 * Asserts that a matter card is rendered correctly
 */
export function assertMatterCardRendered(
  wrapper: VueWrapper<any>,
  matter: Matter,
  options: { showJapanese?: boolean } = {}
): void {
  const { showJapanese = false } = options

  const cardElement = wrapper.find(`[data-testid="matter-card-${matter.id}"]`)
  expect(cardElement.exists()).toBe(true)

  const title = matter.title
  const clientName = matter.clientName

  expect(cardElement.text()).toContain(title)
  expect(cardElement.text()).toContain(clientName)
  expect(cardElement.text()).toContain(matter.caseNumber)
}

/**
 * Asserts that a column contains the expected number of matters
 */
export function assertColumnMatterCount(
  wrapper: VueWrapper<any>,
  status: MatterStatus,
  expectedCount: number
): void {
  const columnElement = wrapper.find(`[data-testid="kanban-column-${status}"]`)
  expect(columnElement.exists()).toBe(true)

  const matterCards = columnElement.findAll('[data-testid^="matter-card-"]')
  expect(matterCards).toHaveLength(expectedCount)

  // Check header count display
  const headerElement = columnElement.find('.column-header')
  if (headerElement.exists()) {
    expect(headerElement.text()).toContain(expectedCount.toString())
  }
}

/**
 * Asserts that drag-and-drop is properly configured
 */
export function assertDragDropEnabled(
  wrapper: VueWrapper<any>,
  matterId: string
): void {
  const cardElement = wrapper.find(`[data-testid="matter-card-${matterId}"]`)
  expect(cardElement.exists()).toBe(true)
  expect(cardElement.attributes('draggable')).toBe('true')
}

/**
 * Asserts that accessibility attributes are present
 */
export function assertAccessibilityAttributes(
  wrapper: VueWrapper<any>,
  selector: string,
  expectedAttributes: Record<string, string>
): void {
  const element = wrapper.find(selector)
  expect(element.exists()).toBe(true)

  Object.entries(expectedAttributes).forEach(([attr, value]) => {
    expect(element.attributes(attr)).toBe(value)
  })
}

// ===== PERFORMANCE TESTING HELPERS =====

/**
 * Measures component render time
 */
export async function measureRenderTime(
  component: any,
  props: Record<string, any> = {},
  iterations: number = 10
): Promise<{ average: number; min: number; max: number }> {
  const times: number[] = []

  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    const wrapper = mountKanbanComponent(component, { props })
    await wrapper.vm.$nextTick()
    const end = performance.now()
    times.push(end - start)
    wrapper.unmount()
  }

  return {
    average: times.reduce((sum, time) => sum + time, 0) / times.length,
    min: Math.min(...times),
    max: Math.max(...times)
  }
}

/**
 * Tests memory leaks in component mounting/unmounting
 */
export async function testMemoryLeaks(
  component: any,
  iterations: number = 100
): Promise<void> {
  const initialMemory = (performance as any).memory?.usedJSHeapSize || 0

  for (let i = 0; i < iterations; i++) {
    const wrapper = mountKanbanComponent(component)
    await wrapper.vm.$nextTick()
    wrapper.unmount()
  }

  // Force garbage collection if available
  if (global.gc) {
    global.gc()
  }

  const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
  const memoryIncrease = finalMemory - initialMemory

  // Memory should not increase significantly (more than 10MB)
  expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
}

// ===== EXPORT ALL UTILITIES =====

export {
  // Re-export common testing functions
  mount,
  shallowMount,
  type VueWrapper,
  type MountingOptions
}

// Export vi from global scope
export { vi }
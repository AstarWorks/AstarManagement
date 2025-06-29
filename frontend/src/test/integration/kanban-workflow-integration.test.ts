/**
 * Kanban Workflow Integration Tests
 * 
 * @description Tests complex user workflows in the Kanban board including
 * drag-and-drop, multi-component interactions, and state synchronization
 * @author Claude
 * @created 2025-06-26
 * @task T02_S09 - Integration Testing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mountWithQuery, createMockMatter, waitForAsync, findByTestId } from '@/test/utils'
import { setActivePinia, createPinia } from 'pinia'
import { QueryClient } from '@tanstack/vue-query'
import { nextTick } from 'vue'
import KanbanBoard from '@/components/kanban/KanbanBoard.vue'
import { useKanbanStore } from '@/stores/kanban'
import { useMatterStore } from '@/stores/kanban/matters'
import { useUIPreferencesStore } from '@/stores/kanban/ui-preferences'

describe('Kanban Workflow Integration', () => {
  let pinia: any
  let queryClient: QueryClient

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })

    // Mock successful API responses
    global.$fetch = vi.fn().mockResolvedValue([])
    
    vi.clearAllMocks()
  })

  afterEach(() => {
    queryClient.clear()
    vi.clearAllMocks()
  })

  describe('Drag and Drop Workflow', () => {
    it('should complete full drag-and-drop workflow with state updates', async () => {
      const matters = [
        createMockMatter({ 
          id: 'matter-1', 
          title: 'Legal Matter 1',
          status: 'INTAKE',
          position: 1000
        }),
        createMockMatter({ 
          id: 'matter-2', 
          title: 'Legal Matter 2',
          status: 'IN_PROGRESS',
          position: 1000
        })
      ]

      // Mock API responses for different endpoints
      global.$fetch = vi.fn()
        .mockResolvedValueOnce(matters) // Initial load
        .mockResolvedValueOnce({ success: true }) // Move API call

      const wrapper = mountWithQuery(KanbanBoard, {
        piniaInitialState: {
          matters: { matters, isLoading: false },
          kanban: { columns: ['INTAKE', 'IN_PROGRESS', 'COMPLETED'] }
        }
      })

      await waitForAsync(wrapper)

      const kanbanStore = useKanbanStore()
      const matterStore = useMatterStore()

      // Find source matter card
      const matterCard = findByTestId(wrapper, 'matter-card-matter-1')
      expect(matterCard.exists()).toBe(true)

      // Find target column
      const targetColumn = findByTestId(wrapper, 'column-IN_PROGRESS')
      expect(targetColumn.exists()).toBe(true)

      // Simulate drag start
      await matterCard.trigger('dragstart', {
        dataTransfer: {
          setData: vi.fn(),
          getData: vi.fn().mockReturnValue('matter-1')
        }
      })

      // Verify drag state is set
      expect(kanbanStore.dragState.isDragging).toBe(true)
      expect(kanbanStore.dragState.draggedMatter?.id).toBe('matter-1')

      // Simulate drag over target column
      await targetColumn.trigger('dragover', {
        preventDefault: vi.fn()
      })

      // Simulate drop
      await targetColumn.trigger('drop', {
        preventDefault: vi.fn(),
        dataTransfer: {
          getData: vi.fn().mockReturnValue('matter-1')
        }
      })

      await waitForAsync(wrapper)

      // Verify matter was moved in store
      const updatedMatter = matterStore.getMatterById('matter-1')
      expect(updatedMatter?.status).toBe('IN_PROGRESS')

      // Verify API was called
      expect(global.$fetch).toHaveBeenCalledWith(
        '/api/matters/matter-1/move',
        expect.objectContaining({
          method: 'PATCH',
          body: expect.objectContaining({
            fromStatus: 'INTAKE',
            toStatus: 'IN_PROGRESS'
          })
        })
      )

      // Verify drag state is cleared
      expect(kanbanStore.dragState.isDragging).toBe(false)
      expect(kanbanStore.dragState.draggedMatter).toBeNull()
    })

    it('should handle drag-and-drop with position calculations', async () => {
      const matters = [
        createMockMatter({ id: 'matter-1', status: 'INTAKE', position: 1000 }),
        createMockMatter({ id: 'matter-2', status: 'INTAKE', position: 2000 }),
        createMockMatter({ id: 'matter-3', status: 'INTAKE', position: 3000 }),
      ]

      global.$fetch = vi.fn()
        .mockResolvedValueOnce(matters)
        .mockResolvedValueOnce({ success: true })

      const wrapper = mountWithQuery(KanbanBoard, {
        piniaInitialState: {
          matters: { matters, isLoading: false }
        }
      })

      await waitForAsync(wrapper)

      const kanbanStore = useKanbanStore()

      // Drag matter-3 to position between matter-1 and matter-2
      await kanbanStore.moveMatter('matter-3', 'INTAKE', 'INTAKE', 1)

      const reorderedMatters = kanbanStore.getMattersByStatus('INTAKE')
      const positions = reorderedMatters.map(m => m.position).sort((a, b) => a - b)

      // Verify positions are properly calculated
      expect(positions[0]).toBeLessThan(positions[1])
      expect(positions[1]).toBeLessThan(positions[2])

      // Verify the middle position is between the other two
      const matter3Position = reorderedMatters.find(m => m.id === 'matter-3')?.position
      expect(matter3Position).toBeGreaterThan(1000)
      expect(matter3Position).toBeLessThan(2000)
    })

    it('should handle drag cancellation gracefully', async () => {
      const matters = [createMockMatter({ id: 'matter-1', status: 'INTAKE' })]

      const wrapper = mountWithQuery(KanbanBoard, {
        piniaInitialState: {
          matters: { matters, isLoading: false }
        }
      })

      const kanbanStore = useKanbanStore()
      const matterCard = findByTestId(wrapper, 'matter-card-matter-1')

      // Start drag
      await matterCard.trigger('dragstart')
      expect(kanbanStore.dragState.isDragging).toBe(true)

      // Cancel drag (e.g., press Escape)
      await matterCard.trigger('keydown', { key: 'Escape' })

      // Verify drag state is cleared
      expect(kanbanStore.dragState.isDragging).toBe(false)
      expect(kanbanStore.dragState.draggedMatter).toBeNull()

      // Verify matter position unchanged
      const matter = kanbanStore.getMatterById('matter-1')
      expect(matter?.status).toBe('INTAKE')
    })
  })

  describe('Multi-Component State Synchronization', () => {
    it('should synchronize state across multiple components', async () => {
      const matters = [
        createMockMatter({ id: 'matter-1', status: 'INTAKE' }),
        createMockMatter({ id: 'matter-2', status: 'IN_PROGRESS' })
      ]

      global.$fetch = vi.fn().mockResolvedValue(matters)

      const wrapper = mountWithQuery(KanbanBoard, {
        piniaInitialState: {
          matters: { matters, isLoading: false }
        }
      })

      await waitForAsync(wrapper)

      const kanbanStore = useKanbanStore()
      const matterStore = useMatterStore()

      // Update matter in one store
      matterStore.updateMatter('matter-1', { priority: 'HIGH' })

      await nextTick()

      // Verify change is reflected in kanban store
      const kanbanMatter = kanbanStore.getMatterById('matter-1')
      expect(kanbanMatter?.priority).toBe('HIGH')

      // Verify UI components reflect the change
      const matterCard = findByTestId(wrapper, 'matter-card-matter-1')
      expect(matterCard.text()).toContain('HIGH')
    })

    it('should handle concurrent updates from multiple sources', async () => {
      const matters = [createMockMatter({ id: 'matter-1', status: 'INTAKE' })]

      const wrapper = mountWithQuery(KanbanBoard, {
        piniaInitialState: {
          matters: { matters, isLoading: false }
        }
      })

      const kanbanStore = useKanbanStore()
      const matterStore = useMatterStore()

      // Mock successful API responses
      global.$fetch = vi.fn().mockResolvedValue({ success: true })

      // Simulate concurrent updates
      const update1 = kanbanStore.moveMatter('matter-1', 'INTAKE', 'IN_PROGRESS', 0)
      const update2 = matterStore.updateMatter('matter-1', { priority: 'HIGH' })

      await Promise.all([update1, update2])

      // Verify both updates are applied
      const finalMatter = matterStore.getMatterById('matter-1')
      expect(finalMatter?.status).toBe('IN_PROGRESS')
      expect(finalMatter?.priority).toBe('HIGH')
    })
  })

  describe('Error Handling in Workflows', () => {
    it('should handle drag-and-drop API failures with rollback', async () => {
      const matters = [createMockMatter({ id: 'matter-1', status: 'INTAKE' })]

      const wrapper = mountWithQuery(KanbanBoard, {
        piniaInitialState: {
          matters: { matters, isLoading: false }
        }
      })

      const kanbanStore = useKanbanStore()

      // Mock API failure
      global.$fetch = vi.fn().mockRejectedValue(new Error('API Error'))

      // Attempt move operation
      const movePromise = kanbanStore.moveMatter('matter-1', 'INTAKE', 'IN_PROGRESS', 0)

      // Verify optimistic update occurs
      let matter = kanbanStore.getMatterById('matter-1')
      expect(matter?.status).toBe('IN_PROGRESS')

      // Wait for API failure and rollback
      await expect(movePromise).rejects.toThrow('API Error')

      // Verify rollback occurred
      matter = kanbanStore.getMatterById('matter-1')
      expect(matter?.status).toBe('INTAKE')

      // Verify error state is set
      expect(kanbanStore.error).toBeTruthy()
    })

    it('should display error notifications to user', async () => {
      const matters = [createMockMatter({ id: 'matter-1', status: 'INTAKE' })]

      const wrapper = mountWithQuery(KanbanBoard, {
        piniaInitialState: {
          matters: { matters, isLoading: false }
        }
      })

      const kanbanStore = useKanbanStore()

      // Mock API failure
      global.$fetch = vi.fn().mockRejectedValue(new Error('Network Error'))

      // Attempt operation that fails
      await kanbanStore.moveMatter('matter-1', 'INTAKE', 'IN_PROGRESS', 0).catch(() => {})

      await nextTick()

      // Verify error notification is displayed
      const errorNotification = findByTestId(wrapper, 'error-notification')
      expect(errorNotification.exists()).toBe(true)
      expect(errorNotification.text()).toContain('Failed to move matter')
    })
  })

  describe('Performance in Complex Workflows', () => {
    it('should handle large datasets efficiently during drag operations', async () => {
      // Create large dataset
      const largeDataset = Array.from({ length: 500 }, (_, i) => 
        createMockMatter({ 
          id: `matter-${i}`, 
          status: i % 3 === 0 ? 'INTAKE' : i % 3 === 1 ? 'IN_PROGRESS' : 'COMPLETED'
        })
      )

      global.$fetch = vi.fn().mockResolvedValue({ success: true })

      const wrapper = mountWithQuery(KanbanBoard, {
        piniaInitialState: {
          matters: { matters: largeDataset, isLoading: false }
        }
      })

      const kanbanStore = useKanbanStore()

      const startTime = performance.now()

      // Perform drag operation
      await kanbanStore.moveMatter('matter-100', 'INTAKE', 'IN_PROGRESS', 0)

      const endTime = performance.now()

      // Verify operation completed in reasonable time
      expect(endTime - startTime).toBeLessThan(100) // Less than 100ms

      // Verify operation was successful
      const movedMatter = kanbanStore.getMatterById('matter-100')
      expect(movedMatter?.status).toBe('IN_PROGRESS')
    })

    it('should batch UI updates during rapid operations', async () => {
      const matters = Array.from({ length: 10 }, (_, i) => 
        createMockMatter({ id: `matter-${i}`, status: 'INTAKE' })
      )

      const wrapper = mountWithQuery(KanbanBoard, {
        piniaInitialState: {
          matters: { matters, isLoading: false }
        }
      })

      const kanbanStore = useKanbanStore()
      global.$fetch = vi.fn().mockResolvedValue({ success: true })

      // Perform rapid operations
      const operations = matters.slice(0, 5).map((matter, index) => 
        kanbanStore.moveMatter(matter.id, 'INTAKE', 'IN_PROGRESS', index)
      )

      await Promise.all(operations)

      // Verify all operations completed successfully
      const inProgressMatters = kanbanStore.getMattersByStatus('IN_PROGRESS')
      expect(inProgressMatters).toHaveLength(5)

      // Verify UI reflects final state
      await nextTick()
      const inProgressColumn = findByTestId(wrapper, 'column-IN_PROGRESS')
      const matterCards = inProgressColumn.findAll('[data-testid^="matter-card-"]')
      expect(matterCards).toHaveLength(5)
    })
  })

  describe('User Preferences Integration', () => {
    it('should apply user preferences to workflow behavior', async () => {
      const matters = [createMockMatter({ id: 'matter-1', status: 'INTAKE' })]

      const wrapper = mountWithQuery(KanbanBoard, {
        piniaInitialState: {
          matters: { matters, isLoading: false },
          uiPreferences: {
            confirmBeforeMove: true,
            showAnimations: true,
            compactView: false
          }
        }
      })

      const kanbanStore = useKanbanStore()
      const uiPrefsStore = useUIPreferencesStore()

      // Mock confirmation dialog
      global.confirm = vi.fn().mockReturnValue(true)

      // Attempt move with confirmation enabled
      await kanbanStore.moveMatter('matter-1', 'INTAKE', 'IN_PROGRESS', 0)

      // Verify confirmation was shown
      expect(global.confirm).toHaveBeenCalledWith(
        expect.stringContaining('move this matter')
      )

      // Verify move completed
      const matter = kanbanStore.getMatterById('matter-1')
      expect(matter?.status).toBe('IN_PROGRESS')
    })

    it('should respect animation preferences during workflows', async () => {
      const matters = [createMockMatter({ id: 'matter-1', status: 'INTAKE' })]

      const wrapper = mountWithQuery(KanbanBoard, {
        piniaInitialState: {
          matters: { matters, isLoading: false },
          uiPreferences: {
            showAnimations: false
          }
        }
      })

      const kanbanStore = useKanbanStore()

      // Perform move operation
      await kanbanStore.moveMatter('matter-1', 'INTAKE', 'IN_PROGRESS', 0)

      await nextTick()

      // Verify no animation classes are applied
      const matterCard = findByTestId(wrapper, 'matter-card-matter-1')
      expect(matterCard.classes()).not.toContain('animate-move')
      expect(matterCard.classes()).not.toContain('transition-transform')
    })
  })
})
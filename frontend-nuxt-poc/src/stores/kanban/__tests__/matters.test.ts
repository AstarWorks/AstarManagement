import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMatterStore } from '../matters'
import type { Matter, MatterStatus } from '~/types/kanban'

// Mock $fetch
const mockFetch = vi.fn()
globalThis.$fetch = mockFetch

// Mock console for error testing
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

// Mock matter data
const mockMatter: Matter = {
  id: 'matter-1',
  caseNumber: '2025-CV-0001',
  title: 'Test Legal Matter',
  description: 'A test legal matter',
  clientName: 'Test Client',
  status: 'INTAKE',
  priority: 'MEDIUM',
  assignedLawyer: {
    id: 'lawyer-1',
    name: 'John Doe',
    avatar: 'avatar.jpg',
    initials: 'JD'
  },
  dueDate: '2025-02-01T00:00:00Z',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-15T00:00:00Z',
  relatedDocuments: 5,
  tags: ['contract', 'review']
}

const mockMatters: Matter[] = [
  mockMatter,
  {
    ...mockMatter,
    id: 'matter-2',
    title: 'Another Matter',
    status: 'IN_PROGRESS',
    priority: 'HIGH'
  }
]

describe('Matter Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    consoleErrorSpy.mockClear()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const store = useMatterStore()
      
      expect(store.matters).toEqual([])
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.loadingStatus.isLoading).toBe(false)
      expect(store.loadingStatus.error).toBeNull()
    })
  })

  describe('Load Matters', () => {
    it('should load matters successfully', async () => {
      const store = useMatterStore()
      mockFetch.mockResolvedValueOnce(mockMatters)

      await store.loadMatters()

      expect(store.matters).toEqual(mockMatters)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
      expect(mockFetch).toHaveBeenCalledWith('/api/matters')
    })

    it('should handle load matters error', async () => {
      const store = useMatterStore()
      const error = new Error('Failed to fetch')
      mockFetch.mockRejectedValueOnce(error)

      await expect(store.loadMatters()).rejects.toThrow('Failed to fetch')
      
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe('Failed to load matters')
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load matters:', error)
    })

    it('should force reload when specified', async () => {
      const store = useMatterStore()
      
      // First load
      mockFetch.mockResolvedValueOnce(mockMatters)
      await store.loadMatters()
      expect(mockFetch).toHaveBeenCalledTimes(1)

      // Second load without force should not call API again
      await store.loadMatters()
      expect(mockFetch).toHaveBeenCalledTimes(1)

      // Force reload should call API
      mockFetch.mockResolvedValueOnce(mockMatters)
      await store.loadMatters(true)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('Create Matter', () => {
    const newMatterData = {
      title: 'New Matter',
      description: 'A new legal matter',
      clientName: 'New Client',
      priority: 'HIGH' as const
    }

    it('should create matter successfully', async () => {
      const store = useMatterStore()
      const createdMatter = { ...mockMatter, ...newMatterData }
      mockFetch.mockResolvedValueOnce(createdMatter)

      const result = await store.createMatter(newMatterData)

      expect(result).toEqual(createdMatter)
      expect(store.matters).toContain(createdMatter)
      expect(mockFetch).toHaveBeenCalledWith('/api/matters', {
        method: 'POST',
        body: newMatterData
      })
    })

    it('should handle create matter error', async () => {
      const store = useMatterStore()
      const error = new Error('Create failed')
      mockFetch.mockRejectedValueOnce(error)

      await expect(store.createMatter(newMatterData)).rejects.toThrow('Create failed')
      expect(store.error).toBe('Failed to create matter')
    })
  })

  describe('Update Matter', () => {
    it('should update matter optimistically', async () => {
      const store = useMatterStore()
      store.matters.push(mockMatter)
      
      const updates = { title: 'Updated Title', priority: 'HIGH' as const }
      mockFetch.mockResolvedValueOnce({ ...mockMatter, ...updates })

      const result = await store.updateMatter('matter-1', updates)

      expect(result.title).toBe('Updated Title')
      expect(result.priority).toBe('HIGH')
      expect(store.matters[0].title).toBe('Updated Title')
    })

    it('should rollback on update error', async () => {
      const store = useMatterStore()
      store.matters.push(mockMatter)
      const originalTitle = mockMatter.title
      
      const updates = { title: 'Updated Title' }
      const error = new Error('Update failed')
      mockFetch.mockRejectedValueOnce(error)

      await expect(store.updateMatter('matter-1', updates)).rejects.toThrow('Update failed')
      
      // Should rollback to original
      expect(store.matters[0].title).toBe(originalTitle)
      expect(store.error).toBe('Failed to update matter')
    })

    it('should handle non-existent matter update', async () => {
      const store = useMatterStore()
      
      await expect(store.updateMatter('non-existent', { title: 'Test' }))
        .rejects.toThrow('Matter not found')
    })
  })

  describe('Move Matter', () => {
    it('should move matter to new status', async () => {
      const store = useMatterStore()
      store.matters.push(mockMatter)
      
      const updatedMatter = { ...mockMatter, status: 'IN_PROGRESS' as MatterStatus }
      mockFetch.mockResolvedValueOnce(updatedMatter)

      const result = await store.moveMatter('matter-1', 'IN_PROGRESS')

      expect(result.status).toBe('IN_PROGRESS')
      expect(store.matters[0].status).toBe('IN_PROGRESS')
    })

    it('should validate status transitions', async () => {
      const store = useMatterStore()
      const closedMatter = { ...mockMatter, status: 'CLOSED' as MatterStatus }
      store.matters.push(closedMatter)

      await expect(store.moveMatter('matter-1', 'INTAKE'))
        .rejects.toThrow('Invalid status transition from CLOSED to INTAKE')
    })
  })

  describe('Delete Matter', () => {
    it('should delete matter successfully', async () => {
      const store = useMatterStore()
      store.matters.push(mockMatter, { ...mockMatter, id: 'matter-2' })
      
      mockFetch.mockResolvedValueOnce({ success: true })

      await store.deleteMatter('matter-1')

      expect(store.matters).toHaveLength(1)
      expect(store.matters.find(m => m.id === 'matter-1')).toBeUndefined()
      expect(mockFetch).toHaveBeenCalledWith('/api/matters/matter-1', {
        method: 'DELETE'
      })
    })

    it('should handle delete error', async () => {
      const store = useMatterStore()
      store.matters.push(mockMatter)
      
      const error = new Error('Delete failed')
      mockFetch.mockRejectedValueOnce(error)

      await expect(store.deleteMatter('matter-1')).rejects.toThrow('Delete failed')
      
      // Matter should still exist
      expect(store.matters).toHaveLength(1)
      expect(store.error).toBe('Failed to delete matter')
    })
  })

  describe('Batch Operations', () => {
    it('should batch update matters', async () => {
      const store = useMatterStore()
      store.matters.push(...mockMatters)
      
      const updates = [
        { id: 'matter-1', priority: 'HIGH' as const },
        { id: 'matter-2', priority: 'LOW' as const }
      ]
      
      mockFetch.mockResolvedValueOnce(
        mockMatters.map((m, i) => ({ ...m, priority: updates[i].priority }))
      )

      const results = await store.batchUpdateMatters(updates)

      expect(results).toHaveLength(2)
      expect(store.matters[0].priority).toBe('HIGH')
      expect(store.matters[1].priority).toBe('LOW')
      expect(mockFetch).toHaveBeenCalledWith('/api/matters/batch', {
        method: 'PATCH',
        body: { updates }
      })
    })

    it('should handle partial batch update failure', async () => {
      const store = useMatterStore()
      store.matters.push(...mockMatters)
      
      const updates = [
        { id: 'matter-1', priority: 'HIGH' as const },
        { id: 'non-existent', priority: 'LOW' as const }
      ]
      
      const error = new Error('Batch update failed')
      mockFetch.mockRejectedValueOnce(error)

      await expect(store.batchUpdateMatters(updates)).rejects.toThrow('Batch update failed')
    })
  })

  describe('Computed Properties', () => {
    beforeEach(() => {
      const store = useMatterStore()
      store.matters.splice(0) // Clear array
      store.matters.push(...mockMatters)
    })

    it('should group matters by status', () => {
      const store = useMatterStore()
      const grouped = store.mattersByStatus

      expect(grouped.INTAKE).toHaveLength(1)
      expect(grouped.IN_PROGRESS).toHaveLength(1)
      expect(grouped.REVIEW).toHaveLength(0)
    })

    it('should find matters by priority', () => {
      const store = useMatterStore()
      
      expect(store.getMattersByPriority('HIGH')).toHaveLength(1)
      expect(store.getMattersByPriority('MEDIUM')).toHaveLength(1)
      expect(store.getMattersByPriority('LOW')).toHaveLength(0)
    })

    it('should find overdue matters', () => {
      const store = useMatterStore()
      
      // Mock current date to be after due date
      vi.setSystemTime(new Date('2025-03-01T00:00:00Z'))
      
      const overdue = store.getOverdueMatters
      expect(overdue).toHaveLength(1)
      expect(overdue[0].id).toBe('matter-1')
      
      vi.useRealTimers()
    })

    it('should find matters by assignee', () => {
      const store = useMatterStore()
      
      const lawyerMatters = store.getMattersByAssignee('lawyer-1')
      expect(lawyerMatters).toHaveLength(1)
      expect(lawyerMatters[0].id).toBe('matter-1')
    })

    it('should find recent matters', () => {
      const store = useMatterStore()
      
      // Mock current date
      vi.setSystemTime(new Date('2025-01-16T00:00:00Z'))
      
      const recent = store.getRecentMatters(7) // Last 7 days
      expect(recent).toHaveLength(1) // Only matter-1 was updated recently
      
      vi.useRealTimers()
    })
  })

  describe('Search and Filter', () => {
    it('should find matter by ID', () => {
      const store = useMatterStore()
      store.matters.push(...mockMatters)
      
      const found = store.getMatterById('matter-1')
      expect(found).toEqual(mockMatter)
      
      const notFound = store.getMatterById('non-existent')
      expect(notFound).toBeUndefined()
    })

    it('should search matters by query', () => {
      const store = useMatterStore()
      store.matters.push(...mockMatters)
      
      const results = store.searchMatters('Test Legal')
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('matter-1')
    })

    it('should search matters by case number', () => {
      const store = useMatterStore()
      store.matters.push(...mockMatters)
      
      const results = store.searchMatters('2025-CV-0001')
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('matter-1')
    })
  })

  describe('Conflict Resolution', () => {
    it('should handle optimistic update conflicts', async () => {
      const store = useMatterStore()
      store.matters.push(mockMatter)
      
      // Simulate server returning different data
      const serverMatter = { ...mockMatter, title: 'Server Version', version: 2 }
      mockFetch.mockResolvedValueOnce(serverMatter)

      // Perform optimistic update
      const updates = { title: 'Client Version' }
      const result = await store.updateMatter('matter-1', updates, {
        conflictResolution: 'server_wins'
      })

      // Should use server version
      expect(result.title).toBe('Server Version')
      expect(store.matters[0].title).toBe('Server Version')
    })

    it('should merge conflicting updates', async () => {
      const store = useMatterStore()
      store.matters.push(mockMatter)
      
      const serverMatter = { 
        ...mockMatter, 
        title: 'Server Title',
        description: 'Server Description',
        version: 2 
      }
      mockFetch.mockResolvedValueOnce(serverMatter)

      const updates = { title: 'Client Title', priority: 'HIGH' as const }
      const result = await store.updateMatter('matter-1', updates, {
        conflictResolution: 'merge'
      })

      // Should merge both changes
      expect(result.title).toBe('Client Title') // Client wins for conflicting field
      expect(result.description).toBe('Server Description') // Server-only change
      expect(result.priority).toBe('HIGH') // Client-only change
    })
  })
})
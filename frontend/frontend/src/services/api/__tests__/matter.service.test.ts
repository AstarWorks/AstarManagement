/**
 * Unit tests for Matter API service
 */

import { describe, test, expect, beforeEach, vi, Mock } from 'vitest'
import { apiClient } from '../client'
import { 
  getMatters, 
  getMatter, 
  createMatter, 
  updateMatter, 
  deleteMatter,
  updateMatterStatus,
  MatterStatus,
  MatterPriority
} from '../matter.service'

// Mock the API client
vi.mock('../client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  },
  handleApiResponse: vi.fn((response) => response.data)
}))

describe('Matter Service', () => {
  const mockMatter = {
    id: '123',
    caseNumber: '2025-CV-0001',
    title: 'Test Matter',
    description: 'Test description',
    status: MatterStatus.INTAKE,
    priority: MatterPriority.HIGH,
    clientName: 'Test Client',
    clientContact: 'test@example.com',
    isActive: true,
    isOverdue: false,
    isCompleted: false,
    ageInDays: 5,
    createdAt: '2025-06-13T00:00:00Z',
    updatedAt: '2025-06-18T00:00:00Z',
    createdBy: 'user1',
    updatedBy: 'user2',
    tags: ['urgent', 'civil']
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getMatters', () => {
    test('should fetch matters with default parameters', async () => {
      const mockResponse = {
        data: {
          content: [mockMatter],
          totalElements: 1,
          totalPages: 1,
          number: 0,
          size: 20
        }
      }
      
      ;(apiClient.get as Mock).mockResolvedValue(mockResponse)

      const result = await getMatters()

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/matters', {
        params: {
          page: 0,
          size: 20,
          sort: 'createdAt,desc'
        }
      })
      expect(result).toEqual(mockResponse.data)
    })

    test('should fetch matters with custom parameters', async () => {
      const mockResponse = {
        data: {
          content: [mockMatter],
          totalElements: 1,
          totalPages: 1,
          number: 1,
          size: 50
        }
      }
      
      ;(apiClient.get as Mock).mockResolvedValue(mockResponse)

      const params = {
        page: 1,
        size: 50,
        sort: 'priority,asc',
        status: MatterStatus.FILED,
        assignedLawyerId: 'lawyer123'
      }

      const result = await getMatters(params)

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/matters', {
        params
      })
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('getMatter', () => {
    test('should fetch a single matter by ID', async () => {
      const mockResponse = { data: mockMatter }
      
      ;(apiClient.get as Mock).mockResolvedValue(mockResponse)

      const result = await getMatter('123')

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/matters/123')
      expect(result).toEqual(mockMatter)
    })
  })

  describe('createMatter', () => {
    test('should create a new matter', async () => {
      const createRequest = {
        caseNumber: '2025-CV-0002',
        title: 'New Matter',
        status: MatterStatus.INTAKE,
        priority: MatterPriority.MEDIUM,
        clientName: 'New Client',
        tags: ['new']
      }

      const mockResponse = { 
        data: { 
          ...mockMatter, 
          ...createRequest,
          id: '456'
        } 
      }
      
      ;(apiClient.post as Mock).mockResolvedValue(mockResponse)

      const result = await createMatter(createRequest)

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/matters', createRequest)
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('updateMatter', () => {
    test('should update an existing matter', async () => {
      const updateRequest = {
        title: 'Updated Title',
        description: 'Updated description'
      }

      const mockResponse = { 
        data: { 
          ...mockMatter, 
          ...updateRequest 
        } 
      }
      
      ;(apiClient.put as Mock).mockResolvedValue(mockResponse)

      const result = await updateMatter('123', updateRequest)

      expect(apiClient.put).toHaveBeenCalledWith('/api/v1/matters/123', updateRequest)
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('deleteMatter', () => {
    test('should delete a matter', async () => {
      ;(apiClient.delete as Mock).mockResolvedValue({ data: null })

      await deleteMatter('123')

      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/matters/123')
    })
  })

  describe('updateMatterStatus', () => {
    test('should update matter status', async () => {
      const statusRequest = {
        status: MatterStatus.FILED,
        reason: 'Documents filed with court'
      }

      const mockResponse = { 
        data: { 
          ...mockMatter, 
          status: MatterStatus.FILED 
        } 
      }
      
      ;(apiClient.patch as Mock).mockResolvedValue(mockResponse)

      const result = await updateMatterStatus('123', statusRequest)

      expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/matters/123/status', statusRequest)
      expect(result).toEqual(mockResponse.data)
    })
  })
})
/**
 * Tests for matter-data-store
 * Tests CRUD operations, filtering, sorting, and optimistic updates
 */

import { renderHook, act } from '@testing-library/react'
import { 
    useMatterDataStore,
    useMatters,
    useFilteredMatters,
    useMattersByColumn,
    useFilters,
    useSorting,
    useLoadingState,
    useMatterActions,
    getMatterDataServerSnapshot
} from '../kanban/matter-data-store'
import { DEFAULT_FILTERS, DEFAULT_SORTING } from '@/components/kanban/constants'
import type { MatterCard, FilterOptions, SortOptions } from '@/components/kanban/types'

// Mock API modules
jest.mock('@/services/api/matter.service', () => ({
    getMatters: jest.fn(),
    createMatter: jest.fn(),
    updateMatter: jest.fn(),
    deleteMatter: jest.fn(),
    updateMatterStatus: jest.fn(),
    MatterStatus: {
        DRAFT: 'DRAFT',
        IN_PROGRESS: 'IN_PROGRESS',
        COMPLETED: 'COMPLETED'
    },
    MatterPriority: {
        LOW: 'LOW',
        MEDIUM: 'MEDIUM',
        HIGH: 'HIGH',
        URGENT: 'URGENT'
    }
}))

jest.mock('@/services/error/error.handler', () => ({
    handleApiError: jest.fn((error) => ({
        type: 'API_ERROR',
        message: error.message || 'API Error',
        timestamp: new Date()
    }))
}))

// Mock matter data
const mockMatters: MatterCard[] = [
    {
        id: 'matter-1',
        caseNumber: '2025-CV-0001',
        title: 'Contract Dispute Alpha',
        description: 'Contract dispute description',
        clientName: 'Alpha Corp',
        clientContact: 'alpha@corp.com',
        opposingParty: 'Beta Corp',
        courtName: 'Superior Court',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        filingDate: '2025-01-01',
        estimatedCompletionDate: '2025-03-01',
        assignedLawyerId: 'lawyer-1',
        assignedLawyerName: 'Alice Johnson',
        assignedClerkId: 'clerk-1',
        assignedClerkName: 'Bob Smith',
        notes: 'Important case',
        tags: ['contract', 'urgent'],
        isActive: true,
        isOverdue: false,
        isCompleted: false,
        ageInDays: 30,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        createdBy: 'Alice Johnson',
        updatedBy: 'Alice Johnson'
    },
    {
        id: 'matter-2',
        caseNumber: '2025-PI-0001',
        title: 'Personal Injury Case',
        description: 'PI case description',
        clientName: 'John Doe',
        clientContact: 'john@email.com',
        opposingParty: 'Insurance Co',
        courtName: 'Municipal Court',
        status: 'DRAFT',
        priority: 'MEDIUM',
        filingDate: '2025-01-15',
        estimatedCompletionDate: '2025-06-15',
        assignedLawyerId: 'lawyer-2',
        assignedLawyerName: 'Charlie Brown',
        assignedClerkId: 'clerk-2',
        assignedClerkName: 'Diana Prince',
        notes: 'Needs medical records',
        tags: ['personal-injury'],
        isActive: true,
        isOverdue: false,
        isCompleted: false,
        ageInDays: 15,
        createdAt: '2025-01-15T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        createdBy: 'Charlie Brown',
        updatedBy: 'Charlie Brown'
    },
    {
        id: 'matter-3',
        caseNumber: '2024-CR-0001',
        title: 'Corporate Restructuring',
        description: 'Corporate matter',
        clientName: 'Gamma LLC',
        clientContact: 'gamma@llc.com',
        opposingParty: '',
        courtName: 'Business Court',
        status: 'COMPLETED',
        priority: 'LOW',
        filingDate: '2024-12-01',
        estimatedCompletionDate: '2025-01-31',
        assignedLawyerId: 'lawyer-1',
        assignedLawyerName: 'Alice Johnson',
        assignedClerkId: 'clerk-1',
        assignedClerkName: 'Bob Smith',
        notes: 'Successfully completed',
        tags: ['corporate'],
        isActive: false,
        isOverdue: false,
        isCompleted: true,
        ageInDays: 60,
        createdAt: '2024-12-01T00:00:00Z',
        updatedAt: '2025-01-31T00:00:00Z',
        createdBy: 'Alice Johnson',
        updatedBy: 'Alice Johnson'
    }
]

describe('MatterDataStore', () => {
    beforeEach(() => {
        // Reset store state before each test
        useMatterDataStore.setState({
            matters: [],
            isLoading: false,
            error: null,
            lastRefresh: new Date(),
            filters: DEFAULT_FILTERS,
            sorting: DEFAULT_SORTING
        })
        
        // Clear all mocks
        jest.clearAllMocks()
    })

    describe('Initial state', () => {
        test('has correct initial state', () => {
            const { result } = renderHook(() => useMatterDataStore())
            
            expect(result.current).toMatchObject({
                matters: [],
                isLoading: false,
                error: null,
                filters: DEFAULT_FILTERS,
                sorting: DEFAULT_SORTING
            })
        })
    })

    describe('CRUD operations', () => {
        test('fetchMatters updates state correctly', async () => {
            const mockGetMatters = require('@/services/api/matter.service').getMatters
            mockGetMatters.mockResolvedValue({
                content: mockMatters.map(m => ({ ...m, status: m.status, priority: m.priority })),
                totalElements: mockMatters.length
            })

            const { result } = renderHook(() => useMatterDataStore())
            
            await act(async () => {
                await result.current.fetchMatters()
            })

            expect(result.current.matters).toHaveLength(mockMatters.length)
            expect(result.current.isLoading).toBe(false)
            expect(result.current.error).toBeNull()
        })

        test('fetchMatters handles errors correctly', async () => {
            const mockGetMatters = require('@/services/api/matter.service').getMatters
            mockGetMatters.mockRejectedValue(new Error('API Error'))

            const { result } = renderHook(() => useMatterDataStore())
            
            await act(async () => {
                try {
                    await result.current.fetchMatters()
                } catch (error) {
                    // Expected to throw
                }
            })

            expect(result.current.isLoading).toBe(false)
            expect(result.current.error).toMatchObject({
                type: 'API_ERROR',
                message: 'API Error'
            })
        })

        test('addMatter creates new matter', async () => {
            const mockCreateMatter = require('@/services/api/matter.service').createMatter
            const newMatter = { ...mockMatters[0], id: 'new-matter' }
            mockCreateMatter.mockResolvedValue(newMatter)

            const { result } = renderHook(() => useMatterDataStore())
            
            const matterData = {
                caseNumber: newMatter.caseNumber,
                title: newMatter.title,
                clientName: newMatter.clientName,
                status: newMatter.status,
                priority: newMatter.priority
            }

            await act(async () => {
                const id = await result.current.addMatter(matterData as any)
                expect(id).toBe('new-matter')
            })

            expect(result.current.matters).toHaveLength(1)
            expect(result.current.matters[0].id).toBe('new-matter')
        })

        test('updateMatter uses optimistic updates', async () => {
            const mockUpdateMatter = require('@/services/api/matter.service').updateMatter
            mockUpdateMatter.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

            const { result } = renderHook(() => useMatterDataStore())
            
            // Set initial matter
            act(() => {
                useMatterDataStore.setState({ matters: [mockMatters[0]] })
            })

            const updates = { title: 'Updated Title' }

            act(() => {
                result.current.updateMatter('matter-1', updates)
            })

            // Should immediately update (optimistic)
            expect(result.current.matters[0].title).toBe('Updated Title')
        })

        test('updateMatter rolls back on error', async () => {
            const mockUpdateMatter = require('@/services/api/matter.service').updateMatter
            mockUpdateMatter.mockRejectedValue(new Error('Update failed'))

            const { result } = renderHook(() => useMatterDataStore())
            const originalMatter = mockMatters[0]
            
            // Set initial matter
            act(() => {
                useMatterDataStore.setState({ matters: [originalMatter] })
            })

            const updates = { title: 'Updated Title' }

            await act(async () => {
                try {
                    await result.current.updateMatter('matter-1', updates)
                } catch (error) {
                    // Expected to throw
                }
            })

            // Should rollback to original
            expect(result.current.matters[0].title).toBe(originalMatter.title)
            expect(result.current.error).toBeTruthy()
        })

        test('deleteMatter removes matter optimistically', async () => {
            const mockDeleteMatter = require('@/services/api/matter.service').deleteMatter
            mockDeleteMatter.mockResolvedValue(undefined)

            const { result } = renderHook(() => useMatterDataStore())
            
            // Set initial matters
            act(() => {
                useMatterDataStore.setState({ matters: mockMatters })
            })

            await act(async () => {
                await result.current.deleteMatter('matter-1')
            })

            expect(result.current.matters).toHaveLength(2)
            expect(result.current.matters.find(m => m.id === 'matter-1')).toBeUndefined()
        })

        test('moveMatter updates matter status', async () => {
            const mockUpdateMatterStatus = require('@/services/api/matter.service').updateMatterStatus
            const updatedMatter = { ...mockMatters[0], status: 'COMPLETED' }
            mockUpdateMatterStatus.mockResolvedValue(updatedMatter)

            const { result } = renderHook(() => useMatterDataStore())
            
            // Set initial matter
            act(() => {
                useMatterDataStore.setState({ matters: [mockMatters[0]] })
            })

            await act(async () => {
                await result.current.moveMatter('matter-1', 'COMPLETED' as any, 'completed-column')
            })

            expect(result.current.matters[0].status).toBe('COMPLETED')
        })
    })

    describe('Filtering and sorting', () => {
        beforeEach(() => {
            // Set up test data
            act(() => {
                useMatterDataStore.setState({ matters: mockMatters })
            })
        })

        test('filters by search query', () => {
            const { result } = renderHook(() => useMatterDataStore())
            
            act(() => {
                result.current.setFilters({ searchQuery: 'Alpha' })
            })

            const filtered = result.current.getFilteredMatters()
            expect(filtered).toHaveLength(1)
            expect(filtered[0].clientName).toBe('Alpha Corp')
        })

        test('filters by priority', () => {
            const { result } = renderHook(() => useMatterDataStore())
            
            act(() => {
                result.current.setFilters({ selectedPriorities: ['HIGH'] })
            })

            const filtered = result.current.getFilteredMatters()
            expect(filtered).toHaveLength(1)
            expect(filtered[0].priority).toBe('HIGH')
        })

        test('filters by assigned lawyer', () => {
            const { result } = renderHook(() => useMatterDataStore())
            
            act(() => {
                result.current.setFilters({ selectedLawyers: ['Alice Johnson'] })
            })

            const filtered = result.current.getFilteredMatters()
            expect(filtered).toHaveLength(2)
        })

        test('excludes closed matters when showClosed is false', () => {
            const { result } = renderHook(() => useMatterDataStore())
            
            act(() => {
                result.current.setFilters({ showClosed: false })
            })

            const filtered = result.current.getFilteredMatters()
            expect(filtered).toHaveLength(2) // Excludes COMPLETED matter
        })

        test('sorts by title', () => {
            const { result } = renderHook(() => useMatterDataStore())
            
            act(() => {
                result.current.setSorting({ field: 'title', direction: 'asc' })
            })

            const filtered = result.current.getFilteredMatters()
            expect(filtered[0].title).toBe('Contract Dispute Alpha')
            expect(filtered[1].title).toBe('Corporate Restructuring')
        })

        test('sorts by priority', () => {
            const { result } = renderHook(() => useMatterDataStore())
            
            act(() => {
                result.current.setSorting({ field: 'priority', direction: 'desc' })
            })

            const filtered = result.current.getFilteredMatters()
            expect(filtered[0].priority).toBe('HIGH')
            expect(filtered[1].priority).toBe('MEDIUM')
        })

        test('groups matters by column', () => {
            const { result } = renderHook(() => useMatterDataStore())
            
            const grouped = result.current.getMattersByColumn()
            
            expect(grouped['IN_PROGRESS']).toHaveLength(1)
            expect(grouped['DRAFT']).toHaveLength(1)
            expect(grouped['COMPLETED']).toHaveLength(1)
        })

        test('clearFilters resets to defaults', () => {
            const { result } = renderHook(() => useMatterDataStore())
            
            act(() => {
                result.current.setFilters({ searchQuery: 'test', selectedPriorities: ['HIGH'] })
            })

            act(() => {
                result.current.clearFilters()
            })

            expect(result.current.filters).toEqual(DEFAULT_FILTERS)
        })
    })

    describe('Bulk operations', () => {
        test('applyBulkUpdate updates multiple matters', async () => {
            const { result } = renderHook(() => useMatterDataStore())
            
            // Set initial matters
            act(() => {
                useMatterDataStore.setState({ matters: mockMatters })
            })

            const updates = { priority: 'URGENT' as any }
            const matterIds = ['matter-1', 'matter-2']

            await act(async () => {
                await result.current.applyBulkUpdate(matterIds, updates)
            })

            const updatedMatters = result.current.matters.filter(m => matterIds.includes(m.id))
            expect(updatedMatters.every(m => m.priority === 'URGENT')).toBe(true)
        })
    })

    describe('Error handling', () => {
        test('setError updates error state', () => {
            const { result } = renderHook(() => useMatterDataStore())
            const error = { type: 'TEST_ERROR', message: 'Test error', timestamp: new Date() }
            
            act(() => {
                result.current.setError(error as any)
            })

            expect(result.current.error).toEqual(error)
        })

        test('clearError resets error state', () => {
            const { result } = renderHook(() => useMatterDataStore())
            
            // Set error first
            act(() => {
                result.current.setError({ type: 'TEST_ERROR', message: 'Test error', timestamp: new Date() } as any)
            })

            act(() => {
                result.current.clearError()
            })

            expect(result.current.error).toBeNull()
        })
    })

    describe('Selector hooks', () => {
        test('useMatters returns matters array', () => {
            const { result: storeResult } = renderHook(() => useMatterDataStore())
            const { result: selectorResult } = renderHook(() => useMatters())
            
            act(() => {
                useMatterDataStore.setState({ matters: mockMatters })
            })

            expect(selectorResult.current).toEqual(mockMatters)
        })

        test('useFilteredMatters returns filtered results', () => {
            const { result: storeResult } = renderHook(() => useMatterDataStore())
            const { result: selectorResult } = renderHook(() => useFilteredMatters())
            
            act(() => {
                useMatterDataStore.setState({ matters: mockMatters })
                storeResult.current.setFilters({ searchQuery: 'Alpha' })
            })

            expect(selectorResult.current).toHaveLength(1)
        })

        test('useLoadingState returns loading state', () => {
            const { result } = renderHook(() => useLoadingState())
            
            expect(result.current).toMatchObject({
                isLoading: false,
                error: null,
                lastRefresh: expect.any(Date)
            })
        })
    })

    describe('SSR compatibility', () => {
        test('getMatterDataServerSnapshot returns correct initial state', () => {
            const snapshot = getMatterDataServerSnapshot()
            
            expect(snapshot).toMatchObject({
                matters: [],
                isLoading: false,
                error: null,
                filters: DEFAULT_FILTERS,
                sorting: DEFAULT_SORTING,
                fetchMatters: expect.any(Function),
                addMatter: expect.any(Function),
                updateMatter: expect.any(Function),
                deleteMatter: expect.any(Function),
                getFilteredMatters: expect.any(Function),
                getMattersByColumn: expect.any(Function)
            })
        })

        test('server snapshot actions are no-ops', async () => {
            const snapshot = getMatterDataServerSnapshot()
            
            // Should not throw and return expected values
            expect(await snapshot.fetchMatters()).toEqual([])
            expect(await snapshot.addMatter({} as any)).toBe('')
            expect(snapshot.getFilteredMatters()).toEqual([])
            expect(snapshot.getMattersByColumn()).toEqual({})
        })
    })
})
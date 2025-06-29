/**
 * Matter Data Store - CRUD operations, filtering, and sorting
 * 
 * Handles matter data management, API operations, filtering, and sorting
 * Separated from main kanban store for better modularity and testing
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import {
    MatterCard,
    FilterOptions,
    SortOptions
} from '@/components/kanban/types'
import {
    DEFAULT_FILTERS,
    DEFAULT_SORTING
} from '@/components/kanban/constants'
import {
    getMatters,
    createMatter,
    updateMatter,
    deleteMatter,
    updateMatterStatus,
    type MatterDto,
    type CreateMatterRequest,
    MatterStatus,
    MatterPriority
} from '@/services/api/matter.service'
import { handleApiError, type BoardError } from '@/services/error/error.handler'

// DTO to UI model conversion functions
function convertMatterDtoToCard(dto: MatterDto): MatterCard {
    return {
        id: dto.id,
        caseNumber: dto.caseNumber,
        title: dto.title,
        description: dto.description || '',
        clientName: dto.clientName,
        clientContact: dto.clientContact || '',
        opposingParty: dto.opposingParty || '',
        courtName: dto.courtName || '',
        status: dto.status,
        priority: dto.priority,
        filingDate: dto.filingDate || '',
        estimatedCompletionDate: dto.estimatedCompletionDate || '',
        assignedLawyerId: dto.assignedLawyerId || '',
        assignedLawyerName: dto.assignedLawyerName || '',
        assignedClerkId: dto.assignedClerkId || '',
        assignedClerkName: dto.assignedClerkName || '',
        notes: dto.notes || '',
        tags: dto.tags || [],
        isActive: dto.isActive,
        isOverdue: dto.isOverdue,
        isCompleted: dto.isCompleted,
        ageInDays: dto.ageInDays,
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt,
        createdBy: dto.createdBy,
        updatedBy: dto.updatedBy
    }
}

function convertMatterCardToCreateRequest(matter: Omit<MatterCard, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'isActive' | 'isOverdue' | 'isCompleted' | 'ageInDays'>): CreateMatterRequest {
    return {
        caseNumber: matter.caseNumber,
        title: matter.title,
        description: matter.description || undefined,
        status: matter.status as MatterStatus,
        priority: matter.priority as MatterPriority,
        clientName: matter.clientName,
        clientContact: matter.clientContact || undefined,
        opposingParty: matter.opposingParty || undefined,
        courtName: matter.courtName || undefined,
        filingDate: matter.filingDate || undefined,
        estimatedCompletionDate: matter.estimatedCompletionDate || undefined,
        assignedLawyerId: matter.assignedLawyerId || '',
        assignedClerkId: matter.assignedClerkId || undefined,
        notes: matter.notes || undefined,
        tags: matter.tags
    }
}

// Matter data store state interface
interface MatterDataState {
    // Matter data
    matters: MatterCard[]
    isLoading: boolean
    error: BoardError | null
    lastRefresh: Date

    // Filter and sort state
    filters: FilterOptions
    sorting: SortOptions

    // CRUD operations
    fetchMatters: () => Promise<MatterCard[]>
    addMatter: (matter: Omit<MatterCard, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'isActive' | 'isOverdue' | 'isCompleted' | 'ageInDays'>) => Promise<string>
    updateMatter: (matterId: string, updates: Partial<MatterCard>) => Promise<void>
    deleteMatter: (matterId: string) => Promise<void>
    moveMatter: (matterId: string, newStatus: MatterStatus, newColumnId: string) => Promise<void>
    updateMatterStatus: (matterId: string, statusUpdate: { status: MatterStatus; reason: string }) => Promise<void>

    // Filter and sort operations
    setFilters: (filters: Partial<FilterOptions>) => void
    clearFilters: () => void
    setSorting: (sorting: SortOptions) => void

    // Error handling
    setError: (error: BoardError | null) => void
    clearError: () => void

    // Bulk operations
    applyBulkUpdate: (matterIds: string[], updates: Partial<MatterCard>) => Promise<void>

    // Getters
    getFilteredMatters: () => MatterCard[]
    getMattersByColumn: () => Record<string, MatterCard[]>
}

// Create the matter data store
export const useMatterDataStore = create<MatterDataState>()(
    subscribeWithSelector(
        immer((set, get) => ({
            // Initial state
            matters: [],
            isLoading: false,
            error: null,
            lastRefresh: new Date(),
            filters: DEFAULT_FILTERS,
            sorting: DEFAULT_SORTING,

            // CRUD operations
            fetchMatters: async () => {
                set((state) => {
                    state.isLoading = true
                    state.error = null
                })

                try {
                    const response = await getMatters({page: 0, size: 100, sort: 'createdAt,desc'})
                    const matters = response.content.map(convertMatterDtoToCard)

                    set((state) => {
                        state.matters = matters
                        state.lastRefresh = new Date()
                        state.isLoading = false
                    })

                    return matters
                } catch (error) {
                    const boardError = handleApiError(error)
                    set((state) => {
                        state.error = boardError
                        state.isLoading = false
                    })
                    throw error
                }
            },

            addMatter: async (matterData) => {
                set((state) => {
                    state.isLoading = true
                    state.error = null
                })

                try {
                    const createRequest = convertMatterCardToCreateRequest(matterData)
                    const createdMatterDto = await createMatter(createRequest)
                    const newMatter = convertMatterDtoToCard(createdMatterDto)

                    set((state) => {
                        state.matters.push(newMatter)
                        state.lastRefresh = new Date()
                        state.isLoading = false
                    })

                    return newMatter.id
                } catch (error) {
                    const boardError = handleApiError(error)
                    set((state) => {
                        state.error = boardError
                        state.isLoading = false
                    })
                    throw error
                }
            },

            updateMatter: async (matterId, updates) => {
                const originalMatter = get().matters.find(m => m.id === matterId)
                if (!originalMatter) return

                // Optimistic update
                set((state) => {
                    const matterIndex = state.matters.findIndex(m => m.id === matterId)
                    if (matterIndex !== -1) {
                        state.matters[matterIndex] = {
                            ...state.matters[matterIndex],
                            ...updates,
                            updatedAt: new Date().toISOString()
                        }
                    }
                })

                try {
                    const updateRequest = {
                        title: updates.title || originalMatter.title,
                        description: updates.description,
                        clientName: updates.clientName || originalMatter.clientName,
                        clientContact: updates.clientContact,
                        opposingParty: updates.opposingParty,
                        courtName: updates.courtName,
                        filingDate: updates.filingDate,
                        estimatedCompletionDate: updates.estimatedCompletionDate,
                        priority: updates.priority as MatterPriority,
                        assignedLawyerId: updates.assignedLawyerId,
                        assignedClerkId: updates.assignedClerkId,
                        notes: updates.notes,
                        tags: updates.tags
                    }

                    const updatedMatterDto = await updateMatter(matterId, updateRequest)
                    const updatedMatter = convertMatterDtoToCard(updatedMatterDto)

                    set((state) => {
                        const index = state.matters.findIndex(m => m.id === matterId)
                        if (index !== -1) {
                            state.matters[index] = updatedMatter
                        }
                        state.lastRefresh = new Date()
                    })
                } catch (error) {
                    // Rollback optimistic update
                    set((state) => {
                        const matterIndex = state.matters.findIndex(m => m.id === matterId)
                        if (matterIndex !== -1) {
                            state.matters[matterIndex] = originalMatter
                        }
                        state.error = handleApiError(error)
                    })
                    throw error
                }
            },

            deleteMatter: async (matterId) => {
                const originalMatters = get().matters

                // Optimistic delete
                set((state) => {
                    state.matters = state.matters.filter(m => m.id !== matterId)
                })

                try {
                    await deleteMatter(matterId)
                    set((state) => {
                        state.lastRefresh = new Date()
                    })
                } catch (error) {
                    // Rollback optimistic delete
                    set((state) => {
                        state.matters = originalMatters
                        state.error = handleApiError(error)
                    })
                    throw error
                }
            },

            moveMatter: async (matterId, newStatus, newColumnId) => {
                const originalMatter = get().matters.find(m => m.id === matterId)
                if (!originalMatter) return

                // Optimistic move
                set((state) => {
                    const matterIndex = state.matters.findIndex(m => m.id === matterId)
                    if (matterIndex !== -1) {
                        state.matters[matterIndex] = {
                            ...state.matters[matterIndex],
                            status: newStatus,
                            updatedAt: new Date().toISOString()
                        }
                    }
                })

                try {
                    const updatedMatterDto = await updateMatterStatus(matterId, {
                        status: newStatus as MatterStatus,
                        comment: `Moved to ${newColumnId}`
                    })
                    const updatedMatter = convertMatterDtoToCard(updatedMatterDto)

                    set((state) => {
                        const index = state.matters.findIndex(m => m.id === matterId)
                        if (index !== -1) {
                            state.matters[index] = updatedMatter
                        }
                        state.lastRefresh = new Date()
                    })
                } catch (error) {
                    // Rollback optimistic move
                    set((state) => {
                        const matterIndex = state.matters.findIndex(m => m.id === matterId)
                        if (matterIndex !== -1) {
                            state.matters[matterIndex] = originalMatter
                        }
                        state.error = handleApiError(error)
                    })
                    throw error
                }
            },

            updateMatterStatus: async (matterId, statusUpdate) => {
                const originalMatter = get().matters.find(m => m.id === matterId)
                if (!originalMatter) return

                // Optimistic update
                set((state) => {
                    const matterIndex = state.matters.findIndex(m => m.id === matterId)
                    if (matterIndex !== -1) {
                        state.matters[matterIndex] = {
                            ...state.matters[matterIndex],
                            status: statusUpdate.status,
                            updatedAt: new Date().toISOString()
                        }
                    }
                })

                try {
                    const updatedMatterDto = await updateMatterStatus(matterId, statusUpdate)
                    const updatedMatter = convertMatterDtoToCard(updatedMatterDto)

                    set((state) => {
                        const index = state.matters.findIndex(m => m.id === matterId)
                        if (index !== -1) {
                            state.matters[index] = updatedMatter
                        }
                        state.lastRefresh = new Date()
                    })
                } catch (error) {
                    // Rollback optimistic update
                    set((state) => {
                        const matterIndex = state.matters.findIndex(m => m.id === matterId)
                        if (matterIndex !== -1) {
                            state.matters[matterIndex] = originalMatter
                        }
                        state.error = handleApiError(error)
                    })
                    throw error
                }
            },

            // Filter and sort operations
            setFilters: (newFilters) => set((state) => {
                state.filters = { ...state.filters, ...newFilters }
            }),

            clearFilters: () => set((state) => {
                state.filters = DEFAULT_FILTERS
            }),

            setSorting: (newSorting) => set((state) => {
                state.sorting = newSorting
            }),

            // Error handling
            setError: (error) => set((state) => {
                state.error = error
            }),

            clearError: () => set((state) => {
                state.error = null
            }),

            // Bulk operations
            applyBulkUpdate: async (matterIds, updates) => {
                const originalMatters = get().matters

                // Optimistic bulk update
                set((state) => {
                    matterIds.forEach(matterId => {
                        const matterIndex = state.matters.findIndex(m => m.id === matterId)
                        if (matterIndex !== -1) {
                            state.matters[matterIndex] = {
                                ...state.matters[matterIndex],
                                ...updates,
                                updatedAt: new Date().toISOString()
                            }
                        }
                    })
                })

                try {
                    // Execute bulk update (implementation depends on API capabilities)
                    await Promise.all(
                        matterIds.map(matterId => get().updateMatter(matterId, updates))
                    )

                    set((state) => {
                        state.lastRefresh = new Date()
                    })
                } catch (error) {
                    // Rollback bulk update
                    set((state) => {
                        state.matters = originalMatters
                        state.error = handleApiError(error)
                    })
                    throw error
                }
            },

            // Getters
            getFilteredMatters: () => {
                const { matters, filters, sorting } = get()
                let filtered = matters

                // Apply filters
                if (filters.searchQuery) {
                    const query = filters.searchQuery.toLowerCase()
                    filtered = filtered.filter(matter =>
                        matter.title.toLowerCase().includes(query) ||
                        matter.clientName.toLowerCase().includes(query) ||
                        matter.caseNumber.toLowerCase().includes(query)
                    )
                }

                if (filters.selectedPriorities.length > 0) {
                    filtered = filtered.filter(matter =>
                        filters.selectedPriorities.includes(matter.priority)
                    )
                }

                if (filters.selectedLawyers.length > 0) {
                    filtered = filtered.filter(matter =>
                        filters.selectedLawyers.includes(matter.assignedLawyerName)
                    )
                }

                if (!filters.showClosed) {
                    filtered = filtered.filter(matter => matter.status !== 'CLOSED')
                }

                // Apply sorting
                filtered.sort((a, b) => {
                    let aValue: any
                    let bValue: any

                    switch (sorting.field) {
                        case 'title':
                            aValue = a.title.toLowerCase()
                            bValue = b.title.toLowerCase()
                            break
                        case 'priority':
                            const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
                            aValue = priorityOrder[a.priority] || 0
                            bValue = priorityOrder[b.priority] || 0
                            break
                        case 'createdAt':
                            aValue = new Date(a.createdAt).getTime()
                            bValue = new Date(b.createdAt).getTime()
                            break
                        default:
                            return 0
                    }

                    if (sorting.direction === 'asc') {
                        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
                    } else {
                        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
                    }
                })

                return filtered
            },

            getMattersByColumn: () => {
                const filteredMatters = get().getFilteredMatters()
                const groups: Record<string, MatterCard[]> = {}

                // Group matters by status
                filteredMatters.forEach(matter => {
                    const status = matter.status
                    if (!groups[status]) {
                        groups[status] = []
                    }
                    groups[status].push(matter)
                })

                return groups
            }
        }))
    )
)

// Selector hooks for optimized re-renders
export const useMatters = () => useMatterDataStore((state) => state.matters)
export const useFilteredMatters = () => useMatterDataStore((state) => state.getFilteredMatters())
export const useMattersByColumn = () => useMatterDataStore((state) => state.getMattersByColumn())
export const useFilters = () => useMatterDataStore((state) => state.filters)
export const useSorting = () => useMatterDataStore((state) => state.sorting)
export const useLoadingState = () => useMatterDataStore((state) => ({
    isLoading: state.isLoading,
    error: state.error,
    lastRefresh: state.lastRefresh
}))

export const useMatterActions = () => useMatterDataStore((state) => ({
    fetchMatters: state.fetchMatters,
    addMatter: state.addMatter,
    updateMatter: state.updateMatter,
    deleteMatter: state.deleteMatter,
    moveMatter: state.moveMatter,
    updateMatterStatus: state.updateMatterStatus,
    setFilters: state.setFilters,
    clearFilters: state.clearFilters,
    setSorting: state.setSorting,
    setError: state.setError,
    clearError: state.clearError,
    applyBulkUpdate: state.applyBulkUpdate
}))

// SSR-compatible server snapshot
const getServerSnapshot = (): MatterDataState => ({
    matters: [],
    isLoading: false,
    error: null,
    lastRefresh: new Date(),
    filters: DEFAULT_FILTERS,
    sorting: DEFAULT_SORTING,
    fetchMatters: async () => [],
    addMatter: async () => '',
    updateMatter: async () => {},
    deleteMatter: async () => {},
    moveMatter: async () => {},
    updateMatterStatus: async () => {},
    setFilters: () => {},
    clearFilters: () => {},
    setSorting: () => {},
    setError: () => {},
    clearError: () => {},
    applyBulkUpdate: async () => {},
    getFilteredMatters: () => [],
    getMattersByColumn: () => ({})
})

export { getServerSnapshot as getMatterDataServerSnapshot }
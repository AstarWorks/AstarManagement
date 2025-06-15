import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// Types based on the backend requirements
export interface Matter {
  id: string
  caseNumber: string
  title: string
  clientName: string
  status: MatterStatus
  priority: Priority
  assignedLawyerId?: string
  assignedLawyerName?: string
  createdAt: string
  updatedAt: string
}

export enum MatterStatus {
  INITIAL_CONSULTATION = 'INITIAL_CONSULTATION',
  DOCUMENT_PREPARATION = 'DOCUMENT_PREPARATION',
  FILED = 'FILED',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_COURT = 'IN_COURT',
  SETTLEMENT_DISCUSSION = 'SETTLEMENT_DISCUSSION',
  CLOSED_WON = 'CLOSED_WON',
  CLOSED_LOST = 'CLOSED_LOST',
  CLOSED_SETTLED = 'CLOSED_SETTLED',
  CLOSED_WITHDRAWN = 'CLOSED_WITHDRAWN'
}

export enum Priority {
  URGENT = 'URGENT',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

interface MatterFilters {
  status?: MatterStatus[]
  priority?: Priority[]
  assignedLawyerId?: string
  searchTerm?: string
}

interface MatterState {
  // Data
  matters: Matter[]
  filteredMatters: Matter[]
  selectedMatter: Matter | null
  
  // UI state
  filters: MatterFilters
  viewMode: 'kanban' | 'list' | 'grid'
  isLoading: boolean
  error: string | null
  
  // Optimistic updates
  pendingUpdates: Set<string>
  
  // Actions
  setMatters: (matters: Matter[]) => void
  addMatter: (matter: Matter) => void
  updateMatter: (id: string, updates: Partial<Matter>) => void
  deleteMatter: (id: string) => void
  selectMatter: (matter: Matter | null) => void
  
  // Status transitions (for Kanban)
  movematter: (matterId: string, newStatus: MatterStatus) => void
  
  // Filtering and search
  setFilters: (filters: Partial<MatterFilters>) => void
  clearFilters: () => void
  applyFilters: () => void
  
  // View management
  setViewMode: (mode: 'kanban' | 'list' | 'grid') => void
  
  // Loading and error states
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Optimistic updates
  addPendingUpdate: (matterId: string) => void
  removePendingUpdate: (matterId: string) => void
}

export const useMatterStore = create<MatterState>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial state
      matters: [],
      filteredMatters: [],
      selectedMatter: null,
      filters: {},
      viewMode: 'kanban',
      isLoading: false,
      error: null,
      pendingUpdates: new Set(),

      // Data actions
      setMatters: (matters) =>
        set((state) => {
          state.matters = matters
          state.filteredMatters = matters
        }),

      addMatter: (matter) =>
        set((state) => {
          state.matters.push(matter)
          get().applyFilters()
        }),

      updateMatter: (id, updates) =>
        set((state) => {
          const index = state.matters.findIndex((m: Matter) => m.id === id)
          if (index !== -1) {
            state.matters[index] = { ...state.matters[index], ...updates }
            get().applyFilters()
          }
        }),

      deleteMatter: (id) =>
        set((state) => {
          state.matters = state.matters.filter((m: Matter) => m.id !== id)
          if (state.selectedMatter?.id === id) {
            state.selectedMatter = null
          }
          get().applyFilters()
        }),

      selectMatter: (matter) =>
        set((state) => {
          state.selectedMatter = matter
        }),

      // Kanban-specific actions
      movematter: (matterId, newStatus) =>
        set((state) => {
          const matter = state.matters.find((m: Matter) => m.id === matterId)
          if (matter) {
            matter.status = newStatus
            matter.updatedAt = new Date().toISOString()
            state.pendingUpdates.add(matterId)
            get().applyFilters()
          }
        }),

      // Filtering actions
      setFilters: (newFilters) =>
        set((state) => {
          state.filters = { ...state.filters, ...newFilters }
          get().applyFilters()
        }),

      clearFilters: () =>
        set((state) => {
          state.filters = {}
          state.filteredMatters = state.matters
        }),

      applyFilters: () =>
        set((state) => {
          let filtered = [...state.matters]
          const { status, priority, assignedLawyerId, searchTerm } = state.filters

          if (status && status.length > 0) {
            filtered = filtered.filter((m: Matter) => status.includes(m.status))
          }

          if (priority && priority.length > 0) {
            filtered = filtered.filter((m: Matter) => priority.includes(m.priority))
          }

          if (assignedLawyerId) {
            filtered = filtered.filter((m: Matter) => m.assignedLawyerId === assignedLawyerId)
          }

          if (searchTerm) {
            const term = searchTerm.toLowerCase()
            filtered = filtered.filter((m: Matter) =>
              m.title.toLowerCase().includes(term) ||
              m.clientName.toLowerCase().includes(term) ||
              m.caseNumber.toLowerCase().includes(term)
            )
          }

          state.filteredMatters = filtered
        }),

      // View management
      setViewMode: (mode) =>
        set((state) => {
          state.viewMode = mode
        }),

      // Loading and error management
      setLoading: (loading) =>
        set((state) => {
          state.isLoading = loading
        }),

      setError: (error) =>
        set((state) => {
          state.error = error
        }),

      // Optimistic updates
      addPendingUpdate: (matterId) =>
        set((state) => {
          state.pendingUpdates.add(matterId)
        }),

      removePendingUpdate: (matterId) =>
        set((state) => {
          state.pendingUpdates.delete(matterId)
        })
    }))
  )
)

// Selector hooks for optimized re-renders
export const useMatters = () => useMatterStore((state) => state.filteredMatters)
export const useSelectedMatter = () => useMatterStore((state) => state.selectedMatter)
export const useMatterFilters = () => useMatterStore((state) => state.filters)
export const useMatterViewMode = () => useMatterStore((state) => state.viewMode)
export const useMatterLoadingState = () => useMatterStore((state) => ({
  isLoading: state.isLoading,
  error: state.error
}))

// Kanban-specific selectors
export const useMattersByStatus = () => useMatterStore((state) => {
  const mattersByStatus: Record<MatterStatus, Matter[]> = {} as Record<MatterStatus, Matter[]>
  
  Object.values(MatterStatus).forEach(status => {
    mattersByStatus[status] = state.filteredMatters.filter((m: Matter) => m.status === status)
  })
  
  return mattersByStatus
})

export const usePendingMatterUpdates = () => useMatterStore((state) => state.pendingUpdates)
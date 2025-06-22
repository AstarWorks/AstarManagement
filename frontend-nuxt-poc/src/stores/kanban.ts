import { defineStore } from 'pinia'
import type { Matter, FilterState, ViewPreferences, MatterStatus } from '~/types/matter'

export const useKanbanStore = defineStore('kanban', () => {
  // State
  const matters = ref<Matter[]>([])
  const filters = ref<FilterState>({
    searchQuery: '',
    selectedLawyers: [],
    selectedPriorities: [],
    selectedStatuses: [],
    showClosed: true
  })
  const viewPreferences = ref<ViewPreferences>({
    cardSize: 'normal',
    showAvatars: true,
    showDueDates: true,
    showPriority: true,
    showTags: true,
    groupBy: 'status'
  })
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters (computed)
  const filteredMatters = computed(() => {
    return matters.value.filter(matter => {
      // Search filter
      if (filters.value.searchQuery) {
        const query = filters.value.searchQuery.toLowerCase()
        const searchableFields = [
          matter.title,
          matter.caseNumber,
          matter.clientName,
          matter.opponentName,
          matter.description
        ].filter(Boolean).join(' ').toLowerCase()
        
        if (!searchableFields.includes(query)) {
          return false
        }
      }

      // Status filter
      if (filters.value.selectedStatuses.length > 0) {
        if (!filters.value.selectedStatuses.includes(matter.status)) {
          return false
        }
      }

      // Priority filter
      if (filters.value.selectedPriorities.length > 0) {
        if (!filters.value.selectedPriorities.includes(matter.priority)) {
          return false
        }
      }

      // Lawyer filter
      if (filters.value.selectedLawyers.length > 0) {
        if (!matter.assignedLawyer || !filters.value.selectedLawyers.includes(matter.assignedLawyer)) {
          return false
        }
      }

      // Show closed filter
      if (!filters.value.showClosed) {
        if (['completed', 'archived', 'cancelled'].includes(matter.status)) {
          return false
        }
      }

      return true
    })
  })

  const mattersByStatus = computed(() => {
    const grouped: Record<MatterStatus, Matter[]> = {
      new: [],
      in_progress: [],
      review: [],
      waiting: [],
      completed: [],
      archived: [],
      cancelled: []
    }

    filteredMatters.value.forEach(matter => {
      grouped[matter.status].push(matter)
    })

    return grouped
  })

  // Actions
  const setFilters = (newFilters: Partial<FilterState>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const setViewPreferences = (newPrefs: Partial<ViewPreferences>) => {
    viewPreferences.value = { ...viewPreferences.value, ...newPrefs }
  }

  const updateMatter = async (id: string, updates: Partial<Matter>) => {
    // Optimistic update
    const index = matters.value.findIndex(m => m.id === id)
    if (index !== -1) {
      const oldMatter = matters.value[index]
      matters.value[index] = { ...oldMatter, ...updates, updatedAt: new Date().toISOString() }

      try {
        // TODO: API call to update matter
        // const response = await api.updateMatter(id, updates)
        // matters.value[index] = response.data
      } catch (err) {
        // Rollback on error
        matters.value[index] = oldMatter
        error.value = 'Failed to update matter'
        throw err
      }
    }
  }

  const moveMatter = async (matterId: string, newStatus: MatterStatus) => {
    await updateMatter(matterId, { status: newStatus })
  }

  const loadMatters = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      // TODO: Replace with actual API call
      // const response = await api.getMatters()
      // matters.value = response.data
      
      // For now, load demo data
      matters.value = generateDemoMatters()
    } catch (err) {
      error.value = 'Failed to load matters'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    matters,
    filters,
    viewPreferences,
    isLoading,
    error,
    // Getters
    filteredMatters,
    mattersByStatus,
    // Actions
    setFilters,
    setViewPreferences,
    updateMatter,
    moveMatter,
    loadMatters
  }
})

// Demo data generator
function generateDemoMatters(): Matter[] {
  const statuses: MatterStatus[] = ['new', 'in_progress', 'review', 'waiting', 'completed']
  const priorities = ['low', 'medium', 'high', 'urgent'] as const
  const lawyers = ['John Smith', 'Jane Doe', 'Robert Johnson', 'Emily Brown']
  const clients = ['ABC Corporation', 'XYZ Ltd.', 'Smith Family Trust', 'Johnson Holdings']
  
  return Array.from({ length: 20 }, (_, i) => ({
    id: `matter-${i + 1}`,
    caseNumber: `2025-CV-${String(i + 1).padStart(4, '0')}`,
    title: `Legal Matter ${i + 1}`,
    description: `Description for legal matter ${i + 1}`,
    clientName: clients[i % clients.length],
    opponentName: i % 2 === 0 ? 'Defendant Corp.' : undefined,
    assignedLawyer: lawyers[i % lawyers.length],
    status: statuses[i % statuses.length],
    priority: priorities[i % priorities.length],
    dueDate: new Date(Date.now() + (i - 10) * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    relatedDocuments: Math.floor(Math.random() * 10) + 1,
    tags: i % 3 === 0 ? ['contract', 'review'] : undefined
  }))
}
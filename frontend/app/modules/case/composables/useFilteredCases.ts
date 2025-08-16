/**
 * Filtered Cases Composable
 * Pure filtering logic that combines case data with filter states
 */

import { computed } from 'vue'
import type { CaseStatus } from '~/modules/case/types/case'
import { useCaseStore } from '~/modules/case/stores/case'
import { useCaseFilterStore } from '~/modules/case/stores/caseFilter'

export function useFilteredCases() {
  const caseStore = useCaseStore()
  const filterStore = useCaseFilterStore()
  
  // Main filtered cases computed
  const filteredCases = computed(() => {
    let result = [...caseStore.cases]
    const filters = filterStore.filters
    
    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      result = result.filter(case_ =>
        case_.title.toLowerCase().includes(searchTerm) ||
        case_.caseNumber.toLowerCase().includes(searchTerm) ||
        case_.client.name.toLowerCase().includes(searchTerm) ||
        case_.assignedLawyer.toLowerCase().includes(searchTerm) ||
        case_.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      )
    }
    
    // Apply client type filter
    if (filters.clientType !== 'all') {
      result = result.filter(case_ => case_.client.type === filters.clientType)
    }
    
    // Apply priority filter
    if (filters.priority !== 'all') {
      result = result.filter(case_ => case_.priority === filters.priority)
    }
    
    // Apply assigned lawyer filter
    if (filters.assignedLawyer !== 'all') {
      result = result.filter(case_ => case_.assignedLawyer === filters.assignedLawyer)
    }
    
    // Apply tag filter
    if (filters.tags.length > 0) {
      result = result.filter(case_ =>
        filters.tags.some(tag => case_.tags.includes(tag))
      )
    }
    
    // Apply date range filter
    if (filters.dateRange) {
      const { start, end } = filters.dateRange
      result = result.filter(case_ => {
        const dueDate = new Date(case_.dueDate)
        const startDate = start ? new Date(start) : null
        const endDate = end ? new Date(end) : null
        
        if (startDate && dueDate < startDate) return false
        if (endDate && dueDate > endDate) return false
        
        return true
      })
    }
    
    // Apply sorting
    if (filters.sortBy) {
      result.sort((a, b) => {
        let aValue: string | number = ''
        let bValue: string | number = ''
        
        switch (filters.sortBy) {
          case 'createdAt':
          case 'updatedAt':
          case 'dueDate':
            aValue = a[filters.sortBy] || ''
            bValue = b[filters.sortBy] || ''
            break
          case 'title':
          case 'caseNumber':
            aValue = a[filters.sortBy]
            bValue = b[filters.sortBy]
            break
          case 'priority': {
            const priorityOrder = { high: 3, medium: 2, low: 1 }
            aValue = priorityOrder[a.priority]
            bValue = priorityOrder[b.priority]
            break
          }
          default:
            // Keep original order if sortBy is undefined or unknown
            aValue = ''
            bValue = ''
            break
        }
        
        if (filters.sortOrder === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
        }
      })
    }
    
    return result
  })
  
  // Filter statistics
  const filterStats = computed(() => {
    const total = caseStore.cases.length
    const filtered = filteredCases.value.length
    const percentage = total > 0 ? Math.round((filtered / total) * 100) : 0
    
    return {
      total,
      filtered,
      percentage,
      isFiltered: filtered !== total
    }
  })
  
  // Get filtered cases by status (for kanban columns)
  const getCasesByStatus = (status: CaseStatus) => {
    return filteredCases.value.filter(case_ => case_.status === status)
  }
  
  // Get unique values for filter options
  const filterOptions = computed(() => {
    const allCases = caseStore.cases
    
    // Extract unique lawyers
    const lawyers = [...new Set(allCases.map(c => c.assignedLawyer))]
      .filter(Boolean)
      .sort()
    
    // Extract unique tags
    const tags = [...new Set(allCases.flatMap(c => c.tags))]
      .filter(Boolean)
      .sort()
    
    return {
      assignedLawyers: lawyers.map(name => ({ id: name, name })),
      tags,
      clientTypes: ['individual', 'corporate'] as const,
      priorities: ['high', 'medium', 'low'] as const
    }
  })
  
  // Search results with highlighting
  const searchResults = computed(() => {
    if (!filterStore.filters.search) return []
    
    const searchTerm = filterStore.filters.search.toLowerCase()
    return filteredCases.value.slice(0, 10).map(case_ => ({
      ...case_,
      highlights: {
        title: case_.title.toLowerCase().includes(searchTerm),
        caseNumber: case_.caseNumber.toLowerCase().includes(searchTerm),
        clientName: case_.client.name.toLowerCase().includes(searchTerm),
        assignedLawyer: case_.assignedLawyer.toLowerCase().includes(searchTerm),
        tags: case_.tags.filter(tag => tag.toLowerCase().includes(searchTerm))
      }
    }))
  })
  
  // Status counts for kanban columns
  const statusCounts = computed(() => {
    const counts: Record<CaseStatus, number> = {
      new: 0,
      accepted: 0,
      investigation: 0,
      negotiation: 0,
      mediation: 0,
      court: 0,
      resolved: 0
    }
    
    filteredCases.value.forEach(case_ => {
      counts[case_.status]++
    })
    
    return counts
  })
  
  return {
    // Filtered data
    filteredCases,
    filterStats,
    filterOptions,
    searchResults,
    statusCounts,
    
    // Methods
    getCasesByStatus,
    
    // Store references for direct access if needed
    caseStore,
    filterStore
  }
}
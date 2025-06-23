export interface Matter {
  id: string
  caseNumber: string
  title: string
  description?: string
  clientName: string
  opponentName?: string
  assignedLawyer?: string
  status: MatterStatus
  priority: Priority
  dueDate?: string
  createdAt: string
  updatedAt: string
  lastActivity?: string
  relatedDocuments?: number
  tags?: string[]
}

export type MatterStatus = 
  | 'new'
  | 'in_progress'
  | 'review'
  | 'waiting'
  | 'completed'
  | 'archived'
  | 'cancelled'

export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export interface FilterState {
  searchQuery: string
  selectedLawyers: string[]
  selectedPriorities: Priority[]
  selectedStatuses: MatterStatus[]
  showClosed: boolean
  searchMode: 'fuzzy' | 'exact' | 'field'
  dateRange?: {
    start: Date
    end: Date
  }
  customFields?: Record<string, any>
}

export interface SearchSuggestion {
  id: string
  value: string
  type: 'case' | 'client' | 'lawyer' | 'tag'
  count: number
  highlight?: string
  category?: string
}

export interface FilterStats {
  totalMatters: number
  filteredCount: number
  activeFiltersCount: number
  performance: {
    lastFilterTime: number
    averageFilterTime: number
  }
}

export interface ViewPreferences {
  cardSize: 'compact' | 'normal' | 'detailed'
  showAvatars: boolean
  showDueDates: boolean
  showPriority: boolean
  showTags: boolean
  groupBy: 'status' | 'priority' | 'lawyer' | 'none'
}
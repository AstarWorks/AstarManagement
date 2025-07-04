// Import the types we need from kanban.ts
import type { MatterStatus, MatterPriority } from './kanban'

export interface LawyerInfo {
  id: string
  name: string
  initials: string
  avatar?: string
}

export interface Matter {
  id: string
  caseNumber: string
  title: string
  description?: string
  clientName: string
  clientEmail?: string
  clientPhone?: string
  opponentName?: string
  assignedLawyer?: string | LawyerInfo
  assignedClerk?: string | LawyerInfo
  status: MatterStatus
  priority: MatterPriority
  dueDate?: string
  createdAt: string
  updatedAt: string
  lastActivity?: string
  relatedDocuments?: number
  tags?: readonly string[] | string[]
  statusDuration?: number
  isOverdue?: boolean
  searchHighlights?: Record<string, any>
  relevanceScore?: number
  // Additional properties for column access
  client?: { name: string; id?: string }
  assignee?: { name: string; id?: string }
  // Additional properties for detail view
  matterType?: string
  taskCount?: number
  documentCount?: number
  progressPercentage?: number
  budget?: number
  amountSpent?: number
}

// Re-export for backward compatibility
export type { MatterStatus, MatterPriority }
export type Priority = MatterPriority

export interface FilterValue {
  field: string
  operator: FilterOperator
  value: any
}

export type FilterOperator = 
  | 'equals' 
  | 'contains' 
  | 'startsWith' 
  | 'endsWith'
  | 'in'
  | 'not'
  | 'greaterThan'
  | 'lessThan'
  | 'between'

export interface FilterState {
  searchQuery: string
  selectedLawyers: string[]
  selectedPriorities: MatterPriority[]
  selectedStatuses: MatterStatus[]
  showClosed: boolean
  searchMode: 'fuzzy' | 'exact' | 'field'
  dateRange?: {
    start: Date
    end: Date
  }
  customFields?: Record<string, any>
  // Additional properties used by mobile filter drawer
  search?: string
  priority?: string[]
  status?: string[]
  assigneeIds?: string[]
  tags?: string[]
  showCompleted?: boolean
  // Advanced filtering
  filters: FilterValue[]
  quickSearch?: string
  activePreset?: string
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
}

export interface SearchSuggestion {
  id: string
  value: string
  type: 'case' | 'client' | 'lawyer' | 'tag' | 'field'
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
  sortBy?: 'priority' | 'dueDate' | 'createdAt' | 'title' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}

// Additional types for API integration
export interface MatterFilters {
  status?: MatterStatus[]
  priority?: MatterPriority[]
  assigneeId?: string
  clientId?: string
  searchQuery?: string
  dateRange?: {
    start: Date
    end: Date
  }
  tags?: string[]
}

export interface MatterListParams extends MatterFilters {
  page?: number
  limit?: number
  sortBy?: 'priority' | 'dueDate' | 'createdAt' | 'title' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}

export interface MatterListResponse {
  data: Matter[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  summary?: {
    totalActive: number
    totalCompleted: number
    overdue: number
  }
}

export interface CreateMatterInput {
  title: string
  description?: string
  clientName: string
  clientEmail?: string
  clientPhone?: string
  opponentName?: string
  assignedLawyer?: string
  assignedClerk?: string
  priority: MatterPriority
  dueDate?: Date
  tags?: string[]
  matterType?: string
  budget?: number
}

export interface UpdateMatterInput extends Partial<CreateMatterInput> {
  status?: MatterStatus
  progressPercentage?: number
  amountSpent?: number
}
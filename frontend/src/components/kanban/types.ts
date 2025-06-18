/**
 * TypeScript interfaces for Kanban board data structures
 * Defines types for board, columns, and cards with proper type safety
 */

import { z } from 'zod'

// Matter status enum matching backend
export const MatterStatus = z.enum([
  'INTAKE',
  'INITIAL_REVIEW', 
  'INVESTIGATION',
  'RESEARCH',
  'DRAFT_PLEADINGS',
  'FILED',
  'DISCOVERY',
  'MEDIATION',
  'TRIAL_PREP',
  'TRIAL',
  'SETTLEMENT',
  'CLOSED'
])

export type MatterStatus = z.infer<typeof MatterStatus>

// Priority levels with color coding - renamed to match backend
export const MatterPriority = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
export type MatterPriority = z.infer<typeof MatterPriority>

// User role for RBAC
export const UserRole = z.enum(['LAWYER', 'CLERK', 'CLIENT'])
export type UserRole = z.infer<typeof UserRole>

// Kanban column definition
export interface KanbanColumn {
  id: string
  title: string
  titleJa: string  // Japanese title for internationalization
  status: MatterStatus[]  // Multiple backend statuses can map to one column
  color: string
  order: number
  isCollapsed?: boolean
}

// Matter card data for display - matching backend DTO exactly
export interface MatterCard {
  id: string
  caseNumber: string
  title: string
  description?: string
  clientName: string
  clientContact?: string
  opposingParty?: string
  courtName?: string
  status: MatterStatus
  priority: MatterPriority
  filingDate?: string
  estimatedCompletionDate?: string
  actualCompletionDate?: string
  assignedLawyerId?: string
  assignedLawyerName?: string
  assignedClerkId?: string
  assignedClerkName?: string
  notes?: string
  tags: string[]
  isActive: boolean
  isOverdue: boolean
  isCompleted: boolean
  ageInDays: number
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
  
  // Legacy fields for backward compatibility
  assignedLawyer?: {
    id: string
    name: string
    avatar?: string
  }
  assignedClerk?: {
    id: string
    name: string
    avatar?: string
  }
  dueDate?: string
  statusDuration?: number // days in current status
  
  // Search-related fields for T02_S03
  searchHighlights?: Record<string, string[]>
  relevanceScore?: number
}

// Kanban board configuration
export interface KanbanBoard {
  id: string
  title: string
  columns: KanbanColumn[]
  matters: MatterCard[]
  lastUpdated: string
}

// Filter options for the board - T04_S02 specification
export interface FilterOptions {
  searchQuery: string
  selectedLawyers: string[]
  selectedPriorities: MatterPriority[]
  showClosed: boolean
  
  // Legacy fields for backward compatibility
  search?: string
  priorities?: MatterPriority[]
  assignedLawyer?: string
  assignedClerk?: string
  dateRange?: {
    start: string
    end: string
  }
  showOverdueOnly?: boolean
}

// Sort options
export interface SortOptions {
  field: 'priority' | 'dueDate' | 'createdAt' | 'title' | 'caseNumber'
  direction: 'asc' | 'desc'
}

// Board view preferences
export interface ViewPreferences {
  columnsVisible: string[]
  columnOrder: string[]
  cardSize: 'compact' | 'normal' | 'detailed'
  showAvatars: boolean
  showPriority: boolean
  showDueDates: boolean
  autoRefresh: boolean
  refreshInterval: number // seconds
}

// Drag and drop context
export interface DragContext {
  activeId: string | null
  overId: string | null
  isDragging: boolean
  dragOverlay?: {
    matter: MatterCard
    column: KanbanColumn
  }
}

// Board actions for state management
export interface BoardActions {
  // Matter operations
  moveMatter: (matterId: string, newStatus: MatterStatus, newColumnId: string) => Promise<void>
  updateMatter: (matterId: string, updates: Partial<MatterCard>) => Promise<void>
  updateMatterStatus: (matterId: string, statusUpdate: { status: MatterStatus; reason: string }) => Promise<void>
  refreshBoard: () => Promise<void>
  
  // Filter and sort
  setFilters: (filters: FilterOptions) => void
  setSorting: (sort: SortOptions) => void
  clearFilters: () => void
  
  // View preferences
  setViewPreferences: (preferences: Partial<ViewPreferences>) => void
  toggleColumn: (columnId: string) => void
  reorderColumns: (columnOrder: string[]) => void
  
  // Real-time updates
  startAutoRefresh: () => void
  stopAutoRefresh: () => void
}

// Component props interfaces
export interface KanbanBoardProps {
  board: KanbanBoard
  actions: BoardActions
  filters: FilterOptions
  sorting: SortOptions
  viewPreferences: ViewPreferences
  dragContext: DragContext
  currentUser: {
    id: string
    name: string
    role: UserRole
    avatar?: string
  }
  onMatterClick?: (matter: MatterCard) => void
  onMatterEdit?: (matter: MatterCard) => void
  onColumnCollapse?: (columnId: string, collapsed: boolean) => void
  renderHeaderExtras?: () => React.ReactNode
  className?: string
}

export interface KanbanColumnProps {
  column: KanbanColumn
  matters: MatterCard[]
  isOver?: boolean
  isDragging?: boolean
  onMatterDrop?: (matterId: string) => void
  onToggleCollapse?: (collapsed: boolean) => void
  viewPreferences: ViewPreferences
  currentUser: {
    id: string
    role: UserRole
  }
  className?: string
}

export interface MatterCardProps {
  matter: MatterCard
  isDragging?: boolean
  viewPreferences: ViewPreferences
  currentUser: {
    id: string
    role: UserRole
  }
  onClick?: () => void
  onEdit?: () => void
  className?: string
}

export interface KanbanEmptyStateProps {
  column: KanbanColumn
  onCreateMatter?: () => void
  className?: string
}

// Animation and transition configs
export interface AnimationConfig {
  dragDelay: number
  dragTransition: string
  dropTransition: string
  columnCollapseTransition: string
  cardHoverTransition: string
}

// Performance optimization types
export interface VirtualScrollConfig {
  enabled: boolean
  itemHeight: number
  overscan: number
  threshold: number // number of cards before virtualization kicks in
}

// Re-export error types from error handler
export type { BoardError, ErrorType, ErrorAction } from '@/services/error/error.handler'

// Analytics and metrics
export interface BoardMetrics {
  totalMatters: number
  mattersByStatus: Record<MatterStatus, number>
  mattersByPriority: Record<MatterPriority, number>
  averageTimeInStatus: Record<MatterStatus, number> // days
  overdueMatters: number
  mattersCompletedToday: number
  lastRefresh: string
}

// ===== FOUNDATIONAL INTERFACES (T01_S02 SCOPE) =====
// These interfaces are scoped for foundational layout only

// Foundational board props - simple and focused on layout only
export interface KanbanBoardFoundationProps {
  title?: string
  columns?: KanbanColumn[]
  showJapanese?: boolean
  className?: string
  children?: React.ReactNode
}

// Foundational column props - no drag/drop or complex interactions
export interface KanbanColumnFoundationProps {
  column: KanbanColumn
  showJapanese?: boolean
  className?: string
  style?: React.CSSProperties
}

// Foundational board configuration - basic layout settings only
export interface FoundationConfig {
  showJapanese: boolean
  columns: KanbanColumn[]
  mobileTabIndex: number
}

// Language preference for foundational display
export type LanguagePreference = 'ja' | 'en'
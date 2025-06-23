// Kanban-specific types for Vue 3 implementation
export interface KanbanColumn {
  id: string
  title: string
  titleJa: string
  status: MatterStatus[]
  color: string
  order: number
  isHidden?: boolean
}

export interface KanbanBoardProps {
  title?: string
  columns?: KanbanColumn[]
  showJapanese?: boolean
  className?: string
}

export interface KanbanColumnProps {
  column: KanbanColumn
  showJapanese?: boolean
  className?: string
}

// Component emit types
export interface KanbanBoardEmits {
  columnClick: [columnId: string]
  languageToggle: [language: 'ja' | 'en']
  tabChange: [index: number]
}

// Updated MatterStatus for 7 Japanese columns
export type MatterStatus = 
  | 'INTAKE'
  | 'INITIAL_REVIEW'
  | 'INVESTIGATION'
  | 'RESEARCH'
  | 'DRAFT_PLEADINGS'
  | 'FILED'
  | 'DISCOVERY'
  | 'TRIAL_PREP'
  | 'TRIAL'
  | 'MEDIATION'
  | 'SETTLEMENT'
  | 'CLOSED'

// Enhanced Matter Card interface for kanban display
export interface MatterCard {
  id: string
  caseNumber: string
  title: string
  description?: string
  clientName: string
  opponentName?: string
  status: MatterStatus
  priority: MatterPriority
  dueDate?: string
  createdAt: string
  updatedAt: string
  
  // Assignment information with full user details
  assignedLawyer?: {
    id: string
    name: string
    avatar?: string
    initials?: string
  }
  assignedClerk?: {
    id: string
    name: string
    avatar?: string
    initials?: string
  }
  
  // Display enhancements
  statusDuration?: number // days in current status
  isOverdue?: boolean
  relatedDocuments?: number
  tags?: string[]
  
  // Search/highlight support
  searchHighlights?: Record<string, string[]>
  relevanceScore?: number
}

// Priority type for strong typing
export type MatterPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

// Matter Card Props
export interface MatterCardProps {
  matter: MatterCard
  isDragging?: boolean
  viewPreferences: import('~/types/matter').ViewPreferences
  searchTerms?: string[]
  onClick?: () => void
  onEdit?: () => void
  className?: string
}

// Re-export from matter.ts for convenience
export type { Matter, Priority, FilterState, ViewPreferences } from './matter'
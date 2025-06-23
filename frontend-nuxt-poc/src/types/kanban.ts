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

// Re-export from matter.ts for convenience
export type { Matter, Priority, FilterState, ViewPreferences } from './matter'
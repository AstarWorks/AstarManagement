import type { KanbanColumn } from '~/types/kanban'

// Default 7 Japanese status columns as specified in T01_S07
export const DEFAULT_KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: 'initial-consultation',
    title: 'Initial Consultation',
    titleJa: '初回相談',
    status: ['INTAKE', 'INITIAL_REVIEW'],
    color: 'bg-blue-50 border-blue-200',
    order: 1
  },
  {
    id: 'document-preparation',
    title: 'Document Preparation', 
    titleJa: '書類作成中',
    status: ['INVESTIGATION', 'RESEARCH', 'DRAFT_PLEADINGS'],
    color: 'bg-yellow-50 border-yellow-200',
    order: 2
  },
  {
    id: 'filed',
    title: 'Filed',
    titleJa: '提出済み',
    status: ['FILED'],
    color: 'bg-green-50 border-green-200',
    order: 3
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    titleJa: '進行中',
    status: ['DISCOVERY', 'TRIAL_PREP'],
    color: 'bg-orange-50 border-orange-200',
    order: 4
  },
  {
    id: 'in-court',
    title: 'In Court',
    titleJa: '法廷',
    status: ['TRIAL'],
    color: 'bg-purple-50 border-purple-200',
    order: 5
  },
  {
    id: 'settlement',
    title: 'Settlement Discussion',
    titleJa: '和解協議中',
    status: ['MEDIATION', 'SETTLEMENT'],
    color: 'bg-indigo-50 border-indigo-200',
    order: 6
  },
  {
    id: 'closed',
    title: 'Closed',
    titleJa: '完了',
    status: ['CLOSED'],
    color: 'bg-gray-50 border-gray-200',
    order: 7
  }
]

// Column configuration for responsive breakpoints
export const COLUMN_CONFIG = {
  desktop: {
    minWidth: 280,
    gap: 16,
    showAll: true
  },
  tablet: {
    visibleColumns: 4,
    showTabs: true
  },
  mobile: {
    visibleColumns: 1,
    showTabs: true
  }
}

// Responsive breakpoint thresholds
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280
} as const
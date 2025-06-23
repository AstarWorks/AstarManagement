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

// Priority color configuration for matter cards
export const PRIORITY_COLORS = {
  URGENT: {
    border: 'border-l-red-500',
    bg: 'bg-red-50',
    badge: 'bg-red-100 text-red-800 border-red-200',
    text: 'text-red-700'
  },
  HIGH: {
    border: 'border-l-orange-500',
    bg: 'bg-orange-50', 
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
    text: 'text-orange-700'
  },
  MEDIUM: {
    border: 'border-l-blue-500',
    bg: 'bg-blue-50',
    badge: 'bg-blue-100 text-blue-800 border-blue-200', 
    text: 'text-blue-700'
  },
  LOW: {
    border: 'border-l-gray-500',
    bg: 'bg-gray-50',
    badge: 'bg-gray-100 text-gray-800 border-gray-200',
    text: 'text-gray-700'
  }
} as const

// Status color mapping for status badges
export const STATUS_COLORS = {
  INTAKE: 'bg-blue-100 text-blue-800 border-blue-200',
  INITIAL_REVIEW: 'bg-blue-100 text-blue-800 border-blue-200',
  INVESTIGATION: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  RESEARCH: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  DRAFT_PLEADINGS: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  FILED: 'bg-green-100 text-green-800 border-green-200',
  DISCOVERY: 'bg-orange-100 text-orange-800 border-orange-200',
  MEDIATION: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  TRIAL_PREP: 'bg-orange-100 text-orange-800 border-orange-200',
  TRIAL: 'bg-purple-100 text-purple-800 border-purple-200',
  SETTLEMENT: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  CLOSED: 'bg-gray-100 text-gray-800 border-gray-200'
} as const

// Default view preferences for matter cards
export const DEFAULT_VIEW_PREFERENCES = {
  cardSize: 'normal' as const,
  showAvatars: true,
  showDueDates: true,
  showPriority: true,
  showTags: true,
  showSearchHighlights: false,
  groupBy: 'status' as const
}
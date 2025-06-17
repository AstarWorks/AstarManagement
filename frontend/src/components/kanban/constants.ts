/**
 * Default column configuration for the Kanban board
 * Maps the 7 logical columns to backend matter statuses
 */

import { KanbanColumn } from './types'

// Default 7 columns as specified in requirements
export const DEFAULT_COLUMNS: KanbanColumn[] = [
  {
    id: 'initial-consultation',
    title: 'Initial Consultation',
    status: ['INTAKE', 'INITIAL_REVIEW'],
    color: 'bg-blue-50 border-blue-200',
    order: 1
  },
  {
    id: 'document-preparation',
    title: 'Document Preparation', 
    status: ['INVESTIGATION', 'RESEARCH', 'DRAFT_PLEADINGS'],
    color: 'bg-yellow-50 border-yellow-200',
    order: 2
  },
  {
    id: 'client-review',
    title: 'Client Review',
    status: ['FILED'], // Temporary mapping - this might need backend status adjustment
    color: 'bg-purple-50 border-purple-200',
    order: 3
  },
  {
    id: 'filed-submitted',
    title: 'Filed/Submitted',
    status: ['FILED'],
    color: 'bg-green-50 border-green-200',
    order: 4
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    status: ['DISCOVERY', 'TRIAL_PREP'],
    color: 'bg-orange-50 border-orange-200',
    order: 5
  },
  {
    id: 'waiting-response',
    title: 'Waiting for Response',
    status: ['MEDIATION', 'TRIAL'],
    color: 'bg-indigo-50 border-indigo-200',
    order: 6
  },
  {
    id: 'closed',
    title: 'Closed',
    status: ['SETTLEMENT', 'CLOSED'],
    color: 'bg-gray-50 border-gray-200',
    order: 7
  }
]

// Priority color mapping for matter cards
export const PRIORITY_COLORS = {
  URGENT: {
    bg: 'bg-red-50',
    border: 'border-red-500', 
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-800'
  },
  HIGH: {
    bg: 'bg-orange-50',
    border: 'border-orange-500',
    text: 'text-orange-700', 
    badge: 'bg-orange-100 text-orange-800'
  },
  MEDIUM: {
    bg: 'bg-blue-50',
    border: 'border-blue-500',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-800'
  },
  LOW: {
    bg: 'bg-gray-50',
    border: 'border-gray-500',
    text: 'text-gray-700',
    badge: 'bg-gray-100 text-gray-800'
  }
} as const

// Status color mapping for additional visual feedback
export const STATUS_COLORS = {
  INTAKE: 'bg-blue-100 text-blue-800',
  INITIAL_REVIEW: 'bg-blue-100 text-blue-800',
  INVESTIGATION: 'bg-yellow-100 text-yellow-800',
  RESEARCH: 'bg-yellow-100 text-yellow-800', 
  DRAFT_PLEADINGS: 'bg-yellow-100 text-yellow-800',
  FILED: 'bg-green-100 text-green-800',
  DISCOVERY: 'bg-orange-100 text-orange-800',
  MEDIATION: 'bg-indigo-100 text-indigo-800',
  TRIAL_PREP: 'bg-orange-100 text-orange-800',
  TRIAL: 'bg-indigo-100 text-indigo-800',
  SETTLEMENT: 'bg-gray-100 text-gray-800',
  CLOSED: 'bg-gray-100 text-gray-800'
} as const

// Animation configuration
export const ANIMATION_CONFIG = {
  dragDelay: 150,
  dragTransition: 'transform 150ms ease',
  dropTransition: 'all 200ms ease-out',
  columnCollapseTransition: 'width 300ms ease-in-out',
  cardHoverTransition: 'all 150ms ease'
}

// Virtual scrolling configuration
export const VIRTUAL_SCROLL_CONFIG = {
  enabled: true,
  itemHeight: 120, // pixels per card
  overscan: 5, // extra items to render
  threshold: 50 // start virtualizing after 50 cards
}

// Default view preferences
export const DEFAULT_VIEW_PREFERENCES = {
  columnsVisible: DEFAULT_COLUMNS.map(col => col.id),
  columnOrder: DEFAULT_COLUMNS.map(col => col.id),
  cardSize: 'normal' as const,
  showAvatars: true,
  showPriority: true,
  showDueDates: true,
  autoRefresh: false,
  refreshInterval: 30 // 30 seconds
}

// Board dimensions and constraints
export const BOARD_CONFIG = {
  minColumnWidth: 280, // pixels
  maxColumnWidth: 400, // pixels
  columnGap: 16, // pixels
  cardHeight: {
    compact: 80,
    normal: 120,
    detailed: 160
  },
  maxCardsPerColumn: 1000, // before pagination/virtualization
  horizontalScrollThreshold: 1200 // viewport width before horizontal scroll
}

// Responsive breakpoints
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200,
  wide: 1440
}

// Default filters
export const DEFAULT_FILTERS = {
  search: '',
  priorities: [],
  assignedLawyer: '',
  assignedClerk: '',
  showOverdueOnly: false
}

// Default sorting
export const DEFAULT_SORTING = {
  field: 'priority' as const,
  direction: 'desc' as const
}

// Drag and drop configuration
export const DND_CONFIG = {
  type: 'matter-card',
  collisionDetection: 'closestCenter' as const,
  dropAnimationConfig: {
    duration: 200,
    easing: 'ease-out'
  }
}

// Error messages
export const ERROR_MESSAGES = {
  MOVE_FAILED: 'Failed to move matter. Please try again.',
  LOAD_FAILED: 'Failed to load board data. Please refresh.',
  UPDATE_FAILED: 'Failed to update matter. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You do not have permission to perform this action.',
  VALIDATION_ERROR: 'Invalid data provided. Please check your input.'
}

// Success messages
export const SUCCESS_MESSAGES = {
  MATTER_MOVED: 'Matter moved successfully',
  MATTER_UPDATED: 'Matter updated successfully', 
  BOARD_REFRESHED: 'Board refreshed',
  FILTERS_APPLIED: 'Filters applied',
  VIEW_SAVED: 'View preferences saved'
}

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  REFRESH: 'r',
  TOGGLE_FILTERS: 'f',
  CLEAR_FILTERS: 'c',
  FOCUS_SEARCH: '/',
  ESCAPE: 'Escape',
  ENTER: 'Enter',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown'
}

// Accessibility labels
export const A11Y_LABELS = {
  BOARD: 'Kanban board for matter management',
  COLUMN: 'Column containing matters in {status} status',
  MATTER_CARD: 'Matter card for {caseNumber}: {title}',
  DRAG_HANDLE: 'Drag to move matter to different column',
  PRIORITY_BADGE: '{priority} priority matter',
  AVATAR: 'Avatar for {name}',
  DUE_DATE: 'Due date: {date}',
  OVERDUE: 'Overdue matter',
  EMPTY_COLUMN: 'No matters in this column',
  LOADING: 'Loading matters...',
  ERROR: 'Error loading board data'
}

// Column header icons (using Lucide React icons)
export const COLUMN_ICONS = {
  'initial-consultation': 'MessageCircle',
  'document-preparation': 'FileText',
  'client-review': 'Eye',
  'filed-submitted': 'Send',
  'in-progress': 'Clock',
  'waiting-response': 'Timer',
  'closed': 'CheckCircle'
} as const

// Matter priority icons
export const PRIORITY_ICONS = {
  URGENT: 'AlertTriangle',
  HIGH: 'AlertCircle', 
  MEDIUM: 'Info',
  LOW: 'Minus'
} as const

// Performance monitoring thresholds
export const PERFORMANCE_THRESHOLDS = {
  DRAG_START_MAX_MS: 50,
  DROP_COMPLETE_MAX_MS: 200,
  SEARCH_DEBOUNCE_MS: 300,
  FILTER_DEBOUNCE_MS: 500,
  AUTO_REFRESH_MIN_INTERVAL: 10, // seconds
  AUTO_REFRESH_MAX_INTERVAL: 300 // seconds (5 minutes)
}
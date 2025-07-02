export interface FilterOption {
  label: string
  value: string | number
  count?: number
}

export interface FilterConfig {
  field: string
  type: 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'tags'
  label: string
  options?: FilterOption[]
  placeholder?: string
  defaultValue?: any
  width?: string
  searchable?: boolean
  clearable?: boolean
}

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
  | 'between'
  | 'greater'
  | 'less'
  | 'notEmpty'
  | 'isEmpty'

export interface FilterState {
  filters: FilterValue[]
  quickSearch?: string
  activePreset?: string
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
}

export interface FilterPreset {
  id: string
  name: string
  description?: string
  filters: FilterValue[]
  isDefault?: boolean
  isPublic?: boolean
  isSystem?: boolean
  lastUsed?: string
  createdBy?: string
  createdAt?: string
}

// Built-in filter presets for matter management
export const MATTER_FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'active-matters',
    name: 'Active Matters',
    description: 'All matters currently in progress',
    filters: [
      { field: 'status', operator: 'in', value: ['IN_PROGRESS', 'REVIEW', 'WAITING_CLIENT'] }
    ],
    isDefault: true,
    isPublic: true
  },
  {
    id: 'high-priority',
    name: 'High Priority',
    description: 'Urgent and high priority matters',
    filters: [
      { field: 'priority', operator: 'in', value: ['HIGH', 'URGENT'] }
    ],
    isPublic: true
  },
  {
    id: 'overdue',
    name: 'Overdue Matters',
    description: 'Matters past their due date',
    filters: [
      { field: 'dueDate', operator: 'less', value: new Date() },
      { field: 'status', operator: 'in', value: ['IN_PROGRESS', 'REVIEW'] }
    ],
    isPublic: true
  },
  {
    id: 'recent',
    name: 'Recently Created',
    description: 'Matters created in the last 7 days',
    filters: [
      { 
        field: 'createdAt', 
        operator: 'greater', 
        value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
      }
    ],
    isPublic: true
  }
]

// Matter-specific filter configurations
export const MATTER_FILTER_CONFIGS: FilterConfig[] = [
  {
    field: 'title',
    type: 'text',
    label: 'Matter Title',
    placeholder: 'Search by title...',
    searchable: true,
    clearable: true
  },
  {
    field: 'caseNumber',
    type: 'text',
    label: 'Case Number',
    placeholder: 'Search by case number...',
    clearable: true
  },
  {
    field: 'clientName',
    type: 'text',
    label: 'Client Name',
    placeholder: 'Search by client...',
    searchable: true,
    clearable: true
  },
  {
    field: 'status',
    type: 'multiselect',
    label: 'Status',
    options: [
      { label: 'Intake', value: 'INTAKE' },
      { label: 'Initial Review', value: 'INITIAL_REVIEW' },
      { label: 'In Progress', value: 'IN_PROGRESS' },
      { label: 'Review', value: 'REVIEW' },
      { label: 'Waiting Client', value: 'WAITING_CLIENT' },
      { label: 'Ready Filing', value: 'READY_FILING' },
      { label: 'Closed', value: 'CLOSED' }
    ],
    clearable: true
  },
  {
    field: 'priority',
    type: 'multiselect',
    label: 'Priority',
    options: [
      { label: 'Low', value: 'LOW' },
      { label: 'Medium', value: 'MEDIUM' },
      { label: 'High', value: 'HIGH' },
      { label: 'Urgent', value: 'URGENT' }
    ],
    clearable: true
  },
  {
    field: 'assignedLawyer',
    type: 'select',
    label: 'Assigned Lawyer',
    placeholder: 'Select lawyer...',
    searchable: true,
    clearable: true,
    // Options will be populated dynamically from API
    options: []
  },
  {
    field: 'opponentName',
    type: 'text',
    label: 'Opponent Name',
    placeholder: 'Search by opponent...',
    searchable: true,
    clearable: true
  },
  {
    field: 'assignedClerk',
    type: 'select',
    label: 'Assigned Clerk',
    placeholder: 'Select clerk...',
    searchable: true,
    clearable: true,
    // Options will be populated dynamically from API
    options: []
  },
  {
    field: 'dueDate',
    type: 'daterange',
    label: 'Due Date Range',
    placeholder: 'Select date range...',
    clearable: true
  },
  {
    field: 'createdAt',
    type: 'daterange',
    label: 'Created Date Range',
    placeholder: 'Select creation date range...',
    clearable: true
  },
  {
    field: 'tags',
    type: 'tags',
    label: 'Tags',
    placeholder: 'Add tags...',
    searchable: true,
    clearable: true
  }
]

// Filter utility functions
export const filterOperatorLabels: Record<FilterOperator, string> = {
  equals: 'equals',
  contains: 'contains',
  startsWith: 'starts with',
  endsWith: 'ends with',
  in: 'is one of',
  between: 'is between',
  greater: 'is after',
  less: 'is before',
  notEmpty: 'is not empty',
  isEmpty: 'is empty'
}

export function getDefaultOperatorForType(type: FilterConfig['type']): FilterOperator {
  switch (type) {
    case 'text':
      return 'contains'
    case 'select':
    case 'multiselect':
      return 'in'
    case 'date':
    case 'daterange':
      return 'between'
    case 'tags':
      return 'in'
    default:
      return 'equals'
  }
}

export function isFilterValueValid(config: FilterConfig, value: any): boolean {
  if (value === null || value === undefined || value === '') return false
  
  switch (config.type) {
    case 'text':
      return typeof value === 'string' && value.trim().length > 0
    case 'select':
      return config.options?.some(opt => opt.value === value) ?? false
    case 'multiselect':
      return Array.isArray(value) && value.length > 0
    case 'date':
      return value instanceof Date && !isNaN(value.getTime())
    case 'daterange':
      return Array.isArray(value) && value.length === 2 && 
             value.every(d => d instanceof Date && !isNaN(d.getTime()))
    case 'tags':
      return Array.isArray(value) && value.length > 0
    default:
      return false
  }
}
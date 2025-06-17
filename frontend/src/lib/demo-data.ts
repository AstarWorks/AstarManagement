/**
 * Demo data for Kanban board showcase
 * Contains sample matters, users, and board configuration
 */

import { MatterCard, KanbanBoard, UserRole, MatterStatus, Priority } from '@/components/kanban/types'

// Sample users for assignment
export const demoUsers = {
  lawyers: [
    {
      id: 'lawyer-1',
      name: 'Sarah Chen',
      avatar: undefined,
      role: 'LAWYER' as UserRole
    },
    {
      id: 'lawyer-2', 
      name: 'Michael Rodriguez',
      avatar: undefined,
      role: 'LAWYER' as UserRole
    },
    {
      id: 'lawyer-3',
      name: 'Emily Thompson',
      avatar: undefined,
      role: 'LAWYER' as UserRole
    }
  ],
  clerks: [
    {
      id: 'clerk-1',
      name: 'David Kim',
      avatar: undefined,
      role: 'CLERK' as UserRole
    },
    {
      id: 'clerk-2',
      name: 'Lisa Wang',
      avatar: undefined,
      role: 'CLERK' as UserRole
    }
  ]
}

// Sample matter data
export const demoMatters: MatterCard[] = [
  // Initial Consultation
  {
    id: 'matter-1',
    caseNumber: '2025-CV-0001',
    title: 'Employment Contract Dispute',
    clientName: 'ABC Corporation',
    status: 'INTAKE' as MatterStatus,
    priority: 'HIGH' as Priority,
    assignedLawyer: demoUsers.lawyers[0],
    assignedClerk: demoUsers.clerks[0],
    dueDate: '2025-01-25T17:00:00Z',
    createdAt: '2025-01-15T09:00:00Z',
    updatedAt: '2025-01-17T14:30:00Z',
    isOverdue: false,
    statusDuration: 2
  },
  {
    id: 'matter-2',
    caseNumber: '2025-FAM-0002',
    title: 'Child Custody Modification',
    clientName: 'Jennifer Smith',
    status: 'INITIAL_REVIEW' as MatterStatus,
    priority: 'URGENT' as Priority,
    assignedLawyer: demoUsers.lawyers[1],
    assignedClerk: demoUsers.clerks[1],
    dueDate: '2025-01-20T16:00:00Z',
    createdAt: '2025-01-10T11:00:00Z',
    updatedAt: '2025-01-17T10:15:00Z',
    isOverdue: true,
    statusDuration: 7
  },

  // Document Preparation
  {
    id: 'matter-3',
    caseNumber: '2025-PI-0003',
    title: 'Personal Injury Claim',
    clientName: 'Robert Johnson',
    status: 'INVESTIGATION' as MatterStatus,
    priority: 'MEDIUM' as Priority,
    assignedLawyer: demoUsers.lawyers[2],
    assignedClerk: demoUsers.clerks[0],
    dueDate: '2025-02-01T17:00:00Z',
    createdAt: '2025-01-08T14:00:00Z',
    updatedAt: '2025-01-16T16:45:00Z',
    isOverdue: false,
    statusDuration: 9
  },
  {
    id: 'matter-4',
    caseNumber: '2025-RE-0004',
    title: 'Real Estate Purchase Agreement',
    clientName: 'Green Valley Properties',
    status: 'RESEARCH' as MatterStatus,
    priority: 'LOW' as Priority,
    assignedLawyer: demoUsers.lawyers[0],
    assignedClerk: demoUsers.clerks[1],
    dueDate: '2025-01-30T12:00:00Z',
    createdAt: '2025-01-12T13:30:00Z',
    updatedAt: '2025-01-17T09:20:00Z',
    isOverdue: false,
    statusDuration: 5
  },
  {
    id: 'matter-5',
    caseNumber: '2025-CR-0005',
    title: 'Criminal Defense - DUI',
    clientName: 'Mark Davis',
    status: 'DRAFT_PLEADINGS' as MatterStatus,
    priority: 'HIGH' as Priority,
    assignedLawyer: demoUsers.lawyers[1],
    dueDate: '2025-01-22T15:00:00Z',
    createdAt: '2025-01-05T08:00:00Z',
    updatedAt: '2025-01-17T11:00:00Z',
    isOverdue: false,
    statusDuration: 12
  },

  // Filed/Submitted
  {
    id: 'matter-6',
    caseNumber: '2025-BK-0006',
    title: 'Chapter 7 Bankruptcy Filing',
    clientName: 'Maria Gonzalez',
    status: 'FILED' as MatterStatus,
    priority: 'MEDIUM' as Priority,
    assignedLawyer: demoUsers.lawyers[2],
    assignedClerk: demoUsers.clerks[0],
    dueDate: '2025-02-15T17:00:00Z',
    createdAt: '2025-01-03T10:00:00Z',
    updatedAt: '2025-01-15T14:30:00Z',
    isOverdue: false,
    statusDuration: 14
  },

  // In Progress
  {
    id: 'matter-7',
    caseNumber: '2024-CV-0157',
    title: 'Business Partnership Dissolution',
    clientName: 'Tech Innovations LLC',
    status: 'DISCOVERY' as MatterStatus,
    priority: 'HIGH' as Priority,
    assignedLawyer: demoUsers.lawyers[0],
    assignedClerk: demoUsers.clerks[1],
    dueDate: '2025-03-01T17:00:00Z',
    createdAt: '2024-11-15T09:00:00Z',
    updatedAt: '2025-01-16T15:20:00Z',
    isOverdue: false,
    statusDuration: 63
  },
  {
    id: 'matter-8',
    caseNumber: '2024-PI-0198',
    title: 'Motor Vehicle Accident Claim',
    clientName: 'Patricia Wilson',
    status: 'TRIAL_PREP' as MatterStatus,
    priority: 'URGENT' as Priority,
    assignedLawyer: demoUsers.lawyers[1],
    assignedClerk: demoUsers.clerks[0],
    dueDate: '2025-01-28T09:00:00Z',
    createdAt: '2024-08-20T14:00:00Z',
    updatedAt: '2025-01-17T13:45:00Z',
    isOverdue: false,
    statusDuration: 150
  },

  // Waiting for Response
  {
    id: 'matter-9',
    caseNumber: '2024-FAM-0289',
    title: 'Divorce Settlement Mediation',
    clientName: 'Thomas Anderson',
    status: 'MEDIATION' as MatterStatus,
    priority: 'MEDIUM' as Priority,
    assignedLawyer: demoUsers.lawyers[2],
    assignedClerk: demoUsers.clerks[1],
    dueDate: '2025-02-10T10:00:00Z',
    createdAt: '2024-10-12T11:00:00Z',
    updatedAt: '2025-01-14T16:30:00Z',
    isOverdue: false,
    statusDuration: 97
  },
  {
    id: 'matter-10',
    caseNumber: '2024-CR-0345',
    title: 'Felony Drug Possession Trial',
    clientName: 'James Brown',
    status: 'TRIAL' as MatterStatus,
    priority: 'URGENT' as Priority,
    assignedLawyer: demoUsers.lawyers[0],
    dueDate: '2025-01-24T09:00:00Z',
    createdAt: '2024-09-15T08:30:00Z',
    updatedAt: '2025-01-17T12:15:00Z',
    isOverdue: false,
    statusDuration: 124
  },

  // Closed
  {
    id: 'matter-11',
    caseNumber: '2024-CV-0412',
    title: 'Contract Breach Settlement',
    clientName: 'Downtown Retailers Inc',
    status: 'SETTLEMENT' as MatterStatus,
    priority: 'LOW' as Priority,
    assignedLawyer: demoUsers.lawyers[1],
    assignedClerk: demoUsers.clerks[0],
    createdAt: '2024-06-10T09:00:00Z',
    updatedAt: '2025-01-10T17:00:00Z',
    statusDuration: 213
  },
  {
    id: 'matter-12',
    caseNumber: '2024-RE-0501',
    title: 'Commercial Lease Review',
    clientName: 'Sunset Medical Center',
    status: 'CLOSED' as MatterStatus,
    priority: 'LOW' as Priority,
    assignedLawyer: demoUsers.lawyers[2],
    assignedClerk: demoUsers.clerks[1],
    createdAt: '2024-07-22T14:00:00Z',
    updatedAt: '2025-01-08T16:30:00Z',
    statusDuration: 170
  }
]

// Demo board configuration
export const demoBoard: KanbanBoard = {
  id: 'demo-board-1',
  title: 'Aster Management - Demo Board',
  columns: [], // Will be populated with DEFAULT_COLUMNS
  matters: demoMatters,
  lastUpdated: new Date().toISOString()
}

// Current demo user
export const demoCurrentUser = {
  id: 'demo-user-1',
  name: 'Demo User',
  role: 'LAWYER' as UserRole,
  avatar: undefined
}

// Demo filters and preferences
export const demoFilters = {
  search: '',
  priorities: [] as Priority[],
  assignedLawyer: '',
  assignedClerk: '',
  showOverdueOnly: false
}

export const demoSorting = {
  field: 'priority' as const,
  direction: 'desc' as const
}

export const demoViewPreferences = {
  columnsVisible: [
    'initial-consultation',
    'document-preparation', 
    'client-review',
    'filed-submitted',
    'in-progress',
    'waiting-response',
    'closed'
  ],
  columnOrder: [
    'initial-consultation',
    'document-preparation',
    'client-review', 
    'filed-submitted',
    'in-progress',
    'waiting-response',
    'closed'
  ],
  cardSize: 'normal' as const,
  showAvatars: true,
  showPriority: true,
  showDueDates: true,
  autoRefresh: false,
  refreshInterval: 30
}

export const demoDragContext = {
  activeId: null,
  overId: null,
  isDragging: false,
  dragOverlay: undefined
}
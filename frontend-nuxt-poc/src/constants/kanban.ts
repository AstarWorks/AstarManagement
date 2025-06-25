import type { MatterStatus, KanbanColumn } from '~/types/kanban'

export const MATTER_STATUSES: MatterStatus[] = [
  'INTAKE',
  'INITIAL_REVIEW', 
  'IN_PROGRESS',
  'REVIEW',
  'WAITING_CLIENT',
  'READY_FILING',
  'CLOSED'
]

export const DEFAULT_KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: 'intake',
    title: 'Intake',
    titleJa: '受付',
    status: 'INTAKE',
    color: '#ef4444',
    order: 0,
    visible: true,
    acceptsDrop: true,
    maxItems: undefined,
    currentItemCount: 0
  },
  {
    id: 'initial-review',
    title: 'Initial Review',
    titleJa: '初回確認',
    status: 'INITIAL_REVIEW',
    color: '#f97316',
    order: 1,
    visible: true,
    acceptsDrop: true,
    maxItems: undefined,
    currentItemCount: 0
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    titleJa: '進行中',
    status: 'IN_PROGRESS',
    color: '#3b82f6',
    order: 2,
    visible: true,
    acceptsDrop: true,
    maxItems: undefined,
    currentItemCount: 0
  },
  {
    id: 'review',
    title: 'Review',
    titleJa: 'レビュー',
    status: 'REVIEW',
    color: '#8b5cf6',
    order: 3,
    visible: true,
    acceptsDrop: true,
    maxItems: undefined,
    currentItemCount: 0
  },
  {
    id: 'waiting-client',
    title: 'Waiting for Client',
    titleJa: 'クライアント待ち',
    status: 'WAITING_CLIENT',
    color: '#f59e0b',
    order: 4,
    visible: true,
    acceptsDrop: true,
    maxItems: undefined,
    currentItemCount: 0
  },
  {
    id: 'ready-filing',
    title: 'Ready for Filing',
    titleJa: '申請準備完了',
    status: 'READY_FILING',
    color: '#10b981',
    order: 5,
    visible: true,
    acceptsDrop: true,
    maxItems: undefined,
    currentItemCount: 0
  },
  {
    id: 'closed',
    title: 'Closed',
    titleJa: '完了',
    status: 'CLOSED',
    color: '#6b7280',
    order: 6,
    visible: true,
    acceptsDrop: true,
    maxItems: undefined,
    currentItemCount: 0
  }
]

export const MATTER_STATUS_TRANSITIONS: Record<MatterStatus, MatterStatus[]> = {
  INTAKE: ['INITIAL_REVIEW', 'CLOSED'],
  INITIAL_REVIEW: ['IN_PROGRESS', 'WAITING_CLIENT', 'CLOSED'],
  IN_PROGRESS: ['REVIEW', 'WAITING_CLIENT', 'READY_FILING', 'CLOSED'],
  REVIEW: ['IN_PROGRESS', 'READY_FILING', 'WAITING_CLIENT', 'CLOSED'],
  WAITING_CLIENT: ['IN_PROGRESS', 'REVIEW', 'CLOSED'],
  READY_FILING: ['CLOSED'],
  CLOSED: [] // Cannot transition from closed
}

export const PRIORITY_ORDER = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1
} as const

// Breakpoints for responsive design
export const BREAKPOINTS = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
  wide: 1280
} as const

// Default view preferences for the kanban board
export const DEFAULT_VIEW_PREFERENCES = {
  cardSize: 'normal' as const,
  showAvatars: true,
  showDueDates: true,
  showPriority: true,
  showTags: true,
  groupBy: 'status' as const
}
/**
 * Kanban Status Configuration
 * Centralized configuration for case status columns
 */

import type { CaseStatus } from '~/types/case'

export interface StatusColumn {
  key: CaseStatus
  title: string
  description: string
  color: string
  headerColor: string
  order: number
}

/**
 * Get localized status columns configuration
 * Uses i18n for title and description
 */
export function useKanbanStatusConfig() {
  const { t } = useI18n()
  
  const statusColumns = computed<StatusColumn[]>(() => [
    {
      key: 'new',
      title: t('matter.kanban.columns.new.title'),
      description: t('matter.kanban.columns.new.description'),
      color: 'bg-primary/5 border-primary/20',
      headerColor: 'bg-primary/10',
      order: 1
    },
    {
      key: 'accepted',
      title: t('matter.kanban.columns.accepted.title'),
      description: t('matter.kanban.columns.accepted.description'),
      color: 'bg-emerald-50 border-emerald-200',
      headerColor: 'bg-emerald-100',
      order: 2
    },
    {
      key: 'investigation',
      title: t('matter.kanban.columns.investigation.title'),
      description: t('matter.kanban.columns.investigation.description'),
      color: 'bg-amber-50 border-amber-200',
      headerColor: 'bg-amber-100',
      order: 3
    },
    {
      key: 'preparation',
      title: t('matter.kanban.columns.preparation.title'),
      description: t('matter.kanban.columns.preparation.description'),
      color: 'bg-violet-50 border-violet-200',
      headerColor: 'bg-violet-100',
      order: 4
    },
    {
      key: 'negotiation',
      title: t('matter.kanban.columns.negotiation.title'),
      description: t('matter.kanban.columns.negotiation.description'),
      color: 'bg-orange-50 border-orange-200',
      headerColor: 'bg-orange-100',
      order: 5
    },
    {
      key: 'trial',
      title: t('matter.kanban.columns.trial.title'),
      description: t('matter.kanban.columns.trial.description'),
      color: 'bg-rose-50 border-rose-200',
      headerColor: 'bg-rose-100',
      order: 6
    },
    {
      key: 'completed',
      title: t('matter.kanban.columns.completed.title'),
      description: t('matter.kanban.columns.completed.description'),
      color: 'bg-muted border-muted-foreground/20',
      headerColor: 'bg-muted/50',
      order: 7
    }
  ])

  const getStatusColumn = (status: CaseStatus) => {
    return statusColumns.value.find(col => col.key === status)
  }

  const getStatusOrder = (status: CaseStatus) => {
    const column = getStatusColumn(status)
    return column?.order ?? 0
  }

  const getNextStatus = (currentStatus: CaseStatus): CaseStatus | null => {
    const currentOrder = getStatusOrder(currentStatus)
    const nextColumn = statusColumns.value.find(col => col.order === currentOrder + 1)
    return nextColumn?.key ?? null
  }

  const getPreviousStatus = (currentStatus: CaseStatus): CaseStatus | null => {
    const currentOrder = getStatusOrder(currentStatus)
    const prevColumn = statusColumns.value.find(col => col.order === currentOrder - 1)
    return prevColumn?.key ?? null
  }

  return {
    statusColumns,
    getStatusColumn,
    getStatusOrder,
    getNextStatus,
    getPreviousStatus
  }
}

/**
 * Status transition rules
 * Defines which status transitions are allowed
 */
export const STATUS_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  new: ['accepted', 'completed'], // Can accept or close new cases
  accepted: ['investigation', 'completed'],
  investigation: ['preparation', 'accepted', 'completed'],
  preparation: ['negotiation', 'trial', 'investigation', 'completed'],
  negotiation: ['trial', 'completed', 'preparation'],
  trial: ['completed', 'negotiation'],
  completed: [] // Completed cases cannot be moved
}

/**
 * Check if a status transition is valid
 */
export function isValidTransition(from: CaseStatus, to: CaseStatus): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false
}

/**
 * Get valid transitions for a given status
 */
export function getValidTransitions(status: CaseStatus): CaseStatus[] {
  return STATUS_TRANSITIONS[status] ?? []
}
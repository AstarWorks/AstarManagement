/**
 * Kanban Status Configuration
 * Centralized configuration for case status columns
 */

import type { CaseStatus } from '~/modules/case/types/case'

export interface IStatusColumn {
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
  
  const statusColumns = computed<IStatusColumn[]>(() => [
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
      key: 'negotiation',
      title: t('matter.kanban.columns.negotiation.title'),
      description: t('matter.kanban.columns.negotiation.description'),
      color: 'bg-indigo-50 border-indigo-200',
      headerColor: 'bg-indigo-100',
      order: 4
    },
    {
      key: 'mediation',
      title: t('matter.kanban.columns.mediation.title'),
      description: t('matter.kanban.columns.mediation.description'),
      color: 'bg-purple-50 border-purple-200',
      headerColor: 'bg-purple-100',
      order: 5
    },
    {
      key: 'court',
      title: t('matter.kanban.columns.court.title'),
      description: t('matter.kanban.columns.court.description'),
      color: 'bg-rose-50 border-rose-200',
      headerColor: 'bg-rose-100',
      order: 6
    },
    {
      key: 'resolved',
      title: t('matter.kanban.columns.resolved.title'),
      description: t('matter.kanban.columns.resolved.description'),
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
  new: ['accepted', 'resolved'], // Can accept or close new cases
  accepted: ['investigation', 'resolved'],
  investigation: ['negotiation', 'mediation', 'court', 'resolved'],
  negotiation: ['mediation', 'court', 'resolved'],
  mediation: ['court', 'resolved', 'negotiation'],
  court: ['resolved', 'mediation'],
  resolved: [] // Resolved cases cannot be moved
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
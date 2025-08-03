/**
 * Case Formatting Utilities Composable
 * Provides formatting functions for case data display
 */

import { formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns'
import { ja } from 'date-fns/locale'

export function useCaseFormatting() {
  const { t } = useI18n()

  // Date formatting utilities
  const formatCardDueDate = (dueDate: string) => {
    const date = new Date(dueDate)
    const _now = new Date()

    if (isToday(date)) {
      return t('cases.card.dueDate.today')
    }
    
    if (isTomorrow(date)) {
      return t('cases.card.dueDate.tomorrow')
    }
    
    if (isPast(date)) {
      const distance = formatDistanceToNow(date, { locale: ja })
      return t('cases.card.dueDate.overdue', { days: distance })
    }
    
    const distance = formatDistanceToNow(date, { locale: ja })
    return t('cases.card.dueDate.daysLeft', { days: distance })
  }

  const getDueDateClass = (dueDate: string) => {
    const date = new Date(dueDate)
    
    if (isPast(date)) {
      return 'text-destructive'
    }
    
    if (isToday(date) || isTomorrow(date)) {
      return 'text-warning'
    }
    
    return 'text-muted-foreground'
  }

  const isDueSoon = (dueDate: string) => {
    const date = new Date(dueDate)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays <= 3 && diffDays >= 0
  }

  // Priority formatting
  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    const colors = {
      high: 'bg-destructive/10 text-destructive',
      medium: 'bg-warning/10 text-warning',
      low: 'bg-muted text-muted-foreground'
    }
    return colors[priority]
  }

  // Status formatting
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-primary/10 text-primary',
      accepted: 'bg-emerald-100 text-emerald-800',
      investigation: 'bg-amber-100 text-amber-800',
      preparation: 'bg-violet-100 text-violet-800',
      negotiation: 'bg-orange-100 text-orange-800',
      trial: 'bg-rose-100 text-rose-800',
      completed: 'bg-muted text-muted-foreground'
    }
    return colors[status] || 'bg-muted text-muted-foreground'
  }

  // Date formatting
  const formatDate = (dateString: string, _format = 'yyyy/MM/dd') => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP')
  }

  // Status utilities
  const getStatusLabel = (status: string) => {
    return t(`cases.status.${status}`)
  }

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      new: 'default',
      accepted: 'secondary',
      investigation: 'outline',
      preparation: 'outline',
      negotiation: 'default',
      trial: 'destructive',
      completed: 'secondary'
    }
    return variants[status] || 'default'
  }

  return {
    formatCardDueDate,
    getDueDateClass,
    isDueSoon,
    getPriorityColor,
    getStatusColor,
    formatDate,
    getStatusLabel,
    getStatusVariant
  }
}
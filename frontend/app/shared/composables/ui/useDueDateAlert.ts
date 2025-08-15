/**
 * Due Date Alert Composable
 * Handles date calculations and alert configuration for due date warnings
 */

import { computed } from 'vue'
import { parseISO, differenceInDays } from 'date-fns'

export interface IDueDateAlertConfig {
  type: 'overdue' | 'today' | 'urgent' | 'warning'
  label: string
  icon: string
  variant: 'destructive' | 'secondary' | 'default'
  message: string
}

export function useDueDateAlert(dueDate: string) {
  const { t } = useI18n()
  const now = useNow({ interval: 60000 }) // Update every minute for real-time accuracy

  // Calculate days until due date
  const daysUntilDue = computed(() => {
    if (!dueDate) return null
    return differenceInDays(parseISO(dueDate), now.value)
  })

  // Generate alert configuration based on days remaining
  const alertConfig = computed((): IDueDateAlertConfig | null => {
    const days = daysUntilDue.value
    
    if (days === null) return null
    
    if (days < 0) {
      return {
        type: 'overdue',
        label: t('cases.dueDate.alert.overdue'),
        icon: 'lucide:alert-circle',
        variant: 'destructive',
        message: t('cases.dueDate.alert.daysLate', { days: Math.abs(days) })
      }
    } else if (days === 0) {
      return {
        type: 'today',
        label: t('cases.dueDate.alert.today'),
        icon: 'lucide:clock',
        variant: 'destructive',
        message: t('cases.dueDate.alert.dueToday')
      }
    } else if (days <= 3) {
      return {
        type: 'urgent',
        label: t('cases.dueDate.alert.urgent'),
        icon: 'lucide:alert-triangle',
        variant: 'destructive',
        message: t('cases.dueDate.alert.daysRemaining', { days })
      }
    } else if (days <= 7) {
      return {
        type: 'warning',
        label: t('cases.dueDate.alert.warning'),
        icon: 'lucide:alert-circle',
        variant: 'secondary',
        message: t('cases.dueDate.alert.daysRemaining', { days })
      }
    }
    
    return null
  })

  // Helper computed properties
  const hasAlert = computed(() => alertConfig.value !== null)
  const isOverdue = computed(() => alertConfig.value?.type === 'overdue')
  const isUrgent = computed(() => 
    alertConfig.value?.type === 'urgent' || alertConfig.value?.type === 'today'
  )

  return {
    daysUntilDue: readonly(daysUntilDue),
    alertConfig: readonly(alertConfig),
    hasAlert: readonly(hasAlert),
    isOverdue: readonly(isOverdue),
    isUrgent: readonly(isUrgent)
  }
}
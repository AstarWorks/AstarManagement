import type { MatterStatus, MatterPriority } from '~/types/matter'

/**
 * Get display information for matter types
 */
export const getMatterTypeDisplay = (type: string): { label: string; badge?: string } | null => {
  const typeMap: Record<string, { label: string; badge?: string }> = {
    'corporate': { label: 'Corporate Law', badge: 'CORP' },
    'litigation': { label: 'Litigation', badge: 'LIT' },
    'real_estate': { label: 'Real Estate', badge: 'RE' },
    'employment': { label: 'Employment Law', badge: 'EMP' },
    'family': { label: 'Family Law', badge: 'FAM' },
    'criminal': { label: 'Criminal Defense', badge: 'CRIM' },
    'intellectual_property': { label: 'Intellectual Property', badge: 'IP' },
    'tax': { label: 'Tax Law', badge: 'TAX' },
    'immigration': { label: 'Immigration', badge: 'IMM' },
    'bankruptcy': { label: 'Bankruptcy', badge: 'BK' },
    'other': { label: 'Other' }
  }
  
  return typeMap[type] || null
}

/**
 * Get color variant for matter status
 */
export const getMatterStatusColor = (status: MatterStatus): string => {
  const statusColors: Record<MatterStatus, string> = {
    'INTAKE': 'secondary',
    'INITIAL_REVIEW': 'outline',
    'IN_PROGRESS': 'default',
    'REVIEW': 'warning',
    'WAITING_CLIENT': 'warning',
    'READY_FILING': 'success',
    'CLOSED': 'secondary'
  }
  
  return statusColors[status] || 'default'
}

/**
 * Get color class for matter priority
 */
export const getMatterPriorityColor = (priority: MatterPriority): string => {
  const priorityColors: Record<MatterPriority, string> = {
    'LOW': 'bg-green-500',
    'MEDIUM': 'bg-yellow-500',
    'HIGH': 'bg-orange-500',
    'URGENT': 'bg-red-500'
  }
  
  return priorityColors[priority] || 'bg-gray-500'
}

/**
 * Get display label for matter status
 */
export const getMatterStatusLabel = (status: MatterStatus): string => {
  const statusLabels: Record<MatterStatus, string> = {
    'INTAKE': 'Intake',
    'INITIAL_REVIEW': 'Initial Review',
    'IN_PROGRESS': 'In Progress',
    'REVIEW': 'Under Review',
    'WAITING_CLIENT': 'Waiting for Client',
    'READY_FILING': 'Ready for Filing',
    'CLOSED': 'Closed'
  }
  
  return statusLabels[status] || status.replace(/_/g, ' ')
}

/**
 * Get display label for matter priority
 */
export const getMatterPriorityLabel = (priority: MatterPriority): string => {
  const priorityLabels: Record<MatterPriority, string> = {
    'LOW': 'Low Priority',
    'MEDIUM': 'Medium Priority',
    'HIGH': 'High Priority',
    'URGENT': 'Urgent'
  }
  
  return priorityLabels[priority] || priority
}

/**
 * Calculate progress percentage based on status
 */
export const calculateMatterProgress = (status: MatterStatus): number => {
  const progressMap: Record<MatterStatus, number> = {
    'INTAKE': 10,
    'INITIAL_REVIEW': 20,
    'IN_PROGRESS': 50,
    'REVIEW': 70,
    'WAITING_CLIENT': 75,
    'READY_FILING': 90,
    'CLOSED': 100
  }
  
  return progressMap[status] || 0
}

/**
 * Check if matter is in active state
 */
export const isMatterActive = (status: MatterStatus): boolean => {
  const activeStatuses: MatterStatus[] = [
    'INTAKE',
    'INITIAL_REVIEW', 
    'IN_PROGRESS',
    'REVIEW',
    'WAITING_CLIENT',
    'READY_FILING'
  ]
  
  return activeStatuses.includes(status)
}

/**
 * Format lawyer/clerk display name
 */
export const formatAssigneeName = (assignee: string | { name: string; initials?: string } | undefined): string => {
  if (!assignee) return 'Unassigned'
  
  if (typeof assignee === 'string') {
    return assignee
  }
  
  return assignee.name
}

/**
 * Get initials from name
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
/**
 * Approval Workflow Type Definitions
 * 
 * @description Type definitions for expense approval workflow system,
 * including approval queues, workflow rules, and delegation management.
 * 
 * @author Claude
 * @created 2025-07-03
 * @task T07_S14 - Approval Workflow System
 */

import type { User } from './auth'
import type { Expense, ApprovalStatus } from './expense'

// Approval Queue Types
export interface ApprovalQueueItem extends Expense {
  /** Submitter information */
  submittedBy: User
  
  /** Days since submission */
  daysPending: number
  
  /** Priority level based on amount/type */
  priority: 'low' | 'medium' | 'high'
  
  /** Associated matter title for display */
  matterTitle?: string
  
  /** Whether this item requires urgent attention */
  isUrgent: boolean
  
  /** Escalation information */
  escalation?: {
    escalatedAt: Date
    escalatedBy: string
    reason: string
  }
}

export interface ApprovalQueueFilters {
  status?: ApprovalStatus[]
  expenseType?: string[]
  priority?: ('low' | 'medium' | 'high')[]
  dateRange?: {
    start: Date
    end: Date
  }
  amountRange?: {
    min: number
    max: number
  }
  matterId?: string
  submitterId?: string
  isUrgent?: boolean
  daysPendingMin?: number
  daysPendingMax?: number
}

export interface ApprovalQueueParams extends ApprovalQueueFilters {
  page?: number
  limit?: number
  sortBy?: 'expenseDate' | 'amount' | 'daysPending' | 'priority' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

// Approval Decision Types
export interface ApprovalDecision {
  decision: 'APPROVED' | 'REJECTED'
  reason?: string
  approverId: string
  approvedAt?: Date
  conditions?: string[]
  nextApprover?: string
}

export interface BulkApprovalRequest {
  expenseIds: string[]
  decision: 'APPROVED' | 'REJECTED'
  reason?: string
  conditions?: string[]
}

export interface BulkApprovalResult {
  successful: string[]
  failed: Array<{
    expenseId: string
    error: string
    reason: string
  }>
  summary: {
    total: number
    approved: number
    rejected: number
    failed: number
  }
}

// Approval Rules and Workflow
export interface ApprovalRule {
  id: string
  name: string
  description: string
  
  /** Conditions for this rule to apply */
  conditions: {
    userRole?: ('LAWYER' | 'CLERK' | 'CLIENT')[]
    expenseTypes?: string[]
    amountRange?: {
      min?: number
      max?: number
    }
    matterTypes?: string[]
  }
  
  /** Approval requirements */
  requirements: {
    requiresReceipt?: boolean
    maxAmount?: number
    autoApprove?: boolean
    requiresReason?: boolean
    additionalApprovers?: string[]
  }
  
  /** Priority and escalation */
  priority: number
  escalationDays?: number
  escalationTo?: string[]
  
  /** Active status */
  isActive: boolean
  
  /** Audit information */
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface ApprovalWorkflowStep {
  stepId: string
  expenseId: string
  approverId: string
  approver: User
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED'
  order: number
  requiredBy?: Date
  completedAt?: Date
  decision?: ApprovalDecision
  canDelegate: boolean
  isDelegated: boolean
  delegatedTo?: string
}

// Approval Delegation
export interface ApprovalDelegation {
  id: string
  delegatorId: string
  delegator: User
  delegateeId: string
  delegatee: User
  startDate: Date
  endDate: Date
  reason: string
  includeAllTypes: boolean
  expenseTypes?: string[]
  maxAmount?: number
  isActive: boolean
  createdAt: Date
}

// Approval Statistics and Metrics
export interface ApprovalStatistics {
  /** Queue metrics */
  queueStats: {
    total: number
    pending: number
    overdue: number
    urgent: number
    byPriority: {
      high: number
      medium: number
      low: number
    }
  }
  
  /** Approval metrics */
  approvalStats: {
    totalProcessed: number
    approved: number
    rejected: number
    averageProcessingTime: number // in hours
    approvalRate: number // percentage
  }
  
  /** Workload distribution */
  approverWorkload: Array<{
    approverId: string
    approverName: string
    pending: number
    completed: number
    averageTime: number
    workloadScore: number
  }>
  
  /** Trends and insights */
  trends: {
    dailyVolume: Array<{
      date: string
      submitted: number
      processed: number
    }>
    categoryBreakdown: Array<{
      category: string
      count: number
      approvalRate: number
    }>
  }
}

// Approval History and Audit
export interface ApprovalHistoryItem {
  id: string
  expenseId: string
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'ESCALATED' | 'DELEGATED' | 'RESUBMITTED'
  performedBy: User
  performedAt: Date
  previousStatus?: ApprovalStatus
  newStatus: ApprovalStatus
  reason?: string
  metadata?: {
    delegatedTo?: string
    escalatedTo?: string[]
    conditions?: string[]
    ipAddress?: string
    userAgent?: string
  }
}

// Notifications and Alerts
export interface ApprovalNotification {
  id: string
  type: 'APPROVAL_REQUIRED' | 'APPROVAL_OVERDUE' | 'APPROVAL_ESCALATED' | 'APPROVAL_COMPLETED'
  recipientId: string
  recipient: User
  expenseId: string
  expense: ApprovalQueueItem
  title: string
  message: string
  priority: 'low' | 'medium' | 'high'
  isRead: boolean
  createdAt: Date
  expiresAt?: Date
  
  /** Action buttons */
  actions?: Array<{
    label: string
    action: 'approve' | 'reject' | 'view' | 'delegate'
    variant: 'primary' | 'secondary' | 'destructive'
  }>
}

// API Response Types
export interface ApprovalQueueResponse {
  data: ApprovalQueueItem[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
  summary: {
    totalPending: number
    totalOverdue: number
    totalUrgent: number
    totalAmount: number
  }
}

export interface ApprovalRulesResponse {
  data: ApprovalRule[]
  metadata: {
    total: number
    active: number
    defaultRule?: ApprovalRule
  }
}

export interface ApprovalDelegationsResponse {
  data: ApprovalDelegation[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

// Form Types
export interface ApprovalDecisionForm {
  decision: 'APPROVED' | 'REJECTED'
  reason?: string
  conditions?: string[]
  delegateTo?: string
}

export interface BulkApprovalForm {
  expenseIds: string[]
  decision: 'APPROVED' | 'REJECTED'
  reason?: string
  conditions?: string[]
  notifySubmitters: boolean
}

export interface ApprovalDelegationForm {
  delegateeId: string
  startDate: Date
  endDate: Date
  reason: string
  includeAllTypes: boolean
  expenseTypes?: string[]
  maxAmount?: number
}

export interface ApprovalRuleForm {
  name: string
  description: string
  conditions: ApprovalRule['conditions']
  requirements: ApprovalRule['requirements']
  priority: number
  escalationDays?: number
  escalationTo?: string[]
  isActive: boolean
}

// Utility Types
export type ApprovalAction = 'approve' | 'reject' | 'delegate' | 'escalate' | 'hold'

export interface ApprovalPermissions {
  canApprove: boolean
  canReject: boolean
  canDelegate: boolean
  canEscalate: boolean
  canBulkApprove: boolean
  canManageRules: boolean
  canViewAllQueues: boolean
  maxApprovalAmount?: number
  allowedExpenseTypes?: string[]
}

// Export commonly used types
export type {
  ApprovalQueueItem,
  ApprovalQueueFilters,
  ApprovalDecision,
  BulkApprovalRequest,
  ApprovalRule,
  ApprovalDelegation,
  ApprovalStatistics,
  ApprovalNotification
}
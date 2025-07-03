/**
 * Expense Management Type Definitions
 * 
 * @description Comprehensive type definitions for expense tracking, approval workflow,
 * and integration with Aster Management financial system. Includes expense entities,
 * approval states, filtering, and API response types.
 * 
 * @author Claude
 * @created 2025-07-03
 * @task T01_S14 + T07_S14 - Expense Entry Form + Approval Workflow
 */

import type { BaseEntity, AuditableEntity } from './common'
import type { User } from './auth'
import type { Matter } from './matter'

// Expense Types and Enums
export type ExpenseType = 
  | 'TRAVEL'
  | 'MEALS' 
  | 'ACCOMMODATION'
  | 'COURT_FEES'
  | 'FILING_FEES'
  | 'COPYING'
  | 'POSTAGE'
  | 'TELEPHONE'
  | 'RESEARCH'
  | 'EXPERT_WITNESS'
  | 'OTHER'

export type ApprovalStatus = 
  | 'PENDING'
  | 'APPROVED' 
  | 'REJECTED'
  | 'REIMBURSED'

export type Currency = 'JPY' | 'USD' | 'EUR' | 'GBP' | 'KRW' | 'CNY' | 'SGD'

// Core Expense Entity
export interface Expense extends BaseEntity, AuditableEntity {
  /** Associated matter (optional) */
  matterId?: string
  matter?: Matter
  
  /** Expense description */
  description: string
  
  /** Expense amount (decimal) */
  amount: number
  
  /** Currency code */
  currency: Currency
  
  /** Date when expense was incurred */
  expenseDate: Date
  
  /** Category/type of expense */
  expenseType: ExpenseType
  
  /** Receipt filename if uploaded */
  receiptFilename?: string
  
  /** Whether receipt is required for this expense */
  receiptRequired: boolean
  
  /** Current approval status */
  approvalStatus: ApprovalStatus
  
  /** User who approved this expense */
  approvedBy?: string
  approvedByUser?: User
  
  /** When expense was approved */
  approvedAt?: Date
  
  /** Whether expense is billable to client */
  billable: boolean
  
  /** Whether expense has been billed */
  billed: boolean
  
  /** Billing rate for this expense */
  billingRate?: number
  
  /** Additional notes */
  notes?: string
}

// Form Input Types
export interface ExpenseCreateInput {
  matterId?: string
  description: string
  amount: number
  currency: Currency
  expenseDate: Date
  expenseType: ExpenseType
  receiptFile?: File
  billable: boolean
  notes?: string
}

export interface ExpenseUpdateInput extends Partial<ExpenseCreateInput> {
  id: string
}

// Approval Workflow Types
export interface ApprovalDecision {
  decision: 'APPROVED' | 'REJECTED'
  reason?: string
  approverId: string
}

export interface ApprovalQueueItem extends Expense {
  /** Submitter information */
  submittedBy: User
  
  /** Days since submission */
  daysPending: number
  
  /** Priority level based on amount/type */
  priority: 'low' | 'medium' | 'high'
  
  /** Associated matter title for display */
  matterTitle?: string
}

export interface ApprovalQueueFilters {
  status?: ApprovalStatus[]
  expenseType?: ExpenseType[]
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
  priority?: ('low' | 'medium' | 'high')[]
}

export interface BulkApprovalRequest {
  expenseIds: string[]
  decision: 'APPROVED' | 'REJECTED'
  reason?: string
}

export interface BulkApprovalResult {
  successful: string[]
  failed: Array<{
    expenseId: string
    error: string
  }>
  summary: {
    total: number
    approved: number
    rejected: number
    failed: number
  }
}

// Expense Categories for UI
export interface ExpenseCategory {
  type: ExpenseType
  label: string
  description: string
  requiresReceipt: boolean
  defaultBillable: boolean
  icon: string
}

export const EXPENSE_CATEGORIES: Record<ExpenseType, ExpenseCategory> = {
  TRAVEL: {
    type: 'TRAVEL',
    label: 'Travel Expenses',
    description: 'Transportation costs including train, taxi, flights',
    requiresReceipt: true,
    defaultBillable: true,
    icon: 'Plane'
  },
  MEALS: {
    type: 'MEALS',
    label: 'Meals & Entertainment',
    description: 'Business meals and client entertainment',
    requiresReceipt: true,
    defaultBillable: true,
    icon: 'UtensilsCrossed'
  },
  ACCOMMODATION: {
    type: 'ACCOMMODATION',
    label: 'Accommodation',
    description: 'Hotel and lodging expenses',
    requiresReceipt: true,
    defaultBillable: true,
    icon: 'Hotel'
  },
  COURT_FEES: {
    type: 'COURT_FEES',
    label: 'Court Fees',
    description: 'Court filing and hearing fees',
    requiresReceipt: true,
    defaultBillable: true,
    icon: 'Scale'
  },
  FILING_FEES: {
    type: 'FILING_FEES',
    label: 'Filing Fees',
    description: 'Document filing and registration fees',
    requiresReceipt: true,
    defaultBillable: true,
    icon: 'FileText'
  },
  COPYING: {
    type: 'COPYING',
    label: 'Copying & Printing',
    description: 'Document copying and printing costs',
    requiresReceipt: false,
    defaultBillable: true,
    icon: 'Printer'
  },
  POSTAGE: {
    type: 'POSTAGE',
    label: 'Postage & Delivery',
    description: 'Postal and courier services',
    requiresReceipt: false,
    defaultBillable: true,
    icon: 'Mail'
  },
  TELEPHONE: {
    type: 'TELEPHONE',
    label: 'Telephone & Communication',
    description: 'Phone calls and communication expenses',
    requiresReceipt: false,
    defaultBillable: true,
    icon: 'Phone'
  },
  RESEARCH: {
    type: 'RESEARCH',
    label: 'Legal Research',
    description: 'Database subscriptions and research costs',
    requiresReceipt: true,
    defaultBillable: true,
    icon: 'Search'
  },
  EXPERT_WITNESS: {
    type: 'EXPERT_WITNESS',
    label: 'Expert Witness Fees',
    description: 'Expert witness consultation and testimony fees',
    requiresReceipt: true,
    defaultBillable: true,
    icon: 'GraduationCap'
  },
  OTHER: {
    type: 'OTHER',
    label: 'Other Expenses',
    description: 'Miscellaneous business expenses',
    requiresReceipt: true,
    defaultBillable: false,
    icon: 'MoreHorizontal'
  }
} as const

// Approval Rules Configuration
export interface ApprovalRule {
  userRole: 'LAWYER' | 'CLERK' | 'CLIENT'
  maxAmount?: number
  allowedExpenseTypes?: ExpenseType[]
  requiresReceipt?: boolean
  autoApprove?: boolean
}

export const APPROVAL_RULES: ApprovalRule[] = [
  {
    userRole: 'CLERK',
    maxAmount: 10000, // ¥10,000
    allowedExpenseTypes: ['COPYING', 'POSTAGE', 'TELEPHONE'],
    requiresReceipt: false
  },
  {
    userRole: 'LAWYER',
    // No amount limit for lawyers
    requiresReceipt: true
  },
  {
    userRole: 'CLIENT',
    // Clients cannot approve expenses
  }
]

// Approval Priority Calculation
export function calculateApprovalPriority(expense: Expense): 'low' | 'medium' | 'high' {
  // High priority: >¥50,000 or expert witness fees
  if (expense.amount > 50000 || expense.expenseType === 'EXPERT_WITNESS') {
    return 'high'
  }
  
  // Medium priority: >¥10,000 or court/filing fees
  if (expense.amount > 10000 || ['COURT_FEES', 'FILING_FEES'].includes(expense.expenseType)) {
    return 'medium'
  }
  
  // Low priority: routine expenses
  return 'low'
}

// Filtering and Search Types
export interface ExpenseFilters {
  status?: ApprovalStatus[]
  expenseType?: ExpenseType[]
  billable?: boolean
  billed?: boolean
  matterId?: string
  dateRange?: {
    start: Date
    end: Date
  }
  amountRange?: {
    min: number
    max: number
  }
  searchQuery?: string
}

export interface ExpenseListParams extends ExpenseFilters {
  page?: number
  limit?: number
  sortBy?: keyof Expense
  sortOrder?: 'asc' | 'desc'
}

// API Response Types
export interface ExpenseListResponse {
  data: Expense[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
  summary: {
    totalAmount: number
    pendingAmount: number
    approvedAmount: number
    billableAmount: number
  }
}

export interface ExpenseResponse {
  data: Expense
}

// Validation Types
export interface ExpenseValidationError {
  field: keyof ExpenseCreateInput
  message: string
  code: string
}

export interface ExpenseValidationResult {
  isValid: boolean
  errors: ExpenseValidationError[]
  warnings: string[]
}

// Receipt Upload Types
export interface ReceiptUpload {
  file: File
  previewUrl: string
  uploadProgress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
}

// Dashboard and Statistics Types
export interface ExpenseStatistics {
  totalExpenses: number
  totalAmount: number
  pendingApprovals: number
  pendingAmount: number
  averageAmount: number
  categoryBreakdown: Array<{
    category: ExpenseType
    count: number
    amount: number
    percentage: number
  }>
  monthlyTrend: Array<{
    month: string
    amount: number
    count: number
  }>
}

// Audit Trail Types
export interface ExpenseAuditEvent {
  id: string
  expenseId: string
  eventType: 'CREATED' | 'UPDATED' | 'APPROVED' | 'REJECTED' | 'REIMBURSED'
  userId: string
  user: User
  timestamp: Date
  oldValues?: Partial<Expense>
  newValues?: Partial<Expense>
  reason?: string
  ipAddress?: string
}

// Export Types for Components
export type {
  Expense,
  ExpenseCreateInput,
  ExpenseUpdateInput,
  ApprovalQueueItem,
  ApprovalQueueFilters,
  BulkApprovalRequest,
  BulkApprovalResult,
  ExpenseFilters,
  ExpenseListParams,
  ExpenseListResponse,
  ExpenseStatistics,
  ReceiptUpload
}
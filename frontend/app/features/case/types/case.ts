// Core case management types for Japanese legal practice

export type CaseStatus = 
  | 'new'           // 新規 - Initial case intake
  | 'accepted'      // 受任 - Case officially accepted  
  | 'investigation' // 調査 - Evidence gathering phase
  | 'preparation'   // 準備 - Case preparation
  | 'negotiation'   // 交渉 - Settlement negotiations
  | 'trial'         // 裁判 - Court proceedings
  | 'completed'     // 完了 - Case closed

export type CasePriority = 'high' | 'medium' | 'low'

export type DateRangeOption = 
  | 'all'        // 全期間
  | 'today'      // 今日
  | 'this-week'  // 今週  
  | 'this-month' // 今月
  | 'overdue'    // 期限切れ

export type ClientType = 'individual' | 'corporate'

export interface IClient {
  id: string
  name: string
  type: ClientType
  email?: string
  phone?: string
  address?: string
}

export interface ICase {
  id: string
  caseNumber: string
  title: string
  description?: string
  client: IClient
  status: CaseStatus
  priority: CasePriority
  assignedLawyer: string
  dueDate: string // ISO date string
  tags: string[]
  createdAt: string // ISO date string
  updatedAt: string // ISO date string
  
  // Optional extended fields
  estimatedHours?: number
  actualHours?: number
  billingRate?: number
  totalBilled?: number
  notes?: string
}

export interface ICaseFilters {
  search: string
  clientType: 'all' | ClientType
  priority: 'all' | CasePriority  
  assignedLawyer: string
  tags: string[]
  dateRange: {
    start: string
    end: string
  } | null
  sortBy?: 'dueDate' | 'priority' | 'createdAt' | 'updatedAt' | 'title'
  sortOrder?: 'asc' | 'desc'
}

export interface ICaseStatusColumn {
  key: CaseStatus
  title: string
  description: string
  color: string
  headerColor: string
  allowedTransitions?: CaseStatus[]
}

// Case activity/timeline types
export type CaseActivityType = 
  | 'created'
  | 'status_changed'
  | 'assigned'  
  | 'note_added'
  | 'document_uploaded'
  | 'communication_logged'
  | 'deadline_updated'

export interface ICaseActivity {
  id: string
  caseId: string
  type: CaseActivityType
  title: string
  description?: string
  userId: string
  userName: string
  timestamp: string // ISO date string
  metadata?: Record<string, unknown>
}

// Form validation schemas
export interface ICreateCaseForm {
  title: string
  clientId: string
  assignedLawyer: string
  priority: CasePriority
  dueDate: string
  tags: string[]
  description?: string
}

export interface IUpdateCaseForm extends Partial<ICreateCaseForm> {
  id: string
  status?: CaseStatus
}

// API response types
export interface ICaseListResponse {
  cases: ICase[]
  totalCount: number
  hasMore: boolean
  nextCursor?: string
}

export interface ICaseStatsResponse {
  totalCases: number
  casesByStatus: Record<CaseStatus, number>
  casesByPriority: Record<CasePriority, number>
  overdueCount: number
  dueSoonCount: number
}

// Drag and drop types
export interface IDragCaseData {
  caseId: string
  currentStatus: CaseStatus
}

// Search and filtering
export interface ICaseSearchOptions extends ICaseFilters {
  limit?: number
  offset?: number
  includeArchived?: boolean
}

// Component prop types for better type safety
export interface ICaseCardProps {
  case: ICase
  viewMode?: 'minimal' | 'compact' | 'detailed'
  interactive?: boolean
  showQuickActions?: boolean
  isLoading?: boolean
}

export interface IKanbanColumnProps {
  status: ICaseStatusColumn
  cases: ICase[]
  isLoading?: boolean
}

// Status transition validation
export const VALID_STATUS_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  new: ['accepted'],
  accepted: ['investigation', 'completed'],
  investigation: ['preparation', 'negotiation', 'trial'],
  preparation: ['negotiation', 'trial'],
  negotiation: ['trial', 'completed'],
  trial: ['completed'],
  completed: [] // No transitions from completed
}

// Helper functions
export function isValidStatusTransition(from: CaseStatus, to: CaseStatus): boolean {
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false
}

export function getNextAvailableStatuses(currentStatus: CaseStatus): CaseStatus[] {
  return VALID_STATUS_TRANSITIONS[currentStatus] ?? []
}

export function getCaseStatusOrder(status: CaseStatus): number {
  const order: Record<CaseStatus, number> = {
    new: 1,
    accepted: 2,
    investigation: 3,
    preparation: 4,
    negotiation: 5,
    trial: 6,
    completed: 7
  }
  return order[status] ?? 0
}

// Constants for Japanese legal practice
export const CASE_PRIORITIES: Record<CasePriority, { label: string; color: string }> = {
  high: { label: '緊急', color: 'red' },
  medium: { label: '通常', color: 'yellow' },
  low: { label: '低', color: 'green' }
}

export const CASE_STATUSES: Record<CaseStatus, { label: string; description: string }> = {
  new: { label: '新規', description: '案件受付' },
  accepted: { label: '受任', description: '正式受任' },
  investigation: { label: '調査', description: '証拠収集' },
  preparation: { label: '準備', description: '案件準備' },
  negotiation: { label: '交渉', description: '和解交渉' },
  trial: { label: '裁判', description: '法廷手続' },
  completed: { label: '完了', description: '案件終了' }
}

export const CLIENT_TYPES: Record<ClientType, { label: string; icon: string }> = {
  individual: { label: '個人', icon: 'lucide:user' },
  corporate: { label: '法人', icon: 'lucide:building' }
}

// Common tag categories for Japanese legal practice
export const COMMON_CASE_TAGS = [
  '不動産', '契約', 'M&A', '企業法務', '労働法', '調停',
  '民事', '刑事', '家事', '知的財産', '税務', '国際',
  '債権回収', '相続', '離婚', '交通事故', '医療過誤', '建築紛争'
] as const

export type CommonCaseTag = typeof COMMON_CASE_TAGS[number]
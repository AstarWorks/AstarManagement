/**
 * Matter API Type Definitions
 * 
 * Type definitions for legal matters/cases in the system
 */

import type { 
  AuditableEntity, 
  SoftDeletableEntity, 
  UserSummary,
  EntityReference,
  DateRange
} from './common'

/**
 * Matter entity representing a legal case
 */
export interface Matter extends AuditableEntity, SoftDeletableEntity {
  id: string
  caseNumber: string
  title: string
  description?: string
  status: MatterStatus
  type: MatterType
  priority: Priority
  assignedTo?: UserSummary
  client: ClientSummary
  dueDate?: string // ISO 8601 date string
  closedDate?: string
  tags: string[]
  customFields?: Record<string, unknown>
  
  // Relations
  teamMembers?: TeamMember[]
  relatedMatters?: RelatedMatter[]
  
  // Computed fields
  daysUntilDue?: number
  isOverdue?: boolean
  completionPercentage?: number
}

/**
 * Matter status enum
 */
export type MatterStatus = 
  | 'DRAFT'
  | 'ACTIVE'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ARCHIVED'

/**
 * Matter type classification
 */
export type MatterType = 
  | 'CIVIL_LITIGATION'
  | 'CRIMINAL_DEFENSE'
  | 'CONTRACT_REVIEW'
  | 'CORPORATE_LAW'
  | 'FAMILY_LAW'
  | 'INTELLECTUAL_PROPERTY'
  | 'REAL_ESTATE'
  | 'LABOR_LAW'
  | 'IMMIGRATION'
  | 'TAX_LAW'
  | 'BANKRUPTCY'
  | 'PERSONAL_INJURY'
  | 'OTHER'

/**
 * Priority levels
 */
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

/**
 * Client summary for matter references
 */
export interface ClientSummary {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  type: ClientType
}

/**
 * Client type classification
 */
export type ClientType = 'INDIVIDUAL' | 'CORPORATION' | 'NON_PROFIT' | 'GOVERNMENT'

/**
 * Team member assignment
 */
export interface TeamMember {
  user: UserSummary
  role: TeamRole
  assignedDate: string
  billableRate?: number
  permissions: MatterPermission[]
}

/**
 * Team roles within a matter
 */
export type TeamRole = 
  | 'LEAD_ATTORNEY'
  | 'ASSOCIATE_ATTORNEY'
  | 'PARALEGAL'
  | 'LEGAL_ASSISTANT'
  | 'CLERK'
  | 'CONSULTANT'

/**
 * Matter-specific permissions
 */
export type MatterPermission = 
  | 'VIEW'
  | 'EDIT'
  | 'DELETE'
  | 'MANAGE_TEAM'
  | 'MANAGE_DOCUMENTS'
  | 'MANAGE_COMMUNICATIONS'
  | 'VIEW_FINANCIALS'
  | 'EDIT_FINANCIALS'

/**
 * Related matter reference
 */
export interface RelatedMatter {
  matter: EntityReference
  relationType: RelationType
  description?: string
}

/**
 * Relation types between matters
 */
export type RelationType = 
  | 'PARENT'
  | 'CHILD'
  | 'RELATED'
  | 'OPPOSING'
  | 'PRECEDENT'

/**
 * Matter activity/event
 */
export interface Activity {
  id: string
  type: ActivityType
  description: string
  performedBy: UserSummary
  performedAt: string
  metadata?: Record<string, unknown>
  changes?: FieldChange[]
}

/**
 * Activity types
 */
export type ActivityType = 
  | 'CREATED'
  | 'UPDATED'
  | 'STATUS_CHANGED'
  | 'ASSIGNED'
  | 'DOCUMENT_ADDED'
  | 'MEMO_ADDED'
  | 'COMMENT_ADDED'
  | 'DEADLINE_CHANGED'
  | 'TEAM_MEMBER_ADDED'
  | 'TEAM_MEMBER_REMOVED'

/**
 * Field change tracking
 */
export interface FieldChange {
  field: string
  oldValue: unknown
  newValue: unknown
}

/**
 * Matter note/comment
 */
export interface Note {
  id: string
  content: string
  author: UserSummary
  createdAt: string
  updatedAt?: string
  isInternal: boolean
  attachments?: AttachmentSummary[]
  mentions?: UserSummary[]
}

/**
 * Attachment summary
 */
export interface AttachmentSummary {
  id: string
  filename: string
  contentType: string
  size: number
  uploadedAt: string
  uploadedBy: UserSummary
}

/**
 * Document summary for matter
 */
export interface DocumentSummary {
  id: string
  title: string
  filename: string
  contentType: string
  size: number
  category: DocumentCategory
  uploadedAt: string
  uploadedBy: UserSummary
  version: number
  isLatest: boolean
  tags: string[]
}

/**
 * Document categories
 */
export type DocumentCategory = 
  | 'CONTRACT'
  | 'PLEADING'
  | 'MOTION'
  | 'DISCOVERY'
  | 'CORRESPONDENCE'
  | 'EVIDENCE'
  | 'COURT_ORDER'
  | 'FILING'
  | 'INTERNAL_MEMO'
  | 'CLIENT_DOCUMENT'
  | 'RESEARCH'
  | 'OTHER'

/**
 * Create matter request DTO
 */
export interface CreateMatterRequest {
  title: string           // Required, 3-200 characters
  description?: string    // Optional, max 2000 characters
  type: MatterType       // Required
  priority: Priority     // Required
  clientId: string       // Required, must be valid client ID
  assignedTo?: string    // Optional, defaults to current user
  dueDate?: string       // Optional, ISO date string
  tags?: string[]        // Optional, max 10 tags
  customFields?: Record<string, unknown> // Optional
  teamMembers?: CreateTeamMemberRequest[]
}

/**
 * Create team member request
 */
export interface CreateTeamMemberRequest {
  userId: string
  role: TeamRole
  permissions?: MatterPermission[]
  billableRate?: number
}

/**
 * Update matter request DTO
 */
export interface UpdateMatterRequest {
  title?: string
  description?: string
  type?: MatterType
  priority?: Priority
  assignedTo?: string
  dueDate?: string
  tags?: string[]
  customFields?: Record<string, unknown>
}

/**
 * Update status request DTO
 */
export interface UpdateStatusRequest {
  status: MatterStatus
  reason?: string // Required for certain transitions
  completionNotes?: string // Required when moving to COMPLETED
}

/**
 * Matter query parameters
 */
export interface MatterQueryParams {
  page?: number          // Default: 0
  size?: number          // Default: 20, Max: 100
  sort?: string | string[] // Format: "field,direction"
  status?: MatterStatus | MatterStatus[]
  type?: MatterType | MatterType[]
  priority?: Priority | Priority[]
  assignedTo?: string    // User ID
  clientId?: string      // Client ID
  search?: string        // Search in title, description, caseNumber
  tags?: string | string[] // Filter by tags
  dateRange?: DateRange  // Filter by date
  includeDeleted?: boolean // Include soft-deleted matters
  includeArchived?: boolean // Include archived matters
}

/**
 * Matter statistics
 */
export interface MatterStatistics {
  totalMatters: number
  byStatus: Record<MatterStatus, number>
  byType: Record<MatterType, number>
  byPriority: Record<Priority, number>
  overdue: number
  dueSoon: number // Due within 7 days
  recentlyUpdated: number // Updated within 24 hours
  averageCompletionTime: number // In days
  teamUtilization: TeamUtilization[]
}

/**
 * Team utilization metrics
 */
export interface TeamUtilization {
  user: UserSummary
  activeMatters: number
  completedMatters: number
  averageMattersPerMonth: number
  currentWorkload: WorkloadLevel
}

/**
 * Workload levels
 */
export type WorkloadLevel = 'LOW' | 'NORMAL' | 'HIGH' | 'OVERLOADED'

/**
 * Bulk operation request
 */
export interface BulkOperationRequest {
  operation: BulkOperationType
  matterIds: string[]
  data: BulkOperationData
}

/**
 * Bulk operation types
 */
export type BulkOperationType = 
  | 'UPDATE_STATUS'
  | 'ASSIGN'
  | 'ADD_TAGS'
  | 'REMOVE_TAGS'
  | 'UPDATE_PRIORITY'
  | 'ARCHIVE'
  | 'DELETE'

/**
 * Bulk operation data based on operation type
 */
export type BulkOperationData = 
  | UpdateStatusBulkData
  | AssignBulkData
  | TagsBulkData
  | UpdatePriorityBulkData
  | ArchiveBulkData

export interface UpdateStatusBulkData {
  status: MatterStatus
  reason?: string
}

export interface AssignBulkData {
  assignedTo: string
  notifyAssignee?: boolean
}

export interface TagsBulkData {
  tags: string[]
}

export interface UpdatePriorityBulkData {
  priority: Priority
}

export interface ArchiveBulkData {
  archiveReason?: string
  retentionPeriod?: number // In days
}

/**
 * Matter export options
 */
export interface MatterExportOptions {
  format: ExportFormat
  includeDocuments?: boolean
  includeCommunications?: boolean
  includeActivities?: boolean
  includeFinancials?: boolean
  dateRange?: DateRange
}

/**
 * Export formats
 */
export type ExportFormat = 'PDF' | 'EXCEL' | 'CSV' | 'JSON' | 'ZIP'

/**
 * Matter template for quick creation
 */
export interface MatterTemplate {
  id: string
  name: string
  description?: string
  type: MatterType
  priority: Priority
  defaultTags?: string[]
  defaultCustomFields?: Record<string, unknown>
  checklistItems?: ChecklistItem[]
  documentTemplates?: DocumentTemplateSummary[]
}

/**
 * Checklist item for matter templates
 */
export interface ChecklistItem {
  id: string
  title: string
  description?: string
  dueInDays?: number // Days after matter creation
  assignToRole?: TeamRole
  required: boolean
  order: number
}

/**
 * Document template summary
 */
export interface DocumentTemplateSummary {
  id: string
  name: string
  category: DocumentCategory
  description?: string
}

/**
 * Type guards
 */
export function isMatter(obj: unknown): obj is Matter {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'caseNumber' in obj &&
    'title' in obj &&
    'status' in obj &&
    'type' in obj
  )
}

export function isDraftMatter(matter: Matter): boolean {
  return matter.status === 'DRAFT'
}

export function isActiveMatter(matter: Matter): boolean {
  return matter.status === 'ACTIVE'
}

export function isCompletedMatter(matter: Matter): boolean {
  return matter.status === 'COMPLETED' || matter.status === 'CANCELLED'
}

export function isArchivedMatter(matter: Matter): boolean {
  return matter.status === 'ARCHIVED'
}

/**
 * Validation helpers
 */
export function isValidStatusTransition(from: MatterStatus, to: MatterStatus): boolean {
  const transitions: Record<MatterStatus, MatterStatus[]> = {
    DRAFT: ['ACTIVE', 'CANCELLED'],
    ACTIVE: ['ON_HOLD', 'COMPLETED', 'CANCELLED'],
    ON_HOLD: ['ACTIVE', 'CANCELLED'],
    COMPLETED: ['ARCHIVED'],
    CANCELLED: ['ARCHIVED'],
    ARCHIVED: []
  }
  
  return transitions[from]?.includes(to) ?? false
}

/**
 * Priority helpers
 */
export function getPriorityWeight(priority: Priority): number {
  const weights: Record<Priority, number> = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    URGENT: 4
  }
  return weights[priority]
}

export function comparePriority(a: Priority, b: Priority): number {
  return getPriorityWeight(b) - getPriorityWeight(a)
}
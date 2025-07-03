/**
 * Activity Timeline Types for Matter Management
 * Supports documents, communications, and audit events
 */

import type { User } from './auth'

/**
 * Base activity interface that all activity types extend
 */
export interface BaseActivity {
  id: string
  matterId: string
  type: ActivityType
  timestamp: Date
  actor: User
  description: string
  metadata?: Record<string, any>
}

/**
 * Activity types supported by the timeline
 */
export type ActivityType = 
  | 'document_upload'
  | 'document_view'
  | 'document_download'
  | 'communication_email'
  | 'communication_note'
  | 'communication_call'
  | 'matter_created'
  | 'matter_updated'
  | 'matter_status_changed'
  | 'matter_assigned'
  | 'task_created'
  | 'task_completed'
  | 'audit_action'

/**
 * Document-related activity
 */
export interface DocumentActivity extends BaseActivity {
  type: 'document_upload' | 'document_view' | 'document_download'
  documentId: string
  documentName: string
  documentType: string
  fileSize?: number
  metadata: {
    fileName: string
    mimeType: string
    category?: string
    tags?: readonly string[]
  }
}

/**
 * Communication activity (emails, notes, calls)
 */
export interface CommunicationActivity extends BaseActivity {
  type: 'communication_email' | 'communication_note' | 'communication_call'
  communicationId: string
  subject?: string
  content?: string
  participants?: readonly User[]
  direction?: 'inbound' | 'outbound'
  duration?: number // for calls, in minutes
  metadata: {
    emailAddress?: string
    phoneNumber?: string
    importance?: 'low' | 'medium' | 'high'
    attachmentCount?: number
  }
}

/**
 * Matter-related activity (creation, updates, status changes)
 */
export interface MatterActivity extends BaseActivity {
  type: 'matter_created' | 'matter_updated' | 'matter_status_changed' | 'matter_assigned'
  fieldName?: string
  oldValue?: string
  newValue?: string
  assignee?: User
  metadata: {
    changeReason?: string
    previousStatus?: string
    newStatus?: string
    fieldType?: string
  }
}

/**
 * Task-related activity
 */
export interface TaskActivity extends BaseActivity {
  type: 'task_created' | 'task_completed'
  taskId: string
  taskTitle: string
  priority?: 'low' | 'medium' | 'high'
  dueDate?: Date
  metadata: {
    taskDescription?: string
    estimatedHours?: number
    actualHours?: number
  }
}

/**
 * Audit log activity
 */
export interface AuditActivity extends BaseActivity {
  type: 'audit_action'
  action: 'view' | 'export' | 'print' | 'create' | 'update' | 'delete'
  entityType: string
  entityId: string
  ipAddress: string
  userAgent: string
  sessionId: string
  metadata: {
    oldValues?: Record<string, any>
    newValues?: Record<string, any>
    changeReason?: string
  }
}

/**
 * Union type for all activity types
 */
export type Activity = 
  | DocumentActivity 
  | CommunicationActivity 
  | MatterActivity 
  | TaskActivity 
  | AuditActivity

/**
 * Activity filter options
 */
export interface ActivityFilters {
  types?: readonly ActivityType[]
  actors?: readonly string[] // user IDs
  dateRange?: {
    readonly from: Date
    readonly to: Date
  }
  searchTerm?: string
}

/**
 * Activity timeline view modes
 */
export type ActivityViewMode = 'compact' | 'detailed' | 'grouped'

/**
 * Grouped activities by date
 */
export interface ActivityGroup {
  date: string // ISO date string (YYYY-MM-DD)
  activities: Activity[]
  totalCount: number
}

/**
 * Paginated activity response
 */
export interface ActivityResponse {
  activities: Activity[]
  totalCount: number
  hasMore: boolean
  nextCursor?: string
}

/**
 * Activity export options
 */
export interface ActivityExportOptions {
  format: 'pdf' | 'csv' | 'json'
  filters?: ActivityFilters
  includeMetadata: boolean
  dateRange: {
    from: Date
    to: Date
  }
}

/**
 * Real-time activity update
 */
export interface ActivityUpdate {
  type: 'new_activity' | 'activity_updated' | 'activity_deleted'
  activity: Activity
  matterId: string
}

/**
 * Activity timeline configuration
 */
export interface ActivityTimelineConfig {
  viewMode: ActivityViewMode
  enableRealTime: boolean
  enableInfiniteScroll: boolean
  pageSize: number
  enableExport: boolean
  enableSearch: boolean
  enableFiltering: boolean
  autoRefreshInterval?: number // in seconds
}

/**
 * Activity icon mapping
 */
export const ACTIVITY_ICONS: Record<ActivityType, string> = {
  document_upload: 'upload',
  document_view: 'eye',
  document_download: 'download',
  communication_email: 'mail',
  communication_note: 'sticky-note',
  communication_call: 'phone',
  matter_created: 'plus-circle',
  matter_updated: 'edit',
  matter_status_changed: 'git-branch',
  matter_assigned: 'user-plus',
  task_created: 'check-square',
  task_completed: 'check-circle',
  audit_action: 'shield'
}

/**
 * Activity color mapping for visual distinction
 */
export const ACTIVITY_COLORS: Record<ActivityType, string> = {
  document_upload: 'text-blue-600',
  document_view: 'text-gray-600',
  document_download: 'text-green-600',
  communication_email: 'text-purple-600',
  communication_note: 'text-yellow-600',
  communication_call: 'text-orange-600',
  matter_created: 'text-emerald-600',
  matter_updated: 'text-blue-600',
  matter_status_changed: 'text-indigo-600',
  matter_assigned: 'text-cyan-600',
  task_created: 'text-pink-600',
  task_completed: 'text-green-600',
  audit_action: 'text-red-600'
}

/**
 * Activity priority levels for sorting
 */
export const ACTIVITY_PRIORITY: Record<ActivityType, number> = {
  matter_created: 10,
  matter_updated: 9,
  matter_status_changed: 9,
  matter_assigned: 8,
  communication_email: 7,
  communication_call: 6,
  task_created: 5,
  task_completed: 5,
  document_upload: 4,
  communication_note: 3,
  document_view: 2,
  document_download: 2,
  audit_action: 1
}
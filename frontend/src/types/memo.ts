// Memo types for T04_S13 implementation

export type MemoStatus = 'draft' | 'sent' | 'read' | 'archived'
export type MemoPriority = 'low' | 'medium' | 'high' | 'urgent'
export type RecipientType = 'client' | 'court' | 'opposing_counsel' | 'internal'

export interface MemoRecipient {
  id: string
  name: string
  type: RecipientType
}

export interface Attachment {
  id: string
  filename: string
  size: number
  mimeType: string
  url: string
  uploadedAt: string
}

export interface MemoCreator {
  id: string
  name: string
}

export interface Memo {
  id: string
  caseId: string
  caseNumber: string
  recipient: MemoRecipient
  subject: string
  content: string
  status: MemoStatus
  priority: MemoPriority
  sentAt?: string
  readAt?: string
  createdBy: MemoCreator
  tags: string[]
  attachments: Attachment[]
}

export interface MemoFilters {
  search?: string
  status?: MemoStatus[]
  recipient?: string[]
  recipientType?: RecipientType[]
  dateFrom?: Date
  dateTo?: Date
  tags?: string[]
  priority?: MemoPriority[]
  caseId?: string
  createdBy?: string
  hasAttachments?: boolean
  sort?: 'sentAt' | 'createdAt' | 'subject' | 'priority'
  order?: 'asc' | 'desc'
}

export interface BulkOperation {
  type: 'mark_read' | 'mark_unread' | 'archive' | 'unarchive' | 'delete'
  memoIds: string[]
  confirmationRequired: boolean
}

export interface MemoSearchSuggestion {
  id: string
  type: 'recipient' | 'tag' | 'case' | 'subject'
  value: string
  count: number
  highlight?: string
}

export interface PaginatedMemoResponse {
  data: Memo[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface MemoExportOptions {
  format: 'csv' | 'pdf'
  filters?: MemoFilters
  memoIds?: string[]
  includeContent?: boolean
  includeAttachments?: boolean
}

export interface MemoViewPreference {
  viewMode: 'list' | 'grid'
  sortBy: string
  sortOrder: 'asc' | 'desc'
  pageSize: number
  showPreview: boolean
}
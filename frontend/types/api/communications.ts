/**
 * Communication API Type Definitions
 * 
 * Type definitions for memos, messages, and communication tracking
 */

import type { 
  AuditableEntity, 
  SoftDeletableEntity,
  UserSummary,
  EntityReference,
  DateRange,
  AttachmentSummary
} from './common'

/**
 * Memo entity (client communication)
 */
export interface Memo extends AuditableEntity, SoftDeletableEntity {
  id: string
  subject: string
  content: string              // Rich text content
  plainTextContent?: string    // Plain text version for search
  type: MemoType
  status: MemoStatus
  priority: MemoPriority
  
  // Relationships
  matterId?: string
  clientId?: string
  author: UserSummary
  recipients: Recipient[]
  cc?: Recipient[]
  bcc?: Recipient[]
  
  // Communication details
  sentAt?: string
  readAt?: string
  readBy?: UserSummary[]
  deliveryStatus?: DeliveryStatus
  
  // Threading
  threadId?: string
  parentMemoId?: string
  replyCount: number
  
  // Attachments
  attachments: MemoAttachment[]
  hasAttachments: boolean
  totalAttachmentSize: number
  
  // Templates and automation
  templateId?: string
  templateName?: string
  scheduledSendAt?: string
  
  // Tags and classification
  tags: string[]
  category?: CommunicationCategory
  sentiment?: SentimentAnalysis
  
  // Additional metadata
  isInternal: boolean
  isConfidential: boolean
  requiresResponse: boolean
  responseDeadline?: string
  customFields?: Record<string, unknown>
}

/**
 * Memo types
 */
export type MemoType = 
  | 'CLIENT_MEMO'      // Formal client communication
  | 'INTERNAL_NOTE'    // Internal team notes
  | 'EMAIL'           // Email communication
  | 'PHONE_NOTE'      // Phone call summary
  | 'MEETING_NOTE'    // Meeting minutes
  | 'SMS'             // Text message
  | 'LETTER'          // Formal letter
  | 'FAX'             // Fax communication

/**
 * Memo status
 */
export type MemoStatus = 
  | 'DRAFT'
  | 'SCHEDULED'
  | 'SENT'
  | 'DELIVERED'
  | 'READ'
  | 'FAILED'
  | 'ARCHIVED'

/**
 * Memo priority
 */
export type MemoPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

/**
 * Communication category
 */
export type CommunicationCategory = 
  | 'GENERAL'
  | 'CASE_UPDATE'
  | 'DOCUMENT_REQUEST'
  | 'BILLING'
  | 'SCHEDULING'
  | 'LEGAL_ADVICE'
  | 'COURT_UPDATE'
  | 'SETTLEMENT'
  | 'DISCOVERY'

/**
 * Recipient information
 */
export interface Recipient {
  type: RecipientType
  id: string           // User or client ID
  email?: string       // For external recipients
  name: string
  read?: boolean
  readAt?: string
}

/**
 * Recipient types
 */
export type RecipientType = 'USER' | 'CLIENT' | 'EXTERNAL'

/**
 * Delivery status
 */
export interface DeliveryStatus {
  email?: EmailDeliveryStatus
  sms?: SmsDeliveryStatus
  inApp?: boolean
}

/**
 * Email delivery status
 */
export interface EmailDeliveryStatus {
  sent: boolean
  delivered?: boolean
  bounced?: boolean
  opened?: boolean
  clicked?: boolean
  unsubscribed?: boolean
  messageId?: string
  error?: string
}

/**
 * SMS delivery status
 */
export interface SmsDeliveryStatus {
  sent: boolean
  delivered?: boolean
  failed?: boolean
  messageId?: string
  error?: string
}

/**
 * Memo attachment
 */
export interface MemoAttachment extends AttachmentSummary {
  documentId?: string      // Link to document entity
  isInline: boolean       // Inline in content
  disposition?: string    // attachment or inline
}

/**
 * Sentiment analysis result
 */
export interface SentimentAnalysis {
  score: number          // -1 to 1
  magnitude: number      // 0 to infinity
  label: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'
  confidence: number     // 0 to 1
}

/**
 * Communication thread
 */
export interface CommunicationThread {
  id: string
  subject: string
  matterId?: string
  participants: Participant[]
  messageCount: number
  lastMessageAt: string
  lastMessageBy: UserSummary
  unreadCount: number
  tags: string[]
  isArchived: boolean
}

/**
 * Thread participant
 */
export interface Participant {
  user?: UserSummary
  client?: ClientSummary
  external?: ExternalParticipant
  joinedAt: string
  lastReadAt?: string
  unreadCount: number
}

/**
 * External participant
 */
export interface ExternalParticipant {
  email: string
  name: string
  organization?: string
}

/**
 * Client summary
 */
export interface ClientSummary {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  preferredContact: ContactMethod
}

/**
 * Contact methods
 */
export type ContactMethod = 'EMAIL' | 'PHONE' | 'SMS' | 'MAIL' | 'IN_PERSON'

/**
 * Communication template
 */
export interface CommunicationTemplate {
  id: string
  name: string
  description?: string
  type: MemoType
  category: CommunicationCategory
  subject: string
  content: string
  variables: TemplateVariable[]
  attachmentIds?: string[]
  tags: string[]
  isActive: boolean
  usageCount: number
  lastUsedAt?: string
  createdBy: UserSummary
}

/**
 * Template variable
 */
export interface TemplateVariable {
  name: string
  label: string
  type: 'text' | 'date' | 'number' | 'select'
  required: boolean
  defaultValue?: string
  options?: string[]    // For select type
  description?: string
}

/**
 * Create memo request
 */
export interface CreateMemoRequest {
  subject: string
  content: string
  type: MemoType
  priority?: MemoPriority
  matterId?: string
  clientId?: string
  recipients: CreateRecipient[]
  cc?: CreateRecipient[]
  bcc?: CreateRecipient[]
  attachmentIds?: string[]
  tags?: string[]
  category?: CommunicationCategory
  isInternal?: boolean
  isConfidential?: boolean
  requiresResponse?: boolean
  responseDeadline?: string
  scheduledSendAt?: string
  templateId?: string
  templateVariables?: Record<string, unknown>
  customFields?: Record<string, unknown>
}

/**
 * Create recipient
 */
export interface CreateRecipient {
  type: RecipientType
  id?: string        // For users/clients
  email?: string     // For external
  name?: string      // For external
}

/**
 * Update memo request
 */
export interface UpdateMemoRequest {
  subject?: string
  content?: string
  priority?: MemoPriority
  tags?: string[]
  category?: CommunicationCategory
  requiresResponse?: boolean
  responseDeadline?: string
  customFields?: Record<string, unknown>
}

/**
 * Send memo request
 */
export interface SendMemoRequest {
  sendImmediately?: boolean
  scheduledSendAt?: string
  notificationChannels?: NotificationChannel[]
}

/**
 * Notification channels
 */
export type NotificationChannel = 'EMAIL' | 'SMS' | 'IN_APP' | 'PUSH'

/**
 * Memo query parameters
 */
export interface MemoQueryParams {
  page?: number
  size?: number
  sort?: string | string[]
  search?: string                    // Search in subject, content
  matterId?: string
  clientId?: string
  authorId?: string
  type?: MemoType | MemoType[]
  status?: MemoStatus | MemoStatus[]
  priority?: MemoPriority | MemoPriority[]
  category?: CommunicationCategory | CommunicationCategory[]
  tags?: string | string[]
  dateRange?: DateRange
  hasAttachments?: boolean
  isInternal?: boolean
  requiresResponse?: boolean
  unreadOnly?: boolean
  threadId?: string
  includeDeleted?: boolean
}

/**
 * Phone call log
 */
export interface PhoneCallLog {
  id: string
  matterId?: string
  clientId?: string
  phoneNumber: string
  direction: 'INBOUND' | 'OUTBOUND'
  duration: number        // In seconds
  startTime: string
  endTime: string
  recordingUrl?: string
  transcription?: string
  summary?: string
  participants: Participant[]
  createdBy: UserSummary
  tags: string[]
}

/**
 * Create phone log request
 */
export interface CreatePhoneLogRequest {
  matterId?: string
  clientId?: string
  phoneNumber: string
  direction: 'INBOUND' | 'OUTBOUND'
  duration: number
  startTime: string
  summary: string
  participants?: string[]    // User IDs
  tags?: string[]
}

/**
 * Email integration
 */
export interface EmailAccount {
  id: string
  provider: EmailProvider
  email: string
  displayName: string
  isActive: boolean
  syncEnabled: boolean
  lastSyncAt?: string
  folders: EmailFolder[]
  createdBy: UserSummary
}

/**
 * Email providers
 */
export type EmailProvider = 'GMAIL' | 'OUTLOOK' | 'EXCHANGE' | 'IMAP'

/**
 * Email folder
 */
export interface EmailFolder {
  id: string
  name: string
  type: 'INBOX' | 'SENT' | 'DRAFTS' | 'TRASH' | 'CUSTOM'
  syncEnabled: boolean
  autoTagRules?: AutoTagRule[]
}

/**
 * Auto tag rule
 */
export interface AutoTagRule {
  id: string
  field: 'FROM' | 'TO' | 'SUBJECT' | 'BODY'
  operator: 'CONTAINS' | 'EQUALS' | 'STARTS_WITH' | 'ENDS_WITH'
  value: string
  tags: string[]
  matterId?: string
}

/**
 * Communication statistics
 */
export interface CommunicationStatistics {
  totalMemos: number
  byType: Record<MemoType, number>
  byStatus: Record<MemoStatus, number>
  sentToday: number
  sentThisWeek: number
  sentThisMonth: number
  averageResponseTime: number    // In hours
  unreadCount: number
  pendingResponses: number
  topRecipients: Array<{
    recipient: Recipient
    count: number
  }>
  topTags: Array<{
    tag: string
    count: number
  }>
}

/**
 * Type guards
 */
export function isMemo(obj: unknown): obj is Memo {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'subject' in obj &&
    'type' in obj
  )
}

export function isSent(memo: Memo): boolean {
  return ['SENT', 'DELIVERED', 'READ'].includes(memo.status)
}

export function isRead(memo: Memo): boolean {
  return memo.status === 'READ' || !!memo.readAt
}

export function requiresAction(memo: Memo): boolean {
  return memo.requiresResponse && 
         !memo.deleted && 
         (!memo.responseDeadline || new Date(memo.responseDeadline) > new Date())
}

/**
 * Format helpers
 */
export function formatMemoType(type: MemoType): string {
  const labels: Record<MemoType, string> = {
    CLIENT_MEMO: 'Client Memo',
    INTERNAL_NOTE: 'Internal Note',
    EMAIL: 'Email',
    PHONE_NOTE: 'Phone Note',
    MEETING_NOTE: 'Meeting Note',
    SMS: 'Text Message',
    LETTER: 'Letter',
    FAX: 'Fax'
  }
  
  return labels[type] || type
}

export function getRecipientDisplay(recipient: Recipient): string {
  if (recipient.type === 'EXTERNAL' && recipient.email) {
    return `${recipient.name} <${recipient.email}>`
  }
  return recipient.name
}
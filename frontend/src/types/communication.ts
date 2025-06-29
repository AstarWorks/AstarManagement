export interface Communication {
  id: string
  type: 'memo' | 'email' | 'phone' | 'meeting' | 'note' | 'document'
  subject: string
  content?: string
  summary?: string
  participants: Participant[]
  timestamp: Date
  duration?: number // for calls/meetings in seconds
  attachments?: Attachment[]
  relatedMatterId: string
  relatedMatterTitle?: string
  metadata?: Record<string, any>
  tags?: string[]
  isRead?: boolean
  isImportant?: boolean
}

export interface Participant {
  id: string
  name: string
  role: 'sender' | 'recipient' | 'attendee' | 'cc' | 'bcc'
  email?: string
  phone?: string
}

export interface Attachment {
  id: string
  name: string
  size: number
  type: string
  url: string
}

export interface TimelineGroup {
  date: string
  items: Communication[]
  count: number
}

export interface CommunicationFilters {
  types?: string[]
  dateFrom?: string
  dateTo?: string
  matterId?: string
  participantId?: string
  search?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Preset date ranges
export type FilterPreset = 'today' | 'week' | 'month' | 'all'

// Search suggestion types for enhanced search
export interface SearchSuggestion {
  id: string
  text: string
  type: 'participant' | 'matter' | 'tag' | 'keyword'
  count?: number
}

// Real-time update event types
export interface RealtimeEvent {
  type: 'communication:created' | 'communication:updated' | 'communication:deleted'
  data: Communication
  timestamp: Date
}
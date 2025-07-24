# Memo & Communication API Endpoints

The Memo API provides endpoints for client communications, internal notes, and communication tracking.

## Base URL

All memo endpoints are prefixed with: `/api/v1/memos`

## Endpoints

### List Memos

**GET** `/api/v1/memos`

Retrieves a paginated list of memos with comprehensive filtering.

#### Query Parameters

```typescript
interface MemoQueryParams {
  page?: number                    // Default: 0
  size?: number                    // Default: 20, Max: 100
  sort?: string                    // Format: "field,direction"
  search?: string                  // Search in subject, content
  matterId?: string               // Filter by matter
  clientId?: string               // Filter by client
  authorId?: string               // Filter by author
  type?: MemoType[]               // Filter by memo types
  status?: MemoStatus[]           // Filter by status
  priority?: MemoPriority[]       // Filter by priority
  category?: CommunicationCategory[]
  tags?: string[]
  dateFrom?: string               // Date range start
  dateTo?: string                 // Date range end
  hasAttachments?: boolean
  isInternal?: boolean
  requiresResponse?: boolean
  unreadOnly?: boolean
  threadId?: string
}
```

#### Response

```typescript
interface PaginatedMemoResponse {
  content: Memo[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}
```

#### Example Request

```bash
curl -X GET "http://localhost:8080/api/v1/memos?matterId=123&type=CLIENT_MEMO&unreadOnly=true" \
  -H "Authorization: Bearer <token>"
```

### Get Memo by ID

**GET** `/api/v1/memos/{id}`

Retrieves detailed information about a specific memo.

#### Path Parameters

- `id` (required): UUID of the memo

#### Response

```typescript
interface MemoDetailResponse extends Memo {
  thread: CommunicationThread
  relatedMemos: Memo[]
  readReceipts: ReadReceipt[]
  deliveryDetails: DeliveryDetails
}
```

### Create Memo

**POST** `/api/v1/memos`

Creates a new memo or communication.

#### Request Body

```typescript
interface CreateMemoRequest {
  subject: string                  // Required, 1-200 characters
  content: string                  // Required, rich text HTML
  type: MemoType                   // Required
  priority?: MemoPriority          // Default: NORMAL
  matterId?: string               // Optional matter association
  clientId?: string               // Required for client memos
  
  // Recipients
  recipients: CreateRecipient[]    // Required, at least one
  cc?: CreateRecipient[]
  bcc?: CreateRecipient[]
  
  // Attachments and metadata
  attachmentIds?: string[]         // Document IDs to attach
  tags?: string[]
  category?: CommunicationCategory
  
  // Flags
  isInternal?: boolean            // Default: false
  isConfidential?: boolean        // Default: false
  requiresResponse?: boolean      // Default: false
  responseDeadline?: string       // ISO date if response required
  
  // Scheduling
  scheduledSendAt?: string        // Send later
  
  // Templates
  templateId?: string             // Use template
  templateVariables?: Record<string, unknown>
}
```

#### Validation Rules

- `subject`: Required, 1-200 characters
- `content`: Required, max 50,000 characters
- `recipients`: At least one recipient required
- `responseDeadline`: Must be future date if provided

#### Response

```typescript
interface CreateMemoResponse {
  memo: Memo
  scheduledJob?: {
    id: string
    scheduledAt: string
  }
}
```

#### Example Request

```bash
curl -X POST "http://localhost:8080/api/v1/memos" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Case Update: Discovery Documents",
    "content": "<p>Dear Client,</p><p>Discovery documents have been filed...</p>",
    "type": "CLIENT_MEMO",
    "priority": "HIGH",
    "matterId": "456",
    "recipients": [
      {
        "type": "CLIENT",
        "id": "client-789"
      }
    ],
    "tags": ["discovery", "update"],
    "requiresResponse": true,
    "responseDeadline": "2024-05-01T00:00:00Z"
  }'
```

### Update Memo

**PUT** `/api/v1/memos/{id}`

Updates a draft memo. Cannot update sent memos.

#### Path Parameters

- `id` (required): UUID of the memo

#### Request Body

```typescript
interface UpdateMemoRequest {
  subject?: string
  content?: string
  priority?: MemoPriority
  tags?: string[]
  category?: CommunicationCategory
  requiresResponse?: boolean
  responseDeadline?: string
}
```

### Send Memo

**POST** `/api/v1/memos/{id}/send`

Sends a draft memo.

#### Request Body

```typescript
interface SendMemoRequest {
  sendImmediately?: boolean       // Default: true
  scheduledSendAt?: string        // Schedule for later
  notificationChannels?: NotificationChannel[]
}
```

### Delete Memo

**DELETE** `/api/v1/memos/{id}`

Soft deletes a memo. Only drafts can be permanently deleted.

#### Query Parameters

- `permanent`: Boolean - permanently delete draft (optional)

### Mark as Read

**POST** `/api/v1/memos/{id}/read`

Marks a memo as read by the current user.

#### Response

```typescript
interface MarkReadResponse {
  readAt: string
  readBy: UserSummary
}
```

### Reply to Memo

**POST** `/api/v1/memos/{id}/reply`

Creates a reply to an existing memo.

#### Request Body

```typescript
interface ReplyMemoRequest {
  content: string
  attachmentIds?: string[]
  includeAllRecipients?: boolean  // Reply all
  additionalRecipients?: CreateRecipient[]
}
```

### Forward Memo

**POST** `/api/v1/memos/{id}/forward`

Forwards a memo to new recipients.

#### Request Body

```typescript
interface ForwardMemoRequest {
  recipients: CreateRecipient[]
  message?: string                 // Additional message
  includeAttachments?: boolean     // Default: true
}
```

## Thread Management

### Get Thread

**GET** `/api/v1/memos/threads/{threadId}`

Gets all memos in a communication thread.

#### Response

```typescript
interface ThreadResponse {
  thread: CommunicationThread
  messages: Memo[]
  participants: Participant[]
}
```

### Archive Thread

**POST** `/api/v1/memos/threads/{threadId}/archive`

Archives an entire communication thread.

## Attachments

### Add Attachment

**POST** `/api/v1/memos/{id}/attachments`

Adds attachments to a draft memo.

#### Request

Multipart form data:

```typescript
interface AddAttachmentRequest {
  files: File[]
  documentIds?: string[]  // Existing documents
}
```

### Remove Attachment

**DELETE** `/api/v1/memos/{id}/attachments/{attachmentId}`

Removes an attachment from a draft memo.

## Templates

### List Templates

**GET** `/api/v1/memos/templates`

Lists available communication templates.

#### Query Parameters

- `type`: Filter by memo type
- `category`: Filter by category
- `search`: Search in name and content

### Create from Template

**POST** `/api/v1/memos/templates/{templateId}/create`

Creates a new memo from a template.

#### Request Body

```typescript
interface CreateFromTemplateRequest {
  variables: Record<string, unknown>
  recipients: CreateRecipient[]
  matterId?: string
  scheduledSendAt?: string
}
```

## Phone Logs

### Create Phone Log

**POST** `/api/v1/memos/phone-logs`

Records a phone call as a memo.

#### Request Body

```typescript
interface CreatePhoneLogRequest {
  matterId?: string
  clientId?: string
  phoneNumber: string
  direction: 'INBOUND' | 'OUTBOUND'
  duration: number                 // In seconds
  startTime: string
  summary: string
  participants?: string[]          // User IDs
  tags?: string[]
}
```

## Email Integration

### Import Email

**POST** `/api/v1/memos/import/email`

Imports an email as a memo.

#### Request Body

```typescript
interface ImportEmailRequest {
  messageId: string                // Email message ID
  accountId: string                // Email account ID
  matterId?: string               // Associate with matter
  tags?: string[]
}
```

### Sync Email Folder

**POST** `/api/v1/memos/sync/email`

Syncs emails from a folder.

#### Request Body

```typescript
interface SyncEmailRequest {
  accountId: string
  folderId: string
  fromDate?: string
  autoTag?: boolean
}
```

## Search

### Search Memos

**POST** `/api/v1/memos/search`

Advanced memo search with full-text capabilities.

#### Request Body

```typescript
interface MemoSearchRequest {
  query: string
  searchIn?: ('subject' | 'content' | 'attachments')[]
  filters?: {
    matterId?: string
    type?: MemoType[]
    dateRange?: DateRange
    sentiment?: ('POSITIVE' | 'NEUTRAL' | 'NEGATIVE')[]
  }
  highlightMatches?: boolean
  page?: number
  size?: number
}
```

## Analytics

### Communication Statistics

**GET** `/api/v1/memos/statistics`

Gets communication statistics and insights.

#### Query Parameters

- `matterId`: Filter by matter
- `dateFrom`: Start date
- `dateTo`: End date

#### Response

```typescript
interface CommunicationStatistics {
  totalMemos: number
  byType: Record<MemoType, number>
  byStatus: Record<MemoStatus, number>
  sentToday: number
  sentThisWeek: number
  sentThisMonth: number
  averageResponseTime: number
  unreadCount: number
  pendingResponses: number
  topRecipients: Array<{
    recipient: Recipient
    count: number
  }>
  sentimentAnalysis: {
    positive: number
    neutral: number
    negative: number
  }
}
```

## Using Memo API in Nuxt.js

### Memo Composable

```typescript
// composables/api/useMemos.ts
export const useMemos = () => {
  const { $api } = useNuxtApp()
  
  const fetchMemos = async (params?: MemoQueryParams) => {
    return await $api<PaginatedMemoResponse>('/memos', { params })
  }
  
  const getMemo = async (id: string) => {
    return await $api<MemoDetailResponse>(`/memos/${id}`)
  }
  
  const createMemo = async (data: CreateMemoRequest) => {
    return await $api<CreateMemoResponse>('/memos', {
      method: 'POST',
      body: data
    })
  }
  
  const sendMemo = async (id: string, options?: SendMemoRequest) => {
    return await $api(`/memos/${id}/send`, {
      method: 'POST',
      body: options
    })
  }
  
  const markAsRead = async (id: string) => {
    return await $api(`/memos/${id}/read`, {
      method: 'POST'
    })
  }
  
  const replyToMemo = async (id: string, data: ReplyMemoRequest) => {
    return await $api(`/memos/${id}/reply`, {
      method: 'POST',
      body: data
    })
  }
  
  return {
    fetchMemos,
    getMemo,
    createMemo,
    sendMemo,
    markAsRead,
    replyToMemo
  }
}
```

### Memo List Component

```vue
<script setup lang="ts">
const { fetchMemos, markAsRead } = useMemos()

const { data: memos, refresh } = await useAsyncData(
  'memos',
  () => fetchMemos({ 
    unreadOnly: true,
    type: ['CLIENT_MEMO', 'EMAIL']
  })
)

const handleRead = async (memo: Memo) => {
  if (!memo.readAt) {
    await markAsRead(memo.id)
    await refresh()
  }
}
</script>

<template>
  <div class="memo-list">
    <div 
      v-for="memo in memos?.content" 
      :key="memo.id"
      :class="{ 'unread': !memo.readAt }"
      @click="handleRead(memo)"
    >
      <h3>{{ memo.subject }}</h3>
      <p>{{ memo.author.name }} - {{ formatDate(memo.createdAt) }}</p>
    </div>
  </div>
</template>
```

### Rich Text Editor Integration

```vue
<script setup lang="ts">
import { Editor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'

const editor = new Editor({
  extensions: [StarterKit],
  content: '<p>Start typing your memo...</p>'
})

const createAndSendMemo = async () => {
  const memoData: CreateMemoRequest = {
    subject: subject.value,
    content: editor.getHTML(),
    type: 'CLIENT_MEMO',
    recipients: selectedRecipients.value,
    matterId: currentMatterId.value
  }
  
  const { memo } = await createMemo(memoData)
  await sendMemo(memo.id)
}
</script>
```

## Error Handling

### 400 Bad Request

```json
{
  "error": {
    "code": "INVALID_RECIPIENT",
    "message": "Recipient not found or invalid",
    "details": [
      {
        "field": "recipients[0].id",
        "message": "Client ID does not exist"
      }
    ]
  }
}
```

### 409 Conflict

```json
{
  "error": {
    "code": "MEMO_ALREADY_SENT",
    "message": "Cannot modify a memo that has already been sent"
  }
}
```

### 422 Unprocessable Entity

```json
{
  "error": {
    "code": "DELIVERY_FAILED",
    "message": "Failed to deliver memo",
    "details": {
      "email": "Recipient email bounced",
      "sms": "Invalid phone number"
    }
  }
}
```
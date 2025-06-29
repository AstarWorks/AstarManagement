# T04_S13: Memo List and Search
**Task ID**: T04_S13_Memo_List_Search  
**Sprint**: S13_M01_Communication_Documents_UI  
**Priority**: High  
**Complexity**: Medium (15-20 hours)

## Description
Implement a comprehensive memo listing interface with advanced filtering, search capabilities, and bulk operations. The interface should provide both list and grid view options, support advanced search with field-specific filters, enable bulk operations on selected memos, and include export functionality for legal reporting.

## Success Criteria
- [ ] Dual view options (list/grid) with responsive design
- [ ] Advanced search with field-specific filtering (recipient, date, status)
- [ ] Real-time search suggestions with debouncing
- [ ] Bulk operations (mark as read, archive, delete) with confirmation
- [ ] Export functionality supporting CSV and PDF formats
- [ ] Filter persistence with localStorage
- [ ] Keyboard navigation and accessibility compliance
- [ ] Performance: Search results < 300ms, bulk operations < 500ms

## Technical Requirements

### Component Architecture
```
components/memo/
├── MemoList.vue              # Main list container with TanStack Query
├── MemoCard.vue              # Individual memo card (grid view)
├── MemoListItem.vue          # Individual memo row (list view)
├── MemoFilters.vue           # Advanced filter sidebar
├── MemoSearchBar.vue         # Search with suggestions
├── MemoBulkActions.vue       # Bulk operation toolbar
├── MemoExportDialog.vue      # Export options dialog
└── MemoEmptyState.vue        # Empty state component
```

### Data Models
```typescript
interface Memo {
  id: string
  caseId: string
  caseNumber: string
  recipient: {
    id: string
    name: string
    type: 'client' | 'court' | 'opposing_counsel' | 'internal'
  }
  subject: string
  content: string
  status: 'draft' | 'sent' | 'read' | 'archived'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  sentAt?: string
  readAt?: string
  createdBy: {
    id: string
    name: string
  }
  tags: string[]
  attachments: Attachment[]
}

interface MemoFilters {
  search?: string
  status?: MemoStatus[]
  recipient?: string[]
  recipientType?: string[]
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

interface BulkOperation {
  type: 'mark_read' | 'mark_unread' | 'archive' | 'unarchive' | 'delete'
  memoIds: string[]
  confirmationRequired: boolean
}
```

## Implementation Steps

### 1. Core List Component
Create the main list container with view toggle:

```vue
<!-- MemoList.vue -->
<script setup lang="ts">
import { useMemosQuery, useBulkMemoMutation } from '~/composables/useMemoQueries'
import { useFilterPersistence } from '~/composables/useFilterPersistence'
import { useListViewPreference } from '~/composables/useListViewPreference'

const props = defineProps<{
  caseId?: string
  defaultView?: 'list' | 'grid'
}>()

// View preference
const { viewMode, toggleViewMode } = useListViewPreference('memo-view', props.defaultView)

// Filter persistence
const { currentFilters, updateFilters } = useFilterPersistence('memo-filters')

// Main query with filters
const { data, isLoading, error } = useMemosQuery(currentFilters)

// Selection state
const selectedMemos = ref<Set<string>>(new Set())
const isAllSelected = computed(() => 
  data.value?.data.length > 0 && 
  data.value.data.every(memo => selectedMemos.value.has(memo.id))
)

// Bulk operations
const { mutate: performBulkOperation } = useBulkMemoMutation()
</script>
```

### 2. Advanced Search Component
Implement search with field-specific syntax and suggestions:

```vue
<!-- MemoSearchBar.vue -->
<script setup lang="ts">
import { useMemoSearchSuggestions } from '~/composables/useMemoSearch'
import { useAdvancedSearch } from '~/composables/useAdvancedSearch'

const {
  searchQuery,
  suggestions,
  searchMode,
  performSearch,
  selectSuggestion
} = useAdvancedSearch({
  searchFields: ['subject', 'content', 'recipient', 'tags'],
  operators: [':', '=', '>', '<', '>=', '<='],
  examples: [
    'recipient:john.doe@example.com',
    'status:sent date:>2024-01-01',
    'tag:urgent priority:high'
  ]
})

// Field-specific search helpers
const searchHelpers = [
  { field: 'recipient', operator: ':', example: 'recipient:client_name' },
  { field: 'status', operator: ':', example: 'status:sent' },
  { field: 'date', operator: '>', example: 'date:>2024-01-01' },
  { field: 'tag', operator: ':', example: 'tag:important' }
]
</script>
```

### 3. Filter Component with Persistence
Reuse patterns from Kanban FilterBar:

```vue
<!-- MemoFilters.vue -->
<script setup lang="ts">
// Reuse filter patterns from FilterBar.vue
const priorityOptions = [
  { value: 'low', label: 'Low', colorClass: 'bg-green-500' },
  { value: 'medium', label: 'Medium', colorClass: 'bg-yellow-500' },
  { value: 'high', label: 'High', colorClass: 'bg-orange-500' },
  { value: 'urgent', label: 'Urgent', colorClass: 'bg-red-500' }
]

const statusOptions = [
  { value: 'draft', label: 'Draft', icon: FileEdit },
  { value: 'sent', label: 'Sent', icon: Send },
  { value: 'read', label: 'Read', icon: CheckCheck },
  { value: 'archived', label: 'Archived', icon: Archive }
]

// Date range picker
const dateRange = ref<{ start: Date; end: Date } | null>(null)

// Saved filter presets
const { presets, savePreset, loadPreset } = useFilterPresets('memo-filters')
</script>
```

### 4. Bulk Operations Component
Implement bulk actions with confirmation:

```vue
<!-- MemoBulkActions.vue -->
<script setup lang="ts">
const bulkActions = [
  { 
    id: 'mark_read', 
    label: 'Mark as Read', 
    icon: CheckCheck,
    variant: 'default' as const,
    requiresConfirmation: false
  },
  { 
    id: 'archive', 
    label: 'Archive', 
    icon: Archive,
    variant: 'secondary' as const,
    requiresConfirmation: true
  },
  { 
    id: 'delete', 
    label: 'Delete', 
    icon: Trash2,
    variant: 'destructive' as const,
    requiresConfirmation: true
  }
]

const showConfirmDialog = ref(false)
const pendingAction = ref<BulkOperation | null>(null)

const handleBulkAction = async (action: typeof bulkActions[0]) => {
  if (action.requiresConfirmation) {
    pendingAction.value = {
      type: action.id as BulkOperation['type'],
      memoIds: Array.from(selectedMemos.value),
      confirmationRequired: true
    }
    showConfirmDialog.value = true
  } else {
    await executeBulkAction(action.id)
  }
}
</script>
```

### 5. Export Functionality
Create export utilities supporting multiple formats:

```typescript
// composables/useMemoExport.ts
export function useMemoExport() {
  const generateCSV = (memos: Memo[]): string => {
    const headers = ['Date', 'Case Number', 'Recipient', 'Subject', 'Status', 'Priority']
    const rows = memos.map(memo => [
      format(new Date(memo.sentAt || memo.createdAt), 'yyyy-MM-dd HH:mm'),
      memo.caseNumber,
      memo.recipient.name,
      memo.subject,
      memo.status,
      memo.priority
    ])
    
    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
  }

  const generatePDF = async (memos: Memo[]): Promise<Blob> => {
    // Use jsPDF or similar library
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    
    // Add header
    doc.setFontSize(16)
    doc.text('Memo Report', 20, 20)
    
    // Add memo list
    let y = 40
    memos.forEach(memo => {
      doc.setFontSize(12)
      doc.text(`${memo.subject}`, 20, y)
      doc.setFontSize(10)
      doc.text(`To: ${memo.recipient.name} | Status: ${memo.status}`, 20, y + 5)
      y += 15
    })
    
    return doc.output('blob')
  }

  const downloadFile = (content: string | Blob, filename: string) => {
    const blob = typeof content === 'string' 
      ? new Blob([content], { type: 'text/csv' })
      : content
      
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  return {
    generateCSV,
    generatePDF,
    downloadFile
  }
}
```

### 6. TanStack Query Integration
Create query hooks following existing patterns:

```typescript
// composables/useMemoQueries.ts
export function useMemosQuery(
  filters?: MaybeRef<MemoFilters>,
  options?: UseQueryOptions<PaginatedResponse<Memo>, QueryError>
) {
  return useQuery({
    queryKey: ['memos', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      // Build query params from filters
      const filterValues = unref(filters)
      if (filterValues?.search) params.append('search', filterValues.search)
      // ... other filters
      
      return await $fetch(`/api/memos?${params}`)
    },
    staleTime: 30000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
    ...options
  })
}

export function useBulkMemoMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (operation: BulkOperation) => {
      return await $fetch('/api/memos/bulk', {
        method: 'POST',
        body: operation
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['memos'])
      queryClient.invalidateQueries(['memo-counts'])
    }
  })
}
```

## API Endpoints

### Required Endpoints
```typescript
// GET /api/memos
interface MemosResponse {
  data: Memo[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// GET /api/memos/search/suggestions
interface SuggestionsResponse {
  suggestions: Array<{
    id: string
    type: 'recipient' | 'tag' | 'case' | 'subject'
    value: string
    count: number
  }>
}

// POST /api/memos/bulk
interface BulkOperationRequest {
  operation: BulkOperation
}

// POST /api/memos/export
interface ExportRequest {
  format: 'csv' | 'pdf'
  filters: MemoFilters
  memoIds?: string[]
}
```

## Performance Optimizations

1. **Virtual Scrolling**: Use `@tanstack/vue-virtual` for large lists
2. **Search Debouncing**: 300ms debounce on search input
3. **Lazy Loading**: Load attachments and full content on demand
4. **Query Caching**: Cache search results for 30 seconds
5. **Batch Operations**: Process bulk operations in batches of 50

## Testing Requirements

1. **Unit Tests**:
   - Filter logic with complex queries
   - Bulk operation confirmation flow
   - Export format generation
   - Search suggestion parsing

2. **Integration Tests**:
   - Filter persistence across sessions
   - Bulk operations with error handling
   - Export with large datasets
   - Real-time updates during list operations

3. **E2E Tests**:
   - Complete search and filter workflow
   - Bulk selection and operation execution
   - Export and download verification
   - Keyboard navigation

## Accessibility Requirements

- ARIA labels for all interactive elements
- Keyboard shortcuts (Ctrl+A for select all, Delete for bulk delete)
- Screen reader announcements for bulk operations
- Focus management during dialog interactions
- High contrast mode support

## Related Components
- Reuse `FilterBar.vue` patterns for advanced filtering
- Adapt `KanbanBoard.vue` drag-drop for reordering (future enhancement)
- Use `useFilterPersistence` for filter state management
- Apply `useAdvancedSearch` for search functionality

## Dependencies
- `@tanstack/vue-query`: Data fetching and caching
- `@vueuse/core`: Utilities for persistence and reactivity
- `date-fns`: Date formatting and manipulation
- `jspdf`: PDF generation (optional, can use server-side)
- `papaparse`: Advanced CSV parsing (optional)

## Future Enhancements
- Saved search filters with sharing
- Email integration for sending memos
- Template-based memo creation
- Real-time collaboration on drafts
- Advanced analytics dashboard
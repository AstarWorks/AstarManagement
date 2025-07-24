# Matter Data Table Components

This directory contains a comprehensive set of components for displaying matter data in a table format with advanced features like sorting, pagination, loading states, and error handling.

## Components Overview

### DataTable.vue
The main data table component with generic TypeScript support for displaying any type of data.

**Features:**
- Generic TypeScript support (`TData`)
- Column-based configuration with custom formatting
- Bidirectional sorting with visual indicators
- Built-in pagination integration
- Loading and error states
- Mobile responsive design
- Accessibility compliance (ARIA labels, semantic HTML)
- Empty state handling

### DataTablePagination.vue
A comprehensive pagination component with page size selection and smart page range display.

**Features:**
- Page navigation with ellipsis for large page counts
- Configurable page size selector
- Result range display
- Disabled state support
- Mobile responsive layout
- Keyboard accessible navigation

### DataTableSkeleton.vue
Loading skeleton for the data table with proper animations and responsive design.

**Features:**
- Configurable rows and columns
- Shimmer animation effect
- Pagination skeleton
- Respects reduced motion preferences
- Matches table structure exactly

### DataTableError.vue
Error boundary component with user-friendly error messages and retry functionality.

**Features:**
- User-friendly error message mapping
- Retry functionality
- Developer details in development mode
- Multiple display variants (inline, compact)
- Accessibility compliant error presentation

### MatterListView.vue
Complete matter list implementation that combines all the above components.

**Features:**
- TanStack Query integration
- Server-side sorting and pagination
- Search and filtering support
- Mobile responsive column selection
- Real-time data updates
- Optimistic updates

## Usage Examples

### Basic DataTable

```vue
<template>
  <DataTable
    :columns="columns"
    :data="matters"
    :loading="isLoading"
    :error="error"
    @sort="handleSort"
  />
</template>

<script setup lang="ts">
import type { Matter } from '~/types/matter'
import type { DataTableColumn } from '~/components/matter/DataTable.vue'

const columns: DataTableColumn<Matter>[] = [
  {
    key: 'caseNumber',
    header: 'Case #',
    sortable: true,
    width: '120px'
  },
  {
    key: 'title',
    header: 'Title',
    sortable: true,
    formatter: (value: string) => value.length > 50 ? `${value.substring(0, 50)}...` : value
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    formatter: (value: string) => value.replace('_', ' ').toUpperCase()
  }
]

const handleSort = (column: string, direction: 'asc' | 'desc') => {
  // Handle sorting logic
}
</script>
```

### DataTable with Pagination

```vue
<template>
  <DataTable
    :columns="columns"
    :data="data?.data || []"
    :page="page"
    :page-size="pageSize"
    :total="data?.total || 0"
    :show-pagination="true"
    @sort="handleSort"
    @page-change="page = $event"
    @page-size-change="pageSize = $event"
  />
</template>

<script setup lang="ts">
const page = ref(1)
const pageSize = ref(25)

// TanStack Query integration
const { data, isPending, error } = useMattersQuery({
  page,
  pageSize,
  sortBy: 'createdAt',
  sortDirection: 'desc'
})
</script>
```

### Complete Matter List Implementation

```vue
<template>
  <MatterListView
    :status="selectedStatus"
    :search="searchQuery"
    :assignee-id="selectedAssignee"
  />
</template>

<script setup lang="ts">
const selectedStatus = ref<MatterStatus | 'all'>('all')
const searchQuery = ref('')
const selectedAssignee = ref<string>()
</script>
```

## Column Configuration

### DataTableColumn Interface

```typescript
interface DataTableColumn<T = any> {
  key: keyof T | string          // Property key or dot notation path
  header: string                 // Display header text
  sortable?: boolean            // Enable sorting for this column
  formatter?: (value: any, row: T) => string  // Custom value formatter
  width?: string                // CSS width value
  align?: 'left' | 'center' | 'right'  // Text alignment
  className?: string            // Additional CSS classes
}
```

### Column Examples

```typescript
// Basic column
{
  key: 'title',
  header: 'Matter Title',
  sortable: true
}

// Column with formatter
{
  key: 'status',
  header: 'Status',
  sortable: true,
  formatter: (value: MatterStatus) => {
    const statusMap = {
      'in_progress': 'In Progress',
      'under_review': 'Under Review'
    }
    return statusMap[value] || value
  }
}

// Column with styling
{
  key: 'priority',
  header: 'Priority',
  width: '100px',
  align: 'center',
  className: 'font-semibold',
  formatter: (value: string) => value.toUpperCase()
}

// Nested property access
{
  key: 'client.name',
  header: 'Client Name',
  formatter: (value: string) => value || 'No Client'
}

// Complex formatting with row context
{
  key: 'dueDate',
  header: 'Due Date',
  formatter: (value: string, row: Matter) => {
    if (!value) return '-'
    const date = new Date(value)
    const isOverdue = date < new Date() && row.status !== 'complete'
    return isOverdue 
      ? `⚠️ ${date.toLocaleDateString()}`
      : date.toLocaleDateString()
  }
}
```

## TanStack Query Integration

### Query Parameters

```typescript
interface MatterQueryParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  search?: string
  status?: MatterStatus | 'all'
  assigneeId?: string
  clientId?: string
}
```

### Usage with useMattersQuery

```typescript
const queryParams = computed(() => ({
  page: page.value,
  pageSize: pageSize.value,
  sortBy: sortBy.value,
  sortDirection: sortDirection.value,
  search: searchQuery.value,
  status: selectedStatus.value !== 'all' ? selectedStatus.value : undefined
}))

const { data, isPending, error, refetch } = useMattersQuery(queryParams)
```

## Responsive Design

### Mobile Adaptations

The components automatically adapt to mobile screens:

- **Table**: Horizontal scroll with touch-friendly controls
- **Pagination**: Stacked layout on small screens
- **Columns**: Reduced column set for mobile (configurable)
- **Loading**: Consistent skeleton structure

### Column Selection for Mobile

```typescript
const mobileColumns = computed(() => {
  if (isMobile.value) {
    return columns.filter(col => 
      ['caseNumber', 'title', 'status'].includes(String(col.key))
    )
  }
  return columns
})
```

## Accessibility Features

- **Semantic HTML**: Proper table structure with thead/tbody
- **ARIA Labels**: Screen reader support for interactive elements
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Proper focus indicators
- **Screen Reader**: Announcements for state changes
- **High Contrast**: Support for high contrast mode
- **Reduced Motion**: Respects user motion preferences

## Error Handling

### Error Message Mapping

The DataTableError component automatically maps common HTTP errors to user-friendly messages:

- **Network errors**: "Network error. Please check your connection and try again."
- **401 Unauthorized**: "You are not authorized to view this data. Please log in again."
- **403 Forbidden**: "You do not have permission to access this data."
- **404 Not Found**: "The requested data could not be found."
- **500 Server Error**: "Server error. Please try again later."

### Custom Error Handling

```vue
<template>
  <DataTableError
    :error="error"
    @retry="refetch"
  />
</template>
```

## Performance Optimizations

- **Virtual Scrolling**: For large datasets (planned)
- **Memoization**: Column definitions and computed values
- **Debounced Search**: Prevents excessive API calls
- **Prefetching**: Adjacent pages for smooth navigation
- **Optimistic Updates**: Immediate UI feedback
- **Bundle Splitting**: Lazy loading for large components

## Testing

The components include comprehensive test suites covering:

- **Unit Tests**: Component logic and interactions
- **Integration Tests**: Component communication
- **Accessibility Tests**: ARIA compliance and keyboard navigation
- **Visual Tests**: Storybook visual regression testing
- **Performance Tests**: Bundle size and render performance

### Running Tests

```bash
# Unit tests
bun test DataTable.test.ts
bun test DataTablePagination.test.ts

# Component tests with UI
bun test:ui

# Storybook tests
bun test-storybook
```

## Best Practices

1. **Type Safety**: Always use proper TypeScript types for data and columns
2. **Performance**: Memoize column definitions and avoid inline functions
3. **Accessibility**: Test with screen readers and keyboard navigation
4. **Error Handling**: Provide meaningful error messages and retry options
5. **Mobile**: Test responsive behavior on various screen sizes
6. **Loading States**: Always show appropriate loading indicators
7. **Empty States**: Provide helpful empty state messages

## Future Enhancements

- **Virtual Scrolling**: For handling very large datasets
- **Column Resizing**: Drag to resize column widths
- **Column Reordering**: Drag and drop column reordering
- **Advanced Filtering**: Multi-column filtering with operators
- **Export Functionality**: CSV/Excel export integration
- **Row Selection**: Checkbox selection with bulk operations
- **Inline Editing**: Edit cells directly in the table
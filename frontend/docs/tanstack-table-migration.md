# TanStack Table v8 Migration Guide

## Overview

This document describes the migration from the previous table implementation to TanStack Table v8 for the Astar Management system. The migration provides better performance, more features, and improved type safety.

## Migration Summary

### Components Migrated

1. **DataTable** - Core table component with sorting, filtering, and selection
2. **DataTablePagination** - Pagination controls with page size options
3. **ColumnVisibilityDropdown** - Column visibility toggle interface

### Key Improvements

- **Performance**: Virtual scrolling support for large datasets (10,000+ rows)
- **Type Safety**: Full TypeScript support with proper type inference
- **Features**: Built-in sorting, filtering, pagination, and column management
- **Flexibility**: Composable architecture allowing custom cell renderers

## Implementation Details

### DataTable Component

The main table component provides:

```typescript
interface DataTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData>[]
  enableSorting?: boolean
  enableFiltering?: boolean
  enableRowSelection?: boolean
  enableColumnVisibility?: boolean
  enableVirtualization?: boolean
  loading?: boolean
  striped?: boolean
  compact?: boolean
}
```

#### Features

- **Sorting**: Click column headers to sort (ascending/descending/none)
- **Filtering**: Global and column-specific filtering
- **Selection**: Row selection with checkbox support
- **Virtual Scrolling**: Efficient rendering of large datasets
- **Custom Rendering**: Support for custom cell components

### DataTablePagination Component

Pagination controls with:

- Page navigation (previous/next, direct page selection)
- Page size selection
- Display of current page information
- Support for "Show All" option

### ColumnVisibilityDropdown Component

Column management interface featuring:

- Toggle individual column visibility
- Show/Hide all columns
- Search functionality for many columns
- Group columns by category
- Display visible column count

## Usage Examples

### Basic Table

```vue
<template>
  <DataTable 
    :data="users" 
    :columns="columns" 
  />
</template>

<script setup lang="ts">
import { DataTable } from '~/components/ui/data-table'
import type { ColumnDef } from '@tanstack/vue-table'

interface User {
  id: string
  name: string
  email: string
}

const users = ref<User[]>([
  { id: '1', name: 'John Doe', email: 'john@example.com' },
  // ... more data
])

const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: 'Name'
  },
  {
    accessorKey: 'email',
    header: 'Email'
  }
]
</script>
```

### Table with All Features

```vue
<template>
  <div>
    <!-- Search -->
    <input 
      v-model="globalFilter" 
      placeholder="Search..."
      class="mb-4"
    />
    
    <!-- Column Visibility -->
    <ColumnVisibilityDropdown 
      :table="table" 
      class="mb-4"
    />
    
    <!-- Table -->
    <DataTable 
      :data="filteredData" 
      :columns="columns"
      :global-filter="globalFilter"
      enable-sorting
      enable-row-selection
      @table-instance="setTableInstance"
    />
    
    <!-- Pagination -->
    <DataTablePagination 
      :table="table"
      :page-size-options="[10, 25, 50]"
      show-all-option
    />
  </div>
</template>
```

### Virtual Scrolling for Large Datasets

```vue
<template>
  <DataTable 
    :data="largeDataset" 
    :columns="columns"
    enable-virtualization
    :virtual-item-height="40"
    :overscan="5"
    style="height: 600px"
  />
</template>

<script setup>
// Generate 10,000 rows
const largeDataset = generateLargeDataset(10000)
</script>
```

## Testing

The migration includes comprehensive test coverage:

### Unit Tests

- **DataTable.test.ts**: Core table functionality
- **DataTablePagination.test.ts**: Pagination controls
- **ColumnVisibilityDropdown.test.ts**: Column management

### Integration Tests

- **TableFilterPagination.test.ts**: Filter and pagination interaction

### Performance Tests

- **VirtualScrolling.test.ts**: Large dataset handling

Run tests with:

```bash
bun run test
```

## Storybook Documentation

Interactive documentation is available in Storybook:

```bash
bun run storybook
```

Stories include:

- Basic usage examples
- Feature demonstrations
- Edge cases
- Interactive playgrounds

## Migration Checklist

When migrating existing tables:

1. **Update imports**:
   ```typescript
   import { DataTable } from '~/components/ui/data-table'
   ```

2. **Convert column definitions**:
   ```typescript
   // Old format
   const columns = [
     { key: 'name', label: 'Name' }
   ]
   
   // New format
   const columns: ColumnDef<YourType>[] = [
     { accessorKey: 'name', header: 'Name' }
   ]
   ```

3. **Update props**:
   - `rows` → `data`
   - `showPagination` → Add `<DataTablePagination>` component
   - `onSort` → Built-in sorting with `enableSorting`

4. **Add type safety**:
   ```typescript
   const columns: ColumnDef<YourDataType>[] = [...]
   ```

## Performance Considerations

### Virtual Scrolling

Enable for datasets > 1000 rows:

```vue
<DataTable 
  enable-virtualization
  :virtual-item-height="40"
/>
```

### Memoization

For expensive cell calculations:

```typescript
const columns: ColumnDef<Data>[] = [
  {
    accessorKey: 'value',
    cell: ({ row }) => useMemo(
      () => expensiveCalculation(row.original),
      [row.original]
    )
  }
]
```

### Debounced Filtering

For real-time search:

```typescript
const debouncedFilter = useDebounceFn((value: string) => {
  globalFilter.value = value
}, 300)
```

## Troubleshooting

### Common Issues

1. **Types not working**: Ensure `@tanstack/vue-table` is installed
2. **Columns not showing**: Check column `accessorKey` matches data properties
3. **Performance issues**: Enable virtual scrolling for large datasets
4. **Sorting not working**: Set `enableSorting: true` on columns

### Debug Mode

Enable debug logging:

```typescript
const table = useVueTable({
  data,
  columns,
  debugAll: true // or debugTable, debugHeaders, debugColumns
})
```

## Future Enhancements

Planned improvements:

1. **Row Expansion**: Expandable rows for detail views
2. **Column Resizing**: Drag to resize columns
3. **Export Functionality**: Export to CSV/Excel
4. **Advanced Filters**: Date ranges, multi-select
5. **Keyboard Navigation**: Full keyboard support

## Resources

- [TanStack Table Documentation](https://tanstack.com/table/v8)
- [Vue Examples](https://tanstack.com/table/v8/docs/examples/vue)
- [API Reference](https://tanstack.com/table/v8/docs/api)
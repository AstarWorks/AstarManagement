# Requirement: R04 - Matter List Screen

## Overview
Implement a comprehensive matter list screen that provides an office-wide overview of all legal matters, with advanced filtering, sorting, and pagination capabilities. This screen serves as the primary entry point for lawyers and clerks to manage their caseload.

## Detailed Requirements

### 1. Display Configuration

#### 1.1 Table Columns
The matter list shall display the following columns with sorting capability:

| Column | Type | Sortable | Description |
|--------|------|----------|-------------|
| Matter ID | String | Yes | Auto-numbered (e.g., 2025-001) |
| Matter Name | String | Yes | Clickable link to matter details |
| Client Name | String | Yes | Individual or company name |
| Matter Type | Enum | Yes | Civil/Criminal/Family/Corporate with color-coded tags |
| Assigned Lawyer | String | Yes | Multiple lawyers supported |
| Retention Date | Date | Yes | YYYY/MM/DD format |
| Next Deadline | DateTime | Yes | Color-coded by urgency |
| Status | Enum | Yes | Current matter status with color coding |
| Last Updated | DateTime | Yes | Relative time display |

#### 1.2 Deadline Color Coding
- **Red**: Overdue or within 24 hours
- **Yellow**: Within 3 days
- **Green**: Within 1 week
- **No color**: Later than 1 week or no deadline set

### 2. Viewing Modes

#### 2.1 Pagination Mode
- Default display: 30 items per page
- URL pattern: `/matters?view=pagination&page=1&per_page=30`
- Page navigation controls at bottom

#### 2.2 Infinite Scroll Mode
- Continuous loading as user scrolls
- URL pattern: `/matters?view=infinite&offset=0`
- Loading indicator at bottom during fetch

#### 2.3 Mobile View
Simplified card layout for mobile devices:
```
┌─────────────────────────────┐
│ [Matter ID] Matter Name     │
│ Client: ○○○○               │
│ Lawyer: △△ Attorney        │
│ Next Deadline: MM/DD ⚠️     │
└─────────────────────────────┘
```

### 3. Filtering and Search

#### 3.1 Filter Options
```typescript
interface MatterFilters {
  status?: 'consultation' | 'retained' | 'in_progress' | 'closed' | 'all'
  lawyerId?: string[]  // Multiple selection allowed
  matterType?: 'civil' | 'criminal' | 'family' | 'corporate' | 'other'
  dateRange?: {
    start: Date
    end: Date
    field: 'retentionDate' | 'nextDeadline' | 'lastUpdated'
  }
  hasDeadline?: boolean  // Show only matters with deadlines
}
```

#### 3.2 Search Functionality
- Full-text search across matter name, client name, and matter ID
- Natural language search with AI support (future enhancement)
- Real-time search suggestions

### 4. Action Features

#### 4.1 Action Bar
```
[+ New Matter] [Export ▼] [View Settings ⚙️] [Search____] [Filter ▼]
```

#### 4.2 Row Actions
Each row shall include quick action buttons:
- 👁️ View details
- ✏️ Edit
- 📋 Duplicate
- 🗓️ Add deadline to calendar

#### 4.3 Bulk Operations
- Checkbox selection for multiple matters
- Bulk status update
- Bulk lawyer assignment
- Bulk export

### 5. Summary Display
Display summary statistics above the table:
```
Total: 156 | In Progress: 89 | This Week's Deadlines: 12 | Urgent: 3
```

### 6. Export Functionality

#### 6.1 Supported Formats
- CSV export with all visible columns
- PDF export with formatting preserved
- Excel export with filters applied

#### 6.2 Export Options
- Current page only
- All filtered results
- Custom column selection

### 7. Performance Requirements

- Initial page load: < 2 seconds
- Pagination/scroll load: < 500ms
- Filter application: < 300ms
- Search results: < 500ms
- Maximum matters supported: 10,000+

### 8. URL Structure
All filter and view states must be preserved in URL for bookmarking:
```
/matters?view=pagination&page=2&sort=deadline&order=asc&status=active&lawyer=123
```

### 9. Authorization

- **Lawyers**: View all matters
- **Clerks**: View all matters
- **Clients**: No access to this screen (separate client portal required)

### 10. Responsive Design

- Desktop: Full table view with all columns
- Tablet: Reduced columns with horizontal scroll
- Mobile: Card-based layout with essential information

## Implementation Notes

1. Use virtual scrolling for performance with large datasets
2. Implement debounced search to reduce API calls
3. Cache filter results for quick switching
4. Use optimistic UI updates for better perceived performance
5. Implement keyboard shortcuts:
   - `j/k` for navigation
   - `Enter` to view details
   - `/` to focus search

## Testing Requirements

- Test with 10,000+ matters for performance
- Verify all sort combinations work correctly
- Test filter persistence across page refreshes
- Verify mobile responsiveness at all breakpoints
- Test export functionality with large datasets
- Verify accessibility with screen readers
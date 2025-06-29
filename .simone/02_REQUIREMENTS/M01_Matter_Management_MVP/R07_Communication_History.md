# Requirement: R07 - Communication History

## Overview
Implement a comprehensive communication history system that tracks all interactions related to a legal matter, including emails, FAX, phone calls, LINE messages, and in-person meetings. The system must support manual entry, external imports, and provide powerful filtering and search capabilities.

## Detailed Requirements

### 1. Data Model

#### 1.1 Communication Record Structure
```typescript
interface CommunicationRecord {
  id: string
  matterId: string
  date: Date
  type: 'email' | 'fax' | 'line' | 'phone' | 'meeting' | 'other'
  party: {
    name: string
    type: 'client' | 'opponent' | 'court' | 'related' | 'other'
    contact?: string  // Email address or phone number
  }
  handler: {
    id: string
    name: string
    role: 'lawyer' | 'clerk'
  }
  summary: string
  detail?: string
  attachments?: {
    id: string
    name: string
    type: string
    size: number
  }[]
  metadata?: {
    emailMessageId?: string    // For email integration
    phoneCallDuration?: number // Call duration (seconds)
    faxPages?: number         // FAX page count
  }
}
```

### 2. Display Interface

#### 2.1 Table Layout
```
┌────────────┬────────┬──────────────┬────────┬─────────────┬─────┬──────┐
│ Date/Time  │ Type   │ Party        │ Handler│ Summary     │Att. │Action│
├────────────┼────────┼──────────────┼────────┼─────────────┼─────┼──────┤
│2025/01/15  │📧Email │John Doe      │Smith   │Regarding    │ 📎2 │[📋][📅][📄]│
│14:30       │        │(Client)      │Lawyer  │next hearing │     │      │
└────────────┴────────┴──────────────┴────────┴─────────────┴─────┴──────┘
```

#### 2.2 Communication Type Icons
- 📧 Email
- 📠 FAX
- 📱 Phone
- 💬 LINE
- 🤝 Meeting
- 📄 Other

### 3. Filtering System

#### 3.1 Filter UI
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Search [_______________]  Period [Start] ~ [End]         │
│                                                             │
│ Method: ☑Email ☑FAX ☑LINE ☑Phone ☑Meeting ☑Other          │
│ Party: ☑Client ☑Opponent ☑Court ☑Related ☑Other           │
│                                                             │
│ [Clear Filters]                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 3.2 Filter Capabilities
- Full-text search across summary and details
- Date range filtering
- Multiple communication type selection
- Multiple party type selection
- Handler filtering
- Attachment presence filter

### 4. Record Creation

#### 4.1 Manual Entry Modal
Fields required:
- Date/Time (defaults to now)
- Communication method (required)
- Party name and type (required)
- Handler (defaults to current user)
- Summary (required, max 200 chars)
- Details (optional, rich text)
- Attachments (drag-and-drop support)

#### 4.2 Quick Entry
- Keyboard shortcut (Ctrl+N) for new record
- Recent parties dropdown for quick selection
- Template support for common communications

### 5. Import Functionality

#### 5.1 Supported Import Formats
- **CSV**: With provided template
- **Email**: .eml file format
- **Bulk Import**: Multiple files via drag-and-drop

#### 5.2 Import Processing
- Preview before import
- Field mapping interface
- Duplicate detection
- Error handling with detailed reports

### 6. Action Buttons

#### 6.1 Per-Record Actions
- 📋 Create task from communication
- 📅 Add follow-up to calendar  
- 📄 Generate document from template

Note: In MVP, these buttons are visible but non-functional

### 7. Notification System

#### 7.1 New Communication Alerts
```typescript
interface CommunicationNotification {
  type: 'new_communication'
  matterId: string
  matterName: string
  communicationType: string
  party: string
  summary: string
  timestamp: Date
}
```

#### 7.2 Notification Delivery
- Browser push notifications (with permission)
- In-app notification badge
- Email digest (configurable)

### 8. Integration Points

#### 8.1 FAX Integration
- FAX records automatically appear in communication history
- Link to full FAX document in FAX tab
- FAX-specific metadata displayed

#### 8.2 Future Integrations (Post-MVP)
- Email server integration (IMAP/Exchange)
- Phone system integration (call logs)
- Calendar integration (meeting records)

### 9. Performance Requirements

- List loading: < 500ms for 100 records
- Search results: < 300ms
- Filter application: < 200ms
- Import processing: < 10 seconds for 1000 records

### 10. Data Management

#### 10.1 Pagination
- Default: 50 records per page
- Options: 25, 50, 100, 200
- Virtual scrolling for large datasets

#### 10.2 Sorting
- Default: Date descending (newest first)
- All columns sortable
- Multi-column sort support

### 11. Export Capabilities

- Export filtered results to CSV
- Include attachments in ZIP export
- Maintain formatting in PDF export

### 12. Security and Privacy

- Audit log for all record access
- Encryption for sensitive attachments
- Role-based visibility rules
- Data retention policies

## Implementation Notes

1. Use virtual scrolling for performance
2. Implement full-text search with PostgreSQL
3. Cache party lists for quick entry
4. Use background jobs for import processing
5. Implement real-time updates via WebSocket
6. Add keyboard shortcuts for power users

## Testing Requirements

- Load test with 10,000+ communication records
- Test import with various file formats
- Verify notification delivery across browsers
- Test search performance with complex queries
- Ensure filter combinations work correctly
- Test attachment upload with large files
- Verify data integrity during imports
# Requirement: R09 - FAX Documents

## Overview
Implement a comprehensive FAX document management system that digitizes received FAXes, provides OCR capabilities, AI-powered summaries, and seamless integration with matter management. The system must handle both FAX server integration and manual uploads while maintaining the original documents.

## Detailed Requirements

### 1. System Architecture

#### 1.1 Dual UI Approach
- **Independent FAX Management**: Standalone interface at `/fax`
- **Integrated View**: Within Communication History tab
- Both views share the same data and backend

#### 1.2 URL Structure
```
/fax                          # All FAXes across matters
/fax?matter=:id              # Filtered by specific matter
/fax?status=unassigned       # Unassigned FAXes requiring attention
/fax/:faxId                  # Individual FAX details
/fax/upload                  # Manual upload interface
```

### 2. Data Model

#### 2.1 FAX Document Structure
```typescript
interface FaxDocument {
  id: string
  receivedAt: Date
  sender: {
    name: string
    number: string
  }
  pageCount: number
  matterId: string  // Required field
  type: 'notice' | 'document' | 'evidence' | 'other'
  status: 'active' | 'archived'
  files: {
    original: string     // PDF file path
    thumbnails: string[] // Page thumbnails
  }
  ocr: {
    text: string
    editedText?: string  // Manual corrections
    confidence: number
    processedAt: Date
  }
  ai: {
    summary: string
    extractedDates?: Date[]
    extractedParties?: string[]
  }
  metadata: {
    uploadedBy?: string  // For manual uploads
    faxServerId?: string // For server integration
  }
}
```

### 3. FAX Reception

#### 3.1 FAX Server Integration
```typescript
interface FaxServerConfig {
  pollInterval: number  // Minutes
  server: {
    type: 'efax' | 'interfax' | 'custom'
    endpoint: string
    credentials: encrypted
  }
  autoProcess: {
    ocr: boolean
    aiSummary: boolean
    notifyUsers: string[]
  }
}
```

#### 3.2 Manual Upload
- Drag-and-drop PDF files
- Multiple file selection
- Progress indicators
- Metadata entry form

### 4. Display Views

#### 4.1 Grid View
```
┌─────────┬─────────┬─────────┬─────────┐
│ 📠      │ 📠      │ 📠      │ 📠      │
│ [Thumb] │ [Thumb] │ [Thumb] │ [Thumb] │
│         │         │⚠️Unassign│         │
│Tokyo Ct │Opponent │03-xxxx  │Client   │
│1/15 14:30│1/15 10:00│1/14 16:00│1/14 09:00│
│5 pages  │2 pages  │1 page   │3 pages  │
│Matter:2025-001│Matter:2025-002│Unassigned│Matter:2025-001│
└─────────┴─────────┴─────────┴─────────┘
```

#### 4.2 List View
```
┌──────────────┬───────────┬──────────┬────────────┬─────────┬──────────┐
│ Received     │ Sender    │ Pages    │ Related    │ Type    │ Actions  │
├──────────────┼───────────┼──────────┼────────────┼─────────┼──────────┤
│ 1/15 14:30   │ Tokyo Ct  │ 5        │ 2025-001   │ Notice  │ [👁️][✏️][📥]│
│ 1/15 10:00   │ Opp.Counsel│ 2       │ 2025-002   │ Brief   │ [👁️][✏️][📥]│
│ 1/14 16:00 ⚠️ │ 03-xxxx   │ 1        │ Unassigned │ -       │ [👁️][🔗][📥]│
└──────────────┴───────────┴──────────┴────────────┴─────────┴──────────┘
```

### 5. FAX Processing

#### 5.1 OCR Processing
- Automatic OCR for all received FAXes
- Support for Japanese and English text
- Confidence scoring
- Manual text correction interface
- OCR text becomes searchable

#### 5.2 AI Summary
- Automatic summary generation
- Key information extraction:
  - Dates and deadlines
  - Party names
  - Document type classification
  - Action items

### 6. FAX Detail View

#### 6.1 Layout
```
┌────────────────────┬────────────────────────────┐
│                    │ Basic Information          │
│   PDF Viewer       │ AI Summary                 │
│                    │ OCR Text (Editable)        │
│                    │ Matter Assignment          │
└────────────────────┴────────────────────────────┘
```

#### 6.2 PDF Viewer Features
- Page navigation
- Zoom controls
- Full-screen mode
- Download original
- Print support

### 7. Matter Assignment

#### 7.1 Assignment Rules
- Matter assignment is mandatory
- Unassigned FAXes show warning indicators
- Bulk assignment support
- Assignment history tracking

#### 7.2 Assignment Interface
- Search matters by name/number
- Recent matters dropdown
- Create new matter option
- Assignment confirmation

### 8. Filtering and Search

#### 8.1 Filter Options
- Date range
- Sender name/number
- Matter assignment status
- Document type
- OCR text search

#### 8.2 Saved Filters
- Save frequently used filters
- Share filter URLs
- Default filter per user

### 9. Notifications

#### 9.1 FAX Receipt Notifications
- Real-time browser notifications
- In-app notification badge
- Email alerts for urgent senders
- Mobile push notifications (future)

#### 9.2 Notification Settings
- Per-user notification preferences
- Sender-based rules
- Time-based quiet hours
- Escalation rules

### 10. Integration

#### 10.1 Communication History
- FAXes appear in communication timeline
- FAX type icon distinction
- Link to full FAX detail
- Summary in timeline

#### 10.2 Document Management
- Convert FAX to editable document
- Extract text for document templates
- Link FAX as evidence

### 11. Performance Requirements

- PDF load time: < 2 seconds
- OCR processing: < 30 seconds per page
- Thumbnail generation: < 5 seconds
- List view load: < 500ms for 100 items
- Search results: < 300ms

### 12. Archive and Retention

#### 12.1 Archive Features
- Manual archive option
- Automatic archive rules
- Archive search
- Restore from archive

#### 12.2 Retention Policy
- Configurable retention periods
- Automatic deletion warnings
- Compliance with legal requirements
- Audit trail for deletions

## Implementation Notes

1. Use PDF.js for viewer implementation
2. Implement OCR with Tesseract or cloud service
3. Use job queue for OCR processing
4. Generate thumbnails on upload
5. Implement WebSocket for real-time updates
6. Use virtual scrolling for large lists

## Testing Requirements

- Test with multi-page FAXes (50+ pages)
- Verify OCR accuracy for poor quality FAXes
- Test bulk operations with 100+ FAXes
- Verify notification delivery
- Test PDF viewer on mobile devices
- Load test with concurrent uploads
- Test FAX server polling reliability
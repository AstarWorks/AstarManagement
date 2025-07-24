# Requirement: R11 - Expense Record

## Overview
Implement a mobile-first expense tracking system designed for lawyers to quickly record miscellaneous expenses such as transportation, postage, and accommodation. The system must minimize clicks, support receipt capture with OCR, and work seamlessly on both mobile and desktop devices.

## Detailed Requirements

### 1. Mobile-First Design

#### 1.1 Quick Entry Interface
```
┌─────────────────────────────┐
│ 💰 Record Expense      [×] │
├─────────────────────────────┤
│ Amount *                    │
│ ¥ [1,000]                  │
│                             │
│ Category *                  │
│ [🚃] [🏨] [📮] [🍽️]        │
│ [📞] [🚗] [📄] [➕]         │
│                             │
│ Date [Today ▼]              │
│ Description [_____]         │
│ Matter [Optional ▼]         │
│                             │
│ 📷 Receipt                  │
│ [Camera] [File] [URL]       │
│                             │
│        [Cancel] [Save]      │
└─────────────────────────────┘
```

#### 1.2 Persistent Quick Action Button
- Fixed position at bottom of screen
- Large touch target (minimum 44px)
- High contrast for visibility
- Accessible via keyboard shortcut (Alt+E)

### 2. Category System

#### 2.1 Default Categories
```typescript
const defaultCategories = [
  { id: 'transport', label: 'Transport', icon: '🚃', color: 'blue' },
  { id: 'accommodation', label: 'Lodging', icon: '🏨', color: 'purple' },
  { id: 'postage', label: 'Postage', icon: '📮', color: 'red' },
  { id: 'meal', label: 'Meals', icon: '🍽️', color: 'orange' },
  { id: 'communication', label: 'Telecom', icon: '📞', color: 'green' },
  { id: 'parking', label: 'Parking', icon: '🚗', color: 'gray' },
  { id: 'material', label: 'Materials', icon: '📄', color: 'yellow' },
]
```

#### 2.2 Custom Categories
- User-defined categories
- Custom icons and colors
- Import/export capability
- Shared across organization

### 3. Receipt Management

#### 3.1 Capture Methods
- **Camera**: Direct photo capture
- **File Upload**: Existing images/PDFs
- **URL**: Link to online receipts

#### 3.2 Receipt Processing
```
┌─────────────────────────────┐
│ 📷 Receipt Captured         │
├─────────────────────────────┤
│ 🔄 Analyzing...             │
│ ■■■■■□□□□□ 60%            │
├─────────────────────────────┤
│ ✅ Analysis Complete        │
│                             │
│ Amount: ¥2,480              │
│ Date: 2025/01/15            │
│ Vendor: Tokyo Station       │
│ Category: 🚃 Transport      │
│                             │
│ [Use This] [Edit]           │
└─────────────────────────────┘
```

#### 3.3 OCR → AI Pipeline
1. OCR extracts text from image
2. AI analyzes and structures data
3. Auto-fills form fields
4. User confirms or edits

### 4. Data Model

```typescript
interface ExpenseRecord {
  id: string
  amount: number
  category: ExpenseCategory
  date: Date
  description?: string
  matterId?: string        // Optional matter association
  lawyerId: string         // Person recording
  receipt?: {
    type: 'image' | 'pdf' | 'url'
    url: string
    ocrResult?: {
      detectedAmount?: number
      detectedDate?: Date
      detectedVendor?: string
      confidence: number
    }
  }
  metadata: {
    createdAt: Date
    updatedAt: Date
    location?: {           // Future GPS integration
      lat: number
      lng: number
    }
  }
}
```

### 5. Desktop Experience

#### 5.1 Expense List View
```
┌─────────────────────────────────────────────────────────────────────┐
│ Expense Records                        [+ New Record] [Export]       │
├─────────────────────────────────────────────────────────────────────┤
│ Period: [January 2025 ▼]  Lawyer: [All ▼]  Type: [All ▼]          │
│ Filter: ☑With receipts ☐Without receipts ☐Matter-linked           │
│                                                                     │
│ Total: ¥145,230  Count: 23                                         │
├────────────┬─────────┬────────────┬──────────┬─────────┬──────────┤
│ Date       │ Type    │ Amount     │ Details  │ Matter  │ Receipt  │
├────────────┼─────────┼────────────┼──────────┼─────────┼──────────┤
│ 1/15 14:30 │🚃Transport│ ¥2,480    │Shinjuku→Yokohama│2025-001 │ 📎Yes   │
│ 1/15 10:00 │📮Postage │ ¥840      │84¥×10    │ -       │ ⚠️No    │
└────────────┴─────────┴────────────┴──────────┴─────────┴──────────┘
```

#### 5.2 Inline Editing
- Click to edit amount, description
- Dropdown for category change
- Date picker for date adjustment

### 6. Filtering and Search

#### 6.1 Filter Options
- Date range selection
- Lawyer selection (for admins)
- Category multi-select
- Receipt status (with/without)
- Matter association (linked/unlinked)

#### 6.2 Quick Filters
- "Missing receipts" - One-click filter
- "This month" - Current month only
- "My expenses" - Current user only

### 7. Reporting

#### 7.1 Summary Report
```
┌─────────────────────────────────────────────────┐
│ Expense Summary - January 2025                  │
├─────────────────────────────────────────────────┤
│ Total: ¥145,230                                 │
│                                                 │
│ By Category:                                    │
│ 🚃 Transport   ¥65,480 (45.1%) ████████████    │
│ 🏨 Lodging     ¥35,000 (24.1%) ████████        │
│ 🍽️ Meals       ¥22,500 (15.5%) ██████          │
│                                                 │
│ Receipt Status:                                 │
│ With receipts: 18 (78.3%)                      │
│ Without: 5 (21.7%) ⚠️                           │
└─────────────────────────────────────────────────┘
```

#### 7.2 Export Formats
- **CSV**: Raw data for accounting
- **PDF**: Formatted report with charts
- **Excel**: Detailed breakdown with formulas

### 8. Matter Association

#### 8.1 Optional Linking
- Expenses can be linked to matters
- Unlinked expenses for personal use
- Bulk matter assignment
- Matter expense reports

#### 8.2 Tax Compliance
- Separate business/personal expenses
- Tax category mapping
- Year-end export for tax filing

### 9. Performance Requirements

- Form load: < 200ms
- OCR processing: < 5 seconds
- List view load: < 500ms for 1000 items
- Export generation: < 3 seconds

### 10. Offline Support (Future)

- Queue expenses when offline
- Sync when connection restored
- Local storage for drafts
- Conflict resolution

### 11. Notifications

#### 11.1 Reminder System
- End-of-day expense reminder
- Missing receipt warnings
- Monthly submission deadline

#### 11.2 Alerts
- Unusual expense amounts
- Category budget warnings
- Duplicate expense detection

### 12. Integration Points

- Calendar integration for travel expenses
- Credit card import (future)
- Accounting system export
- Transit card integration (future)

## Implementation Notes

1. Use service worker for camera access
2. Implement progressive web app features
3. Use IndexedDB for offline storage
4. Optimize images before upload
5. Implement touch gestures for mobile
6. Add keyboard navigation for desktop

## Testing Requirements

- Test on various mobile devices
- Verify OCR accuracy with different receipts
- Test offline functionality
- Load test with 10,000+ expenses
- Test camera on different OS versions
- Verify export accuracy
- Test responsive design breakpoints
- Accessibility testing with screen readers
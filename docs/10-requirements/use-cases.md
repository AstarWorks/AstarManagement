# Use Case Catalog (MVP)

> **Purpose**: Document primary user interactions in a structured use case format, providing developers and AI agents with clear reference material. Each use case follows the template: *Actor → Preconditions → Main Flow → Postconditions → Exceptions*.

---

## UC-01: Communication Tracking (Phone Calls & Meeting Notes)

| Element | Description |
|---------|-------------|
| **Primary Actors** | Lawyers, Clerks |
| **Goal** | Capture phone call and meeting content as searchable memos within 30 seconds |
| **Preconditions** | User is authenticated and target case (Matter) exists |
| **Main Flow** | 1. User opens "Quick Memo" on web/mobile interface<br>2. User enters text, adds tags, and optionally attaches files<br>3. User clicks **Save** → POST to `/memos`<br>4. API saves memo and publishes `MemoCreated` event |
| **Postconditions** | Memo appears in case timeline and becomes full-text searchable |
| **Exceptions** | Network failure → Save to local draft with retry notification |

---

## UC-02: Expense and Per-Diem Recording

| Element | Description |
|---------|-------------|
| **Primary Actors** | Lawyers, Clerks |
| **Goal** | Record business expenses and per-diem charges within 1 minute while on the go |
| **Preconditions** | User is authenticated with a case selected |
| **Main Flow** | 1. User selects "Add Expense"<br>2. User enters amount, date, description, and attaches receipt photo<br>3. User clicks **Save** → POST to `/expenses`<br>4. Expense appears in list with updated totals |
| **Postconditions** | Expense is persisted and included in CSV export data |
| **Exceptions** | Image upload failure → Generate placeholder and prompt for retry |

---

## UC-03: Progress Reporting and Visualization

| Element | Description |
|---------|-------------|
| **Primary Actors** | Lawyers, Clerks, Clients (read-only) |
| **Goal** | Share case progress through Kanban boards and timeline views |
| **Preconditions** | Stage columns are configured and actors have appropriate roles |
| **Main Flow** | 1. User drags card to different column<br>2. PATCH to `/matters/{id}/stages` updates stage and timestamp<br>3. Server publishes `MatterStageChanged` event, UI updates<br>4. Progress bar recalculates and displays |
| **Postconditions** | Stage history is saved and deadlines are recalculated |
| **Exceptions** | Insufficient permissions → Display error toast |

---

## UC-04: Automated Document Generation

| Element | Description |
|---------|-------------|
| **Primary Actors** | Lawyers |
| **Goal** | Auto-generate draft documents from templates and reference PDFs |
| **Preconditions** | YAML templates created and reference documents uploaded |
| **Main Flow** | 1. User selects template and reference documents<br>2. POST parameters to `/templates/{id}/generate`<br>3. Server generates DOCX and returns preview PDF<br>4. User reviews and clicks **Confirm** → Save document |
| **Postconditions** | Generated document is added to case document list |
| **Exceptions** | Template validation error → Display error list in UI |

---

## UC-05: Notifications and Reminders

| Element | Description |
|---------|-------------|
| **Primary Actors** | System Scheduler, Lawyers, Clerks |
| **Goal** | Notify stakeholders of approaching deadlines and SLA breaches |
| **Preconditions** | Stages with `due_at` dates exist, Slack webhook configured |
| **Main Flow** | 1. Scheduled job queries for unnotified stages due within 24 hours<br>2. Send Slack notification and record in `NotificationLog`<br>3. Frontend fetches `/notifications` → Display unread badge |
| **Postconditions** | Notifications marked as delivered, users can mark as read |
| **Exceptions** | Webhook failure → Retry with error logging |

---

## UC-06: AI-Powered Search and Chat

| Element | Description |
|---------|-------------|
| **Primary Actors** | All authenticated users |
| **Goal** | Find information quickly using natural language queries |
| **Preconditions** | Documents indexed, AI services available |
| **Main Flow** | 1. User types query in search bar (e.g., "Show all divorce cases from 2024")<br>2. System performs semantic search across cases, documents, and memos<br>3. Results displayed with relevance ranking<br>4. User can ask follow-up questions in chat interface |
| **Postconditions** | Search history saved for analytics |
| **Exceptions** | AI service unavailable → Fallback to keyword search |

---

## UC-07: Mobile Quick Actions

| Element | Description |
|---------|-------------|
| **Primary Actors** | Lawyers (mobile users) |
| **Goal** | Perform critical actions from mobile devices while in court or meetings |
| **Preconditions** | Mobile app installed, user authenticated |
| **Main Flow** | 1. User opens mobile app quick action menu<br>2. Available actions: Quick memo, expense photo, case status check<br>3. User performs action with minimal taps<br>4. Data syncs when connection available |
| **Postconditions** | Actions queued if offline, synced when online |
| **Exceptions** | Extended offline period → Local storage with conflict resolution |

---

## UC-08: Client Portal Access

| Element | Description |
|---------|-------------|
| **Primary Actors** | Clients |
| **Goal** | View case progress and upload documents securely |
| **Preconditions** | Client invited via email with temporary access code |
| **Main Flow** | 1. Client clicks invitation link<br>2. Enters access code and sets password<br>3. Views limited case information (progress, documents, memos)<br>4. Uploads evidence or requested documents |
| **Postconditions** | Client actions logged, lawyer notified of uploads |
| **Exceptions** | Invalid/expired code → Request new invitation |

---

## Use Case Template

For consistency, all use cases should follow this structure:

```markdown
## UC-XX: [Use Case Name]

| Element | Description |
|---------|-------------|
| **Primary Actors** | [Who initiates this use case] |
| **Goal** | [What the actor wants to achieve] |
| **Preconditions** | [What must be true before starting] |
| **Main Flow** | [Numbered steps of the happy path] |
| **Postconditions** | [What is true after successful completion] |
| **Exceptions** | [Error conditions and recovery] |
```

### Best Practices

1. **Keep flows concise** - 3-7 steps per main flow
2. **Focus on user goals** - Not implementation details
3. **Include timing constraints** - Where performance matters
4. **Reference API endpoints** - For developer clarity
5. **Consider offline scenarios** - For mobile use cases

---

*Last updated: 2025-06-15*
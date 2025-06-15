# ui-english

### 7. Screen & Interface Architecture

#### 7.1 Global Frame

* **Top Bar**
    * Brand logo
    * Global search bar
* **Side Navigation**
    * Icons
    * Text labels
* User-profile menu
* Notification bell
* Dark-mode toggle
* Accessibility settings

#### 7.2 Progress Management Dashboard (Kanban / Timeline Switch)

* Kanban columns
* Cards
    * Status chip
    * Assignee avatar
* Tab to switch to due-date timeline
* Filters
    * Assignee
    * Due date
    * Matter type
* Progress bar
* SLA alert badge
* AI Suggest button
    * Next-task suggestion

#### 7.3 VSCode-Style Main Workspace

* **Left Pane (Explorer)**
    * Storage tree
    * Drag-and-drop upload
    * Quick-search input
    * Bookmarks
* **Center Pane (Viewer / Editor)**
    * Tabbed view
        * High-speed PDF renderer
        * Word-compatible viewer
        * Markdown editor
        * Diff viewer
    * Annotation sidebar
    * Version-history pop-over
* **Right Pane (AI Assistant)**
    * Chat window
    * Slash-command input
    * Quick actions
        * Summarize
        * Clause extraction
        * Document generation

#### 7.4 Document Ingest / Scan Queue

* Ingest job table
    * Status column
    * Progress bar
    * OCR accuracy
* Bulk-operation buttons
    * Retry
    * Cancel
* Error-log drawer

#### 7.5 Template Manager

* Template list cards
* Detail view
    * YAML schema editor (Monaco)
    * Real-time preview
* Variable-mapping table
* Version-diff viewer

#### 7.6 Expense & Per-Diem Dashboard

* Expense table
    * Pivot by matter
    * Pivot by month
* Quick-add dialog
* Receipt image viewer
* Aggregation chart (bar graph)
* Export buttons
    * CSV
    * PDF

#### 7.7 Client Portal (External Read-Only Access)

* Matter timeline
* Limited document viewer
* Message thread
* Evidence upload drop zone

#### 7.8 Notification Center

* Notification list
* Priority filter
* Snooze toggle
* Read/unread toggle
* Deep links
* SLA-breach indicator

#### 7.9 Admin Console

* User / role management
* Workspace settings
* Webhook / API key management
* System health dashboard
    * Pod status
    * Job-queue stats
    * GPU / CPU metrics
    * Log explorer

#### 7.10 Audit Log Viewer

* Searchable table
* Time-series filter
* Document diff view
* CSV export

#### 7.11 Responsive Mobile UI

* Quick-memo input
* Push notifications
* Document thumbnail preview
* Dashboard summary cards

# Functional Requirements

> **Purpose**: Manage requirements as discrete "tickets" to facilitate assignment tracking and progress monitoring.
> Tickets are formatted for easy import into issue tracking systems like YouTrack or GitHub Issues.

---

## 1. Ticket Format

| Field | Description |
|-------|------------|
| **ID** | Unique identifier (format: `FR-XXX`) |
| **Title** | Brief feature description |
| **Type** | `Feature` / `Enhancement` / `Task` |
| **Priority** | `P0` (Blocker), `P1` (High), `P2` (Normal), `P3` (Low), `P4` (Future) |
| **Status** | `Open` (initial), `In Progress`, `Review`, `Done` |
| **Assignee** | GitHub handle or AI-Agent role |
| **Description** | Background context and detailed requirements |
| **Acceptance Criteria** | Completion criteria in BDD format or checklist |
| **Dependencies** | Related ticket IDs |

---

## 2. MVP Feature Tickets

<small>*Initial Status: `Open`, Assignee: TBD*</small>

### Authentication & Authorization

| ID | Title | Type | Priority | Acceptance Criteria (Summary) | Dependencies |
|----|-------|------|----------|------------------------------|--------------|
| FR-001 | Keycloak OIDC Login with 2FA | Feature | P0 | Users can authenticate with TOTP-based 2FA | - |
| FR-002 | Discord-Style RBAC (3 Default Roles) | Feature | P0 | API access control for Lawyer/Clerk/Client roles | FR-001 |

### Case Management

| ID | Title | Type | Priority | Acceptance Criteria | Dependencies |
|----|-------|------|----------|-------------------|--------------|
| FR-010 | Matter CRUD Operations | Feature | P0 | Create/Read/Update/Delete endpoints functional | FR-002 |
| FR-011 | Kanban Board Stage Transitions | Feature | P1 | Drag & drop updates stage with audit trail | FR-010 |
| FR-012 | Deadline Reminder Automation | Feature | P1 | 24-hour advance Slack notifications with deduplication | FR-011 |

### Document Management

| ID | Title | Type | Priority | Acceptance Criteria | Dependencies |
|----|-------|------|----------|-------------------|--------------|
| FR-020 | File Upload (PDF/Word/Images) | Feature | P0 | Presigned URL upload up to 100MB | FR-002 |
| FR-021 | PDF Viewer Component | Feature | P1 | P95 rendering time < 1 second | FR-020 |
| FR-022 | OCR Processing & Full-Text Indexing | Feature | P1 | Text extraction → PostgreSQL ts_vector update | FR-020 |

### Communication & Expenses

| ID | Title | Type | Priority | Acceptance Criteria | Dependencies |
|----|-------|------|----------|-------------------|--------------|
| FR-030 | Memo Management (Client/Internal) | Feature | P1 | Separate client-facing and internal memos | FR-010 |
| FR-031 | Expense Tracking with CSV Export | Feature | P1 | Record expenses with downloadable CSV reports | FR-010 |

### Search & Notifications

| ID | Title | Type | Priority | Acceptance Criteria | Dependencies |
|----|-------|------|----------|-------------------|--------------|
| FR-040 | Full-Text Search API | Feature | P1 | PostgreSQL full-text search with to_tsquery | FR-022 |
| FR-041 | Notification System & UI | Feature | P2 | Read/unread status, Slack webhook integration | FR-012 |

### Internationalization

| ID | Title | Type | Priority | Acceptance Criteria | Dependencies |
|----|-------|------|----------|-------------------|--------------|
| FR-050 | Japanese/English Language Toggle | Feature | P2 | UI language switching with cookie persistence | FR-010 |

---

## 3. Post-MVP Features (Backlog)

| ID | Title | Type | Priority | Description |
|----|-------|------|----------|-------------|
| FR-101 | Vector Search with RAG Integration | Enhancement | P3 | pgvector-based semantic search with AI chat |
| FR-102 | NAS Auto-Ingestion Service | Feature | P3 | Automated document collection from network storage |
| FR-103 | YAML Template-Based Document Generation | Feature | P3 | LLM-powered document creation from templates |
| FR-104 | Event-Driven Architecture (Kafka) | Enhancement | P3 | Asynchronous event processing infrastructure |
| FR-105 | On-Premises Installation Package | Feature | P3 | Helm-based installer for self-hosted deployments |
| FR-106 | Additional Language Support (CN, KR) | Enhancement | P4 | Expand i18n coverage to Chinese and Korean |
| FR-107 | Distributed Tracing Dashboard | Enhancement | P4 | Performance monitoring and debugging tools |
| FR-108 | Tauri Desktop App with Auto-Updates | Enhancement | P4 | Cross-platform desktop client with delta updates |

---

## 4. Acceptance Criteria Template

```gherkin
Given <precondition>
When  <action>
Then  <expected result>
```

Each ticket's **Acceptance Criteria** should follow this BDD format to ensure clarity and enable direct translation to testing frameworks like Playwright or Cucumber.

### Example:

```gherkin
# FR-001: Keycloak OIDC Login with 2FA
Given a user with valid credentials and 2FA enabled
When the user attempts to log in with username/password
Then the system should prompt for TOTP code
And grant access only after valid TOTP verification
```

---

## 5. Implementation Notes

### Technical Considerations

* All APIs must follow OpenAPI 3.0 specification
* Authentication tokens should expire after 24 hours of inactivity
* File uploads must validate MIME types and scan for malware
* Search indices should update within 30 seconds of document changes
* All user actions must generate audit log entries

### Performance Requirements

* API response time: P95 < 500ms (excluding file operations)
* Concurrent user support: 100+ simultaneous sessions
* Database query optimization: Use indexes for all foreign keys
* File storage: Support up to 10TB total capacity

---

*Last updated: 2025-06-15*
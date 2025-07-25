# MILESTONE_003_CASE_MANAGEMENT

## Overview

**Priority**: High
**Duration**: 10-12 weeks  
**Team Size**: 3-4 developers
**Dependencies**: M001 - Frontend Foundation, M002 - Database Foundation
**Risk Level**: Medium-High

The Case Management Core milestone implements the central feature of legal practice management - comprehensive case/matter handling with kanban visualization, status tracking, and collaborative features. Based on CASE_MANAGEMENT_DETAIL.md, this milestone delivers a production-ready case management system with advanced workflow capabilities.

## Business Context

Case management is the heart of legal practice operations. This milestone addresses:

- **Case Lifecycle Management**: From initial consultation to case closure
- **Progress Visualization**: Kanban board for intuitive status tracking  
- **Collaborative Workflow**: Multi-user assignment and task management
- **Legal Compliance**: Proper case numbering, deadline tracking, audit trails

The system supports typical legal workflow: 受任前相談 → 受任手続中 → 準備中 → 進行中 → 和解交渉中 → 判決待ち → 完了

## Success Criteria

### Definition of Done
- [ ] Complete case CRUD operations with full validation
- [ ] Interactive kanban board with drag-and-drop status changes
- [ ] Case assignment system for lawyers and clerks
- [ ] Status transition history with audit trail
- [ ] Advanced search and filtering capabilities
- [ ] Milestone and task management integrated with cases
- [ ] Deadline tracking with alert system
- [ ] Mobile-responsive interface for field access
- [ ] Integration tests covering all workflows
- [ ] Performance testing with 1000+ cases

### Acceptance Criteria
1. **Case Management**: Full lifecycle from creation to completion
2. **Kanban Visualization**: Drag-and-drop interface with real-time updates
3. **Search Performance**: <500ms for complex queries across large datasets
4. **Mobile Experience**: Full functionality on tablets and smartphones
5. **Data Integrity**: No case data loss during status transitions

## Technical Requirements

### Case Data Model Implementation

#### Core Case Entity
```typescript
interface Case {
  id: UUID
  caseNumber: string          // Auto-generated: 2024-001
  title: string               // Case title/description
  caseType: CaseType          // 民事/刑事/家事/企業法務
  client: Client              // Primary client reference
  opponent?: string           // Opposing party name
  status: CaseStatus          // Current workflow status
  priority: Priority          // 高/中/低
  acceptedDate: Date          // 受任日
  closedDate?: Date          // 終了日
  summary: string            // Case summary/overview
  internalNotes: string      // Internal confidential notes
  
  // Relationships
  assignments: CaseAssignment[]  // Lawyer/clerk assignments
  statusHistory: CaseStatusHistory[]
  tasks: Task[]
  documents: Document[]
  communications: Communication[]
  
  // Audit fields (from standard schema)
  tenantId: UUID
  createdAt: Date
  createdBy: UUID
  updatedAt: Date
  updatedBy: UUID
  version: number
}
```

#### Status Management
```typescript
enum CaseStatus {
  PRE_CONSULTATION = "pre_consultation",    // 受任前相談
  INTAKE_PROCESS = "intake_process",        // 受任手続中
  PREPARATION = "preparation",              // 準備中
  IN_PROGRESS = "in_progress",              // 進行中
  SETTLEMENT = "settlement",                // 和解交渉中
  AWAITING_JUDGMENT = "awaiting_judgment",  // 判決待ち
  COMPLETED = "completed",                  // 完了
  ON_HOLD = "on_hold",                     // 保留
  ARCHIVED = "archived"                     // アーカイブ
}

interface StatusTransition {
  from: CaseStatus
  to: CaseStatus
  requiredRole: UserRole
  requiresApproval: boolean
  requiredFields?: string[]
}
```

### Advanced Case Features

#### Case Assignment System
- **Multi-user Assignment**: Cases can have multiple lawyers and clerks
- **Primary Assignment**: Designated primary responsible lawyer
- **Role-based Permissions**: Different access levels per assignment
- **Assignment History**: Track assignment changes over time

#### Milestone and Deadline Management
```typescript
interface CaseMilestone {
  id: UUID
  caseId: UUID
  name: string                // "訴状提出", "第1回口頭弁論"
  type: MilestoneType         // LEGAL_DEADLINE, INTERNAL_DEADLINE
  dueDate: Date
  completedDate?: Date
  priority: Priority
  assignedTo: UUID[]
  dependencies: UUID[]        // Other milestones this depends on
  
  // Legal-specific fields
  courtDeadline: boolean      // True for court-imposed deadlines
  statuteOfLimitations: boolean
  notificationSettings: NotificationConfig
}
```

#### Advanced Search and Filtering
- **Full-text Search**: Case titles, summaries, internal notes
- **Faceted Search**: Filter by status, type, assigned lawyer, client
- **Date Range Filtering**: Creation date, due dates, status changes
- **Saved Searches**: Personal and shared search configurations
- **Export Capabilities**: Excel/PDF export of filtered results

### Kanban Board Implementation

#### Interactive Kanban Features
- **Drag-and-Drop**: Move cases between status columns
- **Real-time Updates**: WebSocket notifications for multi-user environments
- **Customizable Columns**: Configurable status columns per firm
- **Card Information**: Case number, title, client, assigned lawyer, due dates
- **Bulk Operations**: Multi-select for batch status changes
- **Filtering**: Personal view filters (my cases, urgent cases, etc.)

#### Kanban Performance Optimization
- **Virtual Scrolling**: Handle 1000+ cases efficiently
- **Progressive Loading**: Load cards as user scrolls
- **Caching Strategy**: Client-side caching with smart invalidation
- **Optimistic Updates**: Immediate UI feedback with conflict resolution

### Task Management Integration

#### Case-linked Task System
```typescript
interface CaseTask {
  id: UUID
  caseId: UUID
  title: string
  description: string
  assignedTo: UUID[]
  dueDate: Date
  priority: Priority
  status: TaskStatus
  estimatedHours?: number
  actualHours?: number
  
  // Task dependencies
  dependencies: UUID[]
  blockers: UUID[]
  
  // Legal-specific
  billable: boolean
  hourlyRate?: number
  category: TaskCategory  // "Research", "Document Prep", "Court Appearance"
}
```

#### Task Templates
- **Predefined Workflows**: Common task sequences for case types
- **Automatic Task Creation**: Generate tasks when case status changes
- **Checklist Integration**: Legal compliance checklists
- **Time Tracking**: Integration with billing system

## User Experience Design

### Case Management Interface

#### Case List View
- **Data Table**: Sortable/filterable case list with pagination
- **Quick Actions**: Inline edit, status change, assignment
- **Bulk Operations**: Multi-select for batch operations
- **Export Options**: Excel, PDF, CSV export capabilities
- **Column Customization**: User-configurable column display

#### Case Detail View
- **Tabbed Interface**: Overview, Tasks, Documents, Communications, History
- **Activity Timeline**: Chronological view of all case activities
- **Quick Edit**: Inline editing of key case fields
- **Related Items**: Associated documents, tasks, deadlines
- **Print View**: Formatted case summary for printing

#### Mobile Experience
- **Responsive Design**: Full functionality on mobile devices
- **Touch Gestures**: Swipe actions for quick operations
- **Offline Capability**: Basic case viewing when offline
- **Field Access**: Optimized for lawyers working remotely

### Kanban Board Experience

#### Board Layout
```
┌────────────────────────────────────────────────────────┐
│ [Filter] [View Options] [+ New Case]                  │
├─────────┬─────────┬─────────┬─────────┬─────────────────┤
│受任前   │準備中   │進行中   │和解中   │完了             │
├─────────┼─────────┼─────────┼─────────┼─────────────────┤
│┌───────┐│┌───────┐│┌───────┐│┌───────┐│                 │
││2024-  ││2024-  ││2024-  ││2024-  ││                 │
││001    ││003    ││002    ││004    ││                 │
││山田   ││鈴木   ││田中   ││佐藤   ││                 │
││訴訟   ││案件   ││調停   ││和解   ││                 │
│└───────┘│└───────┘│└───────┘│└───────┘│                 │
└─────────┴─────────┴─────────┴─────────┴─────────────────┘
```

#### Card Design
- **Case Information**: Number, title, client name
- **Visual Indicators**: Priority color coding, overdue alerts
- **Assignee Avatars**: Profile pictures of assigned lawyers
- **Progress Indicators**: Task completion percentage
- **Quick Actions**: Context menu for common operations

## API Design

### Case Management Endpoints

#### Core CRUD Operations
```typescript
// Case Management API
GET    /api/v1/cases                    // List cases with filtering
POST   /api/v1/cases                    // Create new case
GET    /api/v1/cases/{id}               // Get case details
PUT    /api/v1/cases/{id}               // Update case
DELETE /api/v1/cases/{id}               // Archive case (soft delete)

// Status Management
PUT    /api/v1/cases/{id}/status        // Change case status
GET    /api/v1/cases/{id}/status-history // Get status change history

// Assignment Management
POST   /api/v1/cases/{id}/assignments   // Assign user to case
DELETE /api/v1/cases/{id}/assignments/{userId} // Remove assignment

// Task Management
GET    /api/v1/cases/{id}/tasks         // Get case tasks
POST   /api/v1/cases/{id}/tasks         // Create case task
PUT    /api/v1/tasks/{id}               // Update task
DELETE /api/v1/tasks/{id}               // Delete task

// Search and Reporting
GET    /api/v1/cases/search             // Advanced search
GET    /api/v1/cases/export             // Export cases to Excel/PDF
```

#### WebSocket Events for Real-time Updates
```typescript
// WebSocket event types
interface CaseUpdateEvent {
  type: 'case_updated'
  caseId: UUID
  changes: Partial<Case>
  updatedBy: User
  timestamp: Date
}

interface StatusChangeEvent {
  type: 'status_changed'
  caseId: UUID
  oldStatus: CaseStatus
  newStatus: CaseStatus
  changedBy: User
  reason?: string
}
```

## Tasks Breakdown

### Phase 1: Core Case Management (Weeks 1-3)
- **CASE-001**: Case entity and repository implementation
- **CASE-002**: Case CRUD API with validation and security
- **CASE-003**: Case search and filtering backend
- **CASE-004**: Case assignment system

### Phase 2: Status and Workflow Management (Weeks 4-5)
- **CASE-005**: Status transition system with validation
- **CASE-006**: Case history and audit trail
- **CASE-007**: Deadline and milestone management
- **CASE-008**: Notification system for status changes

### Phase 3: Frontend Case Management (Weeks 6-8)
- **UI-005**: Case list view with advanced filtering
- **UI-006**: Case detail view with tabbed interface
- **UI-007**: Case creation and editing forms
- **UI-008**: Mobile-responsive case management

### Phase 4: Kanban Board Implementation (Weeks 9-10)
- **KANBAN-001**: Interactive kanban board component
- **KANBAN-002**: Drag-and-drop functionality with state management
- **KANBAN-003**: Real-time updates with WebSocket integration
- **KANBAN-004**: Kanban customization and view options

### Phase 5: Task Integration and Advanced Features (Weeks 11-12)
- **TASK-001**: Case-linked task management system
- **TASK-002**: Task templates and automation
- **PERF-001**: Performance optimization for large datasets
- **EXPORT-001**: Export functionality for cases and reports

## Performance Requirements

### Response Time Targets
- **Case List Loading**: <300ms for 1000+ cases
- **Case Detail View**: <200ms for full case data
- **Status Changes**: <100ms for kanban updates
- **Search Results**: <500ms for complex queries
- **Real-time Updates**: <50ms WebSocket event processing

### Scalability Targets
- **Concurrent Users**: 50+ users managing cases simultaneously
- **Case Volume**: 10,000+ active cases per tenant
- **Search Performance**: Sub-second search across 100k+ cases
- **Kanban Performance**: Smooth interaction with 500+ cards

## Testing Strategy

### Comprehensive Test Coverage
- **Unit Tests**: Business logic, validation, calculations
- **Integration Tests**: API endpoints, database operations
- **E2E Tests**: Complete workflows from case creation to closure
- **Performance Tests**: Load testing with realistic data volumes
- **Security Tests**: Authorization, tenant isolation, data protection

### User Acceptance Testing
- **Lawyer Workflows**: Case management from legal professional perspective
- **Clerk Workflows**: Administrative and support functions
- **Multi-user Scenarios**: Collaborative case handling
- **Mobile Testing**: Field access and mobile-specific workflows

## Risk Assessment

### High Risks
- **Performance with Large Datasets**: Mitigated by pagination, indexing, caching
- **Complex Workflow Logic**: Mitigated by state machine pattern, comprehensive testing
- **Real-time Synchronization**: Mitigated by conflict resolution strategies

### Medium Risks
- **Mobile Responsiveness**: Mitigated by responsive design patterns, testing
- **User Experience Complexity**: Mitigated by user testing, iterative design

### Low Risks
- **Data Migration**: Mitigated by comprehensive backup and rollback procedures
- **Integration Issues**: Mitigated by extensive integration testing

## Success Metrics

### Functional Metrics
- **Case Processing Speed**: 50% reduction in case status update time
- **Search Efficiency**: 80% of searches return results in <1 second
- **User Adoption**: 90% of lawyers actively using kanban board
- **Data Accuracy**: 99.9% accuracy in case status tracking

### Technical Metrics
- **API Performance**: 95% of requests under 200ms
- **System Uptime**: 99.5% availability during business hours
- **Error Rate**: <0.1% error rate for case operations
- **Mobile Usage**: 40% of case views from mobile devices

This milestone delivers the core case management functionality that serves as the foundation for all other legal practice management features, with enterprise-grade performance and user experience.
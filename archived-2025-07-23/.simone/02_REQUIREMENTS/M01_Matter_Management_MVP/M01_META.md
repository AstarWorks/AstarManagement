---
milestone_id: M01
milestone_name: Matter Management MVP
description: Implement core matter (case) management functionality with CRUD operations and Kanban-style progress visualization
start_date: 2025-01-15
target_end_date: 2025-02-15
status: active
---

# Milestone: M01 - Matter Management MVP

## Overview

This milestone focuses on implementing the core matter (case) management functionality that is central to the Aster Management system. We'll build the foundation for lawyers and clerks to create, view, update, and track legal cases through an intuitive Kanban board interface.

## Business Value

- **Centralized Case Tracking**: Replace scattered Excel sheets with a unified system
- **Visual Progress Management**: Instantly see case status and bottlenecks
- **Real-time Collaboration**: Multiple users can track and update case progress
- **Audit Trail**: Automatic timestamping of all status changes

## Key Deliverables

1. **Backend API for Matter Management** (R01)
   - RESTful endpoints for CRUD operations
   - Status transition logic with validation
   - Audit logging for all changes
   - Permission-based access control

2. **Kanban Board Frontend** (R02)
   - Drag-and-drop interface for status updates
   - Real-time updates across users
   - Mobile-responsive design
   - Japanese/English language support

3. **Status History and Audit** (R03)
   - Status history tracking
   - Comprehensive audit trail
   - Change notifications

4. **Matter List Screen** (R04)
   - Office-wide matter overview
   - Advanced filtering and sorting
   - Pagination and infinite scroll
   - Export capabilities

5. **Matter Detail Board** (R05)
   - Tabbed interface for matter information
   - Collapsible sidebar with summary
   - Integration point for all features
   - Deep linking support

6. **Task Management Table** (R06)
   - Table view alternative to Kanban
   - Inline editing capabilities
   - Shared state with Kanban board
   - Bulk operations

7. **Communication History** (R07)
   - Track all matter-related communications
   - Import and manual entry
   - Powerful search and filtering
   - Notification system

8. **Document Creation** (R08)
   - VSCode-style layout
   - Notion-like editing experience
   - AI-powered writing assistance
   - Template and variable management

9. **FAX Documents** (R09)
   - FAX digitization and OCR
   - AI summaries
   - Matter assignment workflow
   - Integration with communications

10. **Revenue Management** (R10)
    - Interactive financial dashboards
    - KPI tracking and comparisons
    - Multiple view perspectives
    - Export capabilities

11. **Expense Record** (R11)
    - Mobile-first expense tracking
    - Receipt OCR processing
    - Category management
    - Tax compliance features

## Success Criteria

### Core Matter Management
- [ ] Create, read, update, delete matters via API (R01)
- [ ] Matter list with filtering, sorting, and pagination (R04)
- [ ] Matter detail board with tabbed interface (R05)
- [ ] Role-based permissions (Lawyer full access, Clerk limited)

### Kanban and Task Management
- [ ] Kanban board with at least 5 customizable columns (R02)
- [ ] Drag-and-drop status changes with timestamp recording (R02)
- [ ] Task management table view with inline editing (R06)
- [ ] Shared state between Kanban and table views

### Communication and Documents
- [ ] Communication history tracking and search (R07)
- [ ] Document creation with AI assistance (R08)
- [ ] FAX document management with OCR (R09)
- [ ] Template system with variable substitution

### Financial Management
- [ ] Revenue dashboard with interactive charts (R10)
- [ ] Expense tracking with mobile optimization (R11)
- [ ] Export capabilities for all financial data

### Technical Requirements
- [ ] Mobile-responsive UI that works on smartphones and tablets
- [ ] All API endpoints documented in OpenAPI
- [ ] 90% test coverage for critical paths
- [ ] Performance: Pages load in < 2 seconds
- [ ] Japanese/English language support throughout

## Technical Requirements

### Backend (Spring Boot/Kotlin)
- Matter entity with JPA mappings
- REST controllers with proper validation
- Service layer with business logic
- Repository layer with custom queries
- Integration with Spring Security for authorization

### Frontend (Next.js/React)
- Kanban board component using react-beautiful-dnd or similar
- Form components for CRUD operations
- Real-time updates using polling or WebSockets
- Responsive grid layout
- Internationalization setup

### Database Schema
```sql
-- Core matter table
CREATE TABLE matters (
    id UUID PRIMARY KEY,
    case_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    client_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    priority VARCHAR(20),
    assigned_lawyer_id UUID,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by UUID NOT NULL
);

-- Status history for audit trail
CREATE TABLE matter_status_history (
    id UUID PRIMARY KEY,
    matter_id UUID NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_at TIMESTAMP NOT NULL,
    changed_by UUID NOT NULL,
    notes TEXT
);
```

## Constraints & Assumptions

- Using existing authentication system
- PostgreSQL database is already set up
- Frontend framework (Next.js) is already initialized
- Following existing code style and patterns
- All text must support JP/EN localization

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Complex permission requirements | High | Start with simple role-based permissions, iterate based on feedback |
| Performance with many matters | Medium | Implement pagination early, consider virtual scrolling |
| Drag-and-drop on mobile | Medium | Provide alternative touch-friendly status update method |

## Dependencies

- Authentication system must be functional
- Database connection and migrations setup
- Base API framework configured
- Frontend routing established

## Definition of Done

- [ ] All code reviewed and approved
- [ ] Unit tests passing with >90% coverage
- [ ] Integration tests for all API endpoints
- [ ] UI tested on Chrome, Safari, and mobile browsers
- [ ] Documentation updated (API docs, README)
- [ ] No critical security vulnerabilities
- [ ] Performance benchmarks met
- [ ] Deployed to staging environment
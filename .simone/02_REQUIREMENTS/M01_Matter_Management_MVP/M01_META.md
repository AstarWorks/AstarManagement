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

1. **Backend API for Matter Management**
   - RESTful endpoints for CRUD operations
   - Status transition logic with validation
   - Audit logging for all changes
   - Permission-based access control

2. **Kanban Board Frontend**
   - Drag-and-drop interface for status updates
   - Real-time updates across users
   - Mobile-responsive design
   - Japanese/English language support

3. **Database Schema**
   - Matter entity with all required fields
   - Status history tracking
   - Relationship to users and documents

4. **Integration Points**
   - Authentication/Authorization integration
   - Activity logging system
   - Search indexing for matters

## Success Criteria

- [ ] Create, read, update, delete matters via API
- [ ] Kanban board with at least 5 customizable columns
- [ ] Drag-and-drop status changes with timestamp recording
- [ ] Role-based permissions (Lawyer full access, Clerk limited)
- [ ] Search matters by name, client, or case number
- [ ] Mobile-responsive UI that works on tablets
- [ ] All API endpoints documented in OpenAPI
- [ ] 90% test coverage for critical paths
- [ ] Performance: Board loads in < 2 seconds with 100 matters

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
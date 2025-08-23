# PROJECT MANIFEST - Astar Management

---
project_name: Astar Management
project_version: 0.0.1
current_milestone: M001
highest_sprint_in_milestone: S07
last_updated: 2025-01-23 15:00
---

## Project Overview

**Astar Management** is a comprehensive business management platform combining AI-Agent capabilities with Notion and Obsidian-inspired interfaces. The platform targets small to medium enterprises (1-100 employees) with industry-specific templates, starting with legal offices.

## Current Milestone: M001 - Auth0 Integration

Migrating from custom authentication to Auth0 for professional, secure user authentication and authorization.

### Milestone Status
- **Target Date**: 2025-02-01 (M002 specific: 2025-02-15)
- **Progress**: Sprint S01 completed, S02-S07 planned
- **Priority**: Critical

## Sprint Roadmap

### Completed Sprints
- **S01_M001_Backend_JWT_Validation** ✅ COMPLETED
  - JWT validation with Auth0 JWKS
  - Claims extraction and business context
  - API protection and audit logging
  - Status: All 5 tasks completed

### Active/Planned Sprints

#### Authentication Implementation (M002 Scope)

- **S02_M001_Integration_Testing** 📋 PLANNED
  - E2E testing of authentication flow
  - Performance validation
  - Production configuration
  - Status: 5 tasks created (3 Medium, 2 Low)

- **S04_M001_Frontend_Auth_Integration** 📋 PLANNED
  - Sidebase Auth with Auth0 provider
  - Login/logout flow implementation
  - Token management and refresh

- **S05_M001_User_Provisioning** 📋 PLANNED
  - JIT user creation from Auth0
  - Email-based user matching
  - Profile synchronization

- **S06_M001_Code_Cleanup** 📋 PLANNED
  - Remove legacy password code
  - Database migration cleanup
  - API endpoint removal

- **S07_M001_Documentation_Deployment** 📋 PLANNED
  - Auth0 setup documentation
  - Deployment guides
  - Team training materials

#### Authorization Implementation (M003 Scope)

- **S03_M001_Authorization_Implementation** 📋 PLANNED
  - Spring Boot RBAC implementation
  - Business roles (OWNER, MEMBER, VIEWER)
  - Tenant-scoped authorization
  - Note: This is for future M003 milestone

## Sprint Dependencies

```
S01 (Complete) 
  ├─→ S02 (Testing)
  ├─→ S04 (Frontend Auth)
  │     └─→ S05 (User Provisioning)
  │           └─→ S06 (Code Cleanup)
  └─────────────────→ S07 (Documentation)

S03 (Authorization) - Independent, for M003
```

## Next Sprint to Detail

**Immediate Priority**: S04_M001_Frontend_Auth_Integration
- Critical path for user-facing authentication
- Enables S05 user provisioning
- 5-day estimated duration

## Success Metrics

### M002 Completion Criteria
- ✅ Backend JWT validation (S01)
- ⏳ Frontend Auth0 integration (S04)
- ⏳ User provisioning system (S05)
- ⏳ Legacy code removal (S06)
- ⏳ Complete documentation (S07)
- ⏳ Integration testing (S02)

### Key Performance Indicators
- Authentication success rate: >99%
- JWT validation latency: <50ms
- User provisioning: <100ms
- Zero password storage
- 100% API protection

## Risk Register

| Risk | Impact | Mitigation | Sprint |
|------|--------|------------|--------|
| Auth0 service outage | High | Implement circuit breakers, caching | S01 ✅ |
| User migration issues | Medium | Email-based matching, manual linking | S05 |
| Frontend complexity | Medium | Use proven Sidebase Auth | S04 |
| Legacy code dependencies | Low | Gradual removal, feature flags | S06 |

## Team Notes

### Architecture Decisions
- **Authentication**: Auth0 (managed service)
- **Frontend Auth**: Sidebase/nuxt-auth
- **Backend**: Stateless JWT validation only
- **User Data**: JIT provisioning, no sync

### Important Considerations
1. S03 (Authorization) is planned but out of scope for M002
2. Focus on authentication (認証) before authorization (認可)
3. Maintain backward compatibility during migration
4. Document everything for team knowledge transfer

---
*Last Updated: 2025-01-23 by Sprint Planning Process*
*Next Review: After S04 completion*
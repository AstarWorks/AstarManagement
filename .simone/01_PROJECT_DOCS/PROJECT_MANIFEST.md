# Project Manifest - Astar Management

## Project Summary

**Project Name**: Astar Management  
**Type**: Full-stack SaaS Platform  
**Version**: 0.0.1 (MVP Development)  
**Repository**: /IdeaProjects/AstarManagement  
**Status**: Active Development  

## Technology Stack

### Backend
- **Framework**: Spring Boot 3.4.2
- **Language**: Kotlin 2.2.0
- **Database**: PostgreSQL with RLS
- **Authentication**: Auth0 (migrating)
- **Build Tool**: Gradle

### Frontend
- **Framework**: Nuxt.js 3
- **UI**: Vue 3 + TailwindCSS
- **Components**: shadcn-vue
- **Auth**: Sidebase Auth
- **Build Tool**: Bun

## Project Structure

```
AstarManagement/
├── backend/              # Spring Boot Kotlin backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── kotlin/
│   │   │   └── resources/
│   │   └── test/
│   └── build.gradle.kts
├── frontend/             # Nuxt.js frontend
│   ├── app/
│   │   ├── foundation/   # Base infrastructure
│   │   ├── modules/      # Feature modules
│   │   └── pages/        # Route pages
│   ├── i18n/            # Localization
│   └── package.json
├── docs/                # Project documentation
├── .simone/            # Simone framework
└── CLAUDE.md           # AI instructions

```

## Core Features

1. **Project Management** - Kanban/Table workflow management
2. **Expense Management** - Financial tracking and reporting  
3. **Customer Management** - CRM functionality
4. **Document Management** - Markdown-based documents with variables

## Current Sprint

**Sprint**: Auth0 Integration Migration  
**Period**: 2025-01-18 to 2025-02-01  
**Focus**: Migrate authentication from custom JWT to Auth0

### Sprint Goals
- Remove password-based authentication
- Integrate Auth0 OAuth2 Resource Server
- Implement JIT user provisioning
- Update frontend to use Sidebase Auth with Auth0

## Milestones

### Active Milestones
- [M001: Auth0 Integration](../02_MILESTONES/M001_Auth0_Integration.md) - General Auth0 migration planning
- [M002: Auth0 Authentication Only](../02_REQUIREMENTS/M002_Auth0_Authentication_Only/M002_milestone_meta.md) - **Current Focus** - Authentication implementation (no authorization)

### Planned Milestones
- M003: Authorization Implementation - RBAC and permissions (future)

## Sprint Roadmap

### M001 Sprints (Simple Auth0 Delegation)

#### Current Sprint Plan
- **[S01_M001_Backend_JWT_Validation](../03_SPRINTS/S01_M001_Backend_JWT_Validation/sprint_meta.md)** - 📋 Planned
  - Spring Boot JWT validation setup
  - JWKS configuration and caching
  - JIT user provisioning
  - Duration: 5 days

- **[S02_M001_Frontend_Proxy_Routes](../03_SPRINTS/S02_M001_Frontend_Proxy_Routes/sprint_meta.md)** - 📋 Planned
  - Nuxt server routes as thin proxy
  - Auth0 OAuth2 flow handling
  - Cookie-based token storage
  - Duration: 5 days

- **[S03_M001_Integration_Testing](../03_SPRINTS/S03_M001_Integration_Testing/sprint_meta.md)** - 📋 Planned
  - End-to-end testing
  - Production configuration
  - Documentation and deployment
  - Duration: 3 days

**Total Duration**: ~13 days (2.5 weeks)
**Completion Target**: 2025-02-01

## Development Guidelines

### Code Standards
- **TypeScript**: Strict mode, no `any` types
- **Kotlin**: Clean Architecture, Service layer required
- **Testing**: Unit tests required for business logic
- **i18n**: All user-facing text must use translation keys

### Git Workflow
- **Main Branch**: main
- **Feature Branch**: feature/frontend/expense (current)
- **Commit Style**: Conventional commits
- **PR Required**: Yes, with code review

## Team

- **Product Owner**: Leading vision and requirements
- **Backend Developer**: Spring Boot/Kotlin development
- **Frontend Developer**: Nuxt.js/Vue development
- **UI Developer**: Component library and design

## Dependencies

### Critical Dependencies
- PostgreSQL database server
- Auth0 tenant (for authentication)
- Node.js/Bun runtime
- Java 21 JDK

### External Services
- Auth0 for authentication
- Object storage for attachments (planned)
- AI/LLM integration (planned)

## General Tasks

### Active Tasks
- [ ] [T001: Auth0 Authentication Migration](../03_GENERAL_TASKS/T001_Auth0_Migration.md) - Status: In Progress
- [x] [TX002: Nuxt3 Mock/API Switching Implementation](../03_GENERAL_TASKS/TX002_Nuxt_Mock_API_Switching.md) - Status: Completed (2025-08-22 04:40)

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Auth0 migration complexity | High | Phased migration with fallback |
| Multi-tenant data isolation | Critical | RLS with thorough testing |
| Performance at scale | Medium | Caching layer planned |
| AI integration complexity | Medium | Start with basic chatbot |

## Quality Metrics

- **Test Coverage**: Target 85% (backend)
- **Build Status**: CI/CD via GitHub Actions (planned)
- **Code Quality**: ESLint + TypeScript strict mode
- **Performance**: <200ms API response time

## Links

- [Architecture Document](ARCHITECTURE.md)
- [Platform Vision](../../docs/00-overview/PLATFORM_VISION.md)
- [Auth0 Integration](../../docs/40-specs/02-auth-security/auth0-integration-architecture.md)
- [Database Design](../../docs/40-specs/03-database-design/)

---
*Generated by Simone Framework*  
*Last Updated: 2025-01-18*
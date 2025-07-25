# Astar Management - Project Constitution

## Project Overview
**Name**: Astar Management  
**Description**: Legal practice management system for small-to-medium Japanese law firms (1-10 employees)

## Tech Stack

### Frontend
- **Language**: TypeScript
- **Framework**: Nuxt.js 4.0 + Vue 3 Composition API
- **UI Components**: shadcn-vue + Radix Vue
- **State Management**: Pinia with persistence
- **Package Manager**: Bun (exclusively - never npm/yarn)
- **Testing**: Vitest + Storybook + Playwright

### Backend  
- **Language**: Kotlin
- **Framework**: Spring Boot 3.5 + Spring Modulith
- **Database**: PostgreSQL 17 + Redis
- **Architecture**: Clean Architecture (Domain → Application → Infrastructure → Presentation)
- **Build Tool**: Gradle with Kotlin DSL
- **Testing**: JUnit 5 + MockK + Testcontainers

### Infrastructure
- **Cloud**: Google Cloud Platform
- **Orchestration**: Kubernetes + ArgoCD (GitOps)
- **IaC**: Terraform
- **Storage**: MinIO (S3-compatible) + Cloud SQL

## Project Structure
```
/
├── backend/          # Spring Boot Kotlin backend
│   ├── modules/      # Spring Modulith modules (auth, case-management, etc.)
│   └── src/          # Clean Architecture layers
├── frontend/         # Nuxt.js Vue frontend  
│   ├── app/          # Application code
│   └── components/   # shadcn-vue components
├── infrastructure/   # Terraform + Kubernetes configs
├── docs/            # Architecture & design documents
└── scripts/         # Build and deployment scripts
```

## Essential Commands

### Frontend Development
```bash
cd frontend
bun run dev              # Development server
bun run typecheck        # TypeScript compilation check
bun run test            # Unit tests (Vitest)
bun run storybook       # Component development
bun run test:e2e        # E2E tests (Playwright)
```

### Backend Development  
```bash
cd backend
./gradlew bootRun       # Development server
./gradlew test          # Unit tests
./gradlew integrationTest  # Integration tests
./gradlew ktlintCheck   # Code style check
```

### Quality Gates (Pre-commit)
```bash
# Frontend
bun run typecheck && bun run test && bun run lint && bun run build-storybook

# Backend  
./gradlew ktlintCheck && ./gradlew test && ./gradlew integrationTest
```

## Critical Rules (MUST FOLLOW)

### Security & Legal Compliance
- **NEVER** allow cross-tenant data access without explicit permission
- **NEVER** store client data without encryption at rest
- **NEVER** skip audit logging for sensitive operations (CRUD on legal data)
- **NEVER** allow unauthenticated access to any case/client data

### Code Quality
- **NEVER** commit code with failing tests or TypeScript errors
- **NEVER** use `any` type in TypeScript - always define proper interfaces
- **NEVER** create components without Storybook stories
- **NEVER** push directly to main branch - use feature branches

### Legal Domain Specific
- **ALWAYS** implement Row Level Security (RLS) for multi-tenancy
- **ALWAYS** follow attorney-client privilege protection requirements  
- **ALWAYS** use Conventional Commits with legal domain scopes (case, client, document, invoice)
- **ALWAYS** reference existing design documents from `docs/developer-guide/` before implementing

### Technology Standards
- **ALWAYS** use Bun for frontend package management (never npm/yarn)
- **ALWAYS** follow Clean Architecture layers in backend
- **ALWAYS** test components in 4 stages: Storybook → Mock → Local DB → Production
- **ALWAYS** run quality checks before any commit
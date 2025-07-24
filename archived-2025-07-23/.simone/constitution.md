# Constitution - Aster Management

## Project Info

**Name**: Aster Management (法律事務所向け業務管理システム)

**Description**: Comprehensive legal case management system for small to medium-sized law firms featuring AI-powered document processing, Kanban-style case tracking, and automated financial management.

## Tech Stack

- **Backend**: Kotlin + Spring Boot 3.5.0 + PostgreSQL 15
- **Frontend**: TypeScript + Vue 3 + Nuxt.js 4.0.1 + Bun
- **UI**: shadcn-vue + Radix Vue + Tailwind CSS
- **Testing**: JUnit 5 + Vitest + Playwright + Storybook
- **Infrastructure**: Docker + Kubernetes + PostgreSQL + Redis + MinIO

## Structure

```
├── backend/           # Spring Boot Kotlin API (Clean Architecture)
├── frontend/          # Nuxt.js Vue 3 TypeScript frontend
├── infrastructure/    # Docker, K8s, Terraform configs
├── docs/             # Comprehensive documentation
└── .simone/          # Project management and requirements
```

## Essential Commands

### Backend
- **Run**: `./gradlew bootRun`
- **Test**: `./gradlew test`
- **Quality**: `./gradlew qualityCheck`
- **Migration**: `./gradlew flywayMigrate`

### Frontend  
- **Run**: `bun dev`
- **Test**: `bun test`
- **Build**: `bun build`
- **Typecheck**: `bun run typecheck`
- **Lint**: `bun run lint`
- **Storybook**: `bun run storybook`

## Critical Rules

### Security & Legal Compliance (Non-negotiable)
- **NEVER commit API keys, passwords, or secrets**
- **NEVER allow cross-tenant data access without explicit permission**
- **NEVER skip audit logging for sensitive operations**
- **NEVER allow unauthenticated access to any case/client data**
- **NEVER store client data without encryption at rest**

### Code Quality & Development Workflow
- **NEVER commit directly to main branch**
- **NEVER commit code with failing tests or linting errors**
- **NEVER merge PRs with broken Storybook builds**
- **NEVER use `any` type in TypeScript production code**
- **NEVER skip TypeScript compilation checks (`bun run typecheck`)**

### Architecture & Framework Rules
- **NEVER violate Clean Architecture layer boundaries**
- **NEVER use npm/yarn - always use Bun for frontend**
- **NEVER manually write shadcn-vue components - always use CLI generation**
- **NEVER create components without Storybook stories**
- **NEVER implement features without corresponding API documentation**

### Testing & Quality Assurance
- **NEVER skip the 4-stage testing process (Storybook → Mock → Local DB → Production)**
- **All features must have comprehensive tests (unit + integration)**
- **All code changes must pass: typecheck + test + lint + build-storybook**
- **Follow Test-Driven Development (TDD) approach**
- **Maintain 90% test coverage requirement**

### Legal Domain Specific
- **All data operations must implement tenant isolation (Row Level Security)**
- **All create/update/delete operations must have audit logging**
- **Multi-tenant scenarios must be tested in integration tests**
- **Follow dialogue-based design approach for all new features**
- **Reference existing design documents before implementing**

### Performance & Scalability
- **API endpoints must meet p95 < 200ms target**
- **PDF processing must achieve < 1 second first paint**
- **Search results must return in < 500ms**
- **Maintain 99.9% system availability target**
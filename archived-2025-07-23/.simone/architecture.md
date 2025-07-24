# Architecture Summary - Aster Management

## System Overview

**Aster Management** is a comprehensive legal case management system designed for small to medium-sized law firms (1-10 people). It digitizes and streamlines law firm operations by providing a centralized, AI-powered platform for case management, document processing, and client communication.

### Core Problems Solved
1. **情報の分散と重複入力** - Centralized data management
2. **非効率な書類管理** - AI-powered document processing  
3. **案件進捗の可視化不足** - Kanban-style case tracking
4. **複雑な報酬・会計管理** - Automated financial management

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Nuxt.js 4.0.1)                  │
│  Vue 3 + TypeScript + shadcn-vue + Tailwind + Bun           │
└─────────────────────────────┬───────────────────────────────┘
                              │ REST API / GraphQL
┌─────────────────────────────┴───────────────────────────────┐
│                Backend (Spring Boot 3.5.0 + Kotlin)         │
│  Clean Architecture + Spring Modulith + Spring Security     │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────┐
│         Data Layer (PostgreSQL 15 + Redis + MinIO)          │
│  Row-Level Security + Audit Logging + Object Storage        │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend Stack
- **Framework**: Nuxt.js 4.0.1 with Vue 3 Composition API
- **Language**: TypeScript 5.8.3
- **UI Components**: shadcn-vue + Radix Vue
- **Styling**: Tailwind CSS 4.1.11
- **State Management**: Pinia 3.0.3 with persistence
- **Forms**: VeeValidate + Zod for runtime validation
- **Package Manager**: Bun 1.2.16 (30x faster than npm)
- **Testing**: Vitest + Playwright + Storybook

### Backend Stack
- **Language**: Kotlin with Java 21
- **Framework**: Spring Boot 3.5.0 + Spring Modulith 1.4.0
- **Security**: Spring Security with JWT + mandatory 2FA
- **Database**: Spring Data JPA + Hibernate 6.6.15
- **AI Integration**: Spring AI 1.0.0-M5 (Google Vertex AI)
- **Batch Processing**: Spring Batch
- **Caching**: Redis 7 for sessions and cache

### Infrastructure
- **Database**: PostgreSQL 15 with pgvector for AI search
- **Object Storage**: MinIO (on-prem) / Google Cloud Storage (cloud)
- **Containerization**: Docker + Kubernetes (GKE/k3s)
- **CI/CD**: GitHub Actions + ArgoCD
- **Monitoring**: Spring Actuator + Prometheus

## Core Design Principles

### 1. Agent-Native Architecture
- **CLI/GUI Parity**: Every GUI operation has corresponding CLI interface for AI execution
- **AI-First Design**: AI agents as first-class team members with role-based permissions
- **Ticket-Based Delegation**: Tasks assignable to both humans and AI agents

### 2. Clean Architecture + Spring Modulith
```
backend/modules/{domain}/
├── api/           # Commands, Events, Queries (CQRS)
├── application/   # Use cases and application services  
├── domain/        # Domain models, repositories, services
├── infrastructure/# Persistence, messaging, external integrations
└── web/          # REST/GraphQL controllers
```

### 3. Legal Domain Security
- **Multi-tenancy**: Row Level Security (RLS) with subdomain isolation
- **Audit Trail**: Comprehensive logging for all data operations
- **Data Protection**: Encryption at rest and in transit
- **RBAC**: Discord-style permissions (Permission + Scope + Role)

## Frontend Architecture Patterns

### Vue 3 Component Development
```vue
<script setup lang="ts">
// 1. Imports (external → internal)
// 2. Props with TypeScript interfaces
// 3. Emits definition
// 4. Reactive state
// 5. Computed properties
// 6. Methods
// 7. Lifecycle hooks
</script>

<template>
  <!-- Semantic HTML with accessibility -->
  <!-- Event handling with proper modifiers -->
</template>

<style scoped>
/* CSS custom properties for design tokens */
/* Responsive design with mobile-first approach */
</style>
```

### State Management with Pinia
- **UI Store**: Global UI state (theme, modals, loading)
- **Matter Store**: Case management with optimistic updates
- **Authentication Store**: User state and permissions
- **Module Stores**: Domain-specific data management

### Storybook-First Development
1. **Storybook Development**: Component isolation with variants
2. **Mock Data Testing**: MSW integration for API mocking
3. **Local Database Testing**: Real PostgreSQL integration
4. **Production-like Testing**: Staging environment validation

## Security Architecture

### Authentication Flow
```
User → Frontend → Spring Security → JWT Validation → Resource Access
                        ↓
               2FA Challenge (TOTP)
```

### Data Protection Strategy
- **Encryption**: AES-256 at rest, TLS 1.3 in transit
- **Access Control**: Row-Level Security for tenant isolation
- **Audit Logging**: All CRUD operations with user context
- **Compliance**: Japanese legal requirements + GDPR

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response | p95 < 200ms | Spring Actuator metrics |
| PDF First Paint | < 1 second | Frontend performance API |
| Search Results | < 500ms | Elasticsearch response time |
| Case Loading | < 300ms | 1000+ cases with pagination |
| Availability | 99.9% | Uptime monitoring |

## Development Workflow

### Quality Gates (Mandatory)
```bash
# Frontend quality checks
bun run typecheck    # TypeScript compilation
bun run test         # Unit tests (Vitest)
bun run lint         # ESLint + Prettier
bun run build-storybook  # Storybook build verification

# Backend quality checks  
./gradlew ktlintCheck    # Kotlin code style
./gradlew test          # Unit tests (JUnit 5)
./gradlew integrationTest  # Integration tests
./gradlew qualityCheck   # All quality checks
```

### Test-Driven Development Process
1. **Red**: Write failing tests based on requirements
2. **Green**: Implement minimal code to pass tests
3. **Refactor**: Clean up code while maintaining tests
4. **Commit**: Only after all quality gates pass

## Deployment Architecture

### Staging Progression
```
Development → Testing → Staging → Production
     ↓           ↓        ↓         ↓
Local Dev    CI Tests   K8s      K8s Prod
```

### Environment Configurations
- **Local**: Docker Compose (PostgreSQL + Redis + MinIO)
- **Staging**: Kubernetes with staging data
- **Production**: Multi-zone Kubernetes with HA database

## Integration Points

### External Systems
- **Courts**: Document submission APIs
- **Email**: SMTP/IMAP for communication
- **Calendar**: Google Calendar + Microsoft Graph integration
- **AI Services**: Google Vertex AI for document processing
- **Messaging**: Slack/Discord webhooks

### Internal APIs
- **REST API**: OpenAPI 3.0 specification with Swagger UI
- **GraphQL**: Complex queries and real-time subscriptions
- **WebSocket**: Real-time updates for Kanban board
- **Event Streaming**: Module communication via Spring Events

## Monitoring & Observability

### Metrics Collection
- **Application**: Spring Actuator + Micrometer
- **Infrastructure**: Prometheus + Grafana
- **Logs**: Structured logging with correlation IDs
- **Tracing**: Distributed tracing for request flows

### Performance Monitoring
- **Backend**: JVM metrics, database connections, API response times
- **Frontend**: Core Web Vitals, bundle size, rendering performance
- **Database**: Query performance, connection pool usage
- **Cache**: Redis hit rates and memory usage

## Future Architecture Considerations

### Scalability Enhancements
- **Microservices Migration**: Spring Modulith → Independent services
- **Event Sourcing**: Audit trail with event store
- **CQRS**: Separate read/write models for performance
- **Multi-region**: Global deployment for disaster recovery

### AI/ML Integration
- **Vector Search**: pgvector for semantic document search
- **RAG Implementation**: Retrieval-Augmented Generation for legal Q&A
- **Document Classification**: Automated categorization
- **Predictive Analytics**: Case outcome prediction

This architecture provides a solid foundation for legal case management while maintaining flexibility for future enhancements and scaling requirements.
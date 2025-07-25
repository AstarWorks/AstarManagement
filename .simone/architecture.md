# Astar Management - System Architecture

## Overview

Astar Management is a **monorepo-based legal practice management system** designed specifically for small-to-medium Japanese law firms (1-10 employees). The system implements **Clean Architecture principles** with strict separation between business domain logic and technical infrastructure, ensuring maintainability and legal compliance.

## Architectural Principles

### 1. Agent-Native Design
- **AI-Human Collaboration**: All operations designed for both manual and AI agent execution
- **CLI/GUI Parity**: Every GUI operation has corresponding CLI/API endpoints
- **Automation-First**: Repetitive tasks automated while maintaining human oversight

### 2. Clean Architecture Implementation
```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Frontend       │  │  REST APIs      │  │  GraphQL    │ │
│  │   (Nuxt.js)     │  │  (Spring Web)   │  │  (Optional) │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Use Cases     │  │   Commands      │  │   Queries   │ │
│  │   (Business     │  │   (CQRS)        │  │   (CQRS)    │ │
│  │    Logic)       │  └─────────────────┘  └─────────────┘ │
│  └─────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                     Domain Layer                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Entities      │  │   Value Objects │  │   Domain    │ │
│  │   (Aggregates)  │  │   (Immutable)   │  │   Services  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Database      │  │   External APIs │  │   File      │ │
│  │   (PostgreSQL)  │  │   (Integrations)│  │   Storage   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 3. Legal Domain-Driven Design
- **Bounded Contexts**: Each legal domain (cases, clients, documents) as separate modules
- **Ubiquitous Language**: Japanese legal terminology throughout codebase
- **Domain Events**: Audit trail through event-driven architecture

## System Components

### Frontend Architecture (Nuxt.js + Vue 3)

```
frontend/app/
├── components/          # UI Components (Atomic Design)
│   ├── ui/             # shadcn-vue base components
│   ├── forms/          # Form components with validation
│   ├── tables/         # Data display components
│   └── legal/          # Legal domain-specific components
├── composables/         # Business Logic (Vue Composition API)
│   ├── useCases/       # Application use cases
│   ├── useAuth/        # Authentication logic
│   └── useApi/         # API integration
├── stores/             # State Management (Pinia)
│   ├── auth.ts         # Authentication state
│   ├── matter.ts       # Legal case state
│   └── ui.ts           # UI state (themes, modals)
├── pages/              # File-based Routing
├── layouts/            # Page layouts
└── middleware/         # Route middleware
```

**Key Patterns:**
- **Storybook-First Development**: Components developed in isolation before integration
- **4-Stage Testing**: Storybook → Mock Data → Local DB → Production
- **Type-Safe APIs**: Full TypeScript integration with backend contracts

### Backend Architecture (Spring Boot + Kotlin)

```
backend/modules/
├── auth/                    # Authentication & Authorization
│   ├── domain/             # User entities, RBAC logic
│   ├── application/        # Login/logout use cases
│   └── infrastructure/     # JWT, 2FA implementation
├── case-management/         # Core legal case management
│   ├── domain/             # Matter entities, status workflows
│   ├── application/        # Case CRUD, status transitions
│   └── infrastructure/     # Database repositories
├── client/                  # Client relationship management
├── document/               # Document management & storage
├── financial/              # Billing, expenses, invoices
└── shared/                 # Common utilities and domain objects
```

**Module Communication:**
- **Spring Modulith**: Enforced module boundaries with event-driven communication
- **Domain Events**: Cross-module communication through published events
- **Clean Boundaries**: No direct dependencies between modules

### Data Architecture

#### PostgreSQL Schema Design
```sql
-- Multi-tenant architecture with Row Level Security
CREATE POLICY tenant_isolation ON matters 
  FOR ALL TO authenticated_users 
  USING (tenant_id = current_setting('app.tenant_id'));

-- Audit trail for all legal operations
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  operation VARCHAR(10) NOT NULL, -- CREATE, UPDATE, DELETE
  user_id UUID NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  old_values JSONB,
  new_values JSONB
);

-- Legal matter lifecycle management
CREATE TABLE matters (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  case_number VARCHAR(20) UNIQUE NOT NULL, -- Format: YYYY-TT-NNNN
  title VARCHAR(255) NOT NULL,
  status matter_status NOT NULL DEFAULT 'INTAKE',
  priority matter_priority NOT NULL DEFAULT 'MEDIUM',
  client_id UUID NOT NULL,
  responsible_lawyer_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Redis Caching Strategy
- **Session Management**: User sessions with 30-minute timeout
- **Application Cache**: Frequently accessed legal forms and templates
- **Rate Limiting**: API rate limiting and brute-force protection

### Security Architecture

#### Multi-layered Security Model
```
┌─────────────────────────────────────────────────────────────┐
│                    Network Security                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Kubernetes    │  │   Network       │  │   TLS/SSL   │ │
│  │   Network       │  │   Policies      │  │   Encryption│ │
│  │   Policies      │  │   (Calico)      │  │   (Cert-Mgr)│ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                 Application Security                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   OAuth2 + JWT  │  │   2FA (TOTP)    │  │   RBAC      │ │
│  │   Authentication│  │   Mandatory     │  │   (Discord  │ │
│  │                 │  │                 │  │    Style)   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    Data Security                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Row Level     │  │   Encryption    │  │   Audit     │ │
│  │   Security      │  │   at Rest       │  │   Logging   │ │
│  │   (Multi-tenant)│  │   (AES-256)     │  │   (Complete)│ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Legal Compliance Features
- **Attorney-Client Privilege**: Encrypted storage with access controls
- **Audit Requirements**: Complete data access trail with immutable logs
- **Data Retention**: Automated backup with legal retention policies
- **Multi-tenancy**: Secure tenant isolation preventing cross-tenant data access

## Deployment Architecture

### Cloud-Native Infrastructure (GCP + Kubernetes)

```
┌─────────────────────────────────────────────────────────────┐
│                     Google Cloud Platform                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                  GKE Cluster                            ││
│  │                                                         ││
│  │  ┌─────────────────┐  ┌─────────────────┐             ││
│  │  │   Frontend      │  │   Backend       │             ││
│  │  │   (Nuxt.js)     │  │   (Spring Boot) │             ││
│  │  │   Pods          │  │   Pods          │             ││
│  │  └─────────────────┘  └─────────────────┘             ││
│  │                                                         ││
│  │  ┌─────────────────┐  ┌─────────────────┐             ││
│  │  │   Ingress       │  │   Services      │             ││
│  │  │   (NGINX)       │  │   (LoadBalancer)│             ││
│  │  └─────────────────┘  └─────────────────┘             ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Cloud SQL     │  │   Cloud Storage │  │   Redis     │ │
│  │   (PostgreSQL)  │  │   (Documents)   │  │   (Cache)   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### GitOps Deployment Pipeline (ArgoCD)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Developer     │    │   GitHub        │    │   ArgoCD        │
│   Commits       │───▶│   Repository    │───▶│   Sync          │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Terraform     │    │   Helm Charts   │    │   Kubernetes    │
│   (Infrastructure) │ │   (Applications)│    │   Cluster       │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Staged Deployment Strategy

#### Stage 1: Core Services (MVP)
- **PostgreSQL**: Primary database with Flyway migrations
- **Redis**: Session management and caching
- **MinIO**: S3-compatible object storage for documents

#### Stage 2: Enhanced Features (Scale-up)
- **Elasticsearch**: Full-text search across legal documents
- **Kibana**: Search analytics and document insights

#### Stage 3: Production Operations (Enterprise)
- **Prometheus + Grafana**: Metrics collection and visualization
- **Jaeger**: Distributed tracing for performance monitoring
- **Alert Manager**: Automated incident response

## Performance & Scalability Targets

### Response Time Goals
- **API Endpoints**: p95 < 200ms
- **Case List Loading**: < 300ms for 1000 cases
- **Document Search**: < 500ms across 10k documents
- **PDF Processing**: < 1 second first paint

### Scalability Design
- **Horizontal Scaling**: Kubernetes HPA based on CPU/memory metrics
- **Database Scaling**: Read replicas for reporting queries
- **Caching Strategy**: Multi-layer caching (Redis + CDN)
- **Auto-scaling**: 2-10 pods based on traffic patterns

## Development Workflow

### Test-Driven Development (TDD)
1. **Red**: Write failing tests first
2. **Green**: Implement minimal code to pass
3. **Refactor**: Clean up while maintaining green tests
4. **Commit**: Only commit when all quality gates pass

### Quality Gates (Mandatory)
```bash
# Frontend Pre-commit Checks
bun run typecheck        # TypeScript compilation
bun run test            # Unit tests (Vitest) 
bun run lint            # ESLint + Prettier
bun run build-storybook # Component library build

# Backend Pre-commit Checks
./gradlew ktlintCheck   # Kotlin code style
./gradlew test          # Unit tests (JUnit 5)
./gradlew integrationTest # Integration tests
./gradlew dependencyCheckAnalyze # Security scanning
```

### Component Development Lifecycle
1. **Storybook**: Develop components in isolation
2. **Mock Data**: Test with realistic legal scenarios
3. **Local Database**: Integration with PostgreSQL
4. **Production**: Deployment with real data validation

## Monitoring & Observability

### Legal Domain-Specific Metrics
- **Case Processing Time**: Average time from intake to resolution
- **Document Processing**: Upload success rates and processing times
- **User Activity**: Lawyer productivity and system usage patterns
- **Compliance Metrics**: Audit log coverage and data access patterns

### Technical Metrics
- **Application Performance**: Response times, error rates, throughput
- **Infrastructure Health**: CPU, memory, disk usage across services
- **Security Monitoring**: Failed authentication attempts, privilege escalations
- **Data Integrity**: Database consistency, backup success rates

This architecture ensures **production-ready enterprise capabilities** while maintaining the flexibility needed for a growing legal practice management system, with particular emphasis on Japanese legal industry requirements and compliance standards.
# Architecture Documentation - Aster Management

## Overview

Aster Management is a comprehensive legal case management system designed to digitize and streamline law firm operations. It addresses the challenges of scattered case files, paper-based workflows, and limited remote work capabilities by providing a centralized, AI-powered platform for case management, document processing, and client communication.

## Core Business Objectives

- **Centralized Data Management**: Unify cases, documents, accounting, and communication history with AI-powered search
- **Visual Case Tracking**: Provide intuitive Kanban-style progress visualization for internal and external stakeholders
- **Mobile-First Notes**: Enable lawyers to capture searchable notes on smartphones
- **Automated Document Processing**: OCR, data extraction, and template-based document generation
- **Efficient Financial Tracking**: Streamline expense and per-diem recording with automated reporting

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Next.js   │  │  React 19    │  │  TypeScript 5    │   │
│  │   App Router│  │  Components  │  │  Tailwind CSS 4  │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────┬───────────────────────────────┘
                              │ REST API / GraphQL
┌─────────────────────────────┴───────────────────────────────┐
│                    Backend (Spring Boot)                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Kotlin    │  │ Spring Boot  │  │  Spring Security │   │
│  │   API Layer │  │    3.5.0     │  │   OAuth2/JWT     │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Spring Data │  │  Spring AI   │  │  Spring Batch    │   │
│  │     JPA     │  │  Vertex AI   │  │  Processing      │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────┐
│                    Data & Infrastructure                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ PostgreSQL  │  │    Redis     │  │  MinIO/GCS       │   │
│  │     15      │  │  Cache/Queue │  │  Object Storage  │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Frontend
- **Framework**: Next.js 15.3.3 with App Router and Turbopack
- **UI Library**: React 19 with TypeScript 5
- **Styling**: Tailwind CSS 4 with Radix UI and shadcn/ui components
- **State Management**: Zustand 5.0.5 with TypeScript support and persist middleware
- **Component Development**: Storybook 9.0.10 for isolated component development and documentation
- **Form Validation**: Zod 3.25.64 for runtime type validation and schema definition
- **Icons**: Lucide-React 0.515.0 for consistent icon system
- **Internationalization**: next-intl for JP/EN support

#### Backend
- **Language**: Kotlin with Java 21 runtime
- **Framework**: Spring Boot 3.5.0 with Spring Modulith
- **Security**: Spring Security with OAuth2 Resource Server (JWT)
- **Database**: Spring Data JPA with Hibernate
- **AI Integration**: Spring AI with Google Vertex AI
- **Batch Processing**: Spring Batch for document processing
- **Caching**: Redis for sessions and cache

#### Infrastructure
- **Database**: PostgreSQL 15 with pgvector for AI search
- **Object Storage**: MinIO (on-prem) / Google Cloud Storage (cloud)
- **Container**: Docker with Kubernetes (GKE/k3s)
- **CI/CD**: GitHub Actions + ArgoCD
- **Monitoring**: Spring Actuator + Prometheus

## Core Design Principles

### 1. Agent-Native Execution Framework
**Revolutionary AI-first architecture** positioning Aster Management as a collaborative human-agent platform:

#### Full Parity Between GUI and CLI (AI-Executable Interface Design)
- Every GUI operation must have a corresponding fully documented CLI interface
- AI agents can operate the system independently and programmatically without GUI constraints
- Users can observe and audit AI agent behavior including task-solving logic and executed commands
- All functionalities, commands, and operational contexts exposed through structured documentation (YAML, Markdown)
- Self-documenting system that serves as both AI knowledge base and auto-generated user guide

#### Ticket-Based Task Delegation to Humans and AI Agents
- All case and task management modeled as discrete, atomic tickets
- Tickets assignable to both human users and AI agents with no interface distinction
- AI agents treated as first-class team members with:
  - Parallel instantiation capability (multiple agents per workspace)
  - Role-based permissions and access scopes identical to humans
  - Conversational task delegation interface for collaborative human-agent workflows

**Implementation Constraint**: These principles are non-negotiable architectural requirements that guide all future design and development decisions.

## Key Design Decisions

### 1. Modular Monolith Architecture
Using Spring Modulith to create a modular monolith that can be easily decomposed into microservices when needed. This provides:
- Clear module boundaries
- Event-driven communication between modules
- Easy testing and deployment
- Future microservices migration path

### 2. AI-First Document Processing
Integration with Google Vertex AI for:
- OCR and document digitization
- Intelligent data extraction
- Natural language search
- Automated document generation
- Smart case insights

### 3. Discord-Style RBAC
Flexible role-based access control with:
- Three default roles: Lawyer, Clerk, Client
- Granular permissions (CRUD + export + settings)
- Customizable role definitions
- Audit trail for all permission changes

### 4. Cloud/On-Prem Parity
Designed for deployment flexibility:
- Cloud: GKE + Cloud SQL + GCS + Artifact Registry
- On-prem: k3s + PostgreSQL + MinIO + Harbor
- Infrastructure as Code with Terraform
- GitOps deployment with ArgoCD

## Core Modules

### 1. Authentication & Authorization
- JWT-based authentication with refresh tokens
- Two-factor authentication (2FA) mandatory
- Discord-style RBAC with customizable permissions
- Session management with Redis

### 2. Case Management
- CRUD operations for legal cases
- Kanban board visualization with drag-and-drop
- Status tracking with timestamps
- SLA monitoring and alerts
- Related document linking

### 3. Document Management
- PDF upload and viewing
- OCR processing with queuing
- Full-text search indexing
- Version control
- Template-based generation

### 4. Communication Hub
- Client memo system
- Internal notes
- Email/Slack/Discord integration
- Phone call logging
- Searchable communication history

### 5. Financial Management
- Expense tracking with receipt photos
- Per-diem recording
- CSV export for accounting
- Cost analysis per case
- Automated reporting

### 6. AI Services
- Natural language search across all data
- Smart document classification
- Automated data extraction
- Next-action suggestions
- Case outcome predictions

## Frontend Architecture Patterns

### State Management with Zustand
The frontend uses Zustand for predictable state management with the following store patterns:

- **UI Store**: Global UI state (theme, sidebar, modals, loading states)
- **Matter Store**: Case management data with optimistic updates for Kanban operations
- **Selector Hooks**: Optimized re-renders using Zustand selectors
- **Immer Integration**: Immutable state updates with draft mutations

### Component Development with Storybook
Component development follows isolated patterns:

- **Story-driven Development**: Components developed in isolation with comprehensive examples
- **shadcn/ui Integration**: Pre-built components documented with usage patterns
- **Interaction Testing**: Component behavior testing within Storybook environment
- **Design System**: Visual documentation of component variants and states

### Type-Safe Forms with Zod
Form handling uses runtime validation patterns:

- **Schema Definition**: Zod schemas in `src/lib/schemas/` for all forms and API contracts
- **Runtime Validation**: Client-side validation with server-side schema sharing
- **Error Handling**: Structured error messages with field-level feedback
- **Type Inference**: Automatic TypeScript types from Zod schemas

### Icon System with Lucide-React
Consistent iconography throughout the application:

- **Legal Domain Icons**: Specialized icons for legal case management (Scale, FileText, etc.)
- **Size Consistency**: Standardized sizing using Tailwind CSS utilities
- **Button Integration**: Seamless integration with shadcn/ui button components
- **Performance**: Tree-shaking for optimal bundle size

## Security Architecture

### Authentication Flow
```
User → Frontend → Spring Security → JWT Validation → Resource Access
                          ↓
                    2FA Challenge (if required)
```

### Data Protection
- Encryption at rest (database)
- Encryption in transit (TLS)
- Field-level encryption for sensitive data
- Audit logging for all data access
- GDPR compliance features

## Integration Points

### External Systems
- **Courts**: Document submission APIs
- **Banks**: Form generation and submission
- **Email**: SMTP/IMAP integration
- **Messaging**: Slack/Discord webhooks
- **OCR**: Google Document AI
- **AI**: Google Vertex AI

### Internal APIs
- RESTful API with OpenAPI 3.0 specification
- GraphQL endpoint for complex queries
- WebSocket for real-time updates
- Event streaming for module communication

## Performance Targets

- **API Response**: p95 < 200ms
- **PDF First Paint**: < 1 second
- **Search Results**: < 500ms
- **OCR Processing**: < 30 seconds per page
- **System Availability**: 99.9% (cloud), best-effort (on-prem)

## Development Workflow

### Local Development
```bash
# Backend
cd backend
./gradlew bootRun

# Frontend
cd frontend
bun dev
```

### Testing Strategy
- Unit tests with JUnit 5 and Jest
- Integration tests with Testcontainers
- E2E tests with Playwright
- Performance tests with k6
- Security scanning with OWASP tools

### Test-Driven Development (TDD)

- Follow the principles of Test-Driven Development (TDD) as a default approach.
- Begin by writing tests based on the expected input and output.
- Do not write any implementation code at this stage—only the tests.
- Run the tests and confirm that they fail as expected.
- Once test correctness is confirmed, commit the failing tests.
- Then, begin implementing the code to make the tests pass.
- During implementation, do not modify the tests—focus solely on fixing the code.
- Repeat this process until all tests pass.

## Future Enhancements

### Phase 2 Features
- Vector search with pgvector for semantic search
- Advanced RAG-based AI chat interface
- Real-time collaboration features
- Mobile native apps (React Native)
- Blockchain integration for document verification

### Technical Improvements
- Event sourcing for audit trail
- CQRS for read/write separation
- GraphQL federation
- Service mesh (Istio)
- Multi-region deployment

## Constraints & Considerations

- Must support both Japanese and English
- Paper documents remain part of workflow
- Compliance with Japanese legal requirements
- Integration with legacy systems (NAS, FAX)
- Offline capability for court visits

## Key Success Metrics

- **User Adoption**: 80% daily active users
- **Process Efficiency**: 50% reduction in document processing time
- **Search Accuracy**: 95% relevant results
- **System Reliability**: < 5 minutes downtime per month
- **Cost Reduction**: 30% reduction in operational costs
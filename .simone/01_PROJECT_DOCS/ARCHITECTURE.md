# Astar Management - System Architecture

## Overview

Astar Management is a **monorepo-based legal practice management system** designed specifically for small-to-medium Japanese law firms (1-10 employees). The system implements **Clean Architecture principles** with strict separation between business domain logic and technical infrastructure, ensuring maintainability and legal compliance.

## Core Mission

**解決する4つのコア課題**:
1. **情報の分散と重複入力** - 一元管理による効率化
2. **非効率な書類管理** - デジタル化とAI活用
3. **案件進捗の可視化不足** - カンバン形式での直感的管理  
4. **複雑な報酬・会計管理** - 自動化と見える化

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

## Technology Stack

### Frontend (Nuxt 3 + Vue 3)
- **Framework**: Nuxt 3.17.5 with App Router
- **UI Components**: shadcn-vue + Radix Vue primitives
- **State Management**: Pinia with persistence for offline capability
- **Form Validation**: VeeValidate + Zod for runtime type safety
- **Testing**: Vitest + Storybook for component development
- **Icons**: Lucide Vue Next exclusively
- **Package Manager**: Bun for fAstar development cycles

### Backend (Spring Boot + Kotlin)
- **Architecture**: Clean Architecture (Domain → Application → Infrastructure → Presentation)
- **Database**: PostgreSQL 15 with Flyway migrations
- **Security**: Spring Security with JWT + 2FA mandatory
- **API Documentation**: SpringDoc OpenAPI (Swagger)
- **Testing**: JUnit 5 + Testcontainers + MockK

### Legal Domain Specific Requirements
- **Data Security**: 弁護士・依頼者間の秘匿特権を保護
- **Audit Trail**: 全データアクセスのログ記録必須
- **Multi-tenancy**: Row Level Security (RLS) with subdomain isolation
- **RBAC**: Discord-style permissions (Permission + Scope + Role)

## Development Philosophy

### Core Principles
- **Engineer time is precious** - Automate everything possible
- **Quality without bureaucracy** - Smart defaults over process
- **Proactive assistance** - Suggest improvements before asked
- **Self-documenting code** - Generate docs automatically
- **Continuous improvement** - Learn from patterns and optimize

### Storybook-First Development Process
**Stage 1: Storybook Development**
- Create `.stories.ts` file with component variants
- Define mock data that represents real legal scenarios
- Test component in isolation with different props
- Verify responsive design and accessibility

**Stage 2: Mock Data Testing**
- Create mock API responses using realistic legal data
- Test component with MSW (Mock Service Worker)  
- Verify error states and loading states

**Stage 3: Local Database Testing**
- Test with real local PostgreSQL data
- Verify tenant isolation works correctly
- Test with large datasets (1000+ cases/clients)
- Check audit logging functions properly

**Stage 4: Production-like Testing**
- Test in staging environment with production data structure
- Verify performance meets targets (< 300ms case loading)
- Test cross-browser compatibility
- Validate with legal professionals for UX

## Performance & Scalability Targets

### Response Time Goals
- **API Endpoints**: p95 < 200ms
- **PDF Processing**: < 1 second first paint  
- **Search Results**: < 500ms (Elasticsearch)
- **File Upload**: Progress feedback every 100ms

### Legal Domain Specific Performance
- **Case List Loading**: < 300ms for 1000 cases
- **Document Search**: < 200ms across 10k documents
- **Tenant Data Isolation**: No performance impact over single-tenant
- **Audit Log Writing**: Async, non-blocking

## Security Architecture

Based on the comprehensive security design document, the system implements:

- **Defense in Depth**: Multiple layers of security controls
- **Zero Trust Security**: All access verified regardless of source
- **Principle of Least Privilege**: Minimal necessary permissions
- **OWASP Top 10 Compliance**: Full coverage of common vulnerabilities

### Authentication & Authorization
- **JWT + 2FA**: Mandatory two-factor authentication
- **RBAC**: Role-based access control with fine-grained permissions
- **Session Management**: Secure session handling with Redis
- **Audit Logging**: Complete access trail for compliance

---

*This architecture document serves as the foundation for all development work on the Astar Management system.*
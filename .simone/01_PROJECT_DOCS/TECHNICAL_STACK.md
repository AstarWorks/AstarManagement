# Technical Stack & Development Guidelines

## Frontend Technology Stack

### Core Framework
- **Nuxt 3.17.5** - Modern Vue.js meta-framework with SSR/SPA hybrid
- **Vue 3** - Composition API with `<script setup lang="ts">`
- **TypeScript** - Strict typing for enhanced developer experience

### UI & Styling
- **shadcn-vue** - Copy-paste component library with Radix Vue primitives
- **Tailwind CSS 4.1.11** - Utility-first CSS framework
- **Lucide Vue Next** - Consistent icon system
- **Reka UI 2.3.2** - Headless UI components for accessibility

### State Management & Data
- **Pinia 3.0.3** - Modern state management with TypeScript support
- **TanStack Vue Query** - Server state management and caching
- **VueUse 13.5.0** - Composition utilities collection

### Form Handling & Validation
- **VeeValidate 4.15.1** - Form validation library
- **Zod 4.0.5** - Runtime type validation and schema definition
- **@vee-validate/zod** - Integration between VeeValidate and Zod

### Testing & Development
- **Vitest** - Fast unit testing framework
- **Storybook 8.4.1** - Component development and documentation
- **MSW (Mock Service Worker)** - API mocking for development and testing
- **Playwright** - E2E testing framework

### Package Management
- **Bun** - Ultra-fast JavaScript runtime and package manager (30x faster installs)

## Backend Technology Stack

### Core Framework
- **Spring Boot 3.x** - Enterprise Java application framework
- **Kotlin** - Modern JVM language with null safety
- **Spring WebFlux** - Reactive web framework for high concurrency

### Database & Persistence
- **PostgreSQL 15** - Advanced open-source relational database
- **Flyway** - Database migration management
- **Spring Data JPA** - Data access abstraction layer
- **Redis** - Session storage and caching

### Security
- **Spring Security 6** - Comprehensive security framework
- **JWT (JSON Web Tokens)** - Stateless authentication
- **2FA (Two-Factor Authentication)** - Enhanced security for legal data
- **OWASP Compliance** - Security best practices implementation

### API & Documentation
- **SpringDoc OpenAPI** - API documentation generation (Swagger)
- **REST APIs** - RESTful web services
- **WebSocket** - Real-time communication support

### Testing
- **JUnit 5** - Unit testing framework
- **Testcontainers** - Integration testing with Docker
- **MockK** - Mocking framework for Kotlin

## Development Environment

### Development Tools
- **Docker & Docker Compose** - Containerized development environment
- **IntelliJ IDEA** - Recommended IDE with Kotlin support
- **VS Code** - Alternative IDE with excellent Vue/TypeScript support

### Version Control & CI/CD
- **Git** - Version control system
- **GitHub Actions** - Continuous Integration/Deployment
- **Conventional Commits** - Standardized commit message format

### Quality Assurance
- **ESLint + Prettier** - Code formatting and linting (Frontend)
- **Ktlint** - Kotlin code formatting
- **Detekt** - Kotlin static analysis
- **SonarQube** - Code quality metrics

## Legal Domain Specific Tools

### Compliance & Security
- **Audit Logging** - Complete activity tracking for legal compliance
- **Data Encryption** - At-rest and in-transit encryption
- **Multi-tenant Architecture** - Secure data isolation between law firms
- **GDPR Compliance Tools** - Privacy regulation adherence

### Document Management
- **PDF.js** - PDF viewing and annotation
- **Document Versioning** - Track document changes and history
- **Template Engine** - Legal document generation from templates

### Integration Capabilities
- **Calendar Integration** - Google Calendar, Microsoft Exchange
- **Email Integration** - Automatic email archiving and threading
- **Accounting Software APIs** - Integration with Japanese accounting systems

## Performance & Monitoring

### Performance Targets
- **API Response Time**: p95 < 200ms
- **Frontend Load Time**: < 2 seconds first contentful paint
- **Database Queries**: < 100ms for standard operations
- **Concurrent Users**: Support for 50+ simultaneous users

### Monitoring & Observability
- **Application Metrics** - Custom metrics for legal workflow tracking
- **Error Tracking** - Comprehensive error logging and alerting
- **Performance Monitoring** - Real-time performance metrics
- **Security Monitoring** - Audit trail analysis and alerting

## Development Workflow

### Code Quality Gates
```bash
# Frontend Quality Checks
bun run typecheck    # TypeScript compilation check
bun run test         # Unit tests (Vitest)
bun run lint         # ESLint + Prettier
bun run build-storybook  # Storybook build verification

# Backend Quality Checks
./gradlew ktlintCheck    # Kotlin code style
./gradlew test          # Unit tests (JUnit 5)
./gradlew integrationTest  # Integration tests
```

### Testing Strategy
1. **Unit Tests** - Individual component/function testing
2. **Integration Tests** - API and database integration testing
3. **E2E Tests** - Complete user workflow testing
4. **Storybook Testing** - Component isolation testing
5. **Performance Testing** - Load and stress testing

### Deployment Pipeline
1. **Development** - Local development with Docker Compose
2. **Staging** - Kubernetes staging environment
3. **Production** - High-availability Kubernetes cluster

---

*This technical stack is optimized for legal practice management requirements with emphasis on security, compliance, and developer productivity.*
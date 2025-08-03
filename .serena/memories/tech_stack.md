# Aster Management Technology Stack

## Frontend
- **Framework**: Nuxt.js 4.0.1 with Vue 3 and TypeScript 5
- **UI Library**: shadcn-vue components with Radix Vue
- **State Management**: Pinia 3.0 with TypeScript support
- **Styling**: Tailwind CSS 4.1 with PostCSS
- **Package Manager**: Bun 1.2.16 for enhanced performance
- **Form Handling**: VeeValidate with Zod validation
- **Icons**: Lucide Vue Next
- **Testing**: Vitest with Vue Test Utils, Happy DOM
- **Documentation**: Storybook 9.0

## Backend
- **Language**: Kotlin with Java 21 runtime
- **Framework**: Spring Boot 3.5.0 with Spring Modulith
- **Security**: Spring Security with OAuth2 Resource Server (JWT)
- **Database**: PostgreSQL 15 with Spring Data JPA
- **Cache**: Redis for session management and caching
- **ORM**: Hibernate with JPA
- **Database Migration**: Flyway
- **API Documentation**: SpringDoc OpenAPI (Swagger)
- **Build Tool**: Gradle with Kotlin DSL
- **Code Quality**: Detekt, SpotBugs, OWASP Dependency Check, SonarQube

## Infrastructure
- **Container**: Docker with Kubernetes (GKE/k3s)
- **CI/CD**: GitHub Actions + ArgoCD
- **Object Storage**: MinIO (on-prem) / Google Cloud Storage (cloud)
- **Infrastructure as Code**: Terraform

## Development Tools
- **Version Control**: Git
- **Code Quality**: ESLint, TypeScript strict mode
- **Testing**: Unit tests, Integration tests, E2E tests
- **Performance**: Lighthouse, performance monitoring
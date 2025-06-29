# Aster Management

A comprehensive legal case management system designed to digitize and streamline law firm operations.

## Technology Stack

### Frontend
- **Framework**: Nuxt.js 3.17.5 with Vue 3 and TypeScript 5
- **UI Library**: Vue 3 with Composition API and shadcn-vue components
- **State Management**: Pinia 2.0 with TypeScript support
- **Package Manager**: Bun 1.2.16 for enhanced performance

### Backend
- **Language**: Kotlin with Java 21 runtime
- **Framework**: Spring Boot 3.5.0 with Spring Modulith
- **Security**: Spring Security with OAuth2 Resource Server (JWT)
- **Database**: PostgreSQL 15 with Spring Data JPA

### Infrastructure
- **Container**: Docker with Kubernetes (GKE/k3s)
- **CI/CD**: GitHub Actions + ArgoCD
- **Object Storage**: MinIO (on-prem) / Google Cloud Storage (cloud)

## Getting Started

### Prerequisites
- Java 21
- Bun 1.2.16+
- PostgreSQL 15
- Redis

### Quick Start

1. Clone the repository
```bash
git clone https://github.com/your-org/aster-management.git
cd aster-management
```

2. Start the backend
```bash
cd backend
./gradlew bootRun
```

3. Start the frontend
```bash
cd frontend
bun install
bun dev
```

## Project Structure

```
aster-management/
├── backend/               # Spring Boot Kotlin backend
├── frontend/              # Nuxt.js Vue 3 frontend
├── docs/                  # Documentation
├── .github/               # GitHub Actions workflows
└── infrastructure/        # Infrastructure as Code
```

## Development

See the [Developer Guide](docs/developer-guide/getting-started.md) for detailed development instructions.

## License

This project is proprietary software. All rights reserved.
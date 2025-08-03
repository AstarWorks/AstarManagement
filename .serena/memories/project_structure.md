# Astar Management Project Structure

## Root Directory Structure
```
/IdeaProjects/AstarManagement/
├── frontend/              # Nuxt.js Vue 3 frontend application
├── backend/               # Spring Boot Kotlin backend application
├── database/              # Database related files
├── infrastructure/        # Infrastructure as Code (Terraform, K8s)
├── docs/                  # Project documentation
├── scripts/               # Build and deployment scripts
├── config/                # Configuration files
├── tests/                 # Integration and E2E tests
├── .github/               # GitHub Actions workflows
├── .claude/               # Claude-specific configuration
├── .serena/               # Serena MCP configuration
├── docker-compose.stage1.yml  # Docker compose for development
├── package.json           # Root package.json with frontend scripts
├── CLAUDE.md             # Claude AI instructions
└── README.md             # Project overview

## Frontend Structure (Nuxt.js)
```
frontend/
├── app/
│   ├── components/       # Vue components
│   ├── composables/      # Vue composables
│   ├── layouts/          # Layout components
│   ├── middleware/       # Route middleware
│   ├── pages/            # Page components (file-based routing)
│   ├── plugins/          # Nuxt plugins
│   ├── stores/           # Pinia state stores
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript type definitions
│   └── schemas/          # Zod validation schemas
├── public/               # Static assets
├── test/                 # Test setup and utilities
├── .storybook/           # Storybook configuration
├── nuxt.config.ts        # Nuxt configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
├── vitest.config.ts      # Vitest test configuration
├── eslint.config.js      # ESLint configuration
└── package.json          # Frontend dependencies and scripts

## Backend Structure (Spring Boot)
```
backend/
├── src/
│   ├── main/
│   │   ├── kotlin/dev/ryuzu/astarmanagement/
│   │   │   ├── modules/           # Spring Modulith modules
│   │   │   │   ├── auth/          # Authentication module
│   │   │   │   ├── case-management/
│   │   │   │   ├── document/
│   │   │   │   ├── financial/
│   │   │   │   └── shared/
│   │   │   ├── infrastructure/    # Infrastructure layer
│   │   │   └── config/           # Spring configuration
│   │   └── resources/
│   │       ├── application.properties
│   │       └── db/migration/      # Flyway migrations
│   └── test/                      # Test files
├── build.gradle.kts               # Gradle build configuration
└── gradle.properties              # Gradle properties

## Documentation Structure
```
docs/
├── 00-overview/          # Project vision and overview
├── 10-requirements/      # Detailed requirements
├── 20-architecture/      # Architecture and design documents
├── 40-specs/            # API specifications
├── 50-tasks/            # Task management and sprints
└── developer-guide/     # Development guides

## Key Configuration Files
- `frontend/nuxt.config.ts` - Nuxt.js configuration
- `frontend/tailwind.config.js` - Tailwind CSS setup
- `frontend/tsconfig.json` - TypeScript configuration
- `backend/build.gradle.kts` - Gradle build configuration
- `backend/src/main/resources/application.properties` - Spring Boot config
- `.github/workflows/` - CI/CD pipelines
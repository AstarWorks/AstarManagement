# Astar Management Project Structure (Updated 2025-08-04)

## Root Directory Structure
```
/IdeaProjects/AstarManagement/
├── frontend/              # Nuxt.js Vue 3 frontend application
├── backend/               # Spring Boot Kotlin backend application
├── database/              # Database related files (PostgreSQL)
├── infrastructure/        # Infrastructure as Code (Terraform, K8s)
├── docs/                  # Project documentation
├── scripts/               # Build and deployment scripts
├── config/                # Configuration files
├── tests/                 # Integration and E2E tests
├── .github/               # GitHub Actions workflows
├── .claude/               # Claude-specific configuration
├── .serena/               # Serena MCP configuration
├── .simone/               # Project management & task tracking
├── docker-compose.stage1.yml  # Docker compose for development
├── package.json           # Root package.json with frontend scripts
├── CLAUDE.md             # Claude AI instructions
└── README.md             # Project overview

## .simone Directory (Project Management)
```
.simone/
├── 00_PROJECT_MANIFEST.md          # Project overview
├── 01_PROJECT_DOCS/                # Technical specifications & architecture
├── 02_REQUIREMENTS/                # Milestone-based requirements
│   └── MILESTONE_002_EXPENSE_BACKEND_IMPLEMENTATION/  # Current focus
├── 03_SPRINTS/                     # Sprint-based task management
├── constitution.md                 # Project constitution
├── architecture.md                 # Architecture overview
└── project.yaml                    # Project configuration

## Frontend Structure (Nuxt.js)
```
frontend/
├── app/
│   ├── components/       # Vue components
│   │   ├── auth/        # Authentication components
│   │   ├── ui/          # shadcn-vue UI components
│   │   ├── layout/      # Layout components  
│   │   ├── cases/       # Case management components
│   │   ├── user/        # User-related components
│   │   └── navigation/  # Navigation components
│   ├── composables/      # Vue composables
│   ├── layouts/          # Layout components
│   ├── middleware/       # Route middleware
│   ├── pages/            # Page components (file-based routing)
│   │   ├── cases/       # Case management pages
│   │   └── login.vue    # Authentication pages
│   ├── stores/           # Pinia state stores
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript type definitions
│   ├── schemas/          # Zod validation schemas
│   ├── config/           # Configuration files
│   ├── locales/          # i18n translation files
│   │   └── ja/          # Japanese translations
│   ├── services/         # API service layers
│   └── mocks/            # Mock data for development
├── public/               # Static assets
├── test/                 # Test setup and utilities
├── .storybook/           # Storybook configuration
├── nuxt.config.ts        # Nuxt configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
├── vitest.config.ts      # Vitest test configuration
├── eslint.config.js      # ESLint configuration
└── package.json          # Frontend dependencies and scripts

## Backend Structure (Spring Boot) - **PACKAGE CHANGED**
```
backend/
├── src/
│   ├── main/
│   │   ├── kotlin/com/astarworks/astarmanagement/  # ← NEW PACKAGE NAME
│   │   │   ├── expense/          # ✅ EXPENSE MODULE (FULLY IMPLEMENTED)
│   │   │   │   ├── domain/
│   │   │   │   │   ├── model/    # Domain entities
│   │   │   │   │   └── repository/ # Repository interfaces
│   │   │   │   ├── infrastructure/
│   │   │   │   │   └── persistence/ # JPA implementations
│   │   │   │   ├── presentation/
│   │   │   │   │   ├── controller/ # REST Controllers
│   │   │   │   │   ├── request/   # Request DTOs
│   │   │   │   │   ├── response/  # Response DTOs
│   │   │   │   │   └── exception/ # Exception handlers
│   │   │   │   └── application/
│   │   │   │       └── mapper/    # Domain ↔ DTO mappers
│   │   │   ├── domain/           # Shared domain layer
│   │   │   ├── infrastructure/   # Infrastructure layer
│   │   │   ├── presentation/     # Web layer
│   │   │   ├── application/      # Application services
│   │   │   └── AstarManagementApplication.kt
│   │   └── resources/
│   │       ├── application.properties
│   │       ├── messages/         # i18n message files
│   │       └── db/migration/     # Flyway migrations
│   └── test/                     # Test files
├── build.gradle.kts              # Gradle build configuration
└── gradle.properties             # Gradle properties

## Documentation Structure
```
docs/
├── 00-overview/          # Project vision and overview
├── 10-requirements/      # Detailed requirements
├── 20-architecture/      # Architecture and design documents
├── 40-specs/            # API specifications
│   ├── 01-api-specifications/  # API specs
│   ├── 02-auth-security/      # Authentication & security
│   ├── 03-database-design/    # Database design
│   ├── 04-feature-specs/      # Feature specifications
│   │   └── expense-input/     # ★ Expense input feature specs
│   └── 05-system-design/      # System design
├── 50-tasks/            # Task management and sprints
└── developer-guide/     # Development guides

## Current Implementation Status

### ✅ Backend (100% Complete)
**Expense Management Module**: Fully implemented and operational
- **Domain Models**: Complete with validation
- **Repository Layer**: JPA implementation with tenant isolation
- **REST API**: Full CRUD with OpenAPI documentation
- **Error Handling**: Multi-language error messages
- **Security**: JWT authentication, tenant isolation (RLS)

```bash
# Backend API Endpoints (Ready for use)
POST   /api/v1/expenses          # Create expense
GET    /api/v1/expenses          # List expenses (with filters)
GET    /api/v1/expenses/{id}     # Get expense details
PUT    /api/v1/expenses/{id}     # Update expense
DELETE /api/v1/expenses/{id}     # Delete expense
POST   /api/v1/expenses/bulk     # Bulk create
GET    /api/v1/expenses/summary  # Statistics

# Tag management
POST   /api/v1/tags             # Create tag
GET    /api/v1/tags             # List tags
PUT    /api/v1/tags/{id}        # Update tag
DELETE /api/v1/tags/{id}        # Delete tag

# File attachments
POST   /api/v1/attachments      # Upload file
GET    /api/v1/attachments/{id} # Download file
```

### ❌ Frontend (Incomplete)
**Navigation Setup Only**: Actual pages/components missing

#### Implemented:
- Navigation config: `/expenses` route ✅
- i18n keys: `navigation.menu.finance.expenses` ✅
- Route guards: `/finance/expenses` permissions ✅

#### Missing (Critical):
- `pages/expenses.vue` ❌
- `pages/expenses/[id].vue` ❌  
- `pages/expenses/create.vue` ❌
- `components/expense/` directory ❌
- `composables/useExpense.ts` ❌
- `composables/useExpenseApi.ts` ❌
- Expense-related UI components ❌

### Next Priority Actions
1. **Immediate**: Implement frontend expense pages (backend API ready)
2. **Short-term**: Expense form components and API integration
3. **Medium-term**: Advanced features (filters, statistics, attachments)

## Key Configuration Files
- `frontend/nuxt.config.ts` - Nuxt.js configuration
- `frontend/tailwind.config.js` - Tailwind CSS setup
- `frontend/tsconfig.json` - TypeScript configuration
- `backend/build.gradle.kts` - Gradle build configuration
- `backend/src/main/resources/application.properties` - Spring Boot config
- `.github/workflows/` - CI/CD pipelines
- `CLAUDE.md` - Claude AI development instructions

## Development Commands
```bash
# Backend (Spring Boot)
cd backend
./gradlew build -x test          # Build without tests
SPRING_PROFILES_ACTIVE=default ./gradlew bootRun  # Run server

# Frontend (Nuxt.js)
cd frontend  
bun run typecheck               # TypeScript check
bun run test                    # Run tests
bun run dev                     # Development server
```
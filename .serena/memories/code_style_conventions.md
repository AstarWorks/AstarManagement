# Code Style and Conventions

## TypeScript/Frontend Conventions

### General Rules
- **NEVER use `any` type in production code**
- Always define proper interfaces and types
- Use strict TypeScript configuration (`strict: true`)
- Prefer type safety over convenience

### Naming Conventions
- **Interfaces**: PascalCase with 'I' prefix (e.g., `IUser`, `ICase`)
- **Type Aliases**: PascalCase (e.g., `UserRole`, `CaseStatus`)
- **Enums**: PascalCase for enum name, UPPER_CASE for members
- **Vue Components**: PascalCase in templates (e.g., `<UserProfile />`)
- **Custom Events**: camelCase (e.g., `@updateUser`)
- **Files**: kebab-case for .vue files, PascalCase for .ts files

### Vue.js Specific
- Use Composition API with `<script setup>` syntax
- Component naming in templates: PascalCase
- Prefer `defineOptions` for component options
- Use explicit emits with `defineEmits`
- HTML self-closing tags for components

### Code Formatting
- Indentation: 2 spaces
- Quotes: Single quotes for strings
- Semicolons: No semicolons (enforced by ESLint)
- Max attributes per line: 3 for single line, 1 for multiline

### Internationalization (i18n)
- **NO hardcoded strings** - Always use `$t('key')` for user-facing text
- Structure keys hierarchically: `auth.login.title`
- Default locale: Japanese (ja)

## Kotlin/Backend Conventions

### General Rules
- Follow Spring Boot best practices
- Use Kotlin idioms (null safety, data classes, etc.)
- Implement proper error handling
- Add audit logging for sensitive operations

### Architecture
- **Modular Monolith**: Using Spring Modulith
- **Event-Driven**: Module communication via events
- **DDD**: Domain-Driven Design principles
- **Clean Architecture**: Separation of concerns

### Security
- Implement tenant isolation for all data operations
- Use Row Level Security (RLS) for multi-tenancy
- Protect attorney-client privilege data
- Never expose or log secrets/keys

## File Organization

### Frontend Structure
```
frontend/
├── app/
│   ├── components/   # UI components (atoms/molecules/organisms)
│   ├── composables/  # Vue composables
│   ├── pages/        # Page components
│   ├── stores/       # Pinia stores
│   ├── utils/        # Utility functions
│   ├── types/        # TypeScript type definitions
│   └── schemas/      # Zod validation schemas
```

### Backend Structure
```
backend/
├── modules/          # Spring Modulith modules
│   ├── auth/         # Authentication module
│   ├── case-management/
│   ├── document/
│   └── shared/
├── infrastructure/   # Infrastructure layer
└── config/          # Configuration files
```
# Project Structure

This guide explains the organization of the Aster Management Nuxt.js project, including directory structure, naming conventions, and file organization patterns.

## Directory Overview

```
frontend-nuxt-poc/
├── .github/                 # GitHub Actions workflows
├── .husky/                  # Git hooks
├── .nuxt/                   # Generated files (git-ignored)
├── .output/                 # Production build output (git-ignored)
├── .storybook/             # Storybook configuration
├── .vscode/                # VS Code workspace settings
├── docs/                   # Project documentation
├── e2e/                    # End-to-end tests
├── k6/                     # Load testing scripts
├── node_modules/           # Dependencies (git-ignored)
├── public/                 # Static assets
├── scripts/                # Build and utility scripts
├── src/                    # Source code
├── tests/                  # Additional test files
├── visual-tests/           # Visual regression tests
├── .env.example            # Environment variables template
├── .eslintrc.js           # ESLint configuration
├── .gitignore             # Git ignore patterns
├── .lighthouserc.js       # Lighthouse CI configuration
├── bun.lock               # Bun lockfile
├── components.json        # shadcn-vue configuration
├── nuxt.config.ts         # Nuxt configuration
├── package.json           # Project metadata
├── playwright.config.ts   # Playwright configuration
├── README.md              # Project documentation
├── tailwind.config.js     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── vitest.config.ts       # Vitest configuration
```

## Source Directory Structure

### `/src` - Application Source Code

```
src/
├── app.vue                 # Root application component
├── error.vue              # Global error page
├── assets/                # Static assets
│   └── css/
│       └── main.css       # Global styles and Tailwind imports
├── components/            # Vue components
├── composables/           # Composition functions
├── config/                # Configuration files
├── constants/             # Application constants
├── layouts/               # Page layouts
├── middleware/            # Route middleware
├── pages/                 # File-based routing
├── plugins/               # Nuxt plugins
├── public/                # Public static files
├── schemas/               # Validation schemas
├── server/                # Server-side code
├── stores/                # Pinia stores
├── types/                 # TypeScript types
└── utils/                 # Utility functions
```

### `/components` - Vue Components

Organized by feature and complexity:

```
components/
├── forms/                 # Form components
│   ├── Form.vue
│   ├── FormInput.vue
│   ├── FormSelect.vue
│   └── __tests__/
├── kanban/                # Kanban board components
│   ├── KanbanBoard.vue
│   ├── KanbanColumn.vue
│   ├── MatterCard.vue
│   └── __tests__/
├── layout/                # Layout components
│   ├── AppHeader.vue
│   ├── AppSidebar.vue
│   └── AppFooter.vue
├── navigation/            # Navigation components
│   ├── MainMenu.vue
│   └── Breadcrumbs.vue
├── ui/                    # Base UI components (shadcn-vue)
│   ├── button/
│   ├── card/
│   ├── dialog/
│   └── ...
└── system/                # System components
    ├── ErrorBoundary.vue
    └── LoadingSpinner.vue
```

### `/composables` - Composition Functions

Business logic and reusable functionality:

```
composables/
├── form/                  # Form-related composables
│   ├── useForm.ts
│   ├── useField.ts
│   └── useValidation.ts
├── useApi.ts             # API utilities
├── useAuth.ts            # Authentication
├── useErrorHandler.ts    # Error handling
├── useIsMobile.ts        # Responsive utilities
├── useKanbanDragDrop.ts  # Drag-and-drop logic
├── useMatterMutations.ts # Matter CRUD operations
├── useMattersQuery.ts    # Matter data fetching
├── useModal.ts           # Modal management
├── useNavigation.ts      # Navigation helpers
├── useOfflineQueue.ts    # Offline support
├── useRealTimeUpdates.ts # WebSocket integration
└── useWebVitals.ts       # Performance monitoring
```

### `/pages` - File-Based Routing

Routes are automatically generated from this structure:

```
pages/
├── index.vue             # / (homepage)
├── login.vue             # /login
├── kanban.vue            # /kanban
├── matters/
│   ├── index.vue         # /matters
│   ├── new.vue           # /matters/new
│   └── [id].vue          # /matters/:id (dynamic)
├── settings/
│   ├── index.vue         # /settings
│   ├── profile.vue       # /settings/profile
│   └── security.vue      # /settings/security
└── dev/
    └── performance-monitor.vue  # /dev/performance-monitor
```

### `/stores` - State Management

Pinia stores organized by domain:

```
stores/
├── auth.ts               # Authentication state
├── kanban.ts             # Kanban board state
├── kanban/               # Modular kanban stores
│   ├── board.ts
│   ├── matters.ts
│   ├── search.ts
│   └── ui-preferences.ts
├── matter.ts             # Matter management
├── modal.ts              # Modal state
├── navigation.ts         # Navigation state
└── ui.ts                 # UI preferences
```

### `/types` - TypeScript Definitions

```
types/
├── components.d.ts       # Auto-generated component types
├── form.d.ts            # Form-related types
├── global.d.ts          # Global type augmentations
├── kanban.ts            # Kanban types
├── matter.ts            # Matter domain types
├── navigation.ts        # Navigation types
├── query.ts             # API query types
└── vitest.d.ts          # Test environment types
```

### `/plugins` - Nuxt Plugins

Auto-loaded extensions:

```
plugins/
├── background-sync.client.ts    # Background sync
├── error-handler.ts             # Global error handling
├── modal-router.client.ts       # Modal routing
├── navigation.client.ts         # Navigation helpers
├── pinia.client.ts             # State management
├── service-worker.client.ts    # PWA support
├── tanstack-query.client.ts    # Data fetching
├── toast.client.ts             # Toast notifications
├── vee-validate.client.ts      # Form validation
├── vue-query.client.ts         # Query client
└── web-vitals.client.ts        # Performance monitoring
```

### `/server` - Server-Side Code

API routes and server utilities:

```
server/
├── api/                  # API endpoints
│   ├── matters.get.ts
│   ├── matters/
│   │   ├── [id].get.ts
│   │   ├── [id].patch.ts
│   │   └── search.get.ts
│   └── auth/
│       └── login.post.ts
├── middleware/           # Server middleware
└── utils/               # Server utilities
```

## Naming Conventions

### Files and Directories

- **Components**: PascalCase (e.g., `MatterCard.vue`)
- **Composables**: camelCase with `use` prefix (e.g., `useMatter.ts`)
- **Stores**: camelCase (e.g., `kanban.ts`)
- **Utils**: camelCase (e.g., `formatDate.ts`)
- **Types**: PascalCase for interfaces/types (e.g., `Matter.ts`)
- **Constants**: UPPER_SNAKE_CASE in files (e.g., `API_ENDPOINTS.ts`)

### Vue Components

```vue
<!-- MatterCard.vue -->
<script setup lang="ts">
// Component logic
</script>

<template>
  <!-- Template with kebab-case attributes -->
  <div class="matter-card">
    <matter-status :status="status" />
  </div>
</template>

<style scoped>
/* BEM-style CSS classes */
.matter-card { }
.matter-card__title { }
.matter-card--active { }
</style>
```

### TypeScript

```typescript
// PascalCase for types and interfaces
interface MatterFormData {
  title: string
  priority: MatterPriority
}

// camelCase for functions and variables
const createMatter = async (data: MatterFormData) => {
  // Implementation
}

// UPPER_SNAKE_CASE for constants
const MAX_RETRIES = 3
```

## Auto-Imports

Nuxt automatically imports these without explicit import statements:

### Vue APIs
- `ref`, `reactive`, `computed`, `watch`, etc.
- `onMounted`, `onUnmounted`, etc.
- `defineProps`, `defineEmits`, `defineExpose`

### Directories
- Components from `~/components`
- Composables from `~/composables`
- Utils from `~/utils`

### Example Usage
```vue
<script setup>
// No imports needed!
const count = ref(0) // Auto-imported from Vue
const { user } = useAuth() // Auto-imported from composables
const formatted = formatDate(new Date()) // Auto-imported from utils
</script>

<template>
  <!-- Components auto-imported -->
  <AppButton @click="count++">
    Count: {{ count }}
  </AppButton>
</template>
```

## Configuration Files

### `nuxt.config.ts`
Main configuration for Nuxt:
- Modules and plugins
- Build settings
- Runtime config
- Route rules

### `tailwind.config.js`
Tailwind CSS configuration:
- Custom colors and themes
- Plugins
- Content paths

### `tsconfig.json`
TypeScript configuration:
- Compiler options
- Path aliases
- Type checking rules

### `vitest.config.ts`
Test configuration:
- Test environment
- Coverage settings
- Mock configurations

## Best Practices

### 1. Component Organization
- Group related components in directories
- Co-locate tests with components
- Use index files for clean imports

### 2. Composable Patterns
- Single responsibility principle
- Return reactive refs
- Handle errors gracefully
- Document parameters and returns

### 3. Store Design
- Keep stores focused
- Use composables for complex logic
- Avoid deeply nested state
- Document store purpose

### 4. Type Safety
- Define interfaces for all data structures
- Use strict TypeScript settings
- Avoid `any` type
- Export shared types

### 5. File Size
- Keep components under 200 lines
- Extract complex logic to composables
- Split large components
- Use async components for heavy features

## Import Aliases

The project uses these path aliases:

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "~/*": ["./src/*"],
      "@/*": ["./src/*"]
    }
  }
}
```

Usage:
```typescript
// Instead of: import { Matter } from '../../../types/matter'
import { Matter } from '~/types/matter'
```

## Environment-Specific Files

### Development
- `.env.development` - Development environment variables
- `*.dev.ts` - Development-only utilities
- `pages/dev/*` - Development tools

### Production
- `.env.production` - Production environment variables
- Build outputs in `.output/`
- Optimized assets in `public/_nuxt/`

### Testing
- `.env.test` - Test environment variables
- `*.test.ts` - Test files
- `*.spec.ts` - Specification tests

## Adding New Features

### 1. Create Component
```bash
# Create component file
touch src/components/feature/NewFeature.vue

# Create test file
touch src/components/feature/__tests__/NewFeature.test.ts
```

### 2. Add Composable
```bash
# Create composable
touch src/composables/useNewFeature.ts

# Create test
touch src/composables/__tests__/useNewFeature.test.ts
```

### 3. Add Route
```bash
# Create page
touch src/pages/new-feature.vue

# Page automatically available at /new-feature
```

### 4. Add Store
```bash
# Create store
touch src/stores/newFeature.ts

# Use in components
const store = useNewFeatureStore()
```

## Code Generation

### Component Template
```bash
# Future: Component generator
bun generate:component MyComponent

# Creates:
# - src/components/MyComponent.vue
# - src/components/__tests__/MyComponent.test.ts
# - src/components/__stories__/MyComponent.stories.ts
```

## Maintenance

### Regular Tasks
1. Clean generated files: `rm -rf .nuxt .output`
2. Update dependencies: `bun update`
3. Check for unused files: `bun analyze`
4. Run type check: `bun typecheck`

### Code Organization Review
- Monthly review of component organization
- Refactor large components
- Extract repeated patterns
- Update documentation
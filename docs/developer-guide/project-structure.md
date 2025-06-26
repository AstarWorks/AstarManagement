# Project Structure - Aster Management Frontend

This guide explains the organization and purpose of each directory and file in the Nuxt.js frontend application.

## Root Directory Structure

```
frontend-nuxt-poc/
├── .nuxt/                  # Generated files (git ignored)
├── .output/                # Build output (git ignored)
├── assets/                 # Uncompiled assets
├── components/             # Vue components
├── composables/            # Vue 3 composition functions
├── content/                # Content files (Markdown, etc.)
├── layouts/                # Nuxt layout components
├── middleware/             # Route middleware
├── node_modules/           # Dependencies (git ignored)
├── pages/                  # File-based routing
├── plugins/                # Nuxt plugins
├── public/                 # Static files
├── server/                 # Server-side code
├── stores/                 # Pinia stores
├── types/                  # TypeScript definitions
├── utils/                  # Utility functions
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
├── bun.lockb              # Bun lock file
├── nuxt.config.ts         # Nuxt configuration
├── package.json           # Package dependencies
├── README.md              # Project documentation
├── tailwind.config.js     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── vitest.config.ts       # Testing configuration
```

## Detailed Directory Breakdown

### `/assets/` - Uncompiled Assets

Assets that need processing by the build system.

```
assets/
├── css/                    # Global stylesheets
│   ├── main.css           # Main stylesheet with Tailwind imports
│   ├── components.css     # Component-specific styles
│   └── utilities.css      # Custom utility classes
├── images/                # Images for processing
│   ├── logos/            # Logo assets
│   ├── icons/            # Custom icons
│   └── backgrounds/      # Background images
└── fonts/                 # Custom fonts
    ├── inter/            # Inter font family
    └── noto-sans-jp/     # Japanese font support
```

**Key Files:**
- `css/main.css`: Entry point for all styles, imports Tailwind CSS
- `images/`: Images that will be optimized during build

### `/components/` - Vue Components

All reusable Vue components organized by purpose and complexity.

```
components/
├── ui/                     # Base UI components (shadcn-vue)
│   ├── Button.vue         # Button component with variants
│   ├── Input.vue          # Form input component
│   ├── Modal.vue          # Modal dialog component
│   ├── Toast.vue          # Toast notification component
│   └── index.ts           # Component exports
├── forms/                  # Form-specific components
│   ├── BaseForm.vue       # Base form wrapper
│   ├── CaseForm.vue       # Case creation/editing form
│   ├── LoginForm.vue      # Authentication form
│   └── SearchForm.vue     # Search input with filters
├── layout/                 # Layout-specific components
│   ├── Header.vue         # Application header
│   ├── Sidebar.vue        # Navigation sidebar
│   ├── Footer.vue         # Application footer
│   └── Breadcrumbs.vue    # Navigation breadcrumbs
├── legal/                  # Domain-specific components
│   ├── KanbanBoard.vue    # Case management Kanban board
│   ├── CaseCard.vue       # Individual case display
│   ├── DocumentViewer.vue # PDF document viewer
│   └── CaseTimeline.vue   # Case activity timeline
├── charts/                 # Data visualization components
│   ├── BarChart.vue       # Bar chart component
│   ├── PieChart.vue       # Pie chart component
│   └── LineChart.vue      # Line chart component
└── common/                 # Common utility components
    ├── LoadingSpinner.vue # Loading indicator
    ├── ErrorBoundary.vue  # Error handling component
    └── DataTable.vue      # Reusable data table
```

**Component Organization Principles:**
- **ui/**: Presentational components, no business logic
- **forms/**: Form components with validation logic
- **layout/**: Components used in layouts
- **legal/**: Business domain-specific components
- **common/**: Shared utility components

### `/composables/` - Composition Functions

Reusable Vue 3 composition functions for business logic.

```
composables/
├── api/                    # API interaction composables
│   ├── useApi.ts          # Base API composable
│   ├── useCases.ts        # Case management API
│   ├── useDocuments.ts    # Document management API
│   ├── useAuth.ts         # Authentication API
│   └── useWebSocket.ts    # WebSocket connections
├── auth/                   # Authentication logic
│   ├── useLogin.ts        # Login functionality
│   ├── usePermissions.ts  # Permission checking
│   └── useSession.ts      # Session management
├── forms/                  # Form handling composables
│   ├── useFormValidation.ts # Form validation logic
│   ├── useFormSubmission.ts # Form submission handling
│   └── useFormState.ts    # Form state management
├── ui/                     # UI-related composables
│   ├── useModal.ts        # Modal management
│   ├── useToast.ts        # Toast notifications
│   ├── useTheme.ts        # Theme switching
│   └── useSidebar.ts      # Sidebar state
└── utils/                  # Utility composables
    ├── useLocalStorage.ts # Local storage management
    ├── useDebounce.ts     # Debounced values
    ├── useAsync.ts        # Async operation handling
    └── useKeyboard.ts     # Keyboard shortcuts
```

**Key Composables:**
- `useApi.ts`: Base API functionality with error handling
- `useCases.ts`: All case-related API operations
- `useAuth.ts`: Authentication state and operations

### `/layouts/` - Layout Components

Nuxt layout components that wrap pages.

```
layouts/
├── default.vue             # Default application layout
├── auth.vue               # Authentication pages layout
├── minimal.vue            # Minimal layout (no sidebar)
└── print.vue              # Print-friendly layout
```

**Layout Structure:**
```vue
<!-- layouts/default.vue -->
<template>
  <div class="app-layout">
    <Header />
    <div class="main-content">
      <Sidebar />
      <main class="page-content">
        <slot />
      </main>
    </div>
    <Footer />
  </div>
</template>
```

### `/middleware/` - Route Middleware

Middleware functions that run before rendering pages.

```
middleware/
├── auth.ts                 # Authentication guard
├── guest.ts               # Guest-only pages (login)
├── admin.ts               # Admin role required
└── case-access.ts         # Case-specific access control
```

**Middleware Example:**
```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return navigateTo('/auth/login')
  }
})
```

### `/pages/` - File-based Routing

Pages that correspond to application routes.

```
pages/
├── index.vue               # Homepage (/)
├── auth/                   # Authentication routes (/auth/*)
│   ├── login.vue          # Login page (/auth/login)
│   ├── register.vue       # Registration (/auth/register)
│   └── forgot-password.vue # Password reset (/auth/forgot-password)
├── dashboard/              # Dashboard routes (/dashboard/*)
│   ├── index.vue          # Main dashboard (/dashboard)
│   ├── analytics.vue      # Analytics page (/dashboard/analytics)
│   └── settings.vue       # Settings page (/dashboard/settings)
├── cases/                  # Case management routes (/cases/*)
│   ├── index.vue          # Cases list (/cases)
│   ├── [id].vue           # Case details (/cases/:id)
│   ├── new.vue            # Create case (/cases/new)
│   └── [id]/              # Nested case routes
│       ├── edit.vue       # Edit case (/cases/:id/edit)
│       ├── documents.vue  # Case documents (/cases/:id/documents)
│       └── timeline.vue   # Case timeline (/cases/:id/timeline)
├── documents/              # Document routes (/documents/*)
│   ├── index.vue          # Documents list (/documents)
│   ├── [id].vue           # Document viewer (/documents/:id)
│   └── upload.vue         # Document upload (/documents/upload)
└── error.vue              # Error page
```

**Page Component Structure:**
```vue
<!-- pages/cases/[id].vue -->
<template>
  <div>
    <h1>{{ case.title }}</h1>
    <!-- Page content -->
  </div>
</template>

<script setup lang="ts">
// Page metadata
definePageMeta({
  title: 'Case Details',
  middleware: ['auth', 'case-access']
})

// Data fetching
const route = useRoute()
const { data: case } = await useCase(route.params.id)
</script>
```

### `/plugins/` - Nuxt Plugins

Plugins that extend Nuxt functionality.

```
plugins/
├── api.client.ts           # Client-side API configuration
├── auth.client.ts          # Authentication setup
├── pinia.ts               # Pinia store setup
├── toast.client.ts        # Toast notification setup
├── vue-query.client.ts    # TanStack Query setup
└── websocket.client.ts    # WebSocket connection setup
```

**Plugin Example:**
```typescript
// plugins/vue-query.client.ts
import { VueQueryPlugin } from '@tanstack/vue-query'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueQueryPlugin, {
    queryClient: new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutes
        },
      },
    }),
  })
})
```

### `/public/` - Static Files

Static assets served directly by the web server.

```
public/
├── favicon.ico             # Website favicon
├── manifest.json          # PWA manifest
├── robots.txt             # SEO robots file
├── sitemap.xml            # SEO sitemap
├── icons/                 # App icons for PWA
│   ├── icon-192.png       # 192x192 icon
│   └── icon-512.png       # 512x512 icon
└── images/                # Static images
    ├── logo.svg           # Company logo
    └── placeholder.jpg    # Placeholder image
```

### `/server/` - Server-side Code

Server-side API routes and middleware (Nuxt 3 full-stack).

```
server/
├── api/                    # API routes
│   ├── auth/              # Authentication endpoints
│   │   ├── login.post.ts  # Login endpoint
│   │   └── refresh.post.ts # Token refresh
│   ├── cases/             # Case management endpoints
│   │   ├── index.get.ts   # Get cases list
│   │   ├── index.post.ts  # Create case
│   │   └── [id].get.ts    # Get specific case
│   └── upload.post.ts     # File upload endpoint
└── middleware/             # Server middleware
    ├── cors.ts            # CORS configuration
    └── auth.ts            # Server-side auth middleware
```

### `/stores/` - Pinia Stores

State management with Pinia stores.

```
stores/
├── auth.ts                 # Authentication state
├── cases.ts               # Case management state
├── documents.ts           # Document management state
├── ui.ts                  # UI state (modals, sidebar, etc.)
└── websocket.ts          # WebSocket connection state
```

**Store Structure:**
```typescript
// stores/auth.ts
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  
  const isAuthenticated = computed(() => !!token.value)
  
  const login = async (credentials: LoginCredentials) => {
    // Login logic
  }
  
  return {
    user: readonly(user),
    token: readonly(token),
    isAuthenticated,
    login
  }
})
```

### `/types/` - TypeScript Definitions

TypeScript type definitions for the application.

```
types/
├── api.ts                  # API request/response types
├── auth.ts                # Authentication types
├── case.ts                # Case management types
├── document.ts            # Document types
├── user.ts                # User types
├── form.ts                # Form validation types
└── index.ts               # Main type exports
```

**Type Definition Example:**
```typescript
// types/case.ts
export interface Case {
  id: string
  title: string
  description: string
  status: CaseStatus
  clientId: string
  lawyerId: string
  createdAt: Date
  updatedAt: Date
}

export type CaseStatus = 'draft' | 'active' | 'on-hold' | 'completed' | 'archived'

export interface CreateCaseRequest {
  title: string
  description: string
  clientId: string
}
```

### `/utils/` - Utility Functions

Pure utility functions for common operations.

```
utils/
├── format.ts               # Formatting utilities
├── validation.ts          # Validation helpers
├── date.ts                # Date manipulation
├── currency.ts            # Currency formatting
├── string.ts              # String utilities
└── file.ts                # File handling utilities
```

## Configuration Files

### `nuxt.config.ts` - Nuxt Configuration

Main configuration file for the Nuxt.js application.

```typescript
export default defineNuxtConfig({
  // Modules
  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/tailwindcss',
    'shadcn-nuxt'
  ],
  
  // CSS
  css: ['~/assets/css/main.css'],
  
  // TypeScript
  typescript: {
    strict: true,
    typeCheck: true
  },
  
  // Runtime config
  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET,
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE
    }
  }
})
```

### `package.json` - Dependencies

Project dependencies and scripts.

```json
{
  "name": "aster-management-frontend",
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "preview": "nuxt preview",
    "test": "vitest",
    "typecheck": "nuxt typecheck"
  },
  "dependencies": {
    "nuxt": "^3.17.5",
    "vue": "^3.3.4",
    "@pinia/nuxt": "^0.5.1",
    "@tanstack/vue-query": "^5.0.0"
  },
  "devDependencies": {
    "@nuxt/devtools": "latest",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

### `tailwind.config.js` - Tailwind Configuration

Tailwind CSS configuration with custom theme.

```javascript
module.exports = {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './nuxt.config.{js,ts}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        }
      }
    }
  }
}
```

## Development Workflow

### File Creation Patterns

When creating new files, follow these patterns:

1. **Components**: Use PascalCase, place in appropriate subdirectory
2. **Composables**: Use camelCase with "use" prefix
3. **Pages**: Use kebab-case for URLs, PascalCase for components
4. **Types**: Use PascalCase for interfaces, camelCase for type aliases
5. **Utilities**: Use camelCase for functions

### Import Conventions

```typescript
// External libraries first
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// Internal imports
import type { User } from '~/types/user'
import { useApi } from '~/composables/api/useApi'
```

### File Naming Conventions

- **Components**: `PascalCase.vue` (e.g., `CaseCard.vue`)
- **Composables**: `camelCase.ts` (e.g., `useCases.ts`)
- **Pages**: `kebab-case.vue` (e.g., `case-details.vue`)
- **Types**: `camelCase.ts` (e.g., `apiTypes.ts`)
- **Utilities**: `camelCase.ts` (e.g., `formatDate.ts`)

## Best Practices

### Directory Organization

1. **Group by Feature**: Keep related files close together
2. **Consistent Naming**: Use established naming conventions
3. **Logical Hierarchy**: Organize by complexity and purpose
4. **Clear Separation**: Separate concerns into appropriate directories

### File Structure

1. **Single Responsibility**: Each file should have one clear purpose
2. **Reasonable Size**: Keep files under 300 lines when possible
3. **Clear Exports**: Use clear, descriptive export names
4. **Documentation**: Include JSDoc comments for complex logic

This project structure provides a solid foundation for building scalable, maintainable Vue.js applications with clear separation of concerns and logical organization.
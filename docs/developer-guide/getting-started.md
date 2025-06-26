# Getting Started - Aster Management Frontend

This guide will help you set up the development environment and get the Nuxt.js frontend running locally.

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

- **Node.js**: Version 18.0 or later (LTS recommended)
- **Bun**: Version 1.2.16 or later (primary package manager)
- **Git**: Latest version for version control
- **VS Code**: Recommended IDE with extensions

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "Vue.volar",
    "Vue.vscode-typescript-vue-plugin",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-playwright.playwright",
    "vitest.explorer"
  ]
}
```

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/aster-management.git
cd aster-management
```

### 2. Install Bun (if not already installed)

```bash
# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"

# Verify installation
bun --version
```

### 3. Navigate to Frontend Directory

```bash
cd frontend-nuxt-poc
```

### 4. Install Dependencies

```bash
# Install all dependencies using Bun
bun install

# This is significantly faster than npm install
# Expect installation to complete in 10-30 seconds
```

### 5. Environment Configuration

Copy the environment template and configure your local settings:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# API Configuration
NUXT_PUBLIC_API_BASE=http://localhost:8080/api
NUXT_PUBLIC_WS_URL=ws://localhost:8080/ws

# Authentication
NUXT_AUTH_SECRET=your-super-secret-jwt-secret-here
NUXT_PUBLIC_AUTH_PROVIDER=local

# Database (for development)
DATABASE_URL=postgresql://postgres:password@localhost:5432/aster_dev

# Optional: AI Services
GOOGLE_AI_API_KEY=your-google-ai-key
OPENAI_API_KEY=your-openai-key

# Development
NUXT_DEVTOOLS=true
NODE_ENV=development
```

## Development Server

### Start the Development Server

```bash
# Start Nuxt development server
bun dev

# Alternative with specific port
bun dev --port 3000

# With HTTPS (for OAuth testing)
bun dev --https
```

The development server will start at:
- HTTP: `http://localhost:3000`
- HTTPS: `https://localhost:3000`

### Development Features

The development server includes:

- **Hot Module Replacement (HMR)**: Instant updates on file changes
- **Vue DevTools**: Integrated Vue 3 debugging tools
- **Nuxt DevTools**: Advanced Nuxt-specific debugging
- **TypeScript Checking**: Real-time type validation
- **ESLint Integration**: Live linting feedback
- **Tailwind CSS IntelliSense**: Class name suggestions

## Backend Setup (Required for Full Functionality)

The frontend requires the Spring Boot backend to be running for full functionality.

### Quick Backend Setup

```bash
# In a separate terminal, navigate to backend
cd ../backend

# Start the backend (requires Java 21)
./gradlew bootRun

# Backend will be available at http://localhost:8080
```

### Database Setup

```bash
# Using Docker for PostgreSQL
docker run -d \
  --name aster-postgres \
  -e POSTGRES_DB=aster_dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:15
```

## Development Workflow

### 1. Code Organization

```
frontend-nuxt-poc/
├── components/          # Vue components
│   ├── ui/             # shadcn-vue components
│   ├── forms/          # Form components
│   └── layout/         # Layout components
├── composables/        # Vue 3 composables
├── pages/              # Nuxt file-based routing
├── layouts/            # Nuxt layouts
├── middleware/         # Route middleware
├── plugins/            # Nuxt plugins
├── server/             # Server-side API routes
├── stores/             # Pinia stores
├── types/              # TypeScript definitions
└── utils/              # Utility functions
```

### 2. Development Commands

```bash
# Development
bun dev                 # Start dev server
bun dev:debug          # Start with Node.js inspector

# Building
bun build              # Production build
bun preview            # Preview production build

# Code Quality
bun typecheck          # TypeScript type checking
bun lint               # ESLint checking
bun lint:fix           # Fix ESLint issues
bun format             # Prettier formatting

# Testing
bun test               # Run unit tests
bun test:ui            # Run tests with UI
bun test:e2e           # Run E2E tests
bun test:coverage      # Generate coverage report

# Storybook
bun storybook          # Start Storybook dev server
bun build-storybook    # Build Storybook for production
```

### 3. Hot Reload and File Watching

The development server automatically watches for changes in:

- `.vue` files (components)
- `.ts` files (TypeScript)
- `.css` files (stylesheets)
- `.md` files (content)
- `nuxt.config.ts` (configuration)

Changes trigger:
- Component hot reload
- Type checking
- Style updates
- Route updates

## First Steps

### 1. Verify Installation

Open your browser to `http://localhost:3000` and you should see:

- Aster Management login page
- Responsive design on mobile
- Vue DevTools icon in the browser console

### 2. Explore the Codebase

Start with these key files:

```bash
# Main application entry
pages/index.vue

# Application layout
layouts/default.vue

# Authentication store
stores/auth.ts

# API composables
composables/useApi.ts

# UI components
components/ui/
```

### 3. Make Your First Changes

Try making a simple change:

1. Open `pages/index.vue`
2. Modify the page title
3. Save the file
4. See the change instantly in your browser

## Common Development Tasks

### Adding a New Page

```bash
# Create a new page file
touch pages/cases/new.vue
```

```vue
<!-- pages/cases/new.vue -->
<template>
  <div>
    <h1>Create New Case</h1>
    <!-- Your content here -->
  </div>
</template>

<script setup lang="ts">
// Page-specific logic
definePageMeta({
  title: 'Create New Case',
  requiresAuth: true
})
</script>
```

### Adding a New Component

```bash
# Create component file
touch components/CaseCard.vue
```

```vue
<!-- components/CaseCard.vue -->
<template>
  <div class="case-card">
    <h3>{{ case.title }}</h3>
    <p>{{ case.description }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  case: {
    id: string
    title: string
    description: string
  }
}

defineProps<Props>()
</script>

<style scoped>
.case-card {
  @apply p-4 border rounded-lg shadow-sm;
}
</style>
```

### Adding a New Composable

```bash
# Create composable file
touch composables/useCases.ts
```

```typescript
// composables/useCases.ts
export function useCases() {
  const cases = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchCases = async () => {
    loading.value = true
    try {
      const { data } = await $fetch('/api/cases')
      cases.value = data
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

  return {
    cases: readonly(cases),
    loading: readonly(loading),
    error: readonly(error),
    fetchCases
  }
}
```

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
bun dev --port 3001
```

**Bun installation issues:**
```bash
# Reinstall Bun
curl -fsSL https://bun.sh/install | bash

# Clear Bun cache
bun pm cache rm
```

**TypeScript errors:**
```bash
# Restart TypeScript service in VS Code
# Command Palette: "TypeScript: Restart TS Server"

# Or rebuild types
bun typecheck
```

**Module resolution errors:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules bun.lockb
bun install
```

### Performance Issues

If the development server is slow:

1. **Check system resources**: Ensure sufficient RAM and CPU
2. **Disable unnecessary extensions**: Reduce VS Code extensions
3. **Use faster storage**: SSD recommended for node_modules
4. **Optimize file watching**: Exclude unnecessary directories

### Getting Help

1. Check the [Troubleshooting Guide](./troubleshooting.md)
2. Review [Common Issues](https://github.com/nuxt/nuxt/issues)
3. Ask on the project Slack/Discord
4. Create an issue with detailed reproduction steps

## Next Steps

Once you have the development environment running:

1. Read the [Architecture Guide](./architecture.md) to understand the system design
2. Review [Vue 3 Patterns](./vue-patterns.md) for coding standards
3. Explore [Component Development](./component-guide.md) for UI patterns
4. Set up [Testing](./testing-guide.md) for your development workflow

## Development Best Practices

### Daily Workflow

1. **Start with fresh dependencies**: `bun install` if package.json changed
2. **Pull latest changes**: `git pull origin main`
3. **Start development server**: `bun dev`
4. **Run tests**: `bun test` before committing
5. **Check types**: `bun typecheck` before pushing
6. **Format code**: `bun format` before committing

### Code Quality

- Use TypeScript for all new code
- Follow Vue 3 Composition API patterns
- Write unit tests for business logic
- Use Storybook for component development
- Follow accessibility guidelines
- Optimize for performance

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/case-management

# Make changes and commit
git add .
git commit -m "feat(cases): add case creation form"

# Push and create PR
git push origin feature/case-management
```

---

*Need help? Check the [Troubleshooting Guide](./troubleshooting.md) or reach out to the development team.*
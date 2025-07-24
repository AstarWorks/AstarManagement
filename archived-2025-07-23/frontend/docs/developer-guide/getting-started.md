# Getting Started

This guide will help you set up your development environment and get the Aster Management Nuxt.js application running locally.

## Prerequisites

### Required Software

- **Node.js**: v20.x or higher
- **Bun**: v1.2.16 or higher (our primary package manager)
- **Git**: Latest version
- **Docker**: For backend services (optional for frontend-only development)

### Recommended Tools

- **VS Code**: With Vue, TypeScript, and Tailwind CSS extensions
- **Chrome/Firefox**: With Vue DevTools extension
- **Postman/Insomnia**: For API testing

## Installation

### 1. Clone the Repository

```bash
# Clone the repository
git clone <repository-url>
cd AsterManagement/frontend-nuxt-poc

# Verify you're on the correct branch
git branch
```

### 2. Install Dependencies

We use Bun for ultra-fast package management:

```bash
# Install all dependencies
bun install

# If you encounter issues, try:
bun install --force
```

### 3. Environment Setup

Create a `.env` file in the project root:

```bash
# Copy the example environment file
cp .env.example .env

# Edit with your configuration
```

Required environment variables:

```env
# API Configuration
NUXT_PUBLIC_API_BASE=http://localhost:8080/api
NUXT_PUBLIC_WS_URL=ws://localhost:8080/ws

# Authentication
NUXT_PUBLIC_AUTH_DOMAIN=localhost
NUXT_PUBLIC_AUTH_CLIENT_ID=aster-frontend

# Feature Flags
NUXT_PUBLIC_ENABLE_2FA=true
NUXT_PUBLIC_ENABLE_WEBSOCKET=true

# Development
NODE_ENV=development
```

### 4. Start Development Server

```bash
# Start the Nuxt development server
bun dev

# The application will be available at:
# http://localhost:3000
```

### 5. Verify Installation

Open your browser and navigate to:
- **Application**: http://localhost:3000
- **Nuxt DevTools**: http://localhost:3000/_nuxt

You should see the Aster Management login page.

## VS Code Setup

### Essential Extensions

Install these VS Code extensions for the best development experience:

```json
{
  "recommendations": [
    "Vue.volar",
    "Vue.vscode-typescript-vue-plugin",
    "bradlc.vscode-tailwindcss",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "antfu.iconify",
    "voorjaar.windicss-intellisense"
  ]
}
```

### VS Code Settings

Add to your workspace settings (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ],
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

## Project Structure Overview

```
frontend-nuxt-poc/
├── src/
│   ├── app.vue              # Root application component
│   ├── assets/              # Static assets (CSS, images)
│   ├── components/          # Reusable Vue components
│   ├── composables/         # Vue composables (business logic)
│   ├── layouts/             # Page layouts
│   ├── middleware/          # Route middleware
│   ├── pages/               # File-based routing
│   ├── plugins/             # Nuxt plugins
│   ├── stores/              # Pinia stores
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Utility functions
├── public/                  # Public static files
├── tests/                   # Test files
├── nuxt.config.ts          # Nuxt configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Project dependencies
```

## Quick Start Commands

### Development

```bash
# Start development server
bun dev

# Start with specific host/port
bun dev --host 0.0.0.0 --port 3001

# Start with HTTPS
bun dev --https
```

### Building

```bash
# Build for production
bun build

# Preview production build
bun preview

# Generate static site
bun generate
```

### Testing

```bash
# Run unit tests
bun test

# Run E2E tests
bun test:e2e

# Run all tests with coverage
bun test:all

# Run tests in watch mode
bun test:watch
```

### Code Quality

```bash
# Lint code
bun lint

# Fix linting issues
bun lint:fix

# Type check
bun typecheck

# Format code
bun format
```

### Performance

```bash
# Analyze bundle size
bun analyze

# Run Lighthouse CI
bun perf:lighthouse

# Profile memory usage
bun perf:memory
```

## Development Tips

### Hot Module Replacement (HMR)

Nuxt provides instant HMR for a smooth development experience:
- Component changes reflect immediately
- State is preserved during updates
- CSS changes apply without reload

### Auto-imports

Nuxt automatically imports:
- Vue APIs (`ref`, `computed`, `watch`, etc.)
- Components from `~/components`
- Composables from `~/composables`
- Utilities from `~/utils`

No need to manually import these!

### TypeScript Support

The project uses strict TypeScript:
- Full type inference for auto-imports
- Component prop types
- Store types with Pinia
- API response types

### Debugging

1. **Browser DevTools**
   - Use Vue DevTools for component inspection
   - Network tab for API calls
   - Performance tab for optimization

2. **VS Code Debugging**
   ```json
   // .vscode/launch.json
   {
     "type": "chrome",
     "request": "launch",
     "name": "Debug Nuxt",
     "url": "http://localhost:3000",
     "webRoot": "${workspaceFolder}/src"
   }
   ```

3. **Console Logging**
   ```typescript
   // Use structured logging
   console.log('[ComponentName]', 'message', { data })
   ```

## Common Issues

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
bun dev --port 3001
```

### Dependency Issues

```bash
# Clear cache and reinstall
rm -rf node_modules .nuxt
bun install --force
bun dev
```

### TypeScript Errors

```bash
# Regenerate types
bun nuxi prepare

# Clear TypeScript cache
rm -rf .nuxt/tsconfig.json
bun dev
```

### Build Failures

```bash
# Clean build artifacts
rm -rf .nuxt .output dist

# Rebuild
bun build
```

## Next Steps

Now that you have the development environment set up:

1. Read the [Architecture Overview](./architecture.md)
2. Explore the [Project Structure](./project-structure.md)
3. Learn about [Vue 3 Patterns](./vue-patterns.md)
4. Start building [Components](./component-guide.md)

## Getting Help

- Check the [Troubleshooting Guide](./troubleshooting.md)
- Ask in the team Slack channel
- Create an issue in the repository
- Refer to the [Nuxt 3 Documentation](https://nuxt.com/docs)
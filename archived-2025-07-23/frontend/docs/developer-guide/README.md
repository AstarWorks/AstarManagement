# Aster Management Developer Guide

Welcome to the comprehensive developer guide for the Aster Management Nuxt.js application. This guide provides everything you need to effectively develop, maintain, and extend the legal case management system.

## 📚 Table of Contents

1. **[Getting Started](./getting-started.md)** - Setup and quick start guide
2. **[Architecture Overview](./architecture.md)** - System design and principles
3. **[Project Structure](./project-structure.md)** - Directory organization and conventions
4. **[Vue 3 Patterns](./vue-patterns.md)** - Composition API best practices
5. **[Component Development](./component-guide.md)** - Building UI components
6. **[State Management](./state-management.md)** - Pinia and TanStack Query patterns
7. **[Form Handling](./form-patterns.md)** - VeeValidate and Zod integration
8. **[Routing & Navigation](./routing.md)** - Page routing and navigation
9. **[Testing Strategies](./testing-guide.md)** - Unit, integration, and E2E testing
10. **[Performance Optimization](./performance.md)** - Speed and efficiency
11. **[Security Practices](./security.md)** - Authentication and authorization
12. **[Deployment Guide](./deployment.md)** - CI/CD and production deployment
13. **[Troubleshooting](./troubleshooting.md)** - Common issues and solutions

## 🚀 Quick Links

### Essential Resources
- [Nuxt 3 Documentation](https://nuxt.com/docs)
- [Vue 3 Documentation](https://vuejs.org/guide/)
- [Project Architecture](../../ARCHITECTURE.md)
- [API Documentation](../api-documentation.md)

### Development Tools
- [VS Code Setup](./getting-started.md#vs-code-setup)
- [Chrome DevTools](./troubleshooting.md#debugging-with-devtools)
- [Vue DevTools](./troubleshooting.md#vue-devtools)

### Key Concepts
- [Composition API](./vue-patterns.md#composition-api)
- [Auto-imports](./project-structure.md#auto-imports)
- [SSR/CSR](./architecture.md#rendering-modes)
- [Type Safety](./vue-patterns.md#typescript-integration)

## 🎯 Development Philosophy

### Core Principles

1. **Type Safety First** - Full TypeScript coverage with strict mode
2. **Composition over Inheritance** - Vue 3 Composition API patterns
3. **Performance by Default** - Optimized bundle sizes and rendering
4. **Accessibility Always** - WCAG compliance in all components
5. **Test Everything** - Comprehensive testing at all levels

### Technology Stack

- **Framework**: Nuxt 3.17.5 with Vue 3
- **Language**: TypeScript 5 with strict mode
- **Styling**: Tailwind CSS with shadcn-vue components
- **State Management**: Pinia + TanStack Query
- **Forms**: VeeValidate + Zod validation
- **Testing**: Vitest + Playwright
- **Build Tool**: Vite with optimized configuration

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Nuxt.js)                     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Pages     │  │  Components  │  │   Composables    │   │
│  │  (Routes)   │  │   (UI/UX)    │  │  (Business Logic)│   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Stores    │  │   Plugins    │  │   Middleware     │   │
│  │   (Pinia)   │  │  (Vue Query) │  │    (Auth/RBAC)   │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────┬───────────────────────────────┘
                              │ REST API / WebSocket
┌─────────────────────────────┴───────────────────────────────┐
│                    Backend (Spring Boot)                      │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Common Tasks

### Creating a New Component
```bash
# Generate component with test
bun run generate:component MyComponent

# Manual creation
touch src/components/MyComponent.vue
touch src/components/__tests__/MyComponent.test.ts
```

### Adding a New Page
```bash
# Create page file
touch src/pages/my-page.vue

# Page will be auto-routed to /my-page
```

### Creating a Store Module
```bash
# Create store file
touch src/stores/my-store.ts

# Store will be auto-imported as useMyStore()
```

### Running Tests
```bash
# Unit tests
bun test

# E2E tests
bun test:e2e

# All tests with coverage
bun test:all
```

## 🔧 Development Workflow

### 1. Setup Development Environment
```bash
# Clone repository
git clone <repository-url>
cd frontend-nuxt-poc

# Install dependencies
bun install

# Start development server
bun dev
```

### 2. Development Cycle
1. Create feature branch
2. Write tests first (TDD)
3. Implement feature
4. Run tests locally
5. Submit pull request
6. Code review and merge

### 3. Code Quality Checks
```bash
# Lint code
bun lint

# Type check
bun typecheck

# Format code
bun format

# Run all checks
bun precommit
```

## 🎨 UI Development

### Component Library
We use **shadcn-vue** for our component library:
- Pre-built accessible components
- Fully customizable with Tailwind CSS
- TypeScript support out of the box
- Radix Vue primitives for behavior

### Design Tokens
```css
/* CSS Variables for theming */
--primary: 222.2 47.4% 11.2%;
--secondary: 210 40% 96.1%;
--accent: 210 40% 96.1%;
--destructive: 0 84.2% 60.2%;
```

### Responsive Design
- Mobile-first approach
- Breakpoints: `sm`, `md`, `lg`, `xl`, `2xl`
- Touch-optimized interactions
- Progressive enhancement

## 📊 State Management

### Client State (Pinia)
- UI state (modals, sidebars)
- User preferences
- Temporary form data

### Server State (TanStack Query)
- API data fetching
- Caching and synchronization
- Optimistic updates
- Real-time subscriptions

## 🔐 Security

### Authentication
- JWT-based authentication
- Refresh token rotation
- Two-factor authentication
- Session management

### Authorization
- Role-based access control (RBAC)
- Route guards
- Component-level permissions
- API request interception

## 📈 Performance

### Key Metrics
- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1
- **Bundle Size**: < 500KB

### Optimization Techniques
- Code splitting
- Lazy loading
- Image optimization
- Caching strategies
- SSR/CSR hybrid

## 🚢 Deployment

### Environments
- **Development**: Local development
- **Staging**: Testing and QA
- **Production**: Live environment

### CI/CD Pipeline
1. Code push triggers pipeline
2. Run tests and quality checks
3. Build Docker image
4. Deploy to environment
5. Run smoke tests

## 📝 Contributing

### Code Style
- Follow Vue 3 Style Guide
- Use TypeScript strict mode
- Write self-documenting code
- Add JSDoc comments for complex logic

### Pull Request Process
1. Create feature branch
2. Write comprehensive tests
3. Update documentation
4. Submit PR with description
5. Address review feedback

## 🆘 Getting Help

### Resources
- Team Slack channel
- Internal wiki
- Code reviews
- Pair programming sessions

### Common Issues
- [Build errors](./troubleshooting.md#build-errors)
- [Test failures](./troubleshooting.md#test-failures)
- [Performance issues](./troubleshooting.md#performance)
- [Deployment problems](./troubleshooting.md#deployment)

## 📖 Additional Documentation

- [Migration Guide](../migration-guide.md) - Migrating from Next.js
- [API Documentation](../api-documentation.md) - Backend API reference
- [Testing Guide](../testing-guide.md) - Comprehensive testing patterns
- [Performance Guide](../performance-optimization.md) - Optimization strategies

---

This guide is a living document. If you find any issues or have suggestions for improvements, please contribute by submitting a pull request or creating an issue.
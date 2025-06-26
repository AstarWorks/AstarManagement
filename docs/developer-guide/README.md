# Developer Guide - Aster Management

Welcome to the Aster Management developer guide. This comprehensive documentation covers everything you need to know to develop, maintain, and extend the Nuxt.js frontend application.

## Table of Contents

1. [Getting Started](./getting-started.md) - Setup and quick start guide
2. [Architecture](./architecture.md) - System architecture and design principles
3. [Project Structure](./project-structure.md) - Directory structure and organization
4. [Vue 3 Patterns](./vue-patterns.md) - Vue 3 Composition API patterns and best practices
5. [Component Development](./component-guide.md) - Component development guidelines
6. [State Management](./state-management.md) - Pinia and TanStack Query patterns
7. [Form Handling](./form-patterns.md) - Form validation and submission patterns
8. [Routing](./routing.md) - Navigation and routing patterns
9. [Testing](./testing-guide.md) - Testing strategies and patterns
10. [Performance](./performance.md) - Optimization guidelines
11. [Security](./security.md) - Security best practices
12. [Deployment](./deployment.md) - Build and deployment processes
13. [Troubleshooting](./troubleshooting.md) - Common issues and solutions

## Quick Reference

### Essential Commands

```bash
# Install dependencies
bun install

# Start development server
bun dev

# Build for production
bun build

# Run tests
bun test

# Type checking
bun typecheck

# Linting
bun lint

# Format code
bun format
```

### Key Technologies

- **Framework**: Nuxt.js 3.17.5
- **Runtime**: Vue 3 with Composition API
- **Language**: TypeScript 5
- **Package Manager**: Bun 1.2.16
- **Styling**: Tailwind CSS + shadcn-vue
- **State Management**: Pinia + TanStack Query
- **Forms**: VeeValidate + Zod
- **Testing**: Vitest + Playwright
- **UI Components**: shadcn-vue + Radix Vue

### Development Principles

1. **TypeScript First**: All code should be properly typed
2. **Composition API**: Use Vue 3 Composition API for all components
3. **Component Isolation**: Develop components in isolation with Storybook
4. **Test-Driven Development**: Write tests before implementation
5. **Performance First**: Optimize for Core Web Vitals
6. **Accessibility**: Follow WCAG 2.1 AA guidelines
7. **Security**: Implement security best practices

## Project Overview

Aster Management is a comprehensive legal case management system built with a modern tech stack. The frontend is a Nuxt.js application that provides:

- **Case Management**: Kanban-style progress tracking
- **Document Management**: PDF viewing and processing
- **Communication Hub**: Client memos and internal notes
- **Financial Tracking**: Expense and per-diem recording
- **AI Integration**: Natural language search and insights

## Architecture Highlights

- **Modular Design**: Clear separation of concerns with composables
- **Type Safety**: Full TypeScript coverage with strict mode
- **Performance**: Optimized for speed with lazy loading and caching
- **Accessibility**: ARIA labels and keyboard navigation
- **Responsive**: Mobile-first design with Tailwind CSS
- **Real-time**: WebSocket integration for live updates

## Contributing

Before contributing, please read through the relevant sections of this guide:

1. Review the [Architecture](./architecture.md) to understand the system design
2. Follow the [Component Development](./component-guide.md) guidelines
3. Write tests following the [Testing Guide](./testing-guide.md)
4. Ensure code quality with our [Performance](./performance.md) guidelines

## Support

If you encounter issues not covered in the [Troubleshooting](./troubleshooting.md) guide, please:

1. Check existing documentation
2. Search for similar issues in the project
3. Create a detailed issue report with reproduction steps

## Maintenance

This documentation is maintained alongside the codebase. When making changes:

- Update relevant documentation sections
- Add new patterns to the appropriate guides
- Keep examples current with the latest code
- Validate all links and references

---

*This guide is generated and maintained as part of the Aster Management project. Last updated: 2025-06-26*
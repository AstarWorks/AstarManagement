# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the Aster Management frontend migration from React/Next.js to Vue/Nuxt.js.

## What are ADRs?

Architecture Decision Records capture important architectural decisions made during the project. Each ADR describes a decision, the context in which it was made, and its consequences.

## ADR Index

### Foundation Decisions
- [ADR-001: Frontend Framework Migration from React/Next.js to Vue/Nuxt.js](./001-frontend-framework-migration.md) - **Accepted**
  - Core decision to migrate to Vue 3/Nuxt.js based on team expertise and project requirements

- [ADR-002: State Management Solution - Pinia vs Vuex](./002-state-management-solution.md) - **Accepted**
  - Adoption of Pinia for state management with TypeScript support

- [ADR-003: Component Library Selection - shadcn-vue](./003-component-library-selection.md) - **Accepted**
  - Using shadcn-vue for customizable, accessible UI components

### Development & Tooling
- [ADR-004: Testing Strategy Migration](./004-testing-strategy-migration.md) - **Accepted**
  - Migration to Vitest + Vue Test Utils for testing

- [ADR-005: Build Tool Selection - Bun vs npm/yarn](./005-build-tool-selection.md) - **Accepted**
  - Adoption of Bun for 30x faster package management

- [ADR-006: TypeScript Configuration Strategy](./006-typescript-configuration-strategy.md) - **Accepted**
  - Strict TypeScript configuration for Vue 3/Nuxt 3

### Architecture Patterns
- [ADR-007: API Integration Pattern - TanStack Query](./007-api-integration-pattern.md) - **Accepted**
  - Using TanStack Query for advanced API state management

- [ADR-008: Routing Strategy - File-based vs Programmatic](./008-routing-strategy.md) - **Accepted**
  - Leveraging Nuxt's file-based routing with enhancements

- [ADR-009: SSR/SPA Hybrid Approach](./009-ssr-spa-hybrid-approach.md) - **Accepted**
  - Hybrid rendering strategy for optimal performance

- [ADR-010: Authentication Flow Migration](./010-authentication-flow-migration.md) - **Accepted**
  - Comprehensive auth system supporting SSR/SPA modes

## How to Create a New ADR

1. Copy the [template.md](./template.md) file
2. Name it with the next number in sequence: `XXX-short-description.md`
3. Fill in all sections of the template
4. Update this index file with the new ADR
5. Link related ADRs where applicable

## ADR Lifecycle

- **Proposed**: Initial draft, open for discussion
- **Accepted**: Decision has been made and will be implemented
- **Rejected**: Decision was considered but not adopted
- **Deprecated**: Decision is no longer relevant
- **Superseded**: Replaced by a newer ADR

## Key Themes

### Migration Strategy
The ADRs collectively support a phased migration approach from React/Next.js to Vue/Nuxt.js, prioritizing:
- Team productivity through familiar tools
- Type safety with TypeScript
- Performance optimization
- Maintainability

### Technology Choices
- **Frontend**: Vue 3 + Nuxt 3
- **State**: Pinia
- **UI**: shadcn-vue + Tailwind CSS
- **Testing**: Vitest + Vue Test Utils
- **Build**: Bun
- **API**: TanStack Query

### Design Principles
1. Developer experience first
2. Type safety throughout
3. Performance by default
4. Flexible architecture
5. Security best practices

## Related Documentation

- [Project Architecture](../../.simone/01_PROJECT_DOCS/ARCHITECTURE.md)
- [API Documentation](../api/README.md)
- [Migration Guide](../../.simone/03_SPRINTS/S05_M02_Migration_Foundation_and_Planning/)
- [Vue 3 Documentation](https://vuejs.org/)
- [Nuxt 3 Documentation](https://nuxt.com/)
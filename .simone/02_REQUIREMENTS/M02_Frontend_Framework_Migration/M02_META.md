---
milestone_id: M02
name: Frontend Framework Migration
status: planning
start_date: 2025-01-21
target_end_date: 2025-03-15
dependencies:
  - M01  # Matter Management MVP must be completed
---

# Milestone M02: Frontend Framework Migration

## Overview

This milestone encompasses the complete migration of the Aster Management frontend from Next.js to Nuxt.js, maintaining feature parity while leveraging Vue's ecosystem advantages.

## Business Rationale

- **Improved SSR Performance**: Nuxt's superior server-side rendering capabilities
- **Simplified Development**: Vue's composition API and auto-imports reduce boilerplate
- **Better Developer Experience**: File-based routing and Vue's reactivity system
- **Long-term Maintainability**: Alignment with team's Vue expertise
- **Cost Optimization**: Potential reduction in build times and infrastructure costs

## Technical Objectives

1. **Complete Framework Migration**
   - Migrate all React components to Vue 3 composition API
   - Replace React-specific libraries with Vue equivalents
   - Maintain 100% feature parity with existing functionality

2. **State Management Transformation**
   - Migrate from Zustand to Pinia
   - Preserve SSR compatibility and optimizations
   - Maintain existing store APIs where possib
3. **Component Library Migration**
   - Migrate from shadcn/ui (React) to shadcn-vue
   - Maintain design consistency and accessibility standards
   - Leverage shadcn-vue's Radix Vue port for headless components

4. **Testing Infrastructure**
   - Migrate from Playwright to Cypress/Playwright for Vue
   - Update unit tests to use Vitest with Vue Test Utils
   - Maintain >80% test coverage

## Success Criteria

- All existing features work identically in Nuxt.js version
- Performance metrics meet or exceed current benchmarks
- Zero regression in accessibility standards
- Smooth deployment with minimal downtime
- Development team trained on Vue/Nuxt best practices

## Risk Mitigation

- **Parallel Development**: Maintain Next.js version during migration
- **Feature Freeze**: No new features during core migration phase
- **Incremental Rollout**: Deploy behind feature flags
- **Rollback Plan**: Maintain ability to revert to Next.js version

## Sprints

### S05: Migration Foundation and Planning
- Technical spike and proof of concept
- Component mapping and library selection
- Migration tooling setup
- ADR documentation

### S06: Core Components Migration
- Layout and navigation components
- Form components and validation
- UI component library setup
- Storybook for Vue configuration

### S07: Feature Migration - Matter Management
- Kanban board with drag-and-drop
- Matter CRUD operations
- Search and filtering
- Real-time updates

### S08: Feature Migration - Advanced Features
- Audit timeline
- Advanced search
- Status transitions
- Error handling and notifications

### S09: Integration and Testing
- API integration finalization
- E2E test suite migration
- Performance optimization
- Security audit

### S10: Deployment and Cutover
- Production deployment strategy
- Feature flag configuration
- Monitoring setup
- Team training and documentation
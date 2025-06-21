# Dependency Analysis Report - React to Vue Migration

## Executive Summary

Total dependencies analyzed: 73
- React-specific: 32 (44%)
- Framework agnostic: 31 (42%)
- Development tools: 10 (14%)

Migration effort estimate: **Medium-High**

## Detailed Analysis

### 1. React-Specific Dependencies

| Package | Version | Purpose | Vue Alternative | Migration Effort |
|---------|---------|---------|-----------------|------------------|
| react | ^19.0.0 | Core framework | vue ^3.x | High |
| react-dom | ^19.0.0 | DOM rendering | Built into vue | High |
| next | 15.3.3 | Meta-framework | nuxt ^3.x | High |
| @radix-ui/react-* | Various | Headless UI components | shadcn-vue (selected) | Low |
| react-hook-form | ^7.57.0 | Form management | vee-validate + zod | Medium |
| @tanstack/react-query | ^5.80.7 | Data fetching | @tanstack/vue-query | Low |
| zustand | ^5.0.5 | State management | pinia | Medium |
| @dnd-kit/core | ^6.3.1 | Drag & drop | vue-draggable-plus | Medium |
| lucide-react | ^0.515.0 | Icons | lucide-vue-next | Low |
| sonner | ^2.0.5 | Toasts | vue-sonner | Low |
| use-debounce | ^10.0.4 | Debounce hook | @vueuse/core | Low |
| react-day-picker | ^9.7.0 | Date picker | @vuepic/vue-datepicker | Medium |

### 2. Framework Agnostic Dependencies

These packages work with both React and Vue without changes:

#### Validation & Forms
- **zod** (^3.25.64) - Schema validation
- **@hookform/resolvers** - Can be adapted for vee-validate

#### HTTP & Data
- **axios** (^1.10.0) - HTTP client
- **jwt-decode** (^4.0.0) - JWT parsing

#### Utilities
- **date-fns** (^4.1.0) - Date manipulation
- **lodash-es** (^4.17.21) - Utility functions
- **uuid** (^11.1.0) - UUID generation
- **immer** (^10.1.1) - Immutable updates

#### Styling
- **tailwindcss** (^4) - CSS framework
- **class-variance-authority** (^0.7.1) - Dynamic classes
- **tailwind-merge** (^3.3.0) - Class merging
- **clsx** (^2.1.1) - Class names utility

#### Performance
- **web-vitals** (^5.0.3) - Core Web Vitals

### 3. Development Dependencies

| Tool | React Version | Vue Alternative | Notes |
|------|---------------|-----------------|-------|
| @storybook/nextjs | ^9.0.10 | @storybook/vue3 | Same Storybook ecosystem |
| @testing-library/react | ^16.3.0 | @testing-library/vue | Similar API |
| eslint-config-next | 15.3.3 | @nuxt/eslint-config | Nuxt-specific |
| @types/react | ^19.0.0 | Not needed | Vue has built-in types |

### 4. Migration Strategy by Package Type

#### Phase 1: Easy Migrations (2-3 days)
- Icon library (lucide-react → lucide-vue-next)
- Toast notifications (sonner → vue-sonner)
- Data fetching (@tanstack/react-query → @tanstack/vue-query)
- Development tools (Storybook, testing libraries)

#### Phase 2: UI Components (1 week)
- Migrate to shadcn-vue (already selected)
- Map Radix UI patterns to shadcn-vue components
- Update component APIs and props

#### Phase 3: Forms & Validation (1 week)
- react-hook-form → vee-validate
- Maintain zod schemas (works with both)
- Update form validation patterns

#### Phase 4: State Management (1 week)
- zustand → pinia
- Maintain store structure
- Update component connections

#### Phase 5: Drag & Drop (3-4 days)
- @dnd-kit → vue-draggable-plus
- Update drag handlers
- Maintain drop zone logic

#### Phase 6: Framework Migration (2-3 weeks)
- Next.js → Nuxt 3
- Update routing
- Migrate API routes
- Update SSR/SSG patterns

### 5. Risk Assessment

#### High Risk Dependencies
1. **@dnd-kit** - Complex drag & drop might need significant refactoring
2. **Next.js specific features** - Image optimization, API routes, middleware
3. **React 19 features** - Server components, suspense boundaries

#### Medium Risk
1. **Form validation patterns** - Different APIs between react-hook-form and vee-validate
2. **State management patterns** - Zustand's middleware might need custom implementation
3. **Custom hooks** - Need conversion to composables

#### Low Risk
1. **Utility libraries** - Most work unchanged
2. **Styling** - Tailwind CSS works identically
3. **Icons and basic UI** - Direct replacements available

### 6. Recommendations

1. **Start with shadcn-vue** - Already selected, provides most UI components
2. **Use @tanstack/vue-query** - Minimal API changes from React version
3. **Leverage @vueuse** - Comprehensive composables library for Vue
4. **Keep zod validation** - Works perfectly with Vue
5. **Consider vue-draggable-plus** - Most similar to @dnd-kit patterns

### 7. Dependencies to Keep

These packages require no changes:
- tailwindcss and related utilities
- axios for API calls
- date-fns for date handling
- lodash-es for utilities
- All development tools (Playwright, MSW, etc.)
- TypeScript and build tools

### 8. Total Migration Effort

- **Time estimate**: 6-8 weeks for complete migration
- **Team size**: 2-3 developers
- **Complexity**: Medium-High due to framework differences
- **Risk level**: Medium with proper planning

## Next Steps

1. Set up Nuxt 3 project with shadcn-vue
2. Create proof of concept with key components
3. Establish migration patterns and guidelines
4. Begin phased migration starting with leaf components
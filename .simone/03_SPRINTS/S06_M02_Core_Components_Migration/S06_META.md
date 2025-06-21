---
sprint_id: S06
milestone_id: M02
name: Core Components Migration
status: ready
start_date: 2025-06-22
target_end_date: 2025-07-05
dependencies:
  - S05  # Migration Foundation and Planning must be completed
---

# Sprint S06: Core Components Migration

## Overview

This sprint focuses on migrating the foundational components from React to Vue 3, establishing the core UI component library, and setting up the essential infrastructure for the Nuxt.js application.

## Sprint Goals

1. **Layout and Navigation Migration**
   - Convert layout components to Vue
   - Implement Nuxt layouts and routing
   - Migrate navigation components

2. **UI Component Library Setup**
   - Configure shadcn-vue components
   - Migrate core UI components (Button, Card, Dialog, etc.)
   - Set up Tailwind CSS with Nuxt

3. **Form Infrastructure**
   - Implement form components in Vue
   - Set up VeeValidate for validation
   - Migrate form utilities and helpers

4. **Development Tools**
   - Configure Storybook for Vue
   - Set up component documentation
   - Establish testing patterns

## Key Deliverables

- Functional Nuxt.js application shell with layouts
- Core UI components migrated and tested
- Form infrastructure ready for feature components
- Storybook configured with component examples
- Testing patterns established with Vitest

## Success Criteria

- [ ] All layout components function identically to React versions
- [ ] shadcn-vue components integrated and customized
- [ ] Forms work with proper validation
- [ ] Storybook displays all migrated components
- [ ] Unit tests achieve >80% coverage
- [ ] No TypeScript errors in migrated code

## Technical Considerations

- Maintain CSS class compatibility for smooth transition
- Preserve accessibility attributes and ARIA labels
- Keep component APIs similar where possible
- Document any breaking changes or API differences

## Risk Factors

- shadcn-vue component differences from React version
- Tailwind CSS configuration complexity
- Form validation pattern differences
- TypeScript typing challenges with Vue

## Dependencies

- Completed S05 tasks (PoC, library research, tooling)
- Access to React codebase for reference
- Vue consultant availability for guidance

## ADRs

*To be linked after creation*

## Sprint Planning

### Task Breakdown

The sprint has been decomposed into 13 specific tasks with clear dependencies and complexity estimates. The original 7 high-level tasks have been split into more granular units to improve parallel development and reduce risk:

## Tasks

### Task Splitting Note

Several high-complexity tasks (T04, T05, T06) have been split into smaller, more manageable tasks to improve development velocity and allow for better parallel work distribution. The original 7 tasks have been expanded to 13 tasks while maintaining the same overall scope.

### Created Tasks (13 Total)

1. **T01_S06: Layout Components Migration** (Complexity: Medium - 8 story points)
   - Migrate core layout components from React to Vue 3
   - Implement Nuxt.js layout system
   - Dependencies: None (can start immediately)

2. **T02_S06: Navigation System Migration** (Complexity: Low - 5 story points)
   - Convert navigation components to Vue 3
   - Implement routing with Nuxt Router
   - Dependencies: T01_S06

3. **T03_S06: Shadcn-vue Setup and Core Configuration** (Complexity: Medium - 8 story points)
   - Configure shadcn-vue component library
   - Set up Tailwind CSS with Nuxt
   - Dependencies: None (can start immediately)

4. **T04_S06: Basic UI Components - Button and Typography** (Complexity: Low - 5 story points)
   - Migrate Button component with all variants
   - Migrate Typography components (Heading, Text, Label)
   - Dependencies: T03_S06
   - *Split from original T04 for parallel development*

5. **T05_S06: Basic UI Components - Card and Badge** (Complexity: Low - 4 story points)
   - Migrate Card components (Card, CardHeader, CardContent, CardFooter)
   - Migrate Badge component with variants
   - Dependencies: T03_S06
   - *Split from original T04 for parallel development*

6. **T06_S06: Basic UI Components - Input and Select** (Complexity: Low - 4 story points)
   - Migrate Input component with validation states
   - Migrate Select/Dropdown components
   - Dependencies: T03_S06
   - *Split from original T04 for parallel development*

7. **T07_S06: Dialog Component Core** (Complexity: Medium - 6 story points)
   - Implement base Dialog/Modal component
   - Set up portal rendering and accessibility
   - Dependencies: T03_S06, T04_S06
   - *Split from original T05 for focused implementation*

8. **T08_S06: Advanced Dialog Features** (Complexity: Medium - 7 story points)
   - Implement dialog state management
   - Add animation and transition support
   - Create composite dialog patterns
   - Dependencies: T07_S06
   - *Split from original T05 for iterative development*

9. **T09_S06: Form Field Components** (Complexity: Medium - 6 story points)
   - Migrate FormField, FormLabel, FormError components
   - Implement field-level validation UI
   - Dependencies: T03_S06, T06_S06
   - *Split from original T06 for parallel work*

10. **T10_S06: VeeValidate Core Setup** (Complexity: Medium - 5 story points)
    - Configure VeeValidate v4 with Zod
    - Create validation composables
    - Dependencies: T03_S06
    - *Split from original T06 for early setup*

11. **T11_S06: Complex Form Patterns** (Complexity: Low - 4 story points)
    - Implement form arrays and nested forms
    - Create form wizard patterns
    - Dependencies: T09_S06, T10_S06
    - *Split from original T06 for specialized patterns*

12. **T12_S06: Storybook Development Tools Setup** (Complexity: Medium - 8 story points)
    - Configure Storybook 7+ for Vue 3
    - Set up addon ecosystem
    - Dependencies: T03_S06
    - *Renamed from original T07*

13. **T13_S06: Component Stories Creation** (Complexity: Low - 4 story points)
    - Create stories for all migrated components
    - Document component APIs and usage
    - Dependencies: T04_S06 through T11_S06, T12_S06
    - *Split from original T07 for documentation focus*

### Total Story Points: 74

### Task Splitting Benefits

1. **Improved Parallelization**: Multiple developers can work on T04-T06 components simultaneously
2. **Reduced Risk**: Smaller tasks are easier to estimate and complete
3. **Better Progress Tracking**: More granular milestones for sprint progress
4. **Flexible Resource Allocation**: Tasks can be assigned based on developer expertise
5. **Early Integration**: Components can be integrated and tested incrementally

### ADR Dependencies Note

Several ADRs need to be created to support these tasks:
- Component architecture patterns for Vue 3
- Form validation strategy with VeeValidate
- State management approach for dialogs/modals
- Testing strategy for Vue components
- Storybook organization patterns

These ADRs should be prioritized early in the sprint to guide implementation decisions.
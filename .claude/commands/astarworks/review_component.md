# Vue SFC Component Review Guidelines

## Overview
This guide provides systematic guidelines for conducting code reviews of Vue Single File Components (SFC).

## Review Target
Review the component: {arg1}

## Review Criteria

### 1. Design Principles Compliance
- [ ] **Simple over Easy** - Is the design simple and easy to understand?
- [ ] **Single Responsibility Principle** - Is the component's responsibility clear and focused on a single role?
- [ ] **Appropriate Abstraction** - Is the abstraction level neither too high nor too low?

### 2. Vue.js Best Practices
- [ ] **Vue 3 Composition API** - Proper usage of Composition API
- [ ] **Reactivity** - Appropriate choice between ref/reactive
- [ ] **Lifecycle** - Execution at appropriate timing
- [ ] **Performance** - Avoiding unnecessary re-renders

### 3. Component Design
- [ ] **Appropriate Size** - Is the component not bloated?
- [ ] **Reusability** - Is the design generic enough for use in other contexts?
- [ ] **Extensibility** - Is the structure adaptable to future requirement changes?
- [ ] **Props/Emit** - Is the interface clear and user-friendly?
- [ ] **Dumb UI Components** - Is the UI kept as "dumb" (logic-free) as possible?
- [ ] **Logic Separation** - Is business logic properly extracted to Composables?
- [ ] **Composable Single Responsibility** - Does each Composable focus on a single responsibility?
- [ ] **Directory Structure** - Are related components properly organized in appropriate directory structures?

### 4. Implementation Quality
- [ ] **TypeScript** - Are type definitions appropriate without using 'any' type?
- [ ] **Type Design** - Avoiding excessive union types (e.g., `string | null | undefined`)
- [ ] **Type Narrowing** - Using proper type guards instead of repeated `||` operators
- [ ] **Explicit Types** - Prefer explicit, well-defined types over complex unions
- [ ] **Zod Validation** - Using Zod schemas for runtime validation and type inference
- [ ] **Internationalization** - No hardcoded strings, properly supporting i18n?
- [ ] **Error Handling** - Is appropriate error handling implemented?
- [ ] **Accessibility** - Does it meet a11y requirements?

### 5. Library Utilization
- [ ] **shadcn/ui** - Are existing UI components properly utilized?
- [ ] **VueUse** - Are utilities used to keep code concise?
- [ ] **Reinventing the Wheel** - Are we avoiding custom implementations for problems that existing solutions can solve?

## Review Process

### Step 1: Preparation
1. Understand the role and responsibilities of the component under review
2. Grasp relationships with related components
3. Confirm business requirements

### Step 2: Static Analysis
1. Check for TypeScript type errors
2. Check for ESLint warnings/errors
3. Verify code formatting consistency

### Step 3: Detailed Review
1. Check sequentially based on the review criteria above
2. Document issues and improvement suggestions
3. Record positive points (for team learning)

### Step 4: Feedback
1. Organize issues by priority
2. Provide specific improvement suggestions
3. Provide code examples as needed

## Architecture Principles

### UI/Logic Separation
- **SFC = View Layer**: Components should focus on presentation and user interaction
- **Composables = Business Logic**: All reactive state and business logic should be encapsulated in Composables
- **Keep UI Dumb**: UI components should have minimal logic, delegating to Composables for state management

### Directory Organization
- Group related components in subdirectories
- Avoid scattering components in the root components directory
- Maintain clear parent-child relationships in folder structure
- Example: `components/expense/form/` for expense form related components

### Type Design Best Practices
- **Avoid Excessive Unions**: Instead of `string | null | undefined`, use optional properties or default values
- **Type Guards Over ||**: Use proper type guards instead of chaining `||` operators
- **Explicit State Modeling**: Model different states explicitly rather than using union types
- **Example**: Instead of `data: T | null | undefined`, use `{ status: 'loading' | 'success' | 'error', data?: T }`
- **Zod for Validation**: Use Zod schemas for form validation, API response validation, and type inference
- **Schema as Source of Truth**: Define Zod schemas and infer TypeScript types from them using `z.infer<typeof schema>`

## Special Considerations

### When Reviewing FilterSelect.vue / FilterGroup.vue
Pay special attention to these components:
- Complexity and maintainability of filtering logic
- Performance with large datasets
- UX (usability and accessibility)
- Consistency with other filter components

## Output Format
Report review results in the following format:

```markdown
## Component: [Component Name]

### Overall Assessment
[Overall evaluation and major findings]

### Good Points
- [Good implementation example 1]
- [Good implementation example 2]

### Areas for Improvement
#### Priority: High
- [Issue]: [Specific improvement suggestion]

#### Priority: Medium
- [Issue]: [Specific improvement suggestion]

#### Priority: Low
- [Issue]: [Specific improvement suggestion]

### Code Examples
[Provide improved code examples as needed]
```
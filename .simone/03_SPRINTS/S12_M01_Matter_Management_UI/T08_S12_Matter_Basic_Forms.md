---
task_id: T08_S12
sprint_sequence_id: S12
status: open
complexity: Medium
last_updated: 2025-06-29T00:00:00Z
---

# Task: Implement Matter Basic Forms

## Description
Develop the core Create and Edit forms for legal matters using the existing form infrastructure. These forms will integrate with the Zod schemas defined in `schemas/matter.ts` and leverage the VeeValidate-based form components already in place. Focus on implementing comprehensive validation, field-level error handling, and responsive layouts.

## Goal / Objectives
- Create fully validated matter creation and editing forms
- Implement proper validation with clear error messaging
- Ensure mobile-responsive form layouts
- Integrate with existing form validation patterns
- Build reusable form field components for matter-specific inputs

## Acceptance Criteria
- [ ] Matter creation form validates all required fields using `createMatterSchema`
- [ ] Matter edit form properly handles partial updates with `updateMatterSchema`
- [ ] All form fields show proper error messages from Zod validation
- [ ] Forms are fully accessible with ARIA labels and keyboard navigation
- [ ] Mobile layout stacks form fields appropriately on small screens
- [ ] Loading states are shown during async operations
- [ ] Success/error notifications display after form submission
- [ ] Form components are reusable and well-documented

## Subtasks
- [ ] Create `MatterForm.vue` base component with form structure
- [ ] Implement `CreateMatterForm.vue` using createMatterSchema validation
- [ ] Implement `EditMatterForm.vue` with partial update support
- [ ] Create matter-specific field components (MatterTypeField, MatterStatusField, etc.)
- [ ] Implement form submission handlers with error handling
- [ ] Add proper loading and error states
- [ ] Write comprehensive unit tests for all form components
- [ ] Add Storybook stories demonstrating form states
- [ ] Implement E2E tests for basic form workflows

## Technical Guidance

### Form Architecture
- Use existing `Form.vue` wrapper component with Zod schema integration
- Leverage `useForm` composable for form state management
- Implement field-level components extending base form inputs
- Use `FormFieldWrapper.vue` for consistent field layout

### Validation Strategy
- Client-side validation using Zod schemas from `schemas/matter.ts`
- Real-time field validation on blur/change
- Form-level validation before submission
- Server-side validation error handling

### Component Structure
```
components/forms/matter/
├── MatterForm.vue              # Base form component
├── CreateMatterForm.vue        # Creation-specific form
├── EditMatterForm.vue          # Edit-specific form
├── fields/
│   ├── MatterTypeField.vue
│   ├── MatterStatusField.vue
│   ├── ClientSelectionField.vue
│   └── MatterDateFields.vue
└── __tests__/
    └── [test files]
```

### Mobile Considerations
- Stack form fields vertically on mobile
- Use appropriate input types for mobile keyboards
- Implement touch-friendly date/time pickers
- Ensure buttons are properly sized for touch

## Implementation Notes
- Follow existing form patterns established in the codebase
- Ensure all text is internationalization-ready
- Use existing UI components from shadcn-vue
- Maintain consistency with design system tokens
- Consider performance with large client lists
- Focus on creating a solid foundation for more advanced features

## Output Log
*(This section is populated as work progresses on the task)*

[YYYY-MM-DD HH:MM:SS] Started task
[YYYY-MM-DD HH:MM:SS] Modified files: file1.js, file2.js
[YYYY-MM-DD HH:MM:SS] Completed subtask: Implemented feature X
[YYYY-MM-DD HH:MM:SS] Task completed
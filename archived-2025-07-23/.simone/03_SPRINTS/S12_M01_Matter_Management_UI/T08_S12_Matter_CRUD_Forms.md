---
task_id: T08_S12
sprint_sequence_id: S12
status: open
complexity: High
last_updated: 2025-06-29T00:00:00Z
---

# Task: Implement Matter CRUD Forms

## Description
Develop comprehensive Create, Read, Update, and Delete forms for legal matters using the existing form infrastructure. These forms will integrate with the Zod schemas defined in `schemas/matter.ts` and leverage the VeeValidate-based form components already in place. The forms must support complex validation, auto-save functionality, multi-step workflows, and proper assignment UI for lawyers and staff.

## Goal / Objectives
- Create fully validated matter creation and editing forms
- Implement auto-save functionality to prevent data loss
- Build intuitive lawyer/staff assignment interface
- Support multi-step form workflow for complex matter creation
- Ensure mobile-responsive form layouts
- Integrate with existing form validation patterns
- Provide clear error messaging and field-level validation feedback

## Acceptance Criteria
- [ ] Matter creation form validates all required fields using `createMatterSchema`
- [ ] Matter edit form properly handles partial updates with `updateMatterSchema`
- [ ] Auto-save triggers after 5 seconds of inactivity and shows save status
- [ ] Lawyer assignment UI supports search and multi-select functionality
- [ ] Form preserves unsaved changes when navigating away (with confirmation)
- [ ] All form fields show proper error messages from Zod validation
- [ ] Forms are fully accessible with ARIA labels and keyboard navigation
- [ ] Mobile layout stacks form fields appropriately on small screens
- [ ] Loading states are shown during async operations
- [ ] Success/error notifications display after form submission

## Subtasks
- [ ] Create `MatterForm.vue` base component with form structure
- [ ] Implement `CreateMatterForm.vue` using createMatterSchema validation
- [ ] Implement `EditMatterForm.vue` with partial update support
- [ ] Build `LawyerAssignmentField.vue` with search and multi-select
- [ ] Add auto-save composable integration using `useAutoSave`
- [ ] Create `MatterFormSteps.vue` for multi-step creation workflow
- [ ] Implement form field components for matter-specific inputs
- [ ] Add form state persistence using `useFormPersistence`
- [ ] Create form submission handlers with error handling
- [ ] Write comprehensive unit tests for all form components
- [ ] Add Storybook stories demonstrating form states
- [ ] Implement E2E tests for complete form workflows

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
├── MatterFormSteps.vue         # Multi-step wrapper
├── fields/
│   ├── LawyerAssignmentField.vue
│   ├── MatterTypeField.vue
│   ├── MatterStatusField.vue
│   └── ClientSelectionField.vue
└── __tests__/
    └── [test files]
```

### State Management
- Use Pinia store for matter data persistence
- Implement optimistic updates for better UX
- Handle conflict resolution for concurrent edits
- Maintain form draft state separately from saved data

### Auto-Save Implementation
- Debounce saves to prevent excessive API calls
- Show save status indicator (saving/saved/error)
- Queue saves when offline and sync when connection restored
- Implement conflict detection for simultaneous edits

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
- Consider performance with large lawyer/client lists
- Implement proper loading and error states
- Add analytics tracking for form completion rates

## Output Log
*(This section is populated as work progresses on the task)*

[YYYY-MM-DD HH:MM:SS] Started task
[YYYY-MM-DD HH:MM:SS] Modified files: file1.js, file2.js
[YYYY-MM-DD HH:MM:SS] Completed subtask: Implemented feature X
[YYYY-MM-DD HH:MM:SS] Task completed
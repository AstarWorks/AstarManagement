---
task_id: T08_S03
sprint_sequence_id: S03
status: open
complexity: Low
last_updated: 2025-01-18T10:00:00Z
---

# Task: Matter Form Components

## Description
Create forms for creating and editing matters with proper validation and error handling. These forms are critical for data entry and must provide a smooth experience with clear validation feedback and accessibility.

## Goal / Objectives
- Create reusable form components for matters
- Implement comprehensive validation with Zod
- Add real-time validation feedback
- Support both create and edit modes
- Ensure full accessibility compliance

## Acceptance Criteria
- [ ] Create matter form validates all required fields
- [ ] Edit form pre-populates with existing data
- [ ] Validation errors show inline with fields
- [ ] Form supports keyboard navigation
- [ ] Japanese input methods work correctly
- [ ] Form state persists during navigation
- [ ] Success/error feedback is clear
- [ ] Forms are mobile-responsive

## Subtasks
- [ ] Create matter form schema with Zod
- [ ] Build form components with react-hook-form
- [ ] Add field-level validation display
- [ ] Implement date and time pickers
- [ ] Create lawyer/clerk selection
- [ ] Add client information section
- [ ] Implement form persistence
- [ ] Test accessibility compliance

## Technical Guidance

### Key Interfaces and Integration Points
- **Form Components**: Create `/frontend/src/components/forms/matter/`
- **Validation**: Use shared Zod schemas with backend
- **State**: Integrate with Zustand for persistence
- **UI**: Use shadcn/ui form components

### Specific Imports and Module References
```typescript
// New form components
/frontend/src/components/forms/matter/CreateMatterForm.tsx
/frontend/src/components/forms/matter/EditMatterForm.tsx
/frontend/src/components/forms/matter/MatterFormFields.tsx

// Schemas
/frontend/src/lib/schemas/matter.ts

// Libraries
react-hook-form
@hookform/resolvers/zod
```

### Existing Patterns to Follow
- Use shadcn/ui form components
- Follow existing validation patterns
- Match backend DTO structure
- Use existing date formatting

### Database Models to Work With
```typescript
// Matter form schema
const matterSchema = z.object({
  title: z.string().min(1).max(255),
  caseNumber: z.string().regex(/^[A-Z0-9-]+$/),
  clientName: z.string().min(1),
  status: z.enum(MatterStatus),
  priority: z.enum(MatterPriority),
  assignedLawyerId: z.string().uuid().optional(),
  assignedClerkId: z.string().uuid().optional(),
  dueDate: z.date().optional(),
  description: z.string().optional()
});
```

## Implementation Notes

### Step-by-Step Implementation Approach
1. Create Zod schemas matching backend
2. Build base form components
3. Add field components with validation
4. Implement lawyer/clerk selection
5. Add date/time pickers
6. Create modal/page wrappers
7. Add form state persistence
8. Test with screen readers

### Key Architectural Decisions to Respect
- Forms must work offline
- Support draft saving
- Validate on client and server
- Maintain type safety

### Testing Approach
- Test all validation rules
- Verify accessibility
- Test Japanese input
- Check mobile usability
- Test form persistence
- Verify API integration

### Performance Considerations
- Debounce validation
- Lazy load date pickers
- Optimize for mobile
- Minimize re-renders

## Output Log
*(This section is populated as work progresses on the task)*
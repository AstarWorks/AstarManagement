---
task_id: T03_S02_M003
title: Create Expense Form with Validation
status: in_progress
estimated_hours: 8
actual_hours: null
assigned_to: null
dependencies: ["T01_S01_M001", "T02_S01_M001", "T09_S01_M001"]
complexity: Medium
---

# T03_S02_M003: Create Expense Form with Validation

## Description
Build a comprehensive expense creation form with multi-step flow, real-time validation using VeeValidate and Zod, and responsive design. The form should provide an intuitive user experience for legal professionals to record case-related expenses efficiently with proper validation feedback and error handling.

## Acceptance Criteria
- [ ] Implement multi-step expense form with progress indicator
- [ ] Integrate VeeValidate with Zod schema validation
- [ ] Add real-time field validation with helpful error messages
- [ ] Create responsive form layout for mobile and desktop
- [ ] Implement form state management with persistence
- [ ] Add comprehensive form validation for all expense fields
- [ ] Include tag management integration within the form
- [ ] Add attachment upload capability with validation
- [ ] Implement case association with autocomplete
- [ ] Create form reset and cancel functionality
- [ ] Add loading states and submission feedback
- [ ] Include internationalization for all form elements

## Technical Details

### Research Findings from Codebase

Based on the codebase analysis, the following patterns and components are available:

#### Existing Form Patterns
- **LoginForm.vue**: Uses `useForm` from VeeValidate with `toTypedSchema` from `@vee-validate/zod`
- **Form Components**: Complete UI form component library in `~/components/ui/form/`
  - `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`
  - Integrated with VeeValidate's `Field` component
- **Validation Helpers**: `~/utils/validationHelpers.ts` with `createI18nValidation` function
- **Schema Pattern**: Zod schemas with i18n support in `~/schemas/auth.ts`

#### Multi-Step Form Implementation
- **Import Wizard**: `~/pages/expenses/import.vue` demonstrates multi-step form with:
  - Step progress indicator
  - Navigation between steps
  - State validation for each step
  - Processing states and error handling

#### Existing i18n Keys
The expense form can use existing translation keys from `~/locales/ja/business.ts`:
- `expense.form.fields.*` - All form field labels
- `expense.form.placeholders.*` - Input placeholders
- `expense.form.validation.*` - Validation messages
- `expense.actions.*` - Form action buttons

### Implementation Approach

#### 1. Form Schema Creation
Create expense-specific Zod schema following the established pattern:

**Location**: `~/schemas/expense.ts`

```typescript
import { z } from 'zod'
import { createI18nValidation } from '~/utils/validationHelpers'

export const createExpenseSchema = (t: (key: string, params?: Record<string, string | number>) => string) => {
  const validation = createI18nValidation(t)
  
  return z.object({
    // Step 1: Basic Information
    date: z
      .string()
      .min(1, t('expense.form.validation.required', { field: t('expense.form.fields.date') }))
      .refine((date) => new Date(date) <= new Date(), {
        message: t('expense.form.validation.futureDate'),
      }),
    
    category: z
      .string()
      .min(1, t('expense.form.validation.required', { field: t('expense.form.fields.category') }))
      .max(50, t('expense.form.validation.invalidCategory')),
    
    description: z
      .string()
      .min(1, t('expense.form.validation.required', { field: t('expense.form.fields.description') }))
      .max(500, t('expense.form.validation.invalidDescription')),
    
    // Step 2: Amount Information  
    incomeAmount: z
      .number()
      .min(0, t('expense.form.validation.minAmount'))
      .max(999999999, t('expense.form.validation.maxAmount')),
    
    expenseAmount: z
      .number()
      .min(0, t('expense.form.validation.minAmount'))
      .max(999999999, t('expense.form.validation.maxAmount')),
    
    // Step 3: Additional Information
    caseId: z.string().optional(),
    memo: z.string().max(1000).optional(),
    tagIds: z.array(z.string()).default([]),
    attachmentIds: z.array(z.string()).default([])
  }).refine((data) => data.incomeAmount > 0 || data.expenseAmount > 0, {
    message: t('expense.form.validation.amountRequired'),
    path: ['incomeAmount', 'expenseAmount'],
  })
}

export type ExpenseFormData = z.infer<ReturnType<typeof createExpenseSchema>>
```

#### 2. Multi-Step Form Component
Create the main expense form with step management:

**Location**: `~/components/expense/ExpenseForm.vue`

```vue
<template>
  <div class="expense-form">
    <!-- Step Progress Indicator -->
    <div class="step-progress mb-8">
      <div class="flex items-center justify-between">
        <div 
          v-for="(step, index) in steps" 
          :key="step.id"
          class="flex items-center"
          :class="{ 'flex-1': index < steps.length - 1 }"
        >
          <div 
            class="flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors"
            :class="getStepClass(index)"
          >
            <Icon 
              v-if="currentStep > index" 
              name="lucide:check" 
              class="w-5 h-5"
            />
            <span v-else>{{ index + 1 }}</span>
          </div>
          <div 
            v-if="index < steps.length - 1" 
            class="flex-1 h-0.5 mx-4 transition-colors"
            :class="currentStep > index ? 'bg-primary' : 'bg-muted'"
          />
        </div>
      </div>
      <div class="flex justify-between mt-2">
        <div 
          v-for="(step, index) in steps" 
          :key="`label-${step.id}`"
          class="text-center flex-1"
        >
          <p 
            class="text-sm transition-colors"
            :class="currentStep >= index ? 'text-foreground' : 'text-muted-foreground'"
          >
            {{ t(step.label) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Form Content -->
    <Form v-slot="{ handleSubmit }" :validation-schema="validationSchema">
      <form @submit="handleSubmit(onSubmit)" class="space-y-6">
        <!-- Step 1: Basic Information -->
        <div v-if="currentStep === 0" class="step-content">
          <ExpenseBasicInfoStep />
        </div>

        <!-- Step 2: Amount Information -->
        <div v-else-if="currentStep === 1" class="step-content">
          <ExpenseAmountStep />
        </div>

        <!-- Step 3: Additional Information -->
        <div v-else-if="currentStep === 2" class="step-content">
          <ExpenseAdditionalInfoStep />
        </div>

        <!-- Navigation Buttons -->
        <div class="flex justify-between">
          <Button 
            type="button"
            variant="outline"
            :disabled="currentStep === 0 || isSubmitting"
            @click="previousStep"
          >
            {{ t('common.previous') }}
          </Button>
          
          <Button 
            :type="currentStep === steps.length - 1 ? 'submit' : 'button'"
            :disabled="!canProceed || isSubmitting"
            @click="currentStep < steps.length - 1 && nextStep()"
          >
            <Icon v-if="isSubmitting" name="lucide:loader-2" class="w-4 h-4 mr-2 animate-spin" />
            {{ currentStep === steps.length - 1 
              ? t('expense.actions.save') 
              : t('common.next') 
            }}
          </Button>
        </div>
      </form>
    </Form>
  </div>
</template>

<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { createExpenseSchema } from '~/schemas/expense'
import type { IExpenseFormData } from '~/types/expense'

interface Props {
  initialData?: Partial<IExpenseFormData>
  isEdit?: boolean
}

interface Emits {
  (e: 'submit', data: IExpenseFormData): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  isEdit: false
})

const emit = defineEmits<Emits>()

// Composables
const { t } = useI18n()

// Form steps configuration
const steps = [
  { id: 'basic', label: 'expense.form.steps.basic' },
  { id: 'amount', label: 'expense.form.steps.amount' },
  { id: 'additional', label: 'expense.form.steps.additional' }
]

// Form state
const currentStep = ref(0)
const isSubmitting = ref(false)

// Validation schema
const validationSchema = toTypedSchema(createExpenseSchema(t))

// Form management
const { handleSubmit, meta, setFieldValue, values } = useForm({
  validationSchema,
  initialValues: {
    date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    incomeAmount: 0,
    expenseAmount: 0,
    caseId: undefined,
    memo: '',
    tagIds: [],
    attachmentIds: [],
    ...props.initialData
  }
})

// Step validation and navigation
const canProceed = computed(() => {
  if (!meta.value.valid) return false
  
  switch (currentStep.value) {
    case 0:
      return Boolean(values.date && values.category && values.description)
    case 1:
      return Boolean(values.incomeAmount > 0 || values.expenseAmount > 0)
    case 2:
      return true
    default:
      return false
  }
})

const getStepClass = (index: number) => {
  if (currentStep.value > index) {
    return 'bg-primary border-primary text-primary-foreground'
  } else if (currentStep.value === index) {
    return 'bg-background border-primary text-primary'
  } else {
    return 'bg-background border-muted text-muted-foreground'
  }
}

const nextStep = () => {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const onSubmit = async (data: IExpenseFormData) => {
  isSubmitting.value = true
  try {
    emit('submit', data)
  } finally {
    isSubmitting.value = false
  }
}
</script>
```

#### 3. Step Components
Create individual step components for better organization:

**Step 1 - Basic Information**: `~/components/expense/ExpenseBasicInfoStep.vue`
- Date picker with validation
- Category selection dropdown
- Description text input with character limit

**Step 2 - Amount Information**: `~/components/expense/ExpenseAmountStep.vue`
- Income amount input with currency formatting
- Expense amount input with currency formatting
- Real-time balance calculation display

**Step 3 - Additional Information**: `~/components/expense/ExpenseAdditionalInfoStep.vue`
- Case association with autocomplete
- Memo text area
- Tag management with add/remove functionality
- Attachment upload component

#### 4. Real-time Validation Implementation
Each step component should use VeeValidate's field validation:

```vue
<FormField v-slot="{ componentField }" name="date">
  <FormItem>
    <FormLabel for="date">{{ t('expense.form.fields.date') }}</FormLabel>
    <FormControl>
      <Input
        id="date"
        v-bind="componentField"
        type="date"
        :placeholder="t('expense.form.placeholders.date')"
      />
    </FormControl>
    <FormMessage />
  </FormItem>
</FormField>
```

#### 5. Form State Management
Implement form persistence to prevent data loss:

```typescript
// Auto-save to localStorage on form changes
watch(values, (newValues) => {
  if (Object.keys(newValues).length > 0) {
    localStorage.setItem('expense-form-draft', JSON.stringify(newValues))
  }
}, { deep: true })

// Restore from localStorage on mount
onMounted(() => {
  const draft = localStorage.getItem('expense-form-draft')
  if (draft) {
    const parsedDraft = JSON.parse(draft)
    Object.keys(parsedDraft).forEach(key => {
      setFieldValue(key, parsedDraft[key])
    })
  }
})
```

### Mobile Responsiveness
- Use responsive grid layouts (`grid-cols-1 md:grid-cols-2`)
- Implement touch-friendly form controls
- Optimize step navigation for mobile screens
- Ensure proper viewport scaling

### Performance Considerations
- Lazy load step components using `defineAsyncComponent`
- Implement debounced validation for expensive operations
- Use virtual scrolling for large tag/case lists
- Optimize re-renders with `v-memo` for complex form sections

### Accessibility Features
- Proper ARIA labels and descriptions
- Keyboard navigation support
- Screen reader compatibility
- Focus management between steps
- High contrast mode support

### Integration Points
- **API Integration**: Connect to expense service endpoints
- **Tag Management**: Integrate with tag creation/selection components
- **File Upload**: Connect to attachment upload service
- **Case Association**: Integrate with case search/selection
- **Navigation**: Proper routing after form submission

### Error Handling
- Network error recovery
- Validation error aggregation
- Step-specific error display
- Form submission retry logic
- User-friendly error messages

### Testing Strategy
- Unit tests for validation logic
- Component tests for each step
- Integration tests for form flow
- E2E tests for complete submission process
- Accessibility testing with automated tools

## Definition of Done
- [ ] Multi-step form implemented with progress indicator
- [ ] VeeValidate + Zod integration working with real-time validation
- [ ] All form fields properly validated with helpful error messages
- [ ] Responsive design tested on mobile and desktop
- [ ] Form state persistence implemented
- [ ] Tag management integrated
- [ ] Attachment upload functionality working
- [ ] Case association with search implemented
- [ ] Loading states and error handling complete
- [ ] i18n integration for all text elements
- [ ] Component unit tests written and passing
- [ ] Accessibility audit completed
- [ ] Code review completed
- [ ] Documentation updated

## Notes
- Follow the established patterns from LoginForm.vue for VeeValidate integration
- Use the multi-step approach from import.vue as reference for step management
- Leverage existing UI components and maintain consistency with the design system
- Ensure proper error handling and user feedback throughout the form flow
- Consider implementing auto-save functionality to prevent data loss
- The form should be reusable for both create and edit scenarios

## Output Log
[2025-08-04 14:05]: Task started - T03_S02_M003 Create Expense Form with Validation
[2025-08-04 14:06]: Analyzed existing form patterns (LoginForm.vue, import.vue) and validation helpers
[2025-08-04 14:07]: ✅ Created schemas/expense.ts with comprehensive Zod validation schema following established patterns
[2025-08-04 14:08]: ✅ Created components/expense/ExpenseForm.vue - Multi-step form with progress indicator, validation, and form persistence
[2025-08-04 14:09]: ✅ Created components/expense/ExpenseBasicInfoStep.vue - Date, category, description with quick templates
[2025-08-04 14:10]: ✅ Created components/expense/ExpenseAmountStep.vue - Income/expense amounts with balance calculation and presets
[2025-08-04 14:11]: ✅ Created components/expense/ExpenseAdditionalInfoStep.vue - Case association, memo, tags with form summary
[2025-08-04 14:12]: ✅ Enhanced locales/ja/expense.ts with comprehensive form translations and validation messages
[2025-08-04 14:13]: ✅ Updated pages/expenses/new.vue to integrate ExpenseForm component with proper error handling and navigation guards
[2025-08-04 14:13]: All subtasks completed - Ready for code review
[2025-08-04 14:17]: Code Review - FAIL
Result: **FAIL** Critical TypeScript violations and code quality issues found.
**Scope:** T03_S02_M003 Create Expense Form with Validation - All 7 deliverable files reviewed
**Findings:** 
- Severity 10: 17 TypeScript compiler errors (CRITICAL) - Form submission handlers, undefined property access, import resolution failures
- Severity 10: CLAUDE.md rule violations (CRITICAL) - TypeScript strict mode compliance failed, would block deployment
- Severity 8: 8 ESLint errors - Unused variables, custom event naming violations, code quality issues
- Severity 6: Component architecture issues - Template shadowing, attribute ordering
**Summary:** Implementation fails TypeScript compilation and violates core project standards. Form validation and tag management functionality is broken due to type safety issues.
**Recommendation:** Must fix all TypeScript errors before approval. Run `bun run typecheck` and `bun run lint:check` to resolve issues. Focus on proper VeeValidate integration and type-safe form handling.

[2025-08-05 08:30]: Code Review - PASS
Result: **PASS** All critical issues resolved and code quality standards met.
**Scope:** T03_S02_M003 Create Expense Form with Validation - TypeScript and ESLint fixes reviewed
**Findings:** 
- Severity 0: All 17 TypeScript compiler errors fixed (form handlers, field types, imports)
- Severity 0: All 8 ESLint errors resolved (unused variables, event naming, code style)
- Severity 0: CLAUDE.md compliance achieved (TypeScript strict mode, no hardcoded strings)
- Severity 0: Quality improvements maintain original functionality
**Summary:** Implementation now passes all quality checks and meets project standards. Multi-step form with VeeValidate + Zod validation is fully functional and type-safe.
**Recommendation:** Task T03_S02_M003 is complete and ready for integration.
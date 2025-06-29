# Complex Form Patterns for React

This directory contains advanced form components and patterns for building complex, multi-step, and dynamic forms in React applications. All components are built with TypeScript, react-hook-form, Zod validation, and shadcn/ui components.

## 📋 Table of Contents

- [Components Overview](#components-overview)
- [Quick Start](#quick-start)
- [Component Reference](#component-reference)
- [Patterns and Examples](#patterns-and-examples)
- [Best Practices](#best-practices)
- [Performance Considerations](#performance-considerations)

## 🧩 Components Overview

### Core Components

| Component | Purpose | Features |
|-----------|---------|----------|
| `MultiStepForm` | Multi-step form wizard | Progress tracking, step validation, navigation, persistence |
| `ConditionalField` | Show/hide fields based on conditions | Animation, field clearing, multiple conditions |
| `FieldArray` | Dynamic arrays of form fields | Add/remove items, drag & drop, validation |

### Hooks

| Hook | Purpose | Features |
|------|---------|----------|
| `useAutoSave` | Automatic form persistence | Debouncing, compression, version control, error handling |
| `useFormPersistence` | Simple form data persistence | localStorage/sessionStorage, auto-restore |
| `useConditionalField` | Conditional field logic | Helper for condition creation |
| `useFieldArrayHelpers` | Field array utilities | Enhanced array operations |

### Examples

| Example | Demonstrates | Complexity |
|---------|--------------|------------|
| `MatterCreationMultiStepForm` | Complete multi-step workflow | Advanced |
| `DocumentUploadForm` | File upload with field arrays | Intermediate |

## 🚀 Quick Start

### Basic Multi-Step Form

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MultiStepForm, createStepConfig } from '@/components/forms'

const stepOneSchema = z.object({
  name: z.string().min(1),
  email: z.string().email()
})

const stepTwoSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1)
})

const steps = [
  createStepConfig({
    id: 'personal',
    title: 'Personal Information',
    schema: stepOneSchema
  }),
  createStepConfig({
    id: 'professional',
    title: 'Professional Details',
    schema: stepTwoSchema
  })
]

function MyForm() {
  const form = useForm({
    resolver: zodResolver(z.object({
      personal: stepOneSchema,
      professional: stepTwoSchema
    }))
  })

  return (
    <MultiStepForm
      steps={steps}
      onSubmit={(data) => console.log(data)}
    >
      {({ currentStep, form }) => (
        <div>
          {currentStep === 0 && (
            <div>
              {/* Step 1 fields */}
            </div>
          )}
          {currentStep === 1 && (
            <div>
              {/* Step 2 fields */}
            </div>
          )}
        </div>
      )}
    </MultiStepForm>
  )
}
```

### Conditional Fields

```tsx
import { ConditionalField, conditionalLogic } from '@/components/forms'

function ConditionalExample() {
  const form = useForm()

  return (
    <Form {...form}>
      <FormField name="hasDriversLicense" />
      
      <ConditionalField
        form={form}
        showWhen={conditionalLogic.isTrue('hasDriversLicense')}
      >
        <FormField name="licenseNumber" />
      </ConditionalField>
    </Form>
  )
}
```

### Field Arrays

```tsx
import { FieldArray } from '@/components/forms'

function ArrayExample() {
  const form = useForm({
    defaultValues: {
      contacts: [{ name: '', email: '' }]
    }
  })

  return (
    <FieldArray
      form={form}
      name="contacts"
      title="Contact Information"
      renderItem={({ index }) => (
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name={`contacts.${index}.name`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`contacts.${index}.email`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      )}
    />
  )
}
```

### Auto-Save

```tsx
import { useAutoSave } from '@/components/forms'

function AutoSaveExample() {
  const form = useForm()
  
  const autoSave = useAutoSave(form, {
    key: 'my-form',
    debounce: 1000,
    onSaveSuccess: () => toast.success('Form saved'),
    onSaveError: (error) => toast.error('Save failed')
  })

  return (
    <div>
      {autoSave.hasSavedData && (
        <Alert>Draft available from {autoSave.lastSave?.toLocaleString()}</Alert>
      )}
      
      <Form {...form}>
        {/* Your form fields */}
      </Form>
    </div>
  )
}
```

## 📖 Component Reference

### MultiStepForm

A comprehensive multi-step form component with progress tracking, validation, and navigation.

#### Props

```tsx
interface MultiStepFormProps {
  steps: StepConfig[]
  initialData?: Record<string, any>
  showProgress?: boolean
  showStepNavigation?: boolean
  allowIncompleteSteps?: boolean
  persistData?: boolean
  autoAdvance?: boolean
  onStepComplete?: (step: number, data: any) => void
  onSubmit?: (data: any) => void
  children: (props: StepRenderProps) => ReactNode
}
```

#### Step Configuration

```tsx
interface StepConfig {
  id: string
  title: string
  description?: string
  schema: z.ZodSchema
  optional?: boolean
  condition?: (formData: any) => boolean
}
```

#### Features

- ✅ Progress indicator with percentage
- ✅ Step navigation with click-to-jump
- ✅ Per-step validation with Zod schemas
- ✅ Automatic form persistence
- ✅ Conditional step rendering
- ✅ Animated transitions
- ✅ Auto-advance after validation
- ✅ Customizable navigation buttons

### ConditionalField

Show or hide form fields based on form values with smooth animations.

#### Props

```tsx
interface ConditionalFieldProps {
  showWhen: (values: any) => boolean
  form: UseFormReturn<any>
  children: ReactNode
  animate?: boolean
  unmountOnHide?: boolean
  clearOnHide?: boolean
  clearFields?: string[]
}
```

#### Conditional Logic Helpers

```tsx
// Built-in condition functions
conditionalLogic.equals('field', 'value')
conditionalLogic.isTrue('field')
conditionalLogic.isNotEmpty('field')
conditionalLogic.contains('arrayField', 'value')
conditionalLogic.and(condition1, condition2)
conditionalLogic.or(condition1, condition2)
conditionalLogic.not(condition)
```

#### Features

- ✅ Smooth show/hide animations
- ✅ Automatic field value clearing
- ✅ Multiple condition types
- ✅ Nested conditional fields
- ✅ Performance optimized

### FieldArray

Dynamic arrays of form fields with add/remove functionality.

#### Props

```tsx
interface FieldArrayProps<T> {
  form: UseFormReturn<T>
  name: FieldArrayPath<T>
  renderItem: (props: FieldArrayItemProps) => ReactNode
  defaultValue?: any
  minItems?: number
  maxItems?: number
  enableReordering?: boolean
  animate?: boolean
  wrapInCards?: boolean
}
```

#### Features

- ✅ Add/remove items with validation
- ✅ Drag and drop reordering
- ✅ Animated item transitions
- ✅ Configurable min/max limits
- ✅ Custom item rendering
- ✅ Built-in validation helpers

### useAutoSave

Advanced auto-save hook with compression, versioning, and error handling.

#### Options

```tsx
interface AutoSaveOptions {
  key: string
  debounce?: number
  storage?: 'localStorage' | 'sessionStorage'
  saveOnlyWhenDirty?: boolean
  maxAge?: number
  compress?: boolean
  version?: string
  exclude?: string[]
  onSave?: (values: any) => Promise<void>
  onSaveSuccess?: (values: any) => void
  onSaveError?: (error: Error) => void
}
```

#### Features

- ✅ Debounced auto-saving
- ✅ Data compression
- ✅ Version control for migration
- ✅ Custom save/load functions
- ✅ Field exclusion
- ✅ Error handling with callbacks

## 🎯 Patterns and Examples

### Pattern 1: Wizard with Conditional Steps

```tsx
const steps = [
  createStepConfig({
    id: 'type',
    title: 'Select Type',
    schema: z.object({ type: z.enum(['individual', 'business']) })
  }),
  createStepConfig({
    id: 'individual',
    title: 'Personal Details',
    schema: individualSchema,
    condition: (data) => data.type?.type === 'individual'
  }),
  createStepConfig({
    id: 'business',
    title: 'Business Details',
    schema: businessSchema,
    condition: (data) => data.type?.type === 'business'
  })
]
```

### Pattern 2: Nested Conditional Fields

```tsx
<ConditionalField showWhen={conditionalLogic.equals('hasAddress', true)}>
  <div className="space-y-4">
    <FormField name="address" />
    
    <ConditionalField 
      showWhen={conditionalLogic.and(
        conditionalLogic.equals('hasAddress', true),
        conditionalLogic.equals('addressType', 'international')
      )}
    >
      <FormField name="country" />
    </ConditionalField>
  </div>
</ConditionalField>
```

### Pattern 3: Dynamic Field Arrays with Types

```tsx
<FieldArray
  form={form}
  name="items"
  renderItem={({ index }) => (
    <div>
      <FormField name={`items.${index}.type`} />
      
      <ConditionalField
        showWhen={(values) => values.items?.[index]?.type === 'custom'}
      >
        <FormField name={`items.${index}.customValue`} />
      </ConditionalField>
    </div>
  )}
/>
```

### Pattern 4: Auto-Save with Custom Storage

```tsx
const autoSave = useAutoSave(form, {
  key: 'complex-form',
  onSave: async (data) => {
    await api.saveDraft(data)
  },
  onLoad: async () => {
    return await api.loadDraft()
  },
  exclude: ['sensitiveField', 'temporaryData']
})
```

## 🏆 Best Practices

### Performance

1. **Use Conditional Logic Helpers**: Pre-built functions are optimized
2. **Minimize Re-renders**: Use specific selectors in watch functions
3. **Debounce Auto-Save**: Set appropriate debounce delays (1-2 seconds)
4. **Exclude Large Fields**: Don't auto-save file objects or large data

### Validation

1. **Per-Step Schemas**: Define schemas for each step separately
2. **Progressive Validation**: Validate as users progress through steps
3. **Clear Error Messages**: Provide specific, actionable error messages
4. **Field Dependencies**: Use conditional validation for dependent fields

### User Experience

1. **Progress Indicators**: Always show progress in multi-step forms
2. **Auto-Save Notifications**: Inform users when data is saved
3. **Draft Recovery**: Allow users to recover unsaved changes
4. **Responsive Design**: Ensure forms work on all screen sizes

### Data Management

1. **Structured Data**: Organize form data by logical sections
2. **Version Control**: Use versioning for form structure changes
3. **Data Migration**: Handle old data formats gracefully
4. **Security**: Never auto-save sensitive information

## ⚡ Performance Considerations

### Re-render Optimization

```tsx
// ❌ Avoid - watches entire form
const values = form.watch()

// ✅ Better - watch specific fields
const clientType = form.watch('clientType')

// ✅ Best - use conditional logic helpers
showWhen={conditionalLogic.equals('clientType', 'business')}
```

### Memory Management

```tsx
// ✅ Clean up subscriptions
useEffect(() => {
  const subscription = form.watch(handleChange)
  return () => subscription.unsubscribe()
}, [])

// ✅ Cancel debounced functions
useEffect(() => {
  return () => debouncedSave.cancel()
}, [])
```

### Bundle Size

```tsx
// ✅ Import only what you need
import { conditionalLogic } from '@/components/forms'

// ❌ Avoid importing everything
import * as forms from '@/components/forms'
```

## 🔧 Troubleshooting

### Common Issues

1. **Fields not clearing**: Ensure `clearOnHide` is enabled and specify `clearFields`
2. **Auto-save not working**: Check debounce settings and form dirty state
3. **Validation errors**: Verify schema matches form structure
4. **Performance issues**: Use React DevTools Profiler to identify re-renders

### Debug Mode

Enable debug information in development:

```tsx
<MultiStepForm
  // ... other props
  showDebugInfo={process.env.NODE_ENV === 'development'}
/>
```

---

## 📚 Related Documentation

- [React Hook Form Documentation](https://react-hook-form.com/)
- [Zod Schema Validation](https://zod.dev/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Framer Motion Animations](https://www.framer.com/motion/)

## 🤝 Contributing

When adding new form patterns:

1. Create comprehensive TypeScript interfaces
2. Add Zod validation schemas
3. Include accessibility features
4. Write usage examples
5. Add to Storybook for testing
6. Update this README

## 📄 License

This code is part of the Aster Management project and follows the project's licensing terms.
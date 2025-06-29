# Form Testing Patterns Guide

Comprehensive guide for testing form components in the Aster Management Nuxt.js application, covering VeeValidate integration, Zod validation, accessibility, and best practices.

## Overview

This guide provides patterns and best practices for testing form components built with:
- **Vue 3 Composition API** for reactive form state
- **VeeValidate v4** for form validation and field management
- **Zod** for runtime type validation and schema definition
- **Vitest** and **Vue Test Utils** for component testing

## Form Testing Architecture

### Test Categories

1. **Component Tests**: Individual form field components (FormInput, FormSelect, etc.)
2. **Integration Tests**: Complete forms with validation and submission
3. **Validation Tests**: Zod schemas and validation rules
4. **Accessibility Tests**: ARIA attributes, keyboard navigation, screen readers
5. **Performance Tests**: Form rendering and validation performance

### Test Utilities

The project provides comprehensive test utilities in `src/test/utils/form-test-utils.ts`:

```typescript
// Mock form data factory
const formData = createMockFormData({
  values: {
    title: 'Test Matter',
    priority: 'HIGH'
  },
  errors: {
    email: 'Invalid email format'
  }
})

// Validation helpers
await waitForValidation() // Wait for async validation
expectFieldError(wrapper, 'Email is required')
expectFieldValid(wrapper)
```

## Component Testing Patterns

### Basic Form Field Testing

```typescript
describe('FormInput.vue', () => {
  it('renders with initial value', () => {
    const wrapper = mount(FormInput, {
      props: {
        name: 'email',
        modelValue: 'test@example.com',
        label: 'Email Address'
      }
    })
    
    const input = wrapper.find('input')
    expect(input.element.value).toBe('test@example.com')
    expect(wrapper.find('label').text()).toBe('Email Address')
  })

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(FormInput, {
      props: { name: 'email' }
    })
    
    const input = wrapper.find('input')
    await input.setValue('new@example.com')
    
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['new@example.com'])
  })
})
```

### Form Context Integration

```typescript
describe('Form with VeeValidate', () => {
  const createFormWrapper = () => {
    return mount({
      components: { FormInput },
      setup() {
        const schema = toTypedSchema(
          z.object({
            email: z.string().email('Invalid email')
          })
        )
        
        const form = useForm({
          validationSchema: schema
        })
        
        return { form }
      },
      template: `
        <form>
          <FormInput name="email" label="Email" />
        </form>
      `
    })
  }

  it('validates on blur', async () => {
    const wrapper = createFormWrapper()
    const input = wrapper.find('input')
    
    await input.setValue('invalid-email')
    await input.trigger('blur')
    await waitForValidation()
    
    expectFieldError(wrapper, 'Invalid email')
  })
})
```

## Validation Testing Patterns

### Zod Schema Testing

```typescript
describe('Matter Validation Schema', () => {
  it('validates required fields', () => {
    const data = {
      title: 'Test Matter',
      clientId: '123e4567-e89b-12d3-a456-426614174000',
      priority: 'HIGH'
    }
    
    const result = matterCreateSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('transforms and sanitizes input', () => {
    const data = {
      title: '  Test Matter  ', // Extra spaces
      tags: ['  Tag1  ', 'TAG2'] // Mixed case
    }
    
    const result = matterSchema.safeParse(data)
    expect(result.data.title).toBe('Test Matter')
    expect(result.data.tags).toEqual(['tag1', 'tag2'])
  })

  it('validates conditional rules', () => {
    const schema = z.object({
      accountType: z.enum(['personal', 'business']),
      companyName: z.string().optional()
    }).refine(
      data => data.accountType !== 'business' || !!data.companyName,
      { message: 'Company name required for business accounts' }
    )
    
    const result = schema.safeParse({
      accountType: 'business'
      // Missing companyName
    })
    
    expect(result.success).toBe(false)
  })
})
```

### Async Validation Testing

```typescript
it('validates email uniqueness asynchronously', async () => {
  const checkEmailExists = vi.fn().mockResolvedValue(true)
  
  const schema = z.object({
    email: z.string().email().refine(
      async (email) => !(await checkEmailExists(email)),
      { message: 'Email already exists' }
    )
  })
  
  const wrapper = createFormWrapper({ schema })
  const input = wrapper.find('input[name="email"]')
  
  await input.setValue('existing@example.com')
  await input.trigger('blur')
  await waitForValidation()
  
  expect(checkEmailExists).toHaveBeenCalledWith('existing@example.com')
  expectFieldError(wrapper, 'Email already exists')
})
```

## Form Interaction Testing

### Multi-Step Form Testing

```typescript
describe('MultiStepForm', () => {
  it('validates current step before proceeding', async () => {
    const wrapper = mount(MultiStepForm, {
      props: {
        steps: [
          { name: 'basic', fields: ['title', 'description'] },
          { name: 'details', fields: ['priority', 'dueDate'] }
        ]
      }
    })
    
    // Try to go to next step without filling required fields
    const nextButton = wrapper.find('[data-testid="next-step"]')
    await nextButton.trigger('click')
    
    // Should remain on first step
    expect(wrapper.vm.currentStep).toBe(0)
    expectFieldError(wrapper, 'Title is required')
    
    // Fill required fields
    await wrapper.find('input[name="title"]').setValue('Test Matter')
    await wrapper.find('textarea[name="description"]').setValue('Description')
    
    // Now should proceed
    await nextButton.trigger('click')
    expect(wrapper.vm.currentStep).toBe(1)
  })
})
```

### Form Submission Testing

```typescript
describe('Form Submission', () => {
  it('handles successful submission', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ id: '123' })
    
    const wrapper = mount(MatterForm, {
      props: { onSubmit }
    })
    
    // Fill form
    await wrapper.find('input[name="title"]').setValue('New Matter')
    await wrapper.find('select[name="priority"]').setValue('HIGH')
    
    // Submit
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    
    expect(onSubmit).toHaveBeenCalledWith({
      title: 'New Matter',
      priority: 'HIGH'
    })
    
    // Check success feedback
    expect(wrapper.text()).toContain('Matter created successfully')
  })

  it('handles submission errors', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Network error'))
    
    const wrapper = mount(MatterForm, {
      props: { onSubmit }
    })
    
    await fillValidForm(wrapper)
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    
    expectFieldError(wrapper, 'Failed to create matter')
    expect(wrapper.find('button[type="submit"]').element.disabled).toBe(false)
  })
})
```

## Accessibility Testing

### ARIA Attributes

```typescript
describe('Form Accessibility', () => {
  it('has proper ARIA attributes', () => {
    const wrapper = mount(FormInput, {
      props: {
        name: 'email',
        label: 'Email Address',
        required: true,
        error: 'Invalid email'
      }
    })
    
    const input = wrapper.find('input')
    expect(input.attributes('aria-required')).toBe('true')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-describedby')).toContain('error')
    
    const error = wrapper.find('[role="alert"]')
    expect(error.text()).toBe('Invalid email')
  })
})
```

### Keyboard Navigation

```typescript
it('supports keyboard navigation', async () => {
  const wrapper = mount(FormWithMultipleFields)
  const inputs = wrapper.findAll('input')
  
  // Focus first input
  await inputs[0].element.focus()
  expect(document.activeElement).toBe(inputs[0].element)
  
  // Tab to next input
  await inputs[0].trigger('keydown', { key: 'Tab' })
  expect(document.activeElement).toBe(inputs[1].element)
  
  // Submit with Enter in last field
  await inputs[inputs.length - 1].trigger('keydown', { key: 'Enter' })
  expect(wrapper.emitted('submit')).toBeTruthy()
})
```

### Screen Reader Testing

```typescript
it('announces validation errors to screen readers', async () => {
  const wrapper = mount(FormInput, {
    props: { name: 'email', label: 'Email' }
  })
  
  // Trigger validation error
  const input = wrapper.find('input')
  await input.setValue('invalid')
  await input.trigger('blur')
  await waitForValidation()
  
  // Check live region for error announcement
  const liveRegion = wrapper.find('[aria-live="polite"]')
  expect(liveRegion.text()).toContain('Email is invalid')
  
  // Error should be associated with input
  const errorId = input.attributes('aria-describedby')
  const errorElement = wrapper.find(`#${errorId}`)
  expect(errorElement.attributes('role')).toBe('alert')
})
```

## Performance Testing

### Render Performance

```typescript
describe('Form Performance', () => {
  it('renders large forms efficiently', () => {
    const fields = Array.from({ length: 50 }, (_, i) => ({
      name: `field${i}`,
      label: `Field ${i}`,
      type: 'text'
    }))
    
    const startTime = performance.now()
    const wrapper = mount(DynamicForm, {
      props: { fields }
    })
    const renderTime = performance.now() - startTime
    
    expect(renderTime).toBeLessThan(100) // Should render in < 100ms
    expect(wrapper.findAll('input')).toHaveLength(50)
  })
})
```

### Validation Performance

```typescript
it('validates complex schemas efficiently', async () => {
  const complexSchema = z.object({
    // 20+ fields with various validation rules
    ...generateComplexSchema()
  })
  
  const wrapper = createFormWrapper({ schema: complexSchema })
  
  const startTime = performance.now()
  await wrapper.vm.form.validate()
  const validationTime = performance.now() - startTime
  
  expect(validationTime).toBeLessThan(50) // Should validate in < 50ms
})
```

## Advanced Testing Patterns

### Dynamic Form Testing

```typescript
describe('Dynamic Forms', () => {
  it('adds and removes fields dynamically', async () => {
    const wrapper = mount(DynamicFieldArray, {
      props: {
        name: 'items',
        minItems: 1,
        maxItems: 5
      }
    })
    
    // Initial state
    expect(wrapper.findAll('[data-testid="field-item"]')).toHaveLength(1)
    
    // Add field
    const addButton = wrapper.find('[data-testid="add-field"]')
    await addButton.trigger('click')
    expect(wrapper.findAll('[data-testid="field-item"]')).toHaveLength(2)
    
    // Remove field
    const removeButton = wrapper.find('[data-testid="remove-field-0"]')
    await removeButton.trigger('click')
    expect(wrapper.findAll('[data-testid="field-item"]')).toHaveLength(1)
    
    // Cannot remove last field (minItems: 1)
    expect(wrapper.find('[data-testid="remove-field-0"]').element.disabled).toBe(true)
  })
})
```

### Conditional Field Testing

```typescript
it('shows/hides fields based on conditions', async () => {
  const wrapper = mount(ConditionalForm, {
    props: {
      fields: [
        { name: 'accountType', type: 'select' },
        { 
          name: 'companyName', 
          condition: (values) => values.accountType === 'business' 
        }
      ]
    }
  })
  
  // Company name field should be hidden initially
  expect(wrapper.find('input[name="companyName"]').exists()).toBe(false)
  
  // Select business account type
  await wrapper.find('select[name="accountType"]').setValue('business')
  
  // Company name field should appear
  expect(wrapper.find('input[name="companyName"]').exists()).toBe(true)
  
  // And be required
  await wrapper.find('form').trigger('submit')
  expectFieldError(wrapper, 'Company name is required')
})
```

### Form State Persistence

```typescript
describe('Form Auto-Save', () => {
  it('persists form state to localStorage', async () => {
    const wrapper = mount(FormWithAutoSave, {
      props: { 
        formId: 'test-form',
        autoSaveDelay: 1000 
      }
    })
    
    // Fill form
    await wrapper.find('input[name="title"]').setValue('Draft Matter')
    
    // Wait for auto-save
    await vi.advanceTimersByTime(1000)
    
    // Check localStorage
    const saved = JSON.parse(localStorage.getItem('form-test-form') || '{}')
    expect(saved.title).toBe('Draft Matter')
    
    // Remount component
    const newWrapper = mount(FormWithAutoSave, {
      props: { formId: 'test-form' }
    })
    
    // Should restore saved values
    expect(newWrapper.find('input[name="title"]').element.value).toBe('Draft Matter')
  })
})
```

## Testing Best Practices

### 1. Use Factory Functions

```typescript
// Create reusable factory functions for common test scenarios
const createValidMatterData = (overrides = {}) => ({
  title: 'Test Matter',
  clientId: '123e4567-e89b-12d3-a456-426614174000',
  priority: 'MEDIUM',
  ...overrides
})

const createFormWrapper = (props = {}, slots = {}) => {
  return mount(MatterForm, {
    props: {
      initialValues: createValidMatterData(),
      ...props
    },
    slots,
    global: {
      plugins: [createTestingPinia()]
    }
  })
}
```

### 2. Test User Workflows

```typescript
// Test complete user workflows, not just individual interactions
it('completes matter creation workflow', async () => {
  const wrapper = createFormWrapper()
  
  // User fills basic info
  await fillBasicInfo(wrapper, {
    title: 'Contract Review',
    client: 'ABC Corp'
  })
  
  // User adds tags
  await addTags(wrapper, ['contract', 'urgent'])
  
  // User sets deadline
  await setDeadline(wrapper, '2024-12-31')
  
  // User submits
  await submitForm(wrapper)
  
  // Verify success state
  expect(wrapper.emitted('success')).toBeTruthy()
  expect(wrapper.router.push).toHaveBeenCalledWith('/matters/123')
})
```

### 3. Test Error Recovery

```typescript
it('recovers from network errors', async () => {
  const onSubmit = vi.fn()
    .mockRejectedValueOnce(new Error('Network error'))
    .mockResolvedValueOnce({ id: '123' })
  
  const wrapper = mount(MatterForm, { props: { onSubmit } })
  
  await fillValidForm(wrapper)
  
  // First submission fails
  await submitForm(wrapper)
  expectFieldError(wrapper, 'Network error')
  
  // Retry button appears
  const retryButton = wrapper.find('[data-testid="retry-submit"]')
  expect(retryButton.exists()).toBe(true)
  
  // Retry succeeds
  await retryButton.trigger('click')
  expect(wrapper.emitted('success')).toBeTruthy()
})
```

### 4. Mock External Dependencies

```typescript
// Mock API calls
vi.mock('~/api/matters', () => ({
  createMatter: vi.fn(),
  validateMatterTitle: vi.fn()
}))

// Mock composables
vi.mock('~/composables/useAuth', () => ({
  useAuth: () => ({
    user: ref({ id: '123', role: 'lawyer' }),
    isAuthenticated: ref(true)
  })
}))

// Mock stores
const mockMatterStore = {
  createMatter: vi.fn(),
  matters: ref([])
}

vi.mock('~/stores/matters', () => ({
  useMatterStore: () => mockMatterStore
}))
```

### 5. Test Accessibility First

```typescript
// Include accessibility tests in every form component test
describe.each([
  'FormInput',
  'FormSelect',
  'FormTextarea',
  'FormCheckbox'
])('%s Accessibility', (componentName) => {
  it('meets WCAG standards', async () => {
    const Component = await import(`~/components/forms/${componentName}.vue`)
    const wrapper = mount(Component.default, {
      props: { name: 'test', label: 'Test Field' }
    })
    
    // Run automated accessibility tests
    const results = await axe(wrapper.element)
    expect(results.violations).toHaveLength(0)
  })
})
```

## Common Testing Pitfalls

### 1. Not Waiting for Validation

```typescript
// ❌ Wrong - validation is async
await input.setValue('invalid-email')
expect(wrapper.find('.error').exists()).toBe(true) // May fail

// ✅ Correct - wait for validation
await input.setValue('invalid-email')
await waitForValidation()
expect(wrapper.find('.error').exists()).toBe(true)
```

### 2. Testing Implementation Details

```typescript
// ❌ Wrong - testing internal state
expect(wrapper.vm.internalFormState.touched.email).toBe(true)

// ✅ Correct - test observable behavior
expect(wrapper.find('input[name="email"]').classes()).toContain('touched')
```

### 3. Not Testing Edge Cases

```typescript
// Always test edge cases
describe('Edge Cases', () => {
  it('handles very long input', async () => {
    const longText = 'A'.repeat(10000)
    await input.setValue(longText)
    // Should truncate or handle gracefully
  })
  
  it('handles special characters', async () => {
    await input.setValue('<script>alert("xss")</script>')
    // Should escape or sanitize
  })
  
  it('handles rapid user input', async () => {
    for (let i = 0; i < 100; i++) {
      await input.setValue(`value${i}`)
    }
    // Should not crash or lag
  })
})
```

## Continuous Integration

### Test Configuration

```yaml
# vitest.config.ts
export default defineConfig({
  test: {
    environment: 'happy-dom',
    coverage: {
      reporter: ['text', 'lcov', 'html'],
      include: ['src/components/forms/**/*.vue'],
      exclude: ['**/*.stories.ts'],
      thresholds: {
        lines: 90,
        functions: 85,
        branches: 85,
        statements: 90
      }
    }
  }
})
```

### CI Pipeline Integration

```yaml
# .github/workflows/test.yml
- name: Run Form Tests
  run: |
    bun test src/components/forms --coverage
    bun test src/composables/form --coverage
    bun test src/schemas --coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
    flags: forms
```

This comprehensive guide ensures consistent, thorough testing of all form components in the Aster Management application, maintaining high quality and accessibility standards.
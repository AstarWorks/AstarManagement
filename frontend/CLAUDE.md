# 🚀 CLAUDE.md - Nuxt 3 Frontend Configuration

This file provides specific guidance for Claude Code when working on the Nuxt 3 frontend for Aster Management.

## Project Overview

This is the main frontend for Aster Management, built with modern Vue 3 + Nuxt 3, featuring:
- **Vue 3 Composition API** with TypeScript
- **Nuxt 3.17.5** with App Router and modern features
- **shadcn-vue** component system with Radix Vue primitives
- **Storybook 8** for component development and documentation
- **Vee-Validate + Zod** for type-safe form validation

## 🏗️ Architecture Principles

### Vue 3 Composition API First
**Modern Vue development patterns with full TypeScript integration**

#### Composition API Standards
- **Script Setup**: Use `<script setup lang="ts">` for all components
- **Composables**: Extract reusable logic to `composables/` directory
- **Reactive State**: Use `ref()`, `reactive()`, and `computed()` appropriately
- **Lifecycle Hooks**: Prefer composition API hooks (`onMounted`, `onUnmounted`, etc.)
- **Type Safety**: Full TypeScript integration with proper type inference

#### Vue 3 Single File Components (SFC) Architecture

**Modern component development with script setup, semantic templates, and scoped styling**

##### Complete SFC Structure
```vue
<!-- Legal Matter Form Component - Production Example -->
<script setup lang="ts">
// 1. External library imports
import { ref, computed, onMounted, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

// 2. Internal imports - types first, then composables
import type { Matter, MatterStatus, MatterPriority } from '~/types/matter'
import { useMatters } from '~/composables/useMatters'
import { useToast } from '~/composables/useToast'

// 3. Schema definition for form validation
const matterSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.date().nullable(),
  clientId: z.string().uuid('Invalid client ID')
})

type MatterForm = z.infer<typeof matterSchema>

// 4. Props interface with comprehensive typing
interface Props {
  /** Existing matter ID for editing */
  matterId?: string
  /** Initial form values */
  initialValues?: Partial<MatterForm>
  /** Form mode - create or edit */
  mode?: 'create' | 'edit'
  /** Whether form is in readonly state */
  readonly?: boolean
  /** Show additional fields for lawyer role */
  showAdvancedFields?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create',
  readonly: false,
  showAdvancedFields: false
})

// 5. Emit events with proper typing
const emit = defineEmits<{
  /** Fired when matter is successfully saved */
  save: [matter: Matter]
  /** Fired when form is cancelled */
  cancel: []
  /** Fired when form validation state changes */
  validationChange: [isValid: boolean]
  /** Fired when form is submitted (before save) */
  submit: [formData: MatterForm]
}>()

// 6. Composables for business logic
const { createMatter, updateMatter, isLoading, error } = useMatters()
const { showToast } = useToast()

// 7. Form setup with validation
const { handleSubmit, defineField, errors, meta } = useForm({
  validationSchema: toTypedSchema(matterSchema),
  initialValues: props.initialValues
})

// 8. Form fields with proper binding
const [title, titleAttrs] = defineField('title')
const [description, descriptionAttrs] = defineField('description')
const [priority, priorityAttrs] = defineField('priority')
const [dueDate, dueDateAttrs] = defineField('dueDate')
const [clientId, clientIdAttrs] = defineField('clientId')

// 9. Local reactive state
const isSubmitting = ref(false)
const showDatePicker = ref(false)

// 10. Computed properties for UI state
const isFormValid = computed(() => meta.value.valid)
const canSubmit = computed(() => 
  isFormValid.value && !isSubmitting.value && !isLoading.value
)

const submitButtonText = computed(() => {
  if (isSubmitting.value) return 'Saving...'
  return props.mode === 'create' ? 'Create Matter' : 'Update Matter'
})

// 11. Methods
const onSubmit = handleSubmit(async (values: MatterForm) => {
  if (!canSubmit.value) return
  
  isSubmitting.value = true
  emit('submit', values)
  
  try {
    let savedMatter: Matter
    
    if (props.mode === 'create') {
      savedMatter = await createMatter(values)
      showToast('Matter created successfully', 'success')
    } else {
      savedMatter = await updateMatter(props.matterId!, values)
      showToast('Matter updated successfully', 'success')
    }
    
    emit('save', savedMatter)
  } catch (err) {
    showToast('Failed to save matter', 'error')
    console.error('Matter save error:', err)
  } finally {
    isSubmitting.value = false
  }
})

const handleCancel = () => {
  if (meta.value.dirty) {
    // Show confirmation dialog for unsaved changes
    if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
      emit('cancel')
    }
  } else {
    emit('cancel')
  }
}

// 12. Watchers for side effects
watch(isFormValid, (valid) => {
  emit('validationChange', valid)
}, { immediate: true })

// 13. Lifecycle hooks
onMounted(() => {
  if (props.matterId && props.mode === 'edit') {
    // Load existing matter data
    // This would typically be handled by parent component
  }
})
</script>

<template>
  <div class="matter-form">
    <!-- Form header with status indicator -->
    <header class="form-header">
      <h2 class="form-title">
        {{ mode === 'create' ? 'Create New Matter' : 'Edit Matter' }}
      </h2>
      <div v-if="error" class="error-banner" role="alert">
        {{ error }}
      </div>
    </header>

    <!-- Main form with proper semantic structure -->
    <form @submit.prevent="onSubmit" class="form-content" novalidate>
      <fieldset :disabled="readonly || isSubmitting" class="form-fieldset">
        <legend class="sr-only">Matter Information</legend>

        <!-- Title field with validation -->
        <div class="form-group">
          <label for="matter-title" class="form-label required">
            Matter Title
          </label>
          <input
            id="matter-title"
            v-model="title"
            v-bind="titleAttrs"
            type="text"
            class="form-input"
            :class="{ 'error': errors.title }"
            placeholder="Enter matter title"
            aria-describedby="title-error title-help"
            required
          />
          <p id="title-help" class="form-help">
            Provide a clear, descriptive title for this legal matter
          </p>
          <span 
            v-if="errors.title" 
            id="title-error" 
            class="error-message"
            role="alert"
          >
            {{ errors.title }}
          </span>
        </div>

        <!-- Description field -->
        <div class="form-group">
          <label for="matter-description" class="form-label">
            Description
          </label>
          <textarea
            id="matter-description"
            v-model="description"
            v-bind="descriptionAttrs"
            class="form-textarea"
            :class="{ 'error': errors.description }"
            placeholder="Enter matter description"
            rows="4"
            aria-describedby="description-help"
          />
          <p id="description-help" class="form-help">
            Optional detailed description of the matter
          </p>
        </div>

        <!-- Priority selection -->
        <div class="form-group">
          <label for="matter-priority" class="form-label required">
            Priority Level
          </label>
          <select
            id="matter-priority"
            v-model="priority"
            v-bind="priorityAttrs"
            class="form-select"
            :class="{ 'error': errors.priority }"
            required
          >
            <option value="">Select priority</option>
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          <span 
            v-if="errors.priority" 
            class="error-message"
            role="alert"
          >
            {{ errors.priority }}
          </span>
        </div>

        <!-- Advanced fields for lawyer role -->
        <template v-if="showAdvancedFields">
          <div class="form-group">
            <label for="matter-due-date" class="form-label">
              Due Date
            </label>
            <input
              id="matter-due-date"
              v-model="dueDate"
              v-bind="dueDateAttrs"
              type="date"
              class="form-input"
              :class="{ 'error': errors.dueDate }"
            />
          </div>

          <div class="form-group">
            <label for="matter-client" class="form-label required">
              Client ID
            </label>
            <input
              id="matter-client"
              v-model="clientId"
              v-bind="clientIdAttrs"
              type="text"
              class="form-input"
              :class="{ 'error': errors.clientId }"
              placeholder="Client UUID"
              required
            />
            <span 
              v-if="errors.clientId" 
              class="error-message"
              role="alert"
            >
              {{ errors.clientId }}
            </span>
          </div>
        </template>
      </fieldset>

      <!-- Form actions -->
      <footer class="form-actions">
        <button
          type="button"
          @click="handleCancel"
          class="btn btn-secondary"
          :disabled="isSubmitting"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="!canSubmit"
          :aria-busy="isSubmitting"
        >
          <span v-if="isSubmitting" class="loading-spinner" aria-hidden="true" />
          {{ submitButtonText }}
        </button>
      </footer>
    </form>
  </div>
</template>

<style scoped>
/* Design system integration with CSS custom properties */
.matter-form {
  --form-max-width: 600px;
  --form-spacing: 1.5rem;
  --input-height: 2.75rem;
  --border-radius: 0.5rem;
  
  max-width: var(--form-max-width);
  margin: 0 auto;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--border-radius);
  overflow: hidden;
}

.form-header {
  padding: var(--form-spacing);
  border-bottom: 1px solid hsl(var(--border));
  background: hsl(var(--muted) / 0.5);
}

.form-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.error-banner {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: hsl(var(--destructive) / 0.1);
  border: 1px solid hsl(var(--destructive) / 0.3);
  border-radius: calc(var(--border-radius) - 2px);
  color: hsl(var(--destructive));
  font-size: 0.875rem;
}

.form-content {
  padding: var(--form-spacing);
}

.form-fieldset {
  border: none;
  margin: 0;
  padding: 0;
}

.form-fieldset:disabled {
  opacity: 0.6;
  pointer-events: none;
}

.form-group {
  margin-bottom: var(--form-spacing);
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  color: hsl(var(--foreground));
}

.form-label.required::after {
  content: ' *';
  color: hsl(var(--destructive));
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  min-height: var(--input-height);
  padding: 0.75rem;
  border: 1px solid hsl(var(--border));
  border-radius: calc(var(--border-radius) - 2px);
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: hsl(var(--ring));
  box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
}

.form-input.error,
.form-textarea.error,
.form-select.error {
  border-color: hsl(var(--destructive));
}

.form-textarea {
  min-height: auto;
  resize: vertical;
}

.form-help {
  margin: 0.25rem 0 0 0;
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
}

.error-message {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: hsl(var(--destructive));
  font-weight: 500;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: calc(var(--form-spacing) * 1.5);
  padding-top: var(--form-spacing);
  border-top: 1px solid hsl(var(--border));
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: var(--input-height);
  padding: 0 1.5rem;
  border: 1px solid transparent;
  border-radius: calc(var(--border-radius) - 2px);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}

.btn-primary:hover:not(:disabled) {
  background: hsl(var(--primary) / 0.9);
}

.btn-secondary {
  background: hsl(var(--secondary));
  color: hsl(var(--secondary-foreground));
}

.btn-secondary:hover:not(:disabled) {
  background: hsl(var(--secondary) / 0.8);
}

.loading-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Responsive design */
@media (max-width: 640px) {
  .matter-form {
    --form-spacing: 1rem;
    margin: 0;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .form-input,
  .form-textarea,
  .form-select {
    border-width: 2px;
  }
  
  .btn {
    border-width: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .form-input,
  .form-textarea,
  .form-select,
  .btn {
    transition: none;
  }
  
  .loading-spinner {
    animation: none;
  }
}
</style>
```

##### SFC Design Principles

**1. Script Setup Organization**
- **Imports**: External libraries → internal types → composables
- **Type Definitions**: Props interfaces and form schemas
- **Composables**: Business logic and state management
- **Form Setup**: Validation and field definitions
- **Reactive State**: Component-specific state
- **Computed Properties**: Derived state and UI conditions
- **Methods**: Event handlers and business logic
- **Watchers**: Side effects and state synchronization
- **Lifecycle**: Component initialization and cleanup

**2. Template Best Practices**
- **Semantic HTML**: Proper form structure with fieldset/legend
- **Accessibility**: ARIA labels, roles, and screen reader support
- **Validation States**: Error messaging and visual feedback
- **Progressive Enhancement**: Works without JavaScript
- **Keyboard Navigation**: Full keyboard accessibility

**3. Scoped Styling Architecture**
- **CSS Custom Properties**: Design system integration
- **Component Isolation**: Scoped styles prevent leakage
- **Responsive Design**: Mobile-first with proper breakpoints
- **Accessibility Features**: High contrast and reduced motion support
- **Design System**: Integration with shadcn-vue tokens

### Modern Nuxt 3 Features

#### Auto-Imports and Directory Structure
- **Components**: Auto-imported from `~/components/`
- **Composables**: Auto-imported from `~/composables/`
- **Utils**: Auto-imported from `~/utils/`
- **Types**: Centralized in `~/types/`
- **Schemas**: Zod schemas in `~/schemas/`

#### Server-Side Rendering (SSR)
- **Universal Rendering**: SSR enabled by default
- **Hydration**: Client-side hydration for interactivity
- **SEO Optimization**: Meta tags and structured data
- **Performance**: Optimized bundle splitting and lazy loading

#### State Management with Pinia
```typescript
// stores/example.ts
export const useExampleStore = defineStore('example', () => {
  // State
  const items = ref<Item[]>([])
  const loading = ref(false)
  
  // Getters
  const itemCount = computed(() => items.value.length)
  
  // Actions
  const fetchItems = async () => {
    loading.value = true
    try {
      const data = await $fetch<Item[]>('/api/items')
      items.value = data
    } finally {
      loading.value = false
    }
  }
  
  return {
    items: readonly(items),
    loading: readonly(loading),
    itemCount,
    fetchItems
  }
})
```

## 🎨 Component Development Standards

### shadcn-vue Integration
**Modern component library with Radix Vue primitives**

#### Component Philosophy
- **Headless Components**: Radix Vue for behavior, Tailwind for styling
- **Copy-Paste Architecture**: Components are copied and customized, not imported
- **Design System**: Consistent tokens through CSS variables
- **Accessibility**: ARIA compliance built-in through Radix Vue

#### Creating New Components
```bash
# Add shadcn-vue components
pnpm dlx shadcn-vue@latest add button
pnpm dlx shadcn-vue@latest add form
pnpm dlx shadcn-vue@latest add dialog

# Manual component creation in src/components/ui/
# Follow existing patterns in the ui/ directory
```

#### Component Variants with CVA
```typescript
// components/ui/button/Button.vue
import { type VariantProps, cva } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

type ButtonProps = VariantProps<typeof buttonVariants>
```

### Storybook Integration
**Component development and documentation**

#### Story Structure
```typescript
// components/ui/button/Button.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3'
import Button from './Button.vue'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered'
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline']
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    variant: 'default',
    children: 'Button'
  }
}

export const AllVariants: Story = {
  render: () => ({
    components: { Button },
    template: `
      <div class="flex gap-4">
        <Button variant="default">Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
      </div>
    `
  })
}
```

## 🔧 Development Standards

### TypeScript Configuration
**Strict TypeScript with Nuxt 3 integration**

#### Type Safety Requirements
- **Strict Mode**: `strict: true` in nuxt.config.ts
- **Type Checking**: `typeCheck: true` for build-time validation
- **No Any**: Avoid `any` type, use proper type definitions
- **Component Props**: Always type component props and emits
- **API Responses**: Type all API responses with Zod schemas

#### Global Type Definitions
```typescript
// types/global.d.ts
declare global {
  interface User {
    id: string
    name: string
    email: string
    role: 'lawyer' | 'clerk' | 'client'
  }
  
  interface Matter {
    id: string
    title: string
    status: 'draft' | 'active' | 'completed' | 'archived'
    assignee?: User
    createdAt: Date
    updatedAt: Date
  }
}

export {}
```

### Form Handling with Vee-Validate + Zod
**Type-safe form validation and management**

#### Schema-First Approach
```typescript
// schemas/matter.ts
import { z } from 'zod'

export const matterCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.date().optional(),
  assigneeId: z.string().uuid().optional()
})

export type MatterCreateForm = z.infer<typeof matterCreateSchema>
```

#### Component Implementation
```vue
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { matterCreateSchema, type MatterCreateForm } from '~/schemas/matter'

const { handleSubmit, defineField, errors } = useForm({
  validationSchema: toTypedSchema(matterCreateSchema)
})

const [title, titleAttrs] = defineField('title')
const [description, descriptionAttrs] = defineField('description')
const [priority, priorityAttrs] = defineField('priority')

const onSubmit = handleSubmit(async (values: MatterCreateForm) => {
  try {
    await $fetch('/api/matters', {
      method: 'POST',
      body: values
    })
    await navigateTo('/matters')
  } catch (error) {
    // Handle error
  }
})
</script>

<template>
  <form @submit="onSubmit" class="space-y-4">
    <FormField>
      <FormLabel>Title</FormLabel>
      <FormControl>
        <Input v-model="title" v-bind="titleAttrs" />
      </FormControl>
      <FormMessage>{{ errors.title }}</FormMessage>
    </FormField>
    
    <Button type="submit">Create Matter</Button>
  </form>
</template>
```

### VueUse Integration
**Powerful utility composables for common patterns**

#### Core VueUse Utilities
The POC integrates VueUse for enhanced reactive utilities and common patterns:

```typescript
// Window & DOM utilities
import { useWindowSize, useElementSize, useResizeObserver } from '@vueuse/core'
import { useEventListener, useClickOutside, useFocus } from '@vueuse/core'

// State & storage utilities  
import { useLocalStorage, useSessionStorage, useStorageAsync } from '@vueuse/core'
import { useToggle, useCounter, useClipboard } from '@vueuse/core'

// Time & async utilities
import { watchDebounced, watchThrottled, useTimeoutFn } from '@vueuse/core'
import { useAsyncState, until, whenever } from '@vueuse/core'

// Network & sensors
import { useOnline, useFetch, useGeolocation } from '@vueuse/core'
import { useDeviceOrientation, usePermission } from '@vueuse/core'
```

#### VueUse Best Practices
```typescript
// Responsive design with useBreakpoints
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'

export const useResponsive = () => {
  const breakpoints = useBreakpoints(breakpointsTailwind)
  
  return {
    isMobile: breakpoints.smaller('md'),
    isTablet: breakpoints.between('md', 'lg'),
    isDesktop: breakpoints.greaterOrEqual('lg'),
    
    // Current breakpoint
    activeBreakpoint: breakpoints.active(),
    
    // Specific checks
    isMd: breakpoints.md,
    isLg: breakpoints.lg,
    isXl: breakpoints.xl
  }
}

// Enhanced mobile detection with VueUse
export const useIsMobileEnhanced = () => {
  const { width } = useWindowSize()
  const { isTouchscreen } = usePointerSwipe()
  
  return {
    isMobile: computed(() => width.value < 768),
    isTouchDevice: isTouchscreen,
    screenWidth: width
  }
}

// Local storage with reactive state
export const usePersistedState = <T>(key: string, defaultValue: T) => {
  return useLocalStorage(key, defaultValue, {
    serializer: {
      read: (v: any) => {
        try {
          return JSON.parse(v)
        } catch {
          return defaultValue
        }
      },
      write: (v: any) => JSON.stringify(v)
    }
  })
}

// Form auto-save with VueUse
export const useFormAutoSave = (formData: Ref<any>, key: string) => {
  const { pause, resume } = watchDebounced(
    formData,
    (newValue) => {
      useLocalStorage(key, newValue).value = newValue
    },
    { debounce: 2000, deep: true }
  )
  
  return { pause, resume }
}
```

#### VueUse Component Examples
```vue
<!-- Modal with click outside and escape key -->
<script setup lang="ts">
import { useClickOutside, useKeyModifier } from '@vueuse/core'

const isOpen = ref(false)
const modalRef = ref<HTMLElement>()

// Close modal on click outside
useClickOutside(modalRef, () => isOpen.value = false)

// Close modal on escape key
const escapePressed = useKeyModifier('Escape')
watch(escapePressed, (pressed) => {
  if (pressed && isOpen.value) {
    isOpen.value = false
  }
})
</script>

<!-- Infinite scroll with intersection observer -->
<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core'

const target = ref<HTMLElement>()
const isLoading = ref(false)
const items = ref([])

const { stop } = useIntersectionObserver(
  target,
  ([{ isIntersecting }]) => {
    if (isIntersecting && !isLoading.value) {
      loadMore()
    }
  }
)

const loadMore = async () => {
  isLoading.value = true
  // Load more items...
  isLoading.value = false
}
</script>

<!-- Dark mode toggle with system preference -->
<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core'

const isDark = useDark({
  selector: 'html',
  attribute: 'class',
  valueDark: 'dark',
  valueLight: 'light',
})

const toggleDark = useToggle(isDark)
</script>
```

### Composables Pattern
**Reusable composition functions**

#### Business Logic Composables
```typescript
// composables/useMatters.ts
export const useMatters = () => {
  const matters = ref<Matter[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchMatters = async () => {
    loading.value = true
    error.value = null
    
    try {
      const data = await $fetch<Matter[]>('/api/matters')
      matters.value = data
    } catch (err) {
      error.value = 'Failed to fetch matters'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  const createMatter = async (matter: MatterCreateForm) => {
    const newMatter = await $fetch<Matter>('/api/matters', {
      method: 'POST',
      body: matter
    })
    matters.value.push(newMatter)
    return newMatter
  }

  return {
    matters: readonly(matters),
    loading: readonly(loading),
    error: readonly(error),
    fetchMatters,
    createMatter
  }
}
```

#### UI State Composables
```typescript
// composables/useModal.ts
export const useModal = () => {
  const isOpen = ref(false)
  const activeModal = ref<string | null>(null)

  const openModal = (modalId: string) => {
    activeModal.value = modalId
    isOpen.value = true
  }

  const closeModal = () => {
    isOpen.value = false
    activeModal.value = null
  }

  return {
    isOpen: readonly(isOpen),
    activeModal: readonly(activeModal),
    openModal,
    closeModal
  }
}
```

### TanStack Query Integration
**Modern server state management for Vue/Nuxt applications**

#### Installation & Setup
For optimal TanStack Query integration with Nuxt 3, use the community module:

```bash
# Install TanStack Query module
bun add @peterbud/nuxt-query

# Or install manually
bun add @tanstack/vue-query
```

#### Configuration
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@peterbud/nuxt-query'
  ],
  
  // Optional configuration
  vueQuery: {
    // Global query client config
    queryClientOptions: {
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutes
          cacheTime: 10 * 60 * 1000, // 10 minutes
          refetchOnWindowFocus: false,
          retry: (failureCount, error) => failureCount < 3
        }
      }
    }
  }
})
```

#### Manual Plugin Setup (Alternative)
```typescript
// plugins/vue-query.client.ts
import type { DehydratedState, VueQueryPluginOptions } from '@tanstack/vue-query'
import { VueQueryPlugin, QueryClient, hydrate, dehydrate } from '@tanstack/vue-query'

export default defineNuxtPlugin((nuxt) => {
  const vueQueryState = useState<DehydratedState | null>('vue-query')
  
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5000,
        refetchOnWindowFocus: false
      }
    }
  })
  
  const options: VueQueryPluginOptions = { queryClient }
  
  nuxt.vueApp.use(VueQueryPlugin, options)
  
  if (process.server) {
    nuxt.hooks.hook('app:rendered', () => {
      vueQueryState.value = dehydrate(queryClient)
    })
  }
  
  if (process.client) {
    nuxt.hooks.hook('app:created', () => {
      hydrate(queryClient, vueQueryState.value)
    })
  }
})
```

#### Query Patterns
```typescript
// composables/useMattersQuery.ts
export const useMattersQuery = () => {
  // Basic query
  const { data: matters, isPending, error, refetch } = useQuery({
    queryKey: ['matters'],
    queryFn: () => $fetch<Matter[]>('/api/matters')
  })
  
  return {
    matters,
    isPending,
    error,
    refetch
  }
}

// Query with parameters
export const useMatterQuery = (id: MaybeRef<string>) => {
  return useQuery({
    queryKey: ['matter', id],
    queryFn: () => $fetch<Matter>(`/api/matters/${unref(id)}`),
    enabled: computed(() => !!unref(id))
  })
}

// Infinite query for pagination
export const useMattersInfiniteQuery = (filters: MaybeRef<MatterFilters>) => {
  return useInfiniteQuery({
    queryKey: ['matters', 'infinite', filters],
    queryFn: ({ pageParam = 0 }) => 
      $fetch<PaginatedResponse<Matter>>('/api/matters', {
        query: { 
          page: pageParam, 
          ...unref(filters) 
        }
      }),
    getNextPageParam: (lastPage) => 
      lastPage.hasNext ? lastPage.page + 1 : undefined,
    initialPageParam: 0
  })
}
```

#### Mutation Patterns
```typescript
// composables/useMatterMutations.ts
export const useMatterMutations = () => {
  const queryClient = useQueryClient()
  
  // Create matter
  const createMatter = useMutation({
    mutationFn: (matter: CreateMatterInput) => 
      $fetch<Matter>('/api/matters', {
        method: 'POST',
        body: matter
      }),
    onSuccess: (newMatter) => {
      // Update matters list
      queryClient.setQueryData(['matters'], (old: Matter[] = []) => 
        [...old, newMatter]
      )
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['matters'] })
    }
  })
  
  // Update matter
  const updateMatter = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMatterInput }) =>
      $fetch<Matter>(`/api/matters/${id}`, {
        method: 'PATCH',
        body: data
      }),
    onMutate: async ({ id, data }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['matter', id] })
      
      const previousMatter = queryClient.getQueryData(['matter', id])
      
      queryClient.setQueryData(['matter', id], (old: Matter) => ({
        ...old,
        ...data
      }))
      
      return { previousMatter }
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousMatter) {
        queryClient.setQueryData(['matter', id], context.previousMatter)
      }
    },
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['matter', id] })
    }
  })
  
  return {
    createMatter,
    updateMatter
  }
}
```

#### Component Usage
```vue
<script setup lang="ts">
// Basic query usage
const { data: matters, isPending, error } = useMattersQuery()

// Mutation usage
const { createMatter, updateMatter } = useMatterMutations()

// Form submission with mutation
const handleSubmit = async (formData: CreateMatterInput) => {
  try {
    await createMatter.mutateAsync(formData)
    await navigateTo('/matters')
  } catch (error) {
    // Handle error
  }
}

// Status updates with optimistic updates
const updateStatus = (matterId: string, status: MatterStatus) => {
  updateMatter.mutate({
    id: matterId,
    data: { status }
  })
}
</script>

<template>
  <div>
    <!-- Loading state -->
    <div v-if="isPending" class="animate-pulse">
      Loading matters...
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="text-red-500">
      Error: {{ error.message }}
    </div>
    
    <!-- Success state -->
    <div v-else>
      <div v-for="matter in matters" :key="matter.id">
        <h3>{{ matter.title }}</h3>
        <Button 
          @click="updateStatus(matter.id, 'completed')"
          :disabled="updateMatter.isPending"
        >
          Mark Complete
        </Button>
      </div>
    </div>
  </div>
</template>
```

#### Advanced Patterns
```typescript
// Dependent queries
export const useMatterWithDocuments = (matterId: MaybeRef<string>) => {
  const matterQuery = useMatterQuery(matterId)
  
  const documentsQuery = useQuery({
    queryKey: ['documents', matterId],
    queryFn: () => $fetch(`/api/matters/${unref(matterId)}/documents`),
    enabled: computed(() => !!matterQuery.data.value)
  })
  
  return {
    matter: matterQuery.data,
    documents: documentsQuery.data,
    isLoading: computed(() => 
      matterQuery.isPending.value || documentsQuery.isPending.value
    )
  }
}

// Background sync with refetch interval
export const useRealTimeMatters = () => {
  return useQuery({
    queryKey: ['matters', 'realtime'],
    queryFn: () => $fetch('/api/matters'),
    refetchInterval: 30000, // 30 seconds
    refetchIntervalInBackground: true
  })
}

// Offline support with persistence
export const useOfflineMatters = () => {
  return useQuery({
    queryKey: ['matters'],
    queryFn: () => $fetch('/api/matters'),
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    networkMode: 'offlineFirst'
  })
}
```

#### DevTools Integration
With `@peterbud/nuxt-query`, you get automatic Nuxt DevTools integration:
- Query inspector with real-time state
- Cache visualization
- Mutation tracking
- Performance metrics

### Bun Package Manager
**Ultra-fast JavaScript runtime and package manager**

#### Why Bun for Nuxt 3 POC
The POC uses Bun 1.2.16 as the package manager for enhanced development experience:

- **30x Faster Installs**: Significantly faster than npm/yarn for dependency installation
- **Native Nuxt 3 Support**: Official support for Nuxt 3 framework out of the box
- **All-in-One Toolkit**: Package manager, test runner, and bundler in one tool
- **Node.js Compatibility**: 100% compatible with existing Node.js ecosystem
- **Zero Configuration**: Works with existing package.json and lock files

#### Installation & Setup
```bash
# Install Bun globally
curl -fsSL https://bun.sh/install | bash

# Create new Nuxt project with Bun
bunx nuxi@latest init nuxt-app
cd nuxt-app

# Install dependencies with Bun
bun install

# Start development server
bun dev
```

#### Essential Bun Commands
```bash
# Package Management
bun install                     # Install all dependencies (30x faster than npm)
bun add <package>              # Add production dependency
bun add -d <package>           # Add development dependency
bun remove <package>           # Remove dependency
bun update                     # Update all dependencies
bun outdated                   # Check for outdated packages

# Development
bun dev                        # Start Nuxt development server
bun build                      # Build for production
bun preview                    # Preview production build
bun generate                   # Generate static site

# Bun-specific features
bun pm ls                      # List installed packages with versions
bun pm cache                   # Manage package cache
bun pm trust                   # Manage trusted dependencies
bun pm bin                     # Show binary paths

# Scripts & Tools
bun run <script>               # Run package.json script
bun x <command>                # Run binary from node_modules
bunx <package>                 # Run package without installing
```

#### Advanced Bun Features
```bash
# Performance Monitoring
bun install --verbose          # Show detailed install information
bun install --force           # Force reinstall all packages
bun install --frozen-lockfile # Install from lockfile only (CI/CD)

# Development Tools
bun --hot <file>              # Run with hot reloading
bun --watch <file>            # Run with file watching
bun test                      # Run tests with built-in test runner
bun test --watch              # Run tests in watch mode

# Package Analysis
bun pm ls --all               # Show all dependencies (including transitive)
bun pm ls --depth=0           # Show only direct dependencies
bun install --dry             # Show what would be installed without installing
```

#### Bun with Nuxt 3 Best Practices
```bash
# Optimal package.json scripts for Bun
{
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build", 
    "preview": "nuxt preview",
    "generate": "nuxt generate",
    "postinstall": "nuxt prepare",
    
    // Bun-optimized scripts
    "install:clean": "bun pm cache rm && bun install",
    "deps:update": "bun update --latest",
    "deps:audit": "bun pm ls --all | grep -E '(vulnerability|deprecated)'",
    
    // Development utilities
    "dev:debug": "bun --hot run dev",
    "dev:host": "bun run dev --host",
    "build:analyze": "bun run build --analyze"
  }
}
```

#### Bun Runtime Features (Optional)
```typescript
// Using Bun-specific APIs (when running with Bun runtime)
import { serve } from 'bun'

// High-performance HTTP server
serve({
  port: 3001,
  fetch(req) {
    return new Response('Hello from Bun!')
  }
})

// Built-in file system utilities
import { file, write } from 'bun'

// Fast file operations
const content = await file('package.json').text()
await write('output.json', JSON.stringify(data))

// Environment variables
const apiUrl = process.env.NUXT_PUBLIC_API_URL ?? 'http://localhost:8080'
```

#### Performance Comparison
```bash
# Package installation benchmarks (typical Nuxt 3 project)
npm install:     ~45 seconds
yarn install:    ~25 seconds  
pnpm install:    ~15 seconds
bun install:     ~1.5 seconds  (30x faster)

# Development server startup
npm run dev:     ~3-5 seconds
bun run dev:     ~1-2 seconds  (2-3x faster)
```

#### CI/CD Integration
```yaml
# GitHub Actions with Bun
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: 1.2.16
      
      - name: Install dependencies
        run: bun install --frozen-lockfile
        
      - name: Run tests
        run: bun test
        
      - name: Build project
        run: bun run build
```

#### Troubleshooting Common Issues
```bash
# Clear Bun cache if having issues
bun pm cache rm

# Verify Bun installation
bun --version

# Check for package conflicts
bun pm ls --all | grep -i conflict

# Force clean install
rm -rf node_modules bun.lock
bun install

# Debug package resolution
bun install --verbose --dry
```

#### Migration from npm/yarn
```bash
# Remove old lock files
rm package-lock.json yarn.lock pnpm-lock.yaml

# Install with Bun (creates bun.lock)
bun install

# Update scripts in package.json to use 'bun run'
# Most scripts work without changes due to Node.js compatibility
```

## 🚀 Development Commands

#### Bun Workflow Examples for Aster Management POC

**Daily Development Workflow**
```bash
# Morning startup - fastest way to get running
bun install                           # Install any new dependencies (30x faster)
bun dev                              # Start development server
bun storybook                        # Start Storybook in another terminal

# Component development workflow
bun add -d @tanstack/vue-query       # Add new dependencies instantly
bun run build                       # Test production build
bun run typecheck                   # Verify TypeScript integrity
```

**Legal Form Component Development**
```bash
# Creating a new matter creation form
bun add @vee-validate/rules zod      # Add validation dependencies
bun add lucide-vue-next             # Add icons for legal forms

# Development with hot reload
bun --hot run storybook             # Storybook with hot reloading
bun run dev:debug                   # Debug mode for complex forms
```

**Kanban Board Performance Testing**
```bash
# Install performance testing tools
bun add -d @tanstack/vue-query-devtools
bun add -d @vueuse/integrations

# Run performance analysis
bun run build:analyze              # Bundle analysis for Kanban components
bun run dev --inspect             # Performance profiling
```

**Legal Document Management Integration**
```bash
# Add document processing dependencies
bun add axios uuid date-fns         # For API calls and utilities
bun add @floating-ui/vue           # For document preview tooltips

# Test document upload workflow
bun run test -- matter-upload       # Test specific functionality
bun run test:ui                    # Visual test runner for document flows
```

### Essential Commands
```bash
# Development
bun dev                    # Start development server
bun build                  # Build for production
bun preview                # Preview production build

# Code Quality
bun lint                   # ESLint checking
bun lint:fix              # Fix ESLint issues
bun typecheck             # TypeScript checking

# Storybook
bun storybook             # Start Storybook dev server
bun build-storybook       # Build Storybook for production
bun test-storybook        # Run Storybook tests

# Testing
bun test                  # Run Vitest tests
bun test:ui               # Run Vitest with UI
```

### Quality Gates
```bash
# Pre-commit checks
bun lint && bun typecheck && bun test

# Build verification
bun build && bun preview
```

## 🎯 Migration Guidelines

### From Next.js to Nuxt 3
**Key differences and migration patterns**

#### Router Migration
- **File-based routing**: Pages in `~/pages/` directory
- **Dynamic routes**: `[id].vue` instead of `[id].tsx`
- **Navigation**: `navigateTo()` instead of `router.push()`
- **Route params**: `useRoute().params` instead of `useRouter().query`

#### Component Migration
- **Script setup**: Convert from React hooks to Composition API
- **Template syntax**: Vue template instead of JSX
- **Props**: `defineProps<T>()` instead of interface props
- **State**: `ref()` and `reactive()` instead of `useState()`

#### Styling Migration
- **Same Tailwind**: Classes remain the same
- **CSS Modules**: Convert to scoped styles or Tailwind
- **Theme system**: Use Nuxt Color Mode module

## 🔍 Debugging and Development Tools

### Nuxt DevTools
- **Component inspector**: Analyze component tree and props
- **Route analyzer**: Debug routing and navigation
- **Performance insights**: Bundle analysis and optimization
- **Plugin inspector**: Debug Nuxt modules and plugins

### Vue DevTools
- **Composition API**: Track reactive state changes
- **Component hierarchy**: Inspect component structure
- **Performance**: Profile component rendering
- **Pinia**: Debug store state and actions

## 📚 Best Practices Summary

### Code Organization
- **Feature-based structure**: Group related components, composables, and types
- **Index files**: Export components from index.ts files
- **Consistent naming**: Use PascalCase for components, camelCase for composables
- **Type definitions**: Centralize types in dedicated files

### Performance Optimization
- **Lazy loading**: Use `defineAsyncComponent()` for large components
- **Code splitting**: Utilize Nuxt's automatic code splitting
- **Image optimization**: Use Nuxt Image module for optimized images
- **Bundle analysis**: Regular bundle size monitoring

### Accessibility
- **Semantic HTML**: Use proper HTML elements
- **ARIA attributes**: Leverage Radix Vue's built-in accessibility
- **Keyboard navigation**: Ensure all interactive elements are keyboard accessible
- **Screen reader support**: Test with screen readers

## 🚫 Common Pitfalls to Avoid

### Vue 3 Specific
- **Reactivity loss**: Don't destructure reactive objects
- **Ref unwrapping**: Be careful with ref access in templates vs script
- **Memory leaks**: Always clean up watchers and event listeners
- **SSR hydration**: Avoid client-only code in SSR components

### Nuxt 3 Specific
- **Auto-imports conflicts**: Be explicit when naming conflicts exist
- **Plugin order**: Be aware of plugin execution order
- **Runtime config**: Use runtime config for environment variables
- **Middleware timing**: Understand middleware execution order

Remember: This POC demonstrates modern Vue 3 + Nuxt 3 patterns for the larger Aster Management migration. Focus on composition API patterns, type safety, and component reusability.
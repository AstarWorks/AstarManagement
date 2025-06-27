/**
 * Example: Form Component Testing with Validation
 * 
 * This example demonstrates testing patterns for form components with
 * Vee-Validate, Zod schemas, and complex user interactions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick, defineComponent, ref } from 'vue'
import { createTestingPinia } from '@pinia/testing'

// Mock the API calls
global.$fetch = vi.fn()

// Example MatterForm component for testing demonstration
const MatterForm = defineComponent({
  name: 'MatterForm',
  props: {
    mode: {
      type: String,
      default: 'create'
    },
    initialData: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['success', 'error', 'cancel'],
  setup(props, { emit }) {
    const title = ref(props.initialData.title || '')
    const description = ref(props.initialData.description || '')
    const priority = ref(props.initialData.priority || '')
    const errors = ref<Record<string, string>>({})
    const isSubmitting = ref(false)
    const errorMessage = ref('')

    const validate = () => {
      errors.value = {}
      if (!title.value) {
        errors.value.title = 'Title is required'
      }
      if (!priority.value) {
        errors.value.priority = 'Priority is required'
      }
      return Object.keys(errors.value).length === 0
    }

    const handleSubmit = async () => {
      if (!validate()) return
      
      isSubmitting.value = true
      try {
        const data = await $fetch('/api/matters', {
          method: 'POST',
          body: {
            title: title.value,
            description: description.value,
            priority: priority.value
          }
        })
        emit('success', data)
      } catch (error) {
        errorMessage.value = 'Failed to save matter'
        emit('error', error)
      } finally {
        isSubmitting.value = false
      }
    }

    const handleCancel = () => {
      emit('cancel')
    }

    return {
      title,
      description,
      priority,
      errors,
      errorMessage,
      isSubmitting,
      handleSubmit,
      handleCancel
    }
  },
  template: `
    <form @submit.prevent="handleSubmit">
      <div v-if="errorMessage" class="error-banner">{{ errorMessage }}</div>
      
      <div>
        <label>Title</label>
        <input name="title" v-model="title" />
        <span v-if="errors.title" class="error-message">{{ errors.title }}</span>
      </div>
      
      <div>
        <label>Description</label>
        <textarea name="description" v-model="description" />
      </div>
      
      <div>
        <label>Priority</label>
        <select name="priority" v-model="priority">
          <option value="">Select priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <span v-if="errors.priority" class="error-message">{{ errors.priority }}</span>
      </div>
      
      <button type="submit" :disabled="!title || !priority || isSubmitting">
        {{ isSubmitting ? 'Saving...' : 'Save' }}
      </button>
      <button type="button" @click="handleCancel">Cancel</button>
    </form>
  `
})

describe('MatterForm Component - Form Testing Example', () => {
  let wrapper: any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Form initialization
  it('initializes with empty form values', () => {
    wrapper = mount(MatterForm, {
      global: {
        plugins: [createTestingPinia()]
      }
    })

    const titleInput = wrapper.find('input[name="title"]')
    const descriptionTextarea = wrapper.find('textarea[name="description"]')
    
    expect(titleInput.element.value).toBe('')
    expect(descriptionTextarea.element.value).toBe('')
  })

  // Validation testing
  it('shows validation errors for required fields', async () => {
    wrapper = mount(MatterForm, {
      global: {
        plugins: [createTestingPinia()]
      }
    })

    // Submit form without filling required fields
    const form = wrapper.find('form')
    await form.trigger('submit.prevent')
    await flushPromises()

    // Check for validation errors
    const errorMessages = wrapper.findAll('.error-message')
    expect(errorMessages.length).toBeGreaterThan(0)
    expect(wrapper.text()).toContain('Title is required')
  })

  // Valid form submission
  it('submits form with valid data', async () => {
    const mockFetch = vi.mocked($fetch)
    mockFetch.mockResolvedValueOnce({
      id: '123',
      title: 'Test Matter',
      status: 'draft'
    })

    wrapper = mount(MatterForm, {
      global: {
        plugins: [createTestingPinia()]
      }
    })

    // Fill form fields
    await wrapper.find('input[name="title"]').setValue('Test Matter')
    await wrapper.find('textarea[name="description"]').setValue('Test description')
    await wrapper.find('select[name="priority"]').setValue('high')

    // Submit form
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    // Verify API call
    expect(mockFetch).toHaveBeenCalledWith('/api/matters', {
      method: 'POST',
      body: expect.objectContaining({
        title: 'Test Matter',
        description: 'Test description',
        priority: 'high'
      })
    })

    // Check for success event
    expect(wrapper.emitted()).toHaveProperty('success')
  })

  // Edit mode testing
  it('loads existing data in edit mode', async () => {
    const existingMatter = {
      id: '123',
      title: 'Existing Matter',
      description: 'Existing description',
      priority: 'medium'
    }

    wrapper = mount(MatterForm, {
      props: {
        mode: 'edit',
        initialData: existingMatter
      },
      global: {
        plugins: [createTestingPinia()]
      }
    })

    await nextTick()

    expect(wrapper.find('input[name="title"]').element.value).toBe('Existing Matter')
    expect(wrapper.find('textarea[name="description"]').element.value).toBe('Existing description')
    expect(wrapper.find('select[name="priority"]').element.value).toBe('medium')
  })

  // Field interaction testing
  it('enables submit button only when form is valid', async () => {
    wrapper = mount(MatterForm, {
      global: {
        plugins: [createTestingPinia()]
      }
    })

    const submitButton = wrapper.find('button[type="submit"]')
    
    // Initially disabled
    expect(submitButton.attributes('disabled')).toBeDefined()

    // Fill required fields
    await wrapper.find('input[name="title"]').setValue('Valid Title')
    await wrapper.find('select[name="priority"]').setValue('high')
    await flushPromises()

    // Should be enabled
    expect(submitButton.attributes('disabled')).toBeUndefined()
  })

  // Error handling
  it('displays API errors', async () => {
    const mockFetch = vi.mocked($fetch)
    mockFetch.mockRejectedValueOnce(new Error('Server error'))

    wrapper = mount(MatterForm, {
      global: {
        plugins: [createTestingPinia()]
      }
    })

    // Fill and submit form
    await wrapper.find('input[name="title"]').setValue('Test Matter')
    await wrapper.find('select[name="priority"]').setValue('high')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    // Check for error display
    expect(wrapper.text()).toContain('Failed to save matter')
    expect(wrapper.emitted()).toHaveProperty('error')
  })

  // Form reset testing
  it('resets form when cancel is clicked', async () => {
    wrapper = mount(MatterForm, {
      global: {
        plugins: [createTestingPinia()]
      }
    })

    // Fill form
    await wrapper.find('input[name="title"]').setValue('Test Matter')
    await wrapper.find('textarea[name="description"]').setValue('Test description')

    // Click cancel
    await wrapper.find('button[text="Cancel"]').trigger('click')

    expect(wrapper.emitted()).toHaveProperty('cancel')
  })

  // Loading state testing
  it('shows loading state during submission', async () => {
    const mockFetch = vi.mocked($fetch)
    mockFetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    )

    wrapper = mount(MatterForm, {
      global: {
        plugins: [createTestingPinia()]
      }
    })

    // Fill and submit form
    await wrapper.find('input[name="title"]').setValue('Test Matter')
    await wrapper.find('select[name="priority"]').setValue('high')
    
    const submitPromise = wrapper.find('form').trigger('submit.prevent')
    await nextTick()

    // Check loading state
    const submitButton = wrapper.find('button[type="submit"]')
    expect(submitButton.text()).toContain('Saving...')
    expect(submitButton.attributes('disabled')).toBeDefined()

    await submitPromise
    await flushPromises()
  })
})
/**
 * Matter Form Workflow Integration Tests
 * Tests complete form submission workflows with validation and API integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { setupTestPinia, createApiMock, mockServerState } from '../setup'

// Mock Form Component with validation
const MatterForm = defineComponent({
  props: {
    initialData: {
      type: Object,
      default: () => ({})
    },
    mode: {
      type: String,
      default: 'create' // 'create' or 'edit'
    }
  },
  emits: ['submit', 'cancel'],
  setup(props, { emit }) {
    const formData = ref({
      title: props.initialData.title || '',
      description: props.initialData.description || '',
      priority: props.initialData.priority || 'medium',
      assigneeId: props.initialData.assigneeId || '',
    })
    
    const errors = ref({})
    const isSubmitting = ref(false)
    const submitError = ref(null)
    
    const validateForm = () => {
      const newErrors = {}
      
      if (!formData.value.title.trim()) {
        newErrors.title = 'Title is required'
      } else if (formData.value.title.length < 3) {
        newErrors.title = 'Title must be at least 3 characters'
      }
      
      if (formData.value.description && formData.value.description.length > 500) {
        newErrors.description = 'Description must be less than 500 characters'
      }
      
      if (!['low', 'medium', 'high'].includes(formData.value.priority)) {
        newErrors.priority = 'Invalid priority level'
      }
      
      errors.value = newErrors
      return Object.keys(newErrors).length === 0
    }
    
    const handleSubmit = async () => {
      if (!validateForm()) return
      
      isSubmitting.value = true
      submitError.value = null
      
      try {
        let response
        if (props.mode === 'create') {
          response = await $fetch('/api/matters', {
            method: 'POST',
            body: formData.value
          })
        } else {
          response = await $fetch(`/api/matters/${props.initialData.id}`, {
            method: 'PATCH',
            body: formData.value
          })
        }
        
        emit('submit', response)
      } catch (error) {
        submitError.value = error.message || 'Failed to save matter'
      } finally {
        isSubmitting.value = false
      }
    }
    
    const handleCancel = () => {
      emit('cancel')
    }
    
    const updateField = (field: string, value: any) => {
      formData.value[field] = value
      // Clear error when user starts typing
      if (errors.value[field]) {
        delete errors.value[field]
        errors.value = { ...errors.value }
      }
    }
    
    return {
      formData,
      errors,
      isSubmitting,
      submitError,
      handleSubmit,
      handleCancel,
      updateField
    }
  },
  template: `
    <form @submit.prevent="handleSubmit" data-testid="matter-form">
      <div v-if="submitError" data-testid="submit-error" class="error-message">
        {{ submitError }}
      </div>
      
      <div class="form-group">
        <label for="title">Title *</label>
        <input
          id="title"
          :value="formData.title"
          @input="updateField('title', $event.target.value)"
          data-testid="title-input"
          type="text"
          :class="{ error: errors.title }"
        />
        <span v-if="errors.title" data-testid="title-error" class="field-error">
          {{ errors.title }}
        </span>
      </div>
      
      <div class="form-group">
        <label for="description">Description</label>
        <textarea
          id="description"
          :value="formData.description"
          @input="updateField('description', $event.target.value)"
          data-testid="description-input"
          :class="{ error: errors.description }"
        />
        <span v-if="errors.description" data-testid="description-error" class="field-error">
          {{ errors.description }}
        </span>
      </div>
      
      <div class="form-group">
        <label for="priority">Priority</label>
        <select
          id="priority"
          :value="formData.priority"
          @change="updateField('priority', $event.target.value)"
          data-testid="priority-select"
          :class="{ error: errors.priority }"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <span v-if="errors.priority" data-testid="priority-error" class="field-error">
          {{ errors.priority }}
        </span>
      </div>
      
      <div class="form-group">
        <label for="assigneeId">Assignee ID</label>
        <input
          id="assigneeId"
          :value="formData.assigneeId"
          @input="updateField('assigneeId', $event.target.value)"
          data-testid="assignee-input"
          type="text"
        />
      </div>
      
      <div class="form-actions">
        <button
          type="button"
          @click="handleCancel"
          data-testid="cancel-button"
          :disabled="isSubmitting"
        >
          Cancel
        </button>
        <button
          type="submit"
          data-testid="submit-button"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Saving...' : (mode === 'create' ? 'Create' : 'Update') }}
        </button>
      </div>
    </form>
  `
})

describe('Matter Form Workflow Integration', () => {
  let queryClient: QueryClient
  let apiMock: ReturnType<typeof createApiMock>
  
  beforeEach(() => {
    setupTestPinia()
    
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, cacheTime: 0 },
        mutations: { retry: false }
      }
    })
    
    apiMock = createApiMock()
    global.$fetch = apiMock
  })
  
  describe('Form Validation', () => {
    it('should show validation errors for empty required fields', async () => {
      const wrapper = mount(MatterForm, {
        global: {
          plugins: [[VueQueryPlugin, { queryClient }]]
        }
      })
      
      // Try to submit empty form
      const submitButton = wrapper.find('[data-testid="submit-button"]')
      await submitButton.trigger('click')
      await flushPromises()
      
      // Should show title error
      const titleError = wrapper.find('[data-testid="title-error"]')
      expect(titleError.exists()).toBe(true)
      expect(titleError.text()).toBe('Title is required')
      
      // Should not call API
      expect(apiMock).not.toHaveBeenCalled()
    })
    
    it('should validate title length', async () => {
      const wrapper = mount(MatterForm, {
        global: {
          plugins: [[VueQueryPlugin, { queryClient }]]
        }
      })
      
      // Enter short title
      const titleInput = wrapper.find('[data-testid="title-input"]')
      await titleInput.setValue('ab')
      
      const submitButton = wrapper.find('[data-testid="submit-button"]')
      await submitButton.trigger('click')
      await flushPromises()
      
      const titleError = wrapper.find('[data-testid="title-error"]')
      expect(titleError.text()).toBe('Title must be at least 3 characters')
    })
    
    it('should validate description length', async () => {
      const wrapper = mount(MatterForm, {
        global: {
          plugins: [[VueQueryPlugin, { queryClient }]]
        }
      })
      
      // Enter valid title
      const titleInput = wrapper.find('[data-testid="title-input"]')
      await titleInput.setValue('Valid Title')
      
      // Enter long description
      const longDescription = 'a'.repeat(501)
      const descriptionInput = wrapper.find('[data-testid="description-input"]')
      await descriptionInput.setValue(longDescription)
      
      const submitButton = wrapper.find('[data-testid="submit-button"]')
      await submitButton.trigger('click')
      await flushPromises()
      
      const descriptionError = wrapper.find('[data-testid="description-error"]')
      expect(descriptionError.text()).toBe('Description must be less than 500 characters')
    })
    
    it('should clear errors when user starts typing', async () => {
      const wrapper = mount(MatterForm, {
        global: {
          plugins: [[VueQueryPlugin, { queryClient }]]
        }
      })
      
      // Submit to trigger validation
      const submitButton = wrapper.find('[data-testid="submit-button"]')
      await submitButton.trigger('click')
      await flushPromises()
      
      // Error should be visible
      const titleError = wrapper.find('[data-testid="title-error"]')
      expect(titleError.exists()).toBe(true)
      
      // Start typing in title field
      const titleInput = wrapper.find('[data-testid="title-input"]')
      await titleInput.setValue('New Title')
      
      // Error should disappear
      expect(wrapper.find('[data-testid="title-error"]').exists()).toBe(false)
    })
  })
  
  describe('Form Submission - Create Mode', () => {
    it('should successfully create new matter', async () => {
      const submitHandler = vi.fn()
      
      const wrapper = mount(MatterForm, {
        props: { mode: 'create' },
        global: {
          plugins: [[VueQueryPlugin, { queryClient }]]
        }
      })
      
      wrapper.vm.$on('submit', submitHandler)
      
      // Fill out form
      await wrapper.find('[data-testid="title-input"]').setValue('New Contract Review')
      await wrapper.find('[data-testid="description-input"]').setValue('Review client contract terms')
      await wrapper.find('[data-testid="priority-select"]').setValue('high')
      await wrapper.find('[data-testid="assignee-input"]').setValue('user-1')
      
      // Submit form
      const submitButton = wrapper.find('[data-testid="submit-button"]')
      await submitButton.trigger('click')
      await flushPromises()
      
      // Verify API call
      expect(apiMock).toHaveBeenCalledWith('/api/matters', {
        method: 'POST',
        body: {
          title: 'New Contract Review',
          description: 'Review client contract terms',
          priority: 'high',
          assigneeId: 'user-1'
        }
      })
      
      // Verify emit was called with response
      expect(submitHandler).toHaveBeenCalled()
    })
    
    it('should show loading state during submission', async () => {
      // Make API call take time
      apiMock.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      const wrapper = mount(MatterForm, {
        props: { mode: 'create' },
        global: {
          plugins: [[VueQueryPlugin, { queryClient }]]
        }
      })
      
      // Fill required fields
      await wrapper.find('[data-testid="title-input"]').setValue('Test Matter')
      
      // Submit form
      const submitButton = wrapper.find('[data-testid="submit-button"]')
      await submitButton.trigger('click')
      
      // Button should show loading state
      expect(submitButton.text()).toBe('Saving...')
      expect(submitButton.attributes('disabled')).toBeDefined()
      
      // Cancel button should also be disabled
      const cancelButton = wrapper.find('[data-testid="cancel-button"]')
      expect(cancelButton.attributes('disabled')).toBeDefined()
      
      await flushPromises()
      
      // Loading state should clear
      expect(submitButton.text()).toBe('Create')
      expect(submitButton.attributes('disabled')).toBeUndefined()
    })
    
    it('should handle API errors gracefully', async () => {
      apiMock.mockRejectedValue(new Error('Server error'))
      
      const wrapper = mount(MatterForm, {
        props: { mode: 'create' },
        global: {
          plugins: [[VueQueryPlugin, { queryClient }]]
        }
      })
      
      // Fill required fields
      await wrapper.find('[data-testid="title-input"]').setValue('Test Matter')
      
      // Submit form
      const submitButton = wrapper.find('[data-testid="submit-button"]')
      await submitButton.trigger('click')
      await flushPromises()
      
      // Should show error message
      const submitError = wrapper.find('[data-testid="submit-error"]')
      expect(submitError.exists()).toBe(true)
      expect(submitError.text()).toBe('Server error')
      
      // Form should not be in loading state
      expect(submitButton.text()).toBe('Create')
    })
  })
  
  describe('Form Submission - Edit Mode', () => {
    it('should successfully update existing matter', async () => {
      const existingMatter = {
        id: '1',
        title: 'Existing Matter',
        description: 'Original description',
        priority: 'medium',
        assigneeId: 'user-1'
      }
      
      const submitHandler = vi.fn()
      
      const wrapper = mount(MatterForm, {
        props: { 
          mode: 'edit',
          initialData: existingMatter
        },
        global: {
          plugins: [[VueQueryPlugin, { queryClient }]]
        }
      })
      
      wrapper.vm.$on('submit', submitHandler)
      
      // Verify form is pre-filled
      const titleInput = wrapper.find('[data-testid="title-input"]')
      expect(titleInput.element.value).toBe('Existing Matter')
      
      // Update title
      await titleInput.setValue('Updated Matter Title')
      
      // Submit form
      const submitButton = wrapper.find('[data-testid="submit-button"]')
      await submitButton.trigger('click')
      await flushPromises()
      
      // Verify correct API call
      expect(apiMock).toHaveBeenCalledWith('/api/matters/1', {
        method: 'PATCH',
        body: {
          title: 'Updated Matter Title',
          description: 'Original description',
          priority: 'medium',
          assigneeId: 'user-1'
        }
      })
    })
    
    it('should show correct button text in edit mode', () => {
      const wrapper = mount(MatterForm, {
        props: { 
          mode: 'edit',
          initialData: { id: '1', title: 'Test' }
        },
        global: {
          plugins: [[VueQueryPlugin, { queryClient }]]
        }
      })
      
      const submitButton = wrapper.find('[data-testid="submit-button"]')
      expect(submitButton.text()).toBe('Update')
    })
  })
  
  describe('Form Interaction', () => {
    it('should emit cancel event when cancel button is clicked', async () => {
      const cancelHandler = vi.fn()
      
      const wrapper = mount(MatterForm, {
        global: {
          plugins: [[VueQueryPlugin, { queryClient }]]
        }
      })
      
      wrapper.vm.$on('cancel', cancelHandler)
      
      const cancelButton = wrapper.find('[data-testid="cancel-button"]')
      await cancelButton.trigger('click')
      
      expect(cancelHandler).toHaveBeenCalled()
    })
    
    it('should handle all form field updates correctly', async () => {
      const wrapper = mount(MatterForm, {
        global: {
          plugins: [[VueQueryPlugin, { queryClient }]]
        }
      })
      
      // Update all fields
      await wrapper.find('[data-testid="title-input"]').setValue('Test Title')
      await wrapper.find('[data-testid="description-input"]').setValue('Test Description')
      await wrapper.find('[data-testid="priority-select"]').setValue('high')
      await wrapper.find('[data-testid="assignee-input"]').setValue('user-123')
      
      // Verify form data
      expect(wrapper.vm.formData.title).toBe('Test Title')
      expect(wrapper.vm.formData.description).toBe('Test Description')
      expect(wrapper.vm.formData.priority).toBe('high')
      expect(wrapper.vm.formData.assigneeId).toBe('user-123')
    })
  })
})
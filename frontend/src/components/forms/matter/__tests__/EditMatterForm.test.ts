import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import EditMatterForm from '../EditMatterForm.vue'

// Mock dependencies
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn()
  }),
  useRoute: () => ({
    params: { id: 'matter-123' }
  })
}))

// Mock composables
vi.mock('~/composables/useAuth', () => ({
  useAuth: () => ({
    hasPermission: vi.fn().mockReturnValue(true)
  })
}))

vi.mock('~/composables/useToast', () => ({
  useToast: () => ({
    showToast: vi.fn()
  })
}))

// Mock schemas
vi.mock('~/schemas/matter', () => ({
  updateMatterSchema: {
    parse: vi.fn()
  }
}))

// Mock UI components
vi.mock('~/components/ui/alert', () => ({
  Alert: {
    template: '<div class="alert"><slot /></div>'
  },
  AlertDescription: {
    template: '<div class="alert-description"><slot /></div>'
  }
}))

vi.mock('~/components/ui/badge', () => ({
  Badge: {
    template: '<span class="badge" :class="variant"><slot /></span>',
    props: ['variant']
  }
}))

vi.mock('~/components/ui/card', () => ({
  Card: {
    template: '<div class="card"><slot /></div>'
  },
  CardContent: {
    template: '<div class="card-content"><slot /></div>'
  },
  CardHeader: {
    template: '<div class="card-header"><slot /></div>'
  },
  CardTitle: {
    template: '<h3 class="card-title"><slot /></h3>'
  }
}))

// Mock MatterForm component
vi.mock('../MatterForm.vue', () => ({
  default: {
    template: `
      <div class="matter-form">
        <slot name="fields" :values="values" :errors="errors" :meta="meta" />
        <slot name="additional" :values="values" :isValid="isValid" :isDirty="isDirty" />
      </div>
    `,
    props: ['mode', 'schema', 'initialValues', 'loading', 'showHeader', 'formClass', 'title', 'description'],
    emits: ['submit', 'cancel', 'validationChange'],
    setup(props: any, { emit }: any) {
      const values = { 
        title: 'Existing Matter', 
        type: 'CIVIL', 
        status: 'RESEARCH',
        id: 'matter-123'
      }
      const errors = {}
      const meta = { valid: true, dirty: false }
      const isValid = true
      const isDirty = false
      
      return {
        values,
        errors,
        meta,
        isValid,
        isDirty
      }
    }
  }
}))

// Mock field components
vi.mock('../fields/MatterTypeField.vue', () => ({
  default: {
    template: '<div class="matter-type-field"></div>',
    props: ['error']
  }
}))

vi.mock('../fields/MatterStatusField.vue', () => ({
  default: {
    template: '<div class="matter-status-field"></div>',
    props: ['error']
  }
}))

vi.mock('../fields/ClientSelectionField.vue', () => ({
  default: {
    template: '<div class="client-selection-field"></div>',
    props: ['error']
  }
}))

vi.mock('../fields/LawyerAssignmentField.vue', () => ({
  default: {
    template: '<div class="lawyer-assignment-field"></div>',
    props: ['error']
  }
}))

vi.mock('../fields/MatterDateFields.vue', () => ({
  default: {
    template: '<div class="matter-date-fields"></div>',
    props: ['openDateError', 'closeDateError']
  }
}))

// Mock form components
vi.mock('~/components/forms', () => ({
  FormInput: {
    template: '<input class="form-input" />',
    props: ['name', 'placeholder', 'error', 'type']
  },
  FormTextarea: {
    template: '<textarea class="form-textarea"></textarea>',
    props: ['name', 'placeholder', 'error', 'rows']
  },
  FormSelect: {
    template: '<select class="form-select"></select>',
    props: ['name', 'error', 'options']
  },
  FormFieldWrapper: {
    template: '<div class="form-field-wrapper"><label v-if="label">{{ label }}</label><slot /></div>',
    props: ['label', 'description', 'required']
  }
}))

// Mock $fetch
const mockFetch = vi.fn()
global.$fetch = mockFetch

describe('EditMatterForm', () => {
  const mockMatterData = {
    id: 'matter-123',
    title: 'Test Legal Matter',
    description: 'A test matter description',
    type: 'CIVIL',
    status: 'RESEARCH',
    priority: 'HIGH',
    clientId: 'client-1',
    assignedLawyerIds: ['lawyer-1', 'lawyer-2'],
    openDate: '2024-01-01T00:00:00.000Z',
    closeDate: null,
    matterNumber: 'MAT-2024-001',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z',
    estimatedValue: 50000,
    billableHours: 100,
    tags: ['corporate', 'contract']
  }

  const mockRouter = {
    push: vi.fn()
  }

  const mockAuth = {
    hasPermission: vi.fn().mockReturnValue(true)
  }

  const mockToast = {
    showToast: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
    
    // Reset mocks
    vi.mocked(mockRouter.push).mockClear()
    vi.mocked(mockAuth.hasPermission).mockClear()
    vi.mocked(mockToast.showToast).mockClear()

    // Mock successful matter loading
    mockFetch.mockResolvedValue(mockMatterData)
  })

  it('renders with default props', async () => {
    const wrapper = mount(EditMatterForm, {
      props: {
        matterId: 'matter-123'
      }
    })
    
    // Wait for matter to load
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(wrapper.find('.edit-matter-form').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'MatterForm' }).exists()).toBe(true)
  })

  it('loads matter data on mount when no matterData provided', async () => {
    mount(EditMatterForm, {
      props: {
        matterId: 'matter-123'
      }
    })

    await nextTick()
    
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/matters/matter-123')
  })

  it('uses pre-loaded matter data when provided', async () => {
    const wrapper = mount(EditMatterForm, {
      props: {
        matterId: 'matter-123',
        matterData: mockMatterData
      }
    })

    const component = wrapper.vm as any
    await nextTick()

    expect(mockFetch).not.toHaveBeenCalled()
    expect(component.originalMatter).toEqual(mockMatterData)
    expect(component.currentMatter).toEqual(mockMatterData)
  })

  it('displays matter information header', async () => {
    const wrapper = mount(EditMatterForm, {
      props: {
        matterId: 'matter-123',
        matterData: mockMatterData
      }
    })

    await nextTick()

    expect(wrapper.text()).toContain('MAT-2024-001')
    expect(wrapper.text()).toContain('RESEARCH')
    expect(wrapper.text()).toContain('1/1/2024') // Created date
    expect(wrapper.text()).toContain('1/15/2024') // Updated date
  })

  it('passes correct props to MatterForm', async () => {
    const wrapper = mount(EditMatterForm, {
      props: {
        matterId: 'matter-123',
        matterData: mockMatterData,
        showHeader: false,
        formClass: 'custom-class'
      }
    })

    await nextTick()

    const matterForm = wrapper.findComponent({ name: 'MatterForm' })
    expect(matterForm.props('mode')).toBe('edit')
    expect(matterForm.props('showHeader')).toBe(false)
    expect(matterForm.props('formClass')).toBe('custom-class')
    expect(matterForm.props('title')).toContain('Edit Matter: Test Legal Matter')
  })

  it('submits form with correct data transformation', async () => {
    const mockResponse = { ...mockMatterData, title: 'Updated Matter' }
    mockFetch.mockResolvedValue(mockResponse)

    const wrapper = mount(EditMatterForm, {
      props: {
        matterId: 'matter-123',
        matterData: mockMatterData
      }
    })
    const component = wrapper.vm as any

    const formData = {
      title: '  Updated Matter  ', // With whitespace
      description: '  Updated description  ',
      type: 'CRIMINAL',
      status: 'TRIAL',
      priority: 'URGENT',
      openDate: '2024-01-01',
      closeDate: '2024-12-31',
      estimatedValue: '75000',
      billableHours: '150',
      tags: 'tag1, tag2, tag3'
    }

    await component.handleSubmit(formData)

    expect(mockFetch).toHaveBeenCalledWith('/api/v1/matters/matter-123', {
      method: 'PUT',
      body: expect.objectContaining({
        id: 'matter-123',
        title: 'Updated Matter', // Trimmed
        description: 'Updated description', // Trimmed
        type: 'CRIMINAL',
        status: 'TRIAL',
        priority: 'URGENT',
        openDate: expect.any(String), // ISO string
        closeDate: expect.any(String), // ISO string
        estimatedValue: 75000, // Converted to number
        billableHours: 150, // Converted to number
        tags: ['tag1', 'tag2', 'tag3'] // Split and trimmed
      }),
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  })

  it('validates that title cannot be empty', async () => {
    const wrapper = mount(EditMatterForm, {
      props: {
        matterId: 'matter-123',
        matterData: mockMatterData
      }
    })
    const component = wrapper.vm as any

    await component.handleSubmit({ title: '   ' }) // Only whitespace
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('validates date logic', async () => {
    const wrapper = mount(EditMatterForm, {
      props: {
        matterId: 'matter-123',
        matterData: mockMatterData
      }
    })
    const component = wrapper.vm as any

    const formData = {
      title: 'Updated Matter',
      openDate: '2024-12-31',
      closeDate: '2024-01-01' // Before open date
    }

    await component.handleSubmit(formData)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('handles API errors correctly', async () => {
    const errorResponse = {
      status: 400,
      data: {
        message: 'Invalid data',
        validationErrors: {
          title: ['Title is invalid']
        }
      }
    }
    mockFetch.mockRejectedValue(errorResponse)

    const wrapper = mount(EditMatterForm, {
      props: {
        matterId: 'matter-123',
        matterData: mockMatterData
      }
    })
    const component = wrapper.vm as any

    await component.handleSubmit({ title: 'Updated Matter' })

    expect(component.error).toContain('Validation errors')
    expect(component.showToast).toHaveBeenCalledWith(
      expect.stringContaining('Validation errors'),
      'error'
    )
  })

  it('handles 404 error by redirecting to matters list', async () => {
    mockFetch.mockRejectedValue({ status: 404 })

    const wrapper = mount(EditMatterForm, {
      props: {
        matterId: 'matter-123',
        matterData: mockMatterData
      }
    })
    const component = wrapper.vm as any

    await component.handleSubmit({ title: 'Updated Matter' })

    expect(component.error).toContain('not found')
    expect(mockRouter.push).toHaveBeenCalledWith('/matters')
  })

  it('handles 409 conflict error', async () => {
    mockFetch.mockRejectedValue({ status: 409 })

    const wrapper = mount(EditMatterForm, {
      props: {
        matterId: 'matter-123',
        matterData: mockMatterData
      }
    })
    const component = wrapper.vm as any

    await component.handleSubmit({ title: 'Updated Matter' })
    expect(component.error).toContain('modified by another user')
  })

  it('shows success state after successful update', async () => {
    const mockResponse = { ...mockMatterData, title: 'Updated Matter' }
    mockFetch.mockResolvedValue(mockResponse)

    const wrapper = mount(EditMatterForm, {
      props: {
        matterId: 'matter-123',
        matterData: mockMatterData
      }
    })
    const component = wrapper.vm as any

    await component.handleSubmit({ title: 'Updated Matter' })

    expect(component.saveSuccess).toBe(true)
    expect(wrapper.find('.success-alert').exists()).toBe(true)
    expect(wrapper.text()).toContain('Matter Updated Successfully')
  })

  it('updates local state after successful submission', async () => {
    const mockResponse = { ...mockMatterData, title: 'Updated Matter' }
    mockFetch.mockResolvedValue(mockResponse)

    const wrapper = mount(EditMatterForm, {
      props: {
        matterId: 'matter-123',
        matterData: mockMatterData
      }
    })
    const component = wrapper.vm as any

    await component.handleSubmit({ title: 'Updated Matter' })

    expect(component.originalMatter).toEqual(mockResponse)
    expect(component.currentMatter).toEqual(mockResponse)
    expect(component.hasUnsavedChanges).toBe(false)
    expect(component.lastSaved).toBeInstanceOf(Date)
  })

  it('emits updated event', async () => {
    const mockResponse = { ...mockMatterData, title: 'Updated Matter' }
    mockFetch.mockResolvedValue(mockResponse)

    const wrapper = mount(EditMatterForm, {
      props: {
        matterId: 'matter-123',
        matterData: mockMatterData
      }
    })
    const component = wrapper.vm as any

    await component.handleSubmit({ title: 'Updated Matter' })

    expect(wrapper.emitted('updated')).toBeTruthy()
    expect(wrapper.emitted('updated')?.[0]).toEqual([mockResponse])
  })

  it('shows auto-save status when enabled', async () => {
    const wrapper = mount(EditMatterForm, {
      props: {
        matterId: 'matter-123',
        matterData: mockMatterData,
        autoSave: true
      }
    })

    await nextTick()

    expect(wrapper.text()).toContain('Auto-save is enabled')
    expect(wrapper.find('.badge').exists()).toBe(true)
  })

  it('handles auto-save correctly', async () => {
    const mockResponse = { ...mockMatterData, title: 'Auto-saved' }
    mockFetch.mockResolvedValue(mockResponse)

    const wrapper = mount(EditMatterForm, {
      props: {
        matterId: 'matter-123',
        matterData: mockMatterData,
        autoSave: true
      }
    })
    const component = wrapper.vm as any

    component.hasUnsavedChanges = true
    await component.handleAutoSave({ title: 'Auto-saved' })

    expect(mockFetch).toHaveBeenCalledWith('/api/v1/matters/matter-123', {
      method: 'PATCH',
      body: expect.objectContaining({
        id: 'matter-123',
        title: 'Auto-saved'
      })
    })

    expect(wrapper.emitted('autoSaved')).toBeTruthy()
    expect(component.hasUnsavedChanges).toBe(false)
  })

  it('handles cancellation with unsaved changes', async () => {
    // Mock confirm dialog
    window.confirm = vi.fn().mockReturnValue(true)

    const wrapper = mount(EditMatterForm, {
      props: {
        matterId: 'matter-123',
        matterData: mockMatterData
      }
    })
    const component = wrapper.vm as any

    component.hasUnsavedChanges = true
    component.handleCancel()

    expect(window.confirm).toHaveBeenCalled()
    expect(wrapper.emitted('cancelled')).toBeTruthy()
    expect(mockRouter.push).toHaveBeenCalledWith('/matters/matter-123')
  })

  it('handles cancellation without unsaved changes', async () => {
    const wrapper = mount(EditMatterForm, {
      props: {
        matterId: 'matter-123',
        matterData: mockMatterData
      }
    })
    const component = wrapper.vm as any

    component.hasUnsavedChanges = false
    component.handleCancel()

    expect(wrapper.emitted('cancelled')).toBeTruthy()
    expect(mockRouter.push).toHaveBeenCalledWith('/matters/matter-123')
  })

  it('shows loading state while loading matter', () => {
    const wrapper = mount(EditMatterForm, {
      props: {
        matterId: 'matter-123'
      }
    })

    const component = wrapper.vm as any
    component.loading = true
    component.currentMatter = null

    expect(wrapper.text()).toContain('Loading matter data...')
    expect(wrapper.find('.animate-spin').exists()).toBe(true)
  })

  it('shows pending changes card when form is dirty', async () => {
    const wrapper = mount(EditMatterForm, {
      props: {
        matterId: 'matter-123',
        matterData: mockMatterData
      }
    })

    await nextTick()

    // In the mock, isDirty is false, but let's test the template logic
    expect(wrapper.text()).toContain('Pending Changes')
    expect(wrapper.text()).toContain('unsaved changes')
  })

  it('gets matter ID from route params when not provided', () => {
    const wrapper = mount(EditMatterForm)
    const component = wrapper.vm as any

    expect(component.matterId).toBe('matter-123') // From mocked route params
  })

  it('computes matter title correctly', async () => {
    const wrapper = mount(EditMatterForm, {
      props: {
        matterId: 'matter-123',
        matterData: mockMatterData
      }
    })

    await nextTick()

    const component = wrapper.vm as any
    expect(component.matterTitle).toBe('Test Legal Matter')
  })

  it('computes auto-save status correctly', async () => {
    const wrapper = mount(EditMatterForm, {
      props: {
        matterId: 'matter-123',
        matterData: mockMatterData,
        autoSave: true
      }
    })

    const component = wrapper.vm as any

    // Test different states
    component.loading = true
    expect(component.autoSaveStatus).toBe('saving')

    component.loading = false
    component.hasUnsavedChanges = false
    expect(component.autoSaveStatus).toBe('saved')

    component.hasUnsavedChanges = true
    expect(component.autoSaveStatus).toBe('pending')
  })

  it('shows error alert when error occurs', async () => {
    const wrapper = mount(EditMatterForm, {
      props: {
        matterId: 'matter-123',
        matterData: mockMatterData
      }
    })
    const component = wrapper.vm as any

    component.error = 'Test error'
    await nextTick()

    expect(wrapper.find('.error-alert').exists()).toBe(true)
    expect(wrapper.text()).toContain('Error Updating Matter')
    expect(wrapper.text()).toContain('Test error')
  })

  it('allows dismissing error alert', async () => {
    const wrapper = mount(EditMatterForm, {
      props: {
        matterId: 'matter-123',
        matterData: mockMatterData
      }
    })
    const component = wrapper.vm as any

    component.error = 'Test error'
    await nextTick()

    const dismissButton = wrapper.find('.error-dismiss')
    await dismissButton.trigger('click')

    expect(component.error).toBeNull()
  })

  it('checks permissions on mount', () => {
    mockAuth.hasPermission.mockReturnValue(false)

    mount(EditMatterForm, {
      props: {
        matterId: 'matter-123'
      }
    })

    expect(mockToast.showToast).toHaveBeenCalledWith(
      'You do not have permission to edit matters',
      'error'
    )
    expect(mockRouter.push).toHaveBeenCalledWith('/matters')
  })

  it('has proper accessibility attributes', async () => {
    const wrapper = mount(EditMatterForm, {
      props: {
        matterId: 'matter-123',
        matterData: mockMatterData
      }
    })
    const component = wrapper.vm as any

    component.error = 'Test error'
    await nextTick()

    const errorAlert = wrapper.find('.error-alert')
    expect(errorAlert.attributes('role')).toBe('alert')

    component.saveSuccess = true
    await nextTick()

    const successAlert = wrapper.find('.success-alert')
    expect(successAlert.attributes('role')).toBe('alert')
  })

  it('matches snapshot', async () => {
    const wrapper = mount(EditMatterForm, {
      props: {
        matterId: 'matter-123',
        matterData: mockMatterData,
        showHeader: true,
        autoSave: true
      }
    })
    
    await nextTick()
    
    expect(wrapper.html()).toMatchSnapshot()
  })
})
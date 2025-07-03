import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import CreateMatterForm from '../CreateMatterForm.vue'

// Mock dependencies
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn()
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
  createMatterSchema: {
    parse: vi.fn()
  }
}))

// Mock UI components
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
    emits: ['submit', 'cancel'],
    setup(props: any, { emit }: any) {
      const values = { title: 'Test Matter', type: 'CIVIL', status: 'INVESTIGATION' }
      const errors = {}
      const meta = { valid: true, dirty: true }
      const isValid = true
      const isDirty = true
      
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

describe('CreateMatterForm', () => {
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
  })

  it('renders with default props', () => {
    const wrapper = mount(CreateMatterForm)
    
    expect(wrapper.find('.create-matter-form').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'MatterForm' }).exists()).toBe(true)
  })

  it('passes correct props to MatterForm', () => {
    const wrapper = mount(CreateMatterForm, {
      props: {
        showHeader: false,
        formClass: 'custom-class',
        redirectTo: '/custom-path'
      }
    })

    const matterForm = wrapper.findComponent({ name: 'MatterForm' })
    expect(matterForm.props('mode')).toBe('create')
    expect(matterForm.props('showHeader')).toBe(false)
    expect(matterForm.props('formClass')).toBe('custom-class')
    expect(matterForm.props('title')).toBe('Create New Matter')
  })

  it('renders all form fields', () => {
    const wrapper = mount(CreateMatterForm)
    
    // Basic form inputs
    expect(wrapper.find('.form-input').exists()).toBe(true)
    expect(wrapper.find('.form-textarea').exists()).toBe(true)
    expect(wrapper.find('.form-select').exists()).toBe(true)
    
    // Custom field components
    expect(wrapper.find('.matter-type-field').exists()).toBe(true)
    expect(wrapper.find('.matter-status-field').exists()).toBe(true)
    expect(wrapper.find('.client-selection-field').exists()).toBe(true)
    expect(wrapper.find('.lawyer-assignment-field').exists()).toBe(true)
    expect(wrapper.find('.matter-date-fields').exists()).toBe(true)
  })

  it('submits form with correct data transformation', async () => {
    const mockResponse = { id: 'matter-123', title: 'Test Matter' }
    mockFetch.mockResolvedValue(mockResponse)

    const wrapper = mount(CreateMatterForm)
    const component = wrapper.vm as any

    const formData = {
      title: '  Test Matter  ', // With whitespace
      description: '  Test description  ',
      clientId: 'client-1',
      assignedLawyerIds: ['lawyer-1', 'lawyer-2'],
      type: 'CIVIL',
      status: 'INVESTIGATION',
      priority: 'HIGH',
      openDate: '2024-01-01',
      closeDate: '2024-12-31',
      estimatedValue: '50000',
      billableHours: '100',
      tags: 'tag1, tag2, tag3'
    }

    await component.handleSubmit(formData)

    expect(mockFetch).toHaveBeenCalledWith('/api/v1/matters', {
      method: 'POST',
      body: expect.objectContaining({
        title: 'Test Matter', // Trimmed
        description: 'Test description', // Trimmed
        clientId: 'client-1',
        assignedLawyerIds: ['lawyer-1', 'lawyer-2'],
        type: 'CIVIL',
        status: 'INVESTIGATION',
        priority: 'HIGH',
        openDate: expect.any(String), // ISO string
        closeDate: expect.any(String), // ISO string
        estimatedValue: 50000, // Converted to number
        billableHours: 100, // Converted to number
        tags: ['tag1', 'tag2', 'tag3'] // Split and trimmed
      }),
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  })

  it('validates required fields before submission', async () => {
    const wrapper = mount(CreateMatterForm)
    const component = wrapper.vm as any

    // Test missing title
    await component.handleSubmit({ title: '', clientId: 'client-1', assignedLawyerIds: ['lawyer-1'] })
    expect(mockFetch).not.toHaveBeenCalled()

    // Test missing client
    await component.handleSubmit({ title: 'Test', clientId: '', assignedLawyerIds: ['lawyer-1'] })
    expect(mockFetch).not.toHaveBeenCalled()

    // Test missing lawyers
    await component.handleSubmit({ title: 'Test', clientId: 'client-1', assignedLawyerIds: [] })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('validates date logic', async () => {
    const wrapper = mount(CreateMatterForm)
    const component = wrapper.vm as any

    const formData = {
      title: 'Test Matter',
      clientId: 'client-1',
      assignedLawyerIds: ['lawyer-1'],
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
          title: ['Title is required']
        }
      }
    }
    mockFetch.mockRejectedValue(errorResponse)

    const wrapper = mount(CreateMatterForm)
    const component = wrapper.vm as any

    const formData = {
      title: 'Test Matter',
      clientId: 'client-1',
      assignedLawyerIds: ['lawyer-1']
    }

    await component.handleSubmit(formData)

    expect(component.error).toContain('Validation errors')
    expect(component.showToast).toHaveBeenCalledWith(
      expect.stringContaining('Validation errors'),
      'error'
    )
  })

  it('handles different HTTP error codes', async () => {
    const wrapper = mount(CreateMatterForm)
    const component = wrapper.vm as any

    const formData = {
      title: 'Test Matter',
      clientId: 'client-1',
      assignedLawyerIds: ['lawyer-1']
    }

    // Test 401 Unauthorized
    mockFetch.mockRejectedValue({ status: 401 })
    await component.handleSubmit(formData)
    expect(component.error).toContain('not authorized')

    // Test 403 Forbidden
    mockFetch.mockRejectedValue({ status: 403 })
    await component.handleSubmit(formData)
    expect(component.error).toContain('permission')

    // Test 409 Conflict
    mockFetch.mockRejectedValue({ status: 409 })
    await component.handleSubmit(formData)
    expect(component.error).toContain('already exists')

    // Test 500 Server Error
    mockFetch.mockRejectedValue({ status: 500 })
    await component.handleSubmit(formData)
    expect(component.error).toContain('Server error')
  })

  it('handles timeout errors', async () => {
    mockFetch.mockRejectedValue({ name: 'AbortError' })

    const wrapper = mount(CreateMatterForm)
    const component = wrapper.vm as any

    const formData = {
      title: 'Test Matter',
      clientId: 'client-1',
      assignedLawyerIds: ['lawyer-1']
    }

    await component.handleSubmit(formData)
    expect(component.error).toContain('timed out')
  })

  it('shows loading state during submission', async () => {
    mockFetch.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    const wrapper = mount(CreateMatterForm)
    const component = wrapper.vm as any

    const formData = {
      title: 'Test Matter',
      clientId: 'client-1',
      assignedLawyerIds: ['lawyer-1']
    }

    const submitPromise = component.handleSubmit(formData)
    
    // Should be loading
    expect(component.loading).toBe(true)
    expect(wrapper.find('.loading-overlay').exists()).toBe(true)

    await submitPromise

    // Should not be loading anymore
    expect(component.loading).toBe(false)
  })

  it('shows success state after successful submission', async () => {
    const mockResponse = { id: 'matter-123' }
    mockFetch.mockResolvedValue(mockResponse)

    const wrapper = mount(CreateMatterForm)
    const component = wrapper.vm as any

    const formData = {
      title: 'Test Matter',
      clientId: 'client-1',
      assignedLawyerIds: ['lawyer-1']
    }

    await component.handleSubmit(formData)

    expect(component.showSuccess).toBe(true)
    expect(wrapper.find('.success-overlay').exists()).toBe(true)
    expect(wrapper.text()).toContain('Matter created successfully!')
  })

  it('redirects after successful submission', async () => {
    const mockResponse = { id: 'matter-123' }
    mockFetch.mockResolvedValue(mockResponse)

    const wrapper = mount(CreateMatterForm, {
      props: {
        redirectTo: '/matters'
      }
    })
    const component = wrapper.vm as any

    const formData = {
      title: 'Test Matter',
      clientId: 'client-1',
      assignedLawyerIds: ['lawyer-1']
    }

    await component.handleSubmit(formData)

    // Should redirect after delay
    await new Promise(resolve => setTimeout(resolve, 1600))
    expect(mockRouter.push).toHaveBeenCalledWith('/matters/matter-123')
  })

  it('emits events correctly', async () => {
    const mockResponse = { id: 'matter-123' }
    mockFetch.mockResolvedValue(mockResponse)

    const wrapper = mount(CreateMatterForm)
    const component = wrapper.vm as any

    const formData = {
      title: 'Test Matter',
      clientId: 'client-1',
      assignedLawyerIds: ['lawyer-1']
    }

    await component.handleSubmit(formData)

    expect(wrapper.emitted('created')).toBeTruthy()
    expect(wrapper.emitted('created')?.[0]).toEqual([mockResponse])
  })

  it('handles cancellation', () => {
    const wrapper = mount(CreateMatterForm)
    const component = wrapper.vm as any

    component.handleCancel()

    expect(wrapper.emitted('cancelled')).toBeTruthy()
    expect(mockRouter.push).toHaveBeenCalledWith('/matters')
  })

  it('checks permissions on mount', () => {
    mockAuth.hasPermission.mockReturnValue(false)

    mount(CreateMatterForm)

    expect(mockToast.showToast).toHaveBeenCalledWith(
      'You do not have permission to create matters',
      'error'
    )
    expect(mockRouter.push).toHaveBeenCalledWith('/matters')
  })

  it('shows error alert when error occurs', async () => {
    mockFetch.mockRejectedValue({ message: 'Test error' })

    const wrapper = mount(CreateMatterForm)
    const component = wrapper.vm as any

    const formData = {
      title: 'Test Matter',
      clientId: 'client-1',
      assignedLawyerIds: ['lawyer-1']
    }

    await component.handleSubmit(formData)

    expect(wrapper.find('.error-alert').exists()).toBe(true)
    expect(wrapper.text()).toContain('Error Creating Matter')
  })

  it('allows dismissing error alert', async () => {
    const wrapper = mount(CreateMatterForm)
    const component = wrapper.vm as any

    component.error = 'Test error'
    await nextTick()

    expect(wrapper.find('.error-alert').exists()).toBe(true)

    const dismissButton = wrapper.find('.error-dismiss')
    await dismissButton.trigger('click')

    expect(component.error).toBeNull()
  })

  it('renders form summary when form is dirty', () => {
    const wrapper = mount(CreateMatterForm)
    
    // Form summary should be rendered in the additional slot
    expect(wrapper.text()).toContain('Form Summary')
    expect(wrapper.text()).toContain('Status:')
    expect(wrapper.text()).toContain('Type:')
    expect(wrapper.text()).toContain('Priority:')
    expect(wrapper.text()).toContain('Valid:')
  })

  it('sets default initial values correctly', () => {
    const wrapper = mount(CreateMatterForm, {
      props: {
        initialValues: {
          title: 'Custom Title'
        }
      }
    })

    const component = wrapper.vm as any
    expect(component.defaultValues).toEqual(
      expect.objectContaining({
        priority: 'MEDIUM',
        status: 'INVESTIGATION',
        title: 'Custom Title',
        tags: [],
        customFields: {}
      })
    )
  })

  it('has proper accessibility attributes', () => {
    const wrapper = mount(CreateMatterForm)
    
    const errorAlert = wrapper.find('.error-alert')
    if (errorAlert.exists()) {
      expect(errorAlert.attributes('role')).toBe('alert')
    }

    const successOverlay = wrapper.find('.success-overlay')
    if (successOverlay.exists()) {
      expect(successOverlay.attributes('role')).toBe('alert')
    }
  })

  it('matches snapshot', () => {
    const wrapper = mount(CreateMatterForm, {
      props: {
        showHeader: true,
        formClass: 'test-class'
      }
    })
    
    expect(wrapper.html()).toMatchSnapshot()
  })
})
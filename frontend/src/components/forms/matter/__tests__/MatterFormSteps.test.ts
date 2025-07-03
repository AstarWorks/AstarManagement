import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import MatterFormSteps from '../MatterFormSteps.vue'

// Mock composables
vi.mock('~/composables/useAuth', () => ({
  useAuth: () => ({
    hasPermission: vi.fn(() => true)
  })
}))

vi.mock('~/composables/useToast', () => ({
  useToast: () => ({
    showToast: vi.fn()
  })
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}))

vi.mock('~/composables/form/useForm', () => ({
  useForm: () => ({
    values: { value: {} },
    errors: { value: {} },
    isDirty: { value: false },
    isValid: { value: true },
    submitCount: { value: 0 },
    setValues: vi.fn(),
    submit: vi.fn()
  })
}))

vi.mock('~/composables/form/useAutoSave', () => ({
  useAutoSave: () => ({
    enable: vi.fn(),
    disable: vi.fn(),
    isEnabled: { value: true },
    isSaving: { value: false },
    lastSave: { value: null },
    lastError: { value: null },
    hasSavedData: { value: false },
    restore: vi.fn(),
    clear: vi.fn()
  })
}))

vi.mock('~/composables/form/useFormNavigationGuard', () => ({
  useFormNavigationGuard: () => ({
    enable: vi.fn(),
    disable: vi.fn(),
    isActive: { value: true },
    hasUnsavedChanges: { value: false }
  })
}))

describe('MatterFormSteps', () => {
  let wrapper: any
  let pinia: any

  beforeEach(() => {
    pinia = createPinia()
    wrapper = mount(MatterFormSteps, {
      global: {
        plugins: [pinia],
        stubs: {
          MultiStepForm: true,
          BasicInfoStep: true,
          ClientDetailsStep: true,
          AssignmentStep: true,
          ReviewStep: true
        }
      }
    })
  })

  it('renders correctly', () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('displays the correct title for create mode', () => {
    expect(wrapper.text()).toContain('Create New Matter')
  })

  it('displays the correct title for edit mode', () => {
    wrapper = mount(MatterFormSteps, {
      props: { mode: 'edit' },
      global: {
        plugins: [pinia],
        stubs: {
          MultiStepForm: true,
          BasicInfoStep: true,
          ClientDetailsStep: true,
          AssignmentStep: true,
          ReviewStep: true
        }
      }
    })
    
    expect(wrapper.text()).toContain('Edit Matter')
  })

  it('shows auto-save status when enabled', () => {
    expect(wrapper.text()).toContain('Auto-save enabled')
  })

  it('renders all step components', () => {
    const multiStepForm = wrapper.findComponent({ name: 'MultiStepForm' })
    expect(multiStepForm.exists()).toBe(true)
  })

  it('handles step navigation correctly', async () => {
    const vm = wrapper.vm
    
    // Test next step
    expect(vm.currentStep).toBe(0)
    vm.nextStep()
    expect(vm.currentStep).toBe(1)
    
    // Test previous step
    vm.previousStep()
    expect(vm.currentStep).toBe(0)
  })

  it('validates step completion', () => {
    const vm = wrapper.vm
    
    // Initially no steps completed
    expect(vm.completedSteps).toEqual([])
    
    // Complete first step
    vm.nextStep()
    expect(vm.completedSteps).toContain(0)
  })

  it('handles form submission', async () => {
    const vm = wrapper.vm
    const mockData = {
      title: 'Test Matter',
      type: 'CORPORATE',
      status: 'ACTIVE',
      priority: 'MEDIUM',
      clientId: 'client-1',
      assignedLawyerIds: ['lawyer-1']
    }

    await vm.handleStepSubmit(mockData)
    expect(vm.currentStep).toBe(1)
  })

  it('shows permission-based access control', () => {
    // This is tested through the canProceed computed property
    const vm = wrapper.vm
    expect(vm.canProceed).toBe(true)
  })

  it('integrates with auto-save functionality', () => {
    const vm = wrapper.vm
    expect(vm.autoSave).toBeDefined()
    expect(vm.autoSave.enable).toHaveBeenCalled()
  })

  it('integrates with navigation guard', () => {
    const vm = wrapper.vm
    expect(vm.navigationGuard).toBeDefined()
    expect(vm.navigationGuard.enable).toHaveBeenCalled()
  })

  it('calculates step progress correctly', () => {
    const vm = wrapper.vm
    expect(vm.totalSteps).toBe(4)
    expect(vm.isLastStep).toBe(false)
    
    // Move to last step
    vm.currentStep = 3
    expect(vm.isLastStep).toBe(true)
  })

  it('handles form cancellation', async () => {
    const vm = wrapper.vm
    const router = vm.$router || { push: vi.fn() }
    
    await vm.handleCancel()
    // Should navigate away (in real implementation)
  })

  it('manages step data correctly', () => {
    const vm = wrapper.vm
    const testData = { title: 'Test', type: 'CORPORATE' }
    
    vm.updateStepData(0, testData)
    const retrievedData = vm.getStepData(0)
    
    expect(retrievedData).toEqual(testData)
  })
})

describe('MatterFormSteps - Error Handling', () => {
  it('handles auto-save errors gracefully', () => {
    const mockAutoSave = {
      enable: vi.fn(),
      disable: vi.fn(),
      isEnabled: { value: true },
      isSaving: { value: false },
      lastSave: { value: null },
      lastError: { value: new Error('Save failed') },
      hasSavedData: { value: false }
    }

    vi.mocked(require('~/composables/form/useAutoSave').useAutoSave).mockReturnValue(mockAutoSave)
    
    const pinia = createPinia()
    const wrapper = mount(MatterFormSteps, {
      global: {
        plugins: [pinia],
        stubs: {
          MultiStepForm: true,
          BasicInfoStep: true,
          ClientDetailsStep: true,
          AssignmentStep: true,
          ReviewStep: true
        }
      }
    })

    expect(wrapper.text()).toContain('Save failed')
  })

  it('handles form validation errors', () => {
    const mockForm = {
      values: { value: {} },
      errors: { value: { title: 'Title is required' } },
      isDirty: { value: true },
      isValid: { value: false },
      submitCount: { value: 0 },
      setValues: vi.fn(),
      submit: vi.fn()
    }

    vi.mocked(require('~/composables/form/useForm').useForm).mockReturnValue(mockForm)
    
    const pinia = createPinia()
    const wrapper = mount(MatterFormSteps, {
      global: {
        plugins: [pinia],
        stubs: {
          MultiStepForm: true,
          BasicInfoStep: true,
          ClientDetailsStep: true,
          AssignmentStep: true,
          ReviewStep: true
        }
      }
    })

    // Form should show errors
    expect(wrapper.vm.form.errors.value).toHaveProperty('title')
  })
})

describe('MatterFormSteps - Integration', () => {
  it('integrates with existing form infrastructure', () => {
    const pinia = createPinia()
    const wrapper = mount(MatterFormSteps, {
      global: {
        plugins: [pinia],
        stubs: {
          MultiStepForm: true,
          BasicInfoStep: true,
          ClientDetailsStep: true,
          AssignmentStep: true,
          ReviewStep: true
        }
      }
    })

    // Should use existing form patterns
    expect(wrapper.vm.form).toBeDefined()
    expect(wrapper.vm.autoSave).toBeDefined()
    expect(wrapper.vm.navigationGuard).toBeDefined()
  })

  it('maintains compatibility with existing matter forms', () => {
    const initialValues = {
      title: 'Existing Matter',
      type: 'LITIGATION',
      status: 'ACTIVE'
    }

    const pinia = createPinia()
    const wrapper = mount(MatterFormSteps, {
      props: {
        mode: 'edit',
        initialValues,
        matterId: 'matter-123'
      },
      global: {
        plugins: [pinia],
        stubs: {
          MultiStepForm: true,
          BasicInfoStep: true,
          ClientDetailsStep: true,
          AssignmentStep: true,
          ReviewStep: true
        }
      }
    })

    expect(wrapper.props('initialValues')).toEqual(initialValues)
    expect(wrapper.props('mode')).toBe('edit')
    expect(wrapper.props('matterId')).toBe('matter-123')
  })
})
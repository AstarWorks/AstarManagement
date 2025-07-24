import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import LawyerAssignmentField from '../LawyerAssignmentField.vue'

// Mock the form components
vi.mock('~/components/forms', () => ({
  FormFieldWrapper: {
    template: '<div class="form-wrapper"><label v-if="label">{{ label }}<span v-if="required"> *</span></label><div class="description" v-if="description">{{ description }}</div><slot /></div>',
    props: ['label', 'description', 'required']
  }
}))

// Mock UI components
vi.mock('~/components/ui/button', () => ({
  Button: {
    template: '<button :type="type" :variant="variant" :size="size" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
    props: ['type', 'variant', 'size', 'disabled'],
    emits: ['click']
  }
}))

vi.mock('~/components/ui/badge', () => ({
  Badge: {
    template: '<span class="badge" :class="[variant, className]"><slot /></span>',
    props: ['variant', 'class']
  }
}))

vi.mock('~/components/ui/card', () => ({
  Card: {
    template: '<div class="card" :class="className"><slot /></div>',
    props: ['class']
  }
}))

vi.mock('~/components/ui/checkbox', () => ({
  Checkbox: {
    template: '<input type="checkbox" :checked="checked" :disabled="disabled" @change="$emit(\'update:checked\', $event.target.checked)" />',
    props: ['checked', 'disabled'],
    emits: ['update:checked']
  }
}))

vi.mock('~/components/ui/avatar', () => ({
  Avatar: {
    template: '<div class="avatar"><slot /></div>',
    props: ['class']
  },
  AvatarFallback: {
    template: '<div class="avatar-fallback"><slot /></div>',
    props: ['class']
  },
  AvatarImage: {
    template: '<img class="avatar-image" :src="src" />',
    props: ['src']
  }
}))

vi.mock('~/components/ui/skeleton', () => ({
  Skeleton: {
    template: '<div class="skeleton" :class="className"></div>',
    props: ['class']
  }
}))

// Mock lucide icons
vi.mock('lucide-vue-next', () => ({
  UserPlus: { template: '<svg class="user-plus-icon"></svg>' },
  Search: { template: '<svg class="search-icon"></svg>' },
  Users: { template: '<svg class="users-icon"></svg>' },
  Briefcase: { template: '<svg class="briefcase-icon"></svg>' },
  Star: { template: '<svg class="star-icon"></svg>' }
}))

// Mock vee-validate
const mockUseField = vi.fn()
vi.mock('vee-validate', () => ({
  useField: mockUseField
}))

describe('LawyerAssignmentField', () => {
  const mockLawyers = [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@lawfirm.com',
      role: 'Senior Partner',
      specializations: ['Corporate Law', 'M&A', 'Securities'],
      currentCaseLoad: 12,
      maxCaseLoad: 15,
      experience: 15,
      isAvailable: true,
      avatar: null,
      rating: 4.9
    },
    {
      id: '2',
      name: 'Michael Chen',
      email: 'michael.chen@lawfirm.com',
      role: 'Associate',
      specializations: ['Litigation', 'Civil Rights', 'Employment Law'],
      currentCaseLoad: 8,
      maxCaseLoad: 12,
      experience: 5,
      isAvailable: true,
      avatar: null,
      rating: 4.7
    },
    {
      id: '3',
      name: 'David Wilson',
      email: 'david.wilson@lawfirm.com',
      role: 'Junior Associate',
      specializations: ['Criminal Defense', 'Personal Injury'],
      currentCaseLoad: 15,
      maxCaseLoad: 15,
      experience: 2,
      isAvailable: false,
      avatar: null,
      rating: 4.5
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock implementation for useField
    mockUseField.mockReturnValue({
      value: [],
      setValue: vi.fn()
    })
  })

  it('renders with default props', async () => {
    const wrapper = mount(LawyerAssignmentField)
    
    // Wait for lawyers to load
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 600))
    
    expect(wrapper.find('.form-wrapper').exists()).toBe(true)
    expect(wrapper.text()).toContain('Assigned Lawyers')
    expect(wrapper.text()).toContain('Select 1-5 lawyers to assign to this matter')
  })

  it('loads lawyers on mount', async () => {
    const wrapper = mount(LawyerAssignmentField)
    
    // Wait for component to load lawyers
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 600))
    
    const component = wrapper.vm as any
    expect(component.lawyers).toEqual(component.mockLawyers)
  })

  it('filters lawyers based on search query', async () => {
    const wrapper = mount(LawyerAssignmentField)
    
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 600))
    
    const component = wrapper.vm as any
    component.lawyers = mockLawyers
    component.searchQuery = 'Sarah'
    
    await nextTick()
    
    const filteredLawyers = component.filteredLawyers
    expect(filteredLawyers).toHaveLength(1)
    expect(filteredLawyers[0].name).toBe('Sarah Johnson')
  })

  it('filters lawyers by specialization', async () => {
    const wrapper = mount(LawyerAssignmentField)
    
    const component = wrapper.vm as any
    component.lawyers = mockLawyers
    component.searchQuery = 'Corporate Law'
    
    await nextTick()
    
    const filteredLawyers = component.filteredLawyers
    expect(filteredLawyers).toHaveLength(1)
    expect(filteredLawyers[0].specializations).toContain('Corporate Law')
  })

  it('shows only available lawyers in available lawyers list', async () => {
    const wrapper = mount(LawyerAssignmentField)
    
    const component = wrapper.vm as any
    component.lawyers = mockLawyers
    
    const availableLawyers = component.availableLawyers
    expect(availableLawyers).toHaveLength(2) // Only Sarah and Michael are available
    expect(availableLawyers.every((lawyer: any) => lawyer.isAvailable)).toBe(true)
  })

  it('toggles lawyer selection correctly', async () => {
    const mockSetValue = vi.fn()
    mockUseField.mockReturnValue({
      value: [],
      setValue: mockSetValue
    })

    const wrapper = mount(LawyerAssignmentField)
    const component = wrapper.vm as any

    // Add lawyer
    component.toggleLawyer('1')
    expect(mockSetValue).toHaveBeenCalledWith(['1'])

    // Mock that lawyer is now selected
    mockUseField.mockReturnValue({
      value: ['1'],
      setValue: mockSetValue
    })

    // Remove lawyer
    component.toggleLawyer('1')
    expect(mockSetValue).toHaveBeenCalledWith([])
  })

  it('respects maximum lawyer limit', async () => {
    const mockSetValue = vi.fn()
    mockUseField.mockReturnValue({
      value: ['1', '2', '3', '4', '5'], // Already at max
      setValue: mockSetValue
    })

    const wrapper = mount(LawyerAssignmentField)
    const component = wrapper.vm as any

    // Should not add more lawyers when at limit
    component.toggleLawyer('6')
    expect(mockSetValue).not.toHaveBeenCalledWith(['1', '2', '3', '4', '5', '6'])
  })

  it('removes lawyer correctly', async () => {
    const mockSetValue = vi.fn()
    mockUseField.mockReturnValue({
      value: ['1', '2'],
      setValue: mockSetValue
    })

    const wrapper = mount(LawyerAssignmentField)
    const component = wrapper.vm as any

    component.removeLawyer('1')
    expect(mockSetValue).toHaveBeenCalledWith(['2'])
  })

  it('calculates workload status correctly', async () => {
    const wrapper = mount(LawyerAssignmentField)
    const component = wrapper.vm as any

    // Test full capacity
    const fullLawyer = { currentCaseLoad: 15, maxCaseLoad: 15 }
    expect(component.getWorkloadStatus(fullLawyer)).toEqual({
      status: 'full',
      color: 'red',
      label: 'At Capacity'
    })

    // Test high load
    const highLoadLawyer = { currentCaseLoad: 12, maxCaseLoad: 15 }
    expect(component.getWorkloadStatus(highLoadLawyer)).toEqual({
      status: 'high',
      color: 'yellow',
      label: 'High Load'
    })

    // Test available
    const availableLawyer = { currentCaseLoad: 5, maxCaseLoad: 15 }
    expect(component.getWorkloadStatus(availableLawyer)).toEqual({
      status: 'low',
      color: 'green',
      label: 'Available'
    })
  })

  it('gets workload color classes correctly', async () => {
    const wrapper = mount(LawyerAssignmentField)
    const component = wrapper.vm as any

    const fullLawyer = { currentCaseLoad: 15, maxCaseLoad: 15 }
    expect(component.getWorkloadColor(fullLawyer)).toBe('text-red-600 bg-red-50')

    const highLoadLawyer = { currentCaseLoad: 12, maxCaseLoad: 15 }
    expect(component.getWorkloadColor(highLoadLawyer)).toBe('text-yellow-600 bg-yellow-50')

    const availableLawyer = { currentCaseLoad: 5, maxCaseLoad: 15 }
    expect(component.getWorkloadColor(availableLawyer)).toBe('text-green-600 bg-green-50')
  })

  it('shows selected lawyers section when lawyers are selected', async () => {
    mockUseField.mockReturnValue({
      value: ['1'],
      setValue: vi.fn()
    })

    const wrapper = mount(LawyerAssignmentField)
    
    const component = wrapper.vm as any
    component.lawyers = mockLawyers
    
    await nextTick()
    
    const selectedLawyers = component.selectedLawyers
    expect(selectedLawyers).toHaveLength(1)
    expect(selectedLawyers[0].id).toBe('1')
  })

  it('shows validation message when minimum lawyers not met', () => {
    mockUseField.mockReturnValue({
      value: [],
      setValue: vi.fn()
    })

    const wrapper = mount(LawyerAssignmentField, {
      props: {
        minLawyers: 2
      }
    })

    expect(wrapper.text()).toContain('Please select at least 2 lawyers')
  })

  it('disables form when at maximum capacity', () => {
    mockUseField.mockReturnValue({
      value: ['1', '2', '3', '4', '5'], // At max capacity
      setValue: vi.fn()
    })

    const wrapper = mount(LawyerAssignmentField, {
      props: {
        maxLawyers: 5
      }
    })

    const component = wrapper.vm as any
    expect(component.canAddMore).toBe(false)
  })

  it('shows loading state while fetching lawyers', () => {
    const wrapper = mount(LawyerAssignmentField)
    
    const component = wrapper.vm as any
    component.loading = true
    component.lawyers = []
    
    expect(wrapper.findAllComponents({ name: 'Skeleton' })).toHaveLength(3)
  })

  it('shows no lawyers found message when search yields no results', async () => {
    const wrapper = mount(LawyerAssignmentField)
    
    const component = wrapper.vm as any
    component.loading = false
    component.lawyers = mockLawyers
    component.searchQuery = 'nonexistent'
    
    await nextTick()
    
    expect(wrapper.text()).toContain('No lawyers found matching "nonexistent"')
  })

  it('initializes empty array if no value provided', () => {
    mockUseField.mockReturnValue({
      value: undefined,
      setValue: vi.fn()
    })

    const wrapper = mount(LawyerAssignmentField)
    const component = wrapper.vm as any
    
    // Component should initialize with empty array
    expect(component.setValue).toHaveBeenCalledWith([])
  })

  it('passes correct props to FormFieldWrapper', () => {
    const wrapper = mount(LawyerAssignmentField, {
      props: {
        required: true,
        minLawyers: 2,
        maxLawyers: 3
      }
    })

    const formWrapper = wrapper.findComponent({ name: 'FormFieldWrapper' })
    expect(formWrapper.props('label')).toBe('Assigned Lawyers')
    expect(formWrapper.props('description')).toBe('Select 2-3 lawyers to assign to this matter')
    expect(formWrapper.props('required')).toBe(true)
  })

  it('uses default props when not provided', () => {
    const wrapper = mount(LawyerAssignmentField)

    const component = wrapper.vm as any
    expect(component.name).toBe('assignedLawyerIds')
    expect(component.required).toBe(true)
    expect(component.minLawyers).toBe(1)
    expect(component.maxLawyers).toBe(5)
  })

  it('displays lawyer specializations with truncation', async () => {
    const wrapper = mount(LawyerAssignmentField)
    
    const component = wrapper.vm as any
    component.lawyers = mockLawyers
    component.loading = false
    
    await nextTick()
    
    // Should show first 2 specializations + count for remaining
    expect(wrapper.text()).toContain('Corporate Law, M&A')
    expect(wrapper.text()).toContain('+1') // For the third specialization
  })

  it('handles error prop correctly', () => {
    const errorMessage = 'At least one lawyer must be assigned'
    const wrapper = mount(LawyerAssignmentField, {
      props: {
        error: errorMessage
      }
    })

    expect(wrapper.text()).toContain(errorMessage)
  })

  it('has proper accessibility attributes', () => {
    const wrapper = mount(LawyerAssignmentField)
    
    const searchInput = wrapper.find('input[type="text"]')
    expect(searchInput.exists()).toBe(true)
    expect(searchInput.attributes('placeholder')).toContain('Search lawyers')
    expect(searchInput.attributes('disabled')).toBeFalsy()
  })

  it('matches snapshot', async () => {
    mockUseField.mockReturnValue({
      value: ['1'],
      setValue: vi.fn()
    })

    const wrapper = mount(LawyerAssignmentField, {
      props: {
        name: 'assignedLawyerIds',
        required: true,
        minLawyers: 1,
        maxLawyers: 3
      }
    })
    
    await nextTick()
    
    expect(wrapper.html()).toMatchSnapshot()
  })
})
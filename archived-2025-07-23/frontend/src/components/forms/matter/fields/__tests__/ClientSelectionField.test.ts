import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ClientSelectionField from '../ClientSelectionField.vue'

// Mock the form components
vi.mock('~/components/forms', () => ({
  FormFieldWrapper: {
    template: '<div class="form-wrapper"><label v-if="label">{{ label }}<span v-if="required"> *</span></label><div class="description" v-if="description">{{ description }}</div><slot /></div>',
    props: ['label', 'description', 'required']
  },
  FormSelect: {
    template: '<select v-model="modelValue" @update:modelValue="$emit(\'update:modelValue\', $event)"><option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option></select>',
    props: ['name', 'placeholder', 'options', 'error', 'loading', 'modelValue'],
    emits: ['update:modelValue']
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
    template: '<span class="badge" :class="variant"><slot /></span>',
    props: ['variant']
  }
}))

vi.mock('~/components/ui/card', () => ({
  Card: {
    template: '<div class="card"><slot /></div>'
  },
  CardContent: {
    template: '<div class="card-content"><slot /></div>',
    props: ['class']
  }
}))

vi.mock('~/components/ui/dialog', () => ({
  Dialog: {
    template: '<div v-if="open" class="dialog"><slot /></div>',
    props: ['open'],
    emits: ['update:open']
  },
  DialogContent: {
    template: '<div class="dialog-content"><slot /></div>'
  },
  DialogHeader: {
    template: '<div class="dialog-header"><slot /></div>'
  },
  DialogTitle: {
    template: '<h2 class="dialog-title"><slot /></h2>'
  }
}))

vi.mock('~/components/ui/skeleton', () => ({
  Skeleton: {
    template: '<div class="skeleton"></div>',
    props: ['class']
  }
}))

// Mock lucide icons
vi.mock('lucide-vue-next', () => ({
  Plus: { template: '<svg class="plus-icon"></svg>' },
  Search: { template: '<svg class="search-icon"></svg>' },
  User: { template: '<svg class="user-icon"></svg>' },
  Building2: { template: '<svg class="building-icon"></svg>' }
}))

// Mock vee-validate
const mockUseField = vi.fn()
vi.mock('vee-validate', () => ({
  useField: mockUseField
}))

// Mock $fetch
global.$fetch = vi.fn()

describe('ClientSelectionField', () => {
  const mockClients = [
    {
      id: '1',
      type: 'INDIVIDUAL',
      clientCode: 'CLI-001',
      personalInfo: {
        firstName: 'John',
        lastName: 'Doe',
        middleName: ''
      },
      email: 'john.doe@email.com',
      phone: '+1-555-123-4567',
      address: {
        street: '123 Main St',
        city: 'Tokyo',
        postalCode: '100-0001'
      },
      isActive: true
    },
    {
      id: '2',
      type: 'CORPORATION',
      clientCode: 'CLI-002',
      companyInfo: {
        companyName: 'Tech Solutions Inc.',
        registrationNumber: 'REG-123456',
        industry: 'Technology'
      },
      email: 'legal@techsolutions.com',
      phone: '+1-555-987-6543',
      address: {
        street: '456 Corporate Blvd',
        city: 'Osaka',
        postalCode: '530-0001'
      },
      isActive: true
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock implementation for useField
    mockUseField.mockReturnValue({
      value: '',
      setValue: vi.fn(),
      errorMessage: '',
      meta: { touched: false, dirty: false, valid: true }
    })

    // Mock successful API response
    global.$fetch = vi.fn().mockResolvedValue(mockClients)
  })

  it('renders with default props', async () => {
    const wrapper = mount(ClientSelectionField)
    
    // Wait for clients to load
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 600)) // Wait for simulated API delay
    
    expect(wrapper.find('.form-wrapper').exists()).toBe(true)
    expect(wrapper.text()).toContain('Client')
    expect(wrapper.text()).toContain('Select the client for this matter')
  })

  it('loads clients on mount', async () => {
    mount(ClientSelectionField)
    
    // Wait for the component to load clients
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 600))
    
    expect(global.$fetch).toHaveBeenCalled()
  })

  it('filters clients based on search query', async () => {
    const wrapper = mount(ClientSelectionField)
    
    // Wait for clients to load
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 600))
    
    const component = wrapper.vm as any
    component.clients = mockClients
    component.searchQuery = 'John'
    
    await nextTick()
    
    const filteredClients = component.filteredClients
    expect(filteredClients).toHaveLength(1)
    expect(filteredClients[0].personalInfo.firstName).toBe('John')
  })

  it('formats client options correctly for individuals', async () => {
    const wrapper = mount(ClientSelectionField)
    
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 600))
    
    const component = wrapper.vm as any
    component.clients = mockClients
    
    const options = component.clientOptions
    const individualOption = options.find((opt: any) => opt.value === '1')
    
    expect(individualOption.label).toBe('John Doe (CLI-001)')
  })

  it('formats client options correctly for corporations', async () => {
    const wrapper = mount(ClientSelectionField)
    
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 600))
    
    const component = wrapper.vm as any
    component.clients = mockClients
    
    const options = component.clientOptions
    const corporationOption = options.find((opt: any) => opt.value === '2')
    
    expect(corporationOption.label).toBe('Tech Solutions Inc. (CLI-002)')
  })

  it('shows selected client information when client is selected', async () => {
    const selectedClientMock = vi.fn().mockReturnValue({
      value: '1',
      setValue: vi.fn()
    })
    
    mockUseField.mockReturnValue(selectedClientMock())
    
    const wrapper = mount(ClientSelectionField)
    
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 600))
    
    const component = wrapper.vm as any
    component.clients = mockClients
    component.selectedClientId = '1'
    
    await nextTick()
    
    expect(component.selectedClient).toEqual(mockClients[0])
  })

  it('displays individual client details correctly', async () => {
    const wrapper = mount(ClientSelectionField)
    
    const component = wrapper.vm as any
    component.clients = mockClients
    component.selectedClient = mockClients[0] // Individual client
    
    await nextTick()
    
    expect(wrapper.text()).toContain('John Doe')
    expect(wrapper.text()).toContain('CLI-001')
    expect(wrapper.text()).toContain('john.doe@email.com')
    expect(wrapper.text()).toContain('+1-555-123-4567')
    expect(wrapper.text()).toContain('123 Main St, Tokyo, 100-0001')
  })

  it('displays corporation client details correctly', async () => {
    const wrapper = mount(ClientSelectionField)
    
    const component = wrapper.vm as any
    component.clients = mockClients
    component.selectedClient = mockClients[1] // Corporation client
    
    await nextTick()
    
    expect(wrapper.text()).toContain('Tech Solutions Inc.')
    expect(wrapper.text()).toContain('CLI-002')
    expect(wrapper.text()).toContain('legal@techsolutions.com')
    expect(wrapper.text()).toContain('Industry: Technology')
    expect(wrapper.text()).toContain('Registration: REG-123456')
  })

  it('shows create client button when allowCreate is true', () => {
    const wrapper = mount(ClientSelectionField, {
      props: {
        allowCreate: true
      }
    })

    const createButton = wrapper.findComponent({ name: 'Button' })
    expect(createButton.exists()).toBe(true)
    expect(createButton.find('.plus-icon').exists()).toBe(true)
  })

  it('hides create client button when allowCreate is false', () => {
    const wrapper = mount(ClientSelectionField, {
      props: {
        allowCreate: false
      }
    })

    const createButtons = wrapper.findAllComponents({ name: 'Button' })
    const createButton = createButtons.find(button => 
      button.find('.plus-icon').exists()
    )
    expect(createButton).toBeUndefined()
  })

  it('opens create dialog when create button is clicked', async () => {
    const wrapper = mount(ClientSelectionField, {
      props: {
        allowCreate: true
      }
    })

    const createButton = wrapper.findComponent({ name: 'Button' })
    await createButton.trigger('click')

    expect(wrapper.findComponent({ name: 'Dialog' }).props('open')).toBe(true)
  })

  it('shows loading state while fetching clients', () => {
    const wrapper = mount(ClientSelectionField)
    
    const component = wrapper.vm as any
    component.loading = true
    component.clients = []
    
    expect(wrapper.findAllComponents({ name: 'Skeleton' })).toHaveLength(3)
  })

  it('shows no results message when search yields no results', async () => {
    const wrapper = mount(ClientSelectionField)
    
    const component = wrapper.vm as any
    component.loading = false
    component.clients = mockClients
    component.searchQuery = 'nonexistent'
    
    await nextTick()
    
    expect(wrapper.text()).toContain('No clients found matching "nonexistent"')
  })

  it('emits clientCreated event when new client is created', async () => {
    const wrapper = mount(ClientSelectionField)
    
    const newClient = { id: '3', name: 'New Client' }
    const component = wrapper.vm as any
    
    component.handleClientCreated(newClient)
    
    expect(wrapper.emitted('clientCreated')).toBeTruthy()
    expect(wrapper.emitted('clientCreated')?.[0]).toEqual([newClient])
  })

  it('updates client list when new client is created', async () => {
    const wrapper = mount(ClientSelectionField)
    
    const component = wrapper.vm as any
    component.clients = [...mockClients]
    
    const newClient = { id: '3', name: 'New Client' }
    component.handleClientCreated(newClient)
    
    expect(component.clients[0]).toEqual(newClient) // Added to beginning
    expect(component.clients).toHaveLength(3)
  })

  it('passes correct props to FormSelect', () => {
    const wrapper = mount(ClientSelectionField, {
      props: {
        name: 'customClientId',
        placeholder: 'Custom placeholder',
        error: 'Test error'
      }
    })

    const formSelect = wrapper.findComponent({ name: 'FormSelect' })
    expect(formSelect.props('name')).toBe('customClientId')
    expect(formSelect.props('placeholder')).toBe('Custom placeholder')
    expect(formSelect.props('error')).toBe('Test error')
  })

  it('uses default props when not provided', () => {
    const wrapper = mount(ClientSelectionField)

    const formSelect = wrapper.findComponent({ name: 'FormSelect' })
    expect(formSelect.props('name')).toBe('clientId')
    expect(formSelect.props('placeholder')).toBe('Search and select a client...')
    
    const component = wrapper.vm as any
    expect(component.allowCreate).toBe(true)
  })

  it('searches clients by email and client code', async () => {
    const wrapper = mount(ClientSelectionField)
    
    const component = wrapper.vm as any
    component.clients = mockClients
    
    // Test email search
    component.searchQuery = 'john.doe@'
    await nextTick()
    expect(component.filteredClients).toHaveLength(1)
    
    // Test client code search
    component.searchQuery = 'CLI-002'
    await nextTick()
    expect(component.filteredClients).toHaveLength(1)
    expect(component.filteredClients[0].clientCode).toBe('CLI-002')
  })

  it('has proper accessibility attributes', () => {
    const wrapper = mount(ClientSelectionField)
    
    const searchInput = wrapper.find('input[type="text"]')
    expect(searchInput.exists()).toBe(true)
    expect(searchInput.attributes('placeholder')).toContain('Search clients')
  })

  it('matches snapshot', async () => {
    const wrapper = mount(ClientSelectionField, {
      props: {
        name: 'clientId',
        required: true,
        allowCreate: true
      }
    })
    
    await nextTick()
    
    expect(wrapper.html()).toMatchSnapshot()
  })
})
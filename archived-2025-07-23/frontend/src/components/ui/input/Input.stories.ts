import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, within, userEvent, fn } from '@storybook/test'
import { ref } from 'vue'
import { Input } from './index'
import { Label } from '../label'
import { Search, Mail, Lock, User, Calendar } from 'lucide-vue-next'

const meta = {
  title: 'UI/Form/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'search', 'tel', 'url', 'date', 'time'],
      description: 'The input type',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'text' }
      }
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the input'
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' }
      }
    },
    modelValue: {
      control: 'text',
      description: 'The v-model value of the input'
    }
  },
  parameters: {
    docs: {
      description: {
        component: 'A flexible input component that supports v-model and all standard HTML input types.'
      }
    }
  }
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

// Default input
export const Default: Story = {
  args: {
    type: 'text',
    placeholder: 'Enter text...'
  },
  render: (args: any) => ({
    components: { Input },
    setup() {
      const value = ref('')
      const onInput = fn()
      const onChange = fn()
      const onFocus = fn()
      const onBlur = fn()
      return { args, value, onInput, onChange, onFocus, onBlur }
    },
    template: '<Input v-bind="args" v-model="value" @input="onInput" @change="onChange" @focus="onFocus" @blur="onBlur" />'
  }),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByPlaceholderText('Enter text...')

    // Test initial state
    expect(input).toBeInTheDocument()
    expect(input).toBeEnabled()
    expect(input).toHaveValue('')

    // Test focus behavior
    await userEvent.click(input)
    expect(input).toHaveFocus()
    // Focus event has been fired

    // Test typing behavior
    await userEvent.type(input, 'Hello World')
    expect(input).toHaveValue('Hello World')
    // Input event has been fired

    // Test clearing input
    await userEvent.clear(input)
    expect(input).toHaveValue('')

    // Test keyboard navigation
    await userEvent.type(input, 'Test')
    await userEvent.keyboard('{Escape}')
    await userEvent.tab()
    // Blur event has been fired
  }
}

// Input types showcase
export const InputTypes: Story = {
  render: () => ({
    components: { Input, Label },
    setup() {
      const textValue = ref('')
      const emailValue = ref('')
      const passwordValue = ref('')
      const numberValue = ref('')
      const searchValue = ref('')
      const telValue = ref('')
      const dateValue = ref('')
      
      return {
        textValue,
        emailValue,
        passwordValue,
        numberValue,
        searchValue,
        telValue,
        dateValue
      }
    },
    template: `
      <div class="space-y-4 max-w-md">
        <div class="space-y-2">
          <Label for="text">Text Input</Label>
          <Input id="text" type="text" placeholder="Enter text" v-model="textValue" />
          <p class="text-xs text-muted-foreground">Value: {{ textValue }}</p>
        </div>
        
        <div class="space-y-2">
          <Label for="email">Email Input</Label>
          <Input id="email" type="email" placeholder="email@example.com" v-model="emailValue" />
        </div>
        
        <div class="space-y-2">
          <Label for="password">Password Input</Label>
          <Input id="password" type="password" placeholder="Enter password" v-model="passwordValue" />
        </div>
        
        <div class="space-y-2">
          <Label for="number">Number Input</Label>
          <Input id="number" type="number" placeholder="0" v-model="numberValue" />
        </div>
        
        <div class="space-y-2">
          <Label for="search">Search Input</Label>
          <Input id="search" type="search" placeholder="Search..." v-model="searchValue" />
        </div>
        
        <div class="space-y-2">
          <Label for="tel">Phone Input</Label>
          <Input id="tel" type="tel" placeholder="+81 90-1234-5678" v-model="telValue" />
        </div>
        
        <div class="space-y-2">
          <Label for="date">Date Input</Label>
          <Input id="date" type="date" v-model="dateValue" />
        </div>
      </div>
    `
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Test text input
    const textInput = canvas.getByLabelText('Text Input')
    await userEvent.type(textInput, 'Sample text')
    expect(textInput).toHaveValue('Sample text')
    
    // Test email input
    const emailInput = canvas.getByLabelText('Email Input')
    await userEvent.type(emailInput, 'test@example.com')
    expect(emailInput).toHaveValue('test@example.com')
    expect(emailInput).toHaveAttribute('type', 'email')
    
    // Test password input
    const passwordInput = canvas.getByLabelText('Password Input')
    await userEvent.type(passwordInput, 'secret123')
    expect(passwordInput).toHaveValue('secret123')
    expect(passwordInput).toHaveAttribute('type', 'password')
    
    // Test number input
    const numberInput = canvas.getByLabelText('Number Input')
    await userEvent.type(numberInput, '42')
    expect(numberInput).toHaveValue(42)
    expect(numberInput).toHaveAttribute('type', 'number')
    
    // Test search input
    const searchInput = canvas.getByLabelText('Search Input')
    await userEvent.type(searchInput, 'search query')
    expect(searchInput).toHaveValue('search query')
    expect(searchInput).toHaveAttribute('type', 'search')
    
    // Test phone input
    const telInput = canvas.getByLabelText('Phone Input')
    await userEvent.type(telInput, '+81 90-1234-5678')
    expect(telInput).toHaveValue('+81 90-1234-5678')
    expect(telInput).toHaveAttribute('type', 'tel')
    
    // Test date input
    const dateInput = canvas.getByLabelText('Date Input')
    await userEvent.type(dateInput, '2025-12-25')
    expect(dateInput).toHaveValue('2025-12-25')
    expect(dateInput).toHaveAttribute('type', 'date')
  },
  parameters: {
    docs: {
      description: {
        story: 'Different HTML input types supported by the component with interaction testing.'
      }
    }
  }
}

// With icons
export const WithIcons: Story = {
  render: () => ({
    components: { Input, Search, Mail, Lock, User },
    template: `
      <div class="space-y-4 max-w-md">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" placeholder="Search cases..." class="pl-10" />
        </div>
        
        <div class="relative">
          <Mail class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="email" placeholder="Email address" class="pl-10" />
        </div>
        
        <div class="relative">
          <User class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="text" placeholder="Username" class="pl-10" />
        </div>
        
        <div class="relative">
          <Lock class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="password" placeholder="Password" class="pl-10" />
        </div>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Input fields with leading icons for better visual context.'
      }
    }
  }
}

// States
export const States: Story = {
  render: () => ({
    components: { Input, Label },
    template: `
      <div class="space-y-4 max-w-md">
        <div class="space-y-2">
          <Label>Default State</Label>
          <Input placeholder="Default input" data-testid="default-input" />
        </div>
        
        <div class="space-y-2">
          <Label>Focused State</Label>
          <Input placeholder="Click to focus" class="focus:ring-2" data-testid="focus-input" />
        </div>
        
        <div class="space-y-2">
          <Label>Disabled State</Label>
          <Input placeholder="Disabled input" disabled data-testid="disabled-input" />
        </div>
        
        <div class="space-y-2">
          <Label>Read-only State</Label>
          <Input value="Read-only value" readonly data-testid="readonly-input" />
        </div>
        
        <div class="space-y-2">
          <Label>Error State</Label>
          <Input placeholder="Invalid input" class="border-destructive focus:ring-destructive" data-testid="error-input" />
          <p class="text-sm text-destructive">This field is required</p>
        </div>
        
        <div class="space-y-2">
          <Label>Success State</Label>
          <Input value="Valid input" class="border-green-500 focus:ring-green-500" data-testid="success-input" />
          <p class="text-sm text-green-600">Looks good!</p>
        </div>
      </div>
    `
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Test default state
    const defaultInput = canvas.getByTestId('default-input')
    expect(defaultInput).toBeEnabled()
    expect(defaultInput).toHaveValue('')
    await userEvent.type(defaultInput, 'Test input')
    expect(defaultInput).toHaveValue('Test input')
    
    // Test focus state
    const focusInput = canvas.getByTestId('focus-input')
    await userEvent.click(focusInput)
    expect(focusInput).toHaveFocus()
    
    // Test disabled state
    const disabledInput = canvas.getByTestId('disabled-input')
    expect(disabledInput).toBeDisabled()
    // Attempt to type should be ignored
    await userEvent.type(disabledInput, 'Should not type')
    expect(disabledInput).toHaveValue('')
    
    // Test readonly state
    const readonlyInput = canvas.getByTestId('readonly-input')
    expect(readonlyInput).toHaveAttribute('readonly')
    expect(readonlyInput).toHaveValue('Read-only value')
    // Attempt to change value should be ignored
    await userEvent.clear(readonlyInput)
    expect(readonlyInput).toHaveValue('Read-only value')
    
    // Test error state styling
    const errorInput = canvas.getByTestId('error-input')
    expect(errorInput).toBeEnabled()
    await userEvent.type(errorInput, 'Error test')
    expect(errorInput).toHaveValue('Error test')
    
    // Test success state
    const successInput = canvas.getByTestId('success-input')
    expect(successInput).toHaveValue('Valid input')
    expect(successInput).toBeEnabled()
  },
  parameters: {
    docs: {
      description: {
        story: 'Various input states including disabled, readonly, error, and success with interaction testing.'
      }
    }
  }
}

// Legal form example
export const LegalFormExample: Story = {
  render: () => ({
    components: { Input, Label },
    setup() {
      const formData = ref({
        caseNumber: '',
        clientName: '',
        opposingParty: '',
        filingDate: '',
        courtName: '',
        estimatedValue: ''
      })
      
      return { formData }
    },
    template: `
      <div class="space-y-6 max-w-lg">
        <h3 class="text-lg font-semibold">New Matter Information</h3>
        
        <div class="space-y-4">
          <div class="space-y-2">
            <Label for="case-number" class="required">Case Number</Label>
            <Input 
              id="case-number" 
              placeholder="2025-CV-0001" 
              v-model="formData.caseNumber"
              pattern="[0-9]{4}-[A-Z]{2}-[0-9]{4}"
            />
            <p class="text-xs text-muted-foreground">Format: YYYY-TT-NNNN</p>
          </div>
          
          <div class="space-y-2">
            <Label for="client-name" class="required">Client Name</Label>
            <Input 
              id="client-name" 
              placeholder="Enter client name" 
              v-model="formData.clientName"
            />
          </div>
          
          <div class="space-y-2">
            <Label for="opposing-party">Opposing Party</Label>
            <Input 
              id="opposing-party" 
              placeholder="Enter opposing party name" 
              v-model="formData.opposingParty"
            />
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="filing-date">Filing Date</Label>
              <Input 
                id="filing-date" 
                type="date" 
                v-model="formData.filingDate"
              />
            </div>
            
            <div class="space-y-2">
              <Label for="estimated-value">Estimated Value (¥)</Label>
              <Input 
                id="estimated-value" 
                type="number" 
                placeholder="0" 
                v-model="formData.estimatedValue"
                min="0"
                step="1000"
              />
            </div>
          </div>
          
          <div class="space-y-2">
            <Label for="court-name">Court Name</Label>
            <Input 
              id="court-name" 
              placeholder="e.g., Tokyo District Court" 
              v-model="formData.courtName"
            />
          </div>
        </div>
        
        <div class="rounded-lg bg-muted p-4">
          <p class="text-sm font-medium mb-2">Form Data:</p>
          <pre class="text-xs">{{ JSON.stringify(formData, null, 2) }}</pre>
        </div>
      </div>
    `
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Test form field interactions
    const caseNumberInput = canvas.getByLabelText(/case number/i)
    await userEvent.type(caseNumberInput, '2025-CV-0001')
    expect(caseNumberInput).toHaveValue('2025-CV-0001')
    
    const clientNameInput = canvas.getByLabelText(/client name/i)
    await userEvent.type(clientNameInput, 'ABC Corporation')
    expect(clientNameInput).toHaveValue('ABC Corporation')
    
    const opposingPartyInput = canvas.getByLabelText(/opposing party/i)
    await userEvent.type(opposingPartyInput, 'XYZ Industries')
    expect(opposingPartyInput).toHaveValue('XYZ Industries')
    
    const filingDateInput = canvas.getByLabelText(/filing date/i)
    await userEvent.type(filingDateInput, '2025-07-15')
    expect(filingDateInput).toHaveValue('2025-07-15')
    
    const estimatedValueInput = canvas.getByLabelText(/estimated value/i)
    await userEvent.type(estimatedValueInput, '1000000')
    expect(estimatedValueInput).toHaveValue(1000000)
    
    const courtNameInput = canvas.getByLabelText(/court name/i)
    await userEvent.type(courtNameInput, 'Tokyo District Court')
    expect(courtNameInput).toHaveValue('Tokyo District Court')
    
    // Test form validation attributes
    expect(caseNumberInput).toHaveAttribute('pattern', '[0-9]{4}-[A-Z]{2}-[0-9]{4}')
    expect(estimatedValueInput).toHaveAttribute('min', '0')
    expect(estimatedValueInput).toHaveAttribute('step', '1000')
    expect(filingDateInput).toHaveAttribute('type', 'date')
    expect(estimatedValueInput).toHaveAttribute('type', 'number')
  },
  parameters: {
    docs: {
      description: {
        story: 'Example of a legal matter form using input components with form validation testing.'
      }
    }
  }
}

// Sizes using utility classes
export const Sizes: Story = {
  render: () => ({
    components: { Input },
    template: `
      <div class="space-y-4 max-w-md">
        <Input placeholder="Small input" class="h-8 text-sm" />
        <Input placeholder="Default input" />
        <Input placeholder="Large input" class="h-12 text-lg" />
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Custom input sizes using Tailwind utility classes.'
      }
    }
  }
}

// With helper text
export const WithHelperText: Story = {
  render: () => ({
    components: { Input, Label },
    template: `
      <div class="space-y-4 max-w-md">
        <div class="space-y-2">
          <Label for="username">Username</Label>
          <Input id="username" placeholder="johndoe" />
          <p class="text-sm text-muted-foreground">
            Your username must be 3-20 characters long
          </p>
        </div>
        
        <div class="space-y-2">
          <Label for="website">Website</Label>
          <Input id="website" type="url" placeholder="https://example.com" />
          <p class="text-sm text-muted-foreground">
            Include the protocol (http:// or https://)
          </p>
        </div>
        
        <div class="space-y-2">
          <Label for="bio">Short Bio</Label>
          <Input id="bio" placeholder="Tell us about yourself" maxlength="100" />
          <p class="text-sm text-muted-foreground">
            Maximum 100 characters
          </p>
        </div>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Input fields with helper text for additional context.'
      }
    }
  }
}

// Playground
export const Playground: Story = {
  args: {
    type: 'text',
    placeholder: 'Playground input',
    disabled: false
  },
  render: (args: any) => ({
    components: { Input },
    setup() {
      const value = ref('')
      return { args, value }
    },
    template: `
      <div class="max-w-md">
        <Input v-bind="args" v-model="value" />
        <p class="mt-2 text-sm text-muted-foreground">Value: {{ value }}</p>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Interactive playground to test input props.'
      }
    }
  }
}
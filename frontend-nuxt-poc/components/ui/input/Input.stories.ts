import type { Meta, StoryObj } from '@storybook/vue3'
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
  render: (args) => ({
    components: { Input },
    setup() {
      const value = ref('')
      return { args, value }
    },
    template: '<Input v-bind="args" v-model="value" />'
  })
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
  parameters: {
    docs: {
      description: {
        story: 'Different HTML input types supported by the component.'
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
          <Input placeholder="Default input" />
        </div>
        
        <div class="space-y-2">
          <Label>Focused State</Label>
          <Input placeholder="Click to focus" class="focus:ring-2" />
        </div>
        
        <div class="space-y-2">
          <Label>Disabled State</Label>
          <Input placeholder="Disabled input" disabled />
        </div>
        
        <div class="space-y-2">
          <Label>Read-only State</Label>
          <Input value="Read-only value" readonly />
        </div>
        
        <div class="space-y-2">
          <Label>Error State</Label>
          <Input placeholder="Invalid input" class="border-destructive focus:ring-destructive" />
          <p class="text-sm text-destructive">This field is required</p>
        </div>
        
        <div class="space-y-2">
          <Label>Success State</Label>
          <Input value="Valid input" class="border-green-500 focus:ring-green-500" />
          <p class="text-sm text-green-600">Looks good!</p>
        </div>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Various input states including disabled, readonly, error, and success.'
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
  parameters: {
    docs: {
      description: {
        story: 'Example of a legal matter form using input components.'
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
  render: (args) => ({
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
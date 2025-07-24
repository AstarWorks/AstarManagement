/**
 * Form Components Visual Regression Stories
 * 
 * Comprehensive visual regression testing for all form components including
 * various states, validation scenarios, and responsive behavior.
 */

import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, within, userEvent } from '@storybook/test'
import { ref } from 'vue'

// Form Components (we'll need to import actual components)
import Button from '~/components/ui/button/Button.vue'
import Card from '~/components/ui/card/Card.vue'
import CardContent from '~/components/ui/card/CardContent.vue'
import CardHeader from '~/components/ui/card/CardHeader.vue'
import CardTitle from '~/components/ui/card/CardTitle.vue'
import Input from '~/components/ui/input/Input.vue'
import Label from '~/components/ui/label/Label.vue'
import Textarea from '~/components/ui/textarea/Textarea.vue'
import Select from '~/components/ui/select/Select.vue'
import SelectContent from '~/components/ui/select/SelectContent.vue'
import SelectItem from '~/components/ui/select/SelectItem.vue'
import SelectTrigger from '~/components/ui/select/SelectTrigger.vue'
import SelectValue from '~/components/ui/select/SelectValue.vue'
import Checkbox from '~/components/ui/checkbox/Checkbox.vue'
import Switch from '~/components/ui/switch/Switch.vue'
import RadioGroup from '~/components/ui/radio-group/RadioGroup.vue'
import RadioGroupItem from '~/components/ui/radio-group/RadioGroupItem.vue'

const meta: Meta = {
  title: 'Visual Regression/Form Components',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Visual regression testing for all form components across different states and themes.'
      }
    },
    screenshot: true,
    visualRegression: {
      themes: ['light', 'dark'],
      breakpoints: ['mobile', 'desktop'],
      maskSelectors: ['[data-testid="dynamic-id"]']
    }
  },
  tags: ['visual', 'regression', 'forms', 'test']
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Complete form showcase with all input types
 */
export const CompleteFormShowcase: Story = {
  render: () => ({
    components: {
      Button,
      Card,
      CardContent,
      CardHeader,
      CardTitle,
      Input,
      Label,
      Textarea,
      Select,
      SelectContent,
      SelectItem,
      SelectTrigger,
      SelectValue,
      Checkbox,
      Switch,
      RadioGroup,
      RadioGroupItem
    },
    setup() {
      const formData = ref({
        title: 'Sample Matter Title',
        email: 'test@example.com',
        priority: 'high',
        description: 'This is a sample description for visual testing purposes.',
        notifications: true,
        terms: false,
        matterType: 'contract',
        dueDate: '2024-02-15'
      })
      
      return { formData }
    },
    template: `
      <div class="space-y-8 bg-background p-6">
        <!-- Form Header -->
        <div class="text-center space-y-2">
          <h1 class="text-2xl font-bold">Complete Form Components</h1>
          <p class="text-muted-foreground">Visual regression testing for all form input types</p>
        </div>
        
        <!-- Main Form -->
        <Card class="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Matter Creation Form</CardTitle>
          </CardHeader>
          <CardContent class="space-y-6">
            <!-- Text Inputs -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="title">Matter Title *</Label>
                <Input 
                  id="title" 
                  v-model="formData.title" 
                  placeholder="Enter matter title"
                  required 
                />
              </div>
              
              <div class="space-y-2">
                <Label for="email">Contact Email</Label>
                <Input 
                  id="email" 
                  v-model="formData.email" 
                  type="email"
                  placeholder="client@example.com" 
                />
              </div>
            </div>
            
            <!-- Date Input -->
            <div class="space-y-2">
              <Label for="due-date">Due Date</Label>
              <Input 
                id="due-date" 
                v-model="formData.dueDate" 
                type="date"
              />
            </div>
            
            <!-- Select Dropdown -->
            <div class="space-y-2">
              <Label>Priority Level</Label>
              <Select v-model="formData.priority">
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <!-- Textarea -->
            <div class="space-y-2">
              <Label for="description">Matter Description</Label>
              <Textarea 
                id="description"
                v-model="formData.description"
                placeholder="Provide detailed description of the matter..."
                rows="4"
              />
            </div>
            
            <!-- Radio Group -->
            <div class="space-y-3">
              <Label>Matter Type</Label>
              <RadioGroup v-model="formData.matterType" class="flex flex-col space-y-2">
                <div class="flex items-center space-x-2">
                  <RadioGroupItem value="contract" id="contract" />
                  <Label for="contract">Contract Review</Label>
                </div>
                <div class="flex items-center space-x-2">
                  <RadioGroupItem value="litigation" id="litigation" />
                  <Label for="litigation">Litigation</Label>
                </div>
                <div class="flex items-center space-x-2">
                  <RadioGroupItem value="compliance" id="compliance" />
                  <Label for="compliance">Compliance</Label>
                </div>
                <div class="flex items-center space-x-2">
                  <RadioGroupItem value="corporate" id="corporate" />
                  <Label for="corporate">Corporate</Label>
                </div>
              </RadioGroup>
            </div>
            
            <!-- Checkboxes and Switches -->
            <div class="space-y-4">
              <div class="flex items-center space-x-2">
                <Checkbox id="notifications" v-model="formData.notifications" />
                <Label for="notifications">Send email notifications for this matter</Label>
              </div>
              
              <div class="flex items-center space-x-2">
                <Switch id="urgent-flag" />
                <Label for="urgent-flag">Mark as urgent priority</Label>
              </div>
              
              <div class="flex items-center space-x-2">
                <Checkbox id="terms" v-model="formData.terms" />
                <Label for="terms">I agree to the terms and conditions *</Label>
              </div>
            </div>
            
            <!-- Form Actions -->
            <div class="flex gap-3 pt-4">
              <Button variant="outline" class="flex-1">Cancel</Button>
              <Button class="flex-1">Create Matter</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    `
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Verify form elements are rendered
    const titleInput = canvas.getByLabelText(/matter title/i)
    const emailInput = canvas.getByLabelText(/contact email/i)
    const descriptionTextarea = canvas.getByLabelText(/matter description/i)
    
    expect(titleInput).toBeInTheDocument()
    expect(emailInput).toBeInTheDocument()  
    expect(descriptionTextarea).toBeInTheDocument()
    
    // Test form interactions
    await userEvent.clear(titleInput)
    await userEvent.type(titleInput, 'Visual Test Matter')
    
    await userEvent.clear(emailInput)
    await userEvent.type(emailInput, 'visual.test@example.com')
    
    // Verify input values updated
    expect(titleInput).toHaveValue('Visual Test Matter')
    expect(emailInput).toHaveValue('visual.test@example.com')
  }
}

/**
 * Form validation states
 */
export const FormValidationStates: Story = {
  render: () => ({
    components: {
      Card,
      CardContent,
      CardHeader,
      CardTitle,
      Input,
      Label,
      Textarea,
      Button
    },
    template: `
      <div class="space-y-6 bg-background p-6">
        <div class="text-center">
          <h2 class="text-xl font-bold">Form Validation States</h2>
          <p class="text-muted-foreground">Visual testing for different validation states</p>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <!-- Valid State -->
          <Card>
            <CardHeader>
              <CardTitle class="text-green-600">Valid State</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="space-y-2">
                <Label for="valid-email">Email Address</Label>
                <Input 
                  id="valid-email" 
                  value="valid@example.com"
                  class="border-green-500 focus:border-green-500"
                />
                <p class="text-sm text-green-600">✓ Valid email format</p>
              </div>
              
              <div class="space-y-2">
                <Label for="valid-title">Matter Title</Label>
                <Input 
                  id="valid-title" 
                  value="Valid Matter Title"
                  class="border-green-500 focus:border-green-500"
                />
                <p class="text-sm text-green-600">✓ Title meets requirements</p>
              </div>
            </CardContent>
          </Card>
          
          <!-- Error State -->
          <Card>
            <CardHeader>
              <CardTitle class="text-red-600">Error State</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="space-y-2">
                <Label for="error-email">Email Address</Label>
                <Input 
                  id="error-email" 
                  value="invalid-email"
                  class="border-red-500 focus:border-red-500"
                />
                <p class="text-sm text-red-600">✗ Please enter a valid email address</p>
              </div>
              
              <div class="space-y-2">
                <Label for="error-required">Required Field</Label>
                <Input 
                  id="error-required" 
                  placeholder="This field is required"
                  class="border-red-500 focus:border-red-500"
                />
                <p class="text-sm text-red-600">✗ This field is required</p>
              </div>
            </CardContent>
          </Card>
          
          <!-- Warning State -->
          <Card>
            <CardHeader>
              <CardTitle class="text-yellow-600">Warning State</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="space-y-2">
                <Label for="warning-password">Password</Label>
                <Input 
                  id="warning-password" 
                  type="password"
                  value="weak"
                  class="border-yellow-500 focus:border-yellow-500"
                />
                <p class="text-sm text-yellow-600">⚠ Password strength: Weak</p>
              </div>
              
              <div class="space-y-2">
                <Label for="warning-length">Description (too long)</Label>
                <Textarea 
                  id="warning-length" 
                  value="This is a very long description that exceeds the recommended character limit for optimal display and processing..."
                  class="border-yellow-500 focus:border-yellow-500"
                  rows="3"
                />
                <p class="text-sm text-yellow-600">⚠ 245/200 characters (45 over limit)</p>
              </div>
            </CardContent>
          </Card>
          
          <!-- Disabled State -->
          <Card>
            <CardHeader>
              <CardTitle class="text-gray-500">Disabled State</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="space-y-2">
                <Label for="disabled-input" class="text-gray-400">Disabled Input</Label>
                <Input 
                  id="disabled-input" 
                  value="Cannot edit this field"
                  disabled
                />
                <p class="text-sm text-gray-500">This field is read-only</p>
              </div>
              
              <div class="space-y-2">
                <Label for="disabled-textarea" class="text-gray-400">Disabled Textarea</Label>
                <Textarea 
                  id="disabled-textarea" 
                  value="This content cannot be modified"
                  disabled
                  rows="2"
                />
              </div>
              
              <Button disabled class="w-full">Disabled Button</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    `
  })
}

/**
 * Mobile form layout
 */
export const MobileFormLayout: Story = {
  render: () => ({
    components: {
      Card,
      CardContent,
      CardHeader,
      CardTitle,
      Input,
      Label,
      Textarea,
      Select,
      SelectContent,
      SelectItem,
      SelectTrigger,
      SelectValue,
      Button,
      Checkbox
    },
    setup() {
      const mobileFormData = ref({
        title: '',
        priority: '',
        description: '',
        urgent: false
      })
      
      return { mobileFormData }
    },
    template: `
      <div class="bg-background min-h-screen p-4">
        <!-- Mobile Header -->
        <div class="text-center space-y-2 mb-6">
          <h1 class="text-lg font-bold">Create Matter</h1>
          <p class="text-sm text-muted-foreground">Mobile form layout</p>
        </div>
        
        <!-- Mobile Form -->
        <Card class="w-full">
          <CardHeader class="pb-4">
            <CardTitle class="text-base">Matter Details</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <!-- Stacked form fields for mobile -->
            <div class="space-y-2">
              <Label for="mobile-title" class="text-sm">Title *</Label>
              <Input 
                id="mobile-title" 
                v-model="mobileFormData.title"
                placeholder="Enter matter title"
                class="w-full"
              />
            </div>
            
            <div class="space-y-2">
              <Label class="text-sm">Priority</Label>
              <Select v-model="mobileFormData.priority" class="w-full">
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div class="space-y-2">
              <Label for="mobile-desc" class="text-sm">Description</Label>
              <Textarea 
                id="mobile-desc"
                v-model="mobileFormData.description"
                placeholder="Brief description..."
                rows="3"
                class="w-full resize-none"
              />
            </div>
            
            <div class="flex items-center space-x-2 py-2">
              <Checkbox id="mobile-urgent" v-model="mobileFormData.urgent" />
              <Label for="mobile-urgent" class="text-sm">Mark as urgent</Label>
            </div>
            
            <!-- Mobile action buttons -->
            <div class="space-y-3 pt-4">
              <Button class="w-full">Create Matter</Button>
              <Button variant="outline" class="w-full">Save as Draft</Button>
            </div>
          </CardContent>
        </Card>
        
        <!-- Mobile navigation hint -->
        <div class="text-center mt-6">
          <p class="text-xs text-muted-foreground">
            Swipe down to dismiss keyboard
          </p>
        </div>
      </div>
    `
  }),
  parameters: {
    viewport: { defaultViewport: 'mobile1' }
  }
}

/**
 * Dark theme form components
 */
export const DarkThemeForms: Story = {
  render: () => ({
    components: {
      Card,
      CardContent,
      CardHeader,
      CardTitle,
      Input,
      Label,
      Textarea,
      Button,
      Checkbox,
      Switch
    },
    template: `
      <div class="dark">
        <div class="bg-background text-foreground min-h-screen p-6">
          <div class="text-center space-y-2 mb-8">
            <h1 class="text-2xl font-bold">Dark Theme Forms</h1>
            <p class="text-muted-foreground">Form components in dark mode</p>
          </div>
          
          <Card class="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle>Dark Form Example</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="space-y-2">
                <Label for="dark-title">Matter Title</Label>
                <Input 
                  id="dark-title" 
                  placeholder="Enter title in dark mode"
                  value="Dark Theme Test"
                />
              </div>
              
              <div class="space-y-2">
                <Label for="dark-description">Description</Label>
                <Textarea 
                  id="dark-description"
                  placeholder="Describe the matter..."
                  rows="3"
                  value="This form demonstrates how input fields appear in dark theme."
                />
              </div>
              
              <div class="space-y-3">
                <div class="flex items-center space-x-2">
                  <Checkbox id="dark-notify" checked />
                  <Label for="dark-notify">Enable notifications</Label>
                </div>
                
                <div class="flex items-center space-x-2">
                  <Switch id="dark-urgent" checked />
                  <Label for="dark-urgent">Urgent priority</Label>
                </div>
              </div>
              
              <div class="flex gap-3 pt-4">
                <Button variant="outline" class="flex-1">Cancel</Button>
                <Button class="flex-1">Submit</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    `
  }),
  parameters: {
    backgrounds: { default: 'dark' },
    theme: 'dark'
  }
}

/**
 * Loading and skeleton states for forms
 */
export const FormLoadingStates: Story = {
  render: () => ({
    components: {
      Card,
      CardContent,
      CardHeader,
      CardTitle,
      Input,
      Label,
      Button
    },
    template: `
      <div class="space-y-6 bg-background p-6">
        <div class="text-center">
          <h2 class="text-xl font-bold">Form Loading States</h2>
          <p class="text-muted-foreground">Visual states during form loading and submission</p>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <!-- Loading Form -->
          <Card>
            <CardHeader>
              <CardTitle>Loading Form Data</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="space-y-2">
                <div class="h-4 bg-muted animate-pulse rounded w-24"></div>
                <div class="h-10 bg-muted animate-pulse rounded"></div>
              </div>
              
              <div class="space-y-2">
                <div class="h-4 bg-muted animate-pulse rounded w-32"></div>
                <div class="h-10 bg-muted animate-pulse rounded"></div>
              </div>
              
              <div class="space-y-2">
                <div class="h-4 bg-muted animate-pulse rounded w-28"></div>
                <div class="h-24 bg-muted animate-pulse rounded"></div>
              </div>
              
              <div class="h-10 bg-muted animate-pulse rounded"></div>
            </CardContent>
          </Card>
          
          <!-- Submitting Form -->
          <Card>
            <CardHeader>
              <CardTitle>Submitting Form</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="space-y-2">
                <Label for="submitting-title">Matter Title</Label>
                <Input 
                  id="submitting-title" 
                  value="Contract Review Matter"
                  disabled
                  class="opacity-60"
                />
              </div>
              
              <div class="space-y-2">
                <Label for="submitting-email">Email</Label>
                <Input 
                  id="submitting-email" 
                  value="client@example.com"
                  disabled
                  class="opacity-60"
                />
              </div>
              
              <div class="space-y-2">
                <Label for="submitting-desc">Description</Label>
                <div class="h-20 bg-muted rounded p-3 opacity-60">
                  <p class="text-sm text-muted-foreground">
                    Contract review for new client engagement...
                  </p>
                </div>
              </div>
              
              <Button disabled class="w-full">
                <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Submitting...
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    `
  })
}
import type { Meta, StoryObj } from '@storybook/vue3'
import { FormInput, FormTextarea, FormSelect, FormCheckbox, FormRadio, FormSwitch, FormDatePicker } from './index'
import { useForm } from '~/composables/form/useForm'
import { Button } from '~/components/ui/button'
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'

const meta = {
  title: 'Forms/FormInput',
  component: FormInput,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Form input components integrated with VeeValidate for automatic validation and error handling.'
      }
    }
  }
} satisfies Meta<typeof FormInput>

export default meta
type Story = StoryObj<typeof meta>

// Basic form input with validation
export const Default: Story = {
  render: () => ({
    components: { FormInput, Button },
    setup() {
      const schema = z.object({
        email: z.string().email('Invalid email address')
      })
      
      const form = useForm(schema)
      
      const onSubmit = form.handleSubmit((values) => {
        alert('Form submitted: ' + JSON.stringify(values))
      })
      
      return { form, onSubmit }
    },
    template: `
      <form @submit="onSubmit" class="space-y-4 max-w-md">
        <FormInput
          name="email"
          label="Email Address"
          type="email"
          placeholder="john@example.com"
          description="We'll never share your email."
        />
        <Button type="submit">Submit</Button>
      </form>
    `
  })
}

// All input types
export const AllInputTypes: Story = {
  render: () => ({
    components: { FormInput, FormTextarea, FormSelect, FormCheckbox, FormRadio, FormSwitch, FormDatePicker, Button },
    setup() {
      const schema = z.object({
        name: z.string().min(2, 'Name must be at least 2 characters'),
        email: z.string().email('Invalid email address'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        bio: z.string().max(200, 'Bio must be less than 200 characters'),
        country: z.string().min(1, 'Please select a country'),
        terms: z.boolean().refine(val => val === true, 'You must accept the terms'),
        plan: z.enum(['basic', 'pro', 'enterprise']),
        notifications: z.boolean(),
        birthDate: z.string().min(1, 'Birth date is required')
      })
      
      const form = useForm(schema, {
        initialValues: {
          notifications: true,
          plan: 'basic'
        }
      })
      
      const onSubmit = form.handleSubmit((values) => {
        alert('Form submitted: ' + JSON.stringify(values, null, 2))
      })
      
      const countryOptions = [
        { value: 'us', label: 'United States' },
        { value: 'uk', label: 'United Kingdom' },
        { value: 'jp', label: 'Japan' },
        { value: 'de', label: 'Germany' }
      ]
      
      const planOptions = [
        { value: 'basic', label: 'Basic Plan - $9/month' },
        { value: 'pro', label: 'Pro Plan - $29/month' },
        { value: 'enterprise', label: 'Enterprise - Contact us' }
      ]
      
      return { form, onSubmit, countryOptions, planOptions }
    },
    template: `
      <form @submit="onSubmit" class="space-y-6 max-w-lg">
        <FormInput
          name="name"
          label="Full Name"
          placeholder="John Doe"
          required
        />
        
        <FormInput
          name="email"
          label="Email Address"
          type="email"
          placeholder="john@example.com"
          required
        />
        
        <FormInput
          name="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          required
          description="Must be at least 8 characters"
        />
        
        <FormTextarea
          name="bio"
          label="Bio"
          placeholder="Tell us about yourself..."
          :rows="4"
          :maxLength="200"
          showCharacterCount
          description="Brief description about yourself"
        />
        
        <FormSelect
          name="country"
          label="Country"
          placeholder="Select your country"
          :options="countryOptions"
          required
        />
        
        <FormRadio
          name="plan"
          groupLabel="Subscription Plan"
          :options="planOptions"
          required
        />
        
        <FormDatePicker
          name="birthDate"
          label="Birth Date"
          placeholder="Select your birth date"
          required
        />
        
        <FormSwitch
          name="notifications"
          switchLabel="Email Notifications"
          description="Receive updates about your account"
        />
        
        <FormCheckbox
          name="terms"
          label="I accept the terms and conditions"
          required
        />
        
        <div class="flex gap-4">
          <Button type="submit" :disabled="!form.meta.value.valid">
            Submit Form
          </Button>
          <Button type="button" variant="outline" @click="form.resetForm()">
            Reset
          </Button>
        </div>
        
        <div v-if="form.meta.value.touched && !form.meta.value.valid" class="rounded-lg bg-destructive/10 p-4">
          <p class="text-sm font-medium text-destructive mb-2">Form has errors:</p>
          <ul class="text-sm text-destructive space-y-1">
            <li v-for="error in form.errors.value" :key="error">• {{ error }}</li>
          </ul>
        </div>
      </form>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'All available form input types with validation.'
      }
    }
  }
}

// Legal matter form
export const LegalMatterForm: Story = {
  render: () => ({
    components: { FormInput, FormTextarea, FormSelect, FormRadio, FormDatePicker, Button },
    setup() {
      const schema = z.object({
        caseNumber: z.string()
          .regex(/^\d{4}-[A-Z]{2}-\d{4}$/, 'Format: YYYY-TT-NNNN'),
        title: z.string().min(5, 'Title must be at least 5 characters'),
        clientName: z.string().min(2, 'Client name is required'),
        clientType: z.enum(['individual', 'corporate']),
        matterType: z.string().min(1, 'Please select a matter type'),
        priority: z.enum(['low', 'medium', 'high', 'urgent']),
        description: z.string().min(20, 'Please provide a detailed description'),
        filingDate: z.string().optional(),
        estimatedValue: z.string().optional()
      })
      
      const form = useForm(schema, {
        initialValues: {
          clientType: 'individual',
          priority: 'medium'
        }
      })
      
      const onSubmit = form.handleSubmit(async (values) => {
        console.log('Submitting matter:', values)
        await new Promise(resolve => setTimeout(resolve, 1000))
        alert('Matter created successfully!')
        form.resetForm()
      })
      
      const matterTypes = [
        { value: 'civil', label: 'Civil Law' },
        { value: 'criminal', label: 'Criminal Law' },
        { value: 'corporate', label: 'Corporate Law' },
        { value: 'family', label: 'Family Law' },
        { value: 'ip', label: 'Intellectual Property' }
      ]
      
      const clientTypes = [
        { value: 'individual', label: 'Individual Client' },
        { value: 'corporate', label: 'Corporate Client' }
      ]
      
      const priorities = [
        { value: 'low', label: 'Low Priority' },
        { value: 'medium', label: 'Medium Priority' },
        { value: 'high', label: 'High Priority' },
        { value: 'urgent', label: 'Urgent' }
      ]
      
      return { form, onSubmit, matterTypes, clientTypes, priorities }
    },
    template: `
      <form @submit="onSubmit" class="space-y-6 max-w-2xl">
        <div class="space-y-4">
          <h3 class="text-lg font-semibold">Create New Legal Matter</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              name="caseNumber"
              label="Case Number"
              placeholder="2025-CV-0001"
              required
              description="Format: YYYY-TT-NNNN"
            />
            
            <FormSelect
              name="priority"
              label="Priority"
              :options="priorities"
              required
            />
          </div>
          
          <FormInput
            name="title"
            label="Matter Title"
            placeholder="e.g., Contract Dispute - ABC Corp"
            required
          />
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              name="clientName"
              label="Client Name"
              placeholder="Enter client name"
              required
            />
            
            <FormRadio
              name="clientType"
              groupLabel="Client Type"
              :options="clientTypes"
              layout="horizontal"
              required
            />
          </div>
          
          <FormSelect
            name="matterType"
            label="Matter Type"
            placeholder="Select matter type"
            :options="matterTypes"
            required
          />
          
          <FormTextarea
            name="description"
            label="Case Description"
            placeholder="Provide a detailed description of the legal matter..."
            :rows="5"
            required
            description="Minimum 20 characters"
          />
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormDatePicker
              name="filingDate"
              label="Filing Date"
              placeholder="Select filing date"
            />
            
            <FormInput
              name="estimatedValue"
              label="Estimated Value (¥)"
              type="number"
              placeholder="0"
              min="0"
              step="1000"
            />
          </div>
        </div>
        
        <div class="flex gap-4">
          <Button 
            type="submit" 
            :disabled="form.isSubmitting.value"
            :loading="form.isSubmitting.value"
          >
            Create Matter
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            @click="form.resetForm()"
            :disabled="form.isSubmitting.value"
          >
            Clear Form
          </Button>
        </div>
        
        <div v-if="form.meta.value.touched && Object.keys(form.errors.value).length > 0" 
             class="rounded-lg bg-destructive/10 p-4">
          <p class="text-sm font-medium text-destructive">Please fix the following errors:</p>
        </div>
      </form>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Complete legal matter creation form with comprehensive validation.'
      }
    }
  }
}

// Form with conditional fields
export const ConditionalFields: Story = {
  render: () => ({
    components: { FormInput, FormSelect, FormRadio, Button },
    setup() {
      const schema = z.object({
        accountType: z.enum(['personal', 'business']),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        companyName: z.string().optional(),
        taxId: z.string().optional(),
        email: z.string().email(),
        plan: z.string()
      }).refine((data) => {
        if (data.accountType === 'personal') {
          return !!data.firstName && !!data.lastName
        }
        if (data.accountType === 'business') {
          return !!data.companyName && !!data.taxId
        }
        return true
      }, {
        message: 'Please fill in all required fields for your account type',
        path: ['accountType']
      })
      
      const form = useForm(schema, {
        initialValues: {
          accountType: 'personal'
        }
      })
      
      const accountTypes = [
        { value: 'personal', label: 'Personal Account' },
        { value: 'business', label: 'Business Account' }
      ]
      
      const personalPlans = [
        { value: 'free', label: 'Free Plan' },
        { value: 'premium', label: 'Premium - $9/month' }
      ]
      
      const businessPlans = [
        { value: 'starter', label: 'Starter - $29/month' },
        { value: 'professional', label: 'Professional - $99/month' },
        { value: 'enterprise', label: 'Enterprise - Custom pricing' }
      ]
      
      const accountType = computed(() => form.values.accountType)
      
      return { form, accountTypes, personalPlans, businessPlans, accountType }
    },
    template: `
      <form @submit="form.handleSubmit(values => alert(JSON.stringify(values, null, 2)))" 
            class="space-y-6 max-w-md">
        <FormRadio
          name="accountType"
          groupLabel="Account Type"
          :options="accountTypes"
          required
        />
        
        <div v-if="accountType === 'personal'" class="space-y-4">
          <FormInput
            name="firstName"
            label="First Name"
            placeholder="John"
            required
          />
          
          <FormInput
            name="lastName"
            label="Last Name"
            placeholder="Doe"
            required
          />
          
          <FormSelect
            name="plan"
            label="Select Plan"
            :options="personalPlans"
            required
          />
        </div>
        
        <div v-else-if="accountType === 'business'" class="space-y-4">
          <FormInput
            name="companyName"
            label="Company Name"
            placeholder="ABC Corporation"
            required
          />
          
          <FormInput
            name="taxId"
            label="Tax ID"
            placeholder="12-3456789"
            required
          />
          
          <FormSelect
            name="plan"
            label="Select Plan"
            :options="businessPlans"
            required
          />
        </div>
        
        <FormInput
          name="email"
          label="Email Address"
          type="email"
          placeholder="email@example.com"
          required
        />
        
        <Button type="submit">Create Account</Button>
      </form>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Form with conditional fields based on user selection.'
      }
    }
  }
}

// Async validation
export const AsyncValidation: Story = {
  render: () => ({
    components: { FormInput, Button },
    setup() {
      const checkEmailAvailability = async (email: string) => {
        await new Promise(resolve => setTimeout(resolve, 1000))
        const unavailableEmails = ['admin@example.com', 'test@example.com']
        return !unavailableEmails.includes(email.toLowerCase())
      }
      
      const schema = z.object({
        email: z.string()
          .email('Invalid email address')
          .refine(checkEmailAvailability, 'This email is already taken')
      })
      
      const form = useForm(schema)
      
      return { form }
    },
    template: `
      <form @submit="form.handleSubmit(values => alert('Email is available!'))" 
            class="space-y-4 max-w-md">
        <FormInput
          name="email"
          label="Email Address"
          type="email"
          placeholder="email@example.com"
          description="Try 'admin@example.com' to see validation error"
          required
        />
        
        <div v-if="form.isValidating.value" class="text-sm text-muted-foreground">
          Checking email availability...
        </div>
        
        <Button type="submit" :disabled="!form.meta.value.valid || form.isValidating.value">
          Check Availability
        </Button>
      </form>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Form with async validation for checking email availability.'
      }
    }
  }
}
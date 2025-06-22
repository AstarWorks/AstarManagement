import type { Meta, StoryObj } from '@storybook/vue3'
import MultiStepForm from './MultiStepForm.vue'
import { Button } from '~/components/ui/button'
import { FormInput, FormTextarea, FormSelect, FormRadio, FormCheckbox, FormDatePicker } from './index'
import { useForm } from '~/composables/form/useForm'
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'

const meta = {
  title: 'Forms/MultiStepForm',
  component: MultiStepForm,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'A multi-step form component for complex workflows with progress tracking and validation.'
      }
    }
  }
} satisfies Meta<typeof MultiStepForm>

export default meta
type Story = StoryObj<typeof meta>

// Basic multi-step form
export const Default: Story = {
  render: () => ({
    components: {
      MultiStepForm,
      FormInput,
      FormTextarea,
      FormSelect,
      Button
    },
    setup() {
      const steps = [
        {
          id: 'personal',
          title: 'Personal Information',
          description: 'Enter your personal details'
        },
        {
          id: 'contact',
          title: 'Contact Details',
          description: 'How can we reach you?'
        },
        {
          id: 'preferences',
          title: 'Preferences',
          description: 'Customize your experience'
        }
      ]
      
      const personalSchema = z.object({
        firstName: z.string().min(2, 'First name is required'),
        lastName: z.string().min(2, 'Last name is required'),
        dateOfBirth: z.string().min(1, 'Date of birth is required')
      })
      
      const contactSchema = z.object({
        email: z.string().email('Invalid email address'),
        phone: z.string().min(10, 'Phone number is required'),
        address: z.string().min(5, 'Address is required')
      })
      
      const preferencesSchema = z.object({
        language: z.string().min(1, 'Please select a language'),
        notifications: z.boolean(),
        newsletter: z.boolean()
      })
      
      const currentStep = ref(0)
      const formData = ref({})
      
      const handleStepComplete = (stepData: any) => {
        formData.value = { ...formData.value, ...stepData }
        if (currentStep.value < steps.length - 1) {
          currentStep.value++
        } else {
          alert('Form submitted: ' + JSON.stringify(formData.value, null, 2))
        }
      }
      
      const handlePrevious = () => {
        if (currentStep.value > 0) {
          currentStep.value--
        }
      }
      
      const languageOptions = [
        { value: 'en', label: 'English' },
        { value: 'ja', label: '日本語' },
        { value: 'zh', label: '中文' }
      ]
      
      return {
        steps,
        currentStep,
        formData,
        handleStepComplete,
        handlePrevious,
        personalSchema,
        contactSchema,
        preferencesSchema,
        languageOptions
      }
    },
    template: `
      <MultiStepForm 
        :steps="steps" 
        :currentStep="currentStep"
        class="max-w-2xl"
      >
        <!-- Step 1: Personal Information -->
        <template v-if="currentStep === 0">
          <form @submit.prevent="handleStepComplete" class="space-y-4">
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
            
            <FormDatePicker
              name="dateOfBirth"
              label="Date of Birth"
              placeholder="Select your birth date"
              required
            />
            
            <div class="flex justify-between">
              <Button type="button" variant="outline" disabled>
                Previous
              </Button>
              <Button type="submit">
                Next
              </Button>
            </div>
          </form>
        </template>
        
        <!-- Step 2: Contact Details -->
        <template v-else-if="currentStep === 1">
          <form @submit.prevent="handleStepComplete" class="space-y-4">
            <FormInput
              name="email"
              label="Email Address"
              type="email"
              placeholder="john@example.com"
              required
            />
            
            <FormInput
              name="phone"
              label="Phone Number"
              type="tel"
              placeholder="+1 (555) 123-4567"
              required
            />
            
            <FormTextarea
              name="address"
              label="Address"
              placeholder="Enter your full address"
              :rows="3"
              required
            />
            
            <div class="flex justify-between">
              <Button type="button" variant="outline" @click="handlePrevious">
                Previous
              </Button>
              <Button type="submit">
                Next
              </Button>
            </div>
          </form>
        </template>
        
        <!-- Step 3: Preferences -->
        <template v-else-if="currentStep === 2">
          <form @submit.prevent="handleStepComplete" class="space-y-4">
            <FormSelect
              name="language"
              label="Preferred Language"
              placeholder="Select language"
              :options="languageOptions"
              required
            />
            
            <FormCheckbox
              name="notifications"
              label="Enable email notifications"
            />
            
            <FormCheckbox
              name="newsletter"
              label="Subscribe to newsletter"
            />
            
            <div class="flex justify-between">
              <Button type="button" variant="outline" @click="handlePrevious">
                Previous
              </Button>
              <Button type="submit">
                Complete
              </Button>
            </div>
          </form>
        </template>
      </MultiStepForm>
    `
  })
}

// Legal case creation wizard
export const LegalCaseWizard: Story = {
  render: () => ({
    components: {
      MultiStepForm,
      FormInput,
      FormTextarea,
      FormSelect,
      FormRadio,
      FormDatePicker,
      FormCheckbox,
      Button
    },
    setup() {
      const steps = [
        {
          id: 'case-info',
          title: 'Case Information',
          description: 'Basic case details'
        },
        {
          id: 'parties',
          title: 'Parties Involved',
          description: 'Client and opposing party details'
        },
        {
          id: 'documents',
          title: 'Initial Documents',
          description: 'Upload relevant documents'
        },
        {
          id: 'review',
          title: 'Review & Submit',
          description: 'Review case details before submission'
        }
      ]
      
      const currentStep = ref(0)
      const formData = ref({
        caseInfo: {},
        parties: {},
        documents: {},
        review: {}
      })
      
      const handleNext = () => {
        if (currentStep.value < steps.length - 1) {
          currentStep.value++
        }
      }
      
      const handlePrevious = () => {
        if (currentStep.value > 0) {
          currentStep.value--
        }
      }
      
      const handleSubmit = () => {
        alert('Case created successfully!')
      }
      
      const caseTypes = [
        { value: 'civil', label: 'Civil Law' },
        { value: 'criminal', label: 'Criminal Law' },
        { value: 'corporate', label: 'Corporate Law' },
        { value: 'family', label: 'Family Law' }
      ]
      
      const priorityOptions = [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' }
      ]
      
      const clientTypes = [
        { value: 'individual', label: 'Individual' },
        { value: 'corporate', label: 'Corporate' }
      ]
      
      return {
        steps,
        currentStep,
        formData,
        handleNext,
        handlePrevious,
        handleSubmit,
        caseTypes,
        priorityOptions,
        clientTypes
      }
    },
    template: `
      <MultiStepForm 
        :steps="steps" 
        :currentStep="currentStep"
        class="max-w-3xl"
      >
        <!-- Step 1: Case Information -->
        <template v-if="currentStep === 0">
          <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                name="caseNumber"
                label="Case Number"
                placeholder="2025-CV-0001"
                description="Format: YYYY-TT-NNNN"
                v-model="formData.caseInfo.caseNumber"
                required
              />
              
              <FormSelect
                name="caseType"
                label="Case Type"
                placeholder="Select case type"
                :options="caseTypes"
                v-model="formData.caseInfo.caseType"
                required
              />
            </div>
            
            <FormInput
              name="title"
              label="Case Title"
              placeholder="e.g., Contract Dispute - ABC Corp"
              v-model="formData.caseInfo.title"
              required
            />
            
            <FormTextarea
              name="description"
              label="Case Description"
              placeholder="Provide a detailed description of the case..."
              :rows="4"
              v-model="formData.caseInfo.description"
              required
            />
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormDatePicker
                name="filingDate"
                label="Filing Date"
                placeholder="Select filing date"
                v-model="formData.caseInfo.filingDate"
              />
              
              <FormRadio
                name="priority"
                groupLabel="Priority Level"
                :options="priorityOptions"
                v-model="formData.caseInfo.priority"
                layout="horizontal"
                required
              />
            </div>
            
            <div class="flex justify-between">
              <Button variant="outline" disabled>
                Previous
              </Button>
              <Button @click="handleNext">
                Next
              </Button>
            </div>
          </div>
        </template>
        
        <!-- Step 2: Parties Involved -->
        <template v-else-if="currentStep === 1">
          <div class="space-y-6">
            <div class="space-y-4">
              <h3 class="text-lg font-semibold">Client Information</h3>
              
              <FormRadio
                name="clientType"
                groupLabel="Client Type"
                :options="clientTypes"
                v-model="formData.parties.clientType"
                layout="horizontal"
                required
              />
              
              <FormInput
                name="clientName"
                label="Client Name"
                placeholder="Enter client name"
                v-model="formData.parties.clientName"
                required
              />
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  name="clientEmail"
                  label="Email"
                  type="email"
                  placeholder="client@example.com"
                  v-model="formData.parties.clientEmail"
                />
                
                <FormInput
                  name="clientPhone"
                  label="Phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  v-model="formData.parties.clientPhone"
                />
              </div>
            </div>
            
            <div class="space-y-4">
              <h3 class="text-lg font-semibold">Opposing Party</h3>
              
              <FormInput
                name="opposingParty"
                label="Opposing Party Name"
                placeholder="Enter opposing party name"
                v-model="formData.parties.opposingParty"
              />
              
              <FormInput
                name="opposingCounsel"
                label="Opposing Counsel"
                placeholder="Law firm or attorney name"
                v-model="formData.parties.opposingCounsel"
              />
            </div>
            
            <div class="flex justify-between">
              <Button variant="outline" @click="handlePrevious">
                Previous
              </Button>
              <Button @click="handleNext">
                Next
              </Button>
            </div>
          </div>
        </template>
        
        <!-- Step 3: Initial Documents -->
        <template v-else-if="currentStep === 2">
          <div class="space-y-6">
            <div class="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
              <p class="text-sm text-muted-foreground mb-4">
                Drag and drop documents here, or click to browse
              </p>
              <Button variant="outline">
                Select Documents
              </Button>
            </div>
            
            <div class="space-y-4">
              <h4 class="text-sm font-medium">Document Checklist</h4>
              <div class="space-y-2">
                <FormCheckbox
                  name="hasContract"
                  label="Original contract or agreement"
                  v-model="formData.documents.hasContract"
                />
                <FormCheckbox
                  name="hasCorrespondence"
                  label="Relevant correspondence"
                  v-model="formData.documents.hasCorrespondence"
                />
                <FormCheckbox
                  name="hasEvidence"
                  label="Supporting evidence"
                  v-model="formData.documents.hasEvidence"
                />
                <FormCheckbox
                  name="hasFinancial"
                  label="Financial records (if applicable)"
                  v-model="formData.documents.hasFinancial"
                />
              </div>
            </div>
            
            <FormTextarea
              name="documentNotes"
              label="Additional Notes"
              placeholder="Any notes about the documents..."
              :rows="3"
              v-model="formData.documents.notes"
            />
            
            <div class="flex justify-between">
              <Button variant="outline" @click="handlePrevious">
                Previous
              </Button>
              <Button @click="handleNext">
                Next
              </Button>
            </div>
          </div>
        </template>
        
        <!-- Step 4: Review & Submit -->
        <template v-else-if="currentStep === 3">
          <div class="space-y-6">
            <div class="space-y-4">
              <h3 class="text-lg font-semibold">Review Case Details</h3>
              
              <div class="rounded-lg bg-muted p-4 space-y-3">
                <div>
                  <p class="text-sm font-medium">Case Number</p>
                  <p class="text-sm text-muted-foreground">{{ formData.caseInfo.caseNumber || 'Not provided' }}</p>
                </div>
                
                <div>
                  <p class="text-sm font-medium">Case Title</p>
                  <p class="text-sm text-muted-foreground">{{ formData.caseInfo.title || 'Not provided' }}</p>
                </div>
                
                <div>
                  <p class="text-sm font-medium">Client</p>
                  <p class="text-sm text-muted-foreground">{{ formData.parties.clientName || 'Not provided' }}</p>
                </div>
                
                <div>
                  <p class="text-sm font-medium">Opposing Party</p>
                  <p class="text-sm text-muted-foreground">{{ formData.parties.opposingParty || 'Not provided' }}</p>
                </div>
                
                <div>
                  <p class="text-sm font-medium">Priority</p>
                  <p class="text-sm text-muted-foreground capitalize">{{ formData.caseInfo.priority || 'Not set' }}</p>
                </div>
              </div>
            </div>
            
            <FormCheckbox
              name="confirmAccuracy"
              label="I confirm that all information provided is accurate and complete"
              v-model="formData.review.confirmed"
              required
            />
            
            <div class="flex justify-between">
              <Button variant="outline" @click="handlePrevious">
                Previous
              </Button>
              <Button @click="handleSubmit" :disabled="!formData.review.confirmed">
                Create Case
              </Button>
            </div>
          </div>
        </template>
      </MultiStepForm>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'A comprehensive wizard for creating new legal cases with validation and review.'
      }
    }
  }
}

// Compact multi-step form
export const CompactForm: Story = {
  render: () => ({
    components: {
      MultiStepForm,
      FormInput,
      FormSelect,
      Button
    },
    setup() {
      const steps = [
        { id: 'account', title: 'Account' },
        { id: 'profile', title: 'Profile' },
        { id: 'done', title: 'Done' }
      ]
      
      const currentStep = ref(0)
      
      const handleNext = () => {
        if (currentStep.value < steps.length - 1) {
          currentStep.value++
        }
      }
      
      const handlePrevious = () => {
        if (currentStep.value > 0) {
          currentStep.value--
        }
      }
      
      return { steps, currentStep, handleNext, handlePrevious }
    },
    template: `
      <MultiStepForm 
        :steps="steps" 
        :currentStep="currentStep"
        variant="compact"
        class="max-w-md"
      >
        <template v-if="currentStep === 0">
          <div class="space-y-4">
            <FormInput
              name="username"
              label="Username"
              placeholder="Choose a username"
            />
            <FormInput
              name="password"
              label="Password"
              type="password"
              placeholder="Create a password"
            />
            <Button @click="handleNext" class="w-full">
              Next
            </Button>
          </div>
        </template>
        
        <template v-else-if="currentStep === 1">
          <div class="space-y-4">
            <FormInput
              name="displayName"
              label="Display Name"
              placeholder="How should we call you?"
            />
            <FormSelect
              name="role"
              label="Role"
              placeholder="Select your role"
              :options="[
                { value: 'lawyer', label: 'Lawyer' },
                { value: 'clerk', label: 'Clerk' },
                { value: 'admin', label: 'Admin' }
              ]"
            />
            <div class="flex gap-2">
              <Button variant="outline" @click="handlePrevious" class="flex-1">
                Back
              </Button>
              <Button @click="handleNext" class="flex-1">
                Next
              </Button>
            </div>
          </div>
        </template>
        
        <template v-else>
          <div class="text-center space-y-4">
            <div class="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto">
              <svg class="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold">All Done!</h3>
            <p class="text-sm text-muted-foreground">
              Your account has been created successfully.
            </p>
            <Button class="w-full">
              Get Started
            </Button>
          </div>
        </template>
      </MultiStepForm>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'A compact multi-step form with minimal UI.'
      }
    }
  }
}
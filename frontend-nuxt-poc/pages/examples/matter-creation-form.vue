<template>
  <div class="container mx-auto py-8 max-w-4xl">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground">Matter Creation Form</h1>
      <p class="text-muted-foreground mt-2">
        Complete legal matter intake process with client information and case details
      </p>
    </div>

    <MultiStepForm
      :steps="formSteps"
      :initial-data="initialFormData"
      storage-key="matter-creation-form"
      @form-submit="handleFormSubmit"
      @step-complete="handleStepComplete"
    >
      <!-- Step 1: Client Information -->
      <template #step-0="{ form }">
        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormSelect
              name="clientType"
              label="Client Type"
              required
              :options="clientTypeOptions"
              placeholder="Select client type..."
            />
            
            <ConditionalField
              name="existingClientId"
              :show-when="(values) => values.clientType === 'existing'"
            >
              <FormSelect
                name="existingClientId"
                label="Existing Client"
                :options="existingClientOptions"
                placeholder="Search existing clients..."
                async-options
                :load-options="loadExistingClients"
              />
            </ConditionalField>
          </div>

          <!-- New Client Fields -->
          <ConditionalField
            name="newClientInfo"
            :show-when="(values) => values.clientType === 'new'"
          >
            <div class="space-y-6">
              <h3 class="text-lg font-semibold border-b pb-2">New Client Information</h3>
              
              <FormRadio
                name="clientEntityType"
                group-label="Entity Type"
                required
                :options="entityTypeOptions"
                layout="horizontal"
              />

              <!-- Individual Client Fields -->
              <ConditionalField
                name="individualFields"
                :show-when="(values) => values.clientEntityType === 'individual'"
              >
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput name="firstName" label="First Name" required />
                  <FormInput name="lastName" label="Last Name" required />
                  <FormInput name="email" label="Email" type="email" required />
                  <FormInput name="phone" label="Phone" mask="phone" />
                </div>
              </ConditionalField>

              <!-- Corporate Client Fields -->
              <ConditionalField
                name="corporateFields"
                :show-when="(values) => values.clientEntityType === 'corporate'"
              >
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput name="companyName" label="Company Name" required />
                  <FormInput name="taxId" label="Tax ID" />
                  <FormInput name="contactPerson" label="Contact Person" />
                  <FormInput name="contactEmail" label="Contact Email" type="email" required />
                  <FormInput name="contactPhone" label="Contact Phone" mask="phone" />
                </div>
              </ConditionalField>

              <!-- Address Information -->
              <div class="space-y-4">
                <h4 class="font-medium">Address Information</h4>
                <div class="grid grid-cols-1 gap-4">
                  <FormInput name="address1" label="Address Line 1" required />
                  <FormInput name="address2" label="Address Line 2" />
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormInput name="city" label="City" required />
                    <FormInput name="prefecture" label="Prefecture" required />
                    <FormInput name="postalCode" label="Postal Code" mask="postal" required />
                  </div>
                </div>
              </div>
            </div>
          </ConditionalField>
        </div>
      </template>

      <!-- Step 2: Matter Details -->
      <template #step-1="{ form }">
        <div class="space-y-6">
          <h3 class="text-lg font-semibold border-b pb-2">Case Information</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput name="matterTitle" label="Matter Title" required />
            <FormSelect
              name="matterType"
              label="Matter Type"
              required
              :options="matterTypeOptions"
            />
          </div>

          <FormTextarea
            name="matterDescription"
            label="Case Description"
            placeholder="Provide a detailed description of the legal matter..."
            :max-length="2000"
            show-character-count
            auto-resize
            required
          />

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormSelect
              name="priority"
              label="Priority"
              :options="priorityOptions"
              default-value="MEDIUM"
            />
            
            <FormDatePicker
              name="openDate"
              label="Case Open Date"
              :default-value="new Date()"
              required
            />
            
            <FormInput
              name="estimatedValue"
              label="Estimated Value (¥)"
              type="number"
              prefix="¥"
            />
          </div>

          <!-- Opposing Party Information -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h4 class="font-medium">Opposing Parties</h4>
              <Button type="button" size="sm" @click="addOpposingParty">
                <Plus class="h-4 w-4 mr-2" />
                Add Party
              </Button>
            </div>
            
            <div v-for="(party, index) in opposingParties" :key="party.key" class="border rounded-lg p-4">
              <div class="flex justify-between items-start mb-4">
                <h5 class="font-medium text-sm">Opposing Party {{ index + 1 }}</h5>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  @click="removeOpposingParty(index)"
                >
                  <X class="h-4 w-4" />
                </Button>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  :name="`opposingParties[${index}].name`"
                  label="Name/Company"
                  required
                />
                <FormInput
                  :name="`opposingParties[${index}].representative`"
                  label="Legal Representative"
                />
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Step 3: Case Settings -->
      <template #step-2="{ form }">
        <div class="space-y-6">
          <h3 class="text-lg font-semibold border-b pb-2">Case Management Settings</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormSelect
              name="assignedLawyer"
              label="Primary Lawyer"
              required
              :options="lawyerOptions"
            />
            
            <FormSelect
              name="responsibleClerk"
              label="Responsible Clerk"
              :options="clerkOptions"
            />
          </div>

          <!-- Billing Settings -->
          <div class="space-y-4">
            <h4 class="font-medium">Billing Configuration</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormSelect
                name="billingType"
                label="Billing Type"
                :options="billingTypeOptions"
                default-value="hourly"
              />
              
              <ConditionalField
                name="hourlyRate"
                :show-when="(values) => values.billingType === 'hourly'"
              >
                <FormInput
                  name="hourlyRate"
                  label="Hourly Rate (¥)"
                  type="number"
                  prefix="¥"
                  required
                />
              </ConditionalField>
              
              <ConditionalField
                name="flatFee"
                :show-when="(values) => values.billingType === 'flat'"
              >
                <FormInput
                  name="flatFee"
                  label="Flat Fee (¥)"
                  type="number"
                  prefix="¥"
                  required
                />
              </ConditionalField>
            </div>
          </div>

          <!-- Important Dates -->
          <div class="space-y-4">
            <h4 class="font-medium">Important Dates</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormDatePicker
                name="statute_limitation"
                label="Statute of Limitations"
                placeholder="Select deadline..."
              />
              
              <FormDatePicker
                name="next_hearing"
                label="Next Court Hearing"
                include-time
              />
            </div>
          </div>

          <!-- Tags and Categories -->
          <div class="space-y-4">
            <FormCheckbox
              name="tags"
              group-label="Case Tags"
              :options="tagOptions"
              group-layout="horizontal"
              show-group-helpers
            />
            
            <FormSwitch
              name="isConfidential"
              switch-label="Confidential Case"
              inline-description="Mark this case as confidential with restricted access"
            />
            
            <FormSwitch
              name="enableAutoReminders"
              switch-label="Enable Automatic Reminders"
              inline-description="Send email reminders for important deadlines"
              :checked-value="true"
            />
          </div>
        </div>
      </template>

      <!-- Step 4: Review and Submit -->
      <template #step-3="{ form }">
        <div class="space-y-6">
          <h3 class="text-lg font-semibold border-b pb-2">Review Matter Details</h3>
          
          <MatterSummary :form-data="form.values" />
          
          <div class="bg-muted/50 p-4 rounded-lg">
            <h4 class="font-medium mb-2">Next Steps</h4>
            <ul class="text-sm text-muted-foreground space-y-1">
              <li>• Matter will be created and assigned to the primary lawyer</li>
              <li>• Initial case file will be set up automatically</li>
              <li>• Calendar reminders will be created for important dates</li>
              <li>• Client will receive confirmation email with case details</li>
            </ul>
          </div>
        </div>
      </template>
    </MultiStepForm>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { z } from 'zod'
import { Button } from '~/components/ui/button'
import { Plus, X } from 'lucide-vue-next'
import { createMatterSchema, matterTypeSchema, matterPrioritySchema } from '~/schemas/matter'

// Page metadata
definePageMeta({
  title: 'Matter Creation Form',
  description: 'Create a new legal matter with client information and case details'
})

// Form steps configuration
const formSteps = [
  {
    id: 'client',
    title: 'Client Information',
    description: 'Select or add client details',
    schema: z.object({
      clientType: z.enum(['new', 'existing']),
      existingClientId: z.string().optional(),
      clientEntityType: z.enum(['individual', 'corporate']).optional(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      companyName: z.string().optional(),
      taxId: z.string().optional(),
      contactPerson: z.string().optional(),
      contactEmail: z.string().email().optional(),
      contactPhone: z.string().optional(),
      address1: z.string().optional(),
      address2: z.string().optional(),
      city: z.string().optional(),
      prefecture: z.string().optional(),
      postalCode: z.string().optional()
    })
  },
  {
    id: 'matter',
    title: 'Matter Details',
    description: 'Case information and opposing parties',
    schema: z.object({
      matterTitle: z.string().min(1),
      matterType: matterTypeSchema,
      matterDescription: z.string().min(10),
      priority: matterPrioritySchema.default('MEDIUM'),
      openDate: z.string(),
      estimatedValue: z.number().optional(),
      opposingParties: z.array(z.object({
        name: z.string().min(1),
        representative: z.string().optional()
      })).optional()
    })
  },
  {
    id: 'settings',
    title: 'Case Settings',
    description: 'Billing, assignments, and deadlines',
    schema: z.object({
      assignedLawyer: z.string().min(1),
      responsibleClerk: z.string().optional(),
      billingType: z.enum(['hourly', 'flat', 'contingency']),
      hourlyRate: z.number().optional(),
      flatFee: z.number().optional(),
      statute_limitation: z.string().optional(),
      next_hearing: z.string().optional(),
      tags: z.array(z.string()).optional(),
      isConfidential: z.boolean().default(false),
      enableAutoReminders: z.boolean().default(true)
    })
  },
  {
    id: 'review',
    title: 'Review & Submit',
    description: 'Confirm all details before creating the matter',
    schema: z.object({})
  }
]

// Initial form data
const initialFormData = {
  priority: 'MEDIUM',
  openDate: new Date().toISOString().split('T')[0],
  billingType: 'hourly',
  enableAutoReminders: true
}

// Dynamic opposing parties
const opposingParties = ref([])

// Form options
const clientTypeOptions = [
  { value: 'new', label: 'New Client' },
  { value: 'existing', label: 'Existing Client' }
]

const entityTypeOptions = [
  { value: 'individual', label: 'Individual' },
  { value: 'corporate', label: 'Corporation' }
]

const matterTypeOptions = [
  { value: 'CIVIL', label: 'Civil Law' },
  { value: 'CRIMINAL', label: 'Criminal Law' },
  { value: 'CORPORATE', label: 'Corporate Law' },
  { value: 'FAMILY', label: 'Family Law' },
  { value: 'IMMIGRATION', label: 'Immigration Law' },
  { value: 'INTELLECTUAL_PROPERTY', label: 'Intellectual Property' },
  { value: 'LABOR', label: 'Labor Law' },
  { value: 'REAL_ESTATE', label: 'Real Estate Law' },
  { value: 'TAX', label: 'Tax Law' },
  { value: 'OTHER', label: 'Other' }
]

const priorityOptions = [
  { value: 'LOW', label: 'Low Priority' },
  { value: 'MEDIUM', label: 'Medium Priority' },
  { value: 'HIGH', label: 'High Priority' },
  { value: 'URGENT', label: 'Urgent' }
]

const billingTypeOptions = [
  { value: 'hourly', label: 'Hourly Rate' },
  { value: 'flat', label: 'Flat Fee' },
  { value: 'contingency', label: 'Contingency' }
]

const existingClientOptions = []
const lawyerOptions = []
const clerkOptions = []
const tagOptions = [
  { value: 'contract', label: 'Contract' },
  { value: 'litigation', label: 'Litigation' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'pro_bono', label: 'Pro Bono' }
]

// Form event handlers
const handleFormSubmit = async (formData: any) => {
  console.log('Creating matter with data:', formData)
  
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Navigate to matter details page
    await navigateTo(`/matters/${formData.matter.matterTitle.replace(/\s+/g, '-').toLowerCase()}`)
  } catch (error) {
    console.error('Failed to create matter:', error)
  }
}

const handleStepComplete = (step: number, data: any) => {
  console.log(`Step ${step + 1} completed:`, data)
}

// Opposing parties management
const addOpposingParty = () => {
  opposingParties.value.push({
    key: Date.now().toString(),
    name: '',
    representative: ''
  })
}

const removeOpposingParty = (index: number) => {
  opposingParties.value.splice(index, 1)
}

// Mock data loading functions
const loadExistingClients = async () => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000))
  return [
    { value: '1', label: 'Yamada Corporation' },
    { value: '2', label: 'Tanaka Industries' },
    { value: '3', label: 'Sato Holdings' }
  ]
}
</script>
import type { Meta, StoryObj } from '@storybook/vue3'
import ConditionalField from './ConditionalField.vue'
import { FormInput, FormSelect, FormRadio, FormTextarea, FormDatePicker } from './index'
import { useForm } from '~/composables/form/useForm'
import { z } from 'zod'
import { Button } from '~/components/ui/button'

const meta = {
  title: 'Forms/ConditionalField',
  component: ConditionalField,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'A wrapper component that conditionally renders form fields based on reactive conditions.'
      }
    }
  }
} satisfies Meta<typeof ConditionalField>

export default meta
type Story = StoryObj<typeof meta>

// Basic conditional field
export const Default: Story = {
  render: () => ({
    components: {
      ConditionalField,
      FormInput,
      FormRadio,
      Button
    },
    setup() {
      const schema = z.object({
        hasAccount: z.enum(['yes', 'no']),
        accountNumber: z.string().optional()
      }).refine((data) => {
        if (data.hasAccount === 'yes' && !data.accountNumber) {
          return false
        }
        return true
      }, {
        message: 'Account number is required when you have an account',
        path: ['accountNumber']
      })
      
      const form = useForm(schema, {
        initialValues: {
          hasAccount: 'no'
        }
      })
      
      const hasAccountOptions = [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' }
      ]
      
      const showAccountNumber = computed(() => form.values.hasAccount === 'yes')
      
      return { form, hasAccountOptions, showAccountNumber }
    },
    template: `
      <form @submit="form.handleSubmit(values => alert(JSON.stringify(values)))" class="space-y-4 max-w-md">
        <FormRadio
          name="hasAccount"
          groupLabel="Do you have an existing account?"
          :options="hasAccountOptions"
          required
        />
        
        <ConditionalField :condition="showAccountNumber">
          <FormInput
            name="accountNumber"
            label="Account Number"
            placeholder="Enter your account number"
            required
          />
        </ConditionalField>
        
        <Button type="submit">Submit</Button>
      </form>
    `
  })
}

// Multiple conditions
export const MultipleConditions: Story = {
  render: () => ({
    components: {
      ConditionalField,
      FormInput,
      FormSelect,
      FormTextarea,
      Button
    },
    setup() {
      const form = useForm(z.object({
        userType: z.string(),
        companyName: z.string().optional(),
        taxId: z.string().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        reason: z.string().optional()
      }))
      
      const userTypes = [
        { value: '', label: 'Select user type' },
        { value: 'individual', label: 'Individual' },
        { value: 'business', label: 'Business' },
        { value: 'other', label: 'Other' }
      ]
      
      const isIndividual = computed(() => form.values.userType === 'individual')
      const isBusiness = computed(() => form.values.userType === 'business')
      const isOther = computed(() => form.values.userType === 'other')
      
      return { form, userTypes, isIndividual, isBusiness, isOther }
    },
    template: `
      <form @submit="form.handleSubmit(values => alert(JSON.stringify(values)))" class="space-y-4 max-w-md">
        <FormSelect
          name="userType"
          label="User Type"
          placeholder="Select user type"
          :options="userTypes"
          required
        />
        
        <ConditionalField :condition="isIndividual">
          <div class="space-y-4">
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
          </div>
        </ConditionalField>
        
        <ConditionalField :condition="isBusiness">
          <div class="space-y-4">
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
          </div>
        </ConditionalField>
        
        <ConditionalField :condition="isOther">
          <FormTextarea
            name="reason"
            label="Please specify"
            placeholder="Tell us more about your organization type..."
            :rows="3"
            required
          />
        </ConditionalField>
        
        <Button type="submit">Submit</Button>
      </form>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Form with multiple conditional fields based on user selection.'
      }
    }
  }
}

// Legal context conditional form
export const LegalContextForm: Story = {
  render: () => ({
    components: {
      ConditionalField,
      FormInput,
      FormSelect,
      FormRadio,
      FormTextarea,
      FormDatePicker,
      Button
    },
    setup() {
      const form = useForm(z.object({
        caseType: z.string(),
        criminalDetails: z.object({
          chargeType: z.string(),
          arrestDate: z.string(),
          bailAmount: z.string()
        }).optional(),
        civilDetails: z.object({
          disputeType: z.string(),
          claimAmount: z.string(),
          filingDeadline: z.string()
        }).optional(),
        familyDetails: z.object({
          matterType: z.string(),
          childrenInvolved: z.enum(['yes', 'no']),
          numberOfChildren: z.string()
        }).optional()
      }))
      
      const caseTypes = [
        { value: '', label: 'Select case type' },
        { value: 'criminal', label: 'Criminal Law' },
        { value: 'civil', label: 'Civil Law' },
        { value: 'family', label: 'Family Law' }
      ]
      
      const criminalChargeTypes = [
        { value: 'misdemeanor', label: 'Misdemeanor' },
        { value: 'felony', label: 'Felony' },
        { value: 'federal', label: 'Federal Crime' }
      ]
      
      const civilDisputeTypes = [
        { value: 'contract', label: 'Contract Dispute' },
        { value: 'tort', label: 'Personal Injury' },
        { value: 'property', label: 'Property Dispute' },
        { value: 'employment', label: 'Employment Issue' }
      ]
      
      const familyMatterTypes = [
        { value: 'divorce', label: 'Divorce' },
        { value: 'custody', label: 'Child Custody' },
        { value: 'support', label: 'Child/Spousal Support' },
        { value: 'adoption', label: 'Adoption' }
      ]
      
      const yesNoOptions = [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' }
      ]
      
      const isCriminal = computed(() => form.values.caseType === 'criminal')
      const isCivil = computed(() => form.values.caseType === 'civil')
      const isFamily = computed(() => form.values.caseType === 'family')
      const hasChildren = computed(() => form.values.familyDetails?.childrenInvolved === 'yes')
      
      return {
        form,
        caseTypes,
        criminalChargeTypes,
        civilDisputeTypes,
        familyMatterTypes,
        yesNoOptions,
        isCriminal,
        isCivil,
        isFamily,
        hasChildren
      }
    },
    template: `
      <form @submit="form.handleSubmit(values => alert(JSON.stringify(values, null, 2)))" class="space-y-6 max-w-2xl">
        <div>
          <h3 class="text-lg font-semibold mb-4">New Case Intake Form</h3>
          
          <FormSelect
            name="caseType"
            label="Case Type"
            placeholder="Select the type of case"
            :options="caseTypes"
            required
            description="This will determine which additional information we need"
          />
        </div>
        
        <!-- Criminal Law Fields -->
        <ConditionalField :condition="isCriminal">
          <div class="space-y-4 p-4 rounded-lg border bg-muted/30">
            <h4 class="font-medium">Criminal Case Details</h4>
            
            <FormSelect
              name="criminalDetails.chargeType"
              label="Charge Type"
              placeholder="Select charge type"
              :options="criminalChargeTypes"
              required
            />
            
            <FormDatePicker
              name="criminalDetails.arrestDate"
              label="Arrest Date"
              placeholder="Select arrest date"
              required
            />
            
            <FormInput
              name="criminalDetails.bailAmount"
              label="Bail Amount (¥)"
              type="number"
              placeholder="0"
              min="0"
              step="1000"
            />
          </div>
        </ConditionalField>
        
        <!-- Civil Law Fields -->
        <ConditionalField :condition="isCivil">
          <div class="space-y-4 p-4 rounded-lg border bg-muted/30">
            <h4 class="font-medium">Civil Case Details</h4>
            
            <FormSelect
              name="civilDetails.disputeType"
              label="Type of Dispute"
              placeholder="Select dispute type"
              :options="civilDisputeTypes"
              required
            />
            
            <FormInput
              name="civilDetails.claimAmount"
              label="Claim Amount (¥)"
              type="number"
              placeholder="0"
              min="0"
              step="1000"
              required
              description="Estimated value of the claim"
            />
            
            <FormDatePicker
              name="civilDetails.filingDeadline"
              label="Filing Deadline"
              placeholder="Select deadline"
              description="Statute of limitations or court-imposed deadline"
            />
          </div>
        </ConditionalField>
        
        <!-- Family Law Fields -->
        <ConditionalField :condition="isFamily">
          <div class="space-y-4 p-4 rounded-lg border bg-muted/30">
            <h4 class="font-medium">Family Law Details</h4>
            
            <FormSelect
              name="familyDetails.matterType"
              label="Matter Type"
              placeholder="Select matter type"
              :options="familyMatterTypes"
              required
            />
            
            <FormRadio
              name="familyDetails.childrenInvolved"
              groupLabel="Are children involved?"
              :options="yesNoOptions"
              layout="horizontal"
              required
            />
            
            <ConditionalField :condition="hasChildren">
              <FormInput
                name="familyDetails.numberOfChildren"
                label="Number of Children"
                type="number"
                placeholder="0"
                min="1"
                max="20"
                required
              />
            </ConditionalField>
          </div>
        </ConditionalField>
        
        <Button type="submit" class="w-full">
          Submit Case Intake
        </Button>
      </form>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Complex legal intake form with nested conditional fields based on case type.'
      }
    }
  }
}

// Animated transitions
export const AnimatedTransitions: Story = {
  render: () => ({
    components: {
      ConditionalField,
      FormInput,
      FormRadio,
      Button
    },
    setup() {
      const showAdditional = ref(false)
      const animationStyle = ref('fade')
      
      const animationOptions = [
        { value: 'fade', label: 'Fade' },
        { value: 'slide', label: 'Slide' },
        { value: 'scale', label: 'Scale' }
      ]
      
      return { showAdditional, animationStyle, animationOptions }
    },
    template: `
      <div class="space-y-6 max-w-md">
        <FormRadio
          v-model="animationStyle"
          groupLabel="Animation Style"
          :options="animationOptions"
          layout="horizontal"
        />
        
        <Button @click="showAdditional = !showAdditional" variant="outline" class="w-full">
          {{ showAdditional ? 'Hide' : 'Show' }} Additional Fields
        </Button>
        
        <ConditionalField :condition="showAdditional" :transition="animationStyle">
          <div class="space-y-4 p-4 rounded-lg border bg-muted/30">
            <h4 class="font-medium">Additional Information</h4>
            <FormInput
              name="additionalField1"
              label="Field 1"
              placeholder="Enter value"
            />
            <FormInput
              name="additionalField2"
              label="Field 2"
              placeholder="Enter value"
            />
            <FormTextarea
              name="notes"
              label="Notes"
              placeholder="Any additional notes..."
              :rows="3"
            />
          </div>
        </ConditionalField>
      </div>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Conditional fields with different animation transitions.'
      }
    }
  }
}

// Complex validation
export const WithComplexValidation: Story = {
  render: () => ({
    components: {
      ConditionalField,
      FormInput,
      FormSelect,
      FormRadio,
      Button
    },
    setup() {
      const schema = z.object({
        paymentMethod: z.enum(['credit', 'bank', 'check']),
        creditCard: z.object({
          number: z.string().regex(/^\d{16}$/, 'Must be 16 digits'),
          expiry: z.string().regex(/^\d{2}\/\d{2}$/, 'Format: MM/YY'),
          cvv: z.string().regex(/^\d{3,4}$/, 'Must be 3-4 digits')
        }).optional(),
        bankAccount: z.object({
          accountNumber: z.string().min(8, 'Must be at least 8 digits'),
          routingNumber: z.string().regex(/^\d{9}$/, 'Must be 9 digits')
        }).optional(),
        checkDetails: z.object({
          checkNumber: z.string().min(1, 'Check number is required'),
          bankName: z.string().min(2, 'Bank name is required')
        }).optional()
      }).refine((data) => {
        if (data.paymentMethod === 'credit' && (!data.creditCard?.number || !data.creditCard?.expiry || !data.creditCard?.cvv)) {
          return false
        }
        if (data.paymentMethod === 'bank' && (!data.bankAccount?.accountNumber || !data.bankAccount?.routingNumber)) {
          return false
        }
        if (data.paymentMethod === 'check' && (!data.checkDetails?.checkNumber || !data.checkDetails?.bankName)) {
          return false
        }
        return true
      }, {
        message: 'Please fill in all required payment details'
      })
      
      const form = useForm(schema, {
        initialValues: {
          paymentMethod: 'credit'
        }
      })
      
      const paymentMethods = [
        { value: 'credit', label: 'Credit Card' },
        { value: 'bank', label: 'Bank Transfer' },
        { value: 'check', label: 'Check' }
      ]
      
      const isCreditCard = computed(() => form.values.paymentMethod === 'credit')
      const isBankTransfer = computed(() => form.values.paymentMethod === 'bank')
      const isCheck = computed(() => form.values.paymentMethod === 'check')
      
      return { form, paymentMethods, isCreditCard, isBankTransfer, isCheck }
    },
    template: `
      <form @submit="form.handleSubmit(values => alert('Payment processed!'))" class="space-y-6 max-w-md">
        <FormRadio
          name="paymentMethod"
          groupLabel="Payment Method"
          :options="paymentMethods"
          required
        />
        
        <!-- Credit Card Fields -->
        <ConditionalField :condition="isCreditCard">
          <div class="space-y-4 p-4 rounded-lg border">
            <FormInput
              name="creditCard.number"
              label="Card Number"
              placeholder="1234 5678 9012 3456"
              maxlength="16"
              required
            />
            <div class="grid grid-cols-2 gap-4">
              <FormInput
                name="creditCard.expiry"
                label="Expiry Date"
                placeholder="MM/YY"
                maxlength="5"
                required
              />
              <FormInput
                name="creditCard.cvv"
                label="CVV"
                placeholder="123"
                maxlength="4"
                required
              />
            </div>
          </div>
        </ConditionalField>
        
        <!-- Bank Transfer Fields -->
        <ConditionalField :condition="isBankTransfer">
          <div class="space-y-4 p-4 rounded-lg border">
            <FormInput
              name="bankAccount.accountNumber"
              label="Account Number"
              placeholder="12345678"
              required
            />
            <FormInput
              name="bankAccount.routingNumber"
              label="Routing Number"
              placeholder="123456789"
              maxlength="9"
              required
            />
          </div>
        </ConditionalField>
        
        <!-- Check Fields -->
        <ConditionalField :condition="isCheck">
          <div class="space-y-4 p-4 rounded-lg border">
            <FormInput
              name="checkDetails.checkNumber"
              label="Check Number"
              placeholder="1001"
              required
            />
            <FormInput
              name="checkDetails.bankName"
              label="Bank Name"
              placeholder="First National Bank"
              required
            />
          </div>
        </ConditionalField>
        
        <Button type="submit" class="w-full">
          Process Payment
        </Button>
      </form>
    `
  }),
  parameters: {
    docs: {
      description: {
        story: 'Payment form with conditional validation based on payment method.'
      }
    }
  }
}
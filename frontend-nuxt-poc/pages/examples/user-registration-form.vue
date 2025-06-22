<template>
  <div class="container mx-auto py-8 max-w-2xl">
    <div class="mb-8 text-center">
      <h1 class="text-3xl font-bold text-foreground">User Registration</h1>
      <p class="text-muted-foreground mt-2">
        Create your account to access the legal case management system
      </p>
    </div>

    <Form
      :schema="registrationSchema"
      :initial-values="initialValues"
      @submit="handleSubmit"
    >
      <template #default="{ form }">
        <div class="space-y-6">
          <!-- Personal Information -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold border-b pb-2">Personal Information</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                name="firstName"
                label="First Name"
                placeholder="山田"
                required
              />
              
              <FormInput
                name="lastName"
                label="Last Name"
                placeholder="太郎"
                required
              />
            </div>

            <FormInput
              name="email"
              label="Email Address"
              type="email"
              placeholder="yamada@example.com"
              required
              description="This will be your login email"
            />

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                name="phone"
                label="Phone Number"
                mask="phone"
                placeholder="090-1234-5678"
              />
              
              <FormDatePicker
                name="birthDate"
                label="Date of Birth"
                :max-date="new Date()"
                placeholder="Select your birth date"
              />
            </div>
          </div>

          <!-- Account Settings -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold border-b pb-2">Account Settings</h3>
            
            <FormInput
              name="password"
              label="Password"
              type="password"
              required
              help-text="Minimum 8 characters with letters and numbers"
            />

            <FormInput
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              required
            />

            <FormSelect
              name="role"
              label="Role"
              required
              :options="roleOptions"
              description="Select your role in the organization"
            />

            <ConditionalField
              name="barNumber"
              :show-when="(values) => values.role === 'lawyer'"
            >
              <FormInput
                name="barNumber"
                label="Bar Registration Number"
                placeholder="Enter your bar number"
                required
              />
            </ConditionalField>

            <ConditionalField
              name="department"
              :show-when="(values) => values.role === 'clerk'"
            >
              <FormSelect
                name="department"
                label="Department"
                :options="departmentOptions"
                required
              />
            </ConditionalField>
          </div>

          <!-- Contact Preferences -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold border-b pb-2">Contact Preferences</h3>
            
            <FormCheckbox
              name="notificationPreferences"
              group-label="Email Notifications"
              :options="notificationOptions"
              show-group-helpers
              description="Choose which email notifications you'd like to receive"
            />

            <FormRadio
              name="language"
              group-label="Preferred Language"
              :options="languageOptions"
              layout="horizontal"
              :default-value="'ja'"
            />

            <FormSwitch
              name="twoFactorAuth"
              switch-label="Enable Two-Factor Authentication"
              inline-description="Add an extra layer of security to your account"
              :default-value="false"
            />
          </div>

          <!-- Terms and Privacy -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold border-b pb-2">Terms & Privacy</h3>
            
            <FormCheckbox
              name="agreeToTerms"
              checkbox-label="I agree to the Terms of Service and Privacy Policy"
              required
            />

            <FormCheckbox
              name="subscribeNewsletter"
              checkbox-label="Subscribe to newsletter and product updates"
              description="Stay informed about new features and legal updates"
            />

            <ConditionalField
              name="marketingConsent"
              :show-when="(values) => values.subscribeNewsletter"
            >
              <FormCheckbox
                name="marketingConsent"
                checkbox-label="I consent to receiving marketing communications"
              />
            </ConditionalField>
          </div>

          <!-- Auto-save Status -->
          <div v-if="autoSave.hasSavedData.value" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex items-center gap-2 text-blue-800">
              <Save class="h-4 w-4" />
              <span class="text-sm font-medium">
                Draft saved {{ formatLastSave(autoSave.lastSave.value) }}
              </span>
            </div>
            <div class="mt-2 flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                @click="restoreDraft"
              >
                Restore Draft
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                @click="clearDraft"
              >
                Clear Draft
              </Button>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="pt-6">
            <Button
              type="submit"
              size="lg"
              class="w-full"
              :disabled="form.isSubmitting || !form.isValid"
              :loading="form.isSubmitting"
            >
              Create Account
            </Button>
          </div>

          <!-- Sign In Link -->
          <div class="text-center pt-4">
            <p class="text-sm text-muted-foreground">
              Already have an account?
              <NuxtLink to="/auth/login" class="text-primary hover:underline">
                Sign in here
              </NuxtLink>
            </p>
          </div>
        </div>
      </template>
    </Form>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { format } from 'date-fns'
import { Button } from '~/components/ui/button'
import { Save } from 'lucide-vue-next'
import { useForm } from '~/composables/form/useForm'
import { useAutoSave } from '~/composables/form/useAutoSave'

// Page metadata
definePageMeta({
  title: 'User Registration',
  description: 'Create a new user account for the legal case management system',
  layout: 'auth'
})

// Validation schema
const registrationSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[a-zA-Z])(?=.*\d)/, 'Password must contain letters and numbers'),
  confirmPassword: z.string(),
  role: z.enum(['lawyer', 'clerk', 'admin'], {
    required_error: 'Please select a role'
  }),
  barNumber: z.string().optional(),
  department: z.string().optional(),
  notificationPreferences: z.array(z.string()).default([]),
  language: z.enum(['ja', 'en']).default('ja'),
  twoFactorAuth: z.boolean().default(false),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions'
  }),
  subscribeNewsletter: z.boolean().default(false),
  marketingConsent: z.boolean().default(false)
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
}).refine((data) => {
  if (data.role === 'lawyer') {
    return !!data.barNumber
  }
  return true
}, {
  message: "Bar number is required for lawyers",
  path: ["barNumber"]
}).refine((data) => {
  if (data.role === 'clerk') {
    return !!data.department
  }
  return true
}, {
  message: "Department is required for clerks",
  path: ["department"]
})

// Initial values
const initialValues = {
  language: 'ja',
  twoFactorAuth: false,
  subscribeNewsletter: false,
  marketingConsent: false,
  notificationPreferences: ['case_updates', 'deadline_reminders']
}

// Form options
const roleOptions = [
  { value: 'lawyer', label: '弁護士 (Lawyer)', description: 'Licensed legal practitioner' },
  { value: 'clerk', label: '事務員 (Clerk)', description: 'Administrative support staff' },
  { value: 'admin', label: '管理者 (Administrator)', description: 'System administrator' }
]

const departmentOptions = [
  { value: 'litigation', label: 'Litigation Department' },
  { value: 'corporate', label: 'Corporate Law' },
  { value: 'family', label: 'Family Law' },
  { value: 'immigration', label: 'Immigration Law' },
  { value: 'administration', label: 'Administration' }
]

const notificationOptions = [
  { value: 'case_updates', label: 'Case Updates' },
  { value: 'deadline_reminders', label: 'Deadline Reminders' },
  { value: 'court_schedule', label: 'Court Schedule Changes' },
  { value: 'billing_alerts', label: 'Billing Alerts' },
  { value: 'system_updates', label: 'System Updates' }
]

const languageOptions = [
  { value: 'ja', label: '日本語', description: 'Japanese' },
  { value: 'en', label: 'English', description: 'English' }
]

// Form setup
const form = useForm(registrationSchema, {
  initialValues,
  onSuccess: (values) => {
    console.log('Registration successful:', values)
  },
  onError: (errors) => {
    console.error('Registration failed:', errors)
  }
})

// Auto-save setup
const autoSave = useAutoSave(form, {
  key: 'user-registration',
  debounce: 1500,
  saveOnlyWhenDirty: true,
  onSaveSuccess: () => {
    console.log('Registration draft saved')
  }
})

// Enable auto-save
autoSave.enable()

// Form handlers
const handleSubmit = async (values: any) => {
  console.log('Submitting registration:', values)
  
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Clear auto-save on successful registration
    await autoSave.clear()
    
    // Navigate to welcome page
    await navigateTo('/auth/welcome')
  } catch (error) {
    console.error('Registration failed:', error)
    throw error
  }
}

const restoreDraft = async () => {
  const restored = await autoSave.restore()
  if (restored) {
    console.log('Draft restored successfully')
  }
}

const clearDraft = async () => {
  await autoSave.clear()
  console.log('Draft cleared')
}

// Utilities
const formatLastSave = (date?: Date) => {
  if (!date) return ''
  
  const now = new Date()
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffMinutes < 1) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
  
  return format(date, 'MMM d, h:mm a')
}

// Provide form context for conditional fields
provide('FormContext', form)
</script>
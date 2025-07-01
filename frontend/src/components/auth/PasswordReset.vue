<script setup lang="ts">
import { z } from 'zod'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, Mail, CheckCircle, ArrowLeft } from 'lucide-vue-next'

// Form validation schema
const passwordResetSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
})

type PasswordResetForm = z.infer<typeof passwordResetSchema>

// Component props
interface Props {
  /** Initial email value */
  initialEmail?: string
  /** Disable form submission */
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  initialEmail: '',
  disabled: false
})

// Component emits
const emit = defineEmits<{
  /** Fired when form is submitted successfully */
  submit: [email: string]
  /** Fired when user clicks back to login */
  backToLogin: []
}>()

// Form setup
const { handleSubmit, defineField, errors, meta } = useForm({
  validationSchema: toTypedSchema(passwordResetSchema),
  initialValues: {
    email: props.initialEmail
  }
})

// Form fields
const [email, emailAttrs] = defineField('email')

// Local state
const isSubmitting = ref(false)
const isSuccess = ref(false)
const error = ref<string | null>(null)
const resendCooldown = ref(0)

// Computed
const isFormValid = computed(() => meta.value.valid && email.value)
const canResend = computed(() => resendCooldown.value === 0 && !isSubmitting.value)

// Methods
const onSubmit = handleSubmit(async (values) => {
  if (isSubmitting.value || props.disabled) return
  
  isSubmitting.value = true
  error.value = null
  
  try {
    await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: values.email }
    })
    
    isSuccess.value = true
    startResendCooldown()
    
    emit('submit', values.email)
  } catch (err: any) {
    console.error('Password reset request failed:', err)
    
    // Handle different error types
    if (err.statusCode === 404) {
      error.value = 'No account found with that email address.'
    } else if (err.statusCode === 429) {
      const retryAfter = err.data?.retryAfter || 60
      error.value = `Too many reset attempts. Please try again in ${retryAfter} seconds.`
      resendCooldown.value = retryAfter
      startResendCooldown()
    } else if (err.code === 'NETWORK_ERROR') {
      error.value = 'Network connection failed. Please check your internet connection and try again.'
    } else {
      error.value = err.data?.message || 'Failed to send password reset email. Please try again.'
    }
  } finally {
    isSubmitting.value = false
  }
})

const handleResend = async () => {
  if (!canResend.value || !email.value) return
  
  await onSubmit()
}

const startResendCooldown = () => {
  resendCooldown.value = 60
  const timer = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

const handleBackToLogin = () => {
  emit('backToLogin')
}

// Clear error when user starts typing
watch(email, () => {
  if (error.value) {
    error.value = null
  }
})

// Auto-focus email field on mount
onMounted(() => {
  nextTick(() => {
    const emailInput = document.getElementById('reset-email')
    if (emailInput) {
      emailInput.focus()
    }
  })
})
</script>

<template>
  <Card class="w-full max-w-md mx-auto">
    <CardHeader class="space-y-1 text-center">
      <div class="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
        <Mail class="h-6 w-6 text-primary" />
      </div>
      <CardTitle class="text-2xl font-bold">
        Reset Password
      </CardTitle>
      <CardDescription>
        Enter your email address and we'll send you a link to reset your password
      </CardDescription>
    </CardHeader>
    
    <CardContent class="space-y-4">
      <!-- Success state -->
      <Alert v-if="isSuccess" class="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
        <CheckCircle class="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertDescription class="text-green-800 dark:text-green-200">
          <strong>Email sent!</strong><br>
          Check your inbox for password reset instructions. If you don't see the email, check your spam folder.
        </AlertDescription>
      </Alert>
      
      <!-- Error state -->
      <Alert v-if="error" variant="destructive">
        <AlertCircle class="h-4 w-4" />
        <AlertDescription>
          {{ error }}
        </AlertDescription>
      </Alert>
      
      <!-- Form -->
      <form v-if="!isSuccess" @submit.prevent="onSubmit" class="space-y-4">
        <div class="space-y-2">
          <Label for="reset-email">Email Address</Label>
          <Input
            id="reset-email"
            v-model="email"
            v-bind="emailAttrs"
            type="email"
            placeholder="Enter your email address"
            autocomplete="email"
            :disabled="isSubmitting || disabled"
            :class="[{ 'border-destructive': errors.email }]"
            required
          />
          <p v-if="errors.email" class="text-sm text-destructive">
            {{ errors.email }}
          </p>
        </div>
        
        <Button
          type="submit"
          class="w-full"
          :disabled="!isFormValid || isSubmitting || disabled"
        >
          <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
          <span v-if="isSubmitting">Sending Reset Email...</span>
          <span v-else>Send Reset Email</span>
        </Button>
      </form>
      
      <!-- Success state actions -->
      <div v-if="isSuccess" class="space-y-3">
        <Button
          variant="outline"
          class="w-full"
          @click="handleResend"
          :disabled="!canResend"
        >
          <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
          <span v-if="isSubmitting">Sending...</span>
          <span v-else-if="resendCooldown > 0">
            Resend in {{ resendCooldown }}s
          </span>
          <span v-else>Resend Email</span>
        </Button>
        
        <div class="text-sm text-muted-foreground text-center">
          <p>Didn't receive the email?</p>
          <ul class="mt-2 space-y-1">
            <li>• Check your spam/junk folder</li>
            <li>• Make sure {{ email }} is correct</li>
            <li>• Try resending after {{ resendCooldown > 0 ? resendCooldown + 's' : 'a minute' }}</li>
          </ul>
        </div>
      </div>
      
      <!-- Back to login -->
      <div class="text-center">
        <Button
          variant="ghost"
          size="sm"
          @click="handleBackToLogin"
          :disabled="isSubmitting || disabled"
          class="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft class="mr-2 h-4 w-4" />
          Back to Login
        </Button>
      </div>
      
      <!-- Help text -->
      <div class="text-center text-xs text-muted-foreground">
        <p>
          Need help? Contact support at 
          <a href="mailto:support@astermanagement.com" class="text-primary hover:underline">
            support@astermanagement.com
          </a>
        </p>
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
/* Success animation */
.success-enter-active {
  transition: all 0.3s ease-out;
}

.success-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

/* Form field animations */
.form-field {
  @apply transition-all duration-200;
}

.form-field:focus-within {
  @apply transform scale-[1.02];
}

/* Button hover effects */
.resend-button {
  @apply transition-all duration-200;
}

.resend-button:hover:not(:disabled) {
  @apply transform translate-y-[-1px] shadow-md;
}

/* Help text styling */
.help-text {
  @apply text-xs leading-relaxed;
}

.help-text a {
  @apply transition-colors duration-200;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .card-content {
    @apply px-4;
  }
}
</style>
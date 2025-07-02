<script setup lang="ts">
import { z } from 'zod'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, Shield, Smartphone } from 'lucide-vue-next'

// Form validation schema
const twoFactorSchema = z.object({
  code: z
    .string()
    .min(6, 'Code must be 6 digits')
    .max(6, 'Code must be 6 digits')
    .regex(/^\d{6}$/, 'Code must contain only numbers'),
  trustDevice: z.boolean().default(false)
})

type TwoFactorForm = z.infer<typeof twoFactorSchema>

// Component props
interface Props {
  /** User's email for display */
  email?: string
  /** Disable form submission */
  disabled?: boolean
  /** Show trust device option */
  showTrustDevice?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  email: '',
  disabled: false,
  showTrustDevice: true
})

// Component emits
const emit = defineEmits<{
  /** Fired when form is submitted with valid data */
  submit: [credentials: TwoFactorForm]
  /** Fired when user requests to resend code */
  resendCode: []
  /** Fired when user cancels 2FA */
  cancel: []
}>()

// Composables
const authStore = useAuthStore()
const router = useRouter()

// Form setup
const { handleSubmit, defineField, errors, meta, resetForm } = useForm({
  validationSchema: toTypedSchema(twoFactorSchema),
  initialValues: {
    code: '',
    trustDevice: false
  }
})

// Form fields
const [code, codeAttrs] = defineField('code')
const [trustDevice, trustDeviceAttrs] = defineField('trustDevice')

// Local state
const isSubmitting = ref(false)
const verificationError = ref<string | null>(null)
const isResendingCode = ref(false)
const resendCooldown = ref(0)
const attemptsRemaining = ref(5)

// Input refs for focus management
const codeInputs = ref<HTMLInputElement[]>([])

// Computed
const isFormValid = computed(() => meta.value.valid && code.value && code.value.length === 6)
const canResendCode = computed(() => resendCooldown.value === 0 && !isResendingCode.value)
const displayEmail = computed(() => props.email || authStore.lastEmail || 'your email')

// Methods
const onSubmit = handleSubmit(async (values) => {
  if (isSubmitting.value || props.disabled) return
  
  isSubmitting.value = true
  verificationError.value = null
  
  try {
    await authStore.verify2FA(values)
    
    // Emit submit event
    emit('submit', values)
    
    // Redirect to dashboard on success
    await router.push('/dashboard')
  } catch (error: any) {
    console.error('2FA verification failed:', error)
    
    // Handle different error types
    if (error.code === 'INVALID_CODE') {
      attemptsRemaining.value--
      if (attemptsRemaining.value <= 0) {
        verificationError.value = 'Too many failed attempts. Please log in again.'
        // Redirect to login after delay
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        verificationError.value = `Invalid verification code. ${attemptsRemaining.value} attempts remaining.`
      }
    } else if (error.code === 'CODE_EXPIRED') {
      verificationError.value = 'Verification code has expired. Please request a new code.'
    } else if (error.code === 'RATE_LIMITED') {
      verificationError.value = `Too many verification attempts. Please try again in ${error.retryAfter} seconds.`
    } else {
      verificationError.value = error.message || 'Verification failed. Please try again.'
    }
    
    // Clear the code field on error
    resetForm({ values: { code: '', trustDevice: values.trustDevice } })
    
    // Focus first input
    nextTick(() => {
      codeInputs.value[0]?.focus()
    })
  } finally {
    isSubmitting.value = false
  }
})

const handleResendCode = async () => {
  if (!canResendCode.value) return
  
  isResendingCode.value = true
  verificationError.value = null
  
  try {
    // Make API call to resend code
    await $fetch('/api/auth/resend-2fa', {
      method: 'POST',
      body: { sessionId: authStore.sessionId }
    })
    
    // Start cooldown timer
    resendCooldown.value = 60
    const timer = setInterval(() => {
      resendCooldown.value--
      if (resendCooldown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
    
    emit('resendCode')
  } catch (error: any) {
    verificationError.value = error.message || 'Failed to resend code. Please try again.'
  } finally {
    isResendingCode.value = false
  }
}

const handleCancel = async () => {
  // Logout and redirect to login
  await authStore.logout()
  emit('cancel')
}

// Auto-focus and auto-submit logic for code input
const handleCodeInput = (event: Event, index: number) => {
  const target = event.target as HTMLInputElement
  const value = target.value
  
  // Only allow digits
  if (!/^\d*$/.test(value)) {
    target.value = value.replace(/\D/g, '')
    return
  }
  
  // Update the code value
  const codeArray = (code.value || '').split('')
  codeArray[index] = value
  code.value = codeArray.join('')
  
  // Auto-advance to next input
  if (value && index < 5) {
    codeInputs.value[index + 1]?.focus()
  }
  
  // Auto-submit when all 6 digits are entered
  if (code.value.length === 6 && isFormValid.value) {
    onSubmit()
  }
}

const handleCodeKeydown = (event: KeyboardEvent, index: number) => {
  // Handle backspace
  if (event.key === 'Backspace' && !(code.value || '')[index] && index > 0) {
    codeInputs.value[index - 1]?.focus()
  }
  
  // Handle paste
  if (event.key === 'v' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault()
    navigator.clipboard.readText().then(text => {
      const digits = text.replace(/\D/g, '').slice(0, 6)
      code.value = digits
      
      // Focus the next empty input or last input
      const nextIndex = Math.min(digits.length, 5)
      codeInputs.value[nextIndex]?.focus()
    })
  }
}

// Clear error when user starts typing
watch(code, () => {
  if (verificationError.value) {
    verificationError.value = null
  }
})

// Auto-focus first input on mount
onMounted(() => {
  nextTick(() => {
    codeInputs.value[0]?.focus()
  })
})
</script>

<template>
  <Card class="w-full max-w-md mx-auto">
    <CardHeader class="space-y-1 text-center">
      <div class="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
        <Shield class="h-6 w-6 text-primary" />
      </div>
      <CardTitle class="text-2xl font-bold">
        Two-Factor Authentication
      </CardTitle>
      <CardDescription>
        Enter the 6-digit code from your authenticator app
      </CardDescription>
    </CardHeader>
    
    <CardContent class="space-y-6">
      <!-- User info -->
      <div class="text-center space-y-2">
        <div class="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
          <Smartphone class="h-4 w-4" />
          <span>Code sent to {{ displayEmail }}</span>
        </div>
      </div>
      
      <!-- Verification error alert -->
      <Alert v-if="verificationError" variant="destructive">
        <AlertCircle class="h-4 w-4" />
        <AlertDescription>
          {{ verificationError }}
        </AlertDescription>
      </Alert>
      
      <form @submit.prevent="onSubmit" class="space-y-6">
        <!-- Code input -->
        <div class="space-y-2">
          <Label class="text-center block">Verification Code</Label>
          <div class="flex justify-center space-x-2">
            <Input
              v-for="(digit, index) in 6"
              :key="index"
              :ref="el => codeInputs[index] = el as HTMLInputElement"
              :value="(code || '')[index] || ''"
              @input="handleCodeInput($event, index)"
              @keydown="handleCodeKeydown($event, index)"
              type="text"
              inputmode="numeric"
              :maxlength="1"
              class="w-12 h-12 text-center text-lg font-mono"
              :disabled="isSubmitting || disabled"
              :class="errors.code ? 'border-destructive' : ''"
              autocomplete="one-time-code"
            />
          </div>
          <p v-if="errors.code" class="text-sm text-destructive text-center">
            {{ errors.code }}
          </p>
        </div>
        
        <!-- Trust device option -->
        <div v-if="showTrustDevice" class="flex items-center space-x-2 justify-center">
          <Checkbox
            id="trust-device"
            v-model:checked="trustDevice"
            v-bind="trustDeviceAttrs"
            :disabled="isSubmitting || disabled"
          />
          <Label for="trust-device" class="text-sm">
            Trust this device for 30 days
          </Label>
        </div>
        
        <!-- Submit button -->
        <Button
          type="submit"
          class="w-full"
          :disabled="!isFormValid || isSubmitting || disabled"
        >
          <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
          <span v-if="isSubmitting">Verifying...</span>
          <span v-else>Verify Code</span>
        </Button>
      </form>
      
      <!-- Resend code -->
      <div class="text-center space-y-2">
        <p class="text-sm text-muted-foreground">
          Didn't receive a code?
        </p>
        <Button
          variant="ghost"
          size="sm"
          @click="handleResendCode"
          :disabled="!canResendCode || disabled"
        >
          <Loader2 v-if="isResendingCode" class="mr-2 h-4 w-4 animate-spin" />
          <span v-if="isResendingCode">Sending...</span>
          <span v-else-if="resendCooldown > 0">
            Resend in {{ resendCooldown }}s
          </span>
          <span v-else>Resend Code</span>
        </Button>
      </div>
      
      <!-- Cancel option -->
      <div class="text-center">
        <Button
          variant="ghost"
          size="sm"
          @click="handleCancel"
          :disabled="isSubmitting || disabled"
          class="text-muted-foreground"
        >
          Cancel and log out
        </Button>
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
/* Custom styles for code inputs */
.code-input {
  @apply w-12 h-12 text-center text-lg font-mono border-2 rounded-md;
  @apply focus:border-primary focus:ring-2 focus:ring-primary/20;
  @apply transition-all duration-200;
}

.code-input:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.code-input.error {
  @apply border-destructive focus:border-destructive focus:ring-destructive/20;
}

/* Animation for successful input */
.code-input.success {
  @apply border-green-500 bg-green-50;
}
</style>
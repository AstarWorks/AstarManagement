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
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-vue-next'

// Form validation schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().default(false)
})

type LoginForm = z.infer<typeof loginSchema>

// Component props
interface Props {
  /** Show remember me checkbox */
  showRememberMe?: boolean
  /** Disable form submission */
  disabled?: boolean
  /** Initial email value */
  initialEmail?: string
}

const props = withDefaults(defineProps<Props>(), {
  showRememberMe: true,
  disabled: false,
  initialEmail: ''
})

// Component emits
const emit = defineEmits<{
  /** Fired when form is submitted with valid data */
  submit: [credentials: LoginForm]
  /** Fired when user clicks forgot password link */
  forgotPassword: [email: string]
}>()

// Composables
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// Form setup
const { handleSubmit, defineField, errors, meta } = useForm({
  validationSchema: toTypedSchema(loginSchema),
  initialValues: {
    email: props.initialEmail || authStore.lastEmail || '',
    password: '',
    rememberMe: authStore.rememberMe || false
  }
})

// Form fields
const [email, emailAttrs] = defineField('email')
const [password, passwordAttrs] = defineField('password')
const [rememberMe, rememberMeAttrs] = defineField('rememberMe')

// Local state
const showPassword = ref(false)
const isSubmitting = ref(false)
const loginError = ref<string | null>(null)

// Computed
const isFormValid = computed(() => meta.value.valid && email.value && password.value)
const redirectUrl = computed(() => route.query.redirect as string || '/dashboard')
const sessionExpiredMessage = computed(() => 
  route.query.reason === 'session_expired' ? 'Your session has expired. Please log in again.' : null
)

// Methods
const onSubmit = handleSubmit(async (values) => {
  if (isSubmitting.value || props.disabled) return
  
  isSubmitting.value = true
  loginError.value = null
  
  try {
    await authStore.login(values)
    
    // Emit submit event for parent component
    emit('submit', values)
    
    // Check if 2FA is required
    if (authStore.pendingTwoFactor) {
      await router.push('/auth/verify-2fa')
    } else {
      // Successful login, redirect to intended page
      await router.push(redirectUrl.value)
    }
  } catch (error: any) {
    console.error('Login failed:', error)
    
    // Handle different error types
    if (error.code === 'RATE_LIMITED') {
      loginError.value = `Too many login attempts. Please try again in ${error.retryAfter} seconds.`
    } else if (error.code === 'INVALID_CREDENTIALS') {
      loginError.value = 'Invalid email or password. Please check your credentials and try again.'
    } else if (error.code === 'ACCOUNT_LOCKED') {
      loginError.value = 'Your account has been temporarily locked due to multiple failed login attempts.'
    } else if (error.code === 'NETWORK_ERROR') {
      loginError.value = 'Network connection failed. Please check your internet connection and try again.'
    } else {
      loginError.value = error.message || 'An unexpected error occurred. Please try again.'
    }
  } finally {
    isSubmitting.value = false
  }
})

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const handleForgotPassword = () => {
  emit('forgotPassword', email.value || '')
}

// Clear error when user starts typing
watch([email, password], () => {
  if (loginError.value) {
    loginError.value = null
  }
})

// Auto-focus email field on mount
onMounted(() => {
  nextTick(() => {
    const emailInput = document.getElementById('email')
    if (emailInput && !email.value) {
      emailInput.focus()
    }
  })
})
</script>

<template>
  <Card class="w-full max-w-md mx-auto">
    <CardHeader class="space-y-1">
      <CardTitle class="text-2xl font-bold text-center">
        Sign In
      </CardTitle>
      <CardDescription class="text-center">
        Enter your credentials to access your account
      </CardDescription>
    </CardHeader>
    
    <CardContent class="space-y-4">
      <!-- Session expired alert -->
      <Alert v-if="sessionExpiredMessage" variant="destructive" class="mb-4">
        <AlertCircle class="h-4 w-4" />
        <AlertDescription>
          {{ sessionExpiredMessage }}
        </AlertDescription>
      </Alert>
      
      <!-- Login error alert -->
      <Alert v-if="loginError" variant="destructive" class="mb-4">
        <AlertCircle class="h-4 w-4" />
        <AlertDescription>
          {{ loginError }}
        </AlertDescription>
      </Alert>
      
      <form @submit.prevent="onSubmit" class="space-y-4">
        <!-- Email field -->
        <div class="space-y-2">
          <Label for="email">Email Address</Label>
          <Input
            id="email"
            v-model="email"
            v-bind="emailAttrs"
            type="email"
            placeholder="Enter your email"
            autocomplete="email"
            :disabled="isSubmitting || disabled"
            :class="errors.email ? 'border-destructive' : ''"
            required
          />
          <p v-if="errors.email" class="text-sm text-destructive">
            {{ errors.email }}
          </p>
        </div>
        
        <!-- Password field -->
        <div class="space-y-2">
          <Label for="password">Password</Label>
          <div class="relative">
            <Input
              id="password"
              v-model="password"
              v-bind="passwordAttrs"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Enter your password"
              autocomplete="current-password"
              :disabled="isSubmitting || disabled"
              :class="errors.password ? 'border-destructive' : ''"
              class="pr-10"
              required
            />
            <button
              type="button"
              @click="togglePasswordVisibility"
              class="absolute inset-y-0 right-0 pr-3 flex items-center"
              :disabled="isSubmitting || disabled"
            >
              <Eye v-if="!showPassword" class="h-4 w-4 text-muted-foreground" />
              <EyeOff v-else class="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <p v-if="errors.password" class="text-sm text-destructive">
            {{ errors.password }}
          </p>
        </div>
        
        <!-- Remember me checkbox -->
        <div v-if="showRememberMe" class="flex items-center space-x-2">
          <Checkbox
            id="remember-me"
            v-model:checked="rememberMe"
            v-bind="rememberMeAttrs"
            :disabled="isSubmitting || disabled"
          />
          <Label for="remember-me" class="text-sm">
            Remember me for 30 days
          </Label>
        </div>
        
        <!-- Submit button -->
        <Button
          type="submit"
          class="w-full"
          :disabled="!isFormValid || isSubmitting || disabled"
        >
          <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
          <span v-if="isSubmitting">Signing In...</span>
          <span v-else>Sign In</span>
        </Button>
        
        <!-- Forgot password link -->
        <div class="text-center">
          <button
            type="button"
            @click="handleForgotPassword"
            class="text-sm text-primary hover:underline"
            :disabled="isSubmitting || disabled"
          >
            Forgot your password?
          </button>
        </div>
      </form>
    </CardContent>
  </Card>
</template>

<style scoped>
/* Additional styles for better UX */
.form-field-error {
  @apply border-destructive focus:border-destructive;
}

.password-toggle {
  @apply absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer;
}

.password-toggle:hover {
  @apply text-foreground;
}

.password-toggle:disabled {
  @apply cursor-not-allowed opacity-50;
}
</style>
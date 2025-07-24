<script setup lang="ts">
import AuthLayout from '@/components/auth/AuthLayout.vue'
import LoginForm from '@/components/auth/LoginForm.vue'
import type { LoginCredentials } from '@/types/auth'
import { useAuth } from '@/composables/useAuth'

// Meta and SEO
definePageMeta({
  layout: false,
  middleware: 'guest',
  requiresAuth: false
})

useHead({
  title: 'Sign In - Aster Management',
  meta: [
    { name: 'description', content: 'Sign in to your Aster Management account' },
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})

// Composables
const route = useRoute()
const router = useRouter()
const { initializeCSRF } = useAuth()

// State
const isLoading = ref(false)
const loginError = ref<string | null>(null)

// Computed
const initialEmail = computed(() => {
  const emailParam = route.query.email as string
  const authStore = useAuthStore()
  return emailParam || authStore.lastEmail || ''
})

const redirectUrl = computed(() => {
  const redirect = route.query.redirect as string
  return redirect && redirect.startsWith('/') ? redirect : '/dashboard'
})

const sessionExpiredMessage = computed(() => {
  return route.query.reason === 'session_expired' 
    ? 'Your session has expired. Please sign in again.'
    : null
})

// Methods
const handleLogin = async (credentials: LoginCredentials) => {
  isLoading.value = true
  loginError.value = null
  
  try {
    // LoginForm component handles the actual login through auth store
    // If we get here, login was successful
    console.log('Login successful, redirecting...')
  } catch (error: any) {
    console.error('Login error:', error)
    loginError.value = error.message || 'An unexpected error occurred'
  } finally {
    isLoading.value = false
  }
}

const handleForgotPassword = (email: string) => {
  router.push({
    path: '/forgot-password',
    query: { email }
  })
}

// Initialize CSRF protection on mount
onMounted(async () => {
  try {
    await initializeCSRF()
  } catch (error) {
    console.warn('Failed to initialize CSRF protection:', error)
  }
})

// Clear any existing errors when route changes
watch(() => route.fullPath, () => {
  loginError.value = null
})
</script>

<template>
  <AuthLayout
    title="Welcome Back"
    description="Sign in to your account"
    :show-pattern="true"
  >
    <!-- Session expired notification -->
    <div v-if="sessionExpiredMessage" class="mb-6">
      <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-yellow-800 dark:text-yellow-200">
              {{ sessionExpiredMessage }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Login Form -->
    <LoginForm
      :initial-email="initialEmail"
      :disabled="isLoading"
      @submit="handleLogin"
      @forgot-password="handleForgotPassword"
    />

    <!-- Additional help links -->
    <div class="mt-8 text-center space-y-2">
      <p class="text-sm text-muted-foreground">
        Don't have an account?
        <NuxtLink 
          to="/register" 
          class="text-primary hover:underline font-medium"
        >
          Contact your administrator
        </NuxtLink>
      </p>
      
      <div class="text-xs text-muted-foreground">
        <p>
          Having trouble signing in?
          <a 
            href="mailto:support@astermanagement.com" 
            class="text-primary hover:underline"
          >
            Contact Support
          </a>
        </p>
      </div>
    </div>

    <!-- Legal links -->
    <div class="mt-6 flex justify-center space-x-4 text-xs text-muted-foreground">
      <NuxtLink to="/privacy" class="hover:text-foreground">
        Privacy Policy
      </NuxtLink>
      <span>•</span>
      <NuxtLink to="/terms" class="hover:text-foreground">
        Terms of Service
      </NuxtLink>
    </div>
  </AuthLayout>
</template>

<style scoped>
/* Page-specific styles */
.login-page {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Animation for form appearance */
.login-form {
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .login-form {
    margin: 0 1rem;
  }
}

/* Focus states for accessibility */
.login-page:focus-within .login-form {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .login-page {
    background: #000000;
    color: #ffffff;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .login-form {
    animation: none;
  }
}
</style>
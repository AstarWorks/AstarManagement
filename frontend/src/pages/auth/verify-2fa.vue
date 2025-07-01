<script setup lang="ts">
import AuthLayout from '@/components/auth/AuthLayout.vue'
import TwoFactorAuth from '@/components/auth/TwoFactorAuth.vue'
import type { TwoFactorCredentials } from '@/types/auth'

// Meta and SEO
definePageMeta({
  layout: false,
  middleware: 'auth', // Requires partial auth (pendingTwoFactor)
  requiresAuth: false // Special case - partial auth
})

useHead({
  title: 'Two-Factor Authentication - Aster Management',
  meta: [
    { name: 'description', content: 'Complete two-factor authentication verification' },
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})

// Composables
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// State
const isLoading = ref(false)
const verificationError = ref<string | null>(null)

// Computed
const userEmail = computed(() => authStore.lastEmail || 'your email')

// Check if user should be on this page
onMounted(() => {
  // If user is fully authenticated, redirect to dashboard
  if (authStore.isAuthenticated && !authStore.pendingTwoFactor) {
    router.push('/dashboard')
    return
  }
  
  // If user is not in 2FA flow, redirect to login
  if (!authStore.pendingTwoFactor && !authStore.sessionId) {
    router.push('/login')
    return
  }
})

// Methods
const handleVerification = async (credentials: TwoFactorCredentials) => {
  isLoading.value = true
  verificationError.value = null
  
  try {
    // TwoFactorAuth component handles the verification through auth store
    console.log('2FA verification successful, redirecting...')
  } catch (error: any) {
    console.error('2FA verification error:', error)
    verificationError.value = error.message || 'Verification failed'
  } finally {
    isLoading.value = false
  }
}

const handleResendCode = () => {
  console.log('Resending 2FA code...')
  // This is handled by the TwoFactorAuth component
}

const handleCancel = async () => {
  // Logout and redirect to login
  await authStore.logout()
  router.push('/login')
}

// Auto-redirect if auth state changes
watch(() => authStore.isAuthenticated, (isAuthenticated) => {
  if (isAuthenticated && !authStore.pendingTwoFactor) {
    router.push('/dashboard')
  }
})

watch(() => authStore.pendingTwoFactor, (pending) => {
  if (!pending && !authStore.isAuthenticated) {
    router.push('/login')
  }
})
</script>

<template>
  <AuthLayout
    title="Two-Factor Authentication"
    description="Enter your verification code"
    :show-pattern="true"
    max-width="md"
  >
    <!-- Main 2FA component -->
    <TwoFactorAuth
      :email="userEmail"
      :disabled="isLoading"
      :show-trust-device="true"
      @submit="handleVerification"
      @resend-code="handleResendCode"
      @cancel="handleCancel"
    />

    <!-- Help information -->
    <div class="mt-8 space-y-4">
      <!-- Instructions -->
      <div class="bg-muted/50 border border-border rounded-lg p-4">
        <h3 class="font-medium text-sm mb-2">How to find your verification code:</h3>
        <ul class="text-sm text-muted-foreground space-y-1">
          <li>• Open your authenticator app (Google Authenticator, Authy, etc.)</li>
          <li>• Find the entry for "Aster Management"</li>
          <li>• Enter the 6-digit code displayed</li>
          <li>• The code refreshes every 30 seconds</li>
        </ul>
      </div>

      <!-- Backup options -->
      <div class="text-center text-sm text-muted-foreground">
        <p>
          Lost access to your authenticator?
          <a 
            href="mailto:support@astermanagement.com?subject=2FA Access Issue" 
            class="text-primary hover:underline"
          >
            Contact Support
          </a>
        </p>
      </div>
    </div>

    <!-- Security notice -->
    <div class="mt-6 text-center">
      <div class="inline-flex items-center space-x-2 text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-full">
        <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
        </svg>
        <span>Your session is secured with two-factor authentication</span>
      </div>
    </div>
  </AuthLayout>
</template>

<style scoped>
/* Page-specific animations */
.verify-2fa-enter-active {
  transition: all 0.3s ease-out;
}

.verify-2fa-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

/* Help section styling */
.help-section {
  @apply bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950;
  @apply border border-blue-200 dark:border-blue-800;
  @apply rounded-lg p-4;
}

/* Security notice animation */
.security-notice {
  @apply animate-pulse;
  animation-duration: 3s;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .help-section {
    @apply text-xs;
  }
  
  .security-notice {
    @apply text-xs px-2 py-1;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .help-section {
    @apply bg-white dark:bg-black border-black dark:border-white;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .verify-2fa-enter-active,
  .security-notice {
    animation: none;
    transition: none;
  }
}
</style>
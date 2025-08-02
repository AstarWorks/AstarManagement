<template>
  <div class="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 text-center">
      <!-- Error Icon & Title -->
      <div>
        <Icon name="lucide:shield-x" class="mx-auto h-16 w-16 text-destructive" />
        <h2 class="mt-6 text-3xl font-extrabold text-foreground">
          {{ $t('error.unauthorized.title') }}
        </h2>
        <p class="mt-2 text-sm text-muted-foreground">
          {{ $t(`error.unauthorized.reasons.${errorDetails.reason}`) }}
        </p>
      </div>

      <!-- Error Details Card -->
      <Alert variant="destructive" class="text-left">
        <Icon name="lucide:info" class="h-4 w-4" />
        <AlertTitle>{{ $t('error.unauthorized.details.title') }}</AlertTitle>
        <AlertDescription class="mt-2 space-y-2">
          <div v-if="errorDetails.reason">
            <span class="font-medium">{{ $t('error.unauthorized.details.reason') }}:</span>
            <span class="ml-2">{{ $t(`error.unauthorized.reasons.${errorDetails.reason}`) }}</span>
          </div>
          
          <div v-if="errorDetails.originalPath">
            <span class="font-medium">{{ $t('error.unauthorized.details.path') }}:</span>
            <span class="ml-2 font-mono text-xs">{{ errorDetails.originalPath }}</span>
          </div>
          
          <div v-if="errorDetails.required">
            <span class="font-medium">{{ $t('error.unauthorized.details.required') }}:</span>
            <div class="ml-2 mt-1 text-xs">
              <div v-if="errorDetails.required.permissions?.length">
                {{ $t('error.unauthorized.details.permissions') }}: {{ errorDetails.required.permissions.join(', ') }}
              </div>
              <div v-if="errorDetails.required.roles?.length">
                {{ $t('error.unauthorized.details.roles') }}: {{ errorDetails.required.roles.join(', ') }}
              </div>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      <!-- User Info (if authenticated) -->
      <Card v-if="authUser" class="p-4 text-left">
        <div class="text-sm space-y-2">
          <h4 class="font-medium">{{ $t('error.unauthorized.currentUser.title') }}</h4>
          <div class="text-muted-foreground">
            <div>{{ authUser.name }} ({{ authUser.email }})</div>
            <div>
              {{ $t('error.unauthorized.currentUser.roles') }}: 
              {{ userRoles.join(', ') || $t('common.none') }}
            </div>
            <div>
              {{ $t('error.unauthorized.currentUser.permissions') }}: 
              {{ userPermissions.join(', ') || $t('common.none') }}
            </div>
          </div>
        </div>
      </Card>

      <!-- Action Buttons -->
      <div class="space-y-3">
        <Button class="w-full" @click="goBack">
          {{ $t('error.unauthorized.actions.goBack') }}
        </Button>
        
        <Button variant="outline" class="w-full" @click="goToDashboard">
          {{ $t('error.unauthorized.actions.dashboard') }}
        </Button>

        <Button 
          v-if="!authUser" 
          variant="outline" 
          class="w-full" 
          @click="goToLogin"
        >
          {{ $t('error.unauthorized.actions.login') }}
        </Button>
      </div>

      <!-- Contact Support -->
      <div class="text-xs text-muted-foreground">
        <p>
          {{ $t('error.unauthorized.support.text') }}
          <a 
            :href="`mailto:${supportEmail}`" 
            class="text-primary hover:text-primary/80 underline"
          >
            {{ $t('error.unauthorized.support.contact') }}
          </a>
          {{ $t('error.unauthorized.support.suffix') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Alert, AlertTitle, AlertDescription } from '~/components/ui/alert'

// Page metadata
definePageMeta({
  layout: false,
  title: 'error.unauthorized.title'
})

// Types
interface ErrorDetails {
  reason: string
  originalPath?: string
  required?: {
    permissions?: string[]
    roles?: string[]
  }
}

// Composables
const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const config = useRuntimeConfig()

// Parse URL parameters using composable
const { errorDetails } = useUnauthorizedError({
  reason: route.query.reason as string,
  originalPath: route.query.path as string,
  requiredString: route.query.required as string
})

// Auth state
const authUser = computed(() => authStore.user)
const userRoles = computed(() => authStore.roles)
const userPermissions = computed(() => authStore.permissions)

// Support contact
const supportEmail = computed(() => config.public.supportEmail || 'admin@astellaw.co.jp')

// Navigation handlers
const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/dashboard')
  }
}

const goToDashboard = () => {
  router.push('/dashboard')
}

const goToLogin = () => {
  router.push({
    path: '/login',
    query: errorDetails.value.originalPath ? { redirect: errorDetails.value.originalPath } : {}
  })
}

// SEO and security
useHead({
  title: computed(() => `${t('error.unauthorized.title')} - ${t('app.name')}`),
  meta: [
    { name: 'description', content: computed(() => t('error.unauthorized.meta.description')) }
  ]
})

// Security audit logging
const { logUnauthorizedAccess } = useSecurityAudit()
onMounted(() => {
  logUnauthorizedAccess({
    user: authUser.value?.email || 'anonymous',
    reason: errorDetails.value.reason,
    originalPath: errorDetails.value.originalPath,
    required: errorDetails.value.required,
    userAgent: navigator.userAgent
  })
})
</script>
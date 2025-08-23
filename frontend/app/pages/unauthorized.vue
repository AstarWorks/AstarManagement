<template>
  <div class="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 text-center">
      <!-- Error Icon & Title -->
      <div>
        <Icon name="lucide:shield-x" class="mx-auto h-16 w-16 text-destructive" />
        <h2 class="mt-6 text-3xl font-extrabold text-foreground">
          {{ $t('modules.error.unauthorized.title') }}
        </h2>
        <p class="mt-2 text-sm text-muted-foreground">
          {{ $t(`error.unauthorized.reasons.${errorDetails.reason}`) }}
        </p>
      </div>

      <!-- Error Details Card -->
      <Alert variant="destructive" class="text-left">
        <Icon name="lucide:info" class="h-4 w-4" />
        <AlertTitle>{{ $t('modules.error.unauthorized.details.title') }}</AlertTitle>
        <AlertDescription class="mt-2 space-y-2">
          <div v-if="errorDetails.reason">
            <span class="font-medium">{{ formatLabelWithColon($t('modules.error.unauthorized.details.reason')) }}</span>
            <span class="ml-2">{{ $t(`error.unauthorized.reasons.${errorDetails.reason}`) }}</span>
          </div>
          
          <div v-if="errorDetails.originalPath">
            <span class="font-medium">{{ formatLabelWithColon($t('modules.error.unauthorized.details.path')) }}</span>
            <span class="ml-2 font-mono text-xs">{{ errorDetails.originalPath }}</span>
          </div>
          
          <div v-if="errorDetails.required.length">
            <span class="font-medium">{{ formatLabelWithColon($t('modules.error.unauthorized.details.required')) }}</span>
            <div class="ml-2 mt-1 text-xs">
              {{ errorDetails.required.join(', ') }}
            </div>
          </div>
        </AlertDescription>
      </Alert>

      <!-- User Info (if authenticated) -->
      <Card v-if="authUser" class="p-4 text-left">
        <div class="text-sm space-y-2">
          <h4 class="font-medium">{{ $t('modules.error.unauthorized.currentUser.title') }}</h4>
          <div class="text-muted-foreground">
            <div>{{ formatUserInfo(authUser) }}</div>
            <div>
              {{ formatLabelWithColon($t('modules.error.unauthorized.currentUser.roles')) }}
              {{ userRoles.join(', ') || $t('foundation.common.general.none') }}
            </div>
            <div>
              {{ formatLabelWithColon($t('modules.error.unauthorized.currentUser.permissions')) }}
              {{ userPermissions.join(', ') || $t('foundation.common.general.none') }}
            </div>
          </div>
        </div>
      </Card>

      <!-- Action Buttons -->
      <div class="space-y-3">
        <Button class="w-full" @click="goBack">
          {{ $t('modules.error.unauthorized.actions.goBack') }}
        </Button>
        
        <Button variant="outline" class="w-full" @click="goToDashboard">
          {{ $t('modules.error.unauthorized.actions.dashboard') }}
        </Button>

        <Button 
          v-if="!authUser" 
          variant="outline" 
          class="w-full" 
          @click="goToLogin"
        >
          {{ $t('modules.error.unauthorized.actions.login') }}
        </Button>
      </div>

      <!-- Contact Support -->
      <div class="text-xs text-muted-foreground">
        <p>
          {{ $t('modules.error.unauthorized.support.text') }}
          <a 
            :href="`mailto:${supportEmail}`" 
            class="text-primary hover:text-primary/80 underline"
          >
            {{ $t('modules.error.unauthorized.support.contact') }}
          </a>
          {{ $t('modules.error.unauthorized.support.suffix') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Alert, AlertTitle, AlertDescription } from '~/foundation/components/ui/alert'

// Page metadata
definePageMeta({
  auth: false,  // 認証不要ページ
  layout: false,
  title: 'error.unauthorized.title'
})

// Composables
const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const { data: session } = useAuth()
const { profile } = useUserProfile()
const config = useRuntimeConfig()

// Parse URL parameters
const errorDetails = computed(() => ({
  reason: route.query.reason as string || 'no_permission',
  originalPath: route.query.path as string,
  required: route.query.required ? JSON.parse(route.query.required as string) : undefined
}))

// Auth state
const authUser = computed(() => {
  if (!session.value) return null
  return ('user' in session.value) ? session.value.user : null
})
const userRoles = computed(() => profile.value?.roles || [])
const userPermissions = computed(() => profile.value?.permissions || [])

// Support contact
const supportEmail = computed(() => config.public.supportEmail || 'admin@astellaw.co.jp')

// Helper functions for formatting
const formatLabelWithColon = (label: string): string => `${label}:`

const formatUserInfo = (user: unknown): string => {
  const name = (user && typeof user === 'object' && 'name' in user) 
    ? user.name 
    : t('foundation.common.general.unknown')
  const email = (user && typeof user === 'object' && 'email' in user) 
    ? user.email 
    : t('foundation.messages.info.unknownEmail')
  return `${name} (${email})`
}

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
    path: '/signin',
    query: errorDetails.value.originalPath ? { redirect: errorDetails.value.originalPath } : {}
  })
}

// SEO and security
useHead({
  title: computed(() => `${t('modules.error.unauthorized.title')} - ${t('foundation.common.app.name')}`),
  meta: [
    { name: 'description', content: computed(() => t('modules.error.unauthorized.title')) }
  ]
})

// Security audit logging
onMounted(() => {
  console.warn('Unauthorized access attempt:', {
    user: (authUser.value && typeof authUser.value === 'object' && 'email' in authUser.value) ? authUser.value.email : 'anonymous',
    reason: errorDetails.value.reason,
    originalPath: errorDetails.value.originalPath,
    required: errorDetails.value.required,
    userAgent: navigator.userAgent
  })
})
</script>
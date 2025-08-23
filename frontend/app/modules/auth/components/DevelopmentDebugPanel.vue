<!--
  Development Debug Panel for Authentication
  Provides quick credential filling for development purposes
-->
<template>
  <div v-if="isDevelopment" class="space-y-3">
    <Separator class="my-4"/>

    <div class="p-3 bg-muted/50 rounded-lg border border-dashed">
      <div class="flex items-center gap-2 mb-3">
        <Badge variant="secondary" class="text-xs">
          {{ $t('modules.auth.login.debug.environmentLabel') }}
        </Badge>
        <Icon name="lucide:code" class="h-3 w-3 text-muted-foreground"/>
      </div>

      <p class="text-xs text-muted-foreground mb-3">
        {{ $t('modules.auth.login.debug.description') }}
      </p>

      <div class="flex flex-wrap gap-2">
        <Button
            v-for="credential in debugCredentials"
            :key="credential.key"
            type="button"
            variant="outline"
            size="sm"
            class="text-xs h-8"
            :disabled="isLoading"
            @click="fillCredentials(credential)"
        >
          <Icon :name="credential.icon" class="h-3 w-3 mr-1"/>
          {{ $t(credential.labelKey) }}
        </Button>
      </div>

      <!-- Advanced Debug Info (collapsed by default) -->
      <Collapsible v-if="showAdvancedDebug">
        <CollapsibleTrigger as-child>
          <Button variant="ghost" size="sm" class="text-xs mt-2 h-6 p-1">
            <Icon name="lucide:chevron-down" class="h-3 w-3 mr-1"/>
            {{ $t('modules.auth.login.debug.advancedOptions') }}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent class="mt-2 p-2 bg-background rounded border text-xs">
          <div class="space-y-1 text-muted-foreground">
            <p>{{ $t('modules.auth.login.debug.environment') }}: {{ currentEnvironment }}</p>
            <p>{{ $t('modules.auth.login.debug.apiEndpoint') }}: {{ apiEndpoint }}</p>
            <p>{{ $t('modules.auth.login.debug.buildTime') }}: {{ buildTime }}</p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue'
// Types and config are now handled in the component directly
import {Badge} from '~/foundation/components/ui/badge'
import {Button} from '~/foundation/components/ui/button/index'
import {Separator} from '~/foundation/components/ui/separator'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '~/foundation/components/ui/collapsible'

interface ILoginCredentials {
  email: string
  password: string
}

interface DebugCredential {
  key: string
  labelKey: string
  icon: string
  credentials: ILoginCredentials
}

interface Props {
  isLoading?: boolean
  showAdvancedDebug?: boolean
}

interface Emits {
  (e: 'fillCredentials', credentials: ILoginCredentials): void
}

withDefaults(defineProps<Props>(), {
  isLoading: false,
  showAdvancedDebug: false
})

const emit = defineEmits<Emits>()

// Environment detection using VueUse-style approach
const isDevelopment = computed(() => {
  return process.env.NODE_ENV === 'development' ||
      import.meta.env.DEV ||
      import.meta.env.MODE === 'development'
})

// Debug credentials configuration
const debugCredentials = computed<DebugCredential[]>(() => [
  {
    key: 'admin',
    labelKey: 'modules.auth.login.debug.adminUser',
    icon: 'lucide:shield',
    credentials: {email: 'admin@example.com', password: 'admin123'}
  },
  {
    key: 'user',
    labelKey: 'modules.auth.login.debug.demoUser',
    icon: 'lucide:user',
    credentials: {email: 'test@example.com', password: 'password123'}
  }
])

// Environment information for advanced debug
const currentEnvironment = computed(() => import.meta.env.MODE || 'development')
const apiEndpoint = computed(() => useRuntimeConfig().public.apiBaseUrl)
const {locale} = useI18n()
const buildTime = computed(() => new Date().toLocaleString(locale.value))

// Fill credentials handler
const fillCredentials = (credential: DebugCredential) => {
  emit('fillCredentials', credential.credentials)
}

// Analytics for debug usage (development only)
if (isDevelopment.value) {
  // Track debug panel usage for development insights
  console.log('[Debug Panel] Initialized with', debugCredentials.value.length, 'credential options')
}
</script>
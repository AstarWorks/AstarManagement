<template>
  <div class="w-full max-w-md mx-auto space-y-6">
    <!-- ヘッダー -->
    <AuthFormHeader />

    <!-- ログインフォーム -->
    <Card class="p-6">
      <form class="space-y-4" autocomplete="on" @submit="onSubmit">
        <!-- メールアドレス -->
        <FormField v-slot="{ componentField }" name="email">
          <FormItem>
            <FormLabel for="email">{{ $t('auth.login.email.label') }}</FormLabel>
            <FormControl>
              <Input
                id="email"
                v-bind="componentField"
                type="email"
                :placeholder="$t('auth.login.email.placeholder')"
                autocomplete="email"
                :disabled="isLoading"
                class="w-full"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <!-- パスワード -->
        <PasswordInputField
          name="password"
          :label="$t('auth.login.password.label')"
          :placeholder="$t('auth.login.password.placeholder')"
          :disabled="isLoading"
        />

        <!-- Remember Me -->
        <FormField v-slot="{ componentField }" name="rememberMe">
          <FormItem>
            <div class="flex items-center space-x-2">
              <FormControl>
                <Checkbox
                  id="rememberMe"
                  v-bind="componentField"
                  :disabled="isLoading"
                />
              </FormControl>
              <FormLabel for="rememberMe" class="text-sm font-normal">
                {{ $t('auth.login.rememberMe') }}
              </FormLabel>
            </div>
          </FormItem>
        </FormField>

        <!-- エラーメッセージ -->
        <Alert v-if="authError" variant="destructive">
          <Icon name="lucide:alert-circle" class="h-4 w-4" />
          <AlertDescription>{{ authError }}</AlertDescription>
        </Alert>

        <!-- ログインボタン -->
        <Button
          type="submit"
          class="w-full"
          :disabled="isLoading || !isValid"
        >
          <Icon
            v-if="isLoading"
            name="lucide:loader-2"
            class="mr-2 h-4 w-4 animate-spin"
          />
          {{ isLoading ? $t('auth.login.loading') : $t('auth.login.submit') }}
        </Button>

        <!-- デバッグ用自動フィル（開発環境のみ） -->
        <DevelopmentDebugPanel
          v-if="isDevelopment"
          :is-loading="isLoading"
          @fill-credentials="handleFillCredentials"
        />

        <!-- パスワードリセットリンク -->
        <div class="text-center">
          <Button
            variant="link"
            class="text-sm text-blue-600 hover:text-blue-500"
            :disabled="isLoading"
            @click="$emit('forgotPassword')"
          >
            {{ $t('auth.login.forgotPassword') }}
          </Button>
        </div>
      </form>
    </Card>

    <!-- フッター -->
    <AuthFormFooter @privacy-click="$emit('privacyClick')" @terms-click="$emit('termsClick')" />
  </div>
</template>

<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { createLoginSchema } from '~/schemas/auth'
import type { ILoginCredentials } from '~/types/auth'
import { Checkbox } from '~/components/ui/checkbox'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Alert, AlertDescription } from '~/components/ui/alert'
import AuthFormHeader from '~/components/auth/AuthFormHeader.vue'
import AuthFormFooter from '~/components/auth/AuthFormFooter.vue'
import PasswordInputField from '~/components/ui/PasswordInputField.vue'
import DevelopmentDebugPanel from '~/components/auth/DevelopmentDebugPanel.vue'

// Props
interface Props {
  isLoading?: boolean
  authError?: string
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  authError: '',
})

// Emits
interface Emits {
  (e: 'submit', credentials: ILoginCredentials): void
  (e: 'forgotPassword'): void
  (e: 'privacyClick'): void
  (e: 'termsClick'): void
}

const emit = defineEmits<Emits>()

// Environment detection
const isDevelopment = computed(() => {
  return process.env.NODE_ENV === 'development' || import.meta.env.DEV
})

// Simple form validation using vee-validate
const { handleSubmit, isSubmitting } = useForm({
  validationSchema: toTypedSchema(createLoginSchema())
})

// Form validation state
const isValid = ref(false)

// Form submission handler
const onSubmit = handleSubmit((values) => {
  const credentials: ILoginCredentials = {
    email: values.email,
    password: values.password,
    rememberMe: values.rememberMe || false
  }
  emit('submit', credentials)
})

// Debug credentials handler
const handleFillCredentials = (credentials: ILoginCredentials) => {
  // This would typically set form values, but keeping it simple for demo
  emit('submit', credentials)
}

// Watch for form validity (simplified)
watchEffect(() => {
  // Simple validity check - would use actual form state in real implementation
  isValid.value = true
})
</script>


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
            <FormLabel for="email">{{ $t('modules.auth.login.fields.email.label') }}</FormLabel>
            <FormControl>
              <Input id="email" v-bind="componentField" type="email"
                :placeholder="$t('modules.auth.login.fields.email.placeholder')" autocomplete="email"
                :disabled="isLoading" class="w-full" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <!-- パスワード -->
        <PasswordInputField name="password" :label="$t('modules.auth.login.fields.password.label')"
          :placeholder="$t('modules.auth.login.fields.password.placeholder')" :disabled="isLoading" />

        <!-- Remember Me -->
        <FormField v-slot="{ componentField }" name="rememberMe">
          <FormItem>
            <div class="flex items-center space-x-2">
              <FormControl>
                <Checkbox id="rememberMe" v-bind="componentField" :disabled="isLoading" />
              </FormControl>
              <FormLabel for="rememberMe" class="text-sm font-normal">
                {{ $t('modules.auth.login.fields.rememberMe.label') }}
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
        <Button type="submit" class="w-full" :disabled="isLoading || !isValid">
          <Icon v-if="isLoading" name="lucide:loader-2" class="mr-2 h-4 w-4 animate-spin" />
          {{ isLoading ? $t('modules.auth.login.actions.loading') : $t('modules.auth.login.actions.submit') }}
        </Button>

        <!-- デバッグ用自動フィル（開発環境のみ） -->
        <DevelopmentDebugPanel v-if="isDevelopment" :is-loading="isLoading" @fill-credentials="handleFillCredentials" />

        <!-- パスワードリセットリンク -->
        <div class="text-center">
          <Button variant="link" class="text-sm text-blue-600 hover:text-blue-500" :disabled="isLoading"
            @click="$emit('forgotPassword')">
            {{ $t('modules.auth.login.actions.forgotPassword') }}
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
import { useForm } from 'vee-validate'
import { Checkbox } from '~/foundation/components/ui/checkbox'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '~/foundation/components/ui/form'
import { Input } from '~/foundation/components/ui/input'
import { Button } from '~/foundation/components/ui/button'
import { Card } from '~/foundation/components/ui/card'
import { Alert, AlertDescription } from '~/foundation/components/ui/alert'
import AuthFormFooter from "~/modules/auth/components/AuthFormFooter.vue";
import DevelopmentDebugPanel from "~/modules/auth/components/DevelopmentDebugPanel.vue";
import { PasswordInputField } from "~/foundation/components/ui/password-input";
import { createLoginSchema } from "~/utils/auth-validation";
import AuthFormHeader from "~/modules/auth/components/AuthFormHeader.vue";

// Props
interface Props {
  isLoading?: boolean
  authError?: string
}

withDefaults(defineProps<Props>(), {
  isLoading: false,
  authError: '',
})

// Emits
interface Emits {
  (e: 'submit', credentials: { email: string; password: string; rememberMe?: boolean }): void
  (e: 'forgotPassword' | 'privacyClick' | 'termsClick'): void
}

const emit = defineEmits<Emits>()

// Environment detection
const isDevelopment = computed(() => {
  return process.env.NODE_ENV === 'development' || import.meta.env.DEV
})

// Get i18n translation function
const { t } = useI18n()

// Simple form validation using vee-validate
const { handleSubmit, isSubmitting: _isSubmitting } = useForm({
  validationSchema: toTypedSchema(createLoginSchema(t))
})

// Form validation state
const isValid = ref(false)

// Form submission handler
const onSubmit = handleSubmit((values: { email: string; password: string; rememberMe?: boolean }) => {
  const credentials = {
    email: values.email,
    password: values.password,
    rememberMe: values.rememberMe || false
  }
  emit('submit', credentials)
})

// Debug credentials handler
const handleFillCredentials = (credentials: { email: string; password: string; rememberMe?: boolean }) => {
  // This would typically set form values, but keeping it simple for demo
  emit('submit', credentials)
}

// Watch for form validity (simplified)
watchEffect(() => {
  // Simple validity check - would use actual form state in real implementation
  isValid.value = true
})
</script>

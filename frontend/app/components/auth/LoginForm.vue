<template>
  <div class="w-full max-w-md mx-auto space-y-6">
    <!-- ヘッダー -->
    <div class="text-center space-y-2">
      <h1 class="text-2xl font-bold text-gray-900">
        Astar Management
      </h1>
      <p class="text-sm text-gray-600">
        法律事務所業務管理システム
      </p>
    </div>

    <!-- ログインフォーム -->
    <Card class="p-6">
      <Form class="space-y-4" autocomplete="on" @submit="onSubmit">
        <!-- メールアドレス -->
        <FormField v-slot="{ componentField }" name="email">
          <FormItem>
            <FormLabel for="email">メールアドレス</FormLabel>
            <FormControl>
              <Input
                  id="email"
                  v-bind="componentField"
                  type="email"
                  placeholder="example@lawfirm.com"
                  autocomplete="email"
                  :disabled="isLoading"
                  class="w-full"
              />
            </FormControl>
            <FormMessage/>
          </FormItem>
        </FormField>

        <!-- パスワード -->
        <FormField v-slot="{ componentField }" name="password">
          <FormItem>
            <FormLabel for="password">パスワード</FormLabel>
            <FormControl>
              <div class="relative">
                <Input
                    id="password"
                    v-bind="componentField"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="パスワードを入力"
                    autocomplete="current-password"
                    :disabled="isLoading"
                    class="w-full pr-10"
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    class="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    :disabled="isLoading"
                    @click="togglePasswordVisibility"
                >
                  <Icon
                      :name="showPassword ? 'lucide:eye-off' : 'lucide:eye'"
                      class="h-4 w-4 text-gray-500"
                  />
                  <span class="sr-only">
                    {{ showPassword ? 'パスワードを隠す' : 'パスワードを表示' }}
                  </span>
                </Button>
              </div>
            </FormControl>
            <FormMessage/>
          </FormItem>
        </FormField>

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
                ログイン状態を保持する
              </FormLabel>
            </div>
          </FormItem>
        </FormField>

        <!-- エラーメッセージ -->
        <div v-if="authError" class="p-3 bg-red-50 border border-red-200 rounded-md">
          <div class="flex items-center">
            <Icon name="lucide:alert-circle" class="h-4 w-4 text-red-500 mr-2"/>
            <p class="text-sm text-red-700">{{ authError }}</p>
          </div>
        </div>

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
          {{ isLoading ? 'ログイン中...' : 'ログイン' }}
        </Button>

        <!-- デバッグ用自動フィル（開発環境のみ） -->
        <div v-if="isDevelopment" class="border-t pt-4 mt-4">
          <p class="text-xs text-gray-500 mb-2">開発用デバッグ機能</p>
          <div class="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              class="text-xs"
              @click="fillDemoCredentials"
            >
              デモログイン
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              class="text-xs"
              @click="fill2FACredentials"
            >
              2FA有効ユーザー
            </Button>
          </div>
        </div>

        <!-- パスワードリセットリンク -->
        <div class="text-center">
          <Button
              variant="link"
              class="text-sm text-blue-600 hover:text-blue-500"
              :disabled="isLoading"
              @click="$emit('forgotPassword')"
          >
            パスワードをお忘れですか？
          </Button>
        </div>
      </Form>
    </Card>

    <!-- フッター -->
    <div class="text-center text-xs text-gray-500">
      <p>&copy; 2025 Astar Management. All rights reserved.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import {useForm} from 'vee-validate'
import {toTypedSchema} from '@vee-validate/zod'
import {loginSchema} from '~/schemas/auth'
import type {LoginCredentials} from '~/types/auth'
import {Checkbox} from '~/components/ui/checkbox'
import {Form, FormField, FormItem, FormLabel, FormControl, FormMessage} from '~/components/ui/form'
import {Input} from '~/components/ui/input'
import {Button} from '~/components/ui/button'
import {Card} from '~/components/ui/card'

// Props
interface Props {
  isLoading?: boolean
  authError?: string
}

const _props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  authError: '',
})

// Emits
interface Emits {
  submit: [credentials: LoginCredentials]
  forgotPassword: []
}

const emit = defineEmits<Emits>()

// Form handling with VeeValidate + Zod
const form = useForm({
  validationSchema: toTypedSchema(loginSchema),
  initialValues: {
    email: '',
    password: '',
    rememberMe: false,
  },
})

// Local state
const showPassword = ref(false)

// Development environment check
const isDevelopment = computed(() => {
  return process.env.NODE_ENV === 'development' || 
         import.meta.env.DEV
})

// Computed
const isValid = computed(() => form.meta.value.valid)

// Methods
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

// Debug methods for development  
const fillDemoCredentials = () => {
  form.setValues({
    email: 'tanaka@astellaw.co.jp',
    password: 'SecurePass123!',
    rememberMe: false
  })
}

const fill2FACredentials = () => {
  form.setValues({
    email: 'sato@astellaw.co.jp',
    password: 'SecurePass123!',
    rememberMe: false
  })
}

// Type-safe submission handler
const onSubmit = form.handleSubmit((values) => {
  emit('submit', {
    email: values.email,
    password: values.password,
    rememberMe: values.rememberMe || false,
  })
})


// Focus on email field when component mounts
onMounted(() => {
  const emailInput = document.getElementById('email')
  if (emailInput) {
    emailInput.focus()
  }
})
</script>

<style scoped>
/* フォーカス時のスタイル調整 */
.form-input:focus {
  outline: 2px solid #3b82f6;
  border-color: transparent;
}

/* ボタンホバー効果 */
.form-button:hover:not(:disabled) {
  background-color: #1d4ed8;
}

/* ローディング状態のボタン */
.form-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
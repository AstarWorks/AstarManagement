# 認証機能 - Frontend Components

## コンポーネント階層

```
auth/
├── LoginForm.vue              # ログインフォーム
├── RegisterForm.vue           # 新規登録フォーム
├── SetupWizard.vue           # 初期セットアップウィザード
├── ForgotPasswordForm.vue    # パスワードリセット
├── ResetPasswordForm.vue     # パスワード再設定
├── AuthLayout.vue            # 認証画面レイアウト
└── components/
    ├── SocialLoginButtons.vue # ソーシャルログインボタン
    ├── PasswordStrength.vue  # パスワード強度表示
    ├── TwoFactorInput.vue    # 2FA入力
    └── SessionManager.vue    # セッション管理

guards/
├── AuthGuard.vue             # 認証チェック
├── RoleGuard.vue             # ロールチェック
└── PermissionGuard.vue      # 権限チェック
```

## 主要コンポーネント

### LoginForm.vue
```vue
<template>
  <Card class="w-full max-w-md">
    <CardHeader>
      <CardTitle>{{ $t('auth.login.title') }}</CardTitle>
      <CardDescription>{{ $t('auth.login.description') }}</CardDescription>
    </CardHeader>
    
    <CardContent>
      <form @submit.prevent="handleLogin" class="space-y-4">
        <!-- Email -->
        <div>
          <Label for="email">{{ $t('auth.login.email') }}</Label>
          <Input
            id="email"
            v-model="credentials.email"
            type="email"
            :placeholder="$t('auth.login.emailPlaceholder')"
            :error="errors.email"
            required
          />
          <ErrorMessage v-if="errors.email" :message="errors.email" />
        </div>
        
        <!-- Password -->
        <div>
          <Label for="password">{{ $t('auth.login.password') }}</Label>
          <Input
            id="password"
            v-model="credentials.password"
            type="password"
            :placeholder="$t('auth.login.passwordPlaceholder')"
            :error="errors.password"
            required
          />
          <ErrorMessage v-if="errors.password" :message="errors.password" />
        </div>
        
        <!-- Remember Me & Forgot Password -->
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <Checkbox
              id="remember"
              v-model="credentials.rememberMe"
            />
            <Label for="remember" class="text-sm font-normal">
              {{ $t('auth.login.rememberMe') }}
            </Label>
          </div>
          
          <NuxtLink
            to="/auth/forgot-password"
            class="text-sm text-primary hover:underline"
          >
            {{ $t('auth.login.forgotPassword') }}
          </NuxtLink>
        </div>
        
        <!-- Submit Button -->
        <Button
          type="submit"
          class="w-full"
          :loading="loading"
          :disabled="loading"
        >
          {{ $t('auth.login.submit') }}
        </Button>
        
        <!-- Error Message -->
        <Alert v-if="error" variant="destructive">
          <AlertDescription>{{ error }}</AlertDescription>
        </Alert>
      </form>
      
      <!-- Social Login -->
      <div class="mt-6">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <span class="w-full border-t" />
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-background px-2 text-muted-foreground">
              {{ $t('auth.login.orContinueWith') }}
            </span>
          </div>
        </div>
        
        <SocialLoginButtons class="mt-4" />
      </div>
    </CardContent>
    
    <CardFooter class="flex justify-center">
      <p class="text-sm text-muted-foreground">
        {{ $t('auth.login.noAccount') }}
        <NuxtLink
          to="/auth/register"
          class="text-primary hover:underline"
        >
          {{ $t('auth.login.signUp') }}
        </NuxtLink>
      </p>
    </CardFooter>
  </Card>
</template>

<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'
import { validateEmail, validatePassword } from '~/utils/auth-validation'

const { login } = useAuth()
const router = useRouter()

const credentials = reactive({
  email: '',
  password: '',
  rememberMe: false
})

const errors = reactive({
  email: '',
  password: ''
})

const loading = ref(false)
const error = ref('')

async function handleLogin() {
  // バリデーション
  errors.email = validateEmail(credentials.email)
  errors.password = validatePassword(credentials.password)
  
  if (errors.email || errors.password) return
  
  loading.value = true
  error.value = ''
  
  try {
    await login(credentials)
    await router.push('/dashboard')
  } catch (e) {
    error.value = e.message || 'ログインに失敗しました'
  } finally {
    loading.value = false
  }
}
</script>
```

### SetupWizard.vue
```vue
<template>
  <div class="setup-wizard">
    <Stepper v-model="currentStep" :steps="steps">
      <!-- Step 1: Admin Account -->
      <StepperPanel :step="1">
        <Card>
          <CardHeader>
            <CardTitle>{{ $t('setup.admin.title') }}</CardTitle>
            <CardDescription>{{ $t('setup.admin.description') }}</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div>
                <Label>{{ $t('setup.admin.email') }}</Label>
                <Input
                  v-model="setupData.admin.email"
                  type="email"
                  required
                />
              </div>
              
              <div>
                <Label>{{ $t('setup.admin.name') }}</Label>
                <Input
                  v-model="setupData.admin.name"
                  required
                />
              </div>
              
              <div>
                <Label>{{ $t('setup.admin.password') }}</Label>
                <Input
                  v-model="setupData.admin.password"
                  type="password"
                  required
                />
                <PasswordStrength :password="setupData.admin.password" />
              </div>
            </div>
          </CardContent>
        </Card>
      </StepperPanel>
      
      <!-- Step 2: Workspace -->
      <StepperPanel :step="2">
        <Card>
          <CardHeader>
            <CardTitle>{{ $t('setup.workspace.title') }}</CardTitle>
            <CardDescription>{{ $t('setup.workspace.description') }}</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div>
                <Label>{{ $t('setup.workspace.name') }}</Label>
                <Input
                  v-model="setupData.workspace.name"
                  required
                />
              </div>
              
              <div>
                <Label>{{ $t('setup.workspace.description') }}</Label>
                <Textarea
                  v-model="setupData.workspace.description"
                  rows="3"
                />
              </div>
              
              <div>
                <Label>{{ $t('setup.workspace.industry') }}</Label>
                <Select v-model="setupData.workspace.industry">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="legal">{{ $t('industries.legal') }}</SelectItem>
                    <SelectItem value="consulting">{{ $t('industries.consulting') }}</SelectItem>
                    <SelectItem value="other">{{ $t('industries.other') }}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </StepperPanel>
      
      <!-- Step 3: Confirmation -->
      <StepperPanel :step="3">
        <Card>
          <CardHeader>
            <CardTitle>{{ $t('setup.confirm.title') }}</CardTitle>
            <CardDescription>{{ $t('setup.confirm.description') }}</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <Alert>
                <AlertDescription>
                  <strong>{{ $t('setup.confirm.admin') }}:</strong> {{ setupData.admin.email }}
                </AlertDescription>
              </Alert>
              
              <Alert>
                <AlertDescription>
                  <strong>{{ $t('setup.confirm.workspace') }}:</strong> {{ setupData.workspace.name }}
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              @click="completeSetup"
              :loading="loading"
              class="w-full"
            >
              {{ $t('setup.confirm.complete') }}
            </Button>
          </CardFooter>
        </Card>
      </StepperPanel>
    </Stepper>
  </div>
</template>

<script setup lang="ts">
const currentStep = ref(1)
const loading = ref(false)

const steps = [
  { title: '管理者アカウント', description: '初期管理者の設定' },
  { title: 'ワークスペース', description: '組織情報の設定' },
  { title: '確認', description: '設定内容の確認' }
]

const setupData = reactive({
  admin: {
    email: '',
    name: '',
    password: ''
  },
  workspace: {
    name: '',
    description: '',
    industry: ''
  }
})

async function completeSetup() {
  loading.value = true
  try {
    const response = await $fetch('/api/v1/auth/setup', {
      method: 'POST',
      body: setupData
    })
    
    // 自動ログイン
    await navigateTo('/dashboard')
  } finally {
    loading.value = false
  }
}
</script>
```

### AuthGuard.vue
```vue
<template>
  <div>
    <slot v-if="isAuthenticated" />
    <div v-else class="flex items-center justify-center min-h-screen">
      <Card class="w-96">
        <CardContent class="pt-6">
          <Alert variant="warning">
            <AlertDescription>
              {{ $t('auth.guard.loginRequired') }}
            </AlertDescription>
          </Alert>
          <Button
            @click="redirectToLogin"
            class="w-full mt-4"
          >
            {{ $t('auth.guard.goToLogin') }}
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

const { isAuthenticated } = useAuth()
const router = useRouter()
const route = useRoute()

function redirectToLogin() {
  router.push({
    path: '/auth/login',
    query: { redirect: route.fullPath }
  })
}

// 認証状態の監視
watch(isAuthenticated, (value) => {
  if (!value) {
    redirectToLogin()
  }
})
</script>
```
# 認証機能 - Frontend Views

## ページ構成

### /auth/login
ログインページ

```vue
<!-- pages/auth/login.vue -->
<template>
  <AuthLayout>
    <div class="flex min-h-screen items-center justify-center">
      <div class="w-full max-w-md space-y-8">
        <!-- ロゴ -->
        <div class="text-center">
          <Logo class="mx-auto h-12 w-auto" />
          <h2 class="mt-6 text-3xl font-bold">
            {{ $t('auth.login.welcome') }}
          </h2>
          <p class="mt-2 text-sm text-muted-foreground">
            {{ $t('auth.login.subtitle') }}
          </p>
        </div>
        
        <!-- ログインフォーム -->
        <LoginForm @success="handleLoginSuccess" />
        
        <!-- デモアカウント情報（開発環境のみ） -->
        <DemoAccountInfo v-if="isDevelopment" />
      </div>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  auth: false
})

const router = useRouter()
const route = useRoute()

const isDevelopment = process.env.NODE_ENV === 'development'

async function handleLoginSuccess() {
  const redirect = route.query.redirect as string || '/dashboard'
  await router.push(redirect)
}
</script>
```

### /auth/register
新規登録ページ

```vue
<!-- pages/auth/register.vue -->
<template>
  <AuthLayout>
    <div class="flex min-h-screen items-center justify-center">
      <div class="w-full max-w-md space-y-8">
        <!-- ヘッダー -->
        <div class="text-center">
          <Logo class="mx-auto h-12 w-auto" />
          <h2 class="mt-6 text-3xl font-bold">
            {{ $t('auth.register.createAccount') }}
          </h2>
          <p class="mt-2 text-sm text-muted-foreground">
            {{ $t('auth.register.subtitle') }}
          </p>
        </div>
        
        <!-- 登録フォーム -->
        <RegisterForm @success="handleRegisterSuccess" />
        
        <!-- 利用規約 -->
        <div class="text-center text-xs text-muted-foreground">
          {{ $t('auth.register.terms.prefix') }}
          <NuxtLink to="/terms" class="text-primary hover:underline">
            {{ $t('auth.register.terms.link') }}
          </NuxtLink>
          {{ $t('auth.register.terms.suffix') }}
        </div>
      </div>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  auth: false
})

const router = useRouter()

async function handleRegisterSuccess() {
  await router.push('/onboarding')
}
</script>
```

### /auth/setup
初期セットアップページ

```vue
<!-- pages/auth/setup.vue -->
<template>
  <div class="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
    <div class="container mx-auto py-10">
      <!-- ヘッダー -->
      <div class="text-center mb-10">
        <Logo class="mx-auto h-16 w-auto mb-4" />
        <h1 class="text-4xl font-bold">
          {{ $t('setup.title') }}
        </h1>
        <p class="mt-2 text-lg text-muted-foreground">
          {{ $t('setup.subtitle') }}
        </p>
      </div>
      
      <!-- セットアップウィザード -->
      <SetupWizard @complete="handleSetupComplete" />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
  auth: false
})

// セットアップ済みチェック
const { data: status } = await useFetch('/api/v1/auth/setup/status')

if (status.value?.isSetupComplete) {
  await navigateTo('/auth/login')
}

async function handleSetupComplete() {
  await navigateTo('/dashboard')
}
</script>
```

### /auth/forgot-password
パスワードリセット要求ページ

```vue
<!-- pages/auth/forgot-password.vue -->
<template>
  <AuthLayout>
    <div class="flex min-h-screen items-center justify-center">
      <Card class="w-full max-w-md">
        <CardHeader>
          <CardTitle>{{ $t('auth.forgotPassword.title') }}</CardTitle>
          <CardDescription>
            {{ $t('auth.forgotPassword.description') }}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form @submit.prevent="handleSubmit">
            <div class="space-y-4">
              <div>
                <Label for="email">{{ $t('auth.forgotPassword.email') }}</Label>
                <Input
                  id="email"
                  v-model="email"
                  type="email"
                  required
                  :placeholder="$t('auth.forgotPassword.emailPlaceholder')"
                />
              </div>
              
              <Button type="submit" class="w-full" :loading="loading">
                {{ $t('auth.forgotPassword.submit') }}
              </Button>
            </div>
          </form>
          
          <!-- 成功メッセージ -->
          <Alert v-if="success" class="mt-4" variant="success">
            <AlertDescription>
              {{ $t('auth.forgotPassword.success') }}
            </AlertDescription>
          </Alert>
          
          <!-- エラーメッセージ -->
          <Alert v-if="error" class="mt-4" variant="destructive">
            <AlertDescription>{{ error }}</AlertDescription>
          </Alert>
        </CardContent>
        
        <CardFooter>
          <NuxtLink
            to="/auth/login"
            class="text-sm text-primary hover:underline"
          >
            {{ $t('auth.forgotPassword.backToLogin') }}
          </NuxtLink>
        </CardFooter>
      </Card>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  auth: false
})

const email = ref('')
const loading = ref(false)
const success = ref(false)
const error = ref('')

async function handleSubmit() {
  loading.value = true
  error.value = ''
  
  try {
    await $fetch('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: { email: email.value }
    })
    
    success.value = true
  } catch (e) {
    error.value = e.data?.message || 'リセットメールの送信に失敗しました'
  } finally {
    loading.value = false
  }
}
</script>
```

### /auth/reset-password
パスワード再設定ページ

```vue
<!-- pages/auth/reset-password.vue -->
<template>
  <AuthLayout>
    <div class="flex min-h-screen items-center justify-center">
      <Card class="w-full max-w-md">
        <CardHeader>
          <CardTitle>{{ $t('auth.resetPassword.title') }}</CardTitle>
          <CardDescription>
            {{ $t('auth.resetPassword.description') }}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form @submit.prevent="handleSubmit">
            <div class="space-y-4">
              <div>
                <Label for="password">
                  {{ $t('auth.resetPassword.newPassword') }}
                </Label>
                <Input
                  id="password"
                  v-model="password"
                  type="password"
                  required
                />
                <PasswordStrength :password="password" />
              </div>
              
              <div>
                <Label for="confirmPassword">
                  {{ $t('auth.resetPassword.confirmPassword') }}
                </Label>
                <Input
                  id="confirmPassword"
                  v-model="confirmPassword"
                  type="password"
                  required
                />
              </div>
              
              <Button
                type="submit"
                class="w-full"
                :loading="loading"
                :disabled="!isValid"
              >
                {{ $t('auth.resetPassword.submit') }}
              </Button>
            </div>
          </form>
          
          <!-- エラーメッセージ -->
          <Alert v-if="error" class="mt-4" variant="destructive">
            <AlertDescription>{{ error }}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  auth: false
})

const route = useRoute()
const router = useRouter()

const token = route.query.token as string
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')

const isValid = computed(() => {
  return password.value.length >= 8 &&
         password.value === confirmPassword.value
})

// トークン検証
onMounted(async () => {
  if (!token) {
    await router.push('/auth/forgot-password')
    return
  }
  
  try {
    await $fetch('/api/v1/auth/verify-reset-token', {
      method: 'POST',
      body: { token }
    })
  } catch (e) {
    error.value = 'リセットトークンが無効です'
    setTimeout(() => {
      router.push('/auth/forgot-password')
    }, 3000)
  }
})

async function handleSubmit() {
  if (!isValid.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    await $fetch('/api/v1/auth/reset-password', {
      method: 'POST',
      body: {
        token,
        password: password.value
      }
    })
    
    const { toast } = useToast()
    toast({
      title: 'パスワード変更完了',
      description: 'パスワードが正常に変更されました',
      variant: 'success'
    })
    
    await router.push('/auth/login')
  } catch (e) {
    error.value = e.data?.message || 'パスワードの変更に失敗しました'
  } finally {
    loading.value = false
  }
}
</script>
```

## レイアウト

### AuthLayout.vue
認証ページ共通レイアウト

```vue
<!-- layouts/auth.vue -->
<template>
  <div class="auth-layout">
    <!-- 背景パターン -->
    <div class="fixed inset-0 -z-10">
      <div class="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
      <div class="absolute inset-0 bg-grid-pattern opacity-5" />
    </div>
    
    <!-- コンテンツ -->
    <main class="relative">
      <slot />
    </main>
    
    <!-- フッター -->
    <footer class="fixed bottom-0 w-full p-4 text-center text-sm text-muted-foreground">
      <div class="flex items-center justify-center space-x-4">
        <NuxtLink to="/privacy" class="hover:underline">
          {{ $t('footer.privacy') }}
        </NuxtLink>
        <span>•</span>
        <NuxtLink to="/terms" class="hover:underline">
          {{ $t('footer.terms') }}
        </NuxtLink>
        <span>•</span>
        <NuxtLink to="/help" class="hover:underline">
          {{ $t('footer.help') }}
        </NuxtLink>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.bg-grid-pattern {
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}
</style>
```
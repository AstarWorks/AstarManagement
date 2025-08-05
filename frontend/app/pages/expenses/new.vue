<template>
  <div class="expense-new-page">
    <!-- Breadcrumb -->
    <Breadcrumb class="mb-6">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink :as="NuxtLink" to="/expenses">
            {{ t('expense.titlePlural') }}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>
            {{ t('expense.actions.create') }}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>

    <!-- Page Header -->
    <div class="page-header mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold">{{ t('expense.actions.create') }}</h1>
          <p class="text-muted-foreground mt-2">
            {{ t('expense.form.steps.basicDescription') }}
          </p>
        </div>
        <Button 
          variant="outline"
          @click="handleCancel"
        >
          <Icon name="lucide:x" class="w-4 h-4 mr-2" />
          {{ t('expense.actions.cancel') }}
        </Button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <Icon name="lucide:loader-2" class="w-8 h-8 animate-spin mx-auto mb-4" />
        <p class="text-muted-foreground">{{ t('expense.status.loading') }}</p>
      </div>
    </div>

    <!-- Error State -->
    <Alert v-else-if="error" variant="destructive" class="mb-6">
      <Icon name="lucide:alert-circle" class="h-4 w-4" />
      <AlertDescription>
        {{ error }}
      </AlertDescription>
    </Alert>

    <!-- Expense Form -->
    <Card v-else>
      <CardContent class="p-6">
        <ExpenseForm
          :is-loading="isSaving"
          @submit="handleFormSubmit"
          @cancel="handleCancel"
          @step-change="handleStepChange"
        />
      </CardContent>
    </Card>

    <!-- Success Toast placeholder -->
    <div v-if="showSuccessMessage" class="fixed bottom-4 right-4 z-50">
      <Alert class="w-80">
        <Icon name="lucide:check-circle" class="h-4 w-4" />
        <AlertDescription>
          {{ t('expense.status.created') }}
        </AlertDescription>
      </Alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ExpenseFormData } from '~/schemas/expense'
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '~/components/ui/breadcrumb'
import { Card, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Alert, AlertDescription } from '~/components/ui/alert'
import ExpenseForm from '~/components/expense/ExpenseForm.vue'

defineOptions({
  name: 'ExpenseNewPage'
})

// Meta
definePageMeta({
  title: 'expense.actions.create',
  middleware: ['auth']
})

// Composables
const { t } = useI18n()
const router = useRouter()
const NuxtLink = resolveComponent('NuxtLink')

// Page state
const isLoading = ref(false)
const isSaving = ref(false)
const error = ref<string | null>(null)
const showSuccessMessage = ref(false)
const currentFormStep = ref(0)

// Form submission handler
const handleFormSubmit = async (formData: ExpenseFormData) => {
  isSaving.value = true
  error.value = null
  
  try {
    // TODO: Replace with actual API call to expense service
    // For now, simulate API call with mock service
    console.log('Creating expense with data:', formData)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Show success message
    showSuccessMessage.value = true
    
    // Clear form draft from localStorage
    localStorage.removeItem('expense-form-draft')
    
    // Hide success message after 3 seconds and redirect
    setTimeout(() => {
      showSuccessMessage.value = false
      router.push('/expenses')
    }, 3000)
    
  } catch (err: unknown) {
    console.error('Failed to create expense:', err)
    error.value = err instanceof Error ? err.message : t('expense.errors.createFailed')
  } finally {
    isSaving.value = false
  }
}

// Cancel handler
const handleCancel = () => {
  // Confirm navigation if there are unsaved changes
  if (confirm(t('expense.confirmations.unsavedChanges'))) {
    router.push('/expenses')
  }
}

// Step change handler for analytics/tracking
const handleStepChange = (step: number) => {
  currentFormStep.value = step
  // Could add analytics tracking here
  console.log(`User navigated to form step: ${step}`)
}

// Handle navigation guards for unsaved changes
onBeforeRouteLeave((to, from, next) => {
  const hasDraft = localStorage.getItem('expense-form-draft')
  if (hasDraft && !showSuccessMessage.value) {
    if (confirm(t('expense.confirmations.unsavedChanges'))) {
      localStorage.removeItem('expense-form-draft')
      next()
    } else {
      next(false)
    }
  } else {
    next()
  }
})

// SEO and meta
useSeoMeta({
  title: t('expense.actions.create'),
  description: t('expense.form.steps.basicDescription')
})

// Page initialization
onMounted(async () => {
  isLoading.value = true
  try {
    // Initialize any required data (cases, tags, etc.)
    // For now, this is handled by individual step components
    await nextTick()
  } catch (err) {
    console.error('Failed to initialize expense creation page:', err)
    error.value = t('expense.errors.loadFailed')
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.expense-new-page {
  @apply container mx-auto px-4 py-6 max-w-3xl;
}

.form-group {
  @apply space-y-2;
}

@media (max-width: 640px) {
  .expense-new-page {
    @apply px-2 py-4;
  }
}
</style>
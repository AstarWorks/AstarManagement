<template>
  <div class="expense-edit-page">
    <!-- Loading Skeleton -->
    <div v-if="loading" class="space-y-6">
      <div class="h-6 bg-muted rounded animate-pulse" />
      <div class="h-8 bg-muted rounded animate-pulse" />
      <Card>
        <CardContent class="p-6 space-y-4">
          <div v-for="i in 6" :key="i" class="space-y-2">
            <div class="h-4 bg-muted rounded animate-pulse w-24" />
            <div class="h-10 bg-muted rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Error state -->
    <div v-else-if="loadError" class="text-center py-12">
      <Card class="bg-destructive/10">
        <CardContent class="p-6">
          <Icon name="lucide:alert-circle" class="w-12 h-12 text-destructive mx-auto mb-4" />
          <p class="text-destructive mb-4">{{ loadError }}</p>
          <Button variant="outline" @click="loadExpense">
            {{ t('common.retry') }}
          </Button>
        </CardContent>
      </Card>
    </div>

    <!-- Content -->
    <template v-else-if="currentData">
      <!-- Breadcrumb -->
      <Breadcrumb class="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink :as="NuxtLink" to="/expenses">
              {{ t('expense.navigation.title') }}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink :as="NuxtLink" :to="`/expenses/${expenseId}`">
              {{ originalDescription }}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {{ t('expense.form.title.edit') }}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <!-- Page Header with Status Indicators -->
      <div class="page-header mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">{{ t('expense.form.title.edit') }}</h1>
          <div class="flex items-center gap-2 mt-2">
            <Badge v-if="hasOptimisticUpdate" variant="secondary" class="text-xs">
              <Icon name="lucide:zap" class="w-3 h-3 mr-1" />
              {{ t('expense.status.optimistic') }}
            </Badge>
            <Badge v-if="isDirty" variant="outline" class="text-xs">
              <Icon name="lucide:circle" class="w-2 h-2 mr-1 fill-current text-warning" />
              {{ t('expense.status.unsavedChanges') }}
            </Badge>
          </div>
        </div>
      </div>

      <!-- Expense Form -->
      <Card>
        <CardContent class="p-6">
          <Form v-slot="{ handleSubmit: formHandleSubmit }" :validation-schema="validationSchema">
            <form @submit="formHandleSubmit($event => handleSubmit($event as IExpenseFormData))">
              <!-- Form Fields Component -->
              <ExpenseFormFields
                mode="edit"
                :disabled="isSubmitting"
                @field-change="handleFieldChange"
                @open-tag-selector="handleOpenTagSelector"
                @open-attachment-upload="handleOpenAttachmentUpload"
              />

              <!-- Form Actions -->
              <div class="flex flex-col sm:flex-row gap-3 justify-end mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  :disabled="isSubmitting"
                  @click="handleCancel"
                >
                  {{ t('common.cancel') }}
                </Button>
                <Button 
                  type="submit"
                  :disabled="isSubmitting || !isFormValid || !isDirty"
                  class="relative"
                >
                  <Icon v-if="isSubmitting" name="lucide:loader-2" class="w-4 h-4 mr-2 animate-spin" />
                  {{ isSubmitting ? t('common.saving') : t('expense.actions.update') }}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <!-- Optimistic Update Indicator -->
      <div v-if="hasOptimisticUpdate" class="fixed bottom-4 right-4 z-50">
        <Alert class="w-80 bg-primary/10 border-primary">
          <Icon name="lucide:zap" class="h-4 w-4" />
          <AlertDescription>
            {{ t('expense.status.optimisticUpdate') }}
          </AlertDescription>
        </Alert>
      </div>

      <!-- Conflict Resolution Dialog -->
      <ConflictResolutionDialog
        :open="showConflictDialog"
        :conflict="currentConflict"
        @update:open="showConflictDialog = $event"
        @resolve="handleConflictResolution"
        @cancel="handleConflictCancel"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { createExpenseSchema } from '~/schemas/expense'
import type { IExpense, IExpenseFormData, IExpenseFieldChangeEvent } from '@expense/types/expense'
import type { IConflictResolution } from '@shared/composables/form/useFormSubmissionOptimistic'
import { useFormSubmissionOptimistic } from '@shared/composables/form/useFormSubmissionOptimistic'
import { useFormNavigationGuards } from '@shared/composables/form/useFormNavigationGuards'
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@ui/breadcrumb'
import { Card, CardContent } from '@ui/card'
import { Button } from '@ui/button/index'
import { Badge } from '@ui/badge'
import { Alert, AlertDescription } from '@ui/alert'
import { Form } from '@ui/form'
import { Icon } from '#components'
import ExpenseFormFields from '@expense/components/list/ExpenseFormFields.vue'
import ConflictResolutionDialog from '@expense/components/list/ConflictResolutionDialog.vue'
import authMiddleware from '~/infrastructure/middleware/auth'

defineOptions({
  name: 'ExpenseEdit'
})

// Meta
definePageMeta({
  title: 'expense.form.title.edit',
  middleware: [authMiddleware],
  validate: ({ params }: { params: Record<string, unknown> }) => {
    return typeof params.id === 'string' && params.id.length > 0
  }
})

// Composables
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const NuxtLink = resolveComponent('NuxtLink')

// State
// @ts-expect-error - route params typing issue in Nuxt
const expenseId = route.params.id as string
const loading = ref(true)
const loadError = ref<string>()
const originalDescription = ref('')

// Conflict resolution state
const showConflictDialog = ref(false)
const currentConflict = ref<IConflictResolution<IExpenseFormData> | null>(null)

// Validation schema
const validationSchema = toTypedSchema(createExpenseSchema(t))

// Form validation
const isFormValid = computed(() => {
  return currentData.value?.date && 
         currentData.value?.category && 
         currentData.value?.description &&
         ((currentData.value?.incomeAmount || 0) > 0 || (currentData.value?.expenseAmount || 0) > 0)
})

// Initialize optimistic form submission
const {
  formState,
  currentData,
  isDirty,
  isSubmitting,
  hasOptimisticUpdate,
  submitWithOptimistic,
  updateFormData,
  clearError,
  resolveConflict
} = useFormSubmissionOptimistic<IExpenseFormData>({
  initialData: {
    date: '',
    category: '',
    description: '',
    incomeAmount: 0,
    expenseAmount: 0,
    caseId: undefined,
    memo: '',
    tagIds: [],
    attachmentIds: []
  },
  version: 1,
  enableOptimistic: true,
  conflictResolver: async (conflict) => {
    currentConflict.value = conflict
    showConflictDialog.value = true
    
    // Return a promise that resolves when dialog is closed
    return new Promise((resolve) => {
      const unwatch = watch(showConflictDialog, (isOpen) => {
        if (!isOpen && currentConflict.value) {
          resolve(currentConflict.value.localData) // Default resolution
          unwatch()
        }
      })
    })
  },
  onSuccess: (_data) => {
    router.push(`/expenses/${expenseId}`)
  },
  onError: (error) => {
    console.error('Form submission error:', error)
  }
})

// Navigation guards
const { enableGuards, disableGuards } = useFormNavigationGuards({
  isDirty,
  confirmMessage: t('expense.form.confirmDiscardChanges'),
  onNavigationAllowed: () => {
    // Allow navigation when form is saved successfully
  }
})

// Load expense data
const loadExpense = async () => {
  loading.value = true
  loadError.value = undefined
  
  try {
    // Mock API call - will be replaced with actual service
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock expense data
    const expense: IExpense = {
      id: expenseId,
      date: '2025-08-04',
      category: 'travel',
      description: '新幹線代 東京-大阪',
      incomeAmount: 0,
      expenseAmount: 15000,
      caseId: 'case-123',
      memo: '出張のための交通費',
      tagIds: [],
      attachmentIds: [],
      createdAt: '2025-08-04T10:00:00Z',
      updatedAt: '2025-08-04T10:00:00Z',
      createdBy: 'user-123',
      tenantId: 'tenant-123'
    }
    
    // Convert to form data
    const data: IExpenseFormData = {
      date: expense.date,
      category: expense.category,
      description: expense.description,
      incomeAmount: expense.incomeAmount,
      expenseAmount: expense.expenseAmount,
      caseId: expense.caseId,
      memo: expense.memo || '',
      tagIds: expense.tagIds || [],
      attachmentIds: expense.attachmentIds || []
    }
    
    // Initialize form with loaded data
    formState.value.data = { ...data }
    formState.value.originalData = { ...data }
    // version property removed from IExpense interface
    originalDescription.value = expense.description
    
  } catch (err: unknown) {
    loadError.value = t('expense.errors.loadFailed')
    console.error('Failed to load expense:', err)
  } finally {
    loading.value = false
  }
}

// Event handlers
const handleSubmit = async (_formData: IExpenseFormData) => {
  clearError()
  
  await submitWithOptimistic(async (_data) => {
    // Mock API call - will be replaced with actual service
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Mock response with updated version
    return {
      ...currentData.value,
      version: formState.value.version + 1,
      updatedAt: new Date().toISOString()
    }
  })
}

const handleFieldChange = (event: IExpenseFieldChangeEvent) => {
  updateFormData({ [event.field]: event.value })
}

const handleCancel = () => {
  if (isDirty.value) {
    // Navigation guard will handle confirmation
    router.back()
  } else {
    router.back()
  }
}

// Tag and attachment handlers (placeholders)
const handleOpenTagSelector = () => {
  // TODO: Implement tag selector dialog
  console.log('Open tag selector')
}

const handleOpenAttachmentUpload = () => {
  // TODO: Implement attachment upload dialog
  console.log('Open attachment upload')
}

// Conflict resolution handlers
const handleConflictResolution = async (resolution: string, mergedData?: unknown) => {
  if (currentConflict.value) {
    let resolvedData: IExpenseFormData
    
    switch (resolution) {
      case 'keep_local':
        resolvedData = currentConflict.value.localData
        break
      case 'use_server':
        resolvedData = currentConflict.value.serverData
        break
      case 'merge':
        resolvedData = (mergedData as IExpenseFormData) || currentConflict.value.localData
        break
      default:
        resolvedData = currentConflict.value.localData
        break
    }
    
    await resolveConflict(resolvedData, currentConflict.value.serverVersion)
  }
  
  showConflictDialog.value = false
  currentConflict.value = null
}

const handleConflictCancel = () => {
  showConflictDialog.value = false
  currentConflict.value = null
}

// Lifecycle hooks
onMounted(() => {
  loadExpense()
  enableGuards()
})

onUnmounted(() => {
  disableGuards()
})

// SEO
useSeoMeta({
  title: () => originalDescription.value 
    ? `${t('expense.form.title.edit')} - ${originalDescription.value}`
    : t('expense.form.title.edit'),
  description: t('expense.form.description.edit')
})
</script>

<style scoped>
.expense-edit-page {
  @apply container mx-auto px-4 py-6 max-w-3xl;
}

.form-group {
  @apply space-y-2;
}

@media (max-width: 640px) {
  .expense-edit-page {
    @apply px-2 py-4;
  }
}
</style>
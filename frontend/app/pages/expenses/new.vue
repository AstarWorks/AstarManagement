<template>
  <div class="expense-new-page">
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
          <BreadcrumbPage>
            {{ t('expense.form.title.create') }}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>

    <!-- Page Header -->
    <div class="page-header mb-6">
      <h1 class="text-2xl font-bold">{{ t('expense.form.title.create') }}</h1>
    </div>

    <!-- Expense Form -->
    <Card>
      <CardContent class="p-6">
        <form @submit.prevent="handleSubmit">
          <!-- Date Field -->
          <div class="form-group mb-4">
            <Label for="date">{{ t('expense.form.fields.date') }}</Label>
            <Input 
              id="date" 
              v-model="formData.date" 
              type="date" 
              :class="{ 'border-destructive': hasError('date') }"
            />
            <p v-if="hasError('date')" class="text-sm text-destructive mt-1">
              {{ getError('date') }}
            </p>
          </div>

          <!-- Category Field -->
          <div class="form-group mb-4">
            <Label for="category">{{ t('expense.form.fields.category') }}</Label>
            <Select v-model="formData.category">
              <SelectTrigger :class="{ 'border-destructive': hasError('category') }">
                <SelectValue :placeholder="t('expense.form.placeholders.category')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="travel">{{ t('expense.categories.travel') }}</SelectItem>
                <SelectItem value="meal">{{ t('expense.categories.meal') }}</SelectItem>
                <SelectItem value="office">{{ t('expense.categories.office') }}</SelectItem>
                <SelectItem value="communication">{{ t('expense.categories.communication') }}</SelectItem>
                <SelectItem value="other">{{ t('expense.categories.other') }}</SelectItem>
              </SelectContent>
            </Select>
            <p v-if="hasError('category')" class="text-sm text-destructive mt-1">
              {{ getError('category') }}
            </p>
          </div>

          <!-- Description Field -->
          <div class="form-group mb-4">
            <Label for="description">{{ t('expense.form.fields.description') }}</Label>
            <Input 
              id="description" 
              v-model="formData.description" 
              type="text"
              :placeholder="t('expense.form.placeholders.description')"
              :class="{ 'border-destructive': hasError('description') }"
            />
            <p v-if="hasError('description')" class="text-sm text-destructive mt-1">
              {{ getError('description') }}
            </p>
          </div>

          <!-- Income Amount Field -->
          <div class="form-group mb-4">
            <Label for="incomeAmount">{{ t('expense.form.fields.incomeAmount') }}</Label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
              <Input 
                id="incomeAmount" 
                v-model.number="formData.incomeAmount" 
                type="number"
                min="0"
                class="pl-8"
                :placeholder="t('expense.form.placeholders.amount')"
                :class="{ 'border-destructive': hasError('incomeAmount') }"
              />
            </div>
            <p v-if="hasError('incomeAmount')" class="text-sm text-destructive mt-1">
              {{ getError('incomeAmount') }}
            </p>
          </div>

          <!-- Expense Amount Field -->
          <div class="form-group mb-4">
            <Label for="expenseAmount">{{ t('expense.form.fields.expenseAmount') }}</Label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
              <Input 
                id="expenseAmount" 
                v-model.number="formData.expenseAmount" 
                type="number"
                min="0"
                class="pl-8"
                :placeholder="t('expense.form.placeholders.amount')"
                :class="{ 'border-destructive': hasError('expenseAmount') }"
              />
            </div>
            <p v-if="hasError('expenseAmount')" class="text-sm text-destructive mt-1">
              {{ getError('expenseAmount') }}
            </p>
          </div>

          <!-- Case Field (Optional) -->
          <div class="form-group mb-4">
            <Label for="caseId">{{ t('expense.form.fields.case') }}</Label>
            <Select v-model="formData.caseId">
              <SelectTrigger>
                <SelectValue :placeholder="t('expense.form.placeholders.case')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="null">{{ t('common.none') }}</SelectItem>
                <!-- Cases will be loaded dynamically -->
              </SelectContent>
            </Select>
          </div>

          <!-- Memo Field -->
          <div class="form-group mb-6">
            <Label for="memo">{{ t('expense.form.fields.memo') }}</Label>
            <Textarea 
              id="memo" 
              v-model="formData.memo" 
              :placeholder="t('expense.form.placeholders.memo')"
              rows="3"
            />
          </div>

          <!-- Form Actions -->
          <div class="flex flex-col sm:flex-row gap-3 justify-end">
            <Button 
              type="button" 
              variant="outline" 
              :disabled="saving"
              @click="handleCancel"
            >
              {{ t('common.cancel') }}
            </Button>
            <Button 
              type="submit"
              :disabled="saving || !isFormValid"
            >
              <Icon v-if="saving" name="lucide:loader-2" class="w-4 h-4 mr-2 animate-spin" />
              {{ saving ? t('common.saving') : t('expense.actions.create') }}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import type { IExpenseFormData } from '~/types/expense'
import type { IValidationError } from '~/types/common'
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
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Icon } from '#components'

defineOptions({
  name: 'ExpenseNew'
})

// Meta
definePageMeta({
  title: 'expense.form.title.create',
  middleware: ['auth']
})

// Composables
const { t } = useI18n()
const router = useRouter()
const NuxtLink = resolveComponent('NuxtLink')

// Form state
const formData = ref<IExpenseFormData>({
  date: new Date().toISOString().split('T')[0] || '',
  category: '',
  description: '',
  incomeAmount: 0,
  expenseAmount: 0,
  caseId: undefined,
  memo: '',
  tagIds: [],
  attachmentIds: []
})

const saving = ref(false)
const formErrors = ref<IValidationError[]>([])

// Form validation
const isFormValid = computed(() => {
  return formData.value.date && 
         formData.value.category && 
         formData.value.description &&
         (formData.value.incomeAmount > 0 || formData.value.expenseAmount > 0)
})

// Error handling helpers
const hasError = (field: string): boolean => {
  return formErrors.value.some(error => error.field === field)
}

const getError = (field: string): string => {
  const error = formErrors.value.find(err => err.field === field)
  return error ? t(`expense.errors.${error.code}`, error.message) : ''
}

// Form validation
const validateForm = (): boolean => {
  formErrors.value = []
  
  if (!formData.value.date) {
    formErrors.value.push({ 
      field: 'date', 
      message: 'Date is required', 
      code: 'REQUIRED' 
    })
  }
  
  if (!formData.value.category) {
    formErrors.value.push({ 
      field: 'category', 
      message: 'Category is required', 
      code: 'REQUIRED' 
    })
  }
  
  if (!formData.value.description) {
    formErrors.value.push({ 
      field: 'description', 
      message: 'Description is required', 
      code: 'REQUIRED' 
    })
  }
  
  if (formData.value.incomeAmount === 0 && formData.value.expenseAmount === 0) {
    formErrors.value.push({ 
      field: 'incomeAmount', 
      message: 'Either income or expense amount is required', 
      code: 'AMOUNT_REQUIRED' 
    })
    formErrors.value.push({ 
      field: 'expenseAmount', 
      message: 'Either income or expense amount is required', 
      code: 'AMOUNT_REQUIRED' 
    })
  }
  
  return formErrors.value.length === 0
}

// Event handlers
const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }
  
  saving.value = true
  formErrors.value = []
  
  try {
    // Mock API call - will be replaced with actual service
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Success - redirect to list
    await router.push('/expenses')
  } catch (error: unknown) {
    formErrors.value = [{ 
      field: 'general', 
      message: 'Failed to create expense', 
      code: 'CREATE_FAILED' 
    }]
    console.error('Failed to create expense:', error)
  } finally {
    saving.value = false
  }
}

const handleCancel = () => {
  router.back()
}

// SEO
useSeoMeta({
  title: t('expense.form.title.create'),
  description: t('expense.form.description.create')
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
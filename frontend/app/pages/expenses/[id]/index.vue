<template>
  <ExpenseDetailView
    :expense="expense"
    :loading="loading"
    :error="error"
    :deleting="isDeleting"
    @edit="handleEdit"
    @delete="showDeleteDialog = true"
    @print="handlePrint"
    @copy="handleCopy"
    @back="handleBack"
    @retry="loadExpense"
    @preview="handlePreview"
  />
  
  <ExpenseDeleteDialog
    v-model:open="showDeleteDialog"
    :expense="expense"
    :deleting="isDeleting"
    @confirm="handleDeleteConfirm"
    @cancel="showDeleteDialog = false"
  />
</template>

<script setup lang="ts">
import type { IExpense, IAttachment } from '~/types/expense'
import { TagScope as _TagScope, AttachmentStatus as _AttachmentStatus } from '~/types/expense'
import ExpenseDetailView from '~/components/expenses/detail/ExpenseDetailView.vue'
import ExpenseDeleteDialog from '~/components/expense/ExpenseDeleteDialog.vue'
import { useExpenseActions } from '~/composables/useExpenseActions'
import { useExpenseDelete } from '~/composables/useExpenseDelete'
import { toast } from 'vue-sonner'

// Meta
definePageMeta({
  title: 'expense.form.title.view',
  middleware: ['auth'],
  validate: ({ params }: { params: Record<string, unknown> }) => {
    return typeof params.id === 'string' && params.id.length > 0
  }
})

// Composables
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { handleCopy: copyExpense, handlePrint: printExpense } = useExpenseActions()
const { isDeleting, deleteExpense } = useExpenseDelete()

// State
// @ts-expect-error - route params typing issue in Nuxt
const expenseId = route.params.id as string
const expense = ref<IExpense>()
const loading = ref(true)
const error = ref<string>()
const showDeleteDialog = ref(false)

// Load expense data
const loadExpense = async () => {
  loading.value = true
  error.value = undefined
  
  try {
    // Mock API call - will be replaced with actual service
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock expense data
    expense.value = {
      id: expenseId,
      date: '2025-08-04',
      category: 'travel',
      description: '新幹線代 東京-大阪',
      incomeAmount: 0,
      expenseAmount: 15000,
      caseId: 'case-123',
      memo: '出張のための交通費',
      tagIds: ['tag-1', 'tag-2'],
      attachmentIds: ['att-1'],
      createdAt: '2025-08-04T10:00:00Z',
      updatedAt: '2025-08-04T10:00:00Z',
      createdBy: 'user-123',
      tenantId: 'tenant-123'
    }
  } catch (err) {
    error.value = t('expense.errors.loadFailed')
    console.error('Failed to load expense:', err)
  } finally {
    loading.value = false
  }
}

// Event handlers
const handleEdit = () => {
  router.push(`/expenses/${expenseId}/edit`)
}

const handleDeleteConfirm = async () => {
  if (!expense.value) return
  
  const result = await deleteExpense(expense.value.id)
  if (result.success) {
    showDeleteDialog.value = false
    await router.push('/expenses')
  }
}

const handleBack = () => {
  router.push('/expenses')
}

const handleCopy = async () => {
  if (expense.value) {
    await copyExpense(expense.value)
  }
}

const handlePrint = () => {
  printExpense()
}

const handlePreview = (attachment: IAttachment) => {
  // TODO: Implement attachment preview
  console.log('Preview attachment:', attachment)
  toast.info(t('expense.preview.notImplemented'))
}

// Load data on mount
onMounted(() => {
  loadExpense()
})

// SEO
useSeoMeta({
  title: () => expense.value 
    ? `${t('expense.form.title.view')} - ${expense.value.description}`
    : t('expense.form.title.view'),
  description: () => expense.value
    ? `${new Date(expense.value.date).toLocaleDateString('ja-JP')} - ${t(`expense.categories.${expense.value.category}`)} - ${new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(expense.value.expenseAmount)}`
    : ''
})
</script>
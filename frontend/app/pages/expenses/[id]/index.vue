<template>
  <div class="expense-detail-page">
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center py-12">
      <Icon name="lucide:loader-2" class="w-8 h-8 animate-spin text-primary" />
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="text-center py-12">
      <Card class="bg-destructive/10">
        <CardContent class="p-6">
          <Icon name="lucide:alert-circle" class="w-12 h-12 text-destructive mx-auto mb-4" />
          <p class="text-destructive mb-4">{{ error }}</p>
          <Button variant="outline" @click="loadExpense">
            {{ t('common.retry') }}
          </Button>
        </CardContent>
      </Card>
    </div>

    <!-- Content -->
    <template v-else-if="expense">
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
              {{ expense.description }}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <!-- Page Header -->
      <div class="page-header mb-6">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 class="text-2xl font-bold">{{ t('expense.form.title.view') }}</h1>
          <div class="flex flex-wrap gap-2">
            <NuxtLink 
              :to="`/expenses/${expense.id}/edit`" 
              class="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Icon name="lucide:edit" class="w-4 h-4 mr-2" />
              {{ t('expense.actions.edit') }}
            </NuxtLink>
            <Button 
              variant="destructive" 
              :disabled="deleting"
              @click="handleDelete"
            >
              <Icon v-if="deleting" name="lucide:loader-2" class="w-4 h-4 mr-2 animate-spin" />
              <Icon v-else name="lucide:trash-2" class="w-4 h-4 mr-2" />
              {{ t('expense.actions.delete') }}
            </Button>
          </div>
        </div>
      </div>

      <!-- Expense Details Card -->
      <Card class="mb-6">
        <CardHeader>
          <CardTitle>{{ t('expense.detail.basicInfo') }}</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Date -->
            <div>
              <Label class="text-muted-foreground">{{ t('expense.form.fields.date') }}</Label>
              <p class="mt-1 font-medium">{{ formatDate(expense.date) }}</p>
            </div>

            <!-- Category -->
            <div>
              <Label class="text-muted-foreground">{{ t('expense.form.fields.category') }}</Label>
              <p class="mt-1 font-medium">{{ t(`expense.categories.${expense.category}`) }}</p>
            </div>

            <!-- Description -->
            <div class="md:col-span-2">
              <Label class="text-muted-foreground">{{ t('expense.form.fields.description') }}</Label>
              <p class="mt-1 font-medium">{{ expense.description }}</p>
            </div>

            <!-- Income Amount -->
            <div>
              <Label class="text-muted-foreground">{{ t('expense.form.fields.incomeAmount') }}</Label>
              <p class="mt-1 font-medium text-green-600">
                {{ formatCurrency(expense.incomeAmount) }}
              </p>
            </div>

            <!-- Expense Amount -->
            <div>
              <Label class="text-muted-foreground">{{ t('expense.form.fields.expenseAmount') }}</Label>
              <p class="mt-1 font-medium text-red-600">
                {{ formatCurrency(expense.expenseAmount) }}
              </p>
            </div>

            <!-- Balance -->
            <div class="md:col-span-2">
              <Label class="text-muted-foreground">{{ t('expense.form.fields.balance') }}</Label>
              <p class="mt-1 text-lg font-bold" :class="balanceClass">
                {{ formatCurrency(expense.balance) }}
              </p>
            </div>

            <!-- Case -->
            <div v-if="expense.caseId" class="md:col-span-2">
              <Label class="text-muted-foreground">{{ t('expense.form.fields.case') }}</Label>
              <p class="mt-1 font-medium">
                {{ expense.caseId }}
              </p>
            </div>

            <!-- Memo -->
            <div v-if="expense.memo" class="md:col-span-2">
              <Label class="text-muted-foreground">{{ t('expense.form.fields.memo') }}</Label>
              <p class="mt-1 whitespace-pre-wrap">{{ expense.memo }}</p>
            </div>

            <!-- Tags -->
            <div v-if="expense.tags && expense.tags.length > 0" class="md:col-span-2">
              <Label class="text-muted-foreground">{{ t('expense.form.fields.tags') }}</Label>
              <div class="flex flex-wrap gap-2 mt-2">
                <Badge v-for="tag in expense.tags" :key="tag.id" variant="secondary">
                  {{ tag.name }}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Attachments Section -->
      <Card v-if="expense.attachments && expense.attachments.length > 0">
        <CardHeader>
          <div class="flex justify-between items-center">
            <CardTitle>{{ t('expense.form.fields.attachments') }}</CardTitle>
            <NuxtLink 
              :to="`/expenses/${expense.id}/attachments`" 
              class="text-sm text-primary hover:underline"
            >
              {{ t('expense.actions.manageAttachments') }}
            </NuxtLink>
          </div>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            <div 
              v-for="attachment in expense.attachments" 
              :key="attachment.id"
              class="flex items-center justify-between p-3 border rounded-lg"
            >
              <div class="flex items-center gap-3">
                <Icon name="lucide:file" class="w-5 h-5 text-muted-foreground" />
                <div>
                  <p class="font-medium">{{ attachment.fileName }}</p>
                  <p class="text-sm text-muted-foreground">
                    {{ formatFileSize(attachment.fileSize) }}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Icon name="lucide:download" class="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Metadata -->
      <div class="mt-6 text-sm text-muted-foreground">
        <p>{{ t('common.createdAt') }}: {{ formatDateTime(expense.createdAt) }}</p>
        <p v-if="expense.updatedAt !== expense.createdAt">
          {{ t('common.updatedAt') }}: {{ formatDateTime(expense.updatedAt) }}
        </p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { IExpense } from '~/types/expense'
import { TagScope, AttachmentStatus } from '~/types/expense'
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '~/components/ui/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import { Badge } from '~/components/ui/badge'
import { Icon } from '#components'

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
const NuxtLink = resolveComponent('NuxtLink')

// State
// @ts-expect-error - route params typing issue in Nuxt
const expenseId = route.params.id as string
const expense = ref<IExpense>()
const loading = ref(true)
const error = ref<string>()
const deleting = ref(false)

// Computed
const balanceClass = computed(() => {
  if (!expense.value) return ''
  return expense.value.balance >= 0 ? 'text-green-600' : 'text-red-600'
})

// Formatters
const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('ja-JP')
}

const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString('ja-JP')
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY'
  }).format(amount)
}

const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

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
      balance: -15000,
      caseId: 'case-123',
      memo: '出張のための交通費',
      tags: [
        { 
          id: 'tag-1', 
          tenantId: 'tenant-123',
          name: '交通費',
          color: '#10B981',
          scope: TagScope.TENANT,
          usageCount: 42,
          createdAt: '2025-01-01T00:00:00Z',
          createdBy: 'user-123'
        },
        { 
          id: 'tag-2', 
          tenantId: 'tenant-123',
          name: '出張',
          color: '#3B82F6',
          scope: TagScope.TENANT,
          usageCount: 28,
          createdAt: '2025-01-01T00:00:00Z',
          createdBy: 'user-123'
        }
      ],
      attachments: [
        { 
          id: 'att-1',
          tenantId: 'tenant-123',
          fileName: '領収書.pdf',
          originalName: '領収書.pdf',
          fileSize: 1024 * 250,
          mimeType: 'application/pdf',
          storagePath: '/storage/att-1/領収書.pdf',
          status: AttachmentStatus.LINKED,
          uploadedAt: '2025-08-04T10:00:00Z',
          uploadedBy: 'user-123'
        }
      ],
      createdAt: '2025-08-04T10:00:00Z',
      updatedAt: '2025-08-04T10:00:00Z',
      createdBy: 'user-123',
      updatedBy: 'user-123',
      tenantId: 'tenant-123',
      version: 1
    }
  } catch (err) {
    error.value = t('expense.errors.loadFailed')
    console.error('Failed to load expense:', err)
  } finally {
    loading.value = false
  }
}

// Event handlers
const handleDelete = async () => {
  if (!confirm(t('expense.confirm.delete'))) {
    return
  }
  
  deleting.value = true
  
  try {
    // Mock API call - will be replaced with actual service
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Success - redirect to list
    await router.push('/expenses')
  } catch (err) {
    error.value = t('expense.errors.deleteFailed')
    console.error('Failed to delete expense:', err)
  } finally {
    deleting.value = false
  }
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
    ? `${formatDate(expense.value.date)} - ${t(`expense.categories.${expense.value.category}`)} - ${formatCurrency(expense.value.expenseAmount)}`
    : ''
})
</script>

<style scoped>
.expense-detail-page {
  @apply container mx-auto px-4 py-6 max-w-4xl;
}

@media (max-width: 640px) {
  .expense-detail-page {
    @apply px-2 py-4;
  }
}
</style>
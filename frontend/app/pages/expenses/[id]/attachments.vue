<template>
  <div class="expense-attachments-page">
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
          <Button variant="outline" @click="loadData">
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
            <BreadcrumbLink :as="NuxtLink" :to="`/expenses/${expenseId}`">
              {{ expense.description }}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {{ t('expense.attachments.title') }}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <!-- Page Header -->
      <div class="page-header mb-6">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 class="text-2xl font-bold">{{ t('expense.attachments.title') }}</h1>
          <div class="text-sm text-muted-foreground">
            {{ attachments.length }} / {{ maxAttachments }} {{ t('expense.attachments.files') }}
          </div>
        </div>
      </div>

      <!-- Upload Section -->
      <Card class="mb-6">
        <CardHeader>
          <CardTitle>{{ t('expense.attachments.upload.title') }}</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            class="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 hover:border-primary/50 transition-colors cursor-pointer text-center"
            :class="{ 'opacity-50 cursor-not-allowed': attachments.length >= maxAttachments || uploading }"
            @click="selectFiles"
            @dragover.prevent
            @drop.prevent="handleFileDrop"
          >
            <input 
              ref="fileInput"
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
              class="hidden"
              :disabled="attachments.length >= maxAttachments || uploading"
              @change="handleFileSelect"
            />
            
            <Icon name="lucide:upload-cloud" class="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p class="font-medium mb-1">
              {{ t('expense.attachments.upload.dropzone') }}
            </p>
            <p class="text-sm text-muted-foreground">
              {{ t('expense.attachments.upload.formats') }}
            </p>
            <p class="text-xs text-muted-foreground mt-2">
              {{ t('expense.attachments.upload.maxSize', { size: '10MB' }) }}
            </p>
          </div>

          <!-- Upload Progress -->
          <div v-if="uploadQueue.length > 0" class="mt-4 space-y-2">
            <div 
              v-for="file in uploadQueue" 
              :key="file.id"
              class="flex items-center gap-3 p-3 bg-muted rounded-lg"
            >
              <Icon name="lucide:file" class="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{{ file.name }}</p>
                <div class="mt-1 h-1 bg-muted-foreground/20 rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-primary transition-all duration-300"
                    :style="{ width: `${file.progress}%` }"
                  />
                </div>
              </div>
              <Button 
                v-if="file.status === 'uploading'"
                variant="ghost" 
                size="sm"
                @click="cancelUpload(file.id)"
              >
                <Icon name="lucide:x" class="w-4 h-4" />
              </Button>
              <Icon 
                v-else-if="file.status === 'completed'"
                name="lucide:check-circle" 
                class="w-5 h-5 text-green-600"
              />
              <Icon 
                v-else-if="file.status === 'error'"
                name="lucide:x-circle" 
                class="w-5 h-5 text-destructive"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Attachments List -->
      <Card>
        <CardHeader>
          <CardTitle>{{ t('expense.attachments.list.title') }}</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="attachments.length === 0" class="text-center py-8 text-muted-foreground">
            <Icon name="lucide:file-x" class="w-12 h-12 mx-auto mb-3" />
            <p>{{ t('expense.attachments.list.empty') }}</p>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              v-for="attachment in attachments" 
              :key="attachment.id"
              class="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                  <Icon :name="getFileIcon(attachment.mimeType)" class="w-5 h-5 text-muted-foreground" />
                </div>
                <div class="min-w-0">
                  <p class="font-medium truncate">{{ attachment.fileName }}</p>
                  <p class="text-sm text-muted-foreground">
                    {{ formatFileSize(attachment.fileSize) }} · 
                    {{ formatDate(attachment.uploadedAt) }}
                  </p>
                </div>
              </div>
              
              <div class="flex items-center gap-2 flex-shrink-0">
                <Button 
                  variant="ghost" 
                  size="sm"
                  :disabled="downloading[attachment.id]"
                  @click="downloadAttachment(attachment)"
                >
                  <Icon 
                    :name="downloading[attachment.id] ? 'lucide:loader-2' : 'lucide:download'" 
                    class="w-4 h-4"
                    :class="{ 'animate-spin': downloading[attachment.id] }"
                  />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  :disabled="deleting[attachment.id]"
                  @click="deleteAttachment(attachment)"
                >
                  <Icon 
                    :name="deleting[attachment.id] ? 'lucide:loader-2' : 'lucide:trash-2'" 
                    class="w-4 h-4 text-destructive"
                    :class="{ 'animate-spin': deleting[attachment.id] }"
                  />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { IExpense, IAttachment } from '~/types/expense'
import { AttachmentStatus } from '~/types/expense'
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
import { Icon } from '#components'

defineOptions({
  name: 'ExpenseAttachments'
})

// Meta
definePageMeta({
  title: 'expense.attachments.title',
  middleware: ['auth'],
  validate: ({ params }: { params: Record<string, unknown> }) => {
    return typeof params.id === 'string' && params.id.length > 0
  }
})

// Types
interface _IUploadFile {
  id: string
  name: string
  size: number
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
}

// Composables
const { t } = useI18n()
const route = useRoute()
const NuxtLink = resolveComponent('NuxtLink')

// State  
// @ts-expect-error - route params typing issue in Nuxt
const expenseId = route.params.id as string
const expense = ref<IExpense>()
const attachments = ref<IAttachment[]>([])
const loading = ref(true)
const error = ref<string>()
const uploading = ref(false)
const uploadQueue = ref<_IUploadFile[]>([])
const downloading = ref<Record<string, boolean>>({})
const deleting = ref<Record<string, boolean>>({})
const fileInput = ref<HTMLInputElement>()

// Constants
const maxAttachments = 10
const maxFileSize = 10 * 1024 * 1024 // 10MB

// Methods
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

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('ja-JP')
}

const getFileIcon = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'lucide:image'
  if (mimeType === 'application/pdf') return 'lucide:file-text'
  if (mimeType.includes('word')) return 'lucide:file-text'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'lucide:table'
  return 'lucide:file'
}

const selectFiles = () => {
  if (attachments.value.length >= maxAttachments || uploading.value) return
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files) {
    processFiles(Array.from(input.files))
  }
}

const handleFileDrop = (event: DragEvent) => {
  if (attachments.value.length >= maxAttachments || uploading.value) return
  
  if (event.dataTransfer?.files) {
    processFiles(Array.from(event.dataTransfer.files))
  }
}

const processFiles = (files: File[]) => {
  const remainingSlots = maxAttachments - attachments.value.length
  const filesToUpload = files.slice(0, remainingSlots)
  
  const validFiles = filesToUpload.filter(file => {
    if (file.size > maxFileSize) {
      console.error(`File ${file.name} exceeds maximum size`)
      return false
    }
    return true
  })
  
  validFiles.forEach(file => {
    const uploadFileData: _IUploadFile = {
      id: `upload-${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'pending'
    }
    
    uploadQueue.value.push(uploadFileData)
    uploadFile(file, uploadFileData)
  })
}

const uploadFile = async (file: File, uploadFileItem: _IUploadFile) => {
  uploading.value = true
  uploadFileItem.status = 'uploading'
  
  try {
    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      uploadFileItem.progress = i
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    uploadFileItem.status = 'completed'
    
    // Add to attachments list
    const newAttachment: IAttachment = {
      id: `att-${Date.now()}`,
      tenantId: 'tenant-123',
      fileName: file.name,
      originalName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      storagePath: `/storage/${Date.now()}/${file.name}`,
      status: AttachmentStatus.LINKED,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'user-123'
    }
    
    attachments.value.push(newAttachment)
    
    // Remove from upload queue after a delay
    setTimeout(() => {
      const index = uploadQueue.value.findIndex((f: _IUploadFile) => f.id === uploadFileItem.id)
      if (index !== -1) {
        uploadQueue.value.splice(index, 1)
      }
    }, 2000)
  } catch (error) {
    uploadFileItem.status = 'error'
    console.error('Failed to upload file:', error)
  } finally {
    uploading.value = false
  }
}

const cancelUpload = (fileId: string) => {
  const index = uploadQueue.value.findIndex((f: _IUploadFile) => f.id === fileId)
  if (index !== -1) {
    uploadQueue.value.splice(index, 1)
  }
}

const downloadAttachment = async (attachment: IAttachment) => {
  downloading.value[attachment.id] = true
  
  try {
    // Mock download
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // In real implementation, this would download the file
    console.log('Downloading:', attachment.fileName)
  } catch (error) {
    console.error('Failed to download attachment:', error)
  } finally {
    downloading.value[attachment.id] = false
  }
}

const deleteAttachment = async (attachment: IAttachment) => {
  if (!confirm(t('expense.attachments.confirm.delete'))) {
    return
  }
  
  deleting.value[attachment.id] = true
  
  try {
    // Mock delete
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Remove from list
    const index = attachments.value.findIndex((a: IAttachment) => a.id === attachment.id)
    if (index !== -1) {
      attachments.value.splice(index, 1)
    }
  } catch (error) {
    console.error('Failed to delete attachment:', error)
  } finally {
    deleting.value[attachment.id] = false
  }
}

const loadData = async () => {
  loading.value = true
  error.value = undefined
  
  try {
    // Mock API call
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
      tags: [],
      attachments: [],
      createdAt: '2025-08-04T10:00:00Z',
      updatedAt: '2025-08-04T10:00:00Z',
      createdBy: 'user-123',
      updatedBy: 'user-123',
      tenantId: 'tenant-123',
      version: 1
    }
    
    // Mock attachments
    attachments.value = [
      {
        id: 'att-1',
        tenantId: 'tenant-123',
        fileName: '領収書_新幹線.pdf',
        originalName: '領収書_新幹線.pdf',
        fileSize: 256 * 1024,
        mimeType: 'application/pdf',
        storagePath: '/storage/att-1/領収書_新幹線.pdf',
        status: AttachmentStatus.LINKED,
        uploadedAt: '2025-08-04T10:00:00Z',
        uploadedBy: 'user-123'
      },
      {
        id: 'att-2',
        tenantId: 'tenant-123',
        fileName: '交通費精算書.xlsx',
        originalName: '交通費精算書.xlsx',
        fileSize: 128 * 1024,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        storagePath: '/storage/att-2/交通費精算書.xlsx',
        status: AttachmentStatus.LINKED,
        uploadedAt: '2025-08-04T10:05:00Z',
        uploadedBy: 'user-123'
      }
    ]
  } catch (err) {
    error.value = t('expense.errors.loadFailed')
    console.error('Failed to load data:', err)
  } finally {
    loading.value = false
  }
}

// Load data on mount
onMounted(() => {
  loadData()
})

// SEO
useSeoMeta({
  title: () => expense.value 
    ? `${t('expense.attachments.title')} - ${expense.value.description}`
    : t('expense.attachments.title'),
  description: t('expense.attachments.description')
})
</script>

<style scoped>
.expense-attachments-page {
  @apply container mx-auto px-4 py-6 max-w-4xl;
}

@media (max-width: 640px) {
  .expense-attachments-page {
    @apply px-2 py-4;
  }
}
</style>
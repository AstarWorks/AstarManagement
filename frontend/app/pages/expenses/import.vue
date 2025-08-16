<template>
  <div class="expense-import-page">
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
            {{ t('expense.import.title') }}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>

    <!-- Page Header -->
    <div class="page-header mb-6">
      <h1 class="text-2xl font-bold">{{ t('expense.import.title') }}</h1>
      <p class="text-muted-foreground mt-2">
        {{ t('expense.import.description') }}
      </p>
    </div>

    <!-- Import Wizard -->
    <Card>
      <CardContent class="p-6">
        <!-- Progress Steps -->
        <div class="mb-8">
          <div class="flex items-center justify-between">
            <div 
              v-for="(step, index) in steps" 
              :key="step.id"
              class="flex items-center"
              :class="{ 'flex-1': index < steps.length - 1 }"
            >
              <div 
                class="flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors"
                :class="getStepClass(index)"
              >
                <Icon 
                  v-if="currentStep > index" 
                  name="lucide:check" 
                  class="w-5 h-5"
                />
                <span v-else>{{ index + 1 }}</span>
              </div>
              <div 
                v-if="index < steps.length - 1" 
                class="flex-1 h-0.5 mx-4 transition-colors"
                :class="currentStep > index ? 'bg-primary' : 'bg-muted'"
              />
            </div>
          </div>
          <div class="flex justify-between mt-2">
            <div 
              v-for="(step, index) in steps" 
              :key="`label-${step.id}`"
              class="text-center flex-1"
              
            >
              <p 
                class="text-sm transition-colors"
                :class="currentStep >= index ? 'text-foreground' : 'text-muted-foreground'"
              >
                {{ t(step.label) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Step Content -->
        <div class="min-h-[400px]">
          <!-- Step 1: Upload -->
          <div v-if="currentStep === 0" class="step-content">
            <div class="text-center">
              <Icon name="lucide:upload-cloud" class="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 class="text-lg font-semibold mb-2">
                {{ t('expense.import.steps.upload.title') }}
              </h3>
              <p class="text-muted-foreground mb-6">
                {{ t('expense.import.steps.upload.description') }}
              </p>
              
              <!-- File Upload Area -->
              <div 
                class="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 hover:border-primary/50 transition-colors cursor-pointer"
                @click="selectFile"
                @dragover.prevent
                @drop.prevent="handleFileDrop"
              >
                <input 
                  ref="fileInput"
                  type="file"
                  accept=".csv"
                  class="hidden"
                  @change="handleFileSelect"
                />
                
                <Icon name="lucide:file-text" class="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p class="font-medium mb-2">
                  {{ t('expense.import.steps.upload.dropzone') }}
                </p>
                <p class="text-sm text-muted-foreground">
                  {{ t('expense.import.steps.upload.fileType') }}
                </p>
              </div>
              
              <!-- Selected File -->
              <div v-if="selectedFile" class="mt-4 p-4 bg-muted rounded-lg">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <Icon name="lucide:file-text" class="w-5 h-5 text-muted-foreground" />
                    <div class="text-left">
                      <p class="font-medium">{{ selectedFile.name }}</p>
                      <p class="text-sm text-muted-foreground">
                        {{ formatFileSize(selectedFile.size) }}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    @click="removeFile"
                  >
                    <Icon name="lucide:x" class="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 2: Preview -->
          <div v-else-if="currentStep === 1" class="step-content">
            <h3 class="text-lg font-semibold mb-4">
              {{ t('expense.import.steps.preview.title') }}
            </h3>
            
            <!-- Preview Table -->
            <div class="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{{ t('expense.form.fields.date') }}</TableHead>
                    <TableHead>{{ t('expense.form.fields.category') }}</TableHead>
                    <TableHead>{{ t('expense.form.fields.description') }}</TableHead>
                    <TableHead class="text-right">{{ t('expense.form.fields.incomeAmount') }}</TableHead>
                    <TableHead class="text-right">{{ t('expense.form.fields.expenseAmount') }}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="(row, index) in previewData" :key="index">
                    <TableCell>{{ row.date }}</TableCell>
                    <TableCell>{{ row.category }}</TableCell>
                    <TableCell>{{ row.description }}</TableCell>
                    <TableCell class="text-right">{{ formatCurrency(row.incomeAmount) }}</TableCell>
                    <TableCell class="text-right">{{ formatCurrency(row.expenseAmount) }}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            
            <div class="mt-4 p-4 bg-muted rounded-lg">
              <p class="text-sm">
                {{ t('expense.import.steps.preview.summary', { count: previewData.length }) }}
              </p>
            </div>
          </div>

          <!-- Step 3: Mapping -->
          <div v-else-if="currentStep === 2" class="step-content">
            <h3 class="text-lg font-semibold mb-4">
              {{ t('expense.import.steps.mapping.title') }}
            </h3>
            <p class="text-muted-foreground mb-6">
              {{ t('expense.import.steps.mapping.description') }}
            </p>
            
            <!-- Column Mapping -->
            <div class="space-y-4">
              <div v-for="field in mappingFields" :key="field.id" class="grid grid-cols-2 gap-4 items-center">
                <Label>{{ t(field.label) }}</Label>
                <Select v-model="columnMapping[field.id]">
                  <SelectTrigger>
                    <SelectValue :placeholder="t('expense.import.steps.mapping.selectColumn')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem :value="null">{{ t('common.none') }}</SelectItem>
                    <SelectItem v-for="col in csvColumns" :key="col" :value="col">
                      {{ col }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <!-- Step 4: Result -->
          <div v-else-if="currentStep === 3" class="step-content">
            <div class="text-center">
              <Icon 
                :name="importSuccess ? 'lucide:check-circle' : 'lucide:x-circle'" 
                class="w-16 h-16 mx-auto mb-4"
                :class="importSuccess ? 'text-green-600' : 'text-destructive'"
              />
              <h3 class="text-lg font-semibold mb-2">
                {{ importSuccess 
                  ? t('expense.import.steps.result.success') 
                  : t('expense.import.steps.result.error') 
                }}
              </h3>
              <p class="text-muted-foreground mb-6">
                {{ importSuccess 
                  ? t('expense.import.steps.result.successMessage', { count: importedCount })
                  : importErrorMessage
                }}
              </p>
              
              <div class="flex gap-3 justify-center">
                <Button 
                  variant="outline"
                  @click="resetImport"
                >
                  {{ t('expense.import.actions.importAnother') }}
                </Button>
                <NuxtLink to="/expenses">
                  <Button>
                    {{ t('expense.import.actions.viewExpenses') }}
                  </Button>
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="flex justify-between mt-8">
          <Button 
            variant="outline"
            :disabled="currentStep === 0 || processing"
            @click="previousStep"
          >
            {{ t('common.previous') }}
          </Button>
          
          <Button 
            :disabled="!canProceed || processing"
            @click="nextStep"
          >
            <Icon v-if="processing" name="lucide:loader-2" class="w-4 h-4 mr-2 animate-spin" />
            {{ currentStep === steps.length - 1 
              ? t('common.finish') 
              : t('common.next') 
            }}
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '~/foundation/components/ui/breadcrumb'
import { Card, CardContent } from '~/foundation/components/ui/card'
import { Button } from '~/foundation/components/ui/button/index'
import { Label } from '~/foundation/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/foundation/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/foundation/components/ui/table'
import { Icon } from '#components'

import authMiddleware from '~/middleware/auth'

defineOptions({
  name: 'ExpenseImport'
})

// Meta
definePageMeta({
  title: 'expense.import.title',
  middleware: [authMiddleware]
})

// Composables
const { t } = useI18n()
const NuxtLink = resolveComponent('NuxtLink')

// Import wizard steps
const steps = [
  { id: 'upload', label: 'expense.import.steps.upload.label' },
  { id: 'preview', label: 'expense.import.steps.preview.label' },
  { id: 'mapping', label: 'expense.import.steps.mapping.label' },
  { id: 'result', label: 'expense.import.steps.result.label' }
]

// State
const currentStep = ref(0)
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement>()
const processing = ref(false)
interface IPreviewData {
  date: string
  category: string
  description: string
  incomeAmount: number
  expenseAmount: number
  memo?: string
}

const previewData = ref<IPreviewData[]>([])
const csvColumns = ref<string[]>([])
const columnMapping = ref<Record<string, string>>({})
const importSuccess = ref(false)
const importedCount = ref(0)
const importErrorMessage = ref('')

// Mapping fields
const mappingFields = [
  { id: 'date', label: 'expense.form.fields.date', required: true },
  { id: 'category', label: 'expense.form.fields.category', required: true },
  { id: 'description', label: 'expense.form.fields.description', required: true },
  { id: 'incomeAmount', label: 'expense.form.fields.incomeAmount', required: false },
  { id: 'expenseAmount', label: 'expense.form.fields.expenseAmount', required: false },
  { id: 'memo', label: 'expense.form.fields.memo', required: false }
]

// Computed
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0: return Boolean(selectedFile.value)
    case 1: return previewData.value.length > 0
    case 2: return validateMapping()
    case 3: return true
    default: return false
  }
})

// Methods
const getStepClass = (index: number) => {
  if (currentStep.value > index) {
    return 'bg-primary border-primary text-primary-foreground'
  } else if (currentStep.value === index) {
    return 'bg-background border-primary text-primary'
  } else {
    return 'bg-background border-muted text-muted-foreground'
  }
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

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY'
  }).format(amount)
}

const selectFile = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    selectedFile.value = input.files[0]
  }
}

const handleFileDrop = (event: DragEvent) => {
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    const file = event.dataTransfer.files[0]
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      selectedFile.value = file
    }
  }
}

const removeFile = () => {
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const validateMapping = (): boolean => {
  const requiredFields = mappingFields.filter(f => f.required)
  return requiredFields.every(field => columnMapping.value[field.id])
}

const parseCSV = async () => {
  // Mock CSV parsing
  processing.value = true
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock data
    csvColumns.value = ['日付', '科目', '摘要', '収入金額', '支出金額', '備考']
    previewData.value = [
      {
        date: '2025-08-01',
        category: '交通費',
        description: '新幹線代 東京-大阪',
        incomeAmount: 0,
        expenseAmount: 15000
      },
      {
        date: '2025-08-02',
        category: '飲食費',
        description: 'クライアント会食',
        incomeAmount: 0,
        expenseAmount: 8000
      },
      {
        date: '2025-08-03',
        category: '事務用品',
        description: 'プリンター用紙',
        incomeAmount: 0,
        expenseAmount: 3000
      }
    ]
    
    // Auto-map columns
    columnMapping.value = {
      date: '日付',
      category: '科目',
      description: '摘要',
      incomeAmount: '収入金額',
      expenseAmount: '支出金額',
      memo: '備考'
    }
  } finally {
    processing.value = false
  }
}

const importData = async () => {
  processing.value = true
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    importSuccess.value = true
    importedCount.value = previewData.value.length
  } catch {
    importSuccess.value = false
    importErrorMessage.value = t('expense.import.errors.importFailed')
  } finally {
    processing.value = false
  }
}

const nextStep = async () => {
  if (currentStep.value === 0 && selectedFile.value) {
    await parseCSV()
  } else if (currentStep.value === 2) {
    await importData()
  }
  
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const resetImport = () => {
  currentStep.value = 0
  selectedFile.value = null
  previewData.value = []
  csvColumns.value = []
  columnMapping.value = {}
  importSuccess.value = false
  importedCount.value = 0
  importErrorMessage.value = ''
}

// SEO
useSeoMeta({
  title: t('expense.import.title'),
  description: t('expense.import.description')
})
</script>

<style scoped>
.expense-import-page {
  @apply container mx-auto px-4 py-6 max-w-4xl;
}

.step-content {
  @apply animate-in fade-in-0 duration-300;
}

@media (max-width: 640px) {
  .expense-import-page {
    @apply px-2 py-4;
  }
}
</style>
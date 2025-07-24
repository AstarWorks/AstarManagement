<!--
  Comprehensive Expense Entry Form
  
  @description Advanced expense entry form with validation, receipt upload,
  matter association, and approval workflow integration. Follows established
  VeeValidate + Zod patterns with shadcn-vue components.
  
  @author Claude
  @created 2025-07-03
  @task T01_S14 - Expense Entry Form
-->

<template>
  <div class="expense-form">
    <!-- Form Header -->
    <header class="form-header">
      <h2 class="form-title">
        {{ mode === 'create' ? 'Create New Expense' : 'Edit Expense' }}
      </h2>
      <div v-if="error" class="error-banner" role="alert">
        {{ error }}
      </div>
    </header>

    <!-- Main Form -->
    <form @submit.prevent="onSubmit" class="form-content" novalidate>
      <fieldset :disabled="readonly || isSubmitting" class="form-fieldset">
        <legend class="sr-only">Expense Information</legend>

        <!-- Basic Information Section -->
        <div class="form-section">
          <h3 class="section-title">Basic Information</h3>
          
          <!-- Description Field -->
          <FormField v-slot="{ componentField }" name="description">
            <FormItem>
              <FormLabel class="required">Description</FormLabel>
              <FormControl>
                <Input
                  v-bind="componentField"
                  type="text"
                  placeholder="Enter expense description"
                  class="form-input"
                  aria-describedby="description-help"
                />
              </FormControl>
              <FormDescription id="description-help">
                Provide a clear description of the expense (3-500 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          </FormField>

          <!-- Amount and Currency Row -->
          <div class="form-row">
            <FormField v-slot="{ componentField }" name="amount">
              <FormItem class="flex-1">
                <FormLabel class="required">Amount</FormLabel>
                <FormControl>
                  <Input
                    v-bind="componentField"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="1000000"
                    placeholder="0.00"
                    class="form-input"
                    @input="handleAmountChange"
                  />
                </FormControl>
                <!-- Real-time conversion display -->
                <FormDescription v-if="conversionInfo && conversionInfo.convertedCurrency !== currency">
                  <div class="conversion-info">
                    <span class="text-sm">
                      ≈ {{ formatCurrency(conversionInfo.convertedAmount, conversionInfo.convertedCurrency) }}
                    </span>
                    <span class="text-xs text-muted-foreground ml-2">
                      (Rate: {{ conversionInfo.exchangeRate.toFixed(4) }})
                    </span>
                  </div>
                </FormDescription>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="currency">
              <FormItem class="flex-1">
                <FormLabel>Currency</FormLabel>
                <Select v-bind="componentField" @update:model-value="handleCurrencyChange">
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectGroup v-for="group in currencyGroups" :key="group.label">
                      <SelectLabel>{{ group.label }}</SelectLabel>
                      <SelectItem 
                        v-for="currencyCode in group.currencies" 
                        :key="currencyCode"
                        :value="currencyCode"
                        :disabled="!isCurrencyAvailable(currencyCode)"
                      >
                        <div class="flex items-center gap-2">
                          <span class="font-medium">{{ getCurrencySymbol(currencyCode) }}</span>
                          <span>{{ currencyCode }} - {{ getCurrencyName(currencyCode) }}</span>
                          <Badge v-if="!isRateAvailable(currencyCode)" variant="outline" class="ml-auto text-xs">
                            Offline
                          </Badge>
                        </div>
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FormDescription v-if="ratesError">
                  <span class="text-amber-600">
                    <Icon name="AlertTriangle" class="w-3 h-3 inline mr-1" />
                    Using cached exchange rates
                  </span>
                </FormDescription>
                <FormMessage />
              </FormItem>
            </FormField>
          </div>

          <!-- Exchange Rate Status -->
          <div v-if="exchangeRateStatus" class="exchange-rate-status">
            <div class="flex items-center gap-2 text-sm">
              <Icon 
                :name="exchangeRateStatus.icon" 
                :class="['w-4 h-4', exchangeRateStatus.iconClass]" 
              />
              <span :class="exchangeRateStatus.textClass">
                {{ exchangeRateStatus.message }}
              </span>
              <Button
                v-if="exchangeRateStatus.showRefresh"
                type="button"
                variant="ghost"
                size="sm"
                @click="refreshExchangeRates"
                :disabled="ratesLoading"
              >
                <Icon name="RefreshCw" :class="['w-3 h-3', { 'animate-spin': ratesLoading }]" />
              </Button>
            </div>
          </div>

          <!-- Expense Date -->
          <FormField v-slot="{ componentField }" name="expenseDate">
            <FormItem>
              <FormLabel class="required">Expense Date</FormLabel>
              <FormControl>
                <Input
                  v-bind="componentField"
                  type="date"
                  :max="todayString"
                  class="form-input"
                />
              </FormControl>
              <FormDescription>
                Date when the expense was incurred (cannot be future date)
              </FormDescription>
              <FormMessage />
            </FormItem>
          </FormField>

          <!-- Expense Type -->
          <FormField v-slot="{ componentField }" name="expenseType">
            <FormItem>
              <FormLabel class="required">Expense Category</FormLabel>
              <Select v-bind="componentField" @update:model-value="handleExpenseTypeChange">
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select expense category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectGroup v-for="group in expenseTypeGroups" :key="group.label">
                    <SelectLabel>{{ group.label }}</SelectLabel>
                    <SelectItem 
                      v-for="category in group.categories" 
                      :key="category.type"
                      :value="category.type"
                    >
                      <div class="flex items-center gap-2">
                        <Icon :name="category.icon" class="w-4 h-4" />
                        <span>{{ category.label }}</span>
                      </div>
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FormDescription v-if="selectedCategory">
                {{ selectedCategory.description }}
              </FormDescription>
              <FormMessage />
            </FormItem>
          </FormField>
        </div>

        <!-- Matter Association Section -->
        <div class="form-section">
          <h3 class="section-title">Matter Association</h3>
          
          <FormField v-slot="{ componentField }" name="matterId">
            <FormItem>
              <FormLabel>Associated Matter (Optional)</FormLabel>
              <Select v-bind="componentField">
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select matter (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">
                    <span class="text-muted-foreground">No matter association</span>
                  </SelectItem>
                  <SelectItem 
                    v-for="matter in availableMatters" 
                    :key="matter.id"
                    :value="matter.id"
                  >
                    <div class="flex flex-col">
                      <span class="font-medium">{{ matter.title }}</span>
                      <span class="text-sm text-muted-foreground">{{ matter.client?.name }}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Associate this expense with a specific legal matter
              </FormDescription>
              <FormMessage />
            </FormItem>
          </FormField>
        </div>

        <!-- Receipt Upload Section -->
        <div class="form-section">
          <h3 class="section-title">
            Receipt Upload
            <Badge v-if="receiptRequired" variant="destructive" class="ml-2">Required</Badge>
            <Badge v-else variant="secondary" class="ml-2">Optional</Badge>
          </h3>

          <FormField v-slot="{ componentField }" name="receiptFile">
            <FormItem>
              <FormLabel :class="{ required: receiptRequired }">Receipt File</FormLabel>
              <FormControl>
                <div class="receipt-upload-area">
                  <input
                    ref="fileInput"
                    type="file"
                    accept="image/*,.pdf"
                    class="sr-only"
                    @change="handleFileUpload"
                  />
                  
                  <!-- Upload Area -->
                  <div 
                    v-if="!receiptPreview"
                    class="upload-dropzone"
                    @click="triggerFileSelect"
                    @dragover.prevent
                    @drop.prevent="handleFileDrop"
                  >
                    <Icon name="Upload" class="w-8 h-8 text-muted-foreground mb-2" />
                    <p class="text-sm text-muted-foreground mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p class="text-xs text-muted-foreground">
                      Supports JPEG, PNG, WebP, PDF (max 10MB)
                    </p>
                  </div>

                  <!-- Receipt Preview -->
                  <div v-else class="receipt-preview">
                    <div class="preview-header">
                      <span class="preview-filename">{{ receiptFile?.name }}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        @click="removeReceipt"
                      >
                        <Icon name="X" class="w-4 h-4" />
                      </Button>
                    </div>
                    <div class="preview-content">
                      <img 
                        v-if="receiptPreview && receiptFile?.type.startsWith('image/')"
                        :src="receiptPreview"
                        :alt="receiptFile?.name"
                        class="preview-image"
                      />
                      <div v-else class="pdf-preview">
                        <Icon name="FileText" class="w-12 h-12 text-muted-foreground" />
                        <span class="text-sm text-muted-foreground">PDF File</span>
                      </div>
                    </div>
                  </div>
                </div>
              </FormControl>
              <FormDescription v-if="receiptRequired">
                Receipt is required for this expense type or amount
              </FormDescription>
              <FormMessage />
            </FormItem>
          </FormField>
        </div>

        <!-- Billing Information Section -->
        <div class="form-section">
          <h3 class="section-title">Billing Information</h3>

          <FormField v-slot="{ componentField }" name="billable">
            <FormItem class="flex items-center space-x-2">
              <FormControl>
                <Checkbox v-bind="componentField" />
              </FormControl>
              <FormLabel class="text-sm font-normal">
                This expense is billable to the client
              </FormLabel>
            </FormItem>
            <FormDescription>
              Check if this expense should be billed to the client
            </FormDescription>
          </FormField>
        </div>

        <!-- Additional Notes Section -->
        <div class="form-section">
          <h3 class="section-title">Additional Information</h3>

          <FormField v-slot="{ componentField }" name="notes">
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  v-bind="componentField"
                  placeholder="Additional notes or details about this expense"
                  rows="3"
                  class="form-textarea"
                />
              </FormControl>
              <FormDescription>
                Optional additional information (max 1000 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          </FormField>
        </div>
      </fieldset>

      <!-- Form Actions -->
      <footer class="form-actions">
        <Button
          type="button"
          variant="outline"
          @click="handleCancel"
          :disabled="isSubmitting"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          :disabled="!canSubmit"
          :aria-busy="isSubmitting"
        >
          <Icon v-if="isSubmitting" name="Loader2" class="w-4 h-4 mr-2 animate-spin" />
          {{ submitButtonText }}
        </Button>
      </footer>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useToast } from '~/composables/useToast'
import { useMatters } from '~/composables/useMatters'
import { useCurrency } from '~/composables/useCurrency'
import { expenseCreateSchema, type ExpenseCreateForm } from '~/schemas/expense'
import { EXPENSE_CATEGORIES, calculateApprovalPriority } from '~/types/expense'
import type { Expense, ExpenseCreateInput, ExpenseType } from '~/types/expense'
import type { Matter } from '~/types/matter'
import { SUPPORTED_CURRENCIES, CURRENCY_GROUPS } from '~/types/currency'

// Component Props
interface Props {
  /** Existing expense for editing */
  expense?: Expense
  /** Form mode */
  mode?: 'create' | 'edit'
  /** Initial values */
  initialValues?: Partial<ExpenseCreateForm>
  /** Read-only mode */
  readonly?: boolean
  /** Pre-selected matter */
  matterId?: string
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create',
  readonly: false
})

// Component Emits
const emit = defineEmits<{
  save: [expense: Expense]
  cancel: []
  validationChange: [isValid: boolean]
}>()

// Composables
const { showToast } = useToast()
const { matters } = useMatters(ref({ page: 1, limit: 100 }))
const { 
  exchangeRates,
  supportedCurrencies,
  isOnline,
  hasValidRates,
  ratesLoading,
  ratesError,
  convertAmount,
  formatCurrency,
  refetchRates
} = useCurrency({
  baseCurrency: 'JPY',
  enableOfflineCache: true
})

// Form Setup
const { handleSubmit, defineField, errors, meta, setValues } = useForm({
  validationSchema: toTypedSchema(expenseCreateSchema),
  initialValues: {
    currency: 'JPY',
    billable: true,
    description: '',
    amount: 0,
    notes: '',
    matterId: props.matterId || '',
    ...props.initialValues,
    // Ensure expenseDate is always a string
    expenseDate: props.initialValues?.expenseDate instanceof Date
      ? props.initialValues.expenseDate.toISOString().split('T')[0]
      : props.initialValues?.expenseDate || new Date().toISOString().split('T')[0]
  }
})

// Form Fields
const [description] = defineField('description')
const [amount] = defineField('amount')
const [currency] = defineField('currency')
const [expenseDate] = defineField('expenseDate')
const [expenseType] = defineField('expenseType')
const [matterId] = defineField('matterId')
const [billable] = defineField('billable')
const [notes] = defineField('notes')

// Local State
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const fileInput = ref<HTMLInputElement>()
const receiptFile = ref<File | null>(null)
const receiptPreview = ref<string | null>(null)

// Computed Properties
const canSubmit = computed(() => 
  meta.value.valid && !isSubmitting.value && (!receiptRequired.value || receiptFile.value)
)

const submitButtonText = computed(() => {
  if (isSubmitting.value) return 'Saving...'
  return props.mode === 'create' ? 'Create Expense' : 'Update Expense'
})

const todayString = computed(() => {
  return new Date().toISOString().split('T')[0]
})

const selectedCategory = computed(() => {
  return expenseType.value ? EXPENSE_CATEGORIES[expenseType.value as ExpenseType] : null
})

const receiptRequired = computed(() => {
  if (!expenseType.value) return false
  
  const category = EXPENSE_CATEGORIES[expenseType.value as ExpenseType]
  const highValueThreshold = 20000
  
  return category.requiresReceipt || (amount.value && amount.value > highValueThreshold)
})

const availableMatters = computed(() => {
  return matters.value || []
})

// Currency-related computed properties
const currencyGroups = computed(() => CURRENCY_GROUPS)

const conversionInfo = computed(() => {
  if (!amount.value || !currency.value || currency.value === 'JPY') return null
  
  return convertAmount(amount.value, currency.value, 'JPY')
})

const exchangeRateStatus = computed(() => {
  if (!hasValidRates.value) {
    return {
      icon: 'AlertCircle',
      iconClass: 'text-destructive',
      textClass: 'text-destructive',
      message: 'Exchange rates unavailable',
      showRefresh: true
    }
  }
  
  if (ratesError.value) {
    return {
      icon: 'AlertTriangle',
      iconClass: 'text-amber-500',
      textClass: 'text-amber-700',
      message: 'Using cached exchange rates',
      showRefresh: true
    }
  }
  
  if (!isOnline.value) {
    return {
      icon: 'WifiOff',
      iconClass: 'text-amber-500',
      textClass: 'text-amber-700',
      message: 'Offline mode - using cached rates',
      showRefresh: false
    }
  }
  
  return null
})

const getCurrencySymbol = (code: string) => {
  return SUPPORTED_CURRENCIES[code]?.symbol || code
}

const getCurrencyName = (code: string) => {
  return SUPPORTED_CURRENCIES[code]?.name || code
}

const isCurrencyAvailable = (code: string) => {
  return supportedCurrencies.value?.some(c => c.code === code) ?? true
}

const isRateAvailable = (code: string) => {
  if (code === 'JPY') return true
  return exchangeRates.value?.some(rate => 
    (rate.fromCurrency === code && rate.toCurrency === 'JPY') ||
    (rate.fromCurrency === 'JPY' && rate.toCurrency === code)
  ) ?? false
}

// Expense Type Grouping
const expenseTypeGroups = computed(() => [
  {
    label: 'Legal & Court',
    categories: [
      EXPENSE_CATEGORIES.COURT_FEES,
      EXPENSE_CATEGORIES.FILING_FEES,
      EXPENSE_CATEGORIES.EXPERT_WITNESS,
      EXPENSE_CATEGORIES.RESEARCH
    ]
  },
  {
    label: 'Travel & Accommodation',
    categories: [
      EXPENSE_CATEGORIES.TRAVEL,
      EXPENSE_CATEGORIES.ACCOMMODATION,
      EXPENSE_CATEGORIES.MEALS
    ]
  },
  {
    label: 'Office & Communication',
    categories: [
      EXPENSE_CATEGORIES.COPYING,
      EXPENSE_CATEGORIES.POSTAGE,
      EXPENSE_CATEGORIES.TELEPHONE,
      EXPENSE_CATEGORIES.OTHER
    ]
  }
])

// Methods
const handleAmountChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = parseFloat(target.value)
  if (!isNaN(value)) {
    amount.value = Math.round(value * 100) / 100
  }
}

const handleExpenseTypeChange = (type: string) => {
  const category = EXPENSE_CATEGORIES[type as keyof typeof EXPENSE_CATEGORIES]
  if (category) {
    billable.value = category.defaultBillable
  }
}

const handleCurrencyChange = (newCurrency: string) => {
  currency.value = newCurrency as "JPY" | "USD" | "EUR" | "GBP" | "KRW" | "CNY" | "SGD"
  
  // Show conversion information if rates are available
  if (amount.value && newCurrency !== 'JPY') {
    const conversion = convertAmount(amount.value, newCurrency, 'JPY')
    if (conversion) {
      showToast(
        `${formatCurrency(amount.value, newCurrency)} ≈ ${formatCurrency(conversion.convertedAmount, 'JPY')}`,
        'success'
      )
    }
  }
}

const refreshExchangeRates = async () => {
  try {
    await refetchRates()
    showToast('Exchange rates updated', 'success')
  } catch (error) {
    showToast('Failed to update exchange rates', 'error')
  }
}

const triggerFileSelect = () => {
  fileInput.value?.click()
}

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    setReceiptFile(file)
  }
}

const handleFileDrop = (event: DragEvent) => {
  const file = event.dataTransfer?.files[0]
  if (file) {
    setReceiptFile(file)
  }
}

const setReceiptFile = (file: File) => {
  receiptFile.value = file
  
  if (file.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = (e) => {
      receiptPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  } else {
    receiptPreview.value = 'pdf'
  }
}

const removeReceipt = () => {
  receiptFile.value = null
  receiptPreview.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const onSubmit = handleSubmit(async (values: ExpenseCreateForm) => {
  if (!canSubmit.value) return
  
  isSubmitting.value = true
  error.value = null
  
  try {
    const formData: ExpenseCreateInput = {
      ...values,
      receiptFile: receiptFile.value || undefined
    }
    
    // Here you would call your expense creation/update API
    // For now, we'll emit the save event
    const expense = {
      ...formData,
      id: props.expense?.id || `expense-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'current-user-id', // From auth context
      updatedBy: 'current-user-id'
    } as Expense
    
    emit('save', expense)
    
    showToast(
      props.mode === 'create' ? 'Expense created successfully' : 'Expense updated successfully',
      'success'
    )
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to save expense'
    showToast('Failed to save expense', 'error')
  } finally {
    isSubmitting.value = false
  }
})

const handleCancel = () => {
  if (meta.value.dirty) {
    if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
      emit('cancel')
    }
  } else {
    emit('cancel')
  }
}

// Watchers
watch(() => meta.value.valid, (valid) => {
  emit('validationChange', valid)
}, { immediate: true })

// Lifecycle
onMounted(async () => {
  // Load available matters for selection
  // await fetchUserMatters() // Matters are automatically loaded by useMatters
  
  // If editing, populate form with existing data
  if (props.expense && props.mode === 'edit') {
    setValues({
      description: props.expense.description,
      amount: props.expense.amount,
      currency: props.expense.currency,
      expenseDate: (props.expense.expenseDate instanceof Date 
        ? props.expense.expenseDate.toISOString().split('T')[0]
        : props.expense.expenseDate) as string,
      expenseType: props.expense.expenseType,
      matterId: props.expense.matterId || '',
      billable: props.expense.billable,
      notes: props.expense.notes || ''
    })
  }
})
</script>

<style scoped>
.expense-form {
  max-width: 800px;
  margin: 0 auto;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  overflow: hidden;
}

.form-header {
  padding: 1.5rem;
  border-bottom: 1px solid hsl(var(--border));
  background: hsl(var(--muted) / 0.5);
}

.form-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.error-banner {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: hsl(var(--destructive) / 0.1);
  border: 1px solid hsl(var(--destructive) / 0.3);
  border-radius: calc(var(--radius) - 2px);
  color: hsl(var(--destructive));
  font-size: 0.875rem;
}

.form-content {
  padding: 1.5rem;
}

.form-fieldset {
  border: none;
  margin: 0;
  padding: 0;
}

.form-fieldset:disabled {
  opacity: 0.6;
  pointer-events: none;
}

.form-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid hsl(var(--border));
  color: hsl(var(--foreground));
  display: flex;
  align-items: center;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.required::after {
  content: ' *';
  color: hsl(var(--destructive));
}

.receipt-upload-area {
  border: 2px dashed hsl(var(--border));
  border-radius: var(--radius);
  overflow: hidden;
}

.upload-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.upload-dropzone:hover {
  border-color: hsl(var(--primary));
  background: hsl(var(--muted) / 0.5);
}

.receipt-preview {
  padding: 1rem;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.preview-filename {
  font-size: 0.875rem;
  font-weight: 500;
  color: hsl(var(--foreground));
}

.preview-content {
  display: flex;
  justify-content: center;
}

.preview-image {
  max-width: 100%;
  max-height: 200px;
  border-radius: calc(var(--radius) - 2px);
  object-fit: contain;
}

.pdf-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem;
}

.conversion-info {
  display: flex;
  align-items: center;
  margin-top: 0.25rem;
  padding: 0.5rem;
  background: hsl(var(--muted) / 0.5);
  border-radius: calc(var(--radius) - 2px);
  border: 1px solid hsl(var(--border));
}

.exchange-rate-status {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: hsl(var(--muted) / 0.3);
  border-radius: calc(var(--radius) - 2px);
  border: 1px solid hsl(var(--border));
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid hsl(var(--border));
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 768px) {
  .expense-form {
    margin: 0;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
  
  .form-row {
    flex-direction: column;
    gap: 0;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>
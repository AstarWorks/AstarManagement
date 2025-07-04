<!--
  Mobile-Optimized Expense Entry Form
  
  @description Mobile-first expense entry form optimized for touch interfaces,
  camera integration, and offline capability. Provides large touch targets,
  intuitive interactions, and streamlined mobile workflows.
  
  @author Claude
  @created 2025-07-03
  @task T08_S14 - Mobile Optimization for Financial Features
-->

<template>
  <div class="expense-form-mobile">
    <!-- Mobile-optimized header -->
    <header class="sticky top-0 z-50 bg-background border-b px-4 py-3 flex items-center justify-between">
      <Button variant="ghost" size="sm" @click="$emit('cancel')" class="flex items-center gap-2">
        <ArrowLeft class="w-4 h-4" />
        Cancel
      </Button>
      <h1 class="font-semibold text-lg">New Expense</h1>
      <Button 
        size="sm" 
        :disabled="!isValid || isSubmitting"
        @click="handleSubmit"
        class="min-w-[60px]"
      >
        <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
        <span v-else>Save</span>
      </Button>
    </header>

    <!-- Mobile-optimized form -->
    <form @submit.prevent="onSubmit" class="p-4 space-y-6 pb-20">
      <!-- Large touch-friendly amount input -->
      <div class="amount-input-mobile">
        <FormField v-slot="{ componentField }" name="amount">
          <FormItem>
            <FormLabel class="text-lg font-semibold">Amount</FormLabel>
            <FormControl>
              <div class="relative">
                <Input
                  v-bind="componentField"
                  type="number"
                  inputmode="decimal"
                  step="0.01"
                  placeholder="0.00"
                  class="text-3xl font-bold h-20 text-center pr-16 text-primary"
                  :class="{ 'border-destructive': errors.amount }"
                />
                <div class="absolute right-4 top-1/2 transform -translate-y-1/2 text-lg font-semibold text-muted-foreground">
                  {{ form.currency }}
                </div>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
      </div>

      <!-- Quick category selection -->
      <div class="category-section">
        <FormField v-slot="{ componentField }" name="expenseType">
          <FormItem>
            <FormLabel class="text-lg font-semibold mb-3 block">Category</FormLabel>
            <FormControl>
              <div class="grid grid-cols-2 gap-3">
                <Button
                  v-for="category in expenseCategories"
                  :key="category.value"
                  type="button"
                  variant="outline"
                  size="lg"
                  class="h-16 flex-col gap-2 touch-friendly"
                  :class="{ 
                    'bg-primary text-primary-foreground border-primary': componentField.modelValue === category.value,
                    'hover:bg-muted': componentField.modelValue !== category.value
                  }"
                  @click="componentField.onChange(category.value)"
                >
                  <component :is="category.icon" class="w-6 h-6" />
                  <span class="text-sm font-medium">{{ category.label }}</span>
                </Button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
      </div>

      <!-- Receipt capture section -->
      <div class="receipt-section">
        <FormField v-slot="{ componentField }" name="receiptFile">
          <FormItem>
            <FormLabel class="text-lg font-semibold mb-3 block">Receipt</FormLabel>
            <FormControl>
              <div v-if="!receiptPreview" class="receipt-capture">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  class="w-full h-32 flex-col gap-3 touch-friendly dashed-border"
                  @click="captureReceipt"
                >
                  <Camera class="w-8 h-8 text-muted-foreground" />
                  <div class="text-center">
                    <p class="font-medium">Take Photo</p>
                    <p class="text-sm text-muted-foreground">Tap to capture receipt</p>
                  </div>
                </Button>
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  class="hidden"
                  @change="handleFileUpload"
                />
              </div>
              <div v-else class="receipt-preview">
                <div class="relative">
                  <img 
                    :src="receiptPreview" 
                    alt="Receipt preview" 
                    class="w-full h-48 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    class="absolute top-2 right-2"
                    @click="removeReceipt"
                  >
                    <X class="w-4 h-4" />
                  </Button>
                </div>
                <p class="text-sm text-muted-foreground mt-2 text-center">
                  Receipt captured successfully
                </p>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
      </div>

      <!-- Description input -->
      <FormField v-slot="{ componentField }" name="description">
        <FormItem>
          <FormLabel class="text-lg font-semibold">Description</FormLabel>
          <FormControl>
            <Input
              v-bind="componentField"
              placeholder="Enter expense description"
              class="h-12 text-lg touch-friendly"
            />
          </FormControl>
          <FormDescription>
            Brief description of the expense
          </FormDescription>
          <FormMessage />
        </FormItem>
      </FormField>

      <!-- Date picker -->
      <FormField v-slot="{ componentField }" name="expenseDate">
        <FormItem>
          <FormLabel class="text-lg font-semibold">Date</FormLabel>
          <FormControl>
            <Input
              v-bind="componentField"
              type="date"
              :max="today"
              class="h-12 text-lg touch-friendly"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <!-- Billable toggle -->
      <div class="billable-section">
        <FormField v-slot="{ componentField }" name="billable">
          <FormItem>
            <div class="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <FormLabel class="text-lg font-semibold">Billable to Client</FormLabel>
                <FormDescription class="mt-1">
                  Include this expense in client billing
                </FormDescription>
              </div>
              <FormControl>
                <Switch 
                  :checked="componentField.modelValue" 
                  @update:checked="componentField.onChange"
                  class="scale-125"
                />
              </FormControl>
            </div>
            <FormMessage />
          </FormItem>
        </FormField>
      </div>

      <!-- Offline status indicator -->
      <div v-if="!isOnline" class="offline-indicator">
        <Alert class="border-orange-500 bg-orange-50">
          <WifiOff class="h-4 w-4" />
          <AlertTitle>Offline Mode</AlertTitle>
          <AlertDescription>
            Expense will be saved locally and synced when connection is restored.
          </AlertDescription>
        </Alert>
      </div>
    </form>

    <!-- Mobile-optimized submit button (fixed at bottom) -->
    <div class="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
      <Button 
        type="submit"
        size="lg"
        class="w-full h-14 text-lg font-semibold touch-friendly"
        :disabled="!isValid || isSubmitting"
        @click="handleSubmit"
      >
        <Loader2 v-if="isSubmitting" class="w-5 h-5 animate-spin mr-2" />
        <span>{{ isSubmitting ? 'Saving...' : 'Save Expense' }}</span>
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { 
  Camera, 
  ArrowLeft, 
  X, 
  Loader2,
  WifiOff,
  Car,
  Utensils,
  Building,
  Scale,
  FileText,
  Copy,
  Mail,
  Phone,
  Search,
  UserCheck,
  MoreHorizontal
} from 'lucide-vue-next'

import { expenseCreateSchema } from '~/schemas/expense'
import { useIsMobile } from '~/composables/useIsMobile'
import { useOfflineQueue } from '~/composables/useOfflineQueue'
import { useToast } from '~/composables/useToast'
import { useExpenses } from '~/composables/useExpenses'
import type { ExpenseType } from '~/types/financial'

// Component Props
interface Props {
  initialValues?: Partial<any>
  matterId?: string
}

const props = withDefaults(defineProps<Props>(), {
  initialValues: () => ({})
})

// Component Emits
const emit = defineEmits<{
  save: [expense: any]
  cancel: []
}>()

// Composables
const { isMobile } = useIsMobile()
const { addToQueue } = useOfflineQueue()
const { showToast } = useToast()
const { createExpense } = useExpenses({ page: 1, limit: 20 })

// Network status
const isOnline = ref(navigator.onLine)

// Form setup
const { handleSubmit, errors, meta, setValues } = useForm({
  validationSchema: toTypedSchema(expenseCreateSchema),
  initialValues: {
    currency: 'JPY',
    billable: true,
    expenseDate: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    expenseType: 'OTHER' as ExpenseType,
    notes: '',
    matterId: props.matterId || '',
    ...props.initialValues
  }
})

// Form fields using useField instead of defineField
const { value: amount } = useField('amount')
const { value: currency } = useField('currency')
const { value: description } = useField('description')
const { value: expenseDate } = useField('expenseDate')
const { value: expenseType } = useField('expenseType')
const { value: billable } = useField('billable')
const { value: receiptFile } = useField('receiptFile')

// Local state
const isSubmitting = ref(false)
const fileInput = ref<HTMLInputElement>()
const receiptPreview = ref<string>()
const receiptFileData = ref<File>()

// Computed properties
const isValid = computed(() => meta.value.valid)
const today = computed(() => new Date().toISOString().split('T')[0])

const form = computed(() => ({
  amount: amount.value,
  currency: currency.value,
  description: description.value,
  expenseDate: expenseDate.value,
  expenseType: expenseType.value,
  billable: billable.value
}))

// Expense categories with icons
const expenseCategories = [
  { value: 'TRAVEL', label: 'Travel', icon: Car },
  { value: 'MEALS', label: 'Meals', icon: Utensils },
  { value: 'ACCOMMODATION', label: 'Hotel', icon: Building },
  { value: 'COURT_FEES', label: 'Court Fees', icon: Scale },
  { value: 'FILING_FEES', label: 'Filing', icon: FileText },
  { value: 'COPYING', label: 'Copying', icon: Copy },
  { value: 'POSTAGE', label: 'Postage', icon: Mail },
  { value: 'TELEPHONE', label: 'Phone', icon: Phone },
  { value: 'RESEARCH', label: 'Research', icon: Search },
  { value: 'EXPERT_WITNESS', label: 'Expert', icon: UserCheck },
  { value: 'OTHER', label: 'Other', icon: MoreHorizontal }
]

// Methods
const captureReceipt = () => {
  if (isMobile.value && 'mediaDevices' in navigator) {
    // Try camera API first for better mobile experience
    navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'environment',
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      } 
    })
      .then(stream => {
        // This would open a camera modal/component
        // For now, fallback to file input
        stream.getTracks().forEach(track => track.stop())
        fileInput.value?.click()
      })
      .catch(() => {
        // Fallback to file input
        fileInput.value?.click()
      })
  } else {
    fileInput.value?.click()
  }
}

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    receiptFileData.value = file
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      receiptPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
    
    // Trigger haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
  }
}

const removeReceipt = () => {
  receiptPreview.value = undefined
  receiptFileData.value = undefined
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const onSubmit = handleSubmit(async (values) => {
  isSubmitting.value = true
  
  try {
    const expenseData = {
      ...values,
      receiptFile: receiptFileData.value
    }

    if (isOnline.value) {
      const newExpense = await createExpense(expenseData)
      emit('save', newExpense)
      showToast('Expense saved successfully', 'success')
    } else {
      // Queue for offline sync
      addToQueue({
        type: 'financial-expense',
        data: expenseData,
        priority: 'high',
        operation: 'create',
        endpoint: '/api/expenses',
        method: 'POST',
        maxRetries: 3
      })
      emit('save', expenseData)
      showToast('Expense saved offline and will sync when connected', 'success')
    }
  } catch (error) {
    console.error('Failed to save expense:', error)
    showToast('Failed to save expense', 'error')
  } finally {
    isSubmitting.value = false
  }
})

// Network status monitoring
onMounted(() => {
  const updateOnlineStatus = () => {
    isOnline.value = navigator.onLine
  }
  
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
  
  return () => {
    window.removeEventListener('online', updateOnlineStatus)
    window.removeEventListener('offline', updateOnlineStatus)
  }
})
</script>

<style scoped>
.expense-form-mobile {
  min-height: 100vh;
  background: hsl(var(--background));
}

.touch-friendly {
  min-height: 44px;
  min-width: 44px;
}

.dashed-border {
  border-style: dashed;
  border-width: 2px;
}

.amount-input-mobile input {
  font-feature-settings: 'tnum';
}

.category-section .grid {
  gap: 0.75rem;
}

.receipt-section {
  margin: 1.5rem 0;
}

.offline-indicator {
  position: sticky;
  bottom: 80px;
  z-index: 40;
}

/* iOS Safari specific optimizations */
@supports (-webkit-touch-callout: none) {
  .expense-form-mobile {
    padding-bottom: env(safe-area-inset-bottom);
  }
  
  .fixed.bottom-0 {
    padding-bottom: calc(1rem + env(safe-area-inset-bottom));
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .touch-friendly {
    border-width: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .animate-spin {
    animation: none;
  }
}
</style>
<template>
  <div class="per-diem-form">
    <!-- Form Header -->
    <header class="form-header">
      <div class="flex items-center justify-between">
        <h2 class="form-title">
          {{ mode === 'create' ? 'Record Per-Diem Entry' : 'Edit Per-Diem Entry' }}
        </h2>
        <div class="flex items-center gap-2">
          <!-- Quick Preset Selector -->
          <select
            v-model="selectedPreset"
            class="preset-select"
            @change="handlePresetChange"
          >
            <option value="">Select Template</option>
            <option
              v-for="preset in presets"
              :key="preset.name"
              :value="preset.name"
            >
              {{ preset.name }}
            </option>
          </select>
        </div>
      </div>
      
      <!-- Error Banner -->
      <div v-if="formError" class="error-banner" role="alert">
        {{ formError }}
      </div>
    </header>

    <!-- Main Form -->
    <form @submit.prevent="onSubmit" class="form-content" novalidate>
      <fieldset :disabled="readonly || isSubmitting" class="form-fieldset">
        <legend class="sr-only">Per-Diem Entry Information</legend>

        <!-- Date Range Section -->
        <section class="form-section">
          <h3 class="section-title">Travel Period</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Start Date -->
            <FormField name="startDate" class="form-group">
              <FormLabel class="form-label required">Start Date</FormLabel>
              <FormControl>
                <Input
                  v-model="startDate"
                  v-bind="startDateAttrs"
                  type="date"
                  class="form-input"
                  required
                />
              </FormControl>
              <FormMessage>{{ errors.startDate }}</FormMessage>
            </FormField>

            <!-- End Date -->
            <FormField name="endDate" class="form-group">
              <FormLabel class="form-label required">End Date</FormLabel>
              <FormControl>
                <Input
                  v-model="endDate"
                  v-bind="endDateAttrs"
                  type="date"
                  class="form-input"
                  required
                />
              </FormControl>
              <FormMessage>{{ errors.endDate }}</FormMessage>
            </FormField>
          </div>

          <!-- Date Range Summary -->
          <div v-if="totalDays > 0" class="date-summary">
            <div class="summary-item">
              <span class="summary-label">Total Days:</span>
              <span class="summary-value">{{ totalDays }} days</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Estimated Total:</span>
              <span class="summary-value text-primary">{{ formatCurrency(estimatedTotal, currencyAmount.currency) }}</span>
            </div>
          </div>
        </section>

        <!-- Location and Purpose Section -->
        <section class="form-section">
          <h3 class="section-title">Trip Details</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Category -->
            <FormField name="category" class="form-group">
              <FormLabel class="form-label required">Category</FormLabel>
              <FormControl>
                <select
                  v-model="category"
                  v-bind="categoryAttrs"
                  class="form-select"
                  required
                  @change="handleCategoryChange"
                >
                  <option value="">Select category</option>
                  <option value="COURT_VISIT">Court Visit</option>
                  <option value="CLIENT_MEETING">Client Meeting</option>
                  <option value="BUSINESS_TRAVEL">Business Travel</option>
                  <option value="CONFERENCE">Conference</option>
                  <option value="SITE_INSPECTION">Site Inspection</option>
                  <option value="DOCUMENT_FILING">Document Filing</option>
                  <option value="OTHER">Other</option>
                </select>
              </FormControl>
              <FormMessage>{{ errors.category }}</FormMessage>
            </FormField>

            <!-- Daily Amount with Currency -->
            <FormCurrencyInput
              v-model="currencyAmount"
              name="dailyAmount"
              label="Daily Allowance"
              description="Enter the daily allowance amount and currency"
              placeholder="Enter daily amount"
              :min="1000"
              :max="50000"
              :available-currencies="['JPY', 'USD', 'EUR']"
              required
              @change="handleCurrencyChange"
            />
            
            <!-- Amount Suggestions -->
            <div v-if="suggestedAmounts.length" class="amount-suggestions">
              <span class="suggestions-label">Suggested:</span>
              <button
                v-for="amount in suggestedAmounts"
                :key="amount"
                type="button"
                class="suggestion-btn"
                @click="handleSuggestedAmount(amount)"
              >
                {{ formatCurrency(amount, currencyAmount.currency) }}
              </button>
            </div>
          </div>

          <!-- Location -->
          <FormField name="location" class="form-group">
            <FormLabel class="form-label required">Location/Destination</FormLabel>
            <FormControl>
              <Input
                v-model="location"
                v-bind="locationAttrs"
                type="text"
                class="form-input"
                placeholder="Tokyo District Court"
                :list="locationSuggestionsId"
                required
              />
              <datalist :id="locationSuggestionsId">
                <option
                  v-for="suggestion in locationSuggestions"
                  :key="suggestion"
                  :value="suggestion"
                />
              </datalist>
            </FormControl>
            <FormMessage>{{ errors.location }}</FormMessage>
          </FormField>

          <!-- Purpose -->
          <FormField name="purpose" class="form-group">
            <FormLabel class="form-label required">Purpose</FormLabel>
            <FormControl>
              <textarea
                v-model="purpose"
                v-bind="purposeAttrs"
                class="form-textarea"
                placeholder="Describe the business purpose of this trip..."
                rows="3"
                required
              />
            </FormControl>
            <FormMessage>{{ errors.purpose }}</FormMessage>
          </FormField>
        </section>

        <!-- Transportation and Accommodation Section -->
        <section class="form-section">
          <h3 class="section-title">Transportation & Accommodation</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Transportation Mode -->
            <FormField name="transportationMode" class="form-group">
              <FormLabel class="form-label">Transportation Mode</FormLabel>
              <FormControl>
                <select
                  v-model="transportationMode"
                  v-bind="transportationModeAttrs"
                  class="form-select"
                >
                  <option value="">Select transportation</option>
                  <option value="TRAIN">Train</option>
                  <option value="CAR">Car</option>
                  <option value="PLANE">Plane</option>
                  <option value="BUS">Bus</option>
                  <option value="TAXI">Taxi</option>
                  <option value="WALKING">Walking</option>
                  <option value="OTHER">Other</option>
                </select>
              </FormControl>
              <FormMessage>{{ errors.transportationMode }}</FormMessage>
            </FormField>

            <!-- Accommodation Required -->
            <FormField name="accommodationRequired" class="form-group">
              <div class="checkbox-field">
                <input
                  v-model="accommodationRequired"
                  v-bind="accommodationRequiredAttrs"
                  type="checkbox"
                  class="form-checkbox"
                  :id="accommodationFieldId"
                />
                <FormLabel :for="accommodationFieldId" class="form-label checkbox-label">
                  Accommodation Required
                </FormLabel>
              </div>
              <FormMessage>{{ errors.accommodationRequired }}</FormMessage>
            </FormField>
          </div>

          <!-- Accommodation Type (shown when accommodation is required) -->
          <div v-if="accommodationRequired" class="accommodation-details">
            <FormField name="accommodationType" class="form-group">
              <FormLabel class="form-label required">Accommodation Type</FormLabel>
              <FormControl>
                <select
                  v-model="accommodationType"
                  v-bind="accommodationTypeAttrs"
                  class="form-select"
                  required
                >
                  <option value="">Select accommodation type</option>
                  <option value="HOTEL">Hotel</option>
                  <option value="RYOKAN">Ryokan</option>
                  <option value="BUSINESS_HOTEL">Business Hotel</option>
                  <option value="GUEST_HOUSE">Guest House</option>
                  <option value="OTHER">Other</option>
                </select>
              </FormControl>
              <FormMessage>{{ errors.accommodationType }}</FormMessage>
            </FormField>
          </div>
        </section>

        <!-- Additional Information Section -->
        <section class="form-section">
          <h3 class="section-title">Additional Information</h3>
          
          <!-- Matter Association -->
          <FormField name="matterId" class="form-group">
            <FormLabel class="form-label">Associated Matter</FormLabel>
            <FormControl>
              <select
                v-model="matterId"
                v-bind="matterIdAttrs"
                class="form-select"
              >
                <option value="">No matter association</option>
                <!-- This would be populated with actual matters -->
                <option value="matter-1">CASE-2024-001 - Client A vs Client B</option>
                <option value="matter-2">CASE-2024-002 - Contract Review</option>
              </select>
            </FormControl>
            <FormMessage>{{ errors.matterId }}</FormMessage>
          </FormField>

          <!-- Notes -->
          <FormField name="notes" class="form-group">
            <FormLabel class="form-label">Additional Notes</FormLabel>
            <FormControl>
              <textarea
                v-model="notes"
                v-bind="notesAttrs"
                class="form-textarea"
                placeholder="Any additional information about this trip..."
                rows="3"
              />
            </FormControl>
            <FormMessage>{{ errors.notes }}</FormMessage>
          </FormField>

          <!-- Billing Options -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField name="isBillable" class="form-group">
              <div class="checkbox-field">
                <input
                  v-model="isBillable"
                  v-bind="isBillableAttrs"
                  type="checkbox"
                  class="form-checkbox"
                  :id="billableFieldId"
                />
                <FormLabel :for="billableFieldId" class="form-label checkbox-label">
                  Billable to Client
                </FormLabel>
              </div>
            </FormField>

            <FormField name="isReimbursable" class="form-group">
              <div class="checkbox-field">
                <input
                  v-model="isReimbursable"
                  v-bind="isReimbursableAttrs"
                  type="checkbox"
                  class="form-checkbox"
                  :id="reimbursableFieldId"
                />
                <FormLabel :for="reimbursableFieldId" class="form-label checkbox-label">
                  Reimbursable Expense
                </FormLabel>
              </div>
            </FormField>
          </div>
        </section>
      </fieldset>

      <!-- Form Actions -->
      <footer class="form-actions">
        <button
          type="button"
          @click="handleCancel"
          class="btn btn-secondary"
          :disabled="isSubmitting"
        >
          Cancel
        </button>
        
        <div class="flex gap-2">
          <!-- Save as Template -->
          <button
            v-if="mode === 'create'"
            type="button"
            @click="saveAsTemplate = !saveAsTemplate"
            class="btn btn-outline"
            :class="{ 'btn-active': saveAsTemplate }"
            :disabled="isSubmitting"
          >
            {{ saveAsTemplate ? 'Saving as Template' : 'Save as Template' }}
          </button>
          
          <!-- Submit -->
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="!canSubmit"
            :aria-busy="isSubmitting"
          >
            <span v-if="isSubmitting" class="loading-spinner" aria-hidden="true" />
            {{ submitButtonText }}
          </button>
        </div>
      </footer>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { perDiemEntrySchema, commonPerDiemPresets, type PerDiemEntryForm, type PerDiemPreset, type PerDiemCategory } from '~/schemas/per-diem'
import { usePerDiemManagement } from '~/composables/usePerDiem'
import { FormField, FormLabel, FormControl, FormMessage } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { FormCurrencyInput } from '~/components/forms'
import { formatCurrency } from '~/utils/currencyFormatters'
import type { CurrencyFormValue, CurrencyChangeEvent } from '~/types/currency'

// Props interface
interface Props {
  /** Per-diem ID for editing */
  perDiemId?: string
  /** Initial form values */
  initialValues?: Partial<PerDiemEntryForm>
  /** Form mode - create or edit */
  mode?: 'create' | 'edit'
  /** Whether form is in readonly state */
  readonly?: boolean
  /** Pre-selected matter ID */
  matterId?: string
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create',
  readonly: false
})

// Emit events
const emit = defineEmits<{
  /** Fired when per-diem is successfully saved */
  save: [perDiem: any]
  /** Fired when form is cancelled */
  cancel: []
  /** Fired when form validation state changes */
  validationChange: [isValid: boolean]
}>()

// Composables
const { 
  presets,
  calculateDays,
  calculateTotalAmount,
  applyPreset,
  getCommonLocations,
  getSuggestedAmounts,
  createPerDiem,
  updatePerDiem
} = usePerDiemManagement()

// Simplified validation schema for form fields
const formSchema = z.object({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  location: z.string().min(2, 'Location must be at least 2 characters'),
  purpose: z.string().min(5, 'Purpose must be at least 5 characters'),
  category: z.string().min(1, 'Category is required'),
  dailyAmount: z.number().min(1000, 'Daily amount must be at least ¥1,000'),
  transportationMode: z.string().optional(),
  accommodationRequired: z.boolean(),
  accommodationType: z.string(),
  matterId: z.string().optional(),
  notes: z.string().optional(),
  isBillable: z.boolean(),
  isReimbursable: z.boolean()
})

// Form setup with validation
const { handleSubmit, defineField, errors, meta, setValues } = useForm({
  validationSchema: toTypedSchema(formSchema),
  initialValues: {
    startDate: '',
    endDate: '',
    location: '',
    purpose: '',
    category: '',
    dailyAmount: 8000,
    currency: 'JPY',
    transportationMode: '',
    accommodationRequired: false,
    accommodationType: 'NONE',
    notes: '',
    isBillable: true,
    isReimbursable: false,
    requiresApproval: true,
    ...props.initialValues,
    matterId: props.matterId || props.initialValues?.matterId || ''
  }
})

// Form fields
const [startDate, startDateAttrs] = defineField('startDate')
const [endDate, endDateAttrs] = defineField('endDate')
const [location, locationAttrs] = defineField('location')
const [purpose, purposeAttrs] = defineField('purpose')
const [category, categoryAttrs] = defineField('category')
const [dailyAmount, dailyAmountAttrs] = defineField('dailyAmount')
const [transportationMode, transportationModeAttrs] = defineField('transportationMode')
const [accommodationRequired, accommodationRequiredAttrs] = defineField('accommodationRequired')
const [accommodationType, accommodationTypeAttrs] = defineField('accommodationType')
const [matterId, matterIdAttrs] = defineField('matterId')
const [notes, notesAttrs] = defineField('notes')
const [isBillable, isBillableAttrs] = defineField('isBillable')
const [isReimbursable, isReimbursableAttrs] = defineField('isReimbursable')

// Local state
const isSubmitting = ref(false)
const formError = ref<string | null>(null)
const selectedPreset = ref('')
const saveAsTemplate = ref(false)
const currencyAmount = ref<CurrencyFormValue>({ 
  amount: 8000, 
  currency: 'JPY' 
})

// Generate unique IDs for form elements
const accommodationFieldId = `accommodation-${Math.random().toString(36).substr(2, 9)}`
const billableFieldId = `billable-${Math.random().toString(36).substr(2, 9)}`
const reimbursableFieldId = `reimbursable-${Math.random().toString(36).substr(2, 9)}`
const locationSuggestionsId = `location-suggestions-${Math.random().toString(36).substr(2, 9)}`

// Computed properties
const isFormValid = computed(() => meta.value.valid)
const canSubmit = computed(() => 
  isFormValid.value && !isSubmitting.value && totalDays.value > 0
)

const submitButtonText = computed(() => {
  if (isSubmitting.value) return 'Saving...'
  return props.mode === 'create' ? 'Create Per-Diem Entry' : 'Update Per-Diem Entry'
})

const totalDays = computed(() => {
  if (!startDate.value || !endDate.value) return 0
  return calculateDays(startDate.value, endDate.value)
})

const estimatedTotal = computed(() => {
  if (!currencyAmount.value.amount || totalDays.value <= 0) return 0
  return totalDays.value * Number(currencyAmount.value.amount)
})

const locationSuggestions = computed(() => 
  getCommonLocations(category.value as PerDiemCategory)
)

const suggestedAmounts = computed(() =>
  getSuggestedAmounts(category.value as PerDiemCategory, location.value)
)

// Methods
const handlePresetChange = () => {
  if (!selectedPreset.value) return
  
  const preset = presets.find(p => p.name === selectedPreset.value)
  if (preset) {
    const presetData = applyPreset(preset)
    setValues(presetData)
  }
}

const handleCategoryChange = () => {
  // Reset accommodation type when category changes
  if (category.value !== 'CONFERENCE' && category.value !== 'BUSINESS_TRAVEL') {
    accommodationRequired.value = false
    accommodationType.value = 'NONE'
  }
}

const onSubmit = handleSubmit(async (values: any) => {
  if (!canSubmit.value) return
  
  isSubmitting.value = true
  formError.value = null
  
  try {
    // Convert form data to API format
    const formData = {
      dateRange: {
        startDate: values.startDate,
        endDate: values.endDate
      },
      location: values.location,
      purpose: values.purpose,
      category: values.category,
      dailyAmount: Number(currencyAmount.value.amount),
      currency: currencyAmount.value.currency as 'JPY' | 'USD' | 'EUR',
      matterId: values.matterId || undefined,
      transportationMode: values.transportationMode || undefined,
      accommodationType: values.accommodationType || 'NONE',
      accommodationRequired: values.accommodationRequired || false,
      notes: values.notes || undefined,
      isBillable: values.isBillable || true,
      isReimbursable: values.isReimbursable || false,
      requiresApproval: true,
      saveAsTemplate: saveAsTemplate.value
    }
    
    let result
    if (props.mode === 'create') {
      result = await createPerDiem.mutateAsync(formData)
    } else {
      result = await updatePerDiem.mutateAsync({
        id: props.perDiemId!,
        ...formData
      })
    }
    
    emit('save', result)
  } catch (err) {
    console.error('Per-diem save error:', err)
    formError.value = 'Failed to save per-diem entry. Please try again.'
  } finally {
    isSubmitting.value = false
  }
})

const handleCurrencyChange = (event: CurrencyChangeEvent) => {
  currencyAmount.value = {
    amount: event.amount,
    currency: event.currency
  }
  // Update the form field
  dailyAmount.value = event.amount
}

const handleSuggestedAmount = (amount: number) => {
  currencyAmount.value = {
    amount,
    currency: currencyAmount.value.currency
  }
  dailyAmount.value = amount
}

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
watch(isFormValid, (valid) => {
  emit('validationChange', valid)
}, { immediate: true })

watch([accommodationRequired], () => {
  if (!accommodationRequired.value) {
    accommodationType.value = 'NONE'
  }
})

// Lifecycle
onMounted(() => {
  if (props.perDiemId && props.mode === 'edit') {
    // Load existing per-diem data
    // This would typically be handled by parent component or route
  }
})
</script>

<style scoped>
/* Design system integration with CSS custom properties */
.per-diem-form {
  --form-max-width: 800px;
  --form-spacing: 1.5rem;
  --section-spacing: 2rem;
  --input-height: 2.75rem;
  --border-radius: 0.5rem;
  
  max-width: var(--form-max-width);
  margin: 0 auto;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--border-radius);
  overflow: hidden;
}

.form-header {
  padding: var(--form-spacing);
  border-bottom: 1px solid hsl(var(--border));
  background: hsl(var(--muted) / 0.5);
}

.form-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.preset-select {
  padding: 0.5rem;
  border: 1px solid hsl(var(--border));
  border-radius: calc(var(--border-radius) - 2px);
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-size: 0.875rem;
}

.error-banner {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: hsl(var(--destructive) / 0.1);
  border: 1px solid hsl(var(--destructive) / 0.3);
  border-radius: calc(var(--border-radius) - 2px);
  color: hsl(var(--destructive));
  font-size: 0.875rem;
}

.form-content {
  padding: var(--form-spacing);
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
  margin-bottom: var(--section-spacing);
}

.form-section:last-child {
  margin-bottom: 0;
}

.section-title {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: hsl(var(--foreground));
  border-bottom: 1px solid hsl(var(--border));
  padding-bottom: 0.5rem;
}

.form-group {
  margin-bottom: var(--form-spacing);
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  color: hsl(var(--foreground));
}

.form-label.required::after {
  content: ' *';
  color: hsl(var(--destructive));
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  min-height: var(--input-height);
  padding: 0.75rem;
  border: 1px solid hsl(var(--border));
  border-radius: calc(var(--border-radius) - 2px);
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: hsl(var(--ring));
  box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
}

.form-input.error,
.form-textarea.error,
.form-select.error {
  border-color: hsl(var(--destructive));
}

.form-textarea {
  min-height: auto;
  resize: vertical;
}

.input-with-prefix {
  position: relative;
}

.input-prefix {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: hsl(var(--muted-foreground));
  font-size: 0.875rem;
  pointer-events: none;
}

.date-summary {
  margin-top: 1rem;
  padding: 0.75rem;
  background: hsl(var(--muted) / 0.5);
  border-radius: calc(var(--border-radius) - 2px);
  display: flex;
  gap: 1.5rem;
}

.summary-item {
  display: flex;
  gap: 0.5rem;
}

.summary-label {
  font-weight: 500;
  color: hsl(var(--muted-foreground));
}

.summary-value {
  font-weight: 600;
  color: hsl(var(--foreground));
}

.amount-suggestions {
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.suggestions-label {
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
}

.suggestion-btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border: 1px solid hsl(var(--border));
  border-radius: calc(var(--border-radius) - 4px);
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  cursor: pointer;
  transition: all 0.2s ease;
}

.suggestion-btn:hover {
  background: hsl(var(--muted));
}

.checkbox-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-checkbox {
  width: 1rem;
  height: 1rem;
  margin: 0;
}

.checkbox-label {
  margin-bottom: 0;
  cursor: pointer;
}

.accommodation-details {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid hsl(var(--border));
  border-radius: calc(var(--border-radius) - 2px);
  background: hsl(var(--muted) / 0.25);
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
  margin-top: calc(var(--form-spacing) * 1.5);
  padding-top: var(--form-spacing);
  border-top: 1px solid hsl(var(--border));
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: var(--input-height);
  padding: 0 1.5rem;
  border: 1px solid transparent;
  border-radius: calc(var(--border-radius) - 2px);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}

.btn-primary:hover:not(:disabled) {
  background: hsl(var(--primary) / 0.9);
}

.btn-secondary {
  background: hsl(var(--secondary));
  color: hsl(var(--secondary-foreground));
}

.btn-secondary:hover:not(:disabled) {
  background: hsl(var(--secondary) / 0.8);
}

.btn-outline {
  border: 1px solid hsl(var(--border));
  background: hsl(var(--background));
  color: hsl(var(--foreground));
}

.btn-outline:hover:not(:disabled) {
  background: hsl(var(--muted));
}

.btn-outline.btn-active {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border-color: hsl(var(--primary));
}

.loading-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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

/* Responsive design */
@media (max-width: 768px) {
  .per-diem-form {
    --form-spacing: 1rem;
    margin: 0;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
  
  .date-summary {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .amount-suggestions {
    justify-content: flex-start;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .form-input,
  .form-textarea,
  .form-select,
  .preset-select {
    border-width: 2px;
  }
  
  .btn {
    border-width: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .form-input,
  .form-textarea,
  .form-select,
  .btn,
  .suggestion-btn {
    transition: none;
  }
  
  .loading-spinner {
    animation: none;
  }
}
</style>
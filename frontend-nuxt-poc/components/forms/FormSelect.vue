<template>
  <FormField
    :name="name"
    :label="label"
    :description="description"
    :help-text="helpText"
    :warning="warning"
    :required="required"
    :class="fieldClass"
  >
    <template #default="{ field, fieldId, hasError, isRequired, describedBy }">
      <Select
        :value="field.value"
        :disabled="disabled"
        :required="isRequired"
        @update:value="handleValueChange"
      >
        <SelectTrigger
          :id="fieldId"
          :class="cn(
            hasError && 'border-destructive focus:ring-destructive',
            props.class
          )"
          :aria-describedby="describedBy"
          :aria-invalid="hasError"
        >
          <SelectValue :placeholder="placeholder" />
        </SelectTrigger>
        
        <SelectContent>
          <!-- Empty option -->
          <SelectItem
            v-if="showEmptyOption"
            :value="emptyValue"
            :disabled="!allowEmpty"
          >
            {{ emptyLabel }}
          </SelectItem>

          <!-- Static options -->
          <template v-if="!asyncOptions">
            <SelectItem
              v-for="option in normalizedOptions"
              :key="option.value"
              :value="option.value"
              :disabled="option.disabled"
            >
              <div class="flex items-center gap-2">
                <!-- Option icon if provided -->
                <component
                  v-if="option.icon"
                  :is="option.icon"
                  class="h-4 w-4"
                />
                <!-- Option content -->
                <span>{{ option.label }}</span>
                <!-- Option description -->
                <span
                  v-if="option.description"
                  class="text-xs text-muted-foreground ml-auto"
                >
                  {{ option.description }}
                </span>
              </div>
            </SelectItem>
          </template>

          <!-- Async options -->
          <template v-else>
            <!-- Loading state -->
            <SelectItem
              v-if="isLoading"
              value=""
              disabled
            >
              <div class="flex items-center gap-2">
                <Loader2 class="h-4 w-4 animate-spin" />
                <span>{{ loadingText }}</span>
              </div>
            </SelectItem>

            <!-- Error state -->
            <SelectItem
              v-else-if="loadError"
              value=""
              disabled
            >
              <div class="flex items-center gap-2 text-destructive">
                <AlertCircle class="h-4 w-4" />
                <span>{{ errorText }}</span>
              </div>
            </SelectItem>

            <!-- Loaded options -->
            <SelectItem
              v-else
              v-for="option in asyncLoadedOptions"
              :key="option.value"
              :value="option.value"
              :disabled="option.disabled"
            >
              <div class="flex items-center gap-2">
                <component
                  v-if="option.icon"
                  :is="option.icon"
                  class="h-4 w-4"
                />
                <span>{{ option.label }}</span>
                <span
                  v-if="option.description"
                  class="text-xs text-muted-foreground ml-auto"
                >
                  {{ option.description }}
                </span>
              </div>
            </SelectItem>
          </template>

          <!-- No options available -->
          <SelectItem
            v-if="!isLoading && !loadError && normalizedOptions.length === 0"
            value=""
            disabled
          >
            {{ noOptionsText }}
          </SelectItem>
        </SelectContent>
      </Select>
    </template>
  </FormField>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, type Component } from 'vue'
import { useField } from '~/composables/form/useField'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/ui/select'
import { Loader2, AlertCircle } from 'lucide-vue-next'
import { cn } from '~/lib/utils'

/**
 * Option interface for FormSelect
 */
export interface SelectOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
  icon?: Component
  group?: string
}

/**
 * FormSelect component props
 */
export interface FormSelectProps {
  /** Field name for validation */
  name: string
  /** Field label */
  label?: string
  /** Field description/hint */
  description?: string
  /** Help text */
  helpText?: string
  /** Warning message (non-blocking) */
  warning?: string
  /** Placeholder text */
  placeholder?: string
  /** Whether field is required */
  required?: boolean
  /** Whether field is disabled */
  disabled?: boolean
  /** Static options array */
  options?: SelectOption[]
  /** Whether to show empty option */
  showEmptyOption?: boolean
  /** Empty option label */
  emptyLabel?: string
  /** Empty option value */
  emptyValue?: string
  /** Whether empty selection is allowed */
  allowEmpty?: boolean
  /** Whether to load options asynchronously */
  asyncOptions?: boolean
  /** Function to load options asynchronously */
  loadOptions?: () => Promise<SelectOption[]>
  /** Loading text */
  loadingText?: string
  /** Error text */
  errorText?: string
  /** No options text */
  noOptionsText?: string
  /** Custom CSS classes for the field wrapper */
  fieldClass?: string
  /** Custom CSS classes for the select trigger */
  class?: string
}

const props = withDefaults(defineProps<FormSelectProps>(), {
  options: () => [],
  showEmptyOption: true,
  emptyLabel: 'Select an option...',
  emptyValue: '',
  allowEmpty: true,
  asyncOptions: false,
  loadingText: 'Loading options...',
  errorText: 'Failed to load options',
  noOptionsText: 'No options available'
})

// Field management
const field = useField(props.name)

// Async loading state
const isLoading = ref(false)
const loadError = ref(false)
const asyncLoadedOptions = ref<SelectOption[]>([])

// Normalize options to consistent format
const normalizedOptions = computed((): SelectOption[] => {
  if (props.asyncOptions) {
    return asyncLoadedOptions.value
  }
  
  return props.options.map(option => ({
    value: String(option.value),
    label: option.label,
    description: option.description,
    disabled: option.disabled || false,
    icon: option.icon,
    group: option.group
  }))
})

// Handle value changes
const handleValueChange = (value: string) => {
  // Handle empty value
  if (value === props.emptyValue) {
    field.handleChange(props.allowEmpty ? '' : null)
  } else {
    field.handleChange(value)
  }
}

// Load async options
const loadAsyncOptions = async () => {
  if (!props.asyncOptions || !props.loadOptions) return
  
  isLoading.value = true
  loadError.value = false
  
  try {
    const options = await props.loadOptions()
    asyncLoadedOptions.value = options
  } catch (error) {
    console.error('Failed to load select options:', error)
    loadError.value = true
    asyncLoadedOptions.value = []
  } finally {
    isLoading.value = false
  }
}

// Watch for async option changes
watch(
  () => props.asyncOptions,
  (newValue) => {
    if (newValue) {
      loadAsyncOptions()
    }
  },
  { immediate: true }
)

// Load options on mount if async
onMounted(() => {
  if (props.asyncOptions) {
    loadAsyncOptions()
  }
})

// Expose methods for template refs
defineExpose({
  field,
  loadOptions: loadAsyncOptions,
  refresh: loadAsyncOptions,
  clearError: () => {
    loadError.value = false
  }
})
</script>
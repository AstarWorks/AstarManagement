<template>
  <div class="space-y-2">
    <Label :for="inputId" class="flex items-center gap-1">
      {{ property.displayName || property.key }}
      <span v-if="property.required" class="text-destructive">*</span>
    </Label>
    
    <!-- Text types -->
    <template v-if="property.type === 'text'">
      <Input
        :id="inputId"
        v-model="stringValue"
        type="text"
        :required="property.required"
        :placeholder="getPlaceholder()"
        :disabled="readonly"
      />
    </template>
    
    <!-- Textarea -->
    <template v-else-if="property.type === 'long_text'">
      <Textarea
        :id="inputId"
        v-model="stringValue"
        :required="property.required"
        :placeholder="getPlaceholder()"
        rows="3"
        :disabled="readonly"
      />
    </template>
    
    <!-- Currency (special NUMBER type) -->
    <template v-else-if="property.type === 'number' && isCurrencyField">
      <div class="flex gap-2">
        <Select v-model="currency" class="w-24" :disabled="readonly">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">USD</SelectItem>
            <SelectItem value="EUR">EUR</SelectItem>
            <SelectItem value="JPY">JPY</SelectItem>
            <SelectItem value="GBP">GBP</SelectItem>
          </SelectContent>
        </Select>
        <Input
          :id="inputId"
          v-model.number="numberValue"
          type="number"
          step="0.01"
          :required="property.required"
          :placeholder="getPlaceholder()"
          class="flex-1"
          :disabled="readonly"
        />
      </div>
    </template>
    
    <!-- Percent (special NUMBER type) -->
    <template v-else-if="property.type === 'number' && isPercentField">
      <div class="flex gap-2">
        <Input
          :id="inputId"
          v-model.number="numberValue"
          type="number"
          min="0"
          max="100"
          :required="property.required"
          :placeholder="getPlaceholder()"
          class="flex-1"
          :disabled="readonly"
        />
        <span class="flex items-center px-3 text-muted-foreground">%</span>
      </div>
    </template>
    
    <!-- Regular Number (after special cases) -->
    <template v-else-if="property.type === 'number'">
      <Input
        :id="inputId"
        v-model.number="numberValue"
        type="number"
        :required="property.required"
        :placeholder="getPlaceholder()"
        :disabled="readonly"
      />
    </template>
    
    <!-- Checkbox -->
    <template v-else-if="property.type === 'checkbox'">
      <div class="flex items-center space-x-2">
        <Checkbox
          :id="inputId"
          v-model:checked="booleanValue"
          :required="property.required"
          :disabled="readonly"
        />
        <Label :for="inputId" class="font-normal">
          {{ property.displayName || property.key }}
        </Label>
      </div>
    </template>
    
    <!-- Date -->
    <template v-else-if="property.type === 'date'">
      <DatePicker
        :id="inputId"
        v-model="stringValue"
        type="DATE"
        :placeholder="getPlaceholder() || '日付を選択してください'"
        :disabled="readonly"
      />
    </template>
    
    <!-- Time (special DATETIME type) - check first -->
    <template v-else-if="property.type === 'datetime' && isTimeField">
      <Input
        :id="inputId"
        v-model="stringValue"
        type="time"
        :required="property.required"
        :disabled="readonly"
      />
    </template>
    
    <!-- DateTime (general case) -->
    <template v-else-if="property.type === 'datetime'">
      <DatePicker
        :id="inputId"
        v-model="stringValue"
        type="DATETIME"
        :placeholder="getPlaceholder() || '日時を選択してください'"
        :disabled="readonly"
      />
    </template>
    
    <!-- Select -->
    <template v-else-if="property.type === 'select'">
      <Select v-model="selectValue" :required="property.required" :disabled="readonly">
        <SelectTrigger :id="inputId">
          <SelectValue :placeholder="getPlaceholder()" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="option in selectOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </template>
    
    <!-- Multi-select -->
    <template v-else-if="property.type === 'multi_select'">
      <div class="space-y-2 rounded-md border p-3">
        <div
          v-for="option in selectOptions"
          :key="option.value"
          class="flex items-center space-x-2"
        >
          <Checkbox
            :id="`${inputId}-${option.value}`"
            :checked="(localValue as string[])?.includes(option.value)"
            :disabled="readonly"
            @update:checked="toggleMultiSelectOption(option.value)"
          />
          <Label :for="`${inputId}-${option.value}`" class="font-normal">
            {{ option.label }}
          </Label>
        </div>
      </div>
    </template>
    
    <!-- URL -->
    <template v-else-if="property.type === 'url'">
      <Input
        :id="inputId"
        v-model="stringValue"
        type="url"
        :required="property.required"
        :placeholder="getPlaceholder() || 'https://example.com'"
        :disabled="readonly"
      />
    </template>
    
    <!-- Email -->
    <template v-else-if="property.type === 'email'">
      <Input
        :id="inputId"
        v-model="stringValue"
        type="email"
        :required="property.required"
        :placeholder="getPlaceholder() || 'user@example.com'"
        :disabled="readonly"
      />
    </template>
    
    <!-- JSON - removed, TEXT is just normal text now -->
    
    <!-- File (placeholder) -->
    <template v-else-if="property.type === 'file'">
      <Input
        :id="inputId"
        type="file"
        :required="property.required"
        multiple
        disabled
      />
      <p class="text-sm text-muted-foreground">
        {{ $t('foundation.messages.info.comingSoon') }}
      </p>
    </template>
    
    <!-- Relation type -->
    <template v-else-if="property.type === 'relation'">
      <RelationSelect
        v-model="stringValue"
        :target-table-id="property.config?.targetTableId as string"
        :display-field="property.config?.displayField as string"
        :placeholder="getPlaceholder()"
      />
    </template>
    
    <!-- Rich text - removed duplicate, LONG_TEXT is already handled above -->
    
    <!-- Default fallback -->
    <template v-else>
      <Input
        :id="inputId"
        v-model="stringValue"
        type="text"
        :required="property.required"
        :placeholder="getPlaceholder()"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { useVModel, useDebounceFn } from '@vueuse/core'
import type { PropertyDefinitionDto } from '../../types'
import RelationSelect from './RelationSelect.vue'
import { DatePicker } from '~/foundation/components/ui/date-picker'

const props = defineProps<{
  property: PropertyDefinitionDto
  modelValue: unknown
  propertyKey: string
  readonly?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: unknown]
}>()

// Composables
const { t } = useI18n()

// Generate unique input ID
const inputId = computed(() => `property-${props.propertyKey}`)

// VueUse for two-way binding with better performance
const localValue = useVModel(props, 'modelValue', emit, {
  passive: true,
  deep: true
})

// Type-safe computed properties for different input types
const stringValue = computed({
  get: () => {
    if (localValue.value === null || localValue.value === undefined) return ''
    return String(localValue.value)
  },
  set: (val) => { localValue.value = val }
})

const numberValue = computed({
  get: () => {
    const val = localValue.value
    if (typeof val === 'number') return val
    if (typeof val === 'string' && val !== '') return Number(val)
    return undefined
  },
  set: (val) => { localValue.value = val }
})

const booleanValue = computed({
  get: () => Boolean(localValue.value),
  set: (val) => { localValue.value = val }
})

const selectValue = computed({
  get: () => localValue.value as string | undefined,
  set: (val) => { localValue.value = val }
})

// Currency handling
const currency = ref(
  (props.property.config as { currency?: string })?.currency || 'USD'
)

// JSON handling
const jsonString = ref('')
const jsonError = ref('')

// Initialize JSON string
watch(() => props.modelValue, (value) => {
  if (props.property.type === 'text') {
    try {
      jsonString.value = typeof value === 'string' 
        ? value 
        : JSON.stringify(value, null, 2)
    } catch {
      jsonString.value = ''
    }
  }
}, { immediate: true })

// Debounced JSON validation for better performance
const validateJson = useDebounceFn(() => {
  if (!jsonString.value && !props.property.required) {
    localValue.value = null
    jsonError.value = ''
    return
  }
  
  try {
    const parsed = JSON.parse(jsonString.value)
    localValue.value = parsed
    jsonError.value = ''
  } catch {
    jsonError.value = t('foundation.messages.error.validation')
  }
}, 300)

// Watch JSON string changes
watch(jsonString, () => {
  if (props.property.type === 'text') {
    validateJson()
  }
})

// Check if this is a currency field
const isCurrencyField = computed(() => {
  const config = props.property.config as { currency?: string }
  return Boolean(config?.currency || props.property.key?.includes('price') || props.property.key?.includes('amount'))
})

// Check if this is a percent field
const isPercentField = computed(() => {
  return Boolean(props.property.key?.includes('percent') || props.property.key?.includes('progress'))
})

// Check if this is a time-only field
const isTimeField = computed(() => {
  return Boolean(props.property.key?.includes('time') && !props.property.key?.includes('datetime'))
})

// Select options
const selectOptions = computed(() => {
  const config = props.property.config as { options?: Array<{ value: string; label: string }> }
  return config?.options || []
})

// Multi-select handling
const toggleMultiSelectOption = (optionValue: string) => {
  const current = (props.modelValue as string[]) || []
  const index = current.indexOf(optionValue)
  
  if (index >= 0) {
    localValue.value = current.filter(v => v !== optionValue)
  } else {
    localValue.value = [...current, optionValue]
  }
}

// Get placeholder text
const getPlaceholder = () => {
  const config = props.property.config as { placeholder?: string }
  return config?.placeholder || `Enter ${props.property.displayName || props.propertyKey}`
}
</script>
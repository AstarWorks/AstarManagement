<template>
  <div>
    <!-- Text input -->
    <Input
      v-if="property.type === 'text' || property.type === 'email' || property.type === 'url'"
      :id="id"
      :model-value="modelValue as string"
      :placeholder="$t('foundation.actions.basic.filter')"
      @update:model-value="$emit('update:modelValue', $event)"
    />

    <!-- Number input -->
    <Input
      v-else-if="property.type === 'number'"
      :id="id"
      type="number"
      :model-value="modelValue as number"
      :placeholder="$t('foundation.actions.basic.filter')"
      @update:model-value="$emit('update:modelValue', $event ? Number($event) : null)"
    />

    <!-- Checkbox -->
    <div v-else-if="property.type === 'checkbox'" class="flex items-center gap-2">
      <Checkbox
        :id="id"
        :checked="Boolean(modelValue)"
        @update:checked="$emit('update:modelValue', $event)"
      />
      <label :for="id" class="text-sm">{{ $t('foundation.common.labels.enabled') }}</label>
    </div>

    <!-- Select with multiple selection support -->
    <Select
      v-else-if="property.type === 'select'"
      :model-value="selectedValues"
      multiple
      @update:model-value="handleMultipleSelect"
    >
      <SelectTrigger :id="id">
        <SelectValue :placeholder="$t('foundation.actions.basic.filter')">
          <template v-if="selectedValues.length === 1">
            <Badge 
              :style="getSelectOptionStyle(selectedValues[0])"
              class="font-medium border"
            >
              {{ getSelectOptionLabel(selectedValues[0]) }}
            </Badge>
          </template>
          <template v-else-if="selectedValues.length > 1">
            {{ $t('foundation.table.filtering.selectedCount', { count: selectedValues.length }) }}
          </template>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem
          v-for="option in selectOptions"
          :key="option.value"
          :value="option.value"
        >
          <Badge 
            :style="getSelectOptionStyle(option.value)"
            class="font-medium border"
          >
            {{ option.label }}
          </Badge>
        </SelectItem>
      </SelectContent>
    </Select>

    <!-- Date picker with shadcn DatePicker -->
    <DatePicker
      v-else-if="property.type === 'date'"
      :model-value="modelValue as string"
      :placeholder="$t('foundation.actions.basic.filter') + '...'"
      type="DATE"
      class="h-10"
      @update:model-value="$emit('update:modelValue', $event)"
    />

    <!-- Default text input -->
    <Input
      v-else
      :id="id"
      :model-value="String(modelValue || '')"
      :placeholder="$t('foundation.actions.basic.filter')"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { DatePicker } from '~/foundation/components/ui/date-picker'
import type { PropertyDefinitionDto } from '../../types'

const { t: $t } = useI18n()

const props = defineProps<{
  id: string
  property: PropertyDefinitionDto
  modelValue: unknown
}>()

// Define emit function
const emit = defineEmits<{
  'update:modelValue': [value: unknown]
}>()

// SELECT options with color support
const selectOptions = computed(() => {
  const config = props.property.config as { options?: Array<{ value: string; label: string; color?: string }> }
  return config?.options || []
})

// Helper functions for SELECT colors (matching RecordCell pattern)
const getSelectOptionByValue = (value: string) => {
  return selectOptions.value.find(opt => opt.value === value)
}

const getSelectOptionLabel = (value: string) => {
  const option = getSelectOptionByValue(value)
  return option?.label || value
}

const getSelectOptionStyle = (value: string) => {
  const option = getSelectOptionByValue(value)
  if (!option?.color) {
    return { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1', color: '#475569' }
  }
  
  return {
    backgroundColor: option.color + '20',
    borderColor: option.color,
    color: option.color
  }
}

// Simplified multiple selection management for SELECT filters
const selectedValues = computed(() => {
  const value = props.modelValue
  if (Array.isArray(value)) return value
  if (value === null || value === undefined) return []
  return [value as string]
})

const handleMultipleSelect = (values: unknown) => {
  // Handle multiple selection values
  const arrayValues = Array.isArray(values) ? values : values ? [values as string] : []
  emit('update:modelValue', arrayValues.length ? arrayValues : null)
}
</script>
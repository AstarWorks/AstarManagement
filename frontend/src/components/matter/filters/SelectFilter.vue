<script setup lang="ts">
import { computed } from 'vue'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '~/components/ui/select'
import { Button } from '~/components/ui/button'
import type { FilterConfig, FilterOption } from './FilterConfig'

interface Props {
  config: FilterConfig
  modelValue?: string | string[]
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | string[] | undefined]
  'clear': []
}>()

const isMultiSelect = computed(() => props.config.type === 'multiselect')

const selectedValues = computed(() => {
  if (isMultiSelect.value) {
    return Array.isArray(props.modelValue) ? props.modelValue : []
  }
  return props.modelValue ? [props.modelValue as string] : []
})

const displayValue = computed(() => {
  const values = selectedValues.value
  if (values.length === 0) return undefined
  
  if (isMultiSelect.value) {
    if (values.length === 1) {
      const option = props.config.options?.find(opt => opt.value === values[0])
      return option?.label || values[0]
    }
    return `${values.length} selected`
  }
  
  const option = props.config.options?.find(opt => opt.value === values[0])
  return option?.label || values[0]
})

const hasValue = computed(() => selectedValues.value.length > 0)

const handleValueChange = (value: string) => {
  if (isMultiSelect.value) {
    const currentValues = selectedValues.value
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value]
    
    emit('update:modelValue', newValues.length > 0 ? newValues : undefined)
  } else {
    emit('update:modelValue', value === props.modelValue ? undefined : value)
  }
}

const clearFilter = () => {
  emit('update:modelValue', undefined)
  emit('clear')
}

const isOptionSelected = (value: string) => {
  return selectedValues.value.includes(value)
}
</script>

<template>
  <div class="select-filter">
    <div class="relative">
      <Select
        :model-value="displayValue"
        :disabled="disabled"
      >
        <SelectTrigger class="min-w-[180px]">
          <SelectValue :placeholder="config.placeholder || `Select ${config.label.toLowerCase()}...`" />
        </SelectTrigger>
        
        <SelectContent>
          <div v-if="config.searchable" class="p-2 border-b">
            <Input
              placeholder="Search options..."
              class="h-8"
            />
          </div>
          
          <SelectItem
            v-for="option in config.options"
            :key="option.value"
            :value="String(option.value)"
            @click="handleValueChange(String(option.value))"
          >
            <div class="flex items-center gap-2 w-full">
              <!-- Multi-select checkbox -->
              <div
                v-if="isMultiSelect"
                class="flex items-center"
              >
                <div 
                  class="w-4 h-4 border rounded flex items-center justify-center"
                  :class="{
                    'bg-primary border-primary text-primary-foreground': isOptionSelected(String(option.value)),
                    'border-input': !isOptionSelected(String(option.value))
                  }"
                >
                  <Icon 
                    v-if="isOptionSelected(String(option.value))" 
                    name="lucide:check" 
                    class="h-3 w-3" 
                  />
                </div>
              </div>
              
              <span class="flex-1">{{ option.label }}</span>
              
              <!-- Option count if available -->
              <span 
                v-if="option.count !== undefined" 
                class="text-xs text-muted-foreground"
              >
                {{ option.count }}
              </span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      
      <!-- Clear button -->
      <Button
        v-if="hasValue && config.clearable"
        variant="ghost"
        size="sm"
        class="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
        @click="clearFilter"
      >
        <Icon name="lucide:x" class="h-3 w-3" />
        <span class="sr-only">Clear filter</span>
      </Button>
    </div>
  </div>
</template>

<style scoped>
.select-filter {
  @apply w-full min-w-[180px];
}
</style>
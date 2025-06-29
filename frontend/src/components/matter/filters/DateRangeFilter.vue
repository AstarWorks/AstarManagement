<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { cn } from '~/lib/utils'
import type { FilterConfig } from './FilterConfig'

interface Props {
  config: FilterConfig
  modelValue?: [Date, Date] | [string, string] | null
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: [Date, Date] | null]
  'clear': []
}>()

const isOpen = ref(false)
const selectedRange = ref<[Date, Date] | null>(null)

// Simple date validation function
const isValidDate = (date: any): date is Date => {
  return date instanceof Date && !isNaN(date.getTime())
}

// Parse string to date
const parseDate = (value: string | Date): Date | null => {
  if (value instanceof Date) return value
  try {
    const date = new Date(value)
    return isValidDate(date) ? date : null
  } catch {
    return null
  }
}

// Format date to readable string
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  })
}

// Parse the model value to dates
const parsedValue = computed<[Date, Date] | null>(() => {
  if (!props.modelValue) return null
  
  try {
    const [start, end] = props.modelValue
    const startDate = parseDate(start)
    const endDate = parseDate(end)
    
    if (startDate && endDate) {
      return [startDate, endDate]
    }
  } catch (error) {
    console.warn('Invalid date range value:', props.modelValue)
  }
  
  return null
})

// Update internal value when prop changes
watch(() => props.modelValue, (newValue) => {
  selectedRange.value = parsedValue.value
}, { immediate: true })

const displayValue = computed(() => {
  if (!selectedRange.value) return undefined
  
  const [start, end] = selectedRange.value
  try {
    return `${formatDate(start)} - ${formatDate(end)}`
  } catch (error) {
    return 'Invalid date range'
  }
})

const hasValue = computed(() => selectedRange.value !== null)

const handleRangeSelect = (range: [Date, Date] | null) => {
  selectedRange.value = range
  emit('update:modelValue', range)
  
  // Close popover when range is selected
  if (range) {
    isOpen.value = false
  }
}

const clearFilter = () => {
  selectedRange.value = null
  emit('update:modelValue', null)
  emit('clear')
  isOpen.value = false
}

// Predefined date ranges
const predefinedRanges = [
  {
    label: 'Today',
    getValue: () => {
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
      return [startOfDay, endOfDay] as [Date, Date]
    }
  },
  {
    label: 'Yesterday',
    getValue: () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const startOfDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
      const endOfDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59)
      return [startOfDay, endOfDay] as [Date, Date]
    }
  },
  {
    label: 'Last 7 days',
    getValue: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 7)
      return [start, end] as [Date, Date]
    }
  },
  {
    label: 'Last 30 days',
    getValue: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 30)
      return [start, end] as [Date, Date]
    }
  },
  {
    label: 'This month',
    getValue: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      return [start, end] as [Date, Date]
    }
  },
  {
    label: 'Last month',
    getValue: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
      return [start, end] as [Date, Date]
    }
  }
]

const selectPredefinedRange = (rangeGetter: () => [Date, Date]) => {
  const range = rangeGetter()
  handleRangeSelect(range)
}
</script>

<template>
  <div class="date-range-filter">
    <Popover v-model:open="isOpen">
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          :class="cn('min-w-[280px] justify-start text-left font-normal', { 'text-muted-foreground': !hasValue })"
          :disabled="disabled"
        >
          <Icon name="lucide:calendar" class="mr-2 h-4 w-4" />
          {{ displayValue || config.placeholder || `Select ${config.label.toLowerCase()}...` }}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent class="w-auto p-0" align="start">
        <div class="flex">
          <!-- Predefined ranges sidebar -->
          <div class="border-r p-3 min-w-[140px]">
            <div class="space-y-1">
              <Button
                v-for="range in predefinedRanges"
                :key="range.label"
                variant="ghost"
                size="sm"
                class="w-full justify-start text-sm"
                @click="selectPredefinedRange(range.getValue)"
              >
                {{ range.label }}
              </Button>
            </div>
            
            <div class="mt-3 pt-3 border-t">
              <Button
                v-if="hasValue"
                variant="ghost"
                size="sm"
                class="w-full justify-start text-sm text-destructive"
                @click="clearFilter"
              >
                <Icon name="lucide:x" class="mr-2 h-3 w-3" />
                Clear
              </Button>
            </div>
          </div>
          
          <!-- Calendar -->
          <div class="p-3">
            <Calendar
              mode="range"
              :selected="selectedRange"
              @update:selected="handleRangeSelect"
              class="rounded-md border"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  </div>
</template>

<style scoped>
.date-range-filter {
  @apply w-full;
}
</style>
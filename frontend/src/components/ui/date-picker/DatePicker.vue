<!--
  Date Picker Component
  
  A placeholder date picker component for date range selection.
  In a real implementation, this would integrate with a date picker library
  like @vuepic/vue-datepicker or similar.
-->

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Calendar } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'

interface Props {
  /** Single date value */
  modelValue?: Date
  /** Date range value */
  range?: { from: Date; to: Date }
  /** Enable range selection */
  enableRange?: boolean
  /** Placeholder text */
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  enableRange: false,
  placeholder: 'Select date'
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [date: Date]
  'update:range': [range: { from: Date; to: Date } | undefined]
}>()

// Local state
const isOpen = ref(false)
const selectedDate = ref(props.modelValue?.toISOString().split('T')[0] || '')
const fromDate = ref(props.range?.from?.toISOString().split('T')[0] || '')
const toDate = ref(props.range?.to?.toISOString().split('T')[0] || '')

// Computed
const displayValue = computed(() => {
  if (props.enableRange) {
    if (fromDate.value && toDate.value) {
      return `${new Date(fromDate.value).toLocaleDateString()} - ${new Date(toDate.value).toLocaleDateString()}`
    }
    if (fromDate.value) {
      return `From ${new Date(fromDate.value).toLocaleDateString()}`
    }
    return props.placeholder
  } else {
    return selectedDate.value ? new Date(selectedDate.value).toLocaleDateString() : props.placeholder
  }
})

// Methods
const handleDateChange = (value: string, type: 'single' | 'from' | 'to') => {
  if (type === 'single') {
    selectedDate.value = value
    if (value) {
      emit('update:modelValue', new Date(value))
    }
  } else if (type === 'from') {
    fromDate.value = value
    updateRange()
  } else if (type === 'to') {
    toDate.value = value
    updateRange()
  }
}

const updateRange = () => {
  if (fromDate.value && toDate.value) {
    emit('update:range', {
      from: new Date(fromDate.value),
      to: new Date(toDate.value)
    })
  } else {
    emit('update:range', undefined)
  }
}

const clearSelection = () => {
  if (props.enableRange) {
    fromDate.value = ''
    toDate.value = ''
    emit('update:range', undefined)
  } else {
    selectedDate.value = ''
    emit('update:modelValue', undefined as any)
  }
  isOpen.value = false
}
</script>

<template>
  <Popover v-model:open="isOpen">
    <PopoverTrigger asChild>
      <Button 
        variant="outline" 
        class="w-full justify-start text-left font-normal"
        :class="{ 'text-muted-foreground': !displayValue || displayValue === placeholder }"
      >
        <Calendar class="w-4 h-4 mr-2" />
        {{ displayValue }}
      </Button>
    </PopoverTrigger>
    
    <PopoverContent class="w-auto p-4" align="start">
      <div class="space-y-4">
        <!-- Single Date Picker -->
        <div v-if="!enableRange" class="space-y-2">
          <label class="text-sm font-medium">Select Date</label>
          <Input
            type="date"
            :value="selectedDate"
            @input="handleDateChange($event.target.value, 'single')"
            class="w-full"
          />
        </div>
        
        <!-- Date Range Picker -->
        <div v-else class="space-y-3">
          <div class="space-y-2">
            <label class="text-sm font-medium">From Date</label>
            <Input
              type="date"
              :value="fromDate"
              @input="handleDateChange($event.target.value, 'from')"
              class="w-full"
            />
          </div>
          
          <div class="space-y-2">
            <label class="text-sm font-medium">To Date</label>
            <Input
              type="date"
              :value="toDate"
              :min="fromDate"
              @input="handleDateChange($event.target.value, 'to')"
              class="w-full"
            />
          </div>
        </div>
        
        <!-- Actions -->
        <div class="flex justify-between pt-2">
          <Button @click="clearSelection" variant="ghost" size="sm">
            Clear
          </Button>
          <Button @click="isOpen = false" size="sm">
            Done
          </Button>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>

<style scoped>
/* Custom date input styling */
:deep(input[type="date"]) {
  @apply appearance-none;
}

:deep(input[type="date"]::-webkit-calendar-picker-indicator) {
  @apply opacity-50 hover:opacity-100 cursor-pointer;
}
</style>
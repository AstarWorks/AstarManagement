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
      <Popover v-model:open="isOpen">
        <PopoverTrigger as-child>
          <Button
            :id="fieldId"
            variant="outline"
            :class="cn(
              'w-full justify-start text-left font-normal',
              !field.value && 'text-muted-foreground',
              hasError && 'border-destructive',
              props.class
            )"
            :disabled="disabled"
            :aria-describedby="describedBy"
            :aria-invalid="hasError"
            :aria-expanded="isOpen"
            :aria-haspopup="true"
            @click="togglePicker"
          >
            <CalendarIcon class="mr-2 h-4 w-4" />
            <span v-if="field.value">
              {{ formatDisplayDate(field.value) }}
            </span>
            <span v-else>
              {{ placeholder }}
            </span>
          </Button>
        </PopoverTrigger>
        
        <PopoverContent class="w-auto p-0" align="start">
          <Calendar
            v-model="selectedDate"
            :mode="mode"
            :disabled="disabledDates"
            :min-date="minDate"
            :max-date="maxDate"
            :weekdays-format="weekdaysFormat"
            :locale="locale"
            :class="calendarClass"
            @update:model-value="handleDateSelect"
          />
          
          <!-- Time picker for datetime mode -->
          <div
            v-if="includeTime"
            class="border-t p-3 space-y-2"
          >
            <div class="flex items-center gap-2">
              <Label class="text-sm font-medium">Time:</Label>
              <div class="flex items-center gap-1">
                <Input
                  v-model="timeInput.hours"
                  type="number"
                  min="0"
                  :max="timeFormat === '12h' ? '12' : '23'"
                  class="w-16 text-center"
                  @input="updateTime"
                />
                <span>:</span>
                <Input
                  v-model="timeInput.minutes"
                  type="number"
                  min="0"
                  max="59"
                  class="w-16 text-center"
                  @input="updateTime"
                />
                <Select
                  v-if="timeFormat === '12h'"
                  v-model="timeInput.ampm"
                  @update:value="updateTime"
                >
                  <SelectTrigger class="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <!-- Quick actions -->
          <div
            v-if="showQuickActions"
            class="border-t p-3 flex gap-2 flex-wrap"
          >
            <Button
              size="sm"
              variant="outline"
              @click="setToday"
            >
              Today
            </Button>
            <Button
              v-if="allowClear"
              size="sm"
              variant="outline"
              @click="clearDate"
            >
              Clear
            </Button>
            <Button
              v-for="preset in presets"
              :key="preset.label"
              size="sm"
              variant="outline"
              @click="applyPreset(preset)"
            >
              {{ preset.label }}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <!-- Date range display -->
      <div
        v-if="mode === 'range' && field.value && field.value.start && field.value.end"
        class="mt-2 text-sm text-muted-foreground"
      >
        {{ formatDateRange(field.value) }}
      </div>
    </template>
  </FormField>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useField } from '~/composables/form/useField'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Calendar } from '~/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '~/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/ui/select'
import { CalendarIcon } from 'lucide-vue-next'
import { cn } from '~/lib/utils'
import { format, parseISO, isValid } from 'date-fns'
import { ja } from 'date-fns/locale'

/**
 * Date preset interface
 */
export interface DatePreset {
  label: string
  value: Date | { start: Date; end: Date }
}

/**
 * FormDatePicker component props
 */
export interface FormDatePickerProps {
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
  /** Whether picker is disabled */
  disabled?: boolean
  /** Calendar mode */
  mode?: 'single' | 'multiple' | 'range'
  /** Whether to include time selection */
  includeTime?: boolean
  /** Time format */
  timeFormat?: '12h' | '24h'
  /** Date format for display */
  dateFormat?: string
  /** Minimum selectable date */
  minDate?: Date
  /** Maximum selectable date */
  maxDate?: Date
  /** Function to disable specific dates */
  disabledDates?: (date: Date) => boolean
  /** Whether to show quick action buttons */
  showQuickActions?: boolean
  /** Whether to allow clearing the date */
  allowClear?: boolean
  /** Date presets for quick selection */
  presets?: DatePreset[]
  /** Weekdays format */
  weekdaysFormat?: 'long' | 'short' | 'narrow'
  /** Locale for date formatting */
  locale?: any
  /** Custom CSS classes for the field wrapper */
  fieldClass?: string
  /** Custom CSS classes for the calendar */
  calendarClass?: string
  /** Custom CSS classes for the trigger button */
  class?: string
}

const props = withDefaults(defineProps<FormDatePickerProps>(), {
  mode: 'single',
  includeTime: false,
  timeFormat: '24h',
  dateFormat: 'PPP',
  showQuickActions: true,
  allowClear: true,
  weekdaysFormat: 'short',
  locale: ja,
  placeholder: 'Select a date...',
  presets: () => []
})

// Field management
const field = useField(props.name)
const isOpen = ref(false)

// Date state
const selectedDate = ref<Date | Date[] | { start: Date; end: Date } | null>(null)

// Time input for datetime mode
const timeInput = ref({
  hours: '00',
  minutes: '00',
  ampm: 'AM'
})

// Sync field value with selected date
watch(
  () => field.value.value,
  (newValue) => {
    if (newValue) {
      if (typeof newValue === 'string') {
        const parsed = parseISO(newValue)
        if (isValid(parsed)) {
          selectedDate.value = parsed
          updateTimeInput(parsed)
        }
      } else if (newValue instanceof Date) {
        selectedDate.value = newValue
        updateTimeInput(newValue)
      } else if (typeof newValue === 'object' && newValue.start && newValue.end) {
        selectedDate.value = newValue
      }
    } else {
      selectedDate.value = null
    }
  },
  { immediate: true }
)

// Handle date selection
const handleDateSelect = (date: Date | Date[] | { start: Date; end: Date } | null) => {
  selectedDate.value = date
  
  if (!date) {
    field.handleChange(null)
    return
  }
  
  if (date instanceof Date) {
    // Single date
    let finalDate = date
    
    if (props.includeTime) {
      finalDate = combineDateTime(date)
    }
    
    field.handleChange(finalDate.toISOString())
  } else if (Array.isArray(date)) {
    // Multiple dates
    field.handleChange(date.map(d => d.toISOString()))
  } else if (typeof date === 'object' && 'start' in date && 'end' in date) {
    // Date range
    field.handleChange({
      start: date.start.toISOString(),
      end: date.end.toISOString()
    })
  }
  
  // Close picker for single date mode
  if (props.mode === 'single' && !props.includeTime) {
    isOpen.value = false
  }
}

// Combine date with time input
const combineDateTime = (date: Date): Date => {
  const combined = new Date(date)
  let hours = parseInt(timeInput.value.hours)
  
  if (props.timeFormat === '12h') {
    if (timeInput.value.ampm === 'PM' && hours !== 12) {
      hours += 12
    } else if (timeInput.value.ampm === 'AM' && hours === 12) {
      hours = 0
    }
  }
  
  combined.setHours(hours, parseInt(timeInput.value.minutes), 0, 0)
  return combined
}

// Update time input from date
const updateTimeInput = (date: Date) => {
  if (!props.includeTime) return
  
  let hours = date.getHours()
  const minutes = date.getMinutes()
  
  if (props.timeFormat === '12h') {
    timeInput.value.ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12
  }
  
  timeInput.value.hours = hours.toString().padStart(2, '0')
  timeInput.value.minutes = minutes.toString().padStart(2, '0')
}

// Update time
const updateTime = () => {
  if (selectedDate.value instanceof Date) {
    const newDate = combineDateTime(selectedDate.value)
    field.handleChange(newDate.toISOString())
  }
}

// Quick actions
const togglePicker = () => {
  if (!props.disabled) {
    isOpen.value = !isOpen.value
  }
}

const setToday = () => {
  const today = new Date()
  handleDateSelect(today)
}

const clearDate = () => {
  handleDateSelect(null)
  isOpen.value = false
}

const applyPreset = (preset: DatePreset) => {
  handleDateSelect(preset.value as any)
  isOpen.value = false
}

// Format dates for display
const formatDisplayDate = (value: any): string => {
  if (!value) return ''
  
  try {
    if (typeof value === 'string') {
      const date = parseISO(value)
      return isValid(date) ? format(date, props.dateFormat, { locale: props.locale }) : ''
    } else if (value instanceof Date) {
      return format(value, props.dateFormat, { locale: props.locale })
    }
  } catch (error) {
    console.warn('Error formatting date:', error)
  }
  
  return ''
}

const formatDateRange = (range: { start: string; end: string }): string => {
  try {
    const startDate = parseISO(range.start)
    const endDate = parseISO(range.end)
    
    if (isValid(startDate) && isValid(endDate)) {
      return `${format(startDate, 'MMM d', { locale: props.locale })} - ${format(endDate, 'MMM d, yyyy', { locale: props.locale })}`
    }
  } catch (error) {
    console.warn('Error formatting date range:', error)
  }
  
  return ''
}

// Expose field for template refs
defineExpose({
  field,
  open: () => { isOpen.value = true },
  close: () => { isOpen.value = false },
  toggle: togglePicker,
  setToday,
  clear: clearDate,
  selectedDate: computed(() => selectedDate.value)
})
</script>
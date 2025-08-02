<template>
  <div class="space-y-4">
    <!-- Quick Date Range -->
    <FilterSelect
      :model-value="''"
      :placeholder="$t('matter.filters.dateRange.options.all')"
      :options="dateRangeOptions"
      @update:model-value="handleQuickSelect"
    />
    
    <!-- Custom Date Range -->
    <div class="grid grid-cols-2 gap-4">
      <div>
        <Label class="text-xs text-muted-foreground">{{ $t('matter.filters.dateRange.custom.startDate') }}</Label>
        <Input
          :model-value="customRange.start"
          type="date"
          @update:model-value="updateCustomRange('start', $event)"
        />
      </div>
      <div>
        <Label class="text-xs text-muted-foreground">{{ $t('matter.filters.dateRange.custom.endDate') }}</Label>
        <Input
          :model-value="customRange.end"
          type="date"
          @update:model-value="updateCustomRange('end', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns'
import type { DateRangeOption } from '~/types/case'
import { FilterSelect } from '../filter-select'

interface DateRange {
  start: string
  end: string
}

interface Props {
  modelValue: DateRange | null
}

interface Emits {
  (e: 'update:modelValue', value: DateRange | null): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const customRange = ref({
  start: props.modelValue?.start || '',
  end: props.modelValue?.end || ''
})

const { t } = useI18n()

const dateRangeOptions = computed(() => [
  { value: 'all', label: t('matter.filters.dateRange.options.all') },
  { value: 'overdue', label: t('matter.filters.dateRange.options.overdue') },
  { value: 'today', label: t('matter.filters.dateRange.options.today') },
  { value: 'this-week', label: t('matter.filters.dateRange.options.thisWeek') },
  { value: 'this-month', label: t('matter.filters.dateRange.options.thisMonth') }
])

const createRange = (start: Date, end: Date): DateRange => ({
  start: format(start, 'yyyy-MM-dd'),
  end: format(end, 'yyyy-MM-dd')
})

const handleQuickSelect = (value: string | null) => {
  if (!value || value === 'all') {
    emit('update:modelValue', null)
    return
  }
  
  const today = new Date()
  const ranges: Record<DateRangeOption, DateRange | null> = {
    all: null,
    today: createRange(today, today),
    'this-week': createRange(startOfWeek(today), endOfWeek(today)),
    'this-month': createRange(startOfMonth(today), endOfMonth(today)),
    overdue: createRange(new Date('2020-01-01'), subDays(today, 1))
  }
  
  emit('update:modelValue', ranges[value as DateRangeOption])
}

const updateCustomRange = (field: 'start' | 'end', value: string | number) => {
  customRange.value[field] = String(value)
  
  if (customRange.value.start && customRange.value.end) {
    emit('update:modelValue', { ...customRange.value })
  }
}
</script>
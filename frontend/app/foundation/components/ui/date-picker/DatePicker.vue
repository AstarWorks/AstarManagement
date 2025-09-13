<script setup lang="ts">
import type { DateValue } from '@internationalized/date'
import { DateFormatter, getLocalTimeZone, parseDate } from '@internationalized/date'
import { computed, ref, watch } from 'vue'
import { Button } from '../button'
import { Calendar } from '../calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../popover'

interface DatePickerProps {
  modelValue?: string // ISO string format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
  placeholder?: string
  type?: 'DATE' | 'DATETIME'
  disabled?: boolean
  class?: string
}

interface DatePickerEmits {
  'update:modelValue': [value: string | undefined]
  blur: []
  focus: []
}

const props = withDefaults(defineProps<DatePickerProps>(), {
  type: 'DATE',
  disabled: false,
  placeholder: '日付を選択'
})

const emit = defineEmits<DatePickerEmits>()

const { locale } = useI18n()

// DateValue型での日付管理
const dateValue = ref<DateValue>()
const isOpen = ref(false)

// 日付フォーマッター（国際化対応）
const dateFormatter = computed(() => new DateFormatter(locale.value, {
  dateStyle: props.type === 'DATE' ? 'medium' : 'short'
}))

// 表示用の値
const displayValue = computed(() => {
  if (!dateValue.value) return ''
  return dateFormatter.value.format(dateValue.value.toDate(getLocalTimeZone()))
})

// string値からDateValueへの変換
watch(() => props.modelValue, (newValue) => {
  if (newValue && typeof newValue === 'string') {
    try {
      // ISO string から日付部分のみを抽出（YYYY-MM-DD）
      const datePart = newValue.split('T')[0]
      if (datePart) {
        dateValue.value = parseDate(datePart)
      } else {
        dateValue.value = undefined
      }
    } catch (error) {
      console.warn('Failed to parse date:', newValue, error)
      dateValue.value = undefined
    }
  } else {
    dateValue.value = undefined
  }
}, { immediate: true })

// 日付選択時のハンドラー
const handleDateSelect = (selectedDate: DateValue | undefined) => {
  if (selectedDate) {
    dateValue.value = selectedDate
    
    // DateValueからISO stringへの変換
    const isoDateString = selectedDate.toString() // YYYY-MM-DD形式
    
    let finalValue: string
    
    if (props.type === 'DATETIME') {
      // DATETIME型の場合、既存の時間部分を維持するか、デフォルト時間を設定
      const currentTime = props.modelValue && props.modelValue.includes('T') 
        ? props.modelValue.split('T')[1] 
        : '00:00:00'
      finalValue = `${isoDateString}T${currentTime}`
    } else {
      finalValue = isoDateString
    }
    
    emit('update:modelValue', finalValue)
    
    // Popoverを閉じる
    isOpen.value = false
    emit('blur')
  }
}

// フォーカス処理
const handleFocus = () => {
  emit('focus')
}

// Popover外クリック時の処理
const handleOpenChange = (open: boolean) => {
  isOpen.value = open
  if (!open) {
    emit('blur')
  }
}
</script>

<template>
  <Popover v-model:open="isOpen" @update:open="handleOpenChange">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        :disabled="disabled"
        class="justify-start font-normal w-full"
:class="[
          !dateValue && 'text-muted-foreground',
          props.class
        ]"
        @focus="handleFocus"
      >
        <Icon name="lucide:calendar" class="mr-2 h-4 w-4" />
        {{ displayValue || placeholder }}
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0" align="start">
      <Calendar
        v-model="dateValue"
        initial-focus
        @update:model-value="handleDateSelect"
      />
    </PopoverContent>
  </Popover>
</template>
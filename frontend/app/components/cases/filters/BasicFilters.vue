<!--
  基本フィルター - Simple over Easy
  Basic Filters - Configuration-driven component
-->
<template>
  <div class="basic-filters grid grid-cols-1 md:grid-cols-4 gap-4">
    <!-- Search Filter -->
    <div class="space-y-2">
      <Label>{{ $t('matter.filters.search.label') }}</Label>
      <div class="relative">
        <Icon name="lucide:search" class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          :model-value="filters.search"
          :placeholder="$t('matter.filters.search.placeholder')"
          class="pl-10"
          @update:model-value="updateSearch"
        />
      </div>
    </div>

    <!-- Dynamic Basic Filters -->
    <div 
      v-for="config in basicFilterConfigs.filter(c => c.type === 'select')"
      :key="config.id"
      class="space-y-2"
    >
      <Label>{{ $t(config.labelKey) }}</Label>
      <Select
        :model-value="filters[config.id as keyof ICaseFilters] as string"
        @update:model-value="(value) => updateFilter(config.id as keyof ICaseFilters, value as string)"
      >
        <SelectTrigger>
          <SelectValue :placeholder="$t(`${config.labelKey}.options.all`)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem 
            v-for="option in getFilterOptions(config)" 
            :key="option.value" 
            :value="option.value"
          >
            {{ option.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Date Range Filter -->
    <div class="space-y-2">
      <Label>{{ $t('matter.filters.dateRange.label') }}</Label>
      <div class="space-y-4">
        <!-- Quick Date Range -->
        <Select
          :model-value="''"
          @update:model-value="handleQuickDateSelect"
        >
          <SelectTrigger>
            <SelectValue :placeholder="$t('matter.filters.dateRange.options.all')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem 
              v-for="option in dateRangeOptions" 
              :key="option.value" 
              :value="option.value"
            >
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        
        <!-- Custom Date Range -->
        <div class="grid grid-cols-2 gap-4">
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline" class="justify-start text-left font-normal">
                <Icon name="lucide:calendar" class="mr-2 h-4 w-4" />
                {{ customRange.start || $t('matter.filters.dateRange.custom.startDate') }}
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0">
              <Calendar
                :model-value="customRange.start ? parseDate(customRange.start) : undefined"
                @update:model-value="(date) => updateCustomRange('start', date ? date.toString() : '')"
              />
            </PopoverContent>
          </Popover>
          
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline" class="justify-start text-left font-normal">
                <Icon name="lucide:calendar" class="mr-2 h-4 w-4" />
                {{ customRange.end || $t('matter.filters.dateRange.custom.endDate') }}
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0">
              <Calendar
                :model-value="customRange.end ? parseDate(customRange.end) : undefined"
                @update:model-value="(date) => updateCustomRange('end', date ? date.toString() : '')"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { debounce } from 'lodash-es'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns'
import { parseDate } from '@internationalized/date'
import type { ICaseFilters, DateRangeOption } from '~/types/case'
import { getBasicFilterConfigs, type IFilterGroupConfig } from '~/config/filterConfig'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Label } from '~/components/ui/label'

interface Props {
  filters: ICaseFilters
  availableLawyers?: Array<{ id: string; name: string }>
}

interface Emits {
  (e: 'update:filters', filters: Partial<ICaseFilters>): void
}

const props = withDefaults(defineProps<Props>(), {
  availableLawyers: () => []
})

const emit = defineEmits<Emits>()

// 設定から基本フィルターを取得
const basicFilterConfigs = computed(() => getBasicFilterConfigs())

// フィルターオプションを動的生成
const getFilterOptions = (config: IFilterGroupConfig) => {
  if (!config.options) return []
  
  let options = config.options.map(option => ({
    value: option.value,
    label: t(option.labelKey)
  }))
  
  // 弁護士フィルターの場合は動的に追加
  if (config.id === 'assignedLawyer') {
    options = [
      ...options,
      ...props.availableLawyers.map(lawyer => ({
        value: lawyer.id,
        label: lawyer.name
      }))
    ]
  }
  
  return options
}

// フィルター更新処理
const updateFilter = (key: keyof ICaseFilters, value: string | unknown) => {
  emit('update:filters', { [key]: value })
}

// 検索フィルター更新（デバウンス対応）
const updateSearch = debounce((value: string | number) => {
  emit('update:filters', { search: String(value) })
}, 300)

// 日付範囲の状態管理
const customRange = ref({
  start: props.filters.dateRange?.start || '',
  end: props.filters.dateRange?.end || ''
})

// i18n
const { t } = useI18n()

// 日付範囲オプション
const dateRangeOptions = computed(() => [
  { value: 'all', label: t('matter.filters.dateRange.options.all') },
  { value: 'overdue', label: t('matter.filters.dateRange.options.overdue') },
  { value: 'today', label: t('matter.filters.dateRange.options.today') },
  { value: 'this-week', label: t('matter.filters.dateRange.options.thisWeek') },
  { value: 'this-month', label: t('matter.filters.dateRange.options.thisMonth') }
])

// 日付範囲作成ヘルパー
const createRange = (start: Date, end: Date) => ({
  start: format(start, 'yyyy-MM-dd'),
  end: format(end, 'yyyy-MM-dd')
})

// クイック日付選択ハンドラー
const handleQuickDateSelect = (value: string | unknown) => {
  const stringValue = value as string | null
  if (!stringValue || stringValue === 'all') {
    emit('update:filters', { dateRange: null })
    customRange.value = { start: '', end: '' }
    return
  }
  
  const today = new Date()
  const ranges: Record<DateRangeOption, { start: string; end: string } | null> = {
    all: null,
    today: createRange(today, today),
    'this-week': createRange(startOfWeek(today), endOfWeek(today)),
    'this-month': createRange(startOfMonth(today), endOfMonth(today)),
    overdue: createRange(new Date('2020-01-01'), subDays(today, 1))
  }
  
  const range = ranges[stringValue as DateRangeOption]
  if (range) {
    customRange.value = range
    emit('update:filters', { dateRange: range })
  }
}

// カスタム日付範囲更新
const updateCustomRange = (field: 'start' | 'end', dateStr: string) => {
  customRange.value[field] = dateStr
  
  if (customRange.value.start && customRange.value.end) {
    emit('update:filters', { dateRange: { ...customRange.value } })
  }
}
</script>

<style scoped>
@media (max-width: 768px) {
  .basic-filters {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>
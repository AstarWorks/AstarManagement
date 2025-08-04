<template>
  <Card class="expense-filters">
    <CardHeader>
      <div class="filter-header flex justify-between items-center">
        <CardTitle class="flex items-center gap-2">
          <Icon name="lucide:filter" class="w-5 h-5" />
          {{ $t('expense.filters.title') }}
        </CardTitle>
        <div class="filter-actions flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            :disabled="!hasActiveFilters"
            @click="resetFilters"
          >
            <Icon name="lucide:x" class="w-4 h-4 mr-1" />
            {{ $t('expense.filters.clear') }}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            @click="toggleAdvanced"
          >
            <Icon
              :name="showAdvanced ? 'lucide:chevron-up' : 'lucide:chevron-down'"
              class="w-4 h-4 mr-1"
            />
            {{ $t('expense.filters.advanced') }}
          </Button>
        </div>
      </div>
    </CardHeader>
    
    <CardContent>
      <!-- Quick Date Filters -->
      <div class="quick-filters mb-4">
        <Label class="text-sm font-medium mb-2 block">{{ $t('expense.filters.quickFilters') }}</Label>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button
            v-for="preset in datePresets"
            :key="preset.key"
            variant="outline"
            size="sm"
            :class="{ 'bg-primary text-primary-foreground': isPresetActive(preset) }"
            @click="applyDatePreset(preset)"
          >
            {{ preset.label }}
          </Button>
        </div>
      </div>

      <!-- Basic Filters -->
      <div class="basic-filters grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <!-- Date Range -->
        <div class="date-range">
          <Label>{{ $t('expense.filters.dateRange') }}</Label>
          <div class="flex gap-2 mt-1">
            <Input
              v-model="localFilters.startDate"
              type="date"
              :placeholder="$t('expense.filters.startDate')"
              @input="debouncedApply"
            />
            <Input
              v-model="localFilters.endDate"
              type="date"
              :placeholder="$t('expense.filters.endDate')"
              @input="debouncedApply"
            />
          </div>
        </div>
        
        <!-- Category Filter -->
        <div class="category-filter">
          <Label>{{ $t('expense.filters.category') }}</Label>
          <Select
            v-model="localFilters.category"
            @update:model-value="debouncedApply"
          >
            <SelectTrigger class="mt-1">
              <SelectValue :placeholder="$t('expense.filters.categoryPlaceholder')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{{ $t('expense.filters.allCategories') }}</SelectItem>
              <SelectItem
                v-for="category in availableCategories"
                :key="category"
                :value="category"
              >
                <div class="flex items-center gap-2">
                  <div 
                    class="w-3 h-3 rounded-full border"
                    :class="getCategoryIndicatorClass(category)"
                  />
                  {{ category }}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <!-- Search Filter -->
        <div class="search-filter">
          <Label>{{ $t('expense.filters.search') }}</Label>
          <div class="relative mt-1">
            <Input
              v-model="localFilters.searchQuery"
              :placeholder="$t('expense.filters.searchPlaceholder')"
              @input="debouncedApply"
            />
            <Icon
              name="lucide:search"
              class="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground"
            />
          </div>
        </div>
      </div>

      <!-- Advanced Filters -->
      <Collapsible v-model:open="showAdvanced">
        <CollapsibleContent>
          <div class="advanced-filters border-t pt-4 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Amount Range -->
              <div class="amount-range">
                <Label>{{ $t('expense.filters.amountRange') }}</Label>
                <div class="flex gap-2 items-center mt-1">
                  <div class="relative">
                    <Input
                      v-model="localFilters.minAmount"
                      type="number"
                      :placeholder="$t('expense.filters.minAmount')"
                      @input="debouncedApply"
                    />
                    <span class="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                      円
                    </span>
                  </div>
                  <span class="text-muted-foreground">〜</span>
                  <div class="relative">
                    <Input
                      v-model="localFilters.maxAmount"
                      type="number"
                      :placeholder="$t('expense.filters.maxAmount')"
                      @input="debouncedApply"
                    />
                    <span class="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                      円
                    </span>
                  </div>
                </div>
              </div>
              
              <!-- Case Filter -->
              <div class="case-filter">
                <Label>{{ $t('expense.filters.case') }}</Label>
                <Select
                  v-model="localFilters.caseId"
                  @update:model-value="debouncedApply"
                >
                  <SelectTrigger class="mt-1">
                    <SelectValue :placeholder="$t('expense.filters.casePlaceholder')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{{ $t('expense.filters.allCases') }}</SelectItem>
                    <SelectItem
                      v-for="case_ in availableCases"
                      :key="case_.id"
                      :value="case_.id"
                    >
                      {{ case_.title }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <!-- Balance Type Filter -->
            <div class="balance-type-filter">
              <Label>{{ $t('expense.filters.balanceType') }}</Label>
              <div class="flex gap-2 mt-2">
                <Button
                  v-for="type in balanceTypes"
                  :key="type.key"
                  variant="outline"
                  size="sm"
                  :class="{ 'bg-primary text-primary-foreground': localFilters.balanceType === type.key }"
                  @click="applyBalanceTypeFilter(type.key)"
                >
                  <Icon :name="type.icon" class="w-4 h-4 mr-1" />
                  {{ type.label }}
                </Button>
              </div>
            </div>
            
            <!-- Has Memo Filter -->
            <div class="memo-filter flex items-center space-x-2">
              <Checkbox
                :id="'has-memo'"
                :checked="localFilters.hasMemo"
                @update:checked="updateMemoFilter"
              />
              <Label :for="'has-memo'" class="text-sm font-normal">
                {{ $t('expense.filters.hasMemo') }}
              </Label>
            </div>

            <!-- Has Attachments Filter -->
            <div class="attachments-filter flex items-center space-x-2">
              <Checkbox
                :id="'has-attachments'"
                :checked="localFilters.hasAttachments"
                @update:checked="updateAttachmentsFilter"
              />
              <Label :for="'has-attachments'" class="text-sm font-normal">
                {{ $t('expense.filters.hasAttachments') }}
              </Label>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <!-- Active Filters Summary -->
      <div v-if="hasActiveFilters" class="active-filters mt-4 pt-4 border-t">
        <Label class="text-sm font-medium mb-2 block">{{ $t('expense.filters.activeFilters') }}</Label>
        <div class="flex flex-wrap gap-2">
          <Badge
            v-for="filter in activeFilterSummary"
            :key="filter.key"
            variant="secondary"
            class="flex items-center gap-1"
          >
            {{ filter.label }}
            <Button
              variant="ghost"
              size="sm"
              class="h-auto p-0 ml-1"
            @click="clearFilter(filter.key)"
            >
              <Icon name="lucide:x" class="w-3 h-3" />
            </Button>
          </Badge>
        </div>
      </div>

      <!-- Filter Statistics -->
      <div v-if="hasActiveFilters" class="filter-stats mt-4 pt-4 border-t">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div class="stat-item">
            <div class="text-2xl font-bold text-primary">{{ stats.totalMatched }}</div>
            <div class="text-xs text-muted-foreground">{{ $t('expense.filters.stats.matched') }}</div>
          </div>
          <div class="stat-item">
            <div class="text-2xl font-bold text-green-600">{{ formatCurrency(stats.totalIncome) }}</div>
            <div class="text-xs text-muted-foreground">{{ $t('expense.filters.stats.income') }}</div>
          </div>
          <div class="stat-item">
            <div class="text-2xl font-bold text-red-600">{{ formatCurrency(stats.totalExpense) }}</div>
            <div class="text-xs text-muted-foreground">{{ $t('expense.filters.stats.expense') }}</div>
          </div>
          <div class="stat-item">
            <div class="text-2xl font-bold" :class="getBalanceClass(stats.netBalance)">
              {{ formatCurrency(stats.netBalance) }}
            </div>
            <div class="text-xs text-muted-foreground">{{ $t('expense.filters.stats.balance') }}</div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import type { IExpenseFilter } from '~/types/expense'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
} from '~/components/ui/collapsible'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Badge } from '~/components/ui/badge'
import { Checkbox } from '~/components/ui/checkbox'

interface Props {
  modelValue: IExpenseFilter
  availableCategories?: string[]
  availableCases?: Array<{ id: string; title: string }>
  stats?: {
    totalMatched: number
    totalIncome: number
    totalExpense: number
    netBalance: number
  }
  debounceMs?: number
}

const props = withDefaults(defineProps<Props>(), {
  availableCategories: () => ['交通費', '印紙代', 'コピー代', '郵送料', 'その他'],
  availableCases: () => [],
  stats: () => ({
    totalMatched: 0,
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0
  }),
  debounceMs: 300
})

const emit = defineEmits<{
  'update:modelValue': [IExpenseFilter]
  'filterChange': [IExpenseFilter]
}>()

// Local filter state
const localFilters = ref<IExpenseFilter>({ ...props.modelValue })
const showAdvanced = ref(false)

// Date presets
const datePresets = [
  {
    key: 'thisMonth',
    label: '今月',
    getValue: () => {
      const now = new Date()
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
      }
    }
  },
  {
    key: 'lastMonth',
    label: '前月',
    getValue: () => {
      const now = new Date()
      return {
        startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0],
        endDate: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
      }
    }
  },
  {
    key: 'thisQuarter',
    label: '今四半期',
    getValue: () => {
      const now = new Date()
      const quarter = Math.floor(now.getMonth() / 3)
      return {
        startDate: new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0],
        endDate: new Date(now.getFullYear(), quarter * 3 + 3, 0).toISOString().split('T')[0]
      }
    }
  },
  {
    key: 'thisYear',
    label: '今年',
    getValue: () => {
      const now = new Date()
      return {
        startDate: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0],
        endDate: new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0]
      }
    }
  }
]

// Balance type filters
const balanceTypes = [
  { key: 'all', label: 'すべて', icon: 'lucide:list' },
  { key: 'positive', label: '収入', icon: 'lucide:trending-up' },
  { key: 'negative', label: '支出', icon: 'lucide:trending-down' },
  { key: 'zero', label: '収支0', icon: 'lucide:minus' }
]

// Computed properties
const hasActiveFilters = computed(() => {
  return Boolean(
    localFilters.value.startDate ||
    localFilters.value.endDate ||
    localFilters.value.category ||
    localFilters.value.caseId ||
    localFilters.value.searchQuery ||
    localFilters.value.minAmount ||
    localFilters.value.maxAmount ||
    localFilters.value.balanceType !== 'all' ||
    localFilters.value.hasMemo ||
    localFilters.value.hasAttachments
  )
})

const activeFilterSummary = computed(() => {
  const summary = []
  
  if (localFilters.value.startDate && localFilters.value.endDate) {
    summary.push({
      key: 'dateRange',
      label: `${formatDate(localFilters.value.startDate)} - ${formatDate(localFilters.value.endDate)}`
    })
  } else if (localFilters.value.startDate) {
    summary.push({
      key: 'startDate',
      label: `開始: ${formatDate(localFilters.value.startDate)}`
    })
  } else if (localFilters.value.endDate) {
    summary.push({
      key: 'endDate',
      label: `終了: ${formatDate(localFilters.value.endDate)}`
    })
  }
  
  if (localFilters.value.category) {
    summary.push({
      key: 'category',
      label: `カテゴリ: ${localFilters.value.category}`
    })
  }
  
  if (localFilters.value.searchQuery) {
    summary.push({
      key: 'searchQuery',
      label: `検索: "${localFilters.value.searchQuery}"`
    })
  }
  
  if (localFilters.value.minAmount || localFilters.value.maxAmount) {
    const min = localFilters.value.minAmount ? `${localFilters.value.minAmount}円` : ''
    const max = localFilters.value.maxAmount ? `${localFilters.value.maxAmount}円` : ''
    summary.push({
      key: 'amountRange',
      label: `金額: ${min}${min && max ? ' - ' : ''}${max}`
    })
  }
  
  if (localFilters.value.caseId) {
    const case_ = props.availableCases.find(c => c.id === localFilters.value.caseId)
    summary.push({
      key: 'caseId',
      label: `案件: ${case_?.title || localFilters.value.caseId}`
    })
  }
  
  if (localFilters.value.balanceType && localFilters.value.balanceType !== 'all') {
    const type = balanceTypes.find(t => t.key === localFilters.value.balanceType)
    summary.push({
      key: 'balanceType',
      label: `収支: ${type?.label}`
    })
  }
  
  if (localFilters.value.hasMemo) {
    summary.push({
      key: 'hasMemo',
      label: 'メモあり'
    })
  }
  
  if (localFilters.value.hasAttachments) {
    summary.push({
      key: 'hasAttachments',
      label: '添付ファイルあり'
    })
  }
  
  return summary
})

// Debounced filter application
const debouncedApply = useDebounceFn(() => {
  emit('update:modelValue', { ...localFilters.value })
  emit('filterChange', { ...localFilters.value })
}, props.debounceMs)

// Methods
const isPresetActive = (preset: typeof datePresets[0]) => {
  const range = preset.getValue()
  return localFilters.value.startDate === range.startDate && 
         localFilters.value.endDate === range.endDate
}

const applyDatePreset = (preset: typeof datePresets[0]) => {
  const range = preset.getValue()
  localFilters.value.startDate = range.startDate
  localFilters.value.endDate = range.endDate
  debouncedApply()
}

const applyBalanceTypeFilter = (type: string) => {
  localFilters.value.balanceType = type === localFilters.value.balanceType ? 'all' : type
  debouncedApply()
}

const updateMemoFilter = (checked: boolean) => {
  localFilters.value.hasMemo = checked || undefined
  debouncedApply()
}

const updateAttachmentsFilter = (checked: boolean) => {
  localFilters.value.hasAttachments = checked || undefined
  debouncedApply()
}

const clearFilter = (filterKey: string) => {
  switch (filterKey) {
    case 'dateRange':
    case 'startDate':
    case 'endDate':
      localFilters.value.startDate = undefined
      localFilters.value.endDate = undefined
      break
    case 'searchQuery':
      localFilters.value.searchQuery = undefined
      break
    case 'category':
      localFilters.value.category = undefined
      break
    case 'caseId':
      localFilters.value.caseId = undefined
      break
    case 'amountRange':
      localFilters.value.minAmount = undefined
      localFilters.value.maxAmount = undefined
      break
    case 'balanceType':
      localFilters.value.balanceType = 'all'
      break
    case 'hasMemo':
      localFilters.value.hasMemo = undefined
      break
    case 'hasAttachments':
      localFilters.value.hasAttachments = undefined
      break
    default:
      // Handle unknown filter keys gracefully
      break
  }
  debouncedApply()
}

const resetFilters = () => {
  localFilters.value = {}
  debouncedApply()
}

const toggleAdvanced = () => {
  showAdvanced.value = !showAdvanced.value
}

const getCategoryIndicatorClass = (category: string) => {
  const categoryClasses: Record<string, string> = {
    '交通費': 'bg-blue-500 border-blue-500',
    '印紙代': 'bg-red-500 border-red-500',
    'コピー代': 'bg-green-500 border-green-500',
    '郵送料': 'bg-yellow-500 border-yellow-500',
    'その他': 'bg-purple-500 border-purple-500'
  }
  return categoryClasses[category] || 'bg-gray-500 border-gray-500'
}

const getBalanceClass = (balance: number) => {
  if (balance > 0) return 'text-green-600'
  if (balance < 0) return 'text-red-600'
  return 'text-muted-foreground'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric'
  })
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0
  }).format(amount)
}

// Watch for external prop changes
watch(() => props.modelValue, (newValue) => {
  localFilters.value = { ...newValue }
}, { deep: true })
</script>
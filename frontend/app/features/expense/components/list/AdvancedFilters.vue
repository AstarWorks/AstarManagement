<template>
  <div class="advanced-filters border-t pt-4 space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Amount Range -->
      <div class="amount-range">
        <Label>{{ $t('expense.filters.amountRange') }}</Label>
        <div class="flex gap-2 items-center mt-1">
          <div class="relative">
            <Input
              :model-value="minAmount"
              type="number"
              :placeholder="$t('expense.filters.minAmount')"
              @update:model-value="emit('update:min-amount', Number($event) || undefined)"
            />
            <span class="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
              円
            </span>
          </div>
          <span class="text-muted-foreground">〜</span>
          <div class="relative">
            <Input
              :model-value="maxAmount"
              type="number"
              :placeholder="$t('expense.filters.maxAmount')"
              @update:model-value="emit('update:max-amount', Number($event) || undefined)"
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
          :model-value="caseId"
          @update:model-value="(value) => emit('update:case-id', String(value) || null)"
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
    
    <!-- Balance Type Filter using ToggleGroup (shadcn/ui improvement) -->
    <div class="balance-type-filter">
      <Label>{{ $t('expense.filters.balanceType') }}</Label>
      <ToggleGroup
        :model-value="balanceType"
        type="single"
        class="justify-start mt-2"
        @update:model-value="(value) => emit('update:balance-type', String(value || 'all'))"
      >
        <ToggleGroupItem
          v-for="type in balanceTypes"
          :key="type.key"
          :value="type.key"
          aria-label="Balance type toggle"
        >
          <Icon :name="type.icon" class="w-4 h-4 mr-1" />
          {{ type.label }}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
    
    <!-- Boolean Filters -->
    <div class="boolean-filters flex flex-col space-y-3">
      <!-- Has Memo Filter -->
      <div class="memo-filter flex items-center space-x-2">
        <Checkbox
          :id="'has-memo'"
          :checked="hasMemo"
          @update:checked="emit('update:has-memo', $event)"
        />
        <Label :for="'has-memo'" class="text-sm font-normal">
          {{ $t('expense.filters.hasMemo') }}
        </Label>
      </div>

      <!-- Has Attachments Filter -->
      <div class="attachments-filter flex items-center space-x-2">
        <Checkbox
          :id="'has-attachments'"
          :checked="hasAttachments"
          @update:checked="emit('update:has-attachments', $event)"
        />
        <Label :for="'has-attachments'" class="text-sm font-normal">
          {{ $t('expense.filters.hasAttachments') }}
        </Label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Input } from '@ui/input/index'
import { Label } from '@ui/label'
import { Checkbox } from '@ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/select'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@ui/toggle-group'

interface CaseOption {
  id: string
  title: string
}

interface Props {
  /** Minimum amount filter */
  minAmount?: number
  /** Maximum amount filter */
  maxAmount?: number
  /** Case ID filter */
  caseId?: string
  /** Balance type filter */
  balanceType?: string
  /** Has memo filter */
  hasMemo?: boolean
  /** Has attachments filter */
  hasAttachments?: boolean
  /** Available case options */
  availableCases?: CaseOption[]
}

const emit = defineEmits<{
  /** Update amount filters */
  'update:min-amount': [value: number | undefined]
  'update:max-amount': [value: number | undefined]
  /** Update case ID filter */
  'update:case-id': [value: string | null]
  /** Update balance type filter */
  'update:balance-type': [value: string | number]
  /** Update boolean filters */
  'update:has-memo': [value: boolean]
  'update:has-attachments': [value: boolean]
}>()

const _props = withDefaults(defineProps<Props>(), {
  minAmount: undefined,
  maxAmount: undefined,
  caseId: undefined,
  balanceType: 'all',
  hasMemo: undefined,
  hasAttachments: undefined,
  availableCases: () => []
})


// Balance type options with icons (following original design)
const balanceTypes = [
  { key: 'all', label: 'すべて', icon: 'lucide:list' },
  { key: 'positive', label: '収入', icon: 'lucide:trending-up' },
  { key: 'negative', label: '支出', icon: 'lucide:trending-down' },
  { key: 'zero', label: '収支0', icon: 'lucide:minus' }
]
</script>

<style scoped>
.advanced-filters {
  /* Styles handled by Tailwind classes */
}
</style>
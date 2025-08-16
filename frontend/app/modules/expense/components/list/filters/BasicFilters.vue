<template>
  <div class="basic-filters grid grid-cols-1 md:grid-cols-3 gap-4">
    <!-- Date Range -->
    <div class="date-range">
      <Label>{{ $t('expense.filters.dateRange') }}</Label>
      <div class="flex gap-2 mt-1">
        <Input
          :model-value="startDate"
          type="date"
          :placeholder="$t('expense.filters.startDate')"
          @update:model-value="emit('update:start-date', $event)"
        />
        <Input
          :model-value="endDate"
          type="date"
          :placeholder="$t('expense.filters.endDate')"
          @update:model-value="emit('update:end-date', $event)"
        />
      </div>
    </div>
    
    <!-- Category Filter -->
    <div class="category-filter">
      <Label>{{ $t('expense.filters.category') }}</Label>
      <Select
        :model-value="category"
        @update:model-value="emit('update:category', String($event))"
      >
        <SelectTrigger class="mt-1">
          <SelectValue :placeholder="$t('expense.filters.categoryPlaceholder')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">{{ $t('expense.filters.allCategories') }}</SelectItem>
          <SelectItem
            v-for="cat in availableCategories"
            :key="cat"
            :value="cat"
          >
            <div class="flex items-center gap-2">
              <div 
                class="w-3 h-3 rounded-full border"
                :class="getCategoryIndicatorClass(cat)"
              />
              {{ cat }}
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
          :model-value="searchQuery"
          :placeholder="$t('expense.filters.searchPlaceholder')"
          @update:model-value="emit('update:search-query', $event)"
        />
        <Icon
          name="lucide:search"
          class="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Input } from '~/foundation/components/ui/input'
import { Label } from '~/foundation/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/foundation/components/ui/select'
import { useExpenseFormatters } from '~/modules/expense/composables/shared/useExpenseFormatters'

interface Props {
  /** Current start date value */
  startDate?: string
  /** Current end date value */
  endDate?: string
  /** Current category filter */
  category?: string
  /** Current search query */
  searchQuery?: string
  /** Available category options */
  availableCategories?: string[]
}

interface Emits {
  /** Update date and search filters */
  (event: 'update:start-date' | 'update:end-date' | 'update:search-query', value: string | number): void
  /** Update category filter */
  (event: 'update:category', value: string | null): void
}

const _props = withDefaults(defineProps<Props>(), {
  startDate: undefined,
  endDate: undefined,
  category: undefined,
  searchQuery: undefined,
  availableCategories: () => ['交通費', '印紙代', 'コピー代', '郵送料', 'その他']
})

const emit = defineEmits<Emits>()

// Use formatter composable for category styling
const { getCategoryIndicatorClass } = useExpenseFormatters()
</script>

<style scoped>
.basic-filters {
  @apply mb-4;
}
</style>
<!--
  基本フィルター - Simple over Easy
  Basic Filters - Configuration-driven component
-->
<template>
  <div class="basic-filters grid grid-cols-1 md:grid-cols-4 gap-4">
    <!-- Search Filter -->
    <FilterGroup :label="$t('matter.filters.search.label')">
      <div class="relative">
        <Icon name="lucide:search" class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          :model-value="filters.search"
          :placeholder="$t('matter.filters.search.placeholder')"
          class="pl-10"
          @update:model-value="updateSearch"
        />
      </div>
    </FilterGroup>

    <!-- Dynamic Basic Filters -->
    <FilterGroup 
      v-for="config in basicFilterConfigs.filter(c => c.type === 'select')"
      :key="config.id"
      :label="$t(config.labelKey)"
    >
      <FilterSelect
        :model-value="filters[config.id as keyof CaseFilters] as string"
        :placeholder="$t(`${config.labelKey}.options.all`)"
        :options="getFilterOptions(config)"
        @update:model-value="(value) => updateFilter(config.id as keyof CaseFilters, value)"
      />
    </FilterGroup>

    <!-- Date Range Filter -->
    <FilterGroup :label="$t('matter.filters.dateRange.label')">
      <DateRangeSelector
        :model-value="filters.dateRange"
        @update:model-value="(value) => updateFilter('dateRange', value)"
      />
    </FilterGroup>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { debounce } from 'lodash-es'
import type { CaseFilters } from '~/types/case'
import { getBasicFilterConfigs, type FilterGroupConfig } from '~/config/filterConfig'
import { FilterGroup } from '~/components/ui/filter-group'
import { FilterSelect } from '~/components/ui/filter-select'
import { DateRangeSelector } from '~/components/ui/date-range-selector'

interface Props {
  filters: CaseFilters
  availableLawyers?: Array<{ id: string; name: string }>
}

interface Emits {
  (e: 'update:filters', filters: Partial<CaseFilters>): void
}

const props = withDefaults(defineProps<Props>(), {
  availableLawyers: () => []
})

const emit = defineEmits<Emits>()

// 設定から基本フィルターを取得
const basicFilterConfigs = computed(() => getBasicFilterConfigs())

// フィルターオプションを動的生成
const getFilterOptions = (config: FilterGroupConfig) => {
  if (!config.options) return []
  
  let options = config.options.map(option => ({
    value: option.value,
    label: $t(option.labelKey)
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
const updateFilter = (key: keyof CaseFilters, value: any) => {
  emit('update:filters', { [key]: value })
}

// 検索フィルター更新（デバウンス対応）
const updateSearch = debounce((value: string | number) => {
  emit('update:filters', { search: String(value) })
}, 300)
</script>

<style scoped>
@media (max-width: 768px) {
  .basic-filters {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>
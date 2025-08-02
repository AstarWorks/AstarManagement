<!--
  案件フィルター - Simple over Easy リファクタリング版
  Kanban Filters - Refactored with configuration-based approach
-->
<template>
  <div class="kanban-filters bg-card border border-border rounded-lg p-4 shadow-sm">
    <!-- ヘッダー -->
    <div class="filters-header flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-foreground">{{ $t('matter.filters.title') }}</h3>
      <div class="header-actions flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          :disabled="!hasActiveFilters"
          @click="handleClearAll"
        >
          <Icon name="lucide:x" class="h-4 w-4 mr-1" />
          {{ $t('matter.filters.actions.clear') }}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          @click="showAdvanced = !showAdvanced"
        >
          <Icon 
            :name="showAdvanced ? 'lucide:chevron-up' : 'lucide:chevron-down'" 
            class="h-4 w-4 mr-1" 
          />
          {{ $t('matter.filters.actions.advanced') }}
        </Button>
      </div>
    </div>

    <!-- 基本フィルター -->
    <BasicFilters
      :filters="localFilters"
      :available-lawyers="availableLawyers"
      @update:filters="handleUpdateFilters"
      class="mb-4"
    />

    <!-- 詳細フィルター -->
    <Collapsible v-model:open="showAdvanced">
      <CollapsibleContent>
        <AdvancedFilters
          :filters="localFilters"
          @update:filters="handleUpdateFilters"
        />
      </CollapsibleContent>
    </Collapsible>

    <!-- アクティブフィルター表示 -->
    <ActiveFiltersSummary
      :filters="localFilters"
      :available-lawyers="availableLawyers"
      @clear-filter="handleClearFilter"
      @remove-tag="handleRemoveTag"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { CaseFilters } from '~/types/case'
import { DEFAULT_CASE_FILTERS } from '~/config/filterConfig'
import { useFilters } from '~/composables/useFilters'
import BasicFilters from './BasicFilters.vue'
import AdvancedFilters from './AdvancedFilters.vue'
import ActiveFiltersSummary from './ActiveFiltersSummary.vue'

interface Props {
  filters: CaseFilters
  availableLawyers?: Array<{ id: string; name: string }>
}

interface Emits {
  (e: 'update:filters' | 'apply', filters: CaseFilters): void
  (e: 'reset'): void
}

const props = withDefaults(defineProps<Props>(), {
  availableLawyers: () => []
})

const emit = defineEmits<Emits>()

// 状態管理
const localFilters = ref<CaseFilters>({ ...props.filters })
const showAdvanced = ref(false)

// フィルター管理composableを使用
const { hasActiveFilters, clearFilter, removeTag } = useFilters(localFilters.value)

// フィルター更新処理
const handleUpdateFilters = (updates: Partial<CaseFilters>) => {
  localFilters.value = { ...localFilters.value, ...updates }
  emit('update:filters', { ...localFilters.value })
  emit('apply', { ...localFilters.value })
}

// 全フィルタークリア
const handleClearAll = () => {
  localFilters.value = { ...DEFAULT_CASE_FILTERS }
  emit('reset')
  emit('update:filters', { ...localFilters.value })
}

// 個別フィルタークリア
const handleClearFilter = (key: keyof CaseFilters) => {
  clearFilter(key)
  // localFiltersに反映
  switch (key) {
    case 'search':
      localFilters.value.search = ''
      break
    case 'clientType':
    case 'priority': 
    case 'assignedLawyer':
      localFilters.value[key] = 'all'
      break
    case 'tags':
      localFilters.value.tags = []
      break
    case 'dateRange':
      localFilters.value.dateRange = null
      break
  }
  emit('update:filters', { ...localFilters.value })
}

// タグ削除
const handleRemoveTag = (tag: string) => {
  const index = localFilters.value.tags.indexOf(tag)
  if (index > -1) {
    localFilters.value.tags.splice(index, 1)
    emit('update:filters', { ...localFilters.value })
  }
}

// 外部からのフィルター変更を監視
watch(
  () => props.filters,
  (newFilters) => {
    localFilters.value = { ...newFilters }
  },
  { deep: true }
)

// 初期化
onMounted(() => {
  localFilters.value = { ...props.filters }
})
</script>


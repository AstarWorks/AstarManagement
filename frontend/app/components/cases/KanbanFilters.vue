<template>
  <div class="kanban-filters bg-card border border-border rounded-lg p-4 shadow-sm">
    <div class="filters-header flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-foreground">フィルター</h3>
      <div class="header-actions flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          :disabled="!hasActiveFilters"
          @click="clearAllFilters"
        >
          <Icon name="lucide:x" class="h-4 w-4 mr-1" />
          クリア
        </Button>
        <Button
          variant="ghost"
          size="sm"
          @click="toggleAdvanced"
        >
          <Icon 
            :name="showAdvanced ? 'lucide:chevron-up' : 'lucide:chevron-down'" 
            class="h-4 w-4 mr-1" 
          />
          詳細
        </Button>
      </div>
    </div>

    <!-- Search Filter -->
    <div class="filter-group mb-4">
      <Label class="text-sm font-medium text-foreground mb-2">検索</Label>
      <div class="relative">
        <Icon name="lucide:search" class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          v-model="localFilters.search"
          placeholder="案件名、案件番号、依頼者名で検索..."
          class="pl-10"
          @input="debouncedUpdate"
        />
      </div>
    </div>

    <!-- Basic Filters Row -->
    <div class="basic-filters grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
      <!-- Client Type Filter -->
      <div class="filter-group">
        <Label class="text-sm font-medium text-foreground mb-2">依頼者種別</Label>
        <Select v-model="localFilters.clientType" @update:model-value="updateFilters">
          <SelectTrigger>
            <SelectValue placeholder="全て" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全て</SelectItem>
            <SelectItem value="individual">個人</SelectItem>
            <SelectItem value="corporate">法人</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Priority Filter -->
      <div class="filter-group">
        <Label class="text-sm font-medium text-foreground mb-2">優先度</Label>
        <Select v-model="localFilters.priority" @update:model-value="updateFilters">
          <SelectTrigger>
            <SelectValue placeholder="全て" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全て</SelectItem>
            <SelectItem value="high">緊急</SelectItem>
            <SelectItem value="medium">通常</SelectItem>
            <SelectItem value="low">低</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Assigned Lawyer Filter -->
      <div class="filter-group">
        <Label class="text-sm font-medium text-foreground mb-2">担当弁護士</Label>
        <Select v-model="localFilters.assignedLawyer" @update:model-value="updateFilters">
          <SelectTrigger>
            <SelectValue placeholder="全て" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全て</SelectItem>
            <SelectItem value="佐藤弁護士">佐藤弁護士</SelectItem>
            <SelectItem value="山田弁護士">山田弁護士</SelectItem>
            <SelectItem value="田中弁護士">田中弁護士</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Date Range Quick Filter -->
      <div class="filter-group">
        <Label class="text-sm font-medium text-foreground mb-2">期限</Label>
        <Select @update:model-value="handleDateRangeSelect">
          <SelectTrigger>
            <SelectValue placeholder="全期間" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全期間</SelectItem>
            <SelectItem value="overdue">期限切れ</SelectItem>
            <SelectItem value="today">本日期限</SelectItem>
            <SelectItem value="this-week">今週期限</SelectItem>
            <SelectItem value="this-month">今月期限</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <!-- Advanced Filters -->
    <Collapsible v-model:open="showAdvanced">
      <CollapsibleContent class="space-y-4">
        <!-- Tags Filter -->
        <div class="filter-group">
          <Label class="text-sm font-medium text-foreground mb-2">タグ</Label>
          <div class="flex flex-wrap gap-2">
            <Button
              v-for="tag in availableTags"
              :key="tag"
              variant="outline"
              size="sm"
              :class="{
                'bg-primary text-primary-foreground': localFilters.tags.includes(tag),
                'border-primary': localFilters.tags.includes(tag)
              }"
              @click="toggleTag(tag)"
            >
              <Icon 
                :name="localFilters.tags.includes(tag) ? 'lucide:check' : 'lucide:plus'" 
                class="h-3 w-3 mr-1" 
              />
              {{ tag }}
            </Button>
          </div>
        </div>

        <!-- Custom Date Range -->
        <div class="filter-group">
          <Label class="text-sm font-medium text-foreground mb-2">カスタム期間</Label>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <Label class="text-xs text-muted-foreground">開始日</Label>
              <Input
                v-model="customDateRange.start"
                type="date"
                @change="updateCustomDateRange"
              />
            </div>
            <div>
              <Label class="text-xs text-muted-foreground">終了日</Label>
              <Input
                v-model="customDateRange.end"
                type="date"
                @change="updateCustomDateRange"
              />
            </div>
          </div>
        </div>

        <!-- Sort Options -->
        <div class="filter-group">
          <Label class="text-sm font-medium text-foreground mb-2">並び順</Label>
          <div class="grid grid-cols-2 gap-4">
            <Select v-model="localFilters.sortBy" @update:model-value="updateFilters">
              <SelectTrigger>
                <SelectValue placeholder="並び順" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dueDate">期限日</SelectItem>
                <SelectItem value="priority">優先度</SelectItem>
                <SelectItem value="createdAt">作成日</SelectItem>
                <SelectItem value="updatedAt">更新日</SelectItem>
                <SelectItem value="title">案件名</SelectItem>
              </SelectContent>
            </Select>
            
            <Select v-model="localFilters.sortOrder" @update:model-value="updateFilters">
              <SelectTrigger>
                <SelectValue placeholder="順序" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">昇順</SelectItem>
                <SelectItem value="desc">降順</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>

    <!-- Active Filters Summary -->
    <div v-if="hasActiveFilters" class="active-filters mt-4 pt-4 border-t border-border">
      <div class="flex flex-wrap gap-2">
        <Badge
          v-if="localFilters.search"
          variant="secondary"
          class="flex items-center gap-1"
        >
          検索: {{ localFilters.search }}
          <Button
            variant="ghost"
            size="sm"
            class="h-4 w-4 p-0 hover:bg-transparent"
            @click="clearSearch"
          >
            <Icon name="lucide:x" class="h-3 w-3" />
          </Button>
        </Badge>
        
        <Badge
          v-if="localFilters.clientType !== 'all'"
          variant="secondary"
          class="flex items-center gap-1"
        >
          種別: {{ getClientTypeLabel(localFilters.clientType) }}
          <Button
            variant="ghost"
            size="sm"
            class="h-4 w-4 p-0 hover:bg-transparent"
            @click="clearClientType"
          >
            <Icon name="lucide:x" class="h-3 w-3" />
          </Button>
        </Badge>
        
        <Badge
          v-if="localFilters.priority !== 'all'"
          variant="secondary"
          class="flex items-center gap-1"
        >
          優先度: {{ getPriorityLabel(localFilters.priority) }}
          <Button
            variant="ghost"
            size="sm"  
            class="h-4 w-4 p-0 hover:bg-transparent"
            @click="clearPriority"
          >
            <Icon name="lucide:x" class="h-3 w-3" />
          </Button>
        </Badge>
        
        <Badge
          v-for="tag in localFilters.tags"
          :key="tag"
          variant="secondary"
          class="flex items-center gap-1"
        >
          {{ tag }}
          <Button
            variant="ghost"
            size="sm"
            class="h-4 w-4 p-0 hover:bg-transparent"
            @click="removeTag(tag)"
          >
            <Icon name="lucide:x" class="h-3 w-3" />
          </Button>
        </Badge>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { debounce } from 'lodash-es'
import type { CaseFilters } from '~/types/case'

interface Props {
  filters: CaseFilters
}

interface Emits {
  (e: 'update:filters' | 'apply', filters: CaseFilters): void
  (e: 'reset'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Reactive state
const localFilters = ref<CaseFilters>({ ...props.filters })
const showAdvanced = ref(false)
const customDateRange = ref({
  start: '',
  end: ''
})

// Available options
const availableTags = ref([
  '不動産', '契約', 'M&A', '企業法務', '労働法', '調停', 
  '民事', '刑事', '家事', '知的財産', '税務', '国際'
])

// Computed properties
const hasActiveFilters = computed(() => {
  return (
    localFilters.value.search !== '' ||
    localFilters.value.clientType !== 'all' ||
    localFilters.value.priority !== 'all' ||
    localFilters.value.assignedLawyer !== 'all' ||
    localFilters.value.tags.length > 0 ||
    localFilters.value.dateRange !== null
  )
})

// Methods
const updateFilters = () => {
  emit('update:filters', { ...localFilters.value })
  emit('apply', { ...localFilters.value })
}

const debouncedUpdate = debounce(updateFilters, 300)

const clearAllFilters = () => {
  localFilters.value = {
    search: '',
    clientType: 'all',
    priority: 'all',
    assignedLawyer: 'all',
    tags: [],
    dateRange: null,
    sortBy: 'dueDate',
    sortOrder: 'asc'
  }
  customDateRange.value = { start: '', end: '' }
  emit('reset')
  updateFilters()
}

const clearSearch = () => {
  localFilters.value.search = ''
  updateFilters()
}

const clearClientType = () => {
  localFilters.value.clientType = 'all'
  updateFilters()
}

const clearPriority = () => {
  localFilters.value.priority = 'all'
  updateFilters()
}

const toggleTag = (tag: string) => {
  const index = localFilters.value.tags.indexOf(tag)
  if (index > -1) {
    localFilters.value.tags.splice(index, 1)
  } else {
    localFilters.value.tags.push(tag)
  }
  updateFilters()
}

const removeTag = (tag: string) => {
  const index = localFilters.value.tags.indexOf(tag)
  if (index > -1) {
    localFilters.value.tags.splice(index, 1)
    updateFilters()
  }
}

const toggleAdvanced = () => {
  showAdvanced.value = !showAdvanced.value
}

const handleDateRangeSelect = (value: string) => {
  const today = new Date()
  const formatDate = (date: Date) => date.toISOString().split('T')[0]

  switch (value) {
    case 'all': {
      localFilters.value.dateRange = null
      break
    }
    case 'overdue': {
      localFilters.value.dateRange = {
        start: '2020-01-01',
        end: formatDate(new Date(today.getTime() - 24 * 60 * 60 * 1000))
      }
      break
    }
    case 'today': {
      localFilters.value.dateRange = {
        start: formatDate(today),
        end: formatDate(today)
      }
      break
    }
    case 'this-week': {
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      localFilters.value.dateRange = {
        start: formatDate(weekStart),
        end: formatDate(weekEnd)
      }
      break
    }
    case 'this-month': {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      localFilters.value.dateRange = {
        start: formatDate(monthStart),
        end: formatDate(monthEnd)
      }
      break
    }
    default: {
      // No action for unknown values
      break
    }
  }
  updateFilters()
}

const updateCustomDateRange = () => {
  if (customDateRange.value.start && customDateRange.value.end) {
    localFilters.value.dateRange = {
      start: customDateRange.value.start,
      end: customDateRange.value.end
    }
    updateFilters()
  }
}

const getClientTypeLabel = (type: string) => {
  const labels = { individual: '個人', corporate: '法人' }
  return labels[type as keyof typeof labels] || type
}

const getPriorityLabel = (priority: string) => {
  const labels = { high: '緊急', medium: '通常', low: '低' }
  return labels[priority as keyof typeof labels] || priority
}

// Watch for external filter changes
watch(
  () => props.filters,
  (newFilters) => {
    localFilters.value = { ...newFilters }
  },
  { deep: true }
)

onMounted(() => {
  localFilters.value = { ...props.filters }
})
</script>

<style scoped>
.filter-group {
  display: flex;
  flex-direction: column;
}

.filter-group label {
  margin-bottom: 0.5rem;
}

@media (max-width: 768px) {
  .basic-filters {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .active-filters {
    overflow-x: auto;
  }
  
  .active-filters > div {
    min-width: max-content;
  }
}
</style>
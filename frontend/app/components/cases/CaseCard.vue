<template>
  <div
    class="case-card bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
    :class="[
      `priority-${caseData.priority}`,
      { 'opacity-50': isLoading },
      { 'ring-2 ring-primary': isDragging }
    ]"
    draggable="true"
    @click="$emit('clicked', caseData)"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
  >
    <!-- Case Header -->
    <div class="case-header flex items-start justify-between mb-3">
      <div class="case-info flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <span class="case-number text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
            {{ caseData.caseNumber }}
          </span>
          <CasePriorityBadge :priority="caseData.priority" size="sm" />
        </div>
        <h3 class="case-title text-sm font-semibold text-foreground line-clamp-2 leading-tight">
          {{ caseData.title }}
        </h3>
      </div>
      
      <!-- Quick Actions -->
      <div class="case-actions flex items-center gap-1 ml-2">
        <Button
          variant="ghost"
          size="sm"
          class="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          @click.stop="$emit('edit', caseData)"
        >
          <Icon name="lucide:edit-3" class="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          class="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          @click.stop="handleMoreActions"
        >
          <Icon name="lucide:more-horizontal" class="h-3 w-3" />
        </Button>
      </div>
    </div>

    <!-- Client Information -->
    <div class="client-info mb-3">
      <div class="flex items-center gap-2">
        <Icon 
          :name="caseData.client.type === 'individual' ? 'lucide:user' : 'lucide:building'" 
          class="h-4 w-4 text-muted-foreground flex-shrink-0" 
        />
        <span class="client-name text-sm text-foreground truncate">
          {{ caseData.client.name }}
        </span>
        <ClientTypeBadge :type="caseData.client.type" size="xs" />
      </div>
    </div>

    <!-- Case Metadata -->
    <div class="case-metadata space-y-2">
      <!-- Assigned Lawyer -->
      <div class="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon name="lucide:user-check" class="h-3 w-3 flex-shrink-0" />
        <span class="truncate">{{ caseData.assignedLawyer }}</span>
      </div>

      <!-- Due Date -->
      <div class="flex items-center gap-2 text-xs" :class="dueDateClass">
        <Icon name="lucide:calendar" class="h-3 w-3 flex-shrink-0" />
        <span>{{ formatDueDate(caseData.dueDate) }}</span>
        <DueDateAlert v-if="isDueSoon" :due-date="caseData.dueDate" size="xs" />
      </div>

      <!-- Tags -->
      <div v-if="caseData.tags.length > 0" class="flex flex-wrap gap-1">
        <CaseTag
          v-for="tag in visibleTags"
          :key="tag"
          :tag="tag"
          size="xs"
        />
        <span
          v-if="hiddenTagsCount > 0"
          class="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded"
        >
          +{{ hiddenTagsCount }}
        </span>
      </div>
    </div>

    <!-- Progress Indicator -->
    <div class="progress-section mt-3 pt-3 border-t border-border">
      <div class="flex items-center justify-between">
        <span class="text-xs text-muted-foreground">進捗状況</span>
        <CaseProgressIndicator :status="caseData.status" size="sm" />
      </div>
    </div>

    <!-- Loading Overlay -->
    <div
      v-if="isLoading"
      class="absolute inset-0 bg-card/50 backdrop-blur-sm rounded-lg flex items-center justify-center"
    >
      <div class="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { format, parseISO, differenceInDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { Case } from '~/types/case'

interface Props {
  caseData: Case
  viewMode?: 'minimal' | 'compact' | 'detailed'
  interactive?: boolean
  showQuickActions?: boolean
  isLoading?: boolean
}

interface Emits {
  (e: 'clicked', caseData: Case): void
  (e: 'edit', caseData: Case): void
  (e: 'dragStart', event: DragEvent, caseData: Case): void
  (e: 'dragEnd', event: DragEvent, caseData: Case): void
}

const props = withDefaults(defineProps<Props>(), {
  viewMode: 'compact',
  interactive: true,
  showQuickActions: true,
  isLoading: false
})

const emit = defineEmits<Emits>()

// Reactive state
const isDragging = ref(false)

// Computed properties
const visibleTags = computed(() => {
  const maxTags = props.viewMode === 'detailed' ? 4 : 2
  return props.caseData.tags.slice(0, maxTags)
})

const hiddenTagsCount = computed(() => {
  const maxTags = props.viewMode === 'detailed' ? 4 : 2
  return Math.max(0, props.caseData.tags.length - maxTags)
})

const isDueSoon = computed(() => {
  if (!props.caseData.dueDate) return false
  const daysUntilDue = differenceInDays(parseISO(props.caseData.dueDate), new Date())
  return daysUntilDue >= 0 && daysUntilDue <= 7
})

const dueDateClass = computed(() => {
  if (!props.caseData.dueDate) return 'text-muted-foreground'
  const daysUntilDue = differenceInDays(parseISO(props.caseData.dueDate), new Date())
  
  if (daysUntilDue < 0) return 'text-destructive' // 過期
  if (daysUntilDue <= 3) return 'text-orange-600' // 近期
  if (daysUntilDue <= 7) return 'text-yellow-600' // 注意
  return 'text-muted-foreground' // 正常
})

// Methods
const formatDueDate = (dateString: string): string => {
  if (!dateString) return '期限未設定'
  
  const date = parseISO(dateString)
  const now = new Date()
  const daysUntilDue = differenceInDays(date, now)
  
  if (daysUntilDue < 0) {
    return `${Math.abs(daysUntilDue)}日遅れ`
  } else if (daysUntilDue === 0) {
    return '本日期限'
  } else if (daysUntilDue === 1) {
    return '明日期限'
  } else if (daysUntilDue <= 7) {
    return `${daysUntilDue}日後`
  } else {
    return format(date, 'M/d', { locale: ja })
  }
}

const handleDragStart = (event: DragEvent) => {
  if (!props.interactive) return
  
  isDragging.value = true
  
  // Set drag data
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', props.caseData.id)
    event.dataTransfer.setData('application/json', JSON.stringify({
      caseId: props.caseData.id,
      currentStatus: props.caseData.status
    }))
  }
  
  emit('dragStart', event, props.caseData)
}

const handleDragEnd = (event: DragEvent) => {
  isDragging.value = false
  emit('dragEnd', event, props.caseData)
}

const handleMoreActions = () => {
  // Implement context menu or dropdown
  console.log('More actions for case:', props.caseData.id)
}
</script>

<style scoped>
.case-card {
  position: relative;
  user-select: none;
  min-height: 180px;
  max-width: 280px;
  width: 100%;
}

.case-card:hover .case-actions {
  opacity: 1;
}

.case-card.priority-high {
  border-left: 4px solid rgb(239 68 68); /* red-500 fallback */
}

.case-card.priority-medium {
  border-left: 4px solid rgb(234 179 8); /* yellow-500 fallback */
}

.case-card.priority-low {
  border-left: 4px solid rgb(34 197 94); /* green-500 fallback */
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.case-actions {
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}

.case-card:hover .case-actions {
  opacity: 1;
}

@media (max-width: 768px) {
  .case-card {
    min-height: 160px;
    max-width: none;
  }
  
  .case-actions {
    opacity: 1; /* Always visible on mobile */
  }
}
</style>
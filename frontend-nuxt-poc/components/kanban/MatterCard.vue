<template>
  <Card
    :class="[
      'cursor-pointer transition-all duration-150',
      'hover:shadow-md hover:scale-[1.02]',
      'border-l-4',
      priorityConfig.border,
      cardHeightClass,
      isDragging && 'opacity-50 shadow-xl z-50 cursor-grabbing',
      !isDragging && 'cursor-grab',
      isOverdue && 'ring-1 ring-red-200 bg-red-50/30'
    ]"
    @click="$emit('click', matter)"
  >
    <CardContent class="p-3">
      <!-- Header -->
      <div class="flex items-start justify-between gap-2 mb-2">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-600">{{ matter.caseNumber }}</span>
            <Badge :variant="priorityConfig.variant" class="text-xs">
              {{ matter.priority }}
            </Badge>
          </div>
          <h3 class="font-medium text-sm line-clamp-2 mt-1">{{ matter.title }}</h3>
        </div>
      </div>

      <!-- Client Info -->
      <div class="text-xs text-gray-600 mb-2">
        <span>{{ matter.clientName }}</span>
        <span v-if="matter.opponentName" class="text-gray-600">
          vs {{ matter.opponentName }}
        </span>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between mt-2">
        <div class="flex items-center gap-2 text-xs text-gray-600">
          <!-- Due Date -->
          <div v-if="viewPreferences.showDueDates && matter.dueDate" class="flex items-center gap-1">
            <span :class="isOverdue ? 'text-red-600 font-medium' : ''">
              {{ formatDate(matter.dueDate) }}
            </span>
          </div>
          
          <!-- Assigned Lawyer -->
          <div v-if="matter.assignedLawyer" class="flex items-center gap-1">
            <span>{{ matter.assignedLawyer }}</span>
          </div>
        </div>

        <!-- Document Count -->
        <div v-if="matter.relatedDocuments" class="flex items-center gap-1 text-xs text-gray-600">
          <span>{{ matter.relatedDocuments }} docs</span>
        </div>
      </div>

      <!-- Tags -->
      <div v-if="viewPreferences.showTags && matter.tags?.length" class="flex flex-wrap gap-1 mt-2">
        <span
          v-for="tag in matter.tags"
          :key="tag"
          class="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700"
        >
          {{ tag }}
        </span>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format, isAfter, parseISO } from 'date-fns'
import type { Matter, ViewPreferences, Priority } from '~/types/matter'

interface Props {
  matter: Matter
  isDragging?: boolean
  viewPreferences: ViewPreferences
}

const props = withDefaults(defineProps<Props>(), {
  isDragging: false
})

const emit = defineEmits<{
  click: [matter: Matter]
}>()

// Priority colors configuration
const PRIORITY_COLORS: Record<Priority, { border: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  low: {
    border: 'border-l-gray-400',
    variant: 'secondary'
  },
  medium: {
    border: 'border-l-blue-500',
    variant: 'default'
  },
  high: {
    border: 'border-l-orange-500',
    variant: 'default'
  },
  urgent: {
    border: 'border-l-red-600',
    variant: 'destructive'
  }
}

// Computed properties
const priorityConfig = computed(() => PRIORITY_COLORS[props.matter.priority])

const isOverdue = computed(() => {
  if (!props.matter.dueDate) return false
  try {
    return isAfter(new Date(), parseISO(props.matter.dueDate))
  } catch {
    return false
  }
})

const cardHeightClass = computed(() => {
  switch (props.viewPreferences.cardSize) {
    case 'compact':
      return 'min-h-[80px]'
    case 'expanded':
      return 'min-h-[160px]'
    default:
      return 'min-h-[120px]'
  }
})

// Helper functions
const formatDate = (dateString: string) => {
  try {
    return format(parseISO(dateString), 'MMM d')
  } catch {
    return dateString
  }
}
</script>
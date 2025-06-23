<script setup lang="ts">
// 1. Imports - external libraries first
import { computed, toRefs } from 'vue'
import { format, isAfter, parseISO } from 'date-fns'
import { Calendar, Clock, User, AlertTriangle, AlertCircle, Info, Minus, FileText, MoreVertical } from 'lucide-vue-next'

// 2. Internal imports
import type { MatterCard, ViewPreferences, MatterPriority } from '~/types/kanban'
import { Card, CardContent, CardHeader } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'
import { useAccessibility } from '~/composables/useAccessibility'

// 3. Priority configuration with icons
type PriorityConfig = {
  border: string
  badge: string
  icon: typeof AlertTriangle
}

// 4. Props definition with TypeScript
interface Props {
  matter: MatterCard
  isDragging?: boolean
  viewPreferences: ViewPreferences
  searchTerms?: string[]
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  isDragging: false,
  searchTerms: () => [],
  className: ''
})

// 5. Emits definition
const emit = defineEmits<{
  click: [matter: MatterCard]
  edit: [matter: MatterCard]
  statusChange: [matterId: string, newStatus: string]
}>()

// 6. Reactive state and computed properties
const { matter, viewPreferences, isDragging } = toRefs(props)
const { announceUpdate } = useAccessibility()

// Priority configuration
const PRIORITY_COLORS: Record<MatterPriority, PriorityConfig> = {
  URGENT: {
    border: 'border-l-red-500',
    badge: 'bg-red-100 text-red-800',
    icon: AlertTriangle
  },
  HIGH: {
    border: 'border-l-orange-500', 
    badge: 'bg-orange-100 text-orange-800',
    icon: AlertCircle
  },
  MEDIUM: {
    border: 'border-l-blue-500',
    badge: 'bg-blue-100 text-blue-800', 
    icon: Info
  },
  LOW: {
    border: 'border-l-gray-500',
    badge: 'bg-gray-100 text-gray-800',
    icon: Minus
  }
}

// Computed properties for reactive updates
const priorityConfig = computed(() => PRIORITY_COLORS[matter.value.priority])
const PriorityIcon = computed(() => priorityConfig.value.icon)

const isOverdue = computed(() => {
  if (!matter.value.dueDate) return false
  try {
    return isAfter(new Date(), parseISO(matter.value.dueDate))
  } catch {
    return false
  }
})

const cardHeightClass = computed(() => {
  switch (viewPreferences.value.cardSize) {
    case 'compact': return 'h-20'
    case 'detailed': return 'h-36'
    default: return 'h-28'
  }
})

const cardClasses = computed(() => cn(
  'relative cursor-pointer transition-all duration-150',
  'hover:shadow-md hover:scale-[1.02]',
  'border-l-4',
  priorityConfig.value.border,
  cardHeightClass.value,
  isDragging.value && 'opacity-50 shadow-xl z-50 cursor-grabbing',
  !isDragging.value && 'cursor-grab',
  isOverdue.value && 'ring-1 ring-red-200 bg-red-50/30',
  props.className
))

// Helper functions
const formatDate = (dateString: string): string => {
  try {
    return format(parseISO(dateString), 'MMM d')
  } catch {
    return 'Invalid date'
  }
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Event handlers
const handleClick = () => {
  emit('click', matter.value)
}

const handleEdit = (e: Event) => {
  e.stopPropagation()
  emit('edit', matter.value)
}

// Accessibility announcement
const cardLabel = computed(() => {
  const parts = [
    `Matter ${matter.value.caseNumber}: ${matter.value.title}`,
    `Priority: ${matter.value.priority}`,
    `Status: ${matter.value.status.replace('_', ' ')}`,
    `Client: ${matter.value.clientName}`
  ]
  
  if (matter.value.assignedLawyer) {
    parts.push(`Assigned to ${matter.value.assignedLawyer.name}`)
  }
  
  if (isOverdue.value) {
    parts.push('This matter is overdue')
  }
  
  return parts.join('. ')
})

// Drag attributes for integration with drag system
const dragAttributes = computed(() => ({
  draggable: true,
  'data-matter-id': matter.value.id,
  'data-priority': matter.value.priority,
  'data-status': matter.value.status
}))
</script>

<template>
  <Card
    :class="cardClasses"
    v-bind="dragAttributes"
    @click="handleClick"
    :aria-label="cardLabel"
    role="button"
    tabindex="0"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <!-- Drag Handle -->
    <div 
      class="absolute top-2 left-2 opacity-0 hover:opacity-40 transition-opacity"
      aria-hidden="true"
    >
      <div class="flex flex-col gap-0.5">
        <div class="w-1 h-1 bg-gray-400 rounded-full" />
        <div class="w-1 h-1 bg-gray-400 rounded-full" />
        <div class="w-1 h-1 bg-gray-400 rounded-full" />
      </div>
    </div>

    <!-- Card Header -->
    <CardHeader class="pb-2 pt-3">
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1 min-w-0">
          <!-- Title and Priority -->
          <div class="flex items-center gap-2 mb-1">
            <h3 class="font-medium text-sm text-foreground truncate">
              {{ matter.title }}
            </h3>
            <Badge
              v-if="viewPreferences.showPriority"
              variant="secondary"
              :class="cn(priorityConfig.badge, 'text-xs flex items-center gap-1')"
            >
              <component :is="PriorityIcon" class="w-3 h-3" />
              <span class="sr-only">Priority:</span>
              {{ matter.priority }}
            </Badge>
          </div>
          
          <!-- Case Number and Status Duration -->
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <span class="truncate">#{{ matter.caseNumber }}</span>
            <span class="text-muted-foreground/50">•</span>
            <span v-if="matter.statusDuration && viewPreferences.cardSize !== 'compact'">
              {{ matter.statusDuration }}d in status
            </span>
            <span v-else>
              {{ matter.status.replace(/_/g, ' ').toLowerCase() }}
            </span>
          </div>
        </div>
        
        <!-- Edit Button -->
        <Button
          v-if="viewPreferences.cardSize !== 'compact'"
          variant="ghost"
          size="icon"
          class="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          @click="handleEdit"
          :aria-label="`Edit matter ${matter.caseNumber}`"
        >
          <MoreVertical class="h-3 w-3" />
        </Button>
      </div>
    </CardHeader>

    <!-- Card Content -->
    <CardContent class="pt-0 pb-3">
      <div class="space-y-2">
        <!-- Client Information -->
        <div class="flex items-center gap-2 text-xs text-muted-foreground">
          <User class="w-3 h-3 flex-shrink-0" />
          <span class="truncate">{{ matter.clientName }}</span>
          <span v-if="matter.opponentName" class="text-muted-foreground truncate">
            vs {{ matter.opponentName }}
          </span>
        </div>

        <!-- Due Date (with overdue indicator) -->
        <div 
          v-if="viewPreferences.showDueDates && matter.dueDate"
          class="flex items-center gap-2 text-xs"
        >
          <Calendar class="w-3 h-3 flex-shrink-0" />
          <span 
            :class="cn(
              'truncate',
              isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'
            )"
          >
            {{ formatDate(matter.dueDate) }}
            <span v-if="isOverdue" class="ml-1">(Overdue)</span>
          </span>
        </div>

        <!-- Last Updated (Compact View) or Documents (Normal/Expanded) -->
        <div class="flex items-center justify-between text-xs text-muted-foreground">
          <div class="flex items-center gap-2">
            <Clock class="w-3 h-3 flex-shrink-0" />
            <span>Updated {{ formatDate(matter.updatedAt) }}</span>
          </div>
          
          <!-- Document Count -->
          <div 
            v-if="matter.relatedDocuments && viewPreferences.cardSize !== 'compact'" 
            class="flex items-center gap-1"
          >
            <FileText class="w-3 h-3" />
            <span>{{ matter.relatedDocuments }}</span>
          </div>
        </div>

        <!-- Assignees with Avatars (Normal/Expanded views) -->
        <div 
          v-if="viewPreferences.showAvatars && viewPreferences.cardSize !== 'compact' && (matter.assignedLawyer || matter.assignedClerk)"
          class="flex items-center gap-2 mt-2"
        >
          <div class="flex -space-x-1">
            <Avatar
              v-if="matter.assignedLawyer"
              size="xs"
              :aria-label="`Assigned lawyer: ${matter.assignedLawyer.name}`"
            >
              <AvatarImage 
                :src="matter.assignedLawyer.avatar" 
                :alt="matter.assignedLawyer.name"
              />
              <AvatarFallback class="text-xs bg-blue-100 text-blue-700">
                {{ matter.assignedLawyer.initials || getInitials(matter.assignedLawyer.name) }}
              </AvatarFallback>
            </Avatar>

            <Avatar
              v-if="matter.assignedClerk"
              size="xs"
              :aria-label="`Assigned clerk: ${matter.assignedClerk.name}`"
            >
              <AvatarImage 
                :src="matter.assignedClerk.avatar"
                :alt="matter.assignedClerk.name" 
              />
              <AvatarFallback class="text-xs bg-green-100 text-green-700">
                {{ matter.assignedClerk.initials || getInitials(matter.assignedClerk.name) }}
              </AvatarFallback>
            </Avatar>
          </div>
          
          <span class="text-xs text-muted-foreground truncate">
            {{ matter.assignedLawyer?.name }}
            <span v-if="matter.assignedClerk">
              & {{ matter.assignedClerk.name }}
            </span>
          </span>
        </div>

        <!-- Tags (Normal/Expanded views) -->
        <div 
          v-if="viewPreferences.showTags && matter.tags?.length && viewPreferences.cardSize !== 'compact'"
          class="flex flex-wrap gap-1 mt-2"
        >
          <Badge
            v-for="tag in matter.tags.slice(0, 3)"
            :key="tag"
            variant="outline"
            class="text-xs px-1.5 py-0"
          >
            {{ tag }}
          </Badge>
          <Badge
            v-if="matter.tags.length > 3"
            variant="outline"
            class="text-xs px-1.5 py-0"
          >
            +{{ matter.tags.length - 3 }}
          </Badge>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
/* Component-specific animations and hover effects */
.matter-card-enter-active,
.matter-card-leave-active {
  transition: all 0.3s ease;
}

.matter-card-enter-from,
.matter-card-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Enhanced hover state for parent card */
.card:hover .hover\:opacity-40 {
  opacity: 0.4;
}

.card:hover .group-hover\:opacity-100 {
  opacity: 1;
}

/* Focus styles for accessibility */
.card:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .card {
    border-left-width: 6px;
  }
  
  .badge {
    font-weight: bold;
    border-width: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none !important;
  }
  
  .hover\:scale-\[1\.02\]:hover {
    transform: none !important;
  }
  
  .matter-card-enter-active,
  .matter-card-leave-active {
    transition: none;
  }
}

/* Print styles */
@media print {
  .card {
    break-inside: avoid;
    box-shadow: none !important;
    border: 1px solid #000;
  }
  
  .hover\:opacity-40,
  .group-hover\:opacity-100 {
    display: none;
  }
}
</style>
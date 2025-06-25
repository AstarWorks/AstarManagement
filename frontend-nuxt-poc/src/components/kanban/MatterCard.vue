<script setup lang="ts">
// 1. Imports - external libraries first
import { ref, computed, toRefs, watch } from 'vue'
import { format, isAfter, parseISO } from 'date-fns'
import { Calendar, Clock, User, AlertTriangle, AlertCircle, Info, Minus, FileText, MoreVertical, Check, X, Archive } from 'lucide-vue-next'
import { useBreakpoints } from '@vueuse/core'

// 2. Internal imports
import type { MatterCard, ViewPreferences, MatterPriority } from '~/types/kanban'
import { Card, CardContent, CardHeader } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'
import { useAccessibility } from '~/composables/useAccessibility'
import { useTouchGestures, useMobileInteractions } from '~/composables/useTouchGestures'

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
  archive: [matter: MatterCard]
  complete: [matter: MatterCard]
  swipeAction: [action: string, matter: MatterCard]
}>()

// 6. Template refs
const cardRef = ref<HTMLElement | null>(null)

// 7. Reactive state and computed properties
const { matter, viewPreferences, isDragging } = toRefs(props)
const { announceUpdate } = useAccessibility()

// Mobile detection and interactions
const breakpoints = useBreakpoints({
  mobile: 0,
  tablet: 768,
  desktop: 1024,
})

const isMobile = breakpoints.smaller('tablet')
const { isTouchDevice, useTouchClick } = useMobileInteractions()

// Touch gestures for the card
const {
  isPressed,
  isLongPress,
  swipeDirection,
  dragOffset,
  velocity,
  reset: resetGestures
} = useTouchGestures(cardRef)

// Swipe actions state
const showSwipeActions = ref(false)
const swipeActionType = ref<'left' | 'right' | null>(null)

// Watch for swipe gestures
watch(swipeDirection, (direction) => {
  if (!isMobile.value || !direction || isDragging.value) return
  
  if (direction === 'left' || direction === 'right') {
    showSwipeActions.value = true
    swipeActionType.value = direction
    emit('swipeAction', direction, matter.value)
  }
})

// Watch for long press to show context menu
watch(isLongPress, (pressed) => {
  if (!isMobile.value || !pressed || isDragging.value) return
  
  // Trigger haptic feedback and show mobile context menu
  showSwipeActions.value = true
  swipeActionType.value = 'left' // Default to left actions
  resetGestures()
})

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
  isMobile.value && 'touch-manipulation active:scale-[0.98]',
  isPressed.value && !isDragging.value && 'scale-[0.98] shadow-lg',
  showSwipeActions.value && 'transform',
  props.className
))

// Swipe transform style
const swipeTransform = computed(() => {
  if (!showSwipeActions.value || !isMobile.value) return {}
  
  const offset = swipeActionType.value === 'left' ? -80 : 80
  return {
    transform: `translateX(${offset}px)`,
    transition: 'transform 0.3s ease'
  }
})

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

// Event handlers with mobile optimization
const handleClick = useTouchClick(() => {
  if (!showSwipeActions.value) {
    emit('click', matter.value)
  }
})

const handleEdit = (e: Event) => {
  e.stopPropagation()
  emit('edit', matter.value)
}

// Mobile swipe action handlers
const handleComplete = () => {
  emit('complete', matter.value)
  showSwipeActions.value = false
  announceUpdate(`Matter ${matter.value.caseNumber} marked as complete`)
}

const handleArchive = () => {
  emit('archive', matter.value)
  showSwipeActions.value = false
  announceUpdate(`Matter ${matter.value.caseNumber} archived`)
}

const cancelSwipeActions = () => {
  showSwipeActions.value = false
  swipeActionType.value = null
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
  <div class="matter-card-wrapper relative">
    <!-- Mobile Swipe Actions Background -->
    <transition name="swipe-actions">
      <div 
        v-if="isMobile && showSwipeActions"
        class="swipe-actions-container absolute inset-0 flex items-center"
        @click="cancelSwipeActions"
      >
        <!-- Left swipe actions (Complete/Edit) -->
        <div 
          v-if="swipeActionType === 'left'"
          class="swipe-actions-left absolute right-0 flex items-center gap-2 pr-4"
        >
          <Button
            size="icon"
            variant="default"
            class="h-10 w-10 rounded-full bg-green-500 hover:bg-green-600"
            @click.stop="handleComplete"
            :aria-label="`Complete matter ${matter.caseNumber}`"
          >
            <Check class="h-5 w-5 text-white" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            class="h-10 w-10 rounded-full"
            @click.stop="handleEdit"
            :aria-label="`Edit matter ${matter.caseNumber}`"
          >
            <MoreVertical class="h-5 w-5" />
          </Button>
        </div>
        
        <!-- Right swipe actions (Archive/Cancel) -->
        <div 
          v-if="swipeActionType === 'right'"
          class="swipe-actions-right absolute left-0 flex items-center gap-2 pl-4"
        >
          <Button
            size="icon"
            variant="destructive"
            class="h-10 w-10 rounded-full"
            @click.stop="handleArchive"
            :aria-label="`Archive matter ${matter.caseNumber}`"
          >
            <Archive class="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            class="h-10 w-10 rounded-full"
            @click.stop="cancelSwipeActions"
            aria-label="Cancel action"
          >
            <X class="h-5 w-5" />
          </Button>
        </div>
      </div>
    </transition>

    <!-- Main Card -->
    <Card
      ref="cardRef"
      :class="cardClasses"
      :style="swipeTransform"
      v-bind="dragAttributes"
      @click="handleClick"
      :aria-label="cardLabel"
      role="button"
      tabindex="0"
      @keydown.enter="handleClick"
      @keydown.space.prevent="handleClick"
    >
      <!-- Mobile drag indicator -->
      <div 
        v-if="isMobile && isPressed && !isDragging"
        class="absolute inset-0 bg-primary/5 rounded-lg pointer-events-none"
      />

      <!-- Drag Handle -->
      <div 
        :class="[
          'absolute top-2 left-2 transition-opacity',
          isMobile ? 'opacity-20' : 'opacity-0 hover:opacity-40'
        ]"
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
                :src="matter.assignedLawyer.avatar || ''" 
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
                :src="matter.assignedClerk.avatar || ''"
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
  </div>
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

/* Mobile-specific styles */
.matter-card-wrapper {
  position: relative;
  overflow: hidden;
}

/* Swipe actions container */
.swipe-actions-container {
  background: rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(2px);
  z-index: 10;
}

/* Swipe actions transitions */
.swipe-actions-enter-active,
.swipe-actions-leave-active {
  transition: opacity 0.3s ease;
}

.swipe-actions-enter-from,
.swipe-actions-leave-to {
  opacity: 0;
}

/* Mobile touch optimizations */
@media (max-width: 768px) {
  .card {
    /* Increase touch target size */
    min-height: 88px;
    /* Optimize for touch */
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  
  /* Remove hover effects on touch devices */
  @media (hover: none) {
    .card:hover {
      transform: none !important;
      box-shadow: none !important;
    }
  }
  
  /* Larger text for mobile readability */
  .text-xs {
    font-size: 0.8125rem;
  }
  
  .text-sm {
    font-size: 0.9375rem;
  }
  
  /* Increase spacing for touch targets */
  .gap-1 {
    gap: 0.375rem;
  }
  
  .gap-2 {
    gap: 0.625rem;
  }
  
  /* Optimize avatar size for mobile */
  .avatar-xs {
    width: 28px;
    height: 28px;
  }
}

/* Landscape mode adjustments */
@media (max-width: 768px) and (orientation: landscape) {
  .card {
    min-height: 72px;
  }
  
  /* Hide less important elements in landscape */
  .tags-container {
    display: none;
  }
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
  
  .swipe-actions-container {
    background: rgba(0, 0, 0, 0.1);
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
  .matter-card-leave-active,
  .swipe-actions-enter-active,
  .swipe-actions-leave-active {
    transition: none;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .swipe-actions-container {
    background: rgba(255, 255, 255, 0.05);
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
  .group-hover\:opacity-100,
  .swipe-actions-container {
    display: none;
  }
}

/* Touch gesture visual feedback */
.touch-manipulation {
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}

/* Active state for mobile */
.active\:scale-\[0\.98\]:active {
  transform: scale(0.98);
}

/* Ensure smooth animations on mobile */
@supports (will-change: transform) {
  .card {
    will-change: transform;
  }
}
</style>
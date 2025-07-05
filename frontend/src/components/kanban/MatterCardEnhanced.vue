<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { CalendarDays, Clock, Users, Edit2, Check, X } from 'lucide-vue-next'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import type { MatterCard, ViewPreferences, MatterPriority } from '~/types/kanban'
import { useAnimations, useFLIPAnimation } from '~/composables/useAnimations'
import { ANIMATION_DURATION, ANIMATION_EASING } from '~/constants/animations'

interface Props {
  matter: MatterCard
  viewPreferences?: ViewPreferences
  isSelected?: boolean
  isMultiSelectMode?: boolean
  canSelect?: boolean
  isDragging?: boolean
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  viewPreferences: () => ({
    cardSize: 'normal',
    showTags: true,
    showAvatars: true,
    showDueDates: true,
    showPriority: true,
    groupBy: 'status'
  }),
  isSelected: false,
  isMultiSelectMode: false,
  canSelect: true,
  isDragging: false,
  className: ''
})

const emit = defineEmits<{
  click: [matter: MatterCard]
  edit: [matter: MatterCard]
  update: [matter: MatterCard, field: string, value: unknown]
  'update:selected': [selected: boolean]
  dblclick: [matter: MatterCard]
  keydown: [event: KeyboardEvent]
}>()

// Edit mode state
const isEditMode = ref(false)
const editingField = ref<string | null>(null)
const editValues = ref({
  title: props.matter.title,
  description: props.matter.description,
  priority: props.matter.priority
})

// Refs for animation
const cardRef = ref<HTMLElement>()
const titleInputRef = ref<HTMLInputElement>()

// Animation composables
const { animationsEnabled, getAnimationDuration } = useAnimations()
const { flip } = useFLIPAnimation()

// Auto-save timer
let autoSaveTimer: NodeJS.Timeout | null = null

// Computed classes
const cardClasses = computed(() => [
  'matter-card',
  `card-${props.viewPreferences.cardSize}`,
  props.className,
  {
    'is-selected': props.isSelected,
    'is-dragging': props.isDragging,
    'is-edit-mode': isEditMode.value,
    'multi-select-mode': props.isMultiSelectMode,
    'animate-gpu': animationsEnabled.value,
    'card-hover': !isEditMode.value && animationsEnabled.value
  }
])

// Priority badge variant
const priorityVariant = computed(() => {
  switch (props.matter.priority) {
    case 'URGENT': return 'destructive'
    case 'HIGH': return 'default'
    case 'MEDIUM': return 'secondary'
    case 'LOW': return 'outline'
    default: return 'outline'
  }
})

// Methods
const enterEditMode = async (field?: string) => {
  if (isEditMode.value) return
  
  isEditMode.value = true
  editingField.value = field || 'title'
  
  // Copy current values
  editValues.value = {
    title: props.matter.title,
    description: props.matter.description,
    priority: props.matter.priority
  }
  
  // Animate transition if enabled
  if (animationsEnabled.value && cardRef.value) {
    cardRef.value.style.transition = `all ${ANIMATION_DURATION.fast}ms ${ANIMATION_EASING.standard}`
  }
  
  // Focus input on next tick
  await nextTick()
  if (editingField.value === 'title' && titleInputRef.value) {
    titleInputRef.value.focus()
    titleInputRef.value.select()
  }
}

const exitEditMode = (save = false) => {
  if (!isEditMode.value) return
  
  if (save) {
    // Save changes
    Object.entries(editValues.value).forEach(([field, value]) => {
      if (value !== props.matter[field as keyof MatterCard]) {
        emit('update', props.matter, field, value)
      }
    })
  }
  
  isEditMode.value = false
  editingField.value = null
  
  // Clear auto-save timer
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
    autoSaveTimer = null
  }
  
  // Animate transition if enabled
  if (animationsEnabled.value && cardRef.value) {
    cardRef.value.style.transition = `all ${ANIMATION_DURATION.fast}ms ${ANIMATION_EASING.standard}`
  }
}

const handleFieldChange = (field: string, value: unknown) => {
  if (field === 'priority') {
    editValues.value[field] = value as "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  } else {
    editValues.value[field as keyof typeof editValues.value] = value as string
  }
  
  // Reset auto-save timer
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
  
  // Auto-save after 2 seconds of inactivity
  autoSaveTimer = setTimeout(() => {
    emit('update', props.matter, field, value)
  }, 2000)
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (isEditMode.value) {
    switch (event.key) {
      case 'Enter':
        if (!event.shiftKey) {
          event.preventDefault()
          exitEditMode(true)
        }
        break
      case 'Escape':
        event.preventDefault()
        exitEditMode(false)
        break
      case 'Tab':
        // Handle tab navigation between fields
        event.preventDefault()
        const fields = ['title', 'description', 'priority']
        const currentIndex = fields.indexOf(editingField.value || 'title')
        const nextIndex = event.shiftKey 
          ? (currentIndex - 1 + fields.length) % fields.length
          : (currentIndex + 1) % fields.length
        editingField.value = fields[nextIndex]
        break
    }
  } else {
    switch (event.key) {
      case 'F2':
      case 'Enter':
        if (!props.isMultiSelectMode) {
          event.preventDefault()
          enterEditMode()
        }
        break
    }
  }
  
  emit('keydown', event)
}

const handleDoubleClick = () => {
  if (!props.isMultiSelectMode && !isEditMode.value) {
    enterEditMode()
  }
  emit('dblclick', props.matter)
}

const handleClick = (event: MouseEvent) => {
  if (!isEditMode.value) {
    emit('click', props.matter)
  }
}

const handleCheckboxChange = (checked: boolean) => {
  emit('update:selected', checked)
}

// Format dates
const formatDate = (date?: Date | string) => {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Lifecycle
onUnmounted(() => {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
})
</script>

<template>
  <div
    ref="cardRef"
    :class="cardClasses"
    @click="handleClick"
    @dblclick="handleDoubleClick"
    @keydown="handleKeyDown"
    tabindex="0"
    role="article"
    :aria-label="`Matter: ${matter.title}`"
    :aria-selected="isSelected"
  >
    <!-- Selection checkbox -->
    <Transition name="scale">
      <div v-if="isMultiSelectMode && canSelect" class="selection-checkbox">
        <input
          type="checkbox"
          :checked="isSelected"
          @change="handleCheckboxChange(($event.target as HTMLInputElement).checked)"
          @click.stop
          class="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
          :aria-label="`Select ${matter.title}`"
        />
      </div>
    </Transition>
    
    <!-- Quick edit button -->
    <Transition name="fade">
      <Button
        v-if="!isEditMode && !isMultiSelectMode"
        size="sm"
        variant="ghost"
        class="edit-button"
        @click.stop="enterEditMode()"
        aria-label="Edit matter"
      >
        <Edit2 class="w-3 h-3" />
      </Button>
    </Transition>
    
    <!-- Card content -->
    <div class="card-content">
      <!-- Title -->
      <div class="matter-title-container">
        <Transition name="edit-mode" mode="out-in">
          <Input
            v-if="isEditMode && editingField === 'title'"
            ref="titleInputRef"
            v-model="editValues.title"
            @input="handleFieldChange('title', ($event.target as HTMLInputElement).value)"
            @keydown="handleKeyDown"
            class="title-input"
            placeholder="Matter title"
            aria-label="Edit matter title"
          />
          <h3 v-else class="matter-title" @click="isEditMode && (editingField = 'title')">
            {{ matter.title }}
          </h3>
        </Transition>
      </div>
      
      <!-- Description -->
      <div v-if="matter.description || isEditMode" class="matter-description-container">
        <Transition name="edit-mode" mode="out-in">
          <textarea
            v-if="isEditMode && editingField === 'description'"
            v-model="editValues.description"
            @input="handleFieldChange('description', ($event.target as HTMLTextAreaElement).value)"
            @keydown="handleKeyDown"
            class="description-input"
            placeholder="Add description..."
            rows="2"
            aria-label="Edit matter description"
          />
          <p v-else class="matter-description" @click="isEditMode && (editingField = 'description')">
            {{ matter.description || 'No description' }}
          </p>
        </Transition>
      </div>
      
      <!-- Meta information -->
      <div class="matter-meta">
        <!-- Priority -->
        <div v-if="viewPreferences.showPriority" class="meta-item">
          <Transition name="edit-mode" mode="out-in">
            <Select
              v-if="isEditMode && editingField === 'priority'"
              :modelValue="editValues.priority"
              @update:modelValue="(value) => handleFieldChange('priority', value)"
            >
              <SelectTrigger class="h-6 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <Badge 
              v-else 
              :variant="priorityVariant" 
              class="priority-badge"
              @click="isEditMode && (editingField = 'priority')"
            >
              {{ matter.priority }}
            </Badge>
          </Transition>
        </div>
        
        <!-- Assignee -->
        <div v-if="viewPreferences.showAvatars && matter.assignedLawyer" class="meta-item">
          <Users class="w-3 h-3" />
          <span class="meta-text">{{ matter.assignedLawyer.name }}</span>
        </div>
        
        <!-- Due date -->
        <div v-if="viewPreferences.showDueDates && matter.dueDate" class="meta-item">
          <CalendarDays class="w-3 h-3" />
          <span class="meta-text">{{ formatDate(matter.dueDate) }}</span>
        </div>
        
        <!-- Updated time -->
        <div v-if="viewPreferences.showDueDates" class="meta-item">
          <Clock class="w-3 h-3" />
          <span class="meta-text">{{ formatDate(matter.updatedAt) }}</span>
        </div>
      </div>
      
      <!-- Tags -->
      <div v-if="viewPreferences.showTags && matter.tags?.length" class="matter-tags">
        <TransitionGroup name="list" tag="div" class="tags-container">
          <Badge
            v-for="tag in matter.tags"
            :key="tag"
            variant="outline"
            class="tag-badge"
          >
            {{ tag }}
          </Badge>
        </TransitionGroup>
      </div>
    </div>
    
    <!-- Edit mode actions -->
    <Transition name="slide-in-up">
      <div v-if="isEditMode" class="edit-actions">
        <Button
          size="sm"
          variant="ghost"
          @click.stop="exitEditMode(true)"
          class="save-button"
          aria-label="Save changes"
        >
          <Check class="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          @click.stop="exitEditMode(false)"
          class="cancel-button"
          aria-label="Cancel changes"
        >
          <X class="w-4 h-4" />
        </Button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.matter-card {
  @apply relative p-4 bg-white border border-gray-200 rounded-lg cursor-pointer;
  @apply transition-all duration-200 ease-in-out;
  @apply focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2;
}

.matter-card.card-hover:hover {
  @apply shadow-md transform -translate-y-0.5;
}

.matter-card.is-selected {
  @apply ring-2 ring-primary ring-offset-2;
}

.matter-card.is-dragging {
  @apply opacity-50 cursor-grabbing;
}

.matter-card.is-edit-mode {
  @apply shadow-lg ring-2 ring-primary cursor-default;
  z-index: 10;
}

/* Card sizes */
.matter-card.card-compact {
  @apply p-3;
}

.matter-card.card-normal {
  @apply p-4;
}

.matter-card.card-large {
  @apply p-5;
}

/* Selection checkbox */
.selection-checkbox {
  @apply absolute top-2 left-2 z-10;
}

/* Edit button */
.edit-button {
  @apply absolute top-2 right-2 opacity-0 transition-opacity;
  @apply h-6 w-6 p-0;
}

.matter-card:hover .edit-button,
.matter-card:focus .edit-button {
  @apply opacity-100;
}

/* Content */
.card-content {
  @apply space-y-3;
}

.matter-title-container {
  @apply min-h-[1.5rem];
}

.matter-title {
  @apply text-sm font-semibold text-gray-900 line-clamp-2;
}

.title-input {
  @apply h-auto p-0 text-sm font-semibold border-0 focus:ring-0;
}

.matter-description-container {
  @apply min-h-[2.5rem];
}

.matter-description {
  @apply text-sm text-gray-600 line-clamp-2;
}

.description-input {
  @apply w-full p-1 text-sm border rounded resize-none focus:ring-1 focus:ring-primary;
}

/* Meta information */
.matter-meta {
  @apply flex flex-wrap items-center gap-3 text-xs text-gray-500;
}

.meta-item {
  @apply flex items-center gap-1;
}

.meta-text {
  @apply truncate max-w-[100px];
}

.priority-badge {
  @apply text-xs cursor-pointer;
}

/* Tags */
.matter-tags {
  @apply pt-2;
}

.tags-container {
  @apply flex flex-wrap gap-1;
}

.tag-badge {
  font-size: 0.75rem; line-height: 1rem;
}

/* Edit actions */
.edit-actions {
  @apply absolute bottom-2 right-2 flex gap-1;
}

.save-button {
  @apply text-green-600 hover:bg-green-50;
}

.cancel-button {
  @apply text-red-600 hover:bg-red-50;
}

/* Animations */
.edit-mode-enter-active,
.edit-mode-leave-active {
  transition: all 150ms ease-out;
}

.edit-mode-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.edit-mode-leave-to {
  opacity: 0;
  transform: scale(1.05);
}

.slide-in-up-enter-active,
.slide-in-up-leave-active {
  transition: all 200ms ease-out;
}

.slide-in-up-enter-from {
  opacity: 0;
  transform: translateY(0.5rem);
}

.slide-in-up-leave-to {
  opacity: 0;
  transform: translateY(0.5rem);
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .matter-card {
    @apply transition-none;
  }
  
  .matter-card.card-hover:hover {
    @apply transform-none;
  }
}
</style>
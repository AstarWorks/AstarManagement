<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/ui/select'
import { Badge } from '~/components/ui/badge'
import { Check, X, Loader2 } from 'lucide-vue-next'
import type { Matter, MatterStatus, MatterPriority } from '~/types/matter'

type EditableType = 'text' | 'select' | 'status' | 'priority' | 'date'

interface Props {
  /** The matter object being edited */
  matter: Matter
  /** The field key to edit */
  field: keyof Matter
  /** The type of editor to display */
  type: EditableType
  /** Current field value */
  value: any
  /** Whether this cell is currently being edited */
  isEditing: boolean
  /** Whether the save operation is in progress */
  isSaving?: boolean
  /** Validation error message */
  error?: string
  /** Options for select type */
  options?: { label: string; value: any }[]
  /** Whether the field is required */
  required?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isSaving: false,
  required: false
})

const emit = defineEmits<{
  /** Start editing this cell */
  'edit:start': []
  /** Cancel editing */
  'edit:cancel': []
  /** Save the new value */
  'edit:save': [value: any]
  /** Key press events for navigation */
  'key:escape': []
  'key:enter': []
  'key:tab': [shiftKey: boolean]
}>()

// Internal state
const editValue = ref(props.value)
const inputRef = ref<HTMLInputElement>()
const hasChanged = computed(() => editValue.value !== props.value)

// Status options
const statusOptions = [
  { label: 'Intake', value: 'INTAKE' },
  { label: 'Initial Review', value: 'INITIAL_REVIEW' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Review', value: 'REVIEW' },
  { label: 'Waiting Client', value: 'WAITING_CLIENT' },
  { label: 'Ready Filing', value: 'READY_FILING' },
  { label: 'Closed', value: 'CLOSED' }
]

const priorityOptions = [
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Urgent', value: 'URGENT' }
]

// Get options based on type
const selectOptions = computed(() => {
  switch (props.type) {
    case 'status':
      return statusOptions
    case 'priority':
      return priorityOptions
    default:
      return props.options || []
  }
})

// Format display value
const displayValue = computed(() => {
  if (props.value === null || props.value === undefined) return '-'
  
  switch (props.type) {
    case 'status':
      return statusOptions.find(opt => opt.value === props.value)?.label || props.value
    case 'priority':
      return priorityOptions.find(opt => opt.value === props.value)?.label || props.value
    case 'date':
      return props.value ? new Date(props.value).toLocaleDateString() : '-'
    default:
      return String(props.value)
  }
})

// Badge variant for status/priority
const getBadgeVariant = (value: any) => {
  if (props.type === 'priority') {
    switch (value) {
      case 'URGENT': return 'destructive'
      case 'HIGH': return 'default'
      case 'MEDIUM': return 'secondary'
      case 'LOW': return 'outline'
      default: return 'outline'
    }
  }
  
  if (props.type === 'status') {
    switch (value) {
      case 'INTAKE': return 'secondary'
      case 'INITIAL_REVIEW': return 'secondary'
      case 'IN_PROGRESS': return 'default'
      case 'REVIEW': return 'default'
      case 'WAITING_CLIENT': return 'outline'
      case 'READY_FILING': return 'default'
      case 'CLOSED': return 'secondary'
      default: return 'outline'
    }
  }
  
  return 'outline'
}

// Start editing
const startEdit = () => {
  if (!props.isEditing) {
    editValue.value = props.value
    emit('edit:start')
    
    nextTick(() => {
      if (inputRef.value) {
        inputRef.value.focus()
        if (props.type === 'text') {
          inputRef.value.select()
        }
      }
    })
  }
}

// Cancel editing
const cancelEdit = () => {
  editValue.value = props.value
  emit('edit:cancel')
}

// Save changes
const saveEdit = () => {
  if (hasChanged.value) {
    emit('edit:save', editValue.value)
  } else {
    emit('edit:cancel')
  }
}

// Handle keyboard events
const handleKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Escape':
      event.preventDefault()
      emit('key:escape')
      cancelEdit()
      break
    case 'Enter':
      event.preventDefault()
      emit('key:enter')
      saveEdit()
      break
    case 'Tab':
      event.preventDefault()
      emit('key:tab', event.shiftKey)
      saveEdit()
      break
  }
}

// Watch for external changes
watch(() => props.value, (newValue) => {
  if (!props.isEditing) {
    editValue.value = newValue
  }
})

// Watch editing state to focus input
watch(() => props.isEditing, (isEditing) => {
  if (isEditing && inputRef.value) {
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
})
</script>

<template>
  <div class="editable-cell">
    <!-- Display mode -->
    <div
      v-if="!isEditing"
      class="cell-display group cursor-pointer min-h-[32px] flex items-center"
      @click="startEdit"
      @dblclick="startEdit"
    >
      <!-- Status/Priority with badge -->
      <template v-if="type === 'status' || type === 'priority'">
        <Badge :variant="getBadgeVariant(value)" class="group-hover:ring-2 group-hover:ring-primary/20">
          {{ displayValue }}
        </Badge>
      </template>
      
      <!-- Text fields -->
      <template v-else>
        <span 
          class="cell-value group-hover:bg-muted/50 px-2 py-1 rounded transition-colors"
          :class="{
            'text-muted-foreground italic': !value,
            'font-medium': field === 'title'
          }"
        >
          {{ displayValue }}
        </span>
      </template>
      
      <!-- Edit indicator -->
      <div class="edit-indicator opacity-0 group-hover:opacity-100 ml-2 transition-opacity">
        <Button variant="ghost" size="sm" class="h-6 w-6 p-0">
          <Icon name="lucide:edit-2" class="h-3 w-3" />
        </Button>
      </div>
    </div>

    <!-- Edit mode -->
    <div v-else class="cell-edit flex items-center gap-2">
      <!-- Text input -->
      <Input
        v-if="type === 'text'"
        ref="inputRef"
        v-model="editValue"
        class="h-8 text-sm"
        :class="{ 'border-destructive': error }"
        @keydown="handleKeydown"
        @blur="saveEdit"
      />
      
      <!-- Date input -->
      <Input
        v-else-if="type === 'date'"
        ref="inputRef"
        v-model="editValue"
        type="date"
        class="h-8 text-sm"
        :class="{ 'border-destructive': error }"
        @keydown="handleKeydown"
        @blur="saveEdit"
      />
      
      <!-- Select dropdown -->
      <Select
        v-else-if="type === 'select' || type === 'status' || type === 'priority'"
        v-model="editValue"
        @update:model-value="saveEdit"
      >
        <SelectTrigger class="h-8 text-sm" :class="{ 'border-destructive': error }">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="option in selectOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </SelectItem>
        </SelectContent>
      </Select>

      <!-- Action buttons for complex edits -->
      <div v-if="type === 'text' || type === 'date'" class="flex items-center gap-1">
        <!-- Save button -->
        <Button
          variant="ghost"
          size="sm"
          class="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
          :disabled="isSaving || !hasChanged"
          @click="saveEdit"
        >
          <Loader2 v-if="isSaving" class="h-3 w-3 animate-spin" />
          <Check v-else class="h-3 w-3" />
        </Button>
        
        <!-- Cancel button -->
        <Button
          variant="ghost"
          size="sm"
          class="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          :disabled="isSaving"
          @click="cancelEdit"
        >
          <X class="h-3 w-3" />
        </Button>
      </div>
    </div>

    <!-- Error message -->
    <div v-if="error && isEditing" class="text-xs text-destructive mt-1">
      {{ error }}
    </div>
  </div>
</template>

<style scoped>
.editable-cell {
  @apply relative;
}

.cell-display {
  @apply w-full justify-between;
}

.cell-value {
  @apply flex-1 min-w-0 truncate;
}

.edit-indicator {
  @apply flex-shrink-0;
}

.cell-edit {
  @apply w-full;
}

/* Focus styles */
.cell-display:hover {
  @apply bg-muted/30 rounded;
}

.cell-display:focus-within {
  @apply ring-2 ring-primary/20 rounded;
}
</style>
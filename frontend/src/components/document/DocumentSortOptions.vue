<template>
  <div class="document-sort-options">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" :disabled="disabled">
          <ArrowUpDown class="h-4 w-4 mr-2" />
          Sort: {{ currentSortLabel }}
          <ChevronDown class="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" class="w-48">
        <div class="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
          Sort by
        </div>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          v-for="option in sortOptions"
          :key="option.field"
          @click="setSortField(option.field)"
          :class="modelValue.field === option.field ? 'bg-accent' : ''"
        >
          <component :is="option.icon" class="h-4 w-4 mr-2" />
          <span class="flex-1">{{ option.label }}</span>
          <div class="flex items-center ml-2">
            <!-- Direction indicator -->
            <Button
              v-if="modelValue.field === option.field"
              variant="ghost"
              size="sm"
              class="h-6 w-6 p-0"
              @click.stop="toggleDirection"
              :title="`Sort ${modelValue.direction === 'asc' ? 'descending' : 'ascending'}`"
            >
              <ArrowUp v-if="modelValue.direction === 'asc'" class="h-3 w-3" />
              <ArrowDown v-else class="h-3 w-3" />
            </Button>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <!-- Quick sort directions -->
        <div class="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
          Direction
        </div>
        <DropdownMenuItem
          @click="setDirection('asc')"
          :class="modelValue.direction === 'asc' ? 'bg-accent' : ''"
        >
          <ArrowUp class="h-4 w-4 mr-2" />
          Ascending
          <Check v-if="modelValue.direction === 'asc'" class="h-4 w-4 ml-auto" />
        </DropdownMenuItem>
        <DropdownMenuItem
          @click="setDirection('desc')"
          :class="modelValue.direction === 'desc' ? 'bg-accent' : ''"
        >
          <ArrowDown class="h-4 w-4 mr-2" />
          Descending
          <Check v-if="modelValue.direction === 'desc'" class="h-4 w-4 ml-auto" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  ChevronDown,
  Check,
  Calendar,
  FileText,
  HardDrive,
  Type,
  User,
  Clock
} from 'lucide-vue-next'

import { Button } from '~/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '~/components/ui/dropdown-menu'

import type { DocumentSortConfig, Document as DocumentType } from '~/types/document'

interface Props {
  modelValue: DocumentSortConfig
  disabled?: boolean
  availableFields?: Array<keyof DocumentType>
}

interface Emits {
  (e: 'update:modelValue', value: DocumentSortConfig): void
  (e: 'change', value: DocumentSortConfig): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  availableFields: () => ['fileName', 'modifiedDate', 'createdDate', 'size', 'mimeType'] as (keyof DocumentType)[]
})

const emit = defineEmits<Emits>()

// Sort field options with icons and labels
const allSortOptions = [
  {
    field: 'fileName' as const,
    label: 'Name',
    icon: Type
  },
  {
    field: 'modifiedDate' as const,
    label: 'Modified Date',
    icon: Calendar
  },
  {
    field: 'createdDate' as const,
    label: 'Created Date',
    icon: Clock
  },
  {
    field: 'size' as const,
    label: 'Size',
    icon: HardDrive
  },
  {
    field: 'mimeType' as const,
    label: 'Type',
    icon: FileText
  },
  {
    field: 'createdBy' as const,
    label: 'Created By',
    icon: User
  }
]

// Filter options based on available fields
const sortOptions = computed(() => 
  allSortOptions.filter(option => 
    props.availableFields.includes(option.field)
  )
)

// Current sort label for display
const currentSortLabel = computed(() => {
  const option = sortOptions.value.find(opt => opt.field === props.modelValue.field)
  if (!option) return 'Unknown'
  
  const direction = props.modelValue.direction === 'asc' ? '↑' : '↓'
  return `${option.label} ${direction}`
})

// Event handlers
const setSortField = (field: keyof DocumentType) => {
  const newConfig: DocumentSortConfig = {
    field: field,
    direction: props.modelValue.field === field ? props.modelValue.direction : 'desc'
  }
  
  emit('update:modelValue', newConfig)
  emit('change', newConfig)
}

const setDirection = (direction: 'asc' | 'desc') => {
  if (direction === props.modelValue.direction) return
  
  const newConfig: DocumentSortConfig = {
    field: props.modelValue.field,
    direction
  }
  
  emit('update:modelValue', newConfig)
  emit('change', newConfig)
}

const toggleDirection = () => {
  const newDirection = props.modelValue.direction === 'asc' ? 'desc' : 'asc'
  setDirection(newDirection)
}
</script>

<style scoped>
.document-sort-options {
  @apply flex items-center;
}

/* Focus states for accessibility */
:deep(.dropdown-menu-trigger:focus-visible) {
  @apply ring-2 ring-ring ring-offset-2;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  :deep(.dropdown-menu-content) {
    @apply border-2;
  }
}

/* Mobile responsive */
@media (max-width: 640px) {
  :deep(.dropdown-menu-trigger) {
    @apply text-xs px-2;
  }
  
  :deep(.dropdown-menu-content) {
    @apply w-40;
  }
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  :deep(.dropdown-menu-item) {
    @apply min-h-[44px]; /* WCAG touch target size */
  }
}
</style>
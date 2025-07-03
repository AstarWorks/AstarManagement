<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Badge } from '~/components/ui/badge'
import { Clock, Users, AlertTriangle } from 'lucide-vue-next'
import type { Matter } from '~/types/matter'

interface ConflictData {
  matterId: string
  field: string
  yourValue: any
  serverValue: any
  yourTimestamp: number
  serverTimestamp: number
  serverUser?: string
}

interface Props {
  /** Whether the conflict dialog is open */
  open: boolean
  /** The conflict data to resolve */
  conflict: ConflictData | null
  /** The matter being edited */
  matter?: Matter
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'resolve': [resolution: 'keep-yours' | 'use-server' | 'merge', value?: any]
  'cancel': []
  'update:open': [open: boolean]
}>()

// Local state for merge resolution
const mergedValue = ref('')
const selectedResolution = ref<'keep-yours' | 'use-server' | 'merge' | null>(null)

// Format field names for display
const formatFieldName = (field: string) => {
  switch (field) {
    case 'caseNumber': return 'Matter Number'
    case 'clientName': return 'Client Name'
    case 'dueDate': return 'Due Date'
    default: return field.charAt(0).toUpperCase() + field.slice(1)
  }
}

// Format values for display
const formatValue = (value: any, field: string) => {
  if (value === null || value === undefined) return 'Empty'
  
  switch (field) {
    case 'status':
      return (value as string).replace(/_/g, ' ')
    case 'priority':
      return value
    case 'dueDate':
      return value ? new Date(value).toLocaleDateString() : 'Not set'
    default:
      return String(value)
  }
}

// Get time difference in a readable format
const getTimeDifference = (timestamp: number) => {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  return 'Just now'
}

// Computed properties
const fieldDisplayName = computed(() => 
  props.conflict ? formatFieldName(props.conflict.field) : ''
)

const yourDisplayValue = computed(() => 
  props.conflict ? formatValue(props.conflict.yourValue, props.conflict.field) : ''
)

const serverDisplayValue = computed(() => 
  props.conflict ? formatValue(props.conflict.serverValue, props.conflict.field) : ''
)

const yourTimeAgo = computed(() => 
  props.conflict ? getTimeDifference(props.conflict.yourTimestamp) : ''
)

const serverTimeAgo = computed(() => 
  props.conflict ? getTimeDifference(props.conflict.serverTimestamp) : ''
)

const canMerge = computed(() => {
  if (!props.conflict) return false
  const { field } = props.conflict
  return ['title', 'description', 'clientName'].includes(field)
})

const canResolve = computed(() => {
  return selectedResolution.value !== null && 
    (selectedResolution.value !== 'merge' || mergedValue.value.trim().length > 0)
})

// Handle resolution selection
const selectResolution = (resolution: 'keep-yours' | 'use-server' | 'merge') => {
  selectedResolution.value = resolution
  
  if (resolution === 'merge' && props.conflict) {
    // Initialize merged value with your value
    mergedValue.value = String(props.conflict.yourValue || '')
  }
}

// Resolve the conflict
const resolveConflict = () => {
  if (!selectedResolution.value || !props.conflict) return
  
  if (selectedResolution.value === 'merge') {
    emit('resolve', 'merge', mergedValue.value)
  } else {
    emit('resolve', selectedResolution.value)
  }
  
  // Reset state
  selectedResolution.value = null
  mergedValue.value = ''
}

// Cancel resolution
const cancel = () => {
  selectedResolution.value = null
  mergedValue.value = ''
  emit('cancel')
}

// Watch for dialog open changes
watch(() => props.open, (open) => {
  if (!open) {
    selectedResolution.value = null
    mergedValue.value = ''
  }
}, { immediate: true })
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <AlertTriangle class="h-5 w-5 text-amber-500" />
          Resolve Editing Conflict
        </DialogTitle>
        <DialogDescription>
          Someone else has modified this field while you were editing it. 
          Please choose how to resolve this conflict.
        </DialogDescription>
      </DialogHeader>

      <div v-if="conflict" class="space-y-6">
        <!-- Field information -->
        <div class="bg-muted/50 p-4 rounded-lg">
          <h3 class="font-semibold mb-2">Field: {{ fieldDisplayName }}</h3>
          <div v-if="matter" class="text-sm text-muted-foreground">
            Matter: {{ matter.title }} ({{ matter.caseNumber }})
          </div>
        </div>

        <!-- Conflict options -->
        <div class="space-y-4">
          <!-- Keep your version -->
          <div 
            class="border rounded-lg p-4 cursor-pointer transition-colors"
            :class="selectedResolution === 'keep-yours' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'"
            @click="selectResolution('keep-yours')"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <input 
                    type="radio" 
                    :checked="selectedResolution === 'keep-yours'"
                    class="w-4 h-4"
                    readonly
                  />
                  <span class="font-medium">Keep your version</span>
                  <Badge variant="outline" class="text-xs">
                    <Clock class="w-3 h-3 mr-1" />
                    {{ yourTimeAgo }}
                  </Badge>
                </div>
                <div class="text-sm pl-6">
                  <div class="font-mono bg-background border rounded p-2">
                    {{ yourDisplayValue }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Use server version -->
          <div 
            class="border rounded-lg p-4 cursor-pointer transition-colors"
            :class="selectedResolution === 'use-server' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'"
            @click="selectResolution('use-server')"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <input 
                    type="radio" 
                    :checked="selectedResolution === 'use-server'"
                    class="w-4 h-4"
                    readonly
                  />
                  <span class="font-medium">Use server version</span>
                  <Badge variant="outline" class="text-xs">
                    <Users class="w-3 h-3 mr-1" />
                    {{ conflict.serverUser || 'Another user' }}
                  </Badge>
                  <Badge variant="outline" class="text-xs">
                    <Clock class="w-3 h-3 mr-1" />
                    {{ serverTimeAgo }}
                  </Badge>
                </div>
                <div class="text-sm pl-6">
                  <div class="font-mono bg-background border rounded p-2">
                    {{ serverDisplayValue }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Merge versions (for text fields) -->
          <div 
            v-if="canMerge"
            class="border rounded-lg p-4 cursor-pointer transition-colors"
            :class="selectedResolution === 'merge' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'"
            @click="selectResolution('merge')"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <input 
                    type="radio" 
                    :checked="selectedResolution === 'merge'"
                    class="w-4 h-4"
                    readonly
                  />
                  <span class="font-medium">Merge manually</span>
                  <Badge variant="outline" class="text-xs">Custom</Badge>
                </div>
                <div class="text-sm pl-6">
                  <textarea
                    v-model="mergedValue"
                    class="w-full min-h-[80px] p-2 font-mono text-sm border rounded resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                    :disabled="selectedResolution !== 'merge'"
                    placeholder="Create your own version by combining both..."
                  />
                  <div class="mt-2 text-xs text-muted-foreground">
                    Tip: You can copy parts from both versions above and combine them here.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Preview comparison -->
        <div v-if="selectedResolution" class="bg-muted/30 p-4 rounded-lg">
          <h4 class="font-medium mb-2">Preview of resolution:</h4>
          <div class="font-mono text-sm bg-background border rounded p-2">
            <template v-if="selectedResolution === 'keep-yours'">
              {{ yourDisplayValue }}
            </template>
            <template v-else-if="selectedResolution === 'use-server'">
              {{ serverDisplayValue }}
            </template>
            <template v-else-if="selectedResolution === 'merge'">
              {{ mergedValue || 'Enter your merged version above' }}
            </template>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="cancel">
          Cancel
        </Button>
        <Button 
          @click="resolveConflict"
          :disabled="!canResolve"
        >
          Apply Resolution
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
/* Radio button styling */
input[type="radio"] {
  @apply text-primary focus:ring-primary/20;
}

/* Disabled textarea styling */
textarea:disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* Hover states for resolution options */
.cursor-pointer:hover input[type="radio"] {
  @apply scale-110;
}
</style>
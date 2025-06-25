<template>
  <AlertDialog :open="open" @update:open="$emit('update:open', $event)">
    <AlertDialogContent class="sm:max-w-[425px]">
      <AlertDialogHeader>
        <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
        <AlertDialogDescription>
          You are about to change the status of
          <span class="font-semibold">{{ transition?.matterTitle }}</span> from
          <span class="font-semibold">{{ fromStatusLabel }}</span> to
          <span class="font-semibold">{{ toStatusLabel }}</span>.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <!-- Critical transition warning -->
      <div v-if="isCriticalTransition" class="rounded-lg border p-3">
        <div class="flex">
          <AlertTriangle class="h-4 w-4 mt-0.5 mr-2" :class="isClosing ? 'text-destructive' : 'text-warning'" />
          <div class="flex-1">
            <div class="text-sm">
              <strong v-if="isClosing">Warning:</strong>
              <strong v-else>Important:</strong>
              <span v-if="isClosing">
                Closing a matter is a final action. Once closed, this matter cannot be reopened. 
                Please ensure all necessary work has been completed.
              </span>
              <span v-else>
                Moving to {{ toStatusLabel }} status requires careful consideration. 
                This action will be logged and may trigger additional workflows.
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-4 py-4">
        <div class="space-y-2">
          <Label for="reason" class="text-sm font-medium">
            Reason for status change <span class="text-destructive">*</span>
          </Label>
          <Textarea
            id="reason"
            v-model="reason"
            placeholder="Please provide a detailed reason for this status change..."
            class="min-h-[100px]"
            :disabled="isLoading"
            @input="error = ''"
          />
          <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
        </div>

        <!-- Settlement-specific info -->
        <div v-if="transition?.to === 'SETTLEMENT'" class="rounded-lg border p-3">
          <div class="flex">
            <Info class="h-4 w-4 mt-0.5 mr-2 text-blue-500" />
            <div class="flex-1">
              <div class="text-sm">
                Settlement status requires additional documentation. Please ensure settlement
                terms are properly recorded in the matter notes.
              </div>
            </div>
          </div>
        </div>
      </div>

      <AlertDialogFooter>
        <div class="flex items-center justify-between w-full">
          <span class="text-xs text-muted-foreground">
            Press <kbd class="px-1 py-0.5 text-xs bg-muted rounded">Ctrl</kbd>+<kbd class="px-1 py-0.5 text-xs bg-muted rounded">Enter</kbd> to confirm
          </span>
          <div class="flex gap-2">
            <AlertDialogCancel :disabled="isLoading">
              Cancel <span class="text-xs text-muted-foreground ml-1">(Esc)</span>
            </AlertDialogCancel>
            <AlertDialogAction 
              :variant="isClosing ? 'destructive' : 'default'"
              :disabled="isLoading"
              @click="handleConfirm"
            >
              {{ isLoading ? 'Confirming...' : 'Confirm Change' }}
            </AlertDialogAction>
          </div>
        </div>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel
} from '~/components/ui/alert-dialog'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { AlertTriangle, Info } from 'lucide-vue-next'

type MatterStatus = 
  | 'INTAKE'
  | 'INITIAL_REVIEW'
  | 'INVESTIGATION'
  | 'RESEARCH'
  | 'DRAFT_PLEADINGS'
  | 'FILED'
  | 'DISCOVERY'
  | 'MEDIATION'
  | 'TRIAL_PREP'
  | 'TRIAL'
  | 'SETTLEMENT'
  | 'CLOSED'

interface StatusTransition {
  from: MatterStatus
  to: MatterStatus
  matterId: string
  matterTitle: string
}

interface StatusConfirmationDialogProps {
  open: boolean
  transition: StatusTransition | null
  isLoading?: boolean
}

const props = withDefaults(defineProps<StatusConfirmationDialogProps>(), {
  isLoading: false
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'confirm': [reason: string]
}>()

const reason = ref('')
const error = ref('')

const criticalStatuses: MatterStatus[] = ['CLOSED', 'SETTLEMENT', 'TRIAL']

const statusLabels: Record<MatterStatus, string> = {
  INTAKE: 'Intake',
  INITIAL_REVIEW: 'Initial Review',
  INVESTIGATION: 'Investigation',
  RESEARCH: 'Research',
  DRAFT_PLEADINGS: 'Draft Pleadings',
  FILED: 'Filed',
  DISCOVERY: 'Discovery',
  MEDIATION: 'Mediation',
  TRIAL_PREP: 'Trial Prep',
  TRIAL: 'Trial',
  SETTLEMENT: 'Settlement',
  CLOSED: 'Closed',
}

const fromStatusLabel = computed(() => 
  props.transition ? statusLabels[props.transition.from] : ''
)

const toStatusLabel = computed(() => 
  props.transition ? statusLabels[props.transition.to] : ''
)

const isCriticalTransition = computed(() => 
  props.transition ? criticalStatuses.includes(props.transition.to) : false
)

const isClosing = computed(() => 
  props.transition?.to === 'CLOSED'
)

// Reset form when dialog closes
watch(() => props.open, (newOpen) => {
  if (!newOpen) {
    reason.value = ''
    error.value = ''
  }
})

const handleConfirm = () => {
  if (!reason.value.trim()) {
    error.value = 'Please provide a reason for this status change'
    return
  }

  if (reason.value.trim().length < 10) {
    error.value = 'Please provide a more detailed reason (at least 10 characters)'
    return
  }

  emit('confirm', reason.value.trim())
}

// Keyboard shortcuts
const handleKeyDown = (e: KeyboardEvent) => {
  if (!props.open) return

  // Ctrl/Cmd + Enter to confirm
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault()
    handleConfirm()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>
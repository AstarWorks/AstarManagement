<!--
  Status Change Modal Component
  
  Modal for bulk status change operations with validation and confirmation.
  Shows available status transitions and impact preview.
-->

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { MatterStatus } from '~/types/kanban'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group'
import { Label } from '~/components/ui/label'
import { Alert, AlertDescription } from '~/components/ui/alert'
import { CheckCircle, AlertTriangle, MoveRight } from 'lucide-vue-next'

interface Props {
  open: boolean
  selectedCount: number
  allowedStatuses: MatterStatus[]
  currentStatuses?: MatterStatus[]
}

const props = withDefaults(defineProps<Props>(), {
  currentStatuses: () => []
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: [targetStatus: MatterStatus]
  cancel: []
}>()

// Local state
const selectedStatus = ref<MatterStatus>()
const isConfirming = ref(false)

// Status display configuration
const STATUS_CONFIG: Record<MatterStatus, { label: string; color: string; description: string }> = {
  'INTAKE': {
    label: 'Intake',
    color: 'bg-gray-100 text-gray-800',
    description: 'New matters awaiting initial review'
  },
  'INITIAL_REVIEW': {
    label: 'Initial Review',
    color: 'bg-blue-100 text-blue-800',
    description: 'Under preliminary assessment'
  },
  'IN_PROGRESS': {
    label: 'In Progress',
    color: 'bg-yellow-100 text-yellow-800',
    description: 'Active work in progress'
  },
  'REVIEW': {
    label: 'Review',
    color: 'bg-orange-100 text-orange-800',
    description: 'Ready for review and approval'
  },
  'WAITING_CLIENT': {
    label: 'Waiting Client',
    color: 'bg-purple-100 text-purple-800',
    description: 'Awaiting client response or action'
  },
  'READY_FILING': {
    label: 'Ready Filing',
    color: 'bg-green-100 text-green-800',
    description: 'Prepared for filing with court'
  },
  'CLOSED': {
    label: 'Closed',
    color: 'bg-gray-100 text-gray-800',
    description: 'Matter completed and closed'
  }
}

// Computed properties
const canConfirm = computed(() => 
  selectedStatus.value && props.allowedStatuses.includes(selectedStatus.value)
)

const impactSummary = computed(() => {
  if (!selectedStatus.value) return null
  
  const statusConfig = STATUS_CONFIG[selectedStatus.value]
  return {
    status: selectedStatus.value,
    label: statusConfig.label,
    description: statusConfig.description,
    affectedCount: props.selectedCount
  }
})

const uniqueCurrentStatuses = computed(() => 
  [...new Set(props.currentStatuses)]
)

// Methods
const handleConfirm = async () => {
  if (!selectedStatus.value || isConfirming.value) return
  
  isConfirming.value = true
  
  try {
    emit('confirm', selectedStatus.value)
  } finally {
    isConfirming.value = false
  }
}

const handleCancel = () => {
  selectedStatus.value = undefined
  emit('cancel')
  emit('update:open', false)
}

const handleOpenChange = (open: boolean) => {
  if (!open) {
    handleCancel()
  } else {
    emit('update:open', open)
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <MoveRight class="w-5 h-5 text-primary" />
          Change Status for Multiple Matters
        </DialogTitle>
        <DialogDescription>
          Select a new status for {{ selectedCount }} selected matter{{ selectedCount === 1 ? '' : 's' }}.
          Only valid status transitions are shown.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6">
        <!-- Current Status Summary -->
        <div v-if="uniqueCurrentStatuses.length > 0" class="space-y-2">
          <Label class="text-sm font-medium">Current Status{{ uniqueCurrentStatuses.length === 1 ? '' : 'es' }}:</Label>
          <div class="flex flex-wrap gap-2">
            <Badge
              v-for="status in uniqueCurrentStatuses"
              :key="status"
              variant="outline"
              :class="STATUS_CONFIG[status]?.color"
            >
              {{ STATUS_CONFIG[status]?.label || status }}
            </Badge>
          </div>
        </div>

        <!-- Status Selection -->
        <div class="space-y-3">
          <Label class="text-sm font-medium">New Status:</Label>
          
          <Alert v-if="allowedStatuses.length === 0" class="border-orange-200 bg-orange-50">
            <AlertTriangle class="w-4 h-4 text-orange-600" />
            <AlertDescription class="text-orange-800">
              No valid status transitions available for the selected matters.
              The matters may have different current statuses with conflicting transition rules.
            </AlertDescription>
          </Alert>

          <RadioGroup 
            v-else
            v-model="selectedStatus" 
            class="space-y-2"
          >
            <div 
              v-for="status in allowedStatuses"
              :key="status"
              class="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <RadioGroupItem :value="status" :id="status" class="mt-1" />
              <div class="flex-1 space-y-1">
                <Label 
                  :for="status"
                  class="flex items-center gap-2 font-medium cursor-pointer"
                >
                  <Badge 
                    variant="secondary"
                    :class="STATUS_CONFIG[status]?.color"
                  >
                    {{ STATUS_CONFIG[status]?.label || status }}
                  </Badge>
                </Label>
                <p class="text-sm text-muted-foreground">
                  {{ STATUS_CONFIG[status]?.description }}
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        <!-- Impact Preview -->
        <div v-if="impactSummary" class="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div class="flex items-start gap-3">
            <CheckCircle class="w-5 h-5 text-primary mt-0.5" />
            <div class="space-y-1">
              <p class="font-medium text-sm">
                Move {{ impactSummary.affectedCount }} matter{{ impactSummary.affectedCount === 1 ? '' : 's' }} 
                to "{{ impactSummary.label }}"
              </p>
              <p class="text-sm text-muted-foreground">
                {{ impactSummary.description }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter class="gap-2">
        <Button 
          variant="outline" 
          @click="handleCancel"
          :disabled="isConfirming"
        >
          Cancel
        </Button>
        <Button 
          @click="handleConfirm"
          :disabled="!canConfirm || isConfirming"
          class="min-w-[100px]"
        >
          <span v-if="isConfirming" class="flex items-center gap-2">
            <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Moving...
          </span>
          <span v-else>
            Move {{ selectedCount }} Matter{{ selectedCount === 1 ? '' : 's' }}
          </span>
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
/* Custom radio group styling for better visual hierarchy */
.radio-group-item[data-state="checked"] + .label {
  @apply text-primary;
}

/* Ensure smooth transitions */
.transition-colors {
  transition-property: color, background-color, border-color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

/* Animation for loading spinner */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Accessibility improvements */
.radio-group-item:focus-visible {
  @apply ring-2 ring-ring ring-offset-2;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .border-border {
    border-width: 2px;
  }
  
  .bg-primary\/5 {
    @apply bg-primary/10;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .transition-colors,
  .animate-spin {
    transition: none;
    animation: none;
  }
}
</style>
<!--
  Memo Auto-save Indicator Component
  Shows save status and provides manual save control
-->
<script setup lang="ts">
import { computed } from 'vue'
import { 
  Save, 
  Check, 
  AlertCircle, 
  Loader2, 
  AlertTriangle,
  Wifi,
  WifiOff
} from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import type { SaveStatus } from '~/composables/memo/useMemoAutoSave'

interface Props {
  /** Current save status */
  status: SaveStatus
  /** Status text to display */
  statusText: string
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean
  /** Whether the app is online */
  isOnline: boolean
  /** Whether saving is in progress */
  isSaving?: boolean
  /** Whether manual save is available */
  canSave: boolean
  /** Last saved timestamp */
  lastSaved?: Date | null
  /** Save error message */
  error?: string | null
  /** Show detailed status */
  showDetails?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isSaving: false,
  showDetails: false
})

const emit = defineEmits<{
  /** Manual save triggered */
  save: []
  /** Retry save after error */
  retry: []
}>()

// Computed properties
const statusIcon = computed(() => {
  switch (props.status) {
    case 'saving':
      return Loader2
    case 'saved':
      return Check
    case 'error':
      return AlertCircle
    case 'conflict':
      return AlertTriangle
    default:
      return Save
  }
})

const statusVariant = computed(() => {
  switch (props.status) {
    case 'saved':
      return 'success'
    case 'error':
    case 'conflict':
      return 'destructive'
    case 'saving':
      return 'secondary'
    default:
      return 'outline'
  }
})

const statusClasses = computed(() => [
  'auto-save-indicator',
  {
    'is-saving': props.status === 'saving',
    'is-saved': props.status === 'saved',
    'is-error': props.status === 'error' || props.status === 'conflict',
    'is-offline': !props.isOnline,
    'has-unsaved': props.hasUnsavedChanges
  }
])

const networkIcon = computed(() => props.isOnline ? Wifi : WifiOff)

const displayText = computed(() => {
  if (!props.isOnline) {
    return 'Offline - changes saved locally'
  }
  
  if (props.showDetails) {
    return props.statusText
  }
  
  // Simplified status text
  switch (props.status) {
    case 'saving':
      return 'Saving...'
    case 'saved':
      return 'Saved'
    case 'error':
      return 'Save failed'
    case 'conflict':
      return 'Conflict'
    default:
      return props.hasUnsavedChanges ? 'Unsaved' : 'Up to date'
  }
})

// Methods
const handleSave = () => {
  emit('save')
}

const handleRetry = () => {
  emit('retry')
}
</script>

<template>
  <div :class="statusClasses">
    <!-- Network Status -->
    <div class="network-status">
      <component 
        :is="networkIcon" 
        :class="[
          'network-icon',
          { 'is-offline': !isOnline }
        ]"
      />
    </div>

    <!-- Status Badge -->
    <Badge 
      :variant="statusVariant" 
      class="status-badge"
    >
      <component 
        :is="statusIcon" 
        :class="[
          'status-icon',
          { 'is-spinning': status === 'saving' }
        ]"
      />
      <span class="status-text">{{ displayText }}</span>
    </Badge>

    <!-- Manual Save Button -->
    <Button
      v-if="canSave || status === 'error'"
      variant="ghost"
      size="sm"
      :disabled="!canSave && status !== 'error'"
      @click="status === 'error' ? handleRetry() : handleSave()"
      class="save-button"
    >
      <component 
        :is="status === 'error' ? AlertCircle : Save" 
        class="h-4 w-4" 
      />
      {{ status === 'error' ? 'Retry' : 'Save' }}
    </Button>

    <!-- Detailed Status (if enabled) -->
    <div v-if="showDetails" class="status-details">
      <div v-if="lastSaved" class="last-saved">
        Last saved: {{ lastSaved.toLocaleTimeString() }}
      </div>
      <div v-if="error" class="error-details">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.auto-save-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.375rem;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  transition: all 0.2s ease;
}

.auto-save-indicator.is-saving {
  background: hsl(var(--muted) / 0.5);
}

.auto-save-indicator.is-saved {
  background: hsl(var(--success) / 0.1);
  border-color: hsl(var(--success) / 0.3);
}

.auto-save-indicator.is-error {
  background: hsl(var(--destructive) / 0.1);
  border-color: hsl(var(--destructive) / 0.3);
}

.auto-save-indicator.is-offline {
  background: hsl(var(--warning) / 0.1);
  border-color: hsl(var(--warning) / 0.3);
}

/* Network Status */
.network-status {
  display: flex;
  align-items: center;
}

.network-icon {
  width: 1rem;
  height: 1rem;
  color: hsl(var(--success));
  transition: color 0.2s ease;
}

.network-icon.is-offline {
  color: hsl(var(--destructive));
}

/* Status Badge */
.status-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-icon {
  width: 0.75rem;
  height: 0.75rem;
  flex-shrink: 0;
}

.status-icon.is-spinning {
  animation: spin 1s linear infinite;
}

.status-text {
  white-space: nowrap;
}

/* Save Button */
.save-button {
  font-size: 0.75rem;
  height: 1.75rem;
  padding: 0 0.5rem;
}

/* Status Details */
.status-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-left: auto;
  font-size: 0.75rem;
}

.last-saved {
  color: hsl(var(--muted-foreground));
}

.error-details {
  color: hsl(var(--destructive));
  font-weight: 500;
}

/* Animations */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Responsive Design */
@media (max-width: 640px) {
  .auto-save-indicator {
    flex-wrap: wrap;
    gap: 0.25rem;
  }
  
  .status-details {
    width: 100%;
    margin-left: 0;
  }
  
  .status-text {
    max-width: 8rem;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .status-icon.is-spinning {
    animation: none;
  }
  
  .auto-save-indicator {
    transition: none;
  }
}
</style>
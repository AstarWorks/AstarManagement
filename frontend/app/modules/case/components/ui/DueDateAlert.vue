<template>
  <Badge
    v-if="alertConfig !== null"
    v-memo="[alertConfig.type, alertConfig.label, props.size]"
    :variant="badgeVariant"
    class="inline-flex items-center gap-1 whitespace-nowrap"
    :class="{ 'animate-pulse': shouldAnimate }"
    style="font-feature-settings: 'tnum';"
    :title="alertMessage"
    :aria-label="ariaLabel"
    role="status"
    :aria-live="isUrgent ? 'assertive' : 'polite'"
  >
    <Icon :name="alertIcon" :class="iconSizeClass" />
    <span v-if="showLabel">{{ alertLabel }}</span>
  </Badge>
</template>

<script setup lang="ts">
import { useDueDateAlert } from '~/modules/case/composables/useDueDateAlert';
import { computed } from 'vue'
import { Badge } from '~/foundation/components/ui/badge'

interface Props {
  dueDate: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'sm',
  showLabel: false
})

// Use composable for business logic
const { alertConfig, isUrgent } = useDueDateAlert(props.dueDate)

// Check user's animation preferences
const isReduced = ref(false) // Fallback for animation preferences

// Simplified computed properties for template binding
const alertLabel = computed(() => alertConfig.value?.label || '')
const alertIcon = computed(() => alertConfig.value?.icon || 'lucide:clock')
const badgeVariant = computed(() => alertConfig.value?.variant || 'secondary')
const alertMessage = computed(() => alertConfig.value?.message || '')

// Accessibility improvements
const ariaLabel = computed(() => {
  const label = alertLabel.value
  const message = alertMessage.value
  return `${label}: ${message}`
})

// Animation control based on user preference and urgency
const shouldAnimate = computed(() => 
  !isReduced.value && (isUrgent.value || alertConfig.value?.type === 'overdue')
)

const iconSizeClass = computed(() => {
  const sizes = {
    xs: 'h-2.5 w-2.5',
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4'
  }
  
  return sizes[props.size]
})
</script>


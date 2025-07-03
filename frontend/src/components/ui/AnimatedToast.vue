<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-vue-next'
import { useAnimations } from '~/composables/useAnimations'
import { ANIMATION_DURATION } from '~/constants/animations'

interface Props {
  id: string
  type?: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  duration?: number
  closable?: boolean
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  duration: 5000,
  closable: true,
  position: 'top-right'
})

const emit = defineEmits<{
  close: [id: string]
}>()

const { animationsEnabled, getAnimationDuration } = useAnimations()

// Icons for different types
const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
}

// Colors for different types
const typeClasses = {
  success: 'toast-success',
  error: 'toast-error', 
  warning: 'toast-warning',
  info: 'toast-info'
}

const toastClasses = computed(() => [
  'animated-toast',
  typeClasses[props.type],
  `toast-${props.position}`,
  {
    'animations-enabled': animationsEnabled.value
  }
])

const Icon = computed(() => icons[props.type])

const handleClose = () => {
  emit('close', props.id)
}

// Auto close after duration
onMounted(() => {
  if (props.duration > 0) {
    setTimeout(() => {
      handleClose()
    }, props.duration)
  }
})
</script>

<template>
  <Transition
    name="toast"
    :duration="{ 
      enter: getAnimationDuration(ANIMATION_DURATION.normal),
      leave: getAnimationDuration(ANIMATION_DURATION.fast)
    }"
  >
    <div :class="toastClasses" role="alert" :aria-live="type === 'error' ? 'assertive' : 'polite'">
      <!-- Progress bar -->
      <div 
        v-if="duration > 0" 
        class="toast-progress"
        :style="{ animationDuration: `${duration}ms` }"
      />
      
      <!-- Icon -->
      <div class="toast-icon">
        <component :is="Icon" class="w-5 h-5" />
      </div>
      
      <!-- Content -->
      <div class="toast-content">
        <h3 class="toast-title">{{ title }}</h3>
        <p v-if="description" class="toast-description">{{ description }}</p>
      </div>
      
      <!-- Close button -->
      <button
        v-if="closable"
        @click="handleClose"
        class="toast-close"
        aria-label="Close notification"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.animated-toast {
  @apply relative flex items-start gap-3 p-4 rounded-lg shadow-lg;
  @apply bg-white border max-w-sm pointer-events-auto;
  @apply transform-gpu;
}

/* Type variants */
.toast-success {
  @apply border-green-200 bg-green-50;
}

.toast-success .toast-icon {
  @apply text-green-600;
}

.toast-error {
  @apply border-red-200 bg-red-50;
}

.toast-error .toast-icon {
  @apply text-red-600;
}

.toast-warning {
  @apply border-yellow-200 bg-yellow-50;
}

.toast-warning .toast-icon {
  @apply text-yellow-600;
}

.toast-info {
  @apply border-blue-200 bg-blue-50;
}

.toast-info .toast-icon {
  @apply text-blue-600;
}

/* Content */
.toast-content {
  @apply flex-1 min-w-0;
}

.toast-title {
  @apply font-medium text-gray-900;
}

.toast-description {
  @apply text-sm text-gray-600 mt-1;
}

/* Close button */
.toast-close {
  @apply flex-shrink-0 ml-2 p-1 rounded;
  @apply text-gray-400 hover:text-gray-600;
  @apply transition-colors duration-200;
}

/* Progress bar */
.toast-progress {
  @apply absolute bottom-0 left-0 h-1 bg-current opacity-20;
  animation: progress linear forwards;
}

@keyframes progress {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

/* Animations */
.animations-enabled {
  @apply animate-gpu;
}

/* Position-based animations */
.toast-enter-active {
  transition: all var(--animation-duration-normal) var(--animation-easing-decelerate);
}

.toast-leave-active {
  transition: all var(--animation-duration-fast) var(--animation-easing-accelerate);
}

/* Top positions */
.toast-top-right.toast-enter-from,
.toast-top-left.toast-enter-from,
.toast-top-center.toast-enter-from {
  opacity: 0;
  transform: translateY(-1rem) scale(0.95);
}

.toast-top-right.toast-leave-to,
.toast-top-left.toast-leave-to,
.toast-top-center.toast-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem) scale(0.95);
}

/* Bottom positions */
.toast-bottom-right.toast-enter-from,
.toast-bottom-left.toast-enter-from,
.toast-bottom-center.toast-enter-from {
  opacity: 0;
  transform: translateY(1rem) scale(0.95);
}

.toast-bottom-right.toast-leave-to,
.toast-bottom-left.toast-leave-to,
.toast-bottom-center.toast-leave-to {
  opacity: 0;
  transform: translateY(0.5rem) scale(0.95);
}

/* Side-specific animations */
.toast-top-right.toast-enter-from,
.toast-bottom-right.toast-enter-from {
  transform: translateX(1rem) translateY(var(--translate-y, 0)) scale(0.95);
}

.toast-top-left.toast-enter-from,
.toast-bottom-left.toast-enter-from {
  transform: translateX(-1rem) translateY(var(--translate-y, 0)) scale(0.95);
}

/* Hover effect */
.animated-toast:hover {
  @apply shadow-xl;
  transform: translateY(-1px);
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active {
    transition: opacity 0.01ms !important;
  }
  
  .toast-enter-from,
  .toast-leave-to {
    transform: none !important;
  }
  
  .toast-progress {
    animation: none !important;
    display: none;
  }
  
  .animated-toast:hover {
    transform: none;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .animated-toast {
    @apply bg-gray-800 border-gray-700;
  }
  
  .toast-title {
    @apply text-gray-100;
  }
  
  .toast-description {
    @apply text-gray-300;
  }
  
  .toast-close {
    @apply text-gray-500 hover:text-gray-300;
  }
}
</style>
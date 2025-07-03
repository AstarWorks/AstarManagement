<script setup lang="ts">
import { computed } from 'vue'
import { Gauge, Activity, AlertTriangle } from 'lucide-vue-next'
import { useAnimationPerformance } from '~/composables/useAnimations'
import { Badge } from '~/components/ui/badge'

interface Props {
  show?: boolean
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  show: true,
  position: 'bottom-right',
  compact: false
})

const emit = defineEmits<{
  close: []
}>()

const { fps, jankFrames, isPerformant, startMonitoring, stopMonitoring, resetMetrics } = useAnimationPerformance()

// Start monitoring on mount
onMounted(() => {
  if (props.show) {
    startMonitoring()
  }
})

// Stop monitoring on unmount
onUnmounted(() => {
  stopMonitoring()
})

// Watch show prop
watch(() => props.show, (show) => {
  if (show) {
    startMonitoring()
  } else {
    stopMonitoring()
  }
})

const monitorClasses = computed(() => [
  'animation-performance-monitor',
  `position-${props.position}`,
  {
    'compact': props.compact,
    'performance-good': isPerformant.value,
    'performance-warning': !isPerformant.value && fps.value >= 30,
    'performance-critical': fps.value < 30
  }
])

const fpsStatus = computed(() => {
  if (fps.value >= 55) return 'good'
  if (fps.value >= 30) return 'warning'
  return 'critical'
})

const fpsStatusIcon = computed(() => {
  if (fpsStatus.value === 'good') return Activity
  if (fpsStatus.value === 'warning') return Gauge
  return AlertTriangle
})

const handleReset = () => {
  resetMetrics()
}
</script>

<template>
  <Transition name="fade">
    <div v-if="show" :class="monitorClasses">
      <!-- Compact view -->
      <div v-if="compact" class="monitor-compact">
        <component :is="fpsStatusIcon" class="w-4 h-4" />
        <span class="fps-value">{{ fps }} FPS</span>
        <button @click="emit('close')" class="close-button" aria-label="Close monitor">
          ×
        </button>
      </div>
      
      <!-- Full view -->
      <div v-else class="monitor-full">
        <div class="monitor-header">
          <h3 class="monitor-title">Animation Performance</h3>
          <button @click="emit('close')" class="close-button" aria-label="Close monitor">
            ×
          </button>
        </div>
        
        <div class="monitor-content">
          <!-- FPS meter -->
          <div class="metric-row">
            <div class="metric-label">
              <component :is="fpsStatusIcon" class="w-4 h-4" />
              <span>Frame Rate</span>
            </div>
            <div class="metric-value">
              <span class="fps-value" :class="`fps-${fpsStatus}`">{{ fps }}</span>
              <span class="metric-unit">FPS</span>
            </div>
          </div>
          
          <!-- FPS bar -->
          <div class="fps-bar">
            <div 
              class="fps-bar-fill"
              :class="`fps-${fpsStatus}`"
              :style="{ width: `${Math.min(fps / 60 * 100, 100)}%` }"
            />
          </div>
          
          <!-- Jank frames -->
          <div class="metric-row">
            <div class="metric-label">
              <AlertTriangle class="w-4 h-4" />
              <span>Jank Frames</span>
            </div>
            <div class="metric-value">
              <span :class="{ 'text-red-600': jankFrames > 5 }">{{ jankFrames }}</span>
            </div>
          </div>
          
          <!-- Status badge -->
          <div class="monitor-status">
            <Badge 
              :variant="isPerformant ? 'default' : 'destructive'"
              class="status-badge"
            >
              {{ isPerformant ? 'Smooth' : 'Janky' }}
            </Badge>
            <button 
              @click="handleReset" 
              class="reset-button"
              aria-label="Reset metrics"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.animation-performance-monitor {
  @apply fixed z-50 bg-white rounded-lg shadow-lg border;
  @apply transform-gpu;
}

/* Positioning */
.position-top-left {
  @apply top-4 left-4;
}

.position-top-right {
  @apply top-4 right-4;
}

.position-bottom-left {
  @apply bottom-4 left-4;
}

.position-bottom-right {
  @apply bottom-4 right-4;
}

/* Compact view */
.monitor-compact {
  @apply flex items-center gap-2 px-3 py-2 text-sm;
}

.fps-value {
  @apply font-mono font-medium;
}

/* Full view */
.monitor-full {
  @apply w-64;
}

.monitor-header {
  @apply flex items-center justify-between p-3 border-b;
}

.monitor-title {
  @apply text-sm font-semibold;
}

.monitor-content {
  @apply p-3 space-y-3;
}

.metric-row {
  @apply flex items-center justify-between;
}

.metric-label {
  @apply flex items-center gap-2 text-sm text-gray-600;
}

.metric-value {
  @apply flex items-center gap-1;
}

.metric-unit {
  @apply text-xs text-gray-500;
}

/* FPS status colors */
.fps-good {
  @apply text-green-600;
}

.fps-warning {
  @apply text-yellow-600;
}

.fps-critical {
  @apply text-red-600;
}

/* FPS bar */
.fps-bar {
  @apply relative w-full h-2 bg-gray-200 rounded-full overflow-hidden;
}

.fps-bar-fill {
  @apply absolute left-0 top-0 h-full transition-all duration-200;
}

.fps-bar-fill.fps-good {
  @apply bg-green-500;
}

.fps-bar-fill.fps-warning {
  @apply bg-yellow-500;
}

.fps-bar-fill.fps-critical {
  @apply bg-red-500;
}

/* Monitor status */
.monitor-status {
  @apply flex items-center justify-between pt-2 border-t;
}

.status-badge {
  font-size: 0.75rem; line-height: 1rem;
}

/* Buttons */
.close-button {
  @apply w-6 h-6 flex items-center justify-center rounded;
  @apply text-gray-400 hover:text-gray-600 hover:bg-gray-100;
  @apply transition-colors duration-200;
  font-size: 20px;
  line-height: 1;
}

.reset-button {
  @apply text-xs text-gray-500 hover:text-gray-700;
  @apply underline transition-colors duration-200;
}

/* Performance states */
.performance-good {
  @apply border-green-200;
}

.performance-warning {
  @apply border-yellow-200;
}

.performance-critical {
  @apply border-red-200;
  animation: pulse 2s ease-in-out infinite;
}

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .animation-performance-monitor {
    @apply bg-gray-800 border-gray-700;
  }
  
  .monitor-header {
    @apply border-gray-700;
  }
  
  .monitor-title {
    @apply text-gray-100;
  }
  
  .metric-label {
    @apply text-gray-400;
  }
  
  .fps-bar {
    @apply bg-gray-700;
  }
  
  .monitor-status {
    @apply border-gray-700;
  }
  
  .close-button {
    @apply text-gray-500 hover:text-gray-300 hover:bg-gray-700;
  }
  
  .reset-button {
    @apply text-gray-400 hover:text-gray-200;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .fps-bar-fill {
    transition: none;
  }
  
  .performance-critical {
    animation: none;
  }
}
</style>
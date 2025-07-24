<script setup lang="ts">
import { computed } from 'vue'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  PieChart,
  BarChart3,
  Calendar,
  Users,
  FileText,
  Clock
} from 'lucide-vue-next'
import type { FinancialKPI } from '~/types/financial'

/**
 * Financial KPI Card Component
 * 
 * Displays a key performance indicator with value, trend, and visual elements.
 * Supports various financial metrics with animated transitions and responsive design.
 */

interface Props {
  /** KPI data to display */
  kpi: FinancialKPI
  /** Show trend indicator */
  showTrend?: boolean
  /** Animate value changes */
  animated?: boolean
  /** Card size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Custom click handler */
  clickable?: boolean
}

interface Emits {
  click: [kpi: FinancialKPI]
}

const props = withDefaults(defineProps<Props>(), {
  showTrend: true,
  animated: true,
  size: 'md',
  clickable: false
})

const emit = defineEmits<Emits>()

// Icon mapping for different KPI types
const iconMap = {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  PieChart,
  BarChart3,
  Calendar,
  Users,
  FileText,
  Clock
}

// Computed properties
const cardClasses = computed(() => {
  const classes = ['kpi-card', 'relative', 'transition-all', 'duration-200', 'hover:shadow-md']
  
  if (props.clickable) {
    classes.push('cursor-pointer', 'hover:scale-105')
  }
  
  return classes.join(' ')
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'p-4'
    case 'lg':
      return 'p-8'
    default:
      return 'p-6'
  }
})

const trendClasses = computed(() => {
  if (!props.kpi.trend) return ''
  
  const baseClasses = 'flex items-center text-xs'
  const direction = typeof props.kpi.trend === 'object' 
    ? props.kpi.trend.direction 
    : props.kpi.trend
  
  switch (direction) {
    case 'up':
      return `${baseClasses} text-green-600 dark:text-green-400`
    case 'down':
      return `${baseClasses} text-red-600 dark:text-red-400`
    default:
      return `${baseClasses} text-gray-600 dark:text-gray-400`
  }
})

const trendIcon = computed(() => {
  if (!props.kpi.trend) return null
  
  const direction = typeof props.kpi.trend === 'object' 
    ? props.kpi.trend.direction 
    : props.kpi.trend
  
  switch (direction) {
    case 'up':
      return TrendingUp
    case 'down':
      return TrendingDown
    default:
      return null
  }
})

const primaryIcon = computed(() => {
  return iconMap[props.kpi.icon as keyof typeof iconMap] || DollarSign
})

// Event handlers
const handleClick = () => {
  if (props.clickable) {
    emit('click', props.kpi)
  }
}

// Animation utilities
const formatAnimatedValue = (value: string) => {
  if (!props.animated) return value
  
  // Add CSS class for value animation
  return value
}
</script>

<template>
  <Card :class="cardClasses" @click="handleClick">
    <CardContent :class="sizeClasses">
      <div class="flex items-center justify-between">
        <!-- KPI Content -->
        <div class="flex-1">
          <!-- Title -->
          <p class="text-sm font-medium text-muted-foreground mb-1">
            {{ kpi.title }}
          </p>
          
          <!-- Value -->
          <div 
            class="text-2xl font-bold mb-2 transition-all duration-300"
            :class="[
              kpi.color || 'text-foreground',
              { 'animate-pulse': animated }
            ]"
          >
            {{ kpi.formattedValue }}
            <span v-if="kpi.unit" class="text-sm font-normal text-muted-foreground ml-1">
              {{ kpi.unit }}
            </span>
          </div>
          
          <!-- Trend -->
          <div v-if="showTrend && kpi.trend" :class="trendClasses">
            <component 
              v-if="trendIcon" 
              :is="trendIcon" 
              class="h-3 w-3 mr-1"
            />
            <span v-if="typeof kpi.trend === 'object'" class="font-medium">
              {{ kpi.trend.percentage > 0 ? '+' : '' }}{{ kpi.trend.percentage }}%
            </span>
            <span v-if="typeof kpi.trend === 'object'" class="ml-1 opacity-75">
              {{ kpi.trend.period }}
            </span>
          </div>
        </div>
        
        <!-- Icon -->
        <div class="flex-shrink-0 ml-4">
          <div 
            class="w-12 h-12 rounded-full flex items-center justify-center transition-colors"
            :class="[
              kpi.color ? 'bg-current/10' : 'bg-muted',
              kpi.color || 'text-muted-foreground'
            ]"
          >
            <component 
              :is="primaryIcon" 
              class="h-6 w-6"
              :class="kpi.color || 'text-muted-foreground'"
            />
          </div>
        </div>
      </div>
      
      <!-- Additional Info (Optional) -->
      <div v-if="$slots.additional" class="mt-4 pt-4 border-t border-border">
        <slot name="additional" :kpi="kpi" />
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
.kpi-card {
  --transition-duration: 200ms;
  
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}

.kpi-card:hover {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

/* Value animation */
.animate-value {
  animation: valueChange 0.3s ease-out;
}

@keyframes valueChange {
  0% {
    transform: scale(1.05);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Trend indicator animations */
.kpi-card .trend-up {
  animation: trendBounce 0.5s ease-out;
}

.kpi-card .trend-down {
  animation: trendBounce 0.5s ease-out;
}

@keyframes trendBounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-2px);
  }
  60% {
    transform: translateY(-1px);
  }
}

/* Icon pulse on hover */
.kpi-card:hover .icon-container {
  animation: iconPulse 1s ease-in-out;
}

@keyframes iconPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .kpi-card {
    padding: 1rem;
  }
  
  .text-2xl {
    font-size: 1.5rem;
  }
  
  .w-12.h-12 {
    width: 2.5rem;
    height: 2.5rem;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .kpi-card {
    border-width: 2px;
    border-color: currentColor;
  }
  
  .bg-muted {
    background-color: transparent;
    border: 1px solid currentColor;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .kpi-card,
  .transition-all,
  .duration-200,
  .duration-300 {
    transition: none !important;
  }
  
  .animate-pulse,
  .animate-value,
  .trend-up,
  .trend-down {
    animation: none !important;
  }
  
  .hover\\:scale-105:hover {
    transform: none !important;
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .kpi-card {
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.3);
  }
  
  .kpi-card:hover {
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3);
  }
}

/* Focus styles for accessibility */
.kpi-card:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}

/* Loading state */
.kpi-card.loading {
  pointer-events: none;
}

.kpi-card.loading * {
  opacity: 0.6;
}
</style>
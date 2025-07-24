<script setup lang="ts">
import { computed } from 'vue'
import { useSkeletonAnimation } from '~/composables/useAnimations'

interface Props {
  viewPreferences?: {
    cardSize?: 'compact' | 'normal' | 'large'
    showTags?: boolean
    showAssignee?: boolean  
    showDates?: boolean
    showPriority?: boolean
  }
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  viewPreferences: () => ({
    cardSize: 'normal',
    showTags: true,
    showAssignee: true,
    showDates: true,
    showPriority: true
  }),
  count: 1
})

const { shimmerPosition } = useSkeletonAnimation()

const cardClasses = computed(() => [
  'matter-card-skeleton',
  `card-${props.viewPreferences.cardSize}`,
  'animate-skeleton'
])

const shimmerStyle = computed(() => ({
  transform: `translateX(${shimmerPosition.value}%)`,
}))
</script>

<template>
  <div v-for="i in count" :key="i" :class="cardClasses">
    <!-- Shimmer overlay -->
    <div class="shimmer-overlay" :style="shimmerStyle" />
    
    <!-- Title skeleton -->
    <div class="skeleton-title">
      <div class="skeleton-line w-3/4 h-4" />
    </div>
    
    <!-- Description skeleton -->
    <div class="skeleton-description">
      <div class="skeleton-line w-full h-3 mb-1" />
      <div class="skeleton-line w-2/3 h-3" />
    </div>
    
    <!-- Meta information skeleton -->
    <div class="skeleton-meta">
      <!-- Priority -->
      <div v-if="viewPreferences.showPriority" class="skeleton-badge w-16 h-5" />
      
      <!-- Assignee -->
      <div v-if="viewPreferences.showAssignee" class="skeleton-meta-item">
        <div class="skeleton-icon w-3 h-3" />
        <div class="skeleton-line w-20 h-3" />
      </div>
      
      <!-- Due date -->
      <div v-if="viewPreferences.showDates" class="skeleton-meta-item">
        <div class="skeleton-icon w-3 h-3" />
        <div class="skeleton-line w-16 h-3" />
      </div>
    </div>
    
    <!-- Tags skeleton -->
    <div v-if="viewPreferences.showTags" class="skeleton-tags">
      <div class="skeleton-badge w-12 h-4" />
      <div class="skeleton-badge w-16 h-4" />
      <div class="skeleton-badge w-10 h-4" />
    </div>
  </div>
</template>

<style scoped>
.matter-card-skeleton {
  @apply relative p-4 bg-white border border-gray-200 rounded-lg;
  @apply overflow-hidden;
}

/* Card sizes */
.matter-card-skeleton.card-compact {
  @apply p-3;
}

.matter-card-skeleton.card-normal {
  @apply p-4;
}

.matter-card-skeleton.card-large {
  @apply p-5;
}

/* Shimmer overlay */
.shimmer-overlay {
  @apply absolute inset-0 -translate-x-full;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  100% {
    transform: translateX(200%);
  }
}

/* Skeleton elements */
.skeleton-line,
.skeleton-badge,
.skeleton-icon {
  @apply bg-gray-200 rounded animate-pulse;
}

.skeleton-title {
  @apply mb-3;
}

.skeleton-description {
  @apply mb-3;
}

.skeleton-meta {
  @apply flex flex-wrap items-center gap-3 mb-3;
}

.skeleton-meta-item {
  @apply flex items-center gap-1;
}

.skeleton-tags {
  @apply flex flex-wrap gap-1;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .shimmer-overlay {
    display: none;
  }
  
  .skeleton-line,
  .skeleton-badge,
  .skeleton-icon {
    animation: none;
  }
}
</style>
<template>
  <div class="timeline-skeleton">
    <div 
      v-for="i in count"
      :key="i"
      class="skeleton-item"
    >
      <div class="skeleton-icon" />
      <div class="skeleton-content">
        <div class="skeleton-header">
          <div class="skeleton-badge" />
          <div class="skeleton-time" />
        </div>
        <div class="skeleton-title" />
        <div class="skeleton-participants" />
        <div class="skeleton-summary" />
        <div class="skeleton-actions">
          <div class="skeleton-action" />
          <div class="skeleton-action" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  count?: number
}

withDefaults(defineProps<Props>(), {
  count: 5
})
</script>

<style scoped>
.timeline-skeleton {
  @apply space-y-6;
}

.skeleton-item {
  @apply flex gap-4 p-4;
}

.skeleton-icon {
  @apply size-12 rounded-full bg-muted animate-pulse flex-shrink-0;
}

.skeleton-content {
  @apply flex-1 space-y-3;
}

.skeleton-header {
  @apply flex items-center gap-3;
}

.skeleton-badge {
  @apply w-16 h-5 bg-muted rounded animate-pulse;
}

.skeleton-time {
  @apply w-20 h-4 bg-muted rounded animate-pulse;
}

.skeleton-title {
  @apply w-3/4 h-6 bg-muted rounded animate-pulse;
}

.skeleton-participants {
  @apply w-1/2 h-4 bg-muted rounded animate-pulse;
}

.skeleton-summary {
  @apply space-y-2;
}

.skeleton-summary::before,
.skeleton-summary::after {
  @apply content-[''] block w-full h-4 bg-muted rounded animate-pulse;
}

.skeleton-summary::after {
  @apply w-2/3;
}

.skeleton-actions {
  @apply flex gap-2;
}

.skeleton-action {
  @apply w-20 h-8 bg-muted rounded animate-pulse;
}
</style>
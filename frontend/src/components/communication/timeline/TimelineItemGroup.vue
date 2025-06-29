<template>
  <div class="timeline-group">
    <div class="group-header">
      <div class="group-date">
        <h3 class="date-text">{{ formatDate(date) }}</h3>
        <span class="date-relative">{{ getRelativeDate(date) }}</span>
      </div>
      <div class="group-stats">
        <Badge variant="secondary" class="count-badge">
          {{ count }} {{ count === 1 ? 'item' : 'items' }}
        </Badge>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Badge } from '~/components/ui/badge'

interface Props {
  date: string
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  count: 0
})

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}

const getRelativeDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}
</script>

<style scoped>
.timeline-group {
  @apply py-4;
}

.group-header {
  @apply flex items-center justify-between mb-4;
  @apply border-b border-border pb-2;
}

.group-date {
  @apply flex flex-col sm:flex-row sm:items-center sm:gap-3;
}

.date-text {
  @apply text-lg font-semibold text-foreground;
}

.date-relative {
  @apply text-sm text-muted-foreground;
}

.group-stats {
  @apply flex items-center gap-2;
}

.count-badge {
  @apply text-xs;
}

/* Mobile adjustments */
@media (max-width: 640px) {
  .group-header {
    @apply flex-col gap-2 items-start;
  }
  
  .date-text {
    @apply text-base;
  }
}
</style>
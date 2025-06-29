<template>
  <div 
    :class="[
      'card-skeleton',
      { 'list-mode': viewMode === 'list' }
    ]"
  >
    <!-- Thumbnail skeleton -->
    <div class="skeleton-thumbnail" :class="{ 'list-thumbnail': viewMode === 'list' }">
      <div class="skeleton-image"></div>
    </div>
    
    <!-- Content skeleton -->
    <div class="skeleton-content" :class="{ 'list-content': viewMode === 'list' }">
      <!-- Title and category -->
      <div class="skeleton-header">
        <div class="skeleton-title"></div>
        <div class="skeleton-badge"></div>
      </div>
      
      <!-- Description -->
      <div class="skeleton-description">
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
      </div>
      
      <!-- Metadata -->
      <div class="skeleton-meta">
        <div class="skeleton-meta-item"></div>
        <div class="skeleton-meta-item"></div>
        <div class="skeleton-meta-item"></div>
      </div>
      
      <!-- Tags (grid mode only) -->
      <div v-if="viewMode === 'grid'" class="skeleton-tags">
        <div class="skeleton-tag"></div>
        <div class="skeleton-tag"></div>
        <div class="skeleton-tag small"></div>
      </div>
      
      <!-- Footer (list mode only) -->
      <div v-if="viewMode === 'list'" class="skeleton-footer">
        <div class="skeleton-footer-info">
          <div class="skeleton-line tiny"></div>
          <div class="skeleton-line tiny"></div>
        </div>
        <div class="skeleton-footer-actions">
          <div class="skeleton-button"></div>
          <div class="skeleton-button"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  viewMode?: 'grid' | 'list'
}

withDefaults(defineProps<Props>(), {
  viewMode: 'grid'
})
</script>

<style scoped>
.card-skeleton {
  @apply bg-card border border-border rounded-lg overflow-hidden;
  @apply animate-pulse;
}

.card-skeleton.list-mode {
  @apply flex flex-row;
}

/* Thumbnail skeleton */
.skeleton-thumbnail {
  @apply bg-muted aspect-[4/3] relative overflow-hidden;
}

.list-thumbnail {
  @apply w-32 aspect-[4/3] flex-shrink-0;
}

.skeleton-image {
  @apply w-full h-full bg-gradient-to-r from-muted via-muted-foreground/10 to-muted;
  @apply animate-shimmer;
  background-size: 200% 100%;
}

/* Content skeleton */
.skeleton-content {
  @apply p-4 space-y-3;
}

.list-content {
  @apply flex-1 flex flex-col justify-between;
}

/* Header skeleton */
.skeleton-header {
  @apply flex items-start justify-between gap-2;
}

.skeleton-title {
  @apply h-4 bg-muted rounded flex-1;
}

.skeleton-badge {
  @apply h-5 w-16 bg-muted rounded-full flex-shrink-0;
}

/* Description skeleton */
.skeleton-description {
  @apply space-y-2;
}

.skeleton-line {
  @apply h-3 bg-muted rounded;
}

.skeleton-line.short {
  @apply w-3/4;
}

.skeleton-line.tiny {
  @apply h-2.5 w-20;
}

.skeleton-line.small {
  @apply w-1/2;
}

/* Meta skeleton */
.skeleton-meta {
  @apply flex gap-3;
}

.skeleton-meta-item {
  @apply h-3 w-12 bg-muted rounded;
}

/* Tags skeleton */
.skeleton-tags {
  @apply flex gap-1;
}

.skeleton-tag {
  @apply h-5 w-16 bg-muted rounded-full;
}

.skeleton-tag.small {
  @apply w-12;
}

/* Footer skeleton (list mode) */
.skeleton-footer {
  @apply flex items-center justify-between pt-3 border-t border-muted;
}

.skeleton-footer-info {
  @apply space-y-1;
}

.skeleton-footer-actions {
  @apply flex gap-2;
}

.skeleton-button {
  @apply h-8 w-20 bg-muted rounded;
}

/* Shimmer animation */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite linear;
}

/* Pulse animation variations */
.skeleton-title {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  animation-delay: 0.1s;
}

.skeleton-badge {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  animation-delay: 0.2s;
}

.skeleton-line {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  animation-delay: 0.3s;
}

.skeleton-meta-item {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  animation-delay: 0.4s;
}

.skeleton-tag {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  animation-delay: 0.5s;
}

/* Responsive design */
@media (max-width: 640px) {
  .card-skeleton.list-mode {
    @apply flex-col;
  }
  
  .list-thumbnail {
    @apply w-full aspect-[16/9];
  }
  
  .skeleton-meta {
    @apply grid grid-cols-2 gap-2;
  }
  
  .skeleton-tags {
    @apply hidden;
  }
  
  .skeleton-footer {
    @apply flex-col gap-2 items-stretch;
  }
  
  .skeleton-footer-actions {
    @apply w-full;
  }
  
  .skeleton-button {
    @apply flex-1;
  }
}

/* Accessibility */
.card-skeleton {
  @apply [attr:aria-label]="Loading template...";
}

/* Performance optimization */
.card-skeleton {
  contain: layout style paint;
}

.skeleton-image {
  will-change: background-position;
}

/* Custom properties for theming */
.card-skeleton {
  --skeleton-base: hsl(var(--muted));
  --skeleton-highlight: hsl(var(--muted-foreground) / 0.1);
}

.skeleton-image {
  background: linear-gradient(
    90deg,
    var(--skeleton-base) 0%,
    var(--skeleton-highlight) 50%,
    var(--skeleton-base) 100%
  );
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .skeleton-image {
    background: linear-gradient(
      90deg,
      hsl(var(--muted)) 0%,
      hsl(var(--muted-foreground) / 0.2) 50%,
      hsl(var(--muted)) 100%
    );
  }
}

/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .card-skeleton {
    @apply animate-none;
  }
  
  .skeleton-image {
    @apply animate-none;
  }
  
  .skeleton-title,
  .skeleton-badge,
  .skeleton-line,
  .skeleton-meta-item,
  .skeleton-tag {
    animation: none;
  }
}
</style>
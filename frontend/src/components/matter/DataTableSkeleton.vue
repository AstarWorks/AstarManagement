<script setup lang="ts">
import { cn } from '~/lib/utils'

interface Props {
  rows?: number
  columns?: number
  showPagination?: boolean
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  rows: 10,
  columns: 6,
  showPagination: true,
  className: ''
})
</script>

<template>
  <div :class="cn('data-table-skeleton', className)">
    <div class="skeleton-container">
      <div class="overflow-x-auto">
        <table class="w-full">
          <!-- Header skeleton -->
          <thead class="border-b">
            <tr>
              <th
                v-for="i in columns"
                :key="`header-${i}`"
                class="px-4 py-3"
              >
                <div class="flex items-center gap-2">
                  <div class="skeleton skeleton-text h-4 w-24" />
                  <div class="skeleton skeleton-icon h-4 w-4" />
                </div>
              </th>
            </tr>
          </thead>

          <!-- Body skeleton -->
          <tbody>
            <tr
              v-for="row in rows"
              :key="`row-${row}`"
              class="border-b"
            >
              <td
                v-for="col in columns"
                :key="`cell-${row}-${col}`"
                class="px-4 py-3"
              >
                <div 
                  class="skeleton skeleton-text h-4"
                  :class="{
                    'w-32': col === 1,
                    'w-24': col === 2,
                    'w-20': col === 3,
                    'w-28': col === 4,
                    'w-16': col === 5,
                    'w-36': col >= 6
                  }"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination skeleton -->
      <div 
        v-if="showPagination" 
        class="flex flex-col gap-4 px-2 py-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <!-- Results info skeleton -->
        <div class="skeleton skeleton-text h-4 w-48" />

        <!-- Pagination controls skeleton -->
        <div class="flex items-center gap-4">
          <!-- Page size selector skeleton -->
          <div class="flex items-center gap-2">
            <div class="skeleton skeleton-text h-3 w-20" />
            <div class="skeleton skeleton-select h-8 w-[70px]" />
          </div>

          <!-- Page navigation skeleton -->
          <div class="flex items-center gap-1">
            <div class="skeleton skeleton-button h-8 w-8" />
            <div class="skeleton skeleton-button h-8 w-8" />
            <div class="skeleton skeleton-button h-8 w-8" />
            <div class="skeleton skeleton-button h-8 w-8" />
            <div class="skeleton skeleton-button h-8 w-8" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.data-table-skeleton {
  @apply rounded-lg border bg-card;
}

.skeleton-container {
  @apply relative w-full;
}

/* Skeleton animations */
.skeleton {
  @apply relative overflow-hidden bg-muted;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    transform: translateX(-100%);
    background: linear-gradient(
      90deg,
      transparent,
      hsl(var(--primary) / 0.05),
      transparent
    );
    animation: skeleton-shimmer 2s infinite;
  }
}

.skeleton-text {
  @apply rounded;
}

.skeleton-icon {
  @apply rounded;
}

.skeleton-button {
  @apply rounded-md;
}

.skeleton-select {
  @apply rounded-md;
}

@keyframes skeleton-shimmer {
  100% {
    transform: translateX(100%);
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .skeleton-container {
    @apply -mx-4;
  }
  
  .skeleton-container > div {
    @apply px-4;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .skeleton::after {
    animation: none;
  }
}
</style>
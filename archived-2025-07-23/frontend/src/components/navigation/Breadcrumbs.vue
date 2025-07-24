<template>
  <nav 
    aria-label="Breadcrumb"
    class="breadcrumbs"
    v-if="breadcrumbs.length > 0"
  >
    <ol class="breadcrumb-list">
      <li 
        v-for="(crumb, index) in breadcrumbs"
        :key="index"
        class="breadcrumb-item"
      >
        <NuxtLink
          v-if="crumb.path && !crumb.current"
          :to="crumb.path"
          class="breadcrumb-link"
        >
          <component 
            :is="crumb.icon" 
            v-if="crumb.icon && typeof crumb.icon !== 'string'"
            class="breadcrumb-icon" 
          />
          {{ crumb.label }}
        </NuxtLink>
        
        <span
          v-else
          class="breadcrumb-current"
          :aria-current="crumb.current ? 'page' : undefined"
        >
          <component 
            :is="crumb.icon" 
            v-if="crumb.icon && typeof crumb.icon !== 'string'"
            class="breadcrumb-icon" 
          />
          {{ crumb.label }}
        </span>
        
        <ChevronRight
          v-if="index < breadcrumbs.length - 1"
          class="breadcrumb-separator"
          aria-hidden="true"
        />
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
/**
 * Breadcrumbs Component
 * 
 * @description Displays hierarchical navigation breadcrumbs with support
 * for icons and automatic generation from route structure.
 */

import { ChevronRight } from 'lucide-vue-next'
import type { BreadcrumbItem } from '~/types/navigation'

interface Props {
  items?: BreadcrumbItem[]
  separator?: 'chevron' | 'slash' | 'dot'
}

const props = withDefaults(defineProps<Props>(), {
  separator: 'chevron'
})

const navigationStore = useNavigationStore()

// Use provided items or get from store
const breadcrumbs = computed(() => 
  props.items || navigationStore.breadcrumbs
)
</script>

<style scoped>
.breadcrumbs {
  @apply flex items-center;
}

.breadcrumb-list {
  @apply flex items-center flex-wrap gap-1;
}

.breadcrumb-item {
  @apply flex items-center gap-1;
}

.breadcrumb-link {
  @apply flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400;
  @apply hover:text-gray-900 dark:hover:text-gray-100 transition-colors;
}

.breadcrumb-current {
  @apply flex items-center gap-1.5 text-sm text-gray-900 dark:text-gray-100 font-medium;
}

.breadcrumb-icon {
  @apply size-4;
}

.breadcrumb-separator {
  @apply size-4 text-gray-400 dark:text-gray-600 mx-1;
}

/* Mobile optimizations */
@media (max-width: 640px) {
  .breadcrumb-list {
    @apply gap-0.5;
  }
  
  .breadcrumb-link,
  .breadcrumb-current {
    font-size: 0.75rem; line-height: 1rem;
  }
  
  /* Hide intermediate items on very small screens */
  @media (max-width: 400px) {
    .breadcrumb-item:not(:first-child):not(:last-child):not(:nth-last-child(2)) {
      @apply hidden;
    }
  }
}
</style>
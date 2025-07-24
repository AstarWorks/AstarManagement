<template>
  <div class="timeline-load-more">
    <!-- Intersection observer target for infinite scroll -->
    <div ref="observerTarget" class="observer-target" />
    
    <!-- Manual load more button -->
    <div class="load-more-content">
      <Button 
        v-if="!loading"
        variant="outline" 
        size="lg"
        @click="$emit('load-more')"
        class="load-more-button"
      >
        <ChevronDown class="size-4 mr-2" />
        Load More Communications
      </Button>
      
      <!-- Loading state -->
      <div v-else class="loading-state">
        <div class="loading-spinner" />
        <span class="loading-text">Loading more communications...</span>
      </div>
    </div>
    
    <!-- End of results indicator -->
    <div v-if="isEnd" class="end-indicator">
      <div class="end-content">
        <CheckCircle class="end-icon" />
        <span class="end-text">You've reached the end of the timeline</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ChevronDown, CheckCircle } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'

interface Props {
  loading?: boolean
  hasMore?: boolean
  autoLoad?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  hasMore: true,
  autoLoad: true
})

const emit = defineEmits<{
  'load-more': []
}>()

const observerTarget = ref<HTMLElement>()
const observer = ref<IntersectionObserver>()

const isEnd = computed(() => !props.hasMore && !props.loading)

// Set up intersection observer for auto-loading
onMounted(() => {
  if (props.autoLoad && observerTarget.value) {
    observer.value = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting && props.hasMore && !props.loading) {
          emit('load-more')
        }
      },
      {
        rootMargin: '100px' // Start loading 100px before the element is visible
      }
    )
    
    observer.value.observe(observerTarget.value)
  }
})

onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect()
  }
})
</script>

<style scoped>
.timeline-load-more {
  @apply py-8;
}

.observer-target {
  @apply h-px;
}

.load-more-content {
  @apply flex justify-center py-4;
}

.load-more-button {
  @apply min-w-[200px];
}

.loading-state {
  @apply flex items-center gap-3 text-muted-foreground;
}

.loading-spinner {
  @apply size-5 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin;
}

.loading-text {
  @apply text-sm font-medium;
}

.end-indicator {
  @apply flex justify-center py-6;
}

.end-content {
  @apply flex items-center gap-2 text-muted-foreground;
}

.end-icon {
  @apply size-5;
}

.end-text {
  @apply text-sm font-medium;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .timeline-load-more {
    @apply py-4;
  }
  
  .load-more-button {
    @apply min-w-[180px] text-sm;
  }
}
</style>
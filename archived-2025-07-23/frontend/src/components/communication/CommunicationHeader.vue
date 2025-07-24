<template>
  <header class="communication-header">
    <div class="header-content">
      <!-- Mobile menu toggle -->
      <Button 
        v-if="showMenuToggle"
        variant="ghost" 
        size="sm"
        @click="$emit('toggle-menu')"
        class="md:hidden"
      >
        <Menu class="size-4" />
        <span class="sr-only">Toggle menu</span>
      </Button>
      
      <!-- Title -->
      <h1 class="header-title">{{ title }}</h1>
      
      <!-- Actions slot -->
      <div class="header-actions">
        <slot name="actions">
          <!-- Default search -->
          <div class="search-container">
            <Search class="search-icon" />
            <input
              type="text"
              placeholder="Search communications..."
              class="search-input"
            />
          </div>
          
          <!-- Filter button -->
          <Button variant="outline" size="sm">
            <Filter class="size-4 mr-2" />
            Filter
          </Button>
        </slot>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Menu, Search, Filter } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'

defineProps<{
  title: string
  showMenuToggle?: boolean
}>()

defineEmits<{
  'toggle-menu': []
}>()
</script>

<style scoped>
.communication-header {
  @apply border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60;
}

.header-content {
  @apply flex items-center justify-between gap-4 px-4 py-3;
}

.header-title {
  @apply text-lg font-semibold text-foreground;
}

.header-actions {
  @apply flex items-center gap-2;
}

.search-container {
  @apply relative hidden sm:flex;
}

.search-icon {
  @apply absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground;
}

.search-input {
  @apply pl-9 pr-3 py-1.5 text-sm border border-input rounded-md;
  @apply bg-background text-foreground placeholder:text-muted-foreground;
  @apply focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2;
  @apply w-48 lg:w-64;
}

/* Mobile adjustments */
@media (max-width: 640px) {
  .header-content {
    @apply px-2 py-2;
  }
  
  .header-title {
    @apply text-base;
  }
}
</style>
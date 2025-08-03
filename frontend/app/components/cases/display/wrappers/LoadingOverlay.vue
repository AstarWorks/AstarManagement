<!--
  Loading Overlay Wrapper Component
  Displays a loading state overlay when content is being loaded
-->
<template>
  <div v-if="loading" class="absolute inset-0 z-10">
    <!-- Semi-transparent overlay -->
    <div class="absolute inset-0 bg-background/50 backdrop-blur-sm" />
    
    <!-- Loading indicator -->
    <div class="absolute inset-0 flex items-center justify-center">
      <div class="flex flex-col items-center gap-2">
        <!-- Spinner -->
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-muted-foreground/20 border-t-primary" />
        
        <!-- Optional loading text -->
        <span v-if="loadingText" class="text-sm text-muted-foreground">
          {{ loadingText }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  loading?: boolean
  loadingText?: string
}

withDefaults(defineProps<Props>(), {
  loading: false,
  loadingText: undefined
})
</script>
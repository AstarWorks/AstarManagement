<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  isUpdating: boolean
  lastUpdate?: Date | null
}

const props = defineProps<Props>()

const showPulse = ref(false)

// Trigger pulse animation when lastUpdate changes
watch(() => props.lastUpdate, () => {
  showPulse.value = true
  setTimeout(() => {
    showPulse.value = false
  }, 1000)
})
</script>

<template>
  <div class="relative">
    <!-- Continuous pulse when updating -->
    <div
      v-if="isUpdating"
      class="absolute inset-0 animate-pulse bg-primary/10 rounded"
    />
    
    <!-- Single ping animation when updated -->
    <div
      v-if="showPulse"
      class="absolute inset-0 animate-ping bg-primary/20 rounded"
    />
    
    <!-- Content slot -->
    <slot />
  </div>
</template>
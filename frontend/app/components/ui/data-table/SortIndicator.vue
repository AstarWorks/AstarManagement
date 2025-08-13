<script setup lang="ts">
import { computed } from 'vue'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-vue-next'

interface Props {
  sortDirection?: 'asc' | 'desc' | false
}

const props = defineProps<Props>()

const icon = computed(() => {
  if (props.sortDirection === 'asc') return ChevronUp
  if (props.sortDirection === 'desc') return ChevronDown
  return ChevronsUpDown
})

const isActive = computed(() => props.sortDirection !== false)
</script>

<template>
  <component 
    :is="icon" 
    class="ml-2 h-4 w-4 transition-colors"
    :class="isActive ? 'text-foreground' : 'text-muted-foreground/50'"
  />
</template>
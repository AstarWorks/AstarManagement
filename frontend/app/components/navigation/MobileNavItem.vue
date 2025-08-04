<template>
  <NuxtLink
    :to="to"
    class="mobile-nav-item"
:class="[
      active && 'active'
    ]"
  >
    <Icon :name="icon" class="w-5 h-5" />
    <span>{{ label }}</span>
  </NuxtLink>
</template>

<script setup lang="ts">
import { Icon } from '#components'

interface Props {
  to: string
  icon: string
  label: string
  active?: boolean
}

defineProps<Props>()
</script>

<style scoped>
.mobile-nav-item {
  @apply flex items-center gap-3 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors;
}

.mobile-nav-item.active {
  @apply text-foreground bg-accent;
}
</style>
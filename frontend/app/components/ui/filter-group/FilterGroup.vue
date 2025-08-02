<template>
  <div class="flex flex-col">
    <Label class="text-sm font-medium text-foreground mb-2">{{ label }}</Label>
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  label: string
}

defineProps<Props>()
</script>


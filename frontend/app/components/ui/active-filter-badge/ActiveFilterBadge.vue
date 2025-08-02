<template>
  <Badge variant="secondary" class="flex items-center gap-1">
    {{ label }}
    <Button
      variant="ghost"
      size="sm"
      class="h-4 w-4 p-0 hover:bg-transparent"
      @click="$emit('remove')"
    >
      <Icon name="lucide:x" class="h-3 w-3" />
    </Button>
  </Badge>
</template>

<script setup lang="ts">
interface Props {
  label: string
}

interface Emits {
  (e: 'remove'): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>
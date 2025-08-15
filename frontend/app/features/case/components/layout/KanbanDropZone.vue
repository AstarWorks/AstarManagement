<template>
  <div
    v-if="isVisible"
    v-motion
    :initial="{ opacity: 0, y: -20, scale: 0.9 }"
    :enter="{ opacity: 1, y: 0, scale: 1, transition: { duration: 300, ease: 'easeOut' } }"
    :leave="{ opacity: 0, y: -20, scale: 0.9, transition: { duration: 200 } }"
    :hover="{ scale: 1.02, transition: { duration: 150 } }"
    class="drop-zone-indicator mt-3 p-4 border-2 border-dashed border-primary bg-primary/5 rounded-lg text-center animate-pulse transition-all duration-300 hover:bg-primary/10"
  >
    <Icon name="lucide:move" class="h-6 w-6 text-primary mx-auto mb-2 animate-bounce" />
    <p class="text-sm text-primary font-medium animate-fadeIn">
      {{ $t('matter.kanban.dragDrop.dropHere', { status: statusTitle }) }}
    </p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isVisible: boolean
  statusTitle: string
}

defineProps<Props>()

const { t: $t } = useI18n()
</script>
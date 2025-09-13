<template>
  <div class="flex items-center justify-end gap-1">
    <!-- Copy button -->
    <Button
      variant="ghost"
      size="icon"
      :class="buttonClass"
      @click="$emit('duplicate')"
    >
      <Icon name="lucide:copy" :class="iconClass" />
      <span class="sr-only">{{ $t('foundation.actions.data.duplicate') }}</span>
    </Button>
    
    <!-- Delete button -->
    <Button
      variant="ghost"
      size="icon"
      :class="[buttonClass, 'hover:bg-red-50 hover:text-destructive']"
      @click="$emit('delete')"
    >
      <Icon name="lucide:trash-2" :class="iconClass" />
      <span class="sr-only">{{ $t('foundation.actions.basic.delete') }}</span>
    </Button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  density?: 'compact' | 'normal' | 'comfortable'
}

const props = withDefaults(defineProps<Props>(), {
  density: 'normal'
})

defineEmits<{
  duplicate: []
  delete: []
}>()

// Dynamic button and icon sizes based on density
const buttonClass = computed(() => {
  switch (props.density) {
    case 'compact':
      return 'h-5 w-5 hover:bg-accent transition-all'
    case 'comfortable':
      return 'h-7 w-7 hover:bg-accent transition-all'
    default:
      return 'h-6 w-6 hover:bg-accent transition-all'
  }
})

const iconClass = computed(() => {
  switch (props.density) {
    case 'compact':
      return 'h-3 w-3'
    case 'comfortable':
      return 'h-4 w-4'
    default:
      return 'h-3.5 w-3.5'
  }
})
</script>
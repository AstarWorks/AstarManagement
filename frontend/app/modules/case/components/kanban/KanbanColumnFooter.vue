<template>
  <div 
    v-motion
    :initial="{ opacity: 0, y: 10 }"
    :enter="{ opacity: 1, y: 0, transition: { duration: 300, delay: 200 } }"
    class="column-footer p-3 border-t border-border"
  >
    <Button
      variant="ghost"
      size="sm"
      class="w-full justify-start text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-[1.02] hover:shadow-sm focus-visible:scale-[1.02]"
      @click="$emit('addCaseClicked')"
    >
      <Icon name="lucide:plus" class="h-4 w-4 mr-2 transition-transform duration-200 hover:rotate-90" />
      {{ $t('matter.kanban.actions.addCase') }}
    </Button>
  </div>
</template>

<script setup lang="ts">
const { t: $t } = useI18n()

defineEmits<{
  addCaseClicked: []
}>()
</script>
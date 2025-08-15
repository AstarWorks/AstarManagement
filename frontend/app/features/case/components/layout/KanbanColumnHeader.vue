<template>
  <div
    v-motion
    :initial="{ opacity: 0, y: -10 }"
    :enter="{ opacity: 1, y: 0, transition: { duration: 300, delay: 100 } }"
    class="flex items-center justify-between p-4 rounded-t-lg border-b-2 transition-all duration-200 hover:shadow-sm"
    :class="[status.headerColor, status.color]"
  >
    <div class="flex-1">
      <h3 class="text-lg font-semibold text-foreground">
        {{ status.title }}
      </h3>
      <p class="text-sm text-muted-foreground">
        {{ status.description }}
      </p>
    </div>
    
    <div class="flex items-center gap-2">
      <div class="bg-card/80 backdrop-blur-sm px-2 py-1 rounded-full">
        <span class="text-sm font-medium text-foreground">
          {{ caseCount }}
        </span>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        class="h-8 w-8 p-0 opacity-70 hover:opacity-100 transition-all duration-200 hover:scale-110 hover:bg-background/80 focus-visible:scale-110"
        @click="$emit('settingsClicked')"
      >
        <Icon name="lucide:more-vertical" class="h-4 w-4 transition-transform duration-200 hover:rotate-90" />
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CaseStatus } from '@case/types/case'

interface StatusColumn {
  key: CaseStatus
  title: string
  description: string
  color: string
  headerColor: string
}

interface Props {
  status: StatusColumn
  caseCount: number
}

defineProps<Props>()
defineEmits<{
  settingsClicked: []
}>()
</script>
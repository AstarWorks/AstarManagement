<template>
  <Card
    class="case-card shadow-sm transition-all duration-200 relative min-h-[theme('spacing.44')] max-w-[theme('spacing.72')] w-full"
    :class="cardClasses"
  >
    <CardHeader class="p-4 pb-3">
      <div class="flex items-start justify-between">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
              {{ caseData.caseNumber }}
            </span>
            <CasePriorityBadge :priority="caseData.priority" size="sm" />
          </div>
          <CardTitle
            :id="`case-${caseData.id}-description`"
            class="text-sm line-clamp-2 leading-tight"
          >
            {{ caseData.title }}
          </CardTitle>
        </div>
        
        <!-- Actions slot for parent to inject -->
        <slot name="actions" />
      </div>
    </CardHeader>

    <CardContent class="px-4 pb-3">
      <!-- Client Information -->
      <div class="mb-3">
        <div class="flex items-center gap-2">
          <Icon 
            :name="caseData.client.type === 'individual' ? 'lucide:user' : 'lucide:building'" 
            class="h-4 w-4 text-muted-foreground flex-shrink-0" 
          />
          <span class="text-sm text-foreground truncate">
            {{ caseData.client.name }}
          </span>
          <ClientTypeBadge :type="caseData.client.type" size="xs" />
        </div>
      </div>

      <!-- Metadata Component -->
      <CaseCardMetadata 
        :case-data="caseData" 
        :view-mode="viewMode" 
      />
    </CardContent>

    <CardFooter class="px-4 py-3 border-t">
      <div class="flex items-center justify-between w-full">
        <span class="text-xs text-muted-foreground">{{ $t('cases.card.progress') }}</span>
        <CaseProgressIndicator :status="caseData.status" size="sm" />
      </div>
    </CardFooter>

    <!-- Error slot -->
    <slot name="error" />

    <!-- Loading overlay slot -->
    <slot name="loading" />
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type {  ICase  } from '~/modules/case/types/case'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '~/foundation/components/ui/card'

interface Props {
  caseData: ICase
  viewMode?: 'minimal' | 'compact' | 'detailed'
  priority?: 'high' | 'medium' | 'low'
  isLoading?: boolean
  isDragging?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  viewMode: 'compact',
  isLoading: false,
  isDragging: false
})

// Computed classes for styling
const cardClasses = computed(() => [
  `priority-${props.caseData.priority}`,
  { 'opacity-50': props.isLoading },
  { 'ring-2 ring-primary': props.isDragging }
])
</script>

<style scoped>
.case-card.priority-high {
  @apply border-l-4 border-l-red-500;
}

.case-card.priority-medium {
  @apply border-l-4 border-l-yellow-500;
}

.case-card.priority-low {
  @apply border-l-4 border-l-green-500;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
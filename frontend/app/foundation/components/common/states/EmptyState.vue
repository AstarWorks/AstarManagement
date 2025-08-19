<script setup lang="ts">
import { computed, type Component } from 'vue'
import { Button } from '~/foundation/components/ui/button'
import { cn } from '@foundation/lib/utils/cn'

interface ActionButton {
  label: string
  onClick: () => void
  variant?: 'default' | 'secondary' | 'ghost' | 'outline'
  loading?: boolean
}

interface EmptyStateProps {
  title: string
  description?: string
  icon?: string | Component
  primaryAction?: ActionButton
  secondaryActions?: ActionButton[]
  compact?: boolean
  class?: string
}

const props = withDefaults(defineProps<EmptyStateProps>(), {
  compact: false
})

const containerClasses = computed(() => cn(
  'flex flex-col items-center justify-center text-center',
  props.compact ? 'py-8 px-4' : 'py-16 px-6',
  props.class
))

const iconClasses = computed(() => cn(
  'text-muted-foreground mb-4',
  props.compact ? 'h-12 w-12' : 'h-16 w-16'
))

const titleClasses = computed(() => cn(
  'font-semibold text-foreground mb-2',
  props.compact ? 'text-lg' : 'text-xl'
))

const descriptionClasses = computed(() => cn(
  'text-muted-foreground mb-6 max-w-md',
  props.compact ? 'text-sm' : 'text-base'
))
</script>

<template>
  <div :class="containerClasses">
    <!-- Icon -->
    <div v-if="icon" class="mb-4">
      <component 
        :is="icon"
        v-if="typeof icon === 'object'"
        :class="iconClasses"
      />
      <div 
        v-else
        :class="iconClasses"
        class="flex items-center justify-center rounded-full bg-muted"
      >
        <span class="text-2xl">{{ icon }}</span>
      </div>
    </div>
    
    <!-- Content -->
    <h3 :class="titleClasses">
      {{ title }}
    </h3>
    
    <p v-if="description" :class="descriptionClasses">
      {{ description }}
    </p>
    
    <!-- Actions -->
    <div v-if="primaryAction || secondaryActions?.length" class="flex flex-col sm:flex-row gap-3 items-center">
      <Button 
        v-if="primaryAction"
        :variant="primaryAction.variant || 'default'"
        :disabled="primaryAction.loading"
        @click="primaryAction.onClick"
      >
        {{ primaryAction.label }}
      </Button>
      
      <div v-if="secondaryActions?.length" class="flex flex-wrap gap-2 justify-center">
        <Button
          v-for="action in secondaryActions"
          :key="action.label"
          :variant="action.variant || 'ghost'"
          :disabled="action.loading"
          size="sm"
          @click="action.onClick"
        >
          {{ action.label }}
        </Button>
      </div>
    </div>
    
    <!-- Slot for custom content -->
    <div v-if="$slots.default" class="mt-6">
      <slot />
    </div>
  </div>
</template>
<template>
  <span
    class="inline-flex items-center gap-1 font-medium rounded-full border whitespace-nowrap"
    style="font-feature-settings: 'tnum';"
    :class="[sizeClasses, typeClasses]"
  >
    <Icon :name="typeIcon" :class="iconSizeClass" />
    <span v-if="showLabel">{{ typeLabel }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ClientType } from '~/modules/case/types/case'

interface Props {
  type: ClientType
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'sm',
  showLabel: true
})

// i18n
const { t } = useI18n()

// Computed properties
const typeConfig = computed(() => {
  const configs = {
    individual: {
      label: t('matter.filters.clientType.options.individual'),
      icon: 'lucide:user',
      classes: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
    },
    corporate: {
      label: t('matter.filters.clientType.options.corporate'),
      icon: 'lucide:building',
      classes: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800'
    }
  }
  
  return configs[props.type] || configs.individual
})

const typeLabel = computed(() => typeConfig.value.label)
const typeIcon = computed(() => typeConfig.value.icon)
const typeClasses = computed(() => typeConfig.value.classes)

const sizeClasses = computed(() => {
  const sizes = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1.5 text-sm',
    lg: 'px-3 py-2 text-base'
  }
  
  return sizes[props.size]
})

const iconSizeClass = computed(() => {
  const sizes = {
    xs: 'h-2.5 w-2.5',
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4'
  }
  
  return sizes[props.size]
})
</script>


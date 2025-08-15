<template>
  <div class="quick-filters">
    <Label class="text-sm font-medium mb-2 block">
      {{ $t('expense.filters.quickFilters') }}
    </Label>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
      <Button
        v-for="preset in datePresets"
        :key="preset.key"
        variant="outline"
        size="sm"
        :class="{ 'bg-primary text-primary-foreground': isPresetActive(preset.key) }"
        @click="applyPreset(preset.key)"
      >
        {{ preset.label }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@ui/button/index'
import { Label } from '@ui/label'

interface Props {
  /** Currently active start date */
  startDate?: string
  /** Currently active end date */
  endDate?: string
}

interface Emits {
  /** Emitted when a date preset is applied */
  (event: 'applyPreset', payload: { startDate: string; endDate: string }): void
}

const _props = withDefaults(defineProps<Props>(), {
  startDate: undefined,
  endDate: undefined
})

const emit = defineEmits<Emits>()

// Date presets configuration (following existing logic from useExpenseFilters)
const datePresets = [
  {
    key: 'thisMonth',
    label: '今月',
    getValue: () => {
      const now = new Date()
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
      }
    }
  },
  {
    key: 'lastMonth',
    label: '前月',
    getValue: () => {
      const now = new Date()
      return {
        startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0],
        endDate: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
      }
    }
  },
  {
    key: 'thisQuarter',
    label: '今四半期',
    getValue: () => {
      const now = new Date()
      const quarter = Math.floor(now.getMonth() / 3)
      return {
        startDate: new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0],
        endDate: new Date(now.getFullYear(), quarter * 3 + 3, 0).toISOString().split('T')[0]
      }
    }
  },
  {
    key: 'thisYear',
    label: '今年',
    getValue: () => {
      const now = new Date()
      return {
        startDate: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0],
        endDate: new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0]
      }
    }
  }
]

/**
 * Check if a preset is currently active
 * Simple over Easy: Direct comparison without complex logic
 */
const isPresetActive = (presetKey: string): boolean => {
  if (!_props.startDate || !_props.endDate) return false
  
  const preset = datePresets.find(p => p.key === presetKey)
  if (!preset) return false
  
  const range = preset.getValue()
  return _props.startDate === range.startDate && _props.endDate === range.endDate
}

/**
 * Apply a date preset
 * Dumb UI: Just emit the values, let parent handle logic
 */
const applyPreset = (presetKey: string) => {
  const preset = datePresets.find(p => p.key === presetKey)
  if (preset) {
    const range = preset.getValue()
    if (range.startDate && range.endDate) {
      emit('applyPreset', range as { startDate: string; endDate: string })
    }
  }
}
</script>

<style scoped>
.quick-filters {
  @apply mb-4;
}
</style>
<template>
  <NuxtLink 
    :to="to" 
    class="quick-action-card group"
  >
    <Card class="h-full hover:shadow-lg transition-all duration-200 hover:border-primary/50">
      <CardContent class="p-6">
        <div class="flex items-start justify-between mb-4">
          <div class="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
            <Icon :name="icon" class="w-6 h-6 text-primary" />
          </div>
          <Icon name="lucide:arrow-right" class="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        
        <h4 class="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
          {{ title }}
        </h4>
        
        <p class="text-sm text-muted-foreground mb-4">
          {{ description }}
        </p>
        
        <!-- Stats -->
        <div v-if="stats && stats.length > 0" class="space-y-2">
          <div 
            v-for="(stat, index) in stats" 
            :key="index"
            class="flex items-center justify-between text-sm"
          >
            <span class="text-muted-foreground">{{ stat.label }}</span>
            <div class="flex items-center gap-1">
              <span class="font-medium">{{ stat.value }}</span>
              <Icon 
                v-if="stat.trend"
                :name="getTrendIcon(stat.trend)"
                :class="getTrendClass(stat.trend)"
                class="w-4 h-4"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </NuxtLink>
</template>

<script setup lang="ts">
import { Card, CardContent } from '~/foundation/components/ui/card'
import { Icon } from '#components'

export interface QuickActionStats {
  label: string
  value: string | number
  trend?: 'up' | 'down' | 'neutral'
}

interface Props {
  title: string
  description: string
  icon: string
  to: string
  stats?: QuickActionStats[]
}

defineProps<Props>()

const getTrendIcon = (trend: 'up' | 'down' | 'neutral'): string => {
  switch (trend) {
    case 'up':
      return 'lucide:trending-up'
    case 'down':
      return 'lucide:trending-down'
    default:
      return 'lucide:minus'
  }
}

const getTrendClass = (trend: 'up' | 'down' | 'neutral'): string => {
  switch (trend) {
    case 'up':
      return 'text-green-600'
    case 'down':
      return 'text-red-600'
    default:
      return 'text-muted-foreground'
  }
}
</script>

<style scoped>
.quick-action-card {
  @apply block;
}
</style>
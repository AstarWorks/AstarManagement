<template>
  <div class="flex items-center actions-container">
    <!-- Notifications -->
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger as-child>
          <Button variant="ghost" size="icon" class="relative">
            <Icon name="lucide:bell" class="w-5 h-5" />
            <Badge 
              v-if="notificationCount > 0"
              variant="destructive" 
              class="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {{ notificationCount }}
            </Badge>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {{ notificationCount > 0 ? $t('header.notifications.count', { count: notificationCount }) : $t('header.notifications.label') }}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
    
    <!-- User Menu -->
    <UserMenu />
  </div>
</template>

<script setup lang="ts">
import { Button } from '~/foundation/components/ui/button/index'
import { Badge } from '~/foundation/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/foundation/components/ui/tooltip'

interface Props {
  notificationCount?: number
}

withDefaults(defineProps<Props>(), {
  notificationCount: 0
})
</script>

<style scoped>
.actions-container {
  gap: 0.5rem;
}
</style>
<template>
  <!-- Expanded state -->
  <div 
    v-show="!collapsed || isMobile" 
    v-motion-slide-visible-bottom
    class="p-4 border-t border-primary-foreground/20"
  >
    <div class="flex items-center user-info-container">
      <Avatar 
        v-motion-pop-visible
        class="w-8 h-8"
      >
        <AvatarImage :src="user?.avatar ?? ''" />
        <AvatarFallback>
          {{ getInitials(user?.name ?? '') }}
        </AvatarFallback>
      </Avatar>
      <div 
        v-show="!collapsed" 
        v-motion-slide-visible-right
        class="flex-1 min-w-0 overflow-hidden"
      >
        <p class="text-sm font-medium truncate text-primary-foreground">{{ user?.name }}</p>
        <p class="text-xs text-primary-foreground/70 truncate">{{ getRoleLabel(user?.roles) }}</p>
      </div>
    </div>
  </div>
  
  <div 
    v-show="collapsed && !isMobile" 
    v-motion-pop-visible
    class="p-4 border-t border-primary-foreground/20 flex justify-center"
  >
    <TooltipProvider>
      <Tooltip :delay-duration="0">
        <TooltipTrigger as-child>
          <Avatar 
            v-motion-pop-visible
            class="w-8 h-8 cursor-pointer"
          >
            <AvatarImage :src="user?.avatar ?? ''" />
            <AvatarFallback>
              {{ getInitials(user?.name ?? '') }}
            </AvatarFallback>
          </Avatar>
        </TooltipTrigger>
        <TooltipContent side="right" :side-offset="12">
          <div>
            <p class="font-medium">{{ user?.name }}</p>
            <p class="text-xs text-muted-foreground">{{ getRoleLabel(user?.roles) }}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
</template>

<script setup lang="ts">

import {Avatar} from "~/foundation/components/ui/avatar";
import type { UserProfile } from '@modules/user/types'
import type { DeepReadonly } from 'vue'

interface Props {
  collapsed?: boolean
  isMobile?: boolean
  user?: DeepReadonly<UserProfile> | null
}

defineProps<Props>()

// Use regular useI18n for dynamic keys
const { t } = useI18n()

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

const getRoleLabel = (roles?: DeepReadonly<UserProfile['roles']>): string => {
  if (!roles || roles.length === 0) {
    return t('foundation.common.general.unknown')
  }
  
  // Access readonly array directly
  const primaryRole = roles[0]?.name
  if (!primaryRole) {
    return t('foundation.common.general.guest')
  }
  
  // Use display name if available, otherwise try translation
  const displayName = roles[0]?.displayName
  if (displayName) {
    return displayName
  }
  
  // Try to get translated role label, fallback to role name
  const roleKey = `common.general.${primaryRole.toLowerCase()}`
  const translatedRole = t(roleKey)
  
  // If translation doesn't exist, return the original role name
  return translatedRole !== roleKey ? translatedRole : primaryRole
}
</script>

<style scoped>
.user-info-container {
  gap: 0.75rem;
}
</style>
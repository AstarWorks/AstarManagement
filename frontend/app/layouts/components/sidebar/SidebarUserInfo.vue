<template>
  <div v-if="!collapsed || isMobile" class="p-4 border-t border-border">
    <div class="flex items-center user-info-container">
      <Avatar class="w-8 h-8">
        <AvatarImage :src="user?.avatar ?? ''" />
        <AvatarFallback>
          {{ getInitials(user?.name ?? '') }}
        </AvatarFallback>
      </Avatar>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium truncate">{{ user?.name }}</p>
        <p class="text-xs text-muted-foreground">{{ getRoleLabel(user?.roles) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

import {Avatar} from "~/foundation/components/ui/avatar";
import type {IBusinessRole, IBusinessProfile} from "@modules/auth/types/business-profile";

interface Props {
  collapsed?: boolean
  isMobile?: boolean
  user?: IBusinessProfile | null
}

defineProps<Props>()

// Use regular useI18n for dynamic keys
const { t } = useI18n()

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

const getRoleLabel = (roles?: readonly IBusinessRole[] | null): string => {
  if (!roles || roles.length === 0) {
    return t('foundation.common.general.unknown')
  }
  
  // Convert readonly array to mutable for processing
  const mutableRoles = [...roles]
  const primaryRole = mutableRoles[0]?.name
  if (!primaryRole) {
    return t('foundation.common.general.guest')
  }
  
  // Use display name if available, otherwise try translation
  const displayName = mutableRoles[0]?.displayName
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
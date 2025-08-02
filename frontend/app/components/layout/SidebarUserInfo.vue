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
import type { IRole, IUser } from '~/types/auth'

interface Props {
  collapsed?: boolean
  isMobile?: boolean
  user?: IUser | null
}

defineProps<Props>()

const { t } = useI18n()

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

const getRoleLabel = (roles?: IRole[] | null): string => {
  if (!roles || roles.length === 0) {
    return t('auth.roles.unknown')
  }
  
  const primaryRole = roles[0]?.name
  if (!primaryRole) {
    return t('auth.roles.guest')
  }
  
  // Try to get translated role label, fallback to role name
  const roleKey = `auth.roles.${primaryRole}` as const
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
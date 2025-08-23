<template>
  <div class="flex items-center space-x-3">
    <UserAvatar :user="user" size="lg" />
    
    <div class="flex-1 min-w-0">
      <p class="text-sm font-semibold text-gray-900 truncate">
        {{ user?.name || $t('foundation.common.general.unknown') }}
      </p>
      <p class="text-xs text-gray-500 truncate">
        {{ user?.email || '' }}
      </p>
      
      <!-- Role Badges -->
      <div class="flex flex-wrap gap-1 mt-2">
        <Badge
          v-for="role in user?.roles || []"
          :key="role.id"
          :variant="getRoleBadgeVariant(role.name)"
          class="text-xs px-2 py-0.5"
        >
          {{ role.displayName }}
        </Badge>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import UserAvatar from "@modules/user/components/avatar/UserAvatar.vue";
import {Badge} from "@foundation/components/ui/badge";
import type {IUserProfile} from "@modules/user/types";

interface Props {
  user: IUserProfile | null
}

defineProps<Props>()

const getRoleBadgeVariant = (roleName: string) => {
  const variants = {
    admin: 'destructive',
    lawyer: 'default',
    senior_paralegal: 'secondary',
    client: 'secondary'
  } as const
  
  return variants[roleName as keyof typeof variants] || 'outline'
}
</script>
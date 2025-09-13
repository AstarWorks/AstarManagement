<template>
  <Button
    variant="ghost"
    size="sm"
    class="flex items-center space-x-2 h-10 hover:bg-gray-50"
    :aria-expanded="isOpen"
    aria-haspopup="true"
    :aria-label="$t('modules.navigation.menu.user', { name: user?.name || $t('foundation.common.general.user') })"
    @click="emit('toggle')"
  >
    <!-- User Avatar -->
    <UserAvatar :user="user" size="md" />
    
    <!-- User Name (Hidden on mobile) -->
    <div class="hidden sm:block text-left">
      <p class="text-sm font-medium text-gray-900 truncate max-w-24">
        {{ user?.name || $t('foundation.common.general.user') }}
      </p>
      <p class="text-xs text-gray-500 truncate max-w-24">
        {{ getPrimaryRoleDisplay(user?.roles) }}
      </p>
    </div>
    
    <!-- Dropdown Arrow -->
    <Icon 
      name="lucide:chevron-down" 
      class="h-4 w-4 text-gray-400 transition-transform duration-200"
      :class="{ 'rotate-180': isOpen }"
    />
  </Button>
</template>

<script setup lang="ts">
import type { UserProfile } from '@modules/user/types'
import type { DeepReadonly } from 'vue'
import UserAvatar from "@modules/user/components/avatar/UserAvatar.vue";

interface Props {
  user: DeepReadonly<UserProfile> | null
  isOpen: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  toggle: []
}>()

const { t } = useI18n()

const getPrimaryRoleDisplay = (roles?: DeepReadonly<UserProfile['roles']>): string => {
  if (!roles || roles.length === 0) {
    return t('foundation.common.general.guest')
  }
  
  // Convert readonly array to mutable for processing
  const mutableRoles = [...roles]
  
  // Industry-standard role hierarchy
  const roleHierarchy = ['ADMIN', 'MANAGER', 'USER', 'GUEST']
  
  for (const roleName of roleHierarchy) {
    const role = mutableRoles.find(r => r.name === roleName)
    if (role) {
      return role.displayName || ''
    }
  }
  
  return mutableRoles[0]?.displayName || t('foundation.common.general.guest')
}
</script>
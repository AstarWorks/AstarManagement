<template>
  <Button
    variant="ghost"
    size="sm"
    class="flex items-center space-x-2 h-10 hover:bg-gray-50"
    :aria-expanded="isOpen"
    aria-haspopup="true"
    :aria-label="$t('navigation.menu.user', { name: user?.name || $t('common.user') })"
    @click="emit('toggle')"
  >
    <!-- User Avatar -->
    <UserAvatar :user="user" size="md" />
    
    <!-- User Name (Hidden on mobile) -->
    <div class="hidden sm:block text-left">
      <p class="text-sm font-medium text-gray-900 truncate max-w-24">
        {{ user?.name || $t('common.user') }}
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
import type { IUser, IRole } from '@auth/types/auth'

interface Props {
  user: IUser | null
  isOpen: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  toggle: []
}>()

const { t } = useI18n()

const getPrimaryRoleDisplay = (roles?: IRole[]): string => {
  if (!roles || roles.length === 0) {
    return t('common.guest')
  }
  
  // 重要度順でロールを検索
  const roleHierarchy = ['admin', 'lawyer', 'senior_paralegal', 'paralegal', 'secretary', 'client']
  
  for (const roleName of roleHierarchy) {
    const role = roles.find(r => r.name === roleName)
    if (role) {
      return role.displayName
    }
  }
  
  return roles[0]?.displayName || t('common.guest')
}
</script>
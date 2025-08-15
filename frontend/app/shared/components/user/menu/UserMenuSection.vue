<template>
  <template v-for="item in visibleItems" :key="item.id">
    <UserMenuItem 
      :item="item" 
      :notification-count="getNotificationCount(item.id)"
      @click="emit('itemClick', $event)"
    />
  </template>
</template>

<script setup lang="ts">
import type { IMenuItemConfig } from '@infrastructure/config/userMenuConfig'
import type { IUser } from '@auth/types/auth'

interface Props {
  items: IMenuItemConfig[]
  user: IUser | null
  notificationCounts?: Record<string, number>
}

const props = withDefaults(defineProps<Props>(), {
  notificationCounts: () => ({})
})

const emit = defineEmits<{
  itemClick: [item: IMenuItemConfig]
}>()

const visibleItems = computed(() => {
  if (!props.user) return []
  
  return props.items.filter(item => {
    // 権限チェック
    if (item.requiredRoles && item.requiredRoles.length > 0) {
      const userRoles = props.user?.roles.map(r => r.name) || []
      return item.requiredRoles.some(role => userRoles.includes(role))
    }
    return true
  })
})

const getNotificationCount = (itemId: string): number => {
  return props.notificationCounts[itemId] || 0
}
</script>
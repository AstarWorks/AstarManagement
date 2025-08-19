<template>
  <component
    :is="item.action ? 'button' : 'NuxtLink'"
    :to="item.action ? undefined : item.path"
    class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
    :class="itemClasses"
    role="menuitem"
    @click="handleClick"
  >
    <Icon :name="item.icon" class="mr-3 h-4 w-4" />
    <span class="flex-1">{{ $t(item.labelKey) }}</span>
    
    <!-- Notification Badge -->
    <Badge
      v-if="showNotificationBadge"
      variant="destructive"
      class="ml-2 text-xs min-w-[1.25rem] h-5"
    >
      {{ formatNotificationCount(notificationCount) }}
    </Badge>
    
    <!-- External Link Indicator -->
    <Icon 
      v-if="item.external" 
      name="lucide:external-link" 
      class="ml-2 h-3 w-3 text-gray-400"
    />
  </component>
</template>

<script setup lang="ts">
import type { IMenuItemConfig } from '~/foundation/config/userMenuConfig'
import {Badge} from "~/foundation/components/ui/badge";

interface Props {
  item: IMenuItemConfig
  notificationCount?: number
}

const { t } = useI18n()

const props = withDefaults(defineProps<Props>(), {
  notificationCount: 0
})

const emit = defineEmits<{
  click: [item: IMenuItemConfig]
}>()

const formatNotificationCount = (count: number): string => {
  return count > 99 ? t('foundation.common.notifications.maxCount') : count.toString()
}


const itemClasses = computed(() => {
  return props.item.id === 'logout' 
    ? 'text-red-600 hover:bg-red-50' 
    : ''
})

const showNotificationBadge = computed(() => {
  return props.item.id === 'notifications' && props.notificationCount > 0
})

const handleClick = () => {
  emit('click', props.item)
}
</script>
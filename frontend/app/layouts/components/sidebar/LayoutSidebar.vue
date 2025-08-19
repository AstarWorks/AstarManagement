<template>
  <aside
    class="bg-card border-r border-border w-64 h-full flex flex-col"
    :class="{ 'w-16': collapsed && !isMobile }"
  >
    <SidebarHeader 
      :collapsed="collapsed" 
      :is-mobile="isMobile" 
      @close="$emit('close')" 
    />
    
    <SidebarNavigation 
      :collapsed="collapsed" 
      :is-mobile="isMobile" 
      :user="user" 
    />
    
    <SidebarUserInfo 
      :collapsed="collapsed" 
      :is-mobile="isMobile" 
      :user="user" 
    />
  </aside>
</template>

<script setup lang="ts">
import SidebarUserInfo from './SidebarUserInfo.vue'
import SidebarNavigation from './SidebarNavigation.vue'
import SidebarHeader from './SidebarHeader.vue'

interface Props {
  collapsed?: boolean
  isMobile?: boolean
}

defineProps<Props>()
defineEmits<{
  close: []
}>()

// Authentication - using standard useAuth composable
const { profile } = useUserProfile()
const user = computed(() => profile.value)
</script>
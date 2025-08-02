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
interface Props {
  collapsed?: boolean
  isMobile?: boolean
}

defineProps<Props>()
defineEmits<{
  close: []
}>()

// Authentication store
const authStore = useAuthStore()
const user = computed(() => authStore.user)
</script>
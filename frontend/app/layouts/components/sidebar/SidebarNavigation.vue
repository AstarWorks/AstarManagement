<template>
  <nav class="flex-1 p-4 space-y-2">
    <template v-for="item in filteredNavigation" :key="item.id">
      <!-- Single Navigation Item -->
      <NavigationItem
        v-if="!item.children"
        :to="item.path"
        :icon="item.icon"
        :collapsed="collapsed && !isMobile"
      >
        {{ $t(item.labelKey) }}
      </NavigationItem>
      
      <!-- Navigation Group with Children -->
      <NavigationGroup
        v-else
        :title="$t(item.labelKey)"
        :icon="item.icon"
        :collapsed="collapsed && !isMobile"
        :default-open="isCurrentSection(item.path)"
      >
        <NavigationItem
          v-for="child in item.children"
          :key="child.id"
          :to="child.path"
          :collapsed="collapsed && !isMobile"
        >
          {{ $t(child.labelKey) }}
        </NavigationItem>
      </NavigationGroup>
    </template>
  </nav>
</template>

<script setup lang="ts">
import type { IUserProfile } from '@modules/auth/types/user-profile'
import { MAIN_NAVIGATION_CONFIG, type NavigationItemConfig } from '~/foundation/config/navigationConfig'
import { useUserProfile } from '@modules/auth/composables/auth/useUserProfile'
import NavigationItem from "~/layouts/components/sidebar/NavigationItem.vue";
import NavigationGroup from "~/layouts/components/sidebar/NavigationGroup.vue";

interface Props {
  collapsed?: boolean
  isMobile?: boolean
  user?: IUserProfile | null
}

const props = defineProps<Props>()
const route = useRoute()

// Use user profile for permissions
const { hasPermission, hasRole } = useUserProfile()

// Check if current route is in section
const isCurrentSection = (path: string) => {
  return route.path.startsWith(path)
}

// Use regular useI18n for dynamic keys
// const { t } = useI18n() // Temporarily unused

// Filter navigation items based on user permissions and roles
const filteredNavigation = computed((): NavigationItemConfig[] => {
  if (!props.user) {
    // ユーザーがログインしていない場合は、権限要求のないアイテムのみ表示
    return MAIN_NAVIGATION_CONFIG.filter(item => 
      !item.requiredRoles && !item.requiredPermissions
    )
  }
  
  // Filter items based on permissions
  return MAIN_NAVIGATION_CONFIG.filter(item => {
    if (!item.requiredPermissions?.length && !item.requiredRoles?.length) return true
    if (item.requiredPermissions?.some(p => hasPermission(p))) return true
    if (item.requiredRoles?.some(r => hasRole(r))) return true
    return false
  })
})
</script>
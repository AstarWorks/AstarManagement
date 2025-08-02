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
import type { IUser } from '~/types/auth'
import { MAIN_NAVIGATION_CONFIG, type NavigationItemConfig } from '~/config/navigationConfig'

interface Props {
  collapsed?: boolean
  isMobile?: boolean
  user?: IUser | null
}

const props = defineProps<Props>()

// Use navigation composable for utilities
const { isCurrentSection } = useNavigation()
const { filterByAccess } = usePermissions()

// Filter navigation items based on user permissions and roles
const filteredNavigation = computed((): NavigationItemConfig[] => {
  if (!props.user) {
    // ユーザーがログインしていない場合は、権限要求のないアイテムのみ表示
    return MAIN_NAVIGATION_CONFIG.filter(item => 
      !item.requiredRoles && !item.requiredPermissions
    )
  }
  
  return filterByAccess(MAIN_NAVIGATION_CONFIG, props.user)
})
</script>
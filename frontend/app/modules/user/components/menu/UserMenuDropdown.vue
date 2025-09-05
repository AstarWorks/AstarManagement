<template>
  <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
  >
    <div
        v-if="isOpen"
        ref="menu"
        class="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
        role="menu"
        aria-orientation="vertical"
    >
      <!-- User Info Header -->
      <div class="px-4 py-3 border-b border-gray-100">
        <UserInfo :user="user"/>

        <!-- Quick Stats (if applicable) -->
        <UserQuickStats
            v-if="shouldShowQuickStats"
            :stats="stats"
        />
      </div>

      <!-- Menu Items -->
      <div class="py-2">
        <template v-for="(section, sectionIndex) in menuSections" :key="section.id">
          <UserMenuSection
              :items="section.items"
              :user="user"
              :notification-counts="notificationCounts"
              @item-click="emit('itemClick', $event)"
          />

          <!-- Section Divider -->
          <hr v-if="sectionIndex < menuSections.length - 1" class="my-2 border-gray-100"/>
        </template>
      </div>

      <!-- Footer -->
      <div class="px-4 py-3 bg-gray-50 border-t border-gray-100 rounded-b-lg">
        <div class="flex items-center justify-between text-xs text-gray-500">
          <span>
            {{ formatLastLoginLabel() }}
          </span>
          <div class="flex items-center space-x-2">
            <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"/>
            <span>{{ $t('modules.auth.status.online') }}</span>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
  import type {IMenuItemConfig, IMenuSectionConfig} from '@foundation/config/userMenuConfig'
  import {BASE_MENU_SECTIONS, ADMIN_MENU_SECTION} from '@foundation/config/userMenuConfig'
  import UserInfo from '@modules/user/components/profile/UserInfo.vue'
  import UserQuickStats from '@modules/user/components/profile/UserQuickStats.vue'
  import UserMenuSection from "./UserMenuSection.vue";
  import type { UserProfile, IUserStats } from "@modules/user/types";
  import type { DeepReadonly } from 'vue'

  interface Props {
    user: DeepReadonly<UserProfile> | null
    isOpen: boolean
    stats?: IUserStats
    notificationCounts?: Record<string, number>
    showQuickStats?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    stats: () => ({activeCases: 0, tasksToday: 0, unreadMessages: 0} as IUserStats),
    notificationCounts: () => ({}),
    showQuickStats: true
  })

  const emit = defineEmits<{
    itemClick: [item: IMenuItemConfig]
  }>()

  const menu = ref()

  const shouldShowQuickStats = computed(() => {
    if (!props.showQuickStats || !props.user) return false

    // Show stats for lawyers and senior staff
    const userRoles = props.user.roles?.map(r => r.name) || []
    return userRoles.some(role =>
        ['lawyer', 'senior_paralegal', 'admin'].includes(role)
    )
  })

  const menuSections = computed((): IMenuSectionConfig[] => {
    const sections = [...BASE_MENU_SECTIONS]

    // Add admin section for admin users
    if (props.user?.roles?.some(role => role.name === 'admin')) {
      // Insert admin section before the last section (session)
      sections.splice(-1, 0, ADMIN_MENU_SECTION)
    }

    return sections
  })

  const {t} = useI18n()

  const _formatLastLogin = (lastLogin?: Date): string => {
    if (!lastLogin) return t('modules.auth.lastLogin.never')

    const now = new Date()
    const diff = now.getTime() - lastLogin.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) {
      return t('modules.auth.lastLogin.minutesAgo', {minutes})
    }

    if (hours < 24) {
      return t('modules.auth.lastLogin.hoursAgo', {hours})
    }

    return t('modules.auth.lastLogin.daysAgo', {days})
  }

  const formatLastLoginLabel = (): string => {
    // lastLoginAt property doesn't exist in UserProfile, using placeholder
    return `${t('modules.auth.lastLogin.label')}: ${t('modules.auth.lastLogin.unavailable')}`
  }

  // Expose menu ref for external use (e.g., click outside)
  defineExpose({menu})
</script>
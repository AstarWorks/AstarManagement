<template>
  <nav class="flex-1 p-4 space-y-2">
    <!-- Main Navigation -->
    <NavigationItem
      v-for="item in navigation"
      :key="item.id"
      :to="item.href"
      :icon="item.icon"
      :collapsed="collapsed && !isMobile"
    >
      {{ item.name }}
      <Badge v-if="item.badge" variant="secondary" class="ml-2">
        {{ item.badge }}
      </Badge>
    </NavigationItem>

    <!-- Admin Section -->
    <div v-if="adminNavigation.length > 0" class="pt-4 mt-4 border-t border-primary-foreground/20">
      <div v-if="!collapsed || isMobile" class="px-3 py-2 text-xs font-semibold text-primary-foreground/50 uppercase tracking-wide">
        {{ $t('modules.navigation.menu.admin.title') }}
      </div>
      <NavigationItem
        v-for="item in adminNavigation"
        :key="item.id"
        :to="item.href"
        :icon="item.icon"
        :collapsed="collapsed && !isMobile"
      >
        {{ item.name }}
      </NavigationItem>
    </div>

    <!-- Mock Quick Access Section -->
    <div v-if="isMockMode" class="pt-4 mt-4">
      <Separator />
      <div class="pt-4">
        <NavigationItem
          :to="`/tables/${MOCK_TABLE_IDS.EXPENSE_MANAGEMENT}`"
          icon="lucide:receipt"
          :collapsed="collapsed && !isMobile"
        >
          {{ MOCK_LABELS.navigation.expenseManagement }}
        </NavigationItem>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import type { UserProfile } from '@modules/user/types'
import type { DeepReadonly } from 'vue'
import NavigationItem from "~/layouts/components/sidebar/NavigationItem.vue";
import { Separator } from '~/foundation/components/ui/separator'
import { useIsMockMode } from '@shared/api/composables/useApiClient'
import { MOCK_LABELS } from '~/modules/mock/i18n/mockLabels'
import { MOCK_TABLE_IDS } from '~/modules/mock/constants/mockIds'

interface Props {
  collapsed?: boolean
  isMobile?: boolean
  user?: DeepReadonly<UserProfile> | null
}

const props = defineProps<Props>()

// Use the new simplified navigation composable
const { navigation, adminNavigation } = useNavigation()
const { t } = useI18n()

// Mock mode detection
const isMockMode = useIsMockMode()
</script>
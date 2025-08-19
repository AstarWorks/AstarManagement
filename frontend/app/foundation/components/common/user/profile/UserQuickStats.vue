<template>
  <div class="mt-3 grid grid-cols-3 gap-2 text-center">
    <div class="text-xs">
      <p class="font-semibold text-gray-900">{{ stats.activeCases }}</p>
      <p class="text-gray-500">{{ $t('modules.dashboard.stats.activeCases') }}</p>
    </div>
    <div class="text-xs">
      <p class="font-semibold text-gray-900">{{ stats.tasksToday }}</p>
      <p class="text-gray-500">{{ $t('modules.dashboard.stats.tasksToday') }}</p>
    </div>
    <div class="text-xs">
      <p class="font-semibold text-gray-900">{{ stats.unreadMessages }}</p>
      <p class="text-gray-500">{{ $t('modules.dashboard.stats.unreadMessages') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface UserStats {
  activeCases: number
  tasksToday: number
  unreadMessages: number
}

interface Props {
  stats: UserStats
}

defineProps<Props>()
</script>
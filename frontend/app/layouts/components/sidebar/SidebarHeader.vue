<template>
  <div class="p-4 border-b border-border">
    <div class="flex items-center" style="gap: 0.75rem;">
      <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center" :class="[ uiStore.isSidebarOpen? '': 'ml-auto' ]">
        <Icon name="lucide:scale" class="w-5 h-5 text-primary-foreground" />
      </div>

      <div v-if="uiStore.isSidebarOpen && (!collapsed || isMobile)" class="flex-1">
        <h1 class="font-bold text-lg">{{ $t('modules.navigation.sidebar.appName') }}</h1>
        <p class="text-xs text-muted-foreground">{{ $t('modules.navigation.sidebar.tagline') }}</p>
      </div>
      
      <Button v-if="isMobile" variant="ghost" size="icon" @click="$emit('close')">
        <Icon name="lucide:x" class="w-4 h-4" />
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUIStore } from '#imports';
const uiStore = useUIStore();

interface Props {
  collapsed?: boolean
  isMobile?: boolean
}


defineProps<Props>()
defineEmits<{
  close: []
}>()
</script>
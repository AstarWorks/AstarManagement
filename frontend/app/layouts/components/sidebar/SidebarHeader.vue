<template>
  <div class="p-4 border-b border-primary-foreground/20">
    <div class="flex items-center" style="gap: 0.75rem;">
      <div 
        v-motion-pop-visible
        class="w-8 h-8 bg-primary-foreground/10 rounded-lg flex items-center justify-center"
      >
        <Icon name="lucide:scale" class="w-5 h-5 text-primary-foreground" />
      </div>
      <div v-show="!collapsed || isMobile">
        <div 
          v-motion-slide-visible-right
          class="flex-1 overflow-hidden"
        >
          <h1 class="font-bold text-lg whitespace-nowrap text-primary-foreground">{{ $t('modules.navigation.sidebar.appName') }}</h1>
          <p class="text-xs text-primary-foreground/70 whitespace-nowrap">{{ $t('modules.navigation.sidebar.tagline') }}</p>
        </div>
      </div>
      <Button
        v-if="isMobile"
        variant="ghost"
        size="icon"
        @click="$emit('close')"
      >
        <Icon name="lucide:x" class="w-4 h-4" />
      </Button>
    </div>
  </div>
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
</script>
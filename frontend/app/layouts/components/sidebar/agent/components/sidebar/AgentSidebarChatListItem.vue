<template>
  <a
    href="#"
    @click.prevent="chatStore.selectChat(chat.id)"
    class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-accent group"
    :class="{
      'text-primary bg-accent': chat.id === chatStore.activeChatId,
      'hover:bg-gray-200 dark:hover:bg-gray-700': chat.id !== chatStore.activeChatId,
    }"
  >
    {{ chat.title }}
  </a>
</template>

<script setup lang="ts">
import { useChatStore } from '../../composables/useAgentChatStore'
const chatStore = useChatStore()

defineProps({
  chat: {
    type: Object as () => ({ id: string; title: string }),
    required: true,
  },
})
</script>
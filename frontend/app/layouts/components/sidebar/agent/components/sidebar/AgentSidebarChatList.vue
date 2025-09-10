<template>
  <nav class="p-2 space-y-1">
    <SidebarChatListItem
      v-for="chat in chatStore.filteredChatHistory"
      :key="chat.id"
      :chat="chat"
    />
  </nav>
</template>

<script setup lang="ts">
import { useChatStore } from '../../composables/useAgentChatStore'
import SidebarChatListItem from './AgentSidebarChatListItem.vue'
const chatStore = useChatStore()
</script>
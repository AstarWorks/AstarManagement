<template>
  <aside class="bg-card border-l border-border w-88 h-full border-gray-200">
      <AgentSidebarHeader/>

      <AgentSidebarSearch class="m-3"/>

      <AddNewChatButton class="m-4"/>

      <AgentSidebarChatList class="m-3"/>
  </aside>
</template>

<script setup lang="ts">
import { useUIStore } from '~/foundation/stores/ui';
import AgentSidebarHeader from '../sidebar/LayoutAgentSidebarHeader.vue';
import AgentSidebarSearch from './AgentSidebarSerch.vue';
import AddNewChatButton from './AddNewChatButton.vue';
import AgentSidebarChatList from './AgentSidebarChatList.vue';
const uiStore = useUIStore();
</script>

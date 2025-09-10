<script setup lang="ts">
import AgentHeader from './header/LayoutAgentHeader.vue';
import AgentSidebar from './sidebar/LayoutAgentSidebar.vue';
import ChatInput from './ChatInput.vue';
import AgentContent from './AgentContent.vue';
import { useUIStore } from '~/foundation/stores/ui';

const uiStore = useUIStore()
</script>

<template>
  <aside class="fixed right-0 top-0 bg-card border-l border-border w-88 h-full flex flex-col">
    <!-- 
    <div
        v-if="isMobileMenuOpen"
        class="fixed inset-0 z-50 lg:hidden"
        @click="closeMobileMenu"
    >
      <div class="absolute inset-0 bg-black/50"/>
      <div class="absolute left-0 top-0 h-full w-64 bg-background">
        <AgentSidebar is-mobile @close="closeMobileMenu"/>
      </div>
    </div> -->

    <AgentSidebar  v-if="uiStore.isAgentSidebarCollapsed" @toggle-agent-sidebar="uiStore.toggleAgentSidebar"
      class="fixed right-0 top-0 z-40 h-screen transition-transform duration-300" :class="[
      uiStore.isAgentCollapsed ? '-translate-x-64' : 'translate-x-0'
    ]" :collapsed="uiStore.isAgentSidebarCollapsed"  />

    <AgentHeader @close-agent="uiStore.toggleAgent" @toggle-agent-sidebar="uiStore.toggleAgentSidebar"/>

    <AgentContent />

    <div class="p-4" >
      <ChatInput />
    </div>
  </aside>
</template>
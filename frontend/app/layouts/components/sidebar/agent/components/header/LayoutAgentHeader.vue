<template>
    <header class="agent-header flex items-center p-3 border-b border-gray-200 bg-white relative z-20">
        <AgentSidebarToggleButton class="mr-auto" @toggle-agent-sidebar='uiStore.toggleAgentSidebar'  />

        <Icon name="lucide:bot-message-square" class="w-6 h-6 inline-block mr-2" />
        <h1 class="text-1xl font-bold mr-auto">Agent</h1>
        
        <AgentCloseButton @close-agent='uiStore.toggleAgent' />
    </header>
</template>

<script setup lang="ts">
import { Icon } from '#components'
import AgentSidebarToggleButton from './AgentSidebarToggleButton.vue';
import AgentCloseButton from './AgentCloseButton.vue';
import { useUIStore } from '~/foundation/stores/ui';

const uiStore = useUIStore()
</script>

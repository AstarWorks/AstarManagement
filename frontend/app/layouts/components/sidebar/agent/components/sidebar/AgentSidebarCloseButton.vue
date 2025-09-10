<template>
    <Button variant="ghost" size="icon" @click='uiStore.toggleAgentSidebar'>
        <Icon name='lucide:minimize-2'/>
    </Button>
</template>

<script setup lang="ts">    
import { Icon } from '#components';
import { useUIStore } from '~/foundation/stores/ui';
const uiStore = useUIStore();
</script>
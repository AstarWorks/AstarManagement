<template>
    <Button variant="ghost" size="icon" @click='uiStore.toggleAgentSidebar'>
        <Icon name="lucide:menu" class="w-5 h-5" />
    </Button>
</template>

<script setup lang="ts">    
import { Button } from '~/foundation/components/ui/button/index'
import { Icon } from '#components'
import { useUIStore } from '~/foundation/stores/ui';
const uiStore = useUIStore()

interface Emits {
  toggleAgentSidebar: []
}

defineEmits<Emits>()
</script>
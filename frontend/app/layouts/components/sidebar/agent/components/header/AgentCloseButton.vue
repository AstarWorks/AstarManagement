<template>
    <Button variant="ghost" size="icon" @click='uiStore.toggleAgent'>
        <Icon name='lucide:circle-x'/>
    </Button>
</template>

<script setup lang="ts">
import { Button } from '~/foundation/components/ui/button/index'
import { Icon } from '#components'
import { useUIStore } from '~/foundation/stores/ui';
const uiStore = useUIStore()

</script>
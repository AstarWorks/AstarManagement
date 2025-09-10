<template>
    <Button>
        <Icon name="lucide:square-pen"/>
        <span class="ml-2">
            新規チャットを始める
        </span>
    </Button>
</template>

<script setup lang="ts">
import { Button } from '#components'
import { Icon } from '#components'
import { useUIStore } from '~/foundation/stores/ui';

const uiStore = useUIStore();
</script>
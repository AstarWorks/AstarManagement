<template>
  <!-- Agent Toggle Button -->
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger as-child>
        <Button variant="ghost" size="icon" class="hidden lg:flex" @click='uiStore.toggleAgent'>
          <Icon name="lucide:bot-message-square" class="w-5 h-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {{ $t('modules.header.sidebar.openAgent') }}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>

<script setup lang="ts">
import { Button } from '~/foundation/components/ui/button/index'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/foundation/components/ui/tooltip'
import { useUIStore } from '~/foundation/stores/ui';
const uiStore = useUIStore()

</script>


<template>
  <!-- Mobile Menu Button -->
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger as-child>
        <Button
          variant="ghost"
          size="icon"
          class="lg:hidden"
          @click="$emit('toggleMobileMenu')"
        >
          <Icon name="lucide:menu" class="w-5 h-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {{ $t('modules.header.sidebar.openMobileMenu') }}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
  
  <!-- Desktop Sidebar Toggle -->
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger as-child>
        <Button
          variant="ghost"
          size="icon"
          class="hidden lg:flex"
          @click="$emit('toggleSidebar')"
        >
          <Icon 
            :name="isSidebarCollapsed ? 'lucide:panel-left-open' : 'lucide:panel-left-close'" 
            class="w-5 h-5" 
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {{ $t('modules.header.sidebar.toggle') }}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>

<script setup lang="ts">
import { Button } from '~/foundation/components/ui/button/index'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/foundation/components/ui/tooltip'

interface Props {
  isSidebarCollapsed?: boolean
}

interface Emits {
  toggleSidebar: []
  toggleMobileMenu: []
}

defineProps<Props>()
defineEmits<Emits>()
</script>
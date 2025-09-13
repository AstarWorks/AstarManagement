<template>
  <!-- Mobile Menu Button -->
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger as-child>
        <Button
          variant="ghost"
          size="icon"
          class="lg:hidden h-8 w-8 text-foreground hover:bg-accent"
          @click="$emit('toggle-mobile-menu')"
        >
          <Icon name="lucide:menu" class="w-4 h-4" />
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
          class="hidden lg:flex h-8 w-8 text-foreground hover:bg-accent"
          @click="$emit('toggle-sidebar')"
        >
          <Icon 
            :name="isSidebarCollapsed ? 'lucide:panel-left-open' : 'lucide:panel-left-close'" 
            class="w-4 h-4" 
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
  'toggle-sidebar': []
  'toggle-mobile-menu': []
}

defineProps<Props>()
defineEmits<Emits>()
</script>
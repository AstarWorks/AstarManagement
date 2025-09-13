<template>
  <div class="mb-2">
    <!-- Group Header (expandable) -->
    <div v-show="!collapsed">
      <button
          v-motion-slide-visible-right
          class="w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors duration-200"
          :aria-expanded="isOpen"
          @click="toggleGroup"
      >
        <Icon
            v-if="icon"
            :name="icon"
            class="w-4 h-4"
        />
        <span class="flex-1 whitespace-nowrap">{{ title }}</span>
        <Icon
            v-motion-pop-visible
            name="lucide:chevron-down"
            class="w-4 h-4"
        />
      </button>
    </div>

    <!-- Collapsed state - single icon -->
    <div 
      v-show="collapsed" 
      v-motion-pop-visible
      class="flex justify-center px-2 py-2"
    >
      <TooltipProvider>
        <Tooltip :delay-duration="0">
          <TooltipTrigger as-child>
            <Icon
                v-if="icon"
                :name="icon"
                class="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors duration-200"
            />
          </TooltipTrigger>
          <TooltipContent side="right" :side-offset="12">
            {{ title }}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>

    <!-- Navigation Items with v-motion animation -->
    <div
        v-show="isOpen && !collapsed"
        v-motion-fade-visible
        class="ml-4 space-y-1 overflow-hidden"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  icon?: string
  collapsed?: boolean
  defaultOpen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  defaultOpen: false
})

const isOpen = ref(props.defaultOpen)

const toggleGroup = () => {
  isOpen.value = !isOpen.value
}

// Watch for route changes to auto-expand relevant groups
const route = useRoute()
const { t } = useI18n()

watch(() => route.path, () => {
  // Auto-expand group if current route matches
  if (props.title === t('modules.navigation.groups.matters') && route.path.startsWith('/cases')) {
    isOpen.value = true
  } else if (props.title === t('modules.navigation.groups.clients') && route.path.startsWith('/clients')) {
    isOpen.value = true
  } else if (props.title === t('modules.navigation.groups.documents') && route.path.startsWith('/documents')) {
    isOpen.value = true
  } else if (props.title === t('modules.navigation.groups.finance') && route.path.startsWith('/finance')) {
    isOpen.value = true
  }
}, { immediate: true })
</script>

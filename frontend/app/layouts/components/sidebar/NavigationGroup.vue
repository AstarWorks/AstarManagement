<template>
  <div class="mb-2">
    <!-- Group Header (collapsible) -->
    <button
        v-if="!collapsed"
        class="w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors duration-200"
        :aria-expanded="isOpen"
        @click="toggleGroup"
    >
      <Icon
          v-if="icon"
          :name="icon"
          class="w-4 h-4"
      />
      <span class="flex-1">{{ title }}</span>
      <Icon
          name="lucide:chevron-down"
          class="w-4 h-4 transition-transform duration-200"
          :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <!-- Collapsed state - single icon -->
    <div v-else class="flex justify-center px-2 py-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <Icon
                v-if="icon"
                :name="icon"
                class="w-5 h-5 text-muted-foreground"
            />
          </TooltipTrigger>
          <TooltipContent side="right">
            {{ title }}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>

    <!-- Navigation Items -->
    <div
        v-if="isOpen && !collapsed"
        class="ml-4 space-y-1"
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

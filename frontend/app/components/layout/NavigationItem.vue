<template>
  <NuxtLink
    :to="to"
    class="navigation-item group"
    :class="{
      'active': isActive,
      'collapsed': collapsed
    }"
  >
    <Icon
      v-if="icon"
      :name="icon"
      class="w-5 h-5 shrink-0"
      :class="{ 'text-primary': isActive }"
    />
    
    <span
      v-if="!collapsed"
      class="transition-opacity duration-200"
      :class="{ 'opacity-0': collapsed }"
    >
      <slot />
    </span>
    
    <!-- Tooltip for collapsed state -->
    <TooltipProvider v-if="collapsed">
      <Tooltip>
        <TooltipTrigger as-child>
          <span class="sr-only"><slot /></span>
        </TooltipTrigger>
        <TooltipContent side="right">
          <slot />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </NuxtLink>
</template>

<script setup lang="ts">
interface Props {
  to: string
  icon?: string
  collapsed?: boolean
}

const props = defineProps<Props>()

const route = useRoute()
const isActive = computed(() => route.path === props.to)
</script>

<style scoped>
.navigation-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: hsl(var(--muted-foreground));
  transition: color 0.2s, background-color 0.2s;
  text-decoration: none;
}

.navigation-item:hover {
  color: hsl(var(--foreground));
  background-color: hsl(var(--accent));
}

.navigation-item.active {
  color: hsl(var(--primary));
  background-color: hsl(var(--accent));
}

.navigation-item.collapsed {
  justify-content: center;
  padding: 0.5rem;
}
</style>
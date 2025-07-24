<template>
  <div class="communication-layout">
    <!-- Desktop Layout -->
    <div class="hidden md:flex h-full">
      <CommunicationSidebar 
        :active-section="activeSection"
        @navigate="handleNavigation"
      />
      <div class="flex-1 flex flex-col">
        <CommunicationHeader :title="sectionTitle">
          <template #actions>
            <slot name="header-actions" />
          </template>
        </CommunicationHeader>
        <main class="flex-1 overflow-auto p-6">
          <slot />
        </main>
      </div>
    </div>
    
    <!-- Mobile Layout -->
    <div class="md:hidden flex flex-col h-full">
      <CommunicationHeader 
        :title="sectionTitle"
        :show-menu-toggle="true"
        @toggle-menu="toggleMobileMenu"
      >
        <template #actions>
          <slot name="header-actions" />
        </template>
      </CommunicationHeader>
      <CommunicationTabs 
        :active-section="activeSection"
        @navigate="handleNavigation"
      />
      <main class="flex-1 overflow-auto p-4">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCommunicationNavigation } from '~/composables/useCommunicationNavigation'
import CommunicationSidebar from './CommunicationSidebar.vue'
import CommunicationTabs from './CommunicationTabs.vue'
import CommunicationHeader from './CommunicationHeader.vue'

const route = useRoute()
const router = useRouter()
const { currentSection, navigateToSection, updateBreadcrumbs } = useCommunicationNavigation()

// Extract section from route path
const activeSection = computed(() => {
  const path = route.path
  if (path.includes('/memos')) return 'memos'
  if (path.includes('/notes')) return 'notes'
  if (path.includes('/emails')) return 'emails'
  if (path.includes('/messages')) return 'messages'
  if (path.includes('/calls')) return 'calls'
  return 'memos' // default
})

const sectionTitle = computed(() => {
  const titles = {
    memos: 'Client Memos',
    notes: 'Internal Notes',
    emails: 'Email Communications',
    messages: 'Messages',
    calls: 'Phone Calls'
  }
  return titles[activeSection.value as keyof typeof titles] || 'Communications'
})

const handleNavigation = (section: string) => {
  navigateToSection(section)
}

const toggleMobileMenu = () => {
  // This could be connected to a global navigation store if needed
  console.log('Toggle mobile menu')
}

// Update breadcrumbs when component mounts or route changes
onMounted(() => {
  updateBreadcrumbs()
})

watch(() => route.path, () => {
  updateBreadcrumbs()
})
</script>

<style scoped>
.communication-layout {
  @apply h-full bg-background;
}

/* Smooth transitions for section changes */
main {
  @apply transition-all duration-200 ease-in-out;
}

/* Mobile-specific optimizations */
@media (max-width: 768px) {
  main {
    @apply p-2;
  }
}
</style>
<template>
  <header class="bg-background border-b border-border px-4 lg:px-6 h-16 flex items-center header-container">
    <!-- Mobile Menu Button -->
    <Button
      variant="ghost"
      size="icon"
      class="lg:hidden"
      @click="$emit('toggleMobileMenu')"
    >
      <Icon name="lucide:menu" class="w-5 h-5" />
    </Button>
    
    <!-- Desktop Sidebar Toggle -->
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
    
    <!-- Breadcrumb Navigation -->
    <div class="hidden md:flex items-center text-sm text-muted-foreground breadcrumb-container">
      <span v-for="(crumb, index) in breadcrumbs" :key="index" class="flex items-center breadcrumb-item">
        <NuxtLink
          v-if="crumb.href"
          :to="crumb.href"
          class="hover:text-foreground transition-colors"
        >
          {{ crumb.label }}
        </NuxtLink>
        <span v-else class="text-foreground font-medium">
          {{ crumb.label }}
        </span>
        <Icon
          v-if="index < breadcrumbs.length - 1"
          name="lucide:chevron-right"
          class="w-4 h-4"
        />
      </span>
    </div>
    
    <!-- Search Bar -->
    <div class="flex-1 max-w-md">
      <div class="relative">
        <Icon name="lucide:search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="案件、依頼者、書類を検索..."
          class="pl-10 bg-muted/50"
          @keydown.enter="handleSearch"
        />
      </div>
    </div>
    
    <!-- Header Actions -->
    <div class="flex items-center actions-container">
      <!-- Notifications -->
      <Button variant="ghost" size="icon" class="relative">
        <Icon name="lucide:bell" class="w-5 h-5" />
        <span
          v-if="notificationCount > 0"
          class="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center"
        >
          {{ notificationCount }}
        </span>
      </Button>
      
      <!-- User Menu -->
      <UserMenu />
    </div>
  </header>
</template>

<script setup lang="ts">
interface Props {
  isSidebarCollapsed?: boolean
}

defineProps<Props>()
defineEmits<{
  toggleSidebar: []
  toggleMobileMenu: []
}>()

// Search functionality
const searchQuery = ref('')
const router = useRouter()

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    router.push(`/search?q=${encodeURIComponent(searchQuery.value)}`)
  }
}

// Breadcrumb navigation
const route = useRoute()
const breadcrumbs = computed(() => {
  const pathSegments = route.path.split('/').filter(Boolean)
  const crumbs = [{ label: 'ダッシュボード', href: '/dashboard' }]
  
  let currentPath = ''
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`
    
    const isLast = index === pathSegments.length - 1
    const label = getBreadcrumbLabel(segment, currentPath)
    
    crumbs.push({
      label,
      href: isLast ? undefined : currentPath
    })
  })
  
  return crumbs
})

const getBreadcrumbLabel = (segment: string, _path: string) => {
  const labels: Record<string, string> = {
    cases: '案件管理',
    clients: '依頼者管理',
    documents: '書類管理',
    finance: '財務管理',
    settings: '設定',
    kanban: 'カンバンボード',
    create: '新規作成',
    upload: 'アップロード'
  }
  
  return labels[segment] || segment
}

// Mock notification count
const notificationCount = ref(3)
</script>

<style scoped>
.header-container {
  gap: 1rem;
}

.breadcrumb-container {
  gap: 0.5rem;
}

.breadcrumb-item {
  gap: 0.5rem;
}

.actions-container {
  gap: 0.5rem;
}
</style>
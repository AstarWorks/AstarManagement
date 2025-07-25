<template>
  <aside
    class="bg-card border-r border-border w-64 h-full flex flex-col"
    :class="{ 'w-16': collapsed && !isMobile }"
  >
    <!-- Logo Header -->
    <div class="p-4 border-b border-border">
      <div class="flex items-center" style="gap: 0.75rem;">
        <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Icon name="lucide:scale" class="w-5 h-5 text-primary-foreground" />
        </div>
        <div v-if="!collapsed || isMobile" class="flex-1">
          <h1 class="font-bold text-lg">Astar Management</h1>
          <p class="text-xs text-muted-foreground">法律事務所管理システム</p>
        </div>
        <Button
          v-if="isMobile"
          variant="ghost"
          size="icon"
          @click="$emit('close')"
        >
          <Icon name="lucide:x" class="w-4 h-4" />
        </Button>
      </div>
    </div>
    
    <!-- Navigation Menu -->
    <nav class="flex-1 p-4 space-y-2">
      <!-- Dashboard -->
      <NavigationItem
        to="/dashboard"
        :icon="'lucide:layout-dashboard'"
        :collapsed="collapsed && !isMobile"
      >
        ダッシュボード
      </NavigationItem>
      
      <!-- Case Management -->
      <NavigationGroup
        title="案件管理"
        :icon="'lucide:file-text'"
        :collapsed="collapsed && !isMobile"
        :default-open="isCurrentSection('/cases')"
      >
        <NavigationItem to="/cases" :collapsed="collapsed && !isMobile">
          案件一覧
        </NavigationItem>
        <NavigationItem to="/cases/kanban" :collapsed="collapsed && !isMobile">
          カンバンボード
        </NavigationItem>
        <NavigationItem to="/cases/create" :collapsed="collapsed && !isMobile">
          新規案件
        </NavigationItem>
      </NavigationGroup>
      
      <!-- Client Management -->
      <NavigationGroup
        title="依頼者管理"
        :icon="'lucide:users'"
        :collapsed="collapsed && !isMobile"
        :default-open="isCurrentSection('/clients')"
      >
        <NavigationItem to="/clients" :collapsed="collapsed && !isMobile">
          依頼者一覧
        </NavigationItem>
        <NavigationItem to="/clients/create" :collapsed="collapsed && !isMobile">
          新規依頼者
        </NavigationItem>
      </NavigationGroup>
      
      <!-- Document Management -->
      <NavigationGroup
        title="書類管理"
        :icon="'lucide:folder-open'"
        :collapsed="collapsed && !isMobile"
        :default-open="isCurrentSection('/documents')"
      >
        <NavigationItem to="/documents" :collapsed="collapsed && !isMobile">
          書類一覧
        </NavigationItem>
        <NavigationItem to="/documents/upload" :collapsed="collapsed && !isMobile">
          書類アップロード
        </NavigationItem>
      </NavigationGroup>
      
      <!-- Financial Management (Role-based) -->
      <NavigationGroup
        v-if="canAccessFinancials"
        title="財務管理"
        :icon="'lucide:calculator'"
        :collapsed="collapsed && !isMobile"
        :default-open="isCurrentSection('/finance')"
      >
        <NavigationItem to="/finance" :collapsed="collapsed && !isMobile">
          財務ダッシュボード
        </NavigationItem>
        <NavigationItem to="/finance/billing" :collapsed="collapsed && !isMobile">
          請求管理
        </NavigationItem>
      </NavigationGroup>
      
      <!-- Settings -->
      <NavigationItem
        to="/settings"
        :icon="'lucide:settings'"
        :collapsed="collapsed && !isMobile"
      >
        設定
      </NavigationItem>
    </nav>
    
    <!-- User Info (Bottom) -->
    <div v-if="!collapsed || isMobile" class="p-4 border-t border-border">
      <div class="flex items-center user-info-container">
        <Avatar class="w-8 h-8">
          <AvatarImage :src="user?.avatar" />
          <AvatarFallback>
            {{ getInitials(user?.name || '') }}
          </AvatarFallback>
        </Avatar>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">{{ user?.name }}</p>
          <p class="text-xs text-muted-foreground">{{ getRoleLabel(user?.roles) }}</p>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
interface Props {
  collapsed?: boolean
  isMobile?: boolean
}

defineProps<Props>()
defineEmits<{
  close: []
}>()

// Authentication store
const authStore = useAuthStore()
const user = computed(() => authStore.user)

// Route helpers
const route = useRoute()
const isCurrentSection = (path: string) => {
  return route.path.startsWith(path)
}

// Role-based access
const canAccessFinancials = computed(() => {
  return user.value?.roles?.some(role => 
    role.name === 'LAWYER' || role.name === 'CLERK'
  )
})

// Helper functions
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

const getRoleLabel = (roles?: string[]) => {
  if (!roles || roles.length === 0) return '未設定'
  
  const roleLabels: Record<string, string> = {
    LAWYER: '弁護士',
    CLERK: '事務員',
    CLIENT: '依頼者'
  }
  
  const primaryRole = roles[0]?.name
  return roleLabels[primaryRole] || primaryRole
}
</script>

<style scoped>
.user-info-container {
  gap: 0.75rem;
}
</style>
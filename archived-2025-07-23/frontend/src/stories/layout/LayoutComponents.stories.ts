/**
 * Layout Components Visual Regression Stories
 * 
 * Comprehensive visual regression testing for layout components including
 * headers, sidebars, navigation, and responsive behavior.
 */

import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, within, userEvent } from '@storybook/test'
import { ref } from 'vue'

// UI Components
import Button from '~/components/ui/button/Button.vue'
import Card from '~/components/ui/card/Card.vue'
import CardContent from '~/components/ui/card/CardContent.vue'
import Badge from '~/components/ui/badge/Badge.vue'
import Avatar from '~/components/ui/avatar/Avatar.vue'
import AvatarFallback from '~/components/ui/avatar/AvatarFallback.vue'
import Separator from '~/components/ui/separator/Separator.vue'

const meta: Meta = {
  title: 'Visual Regression/Layout Components',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Visual regression testing for layout and navigation components.'
      }
    },
    screenshot: true,
    visualRegression: {
      themes: ['light', 'dark'],
      breakpoints: ['mobile', 'tablet', 'desktop'],
      maskSelectors: [
        '[data-testid="user-avatar"]',
        '[data-testid="current-time"]'
      ]
    }
  },
  tags: ['visual', 'regression', 'layout', 'test']
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Application header with navigation and user menu
 */
export const ApplicationHeader: Story = {
  render: () => ({
    components: {
      Button,
      Badge,
      Avatar,
      AvatarFallback,
      Separator
    },
    setup() {
      const currentUser = ref({
        name: 'John Doe',
        email: 'john.doe@lawfirm.com',
        role: 'Senior Lawyer',
        avatar: null
      })
      
      const notifications = ref(3)
      
      return { currentUser, notifications }
    },
    template: `
      <div class="bg-background">
        <!-- Main Header -->
        <header class="border-b bg-card">
          <div class="px-4 lg:px-6 h-16 flex items-center justify-between">
            <!-- Logo and Title -->
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span class="text-primary-foreground font-bold text-sm">A</span>
                </div>
                <h1 class="text-xl font-semibold">Aster Management</h1>
              </div>
              
              <!-- Desktop Navigation -->
              <nav class="hidden md:flex items-center gap-1 ml-8">
                <Button variant="ghost" class="px-3">
                  Dashboard
                </Button>
                <Button variant="ghost" class="px-3 bg-accent text-accent-foreground">
                  Matters
                </Button>
                <Button variant="ghost" class="px-3">
                  Documents
                </Button>
                <Button variant="ghost" class="px-3">
                  Clients
                </Button>
                <Button variant="ghost" class="px-3">
                  Reports
                </Button>
              </nav>
            </div>
            
            <!-- Right Side Actions -->
            <div class="flex items-center gap-3">
              <!-- Search Button -->
              <Button variant="ghost" size="icon" class="hidden sm:inline-flex">
                <span class="sr-only">Search</span>
                🔍
              </Button>
              
              <!-- Notifications -->
              <Button variant="ghost" size="icon" class="relative">
                <span class="sr-only">Notifications</span>
                🔔
                <Badge 
                  variant="destructive" 
                  class="absolute -top-1 -right-1 h-5 w-5 text-xs rounded-full p-0 flex items-center justify-center"
                >
                  {{ notifications }}
                </Badge>
              </Button>
              
              <!-- User Menu -->
              <div class="flex items-center gap-3 pl-3 border-l">
                <div class="hidden sm:block text-right">
                  <p class="text-sm font-medium">{{ currentUser.name }}</p>
                  <p class="text-xs text-muted-foreground">{{ currentUser.role }}</p>
                </div>
                <Avatar class="h-8 w-8">
                  <AvatarFallback>{{ currentUser.name.split(' ').map(n => n[0]).join('') }}</AvatarFallback>
                </Avatar>
              </div>
              
              <!-- Mobile Menu Button -->
              <Button variant="ghost" size="icon" class="md:hidden">
                <span class="sr-only">Menu</span>
                ☰
              </Button>
            </div>
          </div>
        </header>
        
        <!-- Content Area for Context -->
        <div class="h-32 bg-muted/30 flex items-center justify-center">
          <p class="text-muted-foreground">Content area below header</p>
        </div>
      </div>
    `
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Verify header elements
    const logo = canvas.getByText('Aster Management')
    const mattersNav = canvas.getByText('Matters')
    const userAvatar = canvas.getByText('JD') // Avatar fallback
    
    expect(logo).toBeInTheDocument()
    expect(mattersNav).toBeInTheDocument()
    expect(userAvatar).toBeInTheDocument()
    
    // Test navigation interaction
    await userEvent.click(mattersNav)
    expect(mattersNav).toHaveClass('bg-accent')
  }
}

/**
 * Sidebar navigation with collapsible sections
 */
export const SidebarNavigation: Story = {
  render: () => ({
    components: {
      Button,
      Badge,
      Separator,
      Card,
      CardContent
    },
    setup() {
      const isCollapsed = ref(false)
      const currentPath = ref('/matters')
      
      const navigationItems = ref([
        { 
          id: 'dashboard', 
          label: 'Dashboard', 
          icon: '📊', 
          path: '/dashboard',
          badge: null 
        },
        { 
          id: 'matters', 
          label: 'Matters', 
          icon: '📋', 
          path: '/matters',
          badge: '12' 
        },
        { 
          id: 'documents', 
          label: 'Documents', 
          icon: '📄', 
          path: '/documents',
          badge: null 
        },
        { 
          id: 'clients', 
          label: 'Clients', 
          icon: '👥', 
          path: '/clients',
          badge: null 
        },
        { 
          id: 'calendar', 
          label: 'Calendar', 
          icon: '📅', 
          path: '/calendar',
          badge: '3' 
        }
      ])
      
      const quickActions = ref([
        { label: 'New Matter', icon: '➕' },
        { label: 'Upload Document', icon: '📤' },
        { label: 'Add Client', icon: '👤' }
      ])
      
      return { isCollapsed, currentPath, navigationItems, quickActions }
    },
    template: `
      <div class="flex h-screen bg-background">
        <!-- Sidebar -->
        <aside :class="[
          'bg-card border-r transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64'
        ]">
          <!-- Sidebar Header -->
          <div class="p-4 border-b">
            <div class="flex items-center justify-between">
              <div v-if="!isCollapsed" class="flex items-center gap-2">
                <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span class="text-primary-foreground font-bold text-sm">A</span>
                </div>
                <span class="font-semibold">Aster</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                @click="isCollapsed = !isCollapsed"
                class="h-8 w-8"
              >
                {{ isCollapsed ? '→' : '←' }}
              </Button>
            </div>
          </div>
          
          <!-- Navigation Items -->
          <nav class="p-2 space-y-1">
            <div v-for="item in navigationItems" :key="item.id">
              <Button
                variant="ghost"
                :class="[
                  'w-full justify-start gap-3 h-10',
                  currentPath === item.path ? 'bg-accent text-accent-foreground' : ''
                ]"
                @click="currentPath = item.path"
              >
                <span class="text-lg">{{ item.icon }}</span>
                <span v-if="!isCollapsed" class="flex-1 text-left">{{ item.label }}</span>
                <Badge 
                  v-if="!isCollapsed && item.badge" 
                  variant="secondary" 
                  class="text-xs"
                >
                  {{ item.badge }}
                </Badge>
              </Button>
            </div>
          </nav>
          
          <Separator class="my-4" />
          
          <!-- Quick Actions -->
          <div v-if="!isCollapsed" class="p-2">
            <h3 class="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Quick Actions
            </h3>
            <div class="space-y-1">
              <Button
                v-for="action in quickActions"
                :key="action.label"
                variant="ghost"
                class="w-full justify-start gap-3 h-8 text-sm"
              >
                <span>{{ action.icon }}</span>
                <span>{{ action.label }}</span>
              </Button>
            </div>
          </div>
          
          <!-- Sidebar Footer -->
          <div class="absolute bottom-4 left-2 right-2">
            <Card v-if="!isCollapsed" class="bg-muted/50">
              <CardContent class="p-3">
                <div class="text-xs text-muted-foreground text-center">
                  <p class="font-medium">Storage Used</p>
                  <div class="mt-1 bg-background rounded-full h-2">
                    <div class="bg-primary h-2 rounded-full" style="width: 65%"></div>
                  </div>
                  <p class="mt-1">6.5 GB of 10 GB</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>
        
        <!-- Main Content -->
        <main class="flex-1 p-6">
          <div class="text-center">
            <h2 class="text-2xl font-bold mb-4">Main Content Area</h2>
            <p class="text-muted-foreground">
              Current Page: {{ currentPath }}
            </p>
            <p class="text-sm text-muted-foreground mt-2">
              Sidebar {{ isCollapsed ? 'Collapsed' : 'Expanded' }}
            </p>
          </div>
        </main>
      </div>
    `
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Verify sidebar elements
    const dashboardItem = canvas.getByText('Dashboard')
    const mattersItem = canvas.getByText('Matters')
    const collapseButton = canvas.getByRole('button', { name: /←/ })
    
    expect(dashboardItem).toBeInTheDocument()
    expect(mattersItem).toBeInTheDocument()
    
    // Test sidebar collapse
    await userEvent.click(collapseButton)
    
    // Test navigation
    await userEvent.click(dashboardItem)
    expect(canvas.getByText('Current Page: /dashboard')).toBeInTheDocument()
  }
}

/**
 * Mobile navigation with drawer
 */
export const MobileNavigation: Story = {
  render: () => ({
    components: {
      Button,
      Badge,
      Avatar,
      AvatarFallback,
      Separator
    },
    setup() {
      const isMenuOpen = ref(false)
      const notifications = ref(5)
      
      const menuItems = ref([
        { label: 'Dashboard', icon: '📊', badge: null },
        { label: 'Matters', icon: '📋', badge: '12' },
        { label: 'Documents', icon: '📄', badge: null },
        { label: 'Clients', icon: '👥', badge: '3' },
        { label: 'Calendar', icon: '📅', badge: '2' },
        { label: 'Reports', icon: '📈', badge: null }
      ])
      
      return { isMenuOpen, notifications, menuItems }
    },
    template: `
      <div class="bg-background min-h-screen">
        <!-- Mobile Header -->
        <header class="border-b bg-card px-4 h-14 flex items-center justify-between">
          <!-- Left: Menu Button + Logo -->
          <div class="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              @click="isMenuOpen = !isMenuOpen"
              class="h-8 w-8"
            >
              ☰
            </Button>
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <span class="text-primary-foreground font-bold text-xs">A</span>
              </div>
              <span class="font-semibold text-sm">Aster</span>
            </div>
          </div>
          
          <!-- Right: Notifications + Avatar -->
          <div class="flex items-center gap-2">
            <Button variant="ghost" size="icon" class="relative h-8 w-8">
              🔔
              <Badge 
                variant="destructive" 
                class="absolute -top-1 -right-1 h-4 w-4 text-xs rounded-full p-0 flex items-center justify-center"
              >
                {{ notifications }}
              </Badge>
            </Button>
            <Avatar class="h-7 w-7">
              <AvatarFallback class="text-xs">JD</AvatarFallback>
            </Avatar>
          </div>
        </header>
        
        <!-- Mobile Menu Overlay -->
        <div 
          v-if="isMenuOpen" 
          class="fixed inset-0 z-50 bg-black/50"
          @click="isMenuOpen = false"
        >
          <!-- Sliding Menu -->
          <div 
            class="fixed left-0 top-0 h-full w-80 bg-card border-r transform transition-transform duration-300"
            @click.stop
          >
            <!-- Menu Header -->
            <div class="p-4 border-b">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <Avatar class="h-10 w-10">
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div>
                    <p class="font-medium text-sm">John Doe</p>
                    <p class="text-xs text-muted-foreground">Senior Lawyer</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  @click="isMenuOpen = false"
                  class="h-8 w-8"
                >
                  ✕
                </Button>
              </div>
            </div>
            
            <!-- Menu Items -->
            <nav class="p-2">
              <div 
                v-for="item in menuItems" 
                :key="item.label"
                class="mb-1"
              >
                <Button
                  variant="ghost"
                  class="w-full justify-start gap-3 h-12 text-sm"
                  @click="isMenuOpen = false"
                >
                  <span class="text-lg">{{ item.icon }}</span>
                  <span class="flex-1 text-left">{{ item.label }}</span>
                  <Badge 
                    v-if="item.badge" 
                    variant="secondary" 
                    class="text-xs"
                  >
                    {{ item.badge }}
                  </Badge>
                </Button>
              </div>
            </nav>
            
            <Separator class="my-4" />
            
            <!-- Settings Section -->
            <div class="p-2">
              <h3 class="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                Settings
              </h3>
              <Button variant="ghost" class="w-full justify-start gap-3 h-10 text-sm">
                ⚙️ <span>Preferences</span>
              </Button>
              <Button variant="ghost" class="w-full justify-start gap-3 h-10 text-sm">
                🔐 <span>Security</span>
              </Button>
              <Button variant="ghost" class="w-full justify-start gap-3 h-10 text-sm">
                📤 <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
        
        <!-- Page Content -->
        <main class="p-4">
          <div class="text-center py-12">
            <h2 class="text-xl font-bold mb-2">Mobile Layout</h2>
            <p class="text-muted-foreground text-sm">
              Tap the menu button to open navigation
            </p>
            <Button 
              variant="outline" 
              class="mt-4"
              @click="isMenuOpen = true"
            >
              Open Menu
            </Button>
          </div>
        </main>
      </div>
    `
  }),
  parameters: {
    viewport: { defaultViewport: 'mobile1' }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Test mobile menu functionality
    const menuButton = canvas.getAllByText('☰')[0]
    expect(menuButton).toBeInTheDocument()
    
    // Open menu
    await userEvent.click(menuButton)
    
    // Verify menu items appear
    const dashboardItem = canvas.getByText('Dashboard')
    const mattersItem = canvas.getByText('Matters')
    
    expect(dashboardItem).toBeInTheDocument()
    expect(mattersItem).toBeInTheDocument()
    
    // Close menu by clicking item
    await userEvent.click(dashboardItem)
  }
}

/**
 * Breadcrumb navigation
 */
export const BreadcrumbNavigation: Story = {
  render: () => ({
    components: {
      Button,
      Separator
    },
    setup() {
      const breadcrumbs = ref([
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Matters', href: '/matters' },
        { label: 'Contract Review', href: '/matters/123' },
        { label: 'Documents', href: null } // Current page
      ])
      
      return { breadcrumbs }
    },
    template: `
      <div class="bg-background p-6">
        <div class="space-y-6">
          <!-- Page Header with Breadcrumbs -->
          <div class="space-y-4">
            <!-- Breadcrumb Navigation -->
            <nav class="flex items-center space-x-1 text-sm text-muted-foreground">
              <template v-for="(crumb, index) in breadcrumbs" :key="index">
                <div class="flex items-center">
                  <Button
                    v-if="crumb.href"
                    variant="link"
                    class="h-auto p-0 text-sm text-muted-foreground hover:text-foreground"
                  >
                    {{ crumb.label }}
                  </Button>
                  <span 
                    v-else 
                    class="text-foreground font-medium"
                  >
                    {{ crumb.label }}
                  </span>
                  
                  <span 
                    v-if="index < breadcrumbs.length - 1" 
                    class="mx-2 text-muted-foreground"
                  >
                    /
                  </span>
                </div>
              </template>
            </nav>
            
            <!-- Page Title -->
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-2xl font-bold">Documents</h1>
                <p class="text-muted-foreground">
                  Manage documents for Contract Review matter
                </p>
              </div>
              <Button>Add Document</Button>
            </div>
          </div>
          
          <Separator />
          
          <!-- Alternative Breadcrumb Styles -->
          <div class="space-y-6">
            <h3 class="text-lg font-semibold">Alternative Breadcrumb Styles</h3>
            
            <!-- Chip Style Breadcrumbs -->
            <nav class="flex items-center gap-2">
              <div 
                v-for="(crumb, index) in breadcrumbs" 
                :key="'chip-' + index"
                class="flex items-center"
              >
                <div :class="[
                  'px-3 py-1 rounded-full text-xs font-medium',
                  crumb.href 
                    ? 'bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer' 
                    : 'bg-primary text-primary-foreground'
                ]">
                  {{ crumb.label }}
                </div>
                <span 
                  v-if="index < breadcrumbs.length - 1"
                  class="mx-2 text-muted-foreground"
                >
                  →
                </span>
              </div>
            </nav>
            
            <!-- Dropdown Style for Mobile -->
            <div class="md:hidden">
              <Button variant="outline" class="w-full justify-between">
                <span>Documents</span>
                <span>↓</span>
              </Button>
            </div>
          </div>
          
          <!-- Content Area -->
          <div class="border rounded-lg p-8 text-center bg-muted/30">
            <p class="text-muted-foreground">
              Page content goes here
            </p>
          </div>
        </div>
      </div>
    `
  })
}

/**
 * Footer with legal information
 */
export const ApplicationFooter: Story = {
  render: () => ({
    components: {
      Button,
      Separator
    },
    template: `
      <div class="bg-background">
        <!-- Main Content Area (for context) -->
        <div class="min-h-96 flex items-center justify-center bg-muted/30">
          <p class="text-muted-foreground">Main application content</p>
        </div>
        
        <!-- Footer -->
        <footer class="border-t bg-card">
          <div class="px-4 lg:px-6 py-8">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
              <!-- Company Info -->
              <div class="space-y-3">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 bg-primary rounded flex items-center justify-center">
                    <span class="text-primary-foreground font-bold text-xs">A</span>
                  </div>
                  <span class="font-semibold">Aster Management</span>
                </div>
                <p class="text-sm text-muted-foreground">
                  Comprehensive legal case management system for modern law firms.
                </p>
              </div>
              
              <!-- Quick Links -->
              <div class="space-y-3">
                <h4 class="font-semibold text-sm">Quick Links</h4>
                <div class="space-y-2">
                  <Button variant="link" class="h-auto p-0 text-sm justify-start">
                    Dashboard
                  </Button>
                  <Button variant="link" class="h-auto p-0 text-sm justify-start">
                    Create Matter
                  </Button>
                  <Button variant="link" class="h-auto p-0 text-sm justify-start">
                    Upload Document
                  </Button>
                  <Button variant="link" class="h-auto p-0 text-sm justify-start">
                    Reports
                  </Button>
                </div>
              </div>
              
              <!-- Support -->
              <div class="space-y-3">
                <h4 class="font-semibold text-sm">Support</h4>
                <div class="space-y-2">
                  <Button variant="link" class="h-auto p-0 text-sm justify-start">
                    Help Center
                  </Button>
                  <Button variant="link" class="h-auto p-0 text-sm justify-start">
                    Contact Support
                  </Button>
                  <Button variant="link" class="h-auto p-0 text-sm justify-start">
                    Training
                  </Button>
                  <Button variant="link" class="h-auto p-0 text-sm justify-start">
                    API Documentation
                  </Button>
                </div>
              </div>
              
              <!-- Legal -->
              <div class="space-y-3">
                <h4 class="font-semibold text-sm">Legal</h4>
                <div class="space-y-2">
                  <Button variant="link" class="h-auto p-0 text-sm justify-start">
                    Privacy Policy
                  </Button>
                  <Button variant="link" class="h-auto p-0 text-sm justify-start">
                    Terms of Service
                  </Button>
                  <Button variant="link" class="h-auto p-0 text-sm justify-start">
                    Security
                  </Button>
                  <Button variant="link" class="h-auto p-0 text-sm justify-start">
                    Compliance
                  </Button>
                </div>
              </div>
            </div>
            
            <Separator class="my-6" />
            
            <!-- Bottom Footer -->
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
              <div class="flex items-center gap-4">
                <p>© 2024 Aster Management. All rights reserved.</p>
                <span class="hidden sm:inline">|</span>
                <p class="hidden sm:inline">Version 2.1.0</p>
              </div>
              
              <div class="flex items-center gap-4">
                <span class="hidden sm:inline">Status:</span>
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>All systems operational</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    `
  })
}
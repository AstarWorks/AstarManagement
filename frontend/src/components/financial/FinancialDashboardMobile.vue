<!--
  Mobile-Optimized Financial Dashboard
  
  @description Mobile-first financial dashboard with pull-to-refresh,
  summary cards, and touch-friendly quick actions for expense management.
  
  @author Claude
  @created 2025-07-03
  @task T08_S14 - Mobile Optimization for Financial Features
-->

<template>
  <div class="financial-dashboard-mobile">
    <!-- Pull-to-refresh container -->
    <div 
      ref="containerRef"
      class="h-full overflow-auto"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <!-- Pull-to-refresh indicator -->
      <div 
        v-show="pullDistance > 0"
        class="pull-to-refresh-indicator"
        :class="{ 'is-refreshing': isRefreshing }"
        :style="{ transform: `translateY(${Math.min(pullDistance - 60, 40)}px)` }"
      >
        <div class="flex items-center justify-center py-3">
          <Loader2 
            v-if="isRefreshing" 
            class="w-5 h-5 animate-spin text-primary" 
          />
          <ArrowDown 
            v-else 
            class="w-5 h-5 text-muted-foreground transition-transform"
            :class="{ 'rotate-180': pullDistance > refreshThreshold }"
          />
          <span class="ml-2 text-sm text-muted-foreground">
            {{ pullDistance > refreshThreshold ? 'Release to refresh' : 'Pull to refresh' }}
          </span>
        </div>
      </div>

      <!-- Dashboard content -->
      <div class="dashboard-content" :style="{ transform: `translateY(${pullDistance}px)` }">
        <!-- Header with offline status -->
        <header class="sticky top-0 z-40 bg-background border-b px-4 py-3">
          <div class="flex items-center justify-between">
            <h1 class="text-xl font-bold">Financial Dashboard</h1>
            <div class="flex items-center gap-2">
              <!-- Offline indicator -->
              <div v-if="!isOnline" class="flex items-center gap-1 text-orange-600">
                <WifiOff class="w-4 h-4" />
                <span class="text-xs">Offline</span>
              </div>
              <!-- Sync status -->
              <div v-if="totalQueuedItems > 0" class="flex items-center gap-1 text-blue-600">
                <Clock class="w-4 h-4" />
                <span class="text-xs">{{ totalQueuedItems }} pending</span>
              </div>
              <Button variant="ghost" size="sm" @click="showNotifications = true">
                <Bell class="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        <!-- Summary cards -->
        <div class="p-4 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <!-- Total Expenses -->
            <Card class="p-4 text-center touch-friendly" @click="navigateToExpensesList">
              <div class="text-2xl font-bold text-green-600">
                ¥{{ formatCurrency(financialSummary.totalExpenses) }}
              </div>
              <div class="text-sm text-muted-foreground">Total Expenses</div>
              <div class="text-xs text-muted-foreground mt-1">
                {{ financialSummary.expenseCount }} expenses
              </div>
            </Card>

            <!-- Pending Approvals -->
            <Card class="p-4 text-center touch-friendly" @click="navigateToPending">
              <div class="text-2xl font-bold text-orange-600">
                {{ financialSummary.pendingCount }}
              </div>
              <div class="text-sm text-muted-foreground">Pending</div>
              <div class="text-xs text-muted-foreground mt-1">
                ¥{{ formatCurrency(financialSummary.pendingAmount) }}
              </div>
            </Card>

            <!-- This Month -->
            <Card class="p-4 text-center touch-friendly" @click="navigateToMonthly">
              <div class="text-2xl font-bold text-blue-600">
                ¥{{ formatCurrency(financialSummary.currentMonth) }}
              </div>
              <div class="text-sm text-muted-foreground">This Month</div>
              <div class="text-xs text-muted-foreground mt-1">
                {{ monthlyExpenseCount }} expenses
              </div>
            </Card>

            <!-- Billable Amount -->
            <Card class="p-4 text-center touch-friendly" @click="navigateToBillable">
              <div class="text-2xl font-bold text-purple-600">
                ¥{{ formatCurrency(financialSummary.billableAmount) }}
              </div>
              <div class="text-sm text-muted-foreground">Billable</div>
              <div class="text-xs text-muted-foreground mt-1">
                {{ financialSummary.billableCount }} expenses
              </div>
            </Card>
          </div>

          <!-- Quick actions -->
          <div class="mt-6">
            <h3 class="font-semibold mb-4">Quick Actions</h3>
            <div class="grid grid-cols-2 gap-4">
              <Button 
                size="lg" 
                class="h-16 flex-col gap-2 touch-friendly" 
                @click="navigateToExpenseForm"
              >
                <Plus class="w-6 h-6" />
                <span>New Expense</span>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                class="h-16 flex-col gap-2 touch-friendly" 
                @click="captureReceipt"
              >
                <Camera class="w-6 h-6" />
                <span>Scan Receipt</span>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                class="h-16 flex-col gap-2 touch-friendly" 
                @click="generateReport"
              >
                <FileSpreadsheet class="w-6 h-6" />
                <span>Export Report</span>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                class="h-16 flex-col gap-2 touch-friendly" 
                @click="navigateToSearch"
              >
                <Search class="w-6 h-6" />
                <span>Search</span>
              </Button>
            </div>
          </div>

          <!-- Recent expenses -->
          <div class="mt-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold">Recent Expenses</h3>
              <Button variant="ghost" size="sm" @click="navigateToExpensesList">
                View All
                <ChevronRight class="w-4 h-4 ml-1" />
              </Button>
            </div>
            
            <div class="space-y-2">
              <div
                v-for="expense in recentExpenses"
                :key="expense.id"
                class="expense-item touch-friendly"
                @click="viewExpense(expense)"
                @touchstart="handleExpenseTouch($event, expense)"
                @touchend="handleExpenseTouchEnd"
              >
                <div class="flex items-center p-3 bg-card rounded-lg border">
                  <div class="expense-icon">
                    <div class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                      <component :is="getCategoryIcon(expense.expenseType)" class="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium truncate">{{ expense.description }}</p>
                    <div class="flex items-center gap-2 mt-1">
                      <p class="text-sm text-muted-foreground">
                        {{ formatDate(expense.expenseDate) }}
                      </p>
                      <Badge :variant="getStatusVariant(expense.approvalStatus)" class="text-xs">
                        {{ expense.approvalStatus }}
                      </Badge>
                    </div>
                  </div>
                  <div class="text-right ml-3">
                    <p class="font-semibold">¥{{ formatCurrency(expense.amount) }}</p>
                    <p v-if="expense.billable" class="text-xs text-blue-600">Billable</p>
                  </div>
                </div>
              </div>
              
              <!-- Empty state -->
              <div v-if="recentExpenses.length === 0" class="text-center py-8">
                <Receipt class="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p class="text-muted-foreground">No expenses yet</p>
                <Button variant="outline" class="mt-2" @click="navigateToExpenseForm">
                  Create your first expense
                </Button>
              </div>
            </div>
          </div>

          <!-- Chart preview (mobile-optimized) -->
          <div v-if="showChart" class="mt-6">
            <h3 class="font-semibold mb-4">Expense Trends</h3>
            <Card class="p-4">
              <div class="chart-container h-48">
                <!-- Simplified mobile chart would go here -->
                <div class="flex items-center justify-center h-full text-muted-foreground">
                  <div class="text-center">
                    <TrendingUp class="w-8 h-8 mx-auto mb-2" />
                    <p class="text-sm">Chart view</p>
                    <p class="text-xs">Tap to view detailed analytics</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating action button -->
    <div class="fixed bottom-6 right-6 z-50">
      <Button 
        size="lg" 
        class="w-14 h-14 rounded-full shadow-lg touch-friendly"
        @click="navigateToExpenseForm"
      >
        <Plus class="w-6 h-6" />
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  ArrowDown,
  Bell,
  Camera,
  ChevronRight,
  Clock,
  FileSpreadsheet,
  Loader2,
  Plus,
  Receipt,
  Search,
  TrendingUp,
  WifiOff,
  Car,
  Utensils,
  Building,
  Scale,
  FileText,
  Copy,
  Mail,
  Phone,
  UserCheck,
  MoreHorizontal
} from 'lucide-vue-next'

import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'

import { useIsMobile } from '~/composables/useIsMobile'
import { useFinancialOfflineQueue } from '~/composables/useFinancialOfflineQueue'
import { useTouchGestures } from '~/composables/useTouchGestures'
import { useMobilePerformance } from '~/composables/useMobilePerformance'
import { useToast } from '~/composables/useToast'
import { useExpenses } from '~/composables/useExpenses'

import type { Expense, FinancialSummary } from '~/types/financial'

// Component Props
interface Props {
  showChart?: boolean
  refreshOnMount?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showChart: true,
  refreshOnMount: true
})

// Component Emits
const emit = defineEmits<{
  expenseClick: [expense: Expense]
  refresh: []
  navigate: [route: string]
}>()

// Composables
const { isMobile } = useIsMobile()
const { totalQueuedItems, syncFinancialData } = useFinancialOfflineQueue()
const { showToast } = useToast()
const { enableGpuAcceleration, throttle } = useMobilePerformance()

// Network status
const isOnline = ref(navigator.onLine)

// Pull-to-refresh state
const containerRef = ref<HTMLElement>()
const pullDistance = ref(0)
const isRefreshing = ref(false)
const refreshThreshold = 60
const maxPullDistance = 100

// Touch state
const touchStartY = ref(0)
const touchStartTime = ref(0)
const isAtTop = ref(true)

// Local state
const showNotifications = ref(false)
const recentExpenses = ref<Expense[]>([])
const financialSummary = ref<FinancialSummary>({
  totalExpenses: 0,
  expenseCount: 0,
  pendingCount: 0,
  pendingAmount: 0,
  currentMonth: 0,
  billableAmount: 0,
  billableCount: 0
})

// Computed properties
const monthlyExpenseCount = computed(() => {
  const currentMonth = new Date().getMonth()
  return recentExpenses.value.filter(expense => 
    new Date(expense.expenseDate).getMonth() === currentMonth
  ).length
})

// Expense categories with icons
const expenseCategories = {
  TRAVEL: Car,
  MEALS: Utensils,
  ACCOMMODATION: Building,
  COURT_FEES: Scale,
  FILING_FEES: FileText,
  COPYING: Copy,
  POSTAGE: Mail,
  TELEPHONE: Phone,
  EXPERT_WITNESS: UserCheck,
  OTHER: MoreHorizontal
}

// Methods
const getCategoryIcon = (expenseType: string) => {
  return expenseCategories[expenseType as keyof typeof expenseCategories] || MoreHorizontal
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'APPROVED': return 'default'
    case 'PENDING': return 'secondary'
    case 'REJECTED': return 'destructive'
    default: return 'outline'
  }
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ja-JP').format(amount)
}

const formatDate = (date: string | Date) => {
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'short',
    day: 'numeric'
  }).format(new Date(date))
}

// Pull-to-refresh handlers
const handleTouchStart = (e: TouchEvent) => {
  if (!containerRef.value) return
  
  touchStartY.value = e.touches[0].clientY
  touchStartTime.value = Date.now()
  isAtTop.value = containerRef.value.scrollTop === 0
}

const handleTouchMove = throttle((e: TouchEvent) => {
  if (!isAtTop.value || isRefreshing.value) return
  
  const currentY = e.touches[0].clientY
  const deltaY = currentY - touchStartY.value
  
  if (deltaY > 0 && containerRef.value?.scrollTop === 0) {
    // Prevent default scrolling when pulling down
    e.preventDefault()
    
    // Calculate pull distance with resistance
    const resistance = Math.max(0.3, 1 - (deltaY / 200))
    pullDistance.value = Math.min(deltaY * resistance, maxPullDistance)
    
    // Add haptic feedback at threshold
    if (pullDistance.value > refreshThreshold && 'vibrate' in navigator) {
      navigator.vibrate(25)
    }
  }
}, 16)

const handleTouchEnd = () => {
  if (pullDistance.value > refreshThreshold && !isRefreshing.value) {
    triggerRefresh()
  } else {
    // Animate back to 0
    const startDistance = pullDistance.value
    const duration = 200
    const startTime = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      pullDistance.value = startDistance * (1 - progress)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    animate()
  }
}

const triggerRefresh = async () => {
  if (isRefreshing.value) return
  
  isRefreshing.value = true
  
  try {
    // Sync offline data if available
    if (totalQueuedItems.value > 0) {
      await syncFinancialData()
    }
    
    // Refresh dashboard data
    await refreshDashboardData()
    
    showToast('Dashboard updated successfully', 'success')
    emit('refresh')
  } catch (error) {
    console.error('Failed to refresh dashboard:', error)
    showToast('Failed to refresh dashboard', 'error')
  } finally {
    // Animate pull indicator back
    setTimeout(() => {
      isRefreshing.value = false
      pullDistance.value = 0
    }, 500)
  }
}

// Expense interaction handlers
const handleExpenseTouch = (e: TouchEvent, expense: Expense) => {
  // Add visual feedback
  const target = e.currentTarget as HTMLElement
  target.style.transform = 'scale(0.98)'
  target.style.backgroundColor = 'hsl(var(--muted))'
}

const handleExpenseTouchEnd = (e: TouchEvent) => {
  const target = e.currentTarget as HTMLElement
  target.style.transform = ''
  target.style.backgroundColor = ''
}

const viewExpense = (expense: Expense) => {
  emit('expenseClick', expense)
  // Add haptic feedback
  if ('vibrate' in navigator) {
    navigator.vibrate(50)
  }
}

// Navigation methods
const navigateToExpenseForm = () => {
  emit('navigate', '/expenses/new')
}

const navigateToExpensesList = () => {
  emit('navigate', '/expenses')
}

const navigateToPending = () => {
  emit('navigate', '/expenses?status=pending')
}

const navigateToMonthly = () => {
  const currentMonth = new Date().toISOString().slice(0, 7)
  emit('navigate', `/expenses?month=${currentMonth}`)
}

const navigateToBillable = () => {
  emit('navigate', '/expenses?billable=true')
}

const navigateToSearch = () => {
  emit('navigate', '/expenses/search')
}

const captureReceipt = () => {
  emit('navigate', '/receipts/scan')
}

const generateReport = () => {
  emit('navigate', '/financial/reports')
}

// Data loading methods
const refreshDashboardData = async () => {
  try {
    // Load financial summary
    const summaryResponse = await $fetch<FinancialSummary>('/api/financial/summary')
    financialSummary.value = summaryResponse
    
    // Load recent expenses
    const expensesResponse = await $fetch<{ data: Expense[] }>('/api/expenses?limit=10&sort=date:desc')
    recentExpenses.value = expensesResponse.data || []
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
    throw error
  }
}

// Network status monitoring
const updateOnlineStatus = () => {
  isOnline.value = navigator.onLine
}

// Lifecycle
onMounted(async () => {
  // Optimize container for GPU acceleration
  if (containerRef.value) {
    enableGpuAcceleration(containerRef.value)
  }
  
  // Add network status listeners
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
  
  // Load initial data
  if (props.refreshOnMount) {
    try {
      await refreshDashboardData()
    } catch (error) {
      console.error('Failed to load initial dashboard data:', error)
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})
</script>

<style scoped>
.financial-dashboard-mobile {
  height: 100vh;
  background: hsl(var(--background));
  overflow: hidden;
}

.pull-to-refresh-indicator {
  position: absolute;
  top: -60px;
  left: 0;
  right: 0;
  z-index: 30;
  background: hsl(var(--background));
  border-bottom: 1px solid hsl(var(--border));
}

.pull-to-refresh-indicator.is-refreshing {
  animation: pulse 1.5s ease-in-out infinite;
}

.dashboard-content {
  min-height: 100%;
  transition: transform 0.2s ease-out;
}

.touch-friendly {
  min-height: 44px;
  min-width: 44px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.touch-friendly:active {
  transform: scale(0.98);
}

.expense-item {
  transition: all 0.2s ease;
}

.expense-item:active {
  transform: scale(0.98);
  background-color: hsl(var(--muted));
}

.expense-icon {
  flex-shrink: 0;
}

.chart-container {
  position: relative;
  width: 100%;
  background: hsl(var(--muted/50));
  border-radius: var(--radius);
  cursor: pointer;
}

/* iOS Safari specific optimizations */
@supports (-webkit-touch-callout: none) {
  .financial-dashboard-mobile {
    padding-bottom: env(safe-area-inset-bottom);
  }
  
  .fixed.bottom-6 {
    bottom: calc(1.5rem + env(safe-area-inset-bottom));
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .touch-friendly {
    border-width: 2px;
  }
  
  .expense-item {
    border-width: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .animate-spin {
    animation: none;
  }
  
  .transition-transform {
    transition: none;
  }
  
  .touch-friendly:active {
    transform: none;
  }
}

/* Dark mode optimizations */
@media (prefers-color-scheme: dark) {
  .pull-to-refresh-indicator {
    background: hsl(var(--background));
  }
}
</style>
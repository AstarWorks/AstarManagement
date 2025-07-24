<!--
  Approvals Management Page
  
  @description Dedicated page for expense approval workflow management.
  Provides comprehensive approval queue, statistics, and delegation tools.
  
  @author Claude
  @created 2025-07-03
  @task T07_S14 - Approval Workflow System
-->

<template>
  <div class="approvals-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Approval Management</h1>
        <p class="page-description">
          Review and process expense approval requests with workflow management
        </p>
      </div>
      
      <div class="header-stats" v-if="statistics">
        <div class="stat-card">
          <div class="stat-value">{{ statistics.queueStats.pending }}</div>
          <div class="stat-label">Pending</div>
        </div>
        <div class="stat-card urgent" v-if="statistics.queueStats.urgent > 0">
          <div class="stat-value">{{ statistics.queueStats.urgent }}</div>
          <div class="stat-label">Urgent</div>
        </div>
        <div class="stat-card overdue" v-if="statistics.queueStats.overdue > 0">
          <div class="stat-value">{{ statistics.queueStats.overdue }}</div>
          <div class="stat-label">Overdue</div>
        </div>
      </div>
    </div>

    <!-- Permission Check -->
    <div v-if="!canApprove" class="permission-notice">
      <Alert class="border-orange-500 bg-orange-50">
        <Icon name="AlertTriangle" class="h-4 w-4" />
        <AlertTitle>Access Restricted</AlertTitle>
        <AlertDescription>
          You don't have permission to access the approval workflow. 
          Contact your administrator if you believe this is an error.
        </AlertDescription>
      </Alert>
    </div>

    <!-- Main Approval Dashboard -->
    <div v-else class="approval-content">
      <ApprovalDashboard />
    </div>

    <!-- Quick Actions Sidebar (Desktop) -->
    <div v-if="canApprove" class="quick-actions-sidebar">
      <Card class="sidebar-card">
        <CardHeader>
          <CardTitle class="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
          <!-- Notification Summary -->
          <div v-if="unreadCount > 0" class="notification-summary">
            <div class="flex items-center gap-2 mb-2">
              <Icon name="Bell" class="w-4 h-4 text-primary" />
              <span class="text-sm font-medium">{{ unreadCount }} new notifications</span>
            </div>
            <Button variant="outline" size="sm" class="w-full" @click="viewNotifications">
              <Icon name="Eye" class="w-3 h-3 mr-1" />
              View All
            </Button>
          </div>

          <!-- Priority Actions -->
          <div v-if="statistics?.queueStats?.urgent && statistics.queueStats.urgent > 0" class="priority-actions">
            <div class="flex items-center gap-2 mb-2">
              <Icon name="Zap" class="w-4 h-4 text-destructive" />
              <span class="text-sm font-medium text-destructive">Urgent Items</span>
            </div>
            <Button variant="destructive" size="sm" class="w-full" @click="viewUrgentItems">
              <Icon name="AlertTriangle" class="w-3 h-3 mr-1" />
              Review {{ statistics?.queueStats?.urgent || 0 }} Urgent
            </Button>
          </div>

          <!-- Delegation Management -->
          <div class="delegation-actions">
            <div class="flex items-center gap-2 mb-2">
              <Icon name="UserCheck" class="w-4 h-4 text-muted-foreground" />
              <span class="text-sm font-medium">Delegation</span>
            </div>
            <div class="grid grid-cols-1 gap-2">
              <Button variant="outline" size="sm" @click="showDelegationSetup = true">
                <Icon name="Plus" class="w-3 h-3 mr-1" />
                Setup
              </Button>
              <Button variant="outline" size="sm" @click="viewDelegations">
                <Icon name="List" class="w-3 h-3 mr-1" />
                Manage
              </Button>
            </div>
          </div>

          <!-- Export and Reports -->
          <div class="report-actions">
            <div class="flex items-center gap-2 mb-2">
              <Icon name="Download" class="w-4 h-4 text-muted-foreground" />
              <span class="text-sm font-medium">Reports</span>
            </div>
            <div class="grid grid-cols-1 gap-2">
              <Button variant="outline" size="sm" @click="exportApprovalReport">
                <Icon name="FileSpreadsheet" class="w-3 h-3 mr-1" />
                Export
              </Button>
              <Button variant="outline" size="sm" @click="viewStatistics">
                <Icon name="BarChart3" class="w-3 h-3 mr-1" />
                Analytics
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Performance Metrics -->
      <Card class="sidebar-card" v-if="statistics">
        <CardHeader>
          <CardTitle class="text-base">Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="metrics-grid">
            <div class="metric-item">
              <div class="metric-value">{{ statistics.approvalStats.approvalRate.toFixed(1) }}%</div>
              <div class="metric-label">Approval Rate</div>
            </div>
            <div class="metric-item">
              <div class="metric-value">{{ statistics.approvalStats.averageProcessingTime.toFixed(1) }}h</div>
              <div class="metric-label">Avg. Time</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Delegation Setup Modal -->
    <DelegationSetupModal
      v-if="showDelegationSetup"
      @close="showDelegationSetup = false"
      @created="handleDelegationCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useApprovalWorkflow, useApprovalStatisticsQuery } from '~/composables/useApprovals'
import { useToast } from '~/composables/useToast'

// Meta
definePageMeta({
  title: 'Approval Management',
  description: 'Manage expense approval workflow',
  layout: 'dashboard',
  middleware: ['auth', 'approval-access']
})

// Composables
const authStore = useAuthStore()
const { showToast } = useToast()

// User Info
const user = computed(() => authStore.user)
const userId = computed(() => user.value?.id || '')

// Approval Workflow Data
const {
  permissions,
  notifications,
  unreadCount
} = useApprovalWorkflow(userId.value)

// Statistics data
const { data: statistics } = useApprovalStatisticsQuery()

// Local State
const showDelegationSetup = ref(false)

// Permissions
const canApprove = computed(() => {
  return permissions.value?.canApprove || false
})

// Event Handlers
const viewNotifications = () => {
  // Navigate to notifications page or show modal
  navigateTo('/notifications')
}

const viewUrgentItems = () => {
  // Filter dashboard to show only urgent items
  // This would be implemented by emitting an event to the dashboard
  console.log('Filtering to urgent items')
}

const viewDelegations = () => {
  // Navigate to delegation management
  navigateTo('/approvals/delegations')
}

const viewStatistics = () => {
  // Navigate to detailed statistics page
  navigateTo('/approvals/statistics')
}

const exportApprovalReport = async () => {
  try {
    // Export approval report
    const response = await $fetch<{ downloadUrl: string }>('/api/approvals/export', {
      method: 'POST',
      body: {
        format: 'csv',
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          end: new Date()
        }
      }
    })
    
    // Download the file
    const link = document.createElement('a')
    link.href = response.downloadUrl
    link.download = `approval-report-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    
    showToast('Report exported successfully', 'success')
  } catch (error) {
    showToast('Failed to export report', 'error')
    console.error('Export error:', error)
  }
}

const handleDelegationCreated = () => {
  showDelegationSetup.value = false
  showToast('Delegation created successfully', 'success')
}

// Provide approvals context to child components
provide('approvals-context', {
  permissions,
  statistics,
  userId
})
</script>

<style scoped>
.approvals-page {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 1.5rem;
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid hsl(var(--border));
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
}

.page-description {
  color: hsl(var(--muted-foreground));
  margin: 0;
}

.header-stats {
  display: flex;
  gap: 1rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem 1rem;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  min-width: 80px;
}

.stat-card.urgent {
  border-color: hsl(var(--destructive));
  background: hsl(var(--destructive) / 0.05);
}

.stat-card.overdue {
  border-color: hsl(var(--orange-500));
  background: hsl(var(--orange-500) / 0.05);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: hsl(var(--foreground));
}

.stat-label {
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.permission-notice {
  grid-column: 1 / -1;
  margin: 2rem 0;
}

.approval-content {
  grid-column: 1;
  min-height: 600px;
}

.quick-actions-sidebar {
  grid-column: 2;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: fit-content;
  position: sticky;
  top: 1rem;
}

.sidebar-card {
  background: hsl(var(--card));
}

.notification-summary {
  padding: 0.75rem;
  background: hsl(var(--primary) / 0.05);
  border: 1px solid hsl(var(--primary) / 0.2);
  border-radius: var(--radius);
}

.priority-actions {
  padding: 0.75rem;
  background: hsl(var(--destructive) / 0.05);
  border: 1px solid hsl(var(--destructive) / 0.2);
  border-radius: var(--radius);
}

.delegation-actions, .report-actions {
  padding: 0.75rem;
  background: hsl(var(--muted) / 0.3);
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.metric-item {
  text-align: center;
}

.metric-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.metric-label {
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
  margin-top: 0.25rem;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .approvals-page {
    grid-template-columns: 1fr;
  }
  
  .quick-actions-sidebar {
    grid-column: 1;
    position: static;
    grid-row: 3;
  }
  
  .approval-content {
    grid-column: 1;
    grid-row: 2;
  }
}

@media (max-width: 768px) {
  .approvals-page {
    padding: 0.5rem;
    gap: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-stats {
    justify-content: center;
  }
  
  .quick-actions-sidebar {
    display: none; /* Hide sidebar on mobile */
  }
}
</style>
<template>
  <div class="matter-overview-tab">
    <!-- Overview Header -->
    <div class="mb-6">
      <h3 class="text-lg font-semibold mb-2">Matter Overview</h3>
      <p class="text-muted-foreground">
        Comprehensive view of matter details, key information, and current status.
      </p>
    </div>

    <!-- Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Basic Information -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base flex items-center">
            <FileText class="w-4 h-4 mr-2" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-3">
            <div>
              <Label class="text-xs text-muted-foreground">Title</Label>
              <p class="font-medium">{{ matter?.title }}</p>
            </div>
            <div>
              <Label class="text-xs text-muted-foreground">Case Number</Label>
              <p class="font-medium">{{ matter?.caseNumber }}</p>
            </div>
            <div>
              <Label class="text-xs text-muted-foreground">Matter Type</Label>
              <Badge variant="outline">{{ matter?.matterType }}</Badge>
            </div>
            <div>
              <Label class="text-xs text-muted-foreground">Description</Label>
              <p class="text-sm">{{ matter?.description || 'No description provided' }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Status & Timeline -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base flex items-center">
            <Clock class="w-4 h-4 mr-2" />
            Status & Timeline
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-3">
            <div>
              <Label class="text-xs text-muted-foreground">Current Status</Label>
              <div class="flex items-center gap-2 mt-1">
                <Badge :variant="getStatusVariant(matter?.status)">
                  {{ formatStatus(matter?.status) }}
                </Badge>
                <span class="text-xs text-muted-foreground">
                  Updated {{ formatRelativeTime(matter?.updatedAt) }}
                </span>
              </div>
            </div>
            <div>
              <Label class="text-xs text-muted-foreground">Priority</Label>
              <Badge :variant="getPriorityVariant(matter?.priority)">
                {{ formatPriority(matter?.priority) }}
              </Badge>
            </div>
            <div>
              <Label class="text-xs text-muted-foreground">Created</Label>
              <p class="text-sm">{{ formatDate(matter?.createdAt) }}</p>
            </div>
            <div v-if="matter?.dueDate">
              <Label class="text-xs text-muted-foreground">Due Date</Label>
              <p class="text-sm" :class="isDueSoon(matter.dueDate) ? 'text-destructive font-medium' : ''">
                {{ formatDate(matter.dueDate) }}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Key Metrics -->
    <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent class="p-4 text-center">
          <div class="text-2xl font-bold">{{ matter?.taskCount || 0 }}</div>
          <div class="text-xs text-muted-foreground">Total Tasks</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4 text-center">
          <div class="text-2xl font-bold">{{ matter?.documentCount || 0 }}</div>
          <div class="text-xs text-muted-foreground">Documents</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4 text-center">
          <div class="text-2xl font-bold">{{ matter?.progressPercentage || 0 }}%</div>
          <div class="text-xs text-muted-foreground">Complete</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4 text-center">
          <div class="text-2xl font-bold">{{ formatCurrency(matter?.budget || 0) }}</div>
          <div class="text-xs text-muted-foreground">Budget</div>
        </CardContent>
      </Card>
    </div>

    <!-- Recent Activity -->
    <Card class="mt-6">
      <CardHeader>
        <CardTitle class="text-base flex items-center">
          <Activity class="w-4 h-4 mr-2" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-3">
          <div class="flex items-start gap-3 pb-3 border-b border-border last:border-0">
            <div class="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
            <div class="space-y-1 flex-1">
              <p class="text-sm">Status updated to {{ formatStatus(matter?.status) }}</p>
              <p class="text-xs text-muted-foreground">2 hours ago by {{ matter?.assignedLawyer }}</p>
            </div>
          </div>
          <div class="flex items-start gap-3 pb-3 border-b border-border last:border-0">
            <div class="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
            <div class="space-y-1 flex-1">
              <p class="text-sm">New document uploaded: Contract Amendment.pdf</p>
              <p class="text-xs text-muted-foreground">1 day ago by {{ matter?.assignedClerk }}</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0"></div>
            <div class="space-y-1 flex-1">
              <p class="text-sm">Meeting scheduled with {{ matter?.clientName }}</p>
              <p class="text-xs text-muted-foreground">3 days ago by {{ matter?.assignedLawyer }}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { FileText, Clock, Activity } from 'lucide-vue-next'

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Label } from '~/components/ui/label'

// Types
import type { Matter } from '~/types/matter'

interface Props {
  matter?: Matter | null
}

const props = defineProps<Props>()

// Utility functions
const formatStatus = (status?: string) => {
  if (!status) return ''
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const formatPriority = (priority?: string) => {
  if (!priority) return ''
  return priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase()
}

const formatDate = (date?: string | Date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatRelativeTime = (date?: string | Date) => {
  if (!date) return ''
  const now = new Date()
  const target = new Date(date)
  const diffMs = now.getTime() - target.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return `${Math.floor(diffDays / 30)} months ago`
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY'
  }).format(amount)
}

const getStatusVariant = (status?: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (!status) return 'secondary'
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'INTAKE': 'secondary',
    'INITIAL_REVIEW': 'secondary',
    'IN_PROGRESS': 'default',
    'REVIEW': 'outline',
    'WAITING_CLIENT': 'outline',
    'READY_FILING': 'default',
    'CLOSED': 'secondary'
  }
  return variants[status] || 'secondary'
}

const getPriorityVariant = (priority?: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (!priority) return 'secondary'
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'LOW': 'secondary',
    'MEDIUM': 'outline',
    'HIGH': 'destructive',
    'URGENT': 'destructive'
  }
  return variants[priority] || 'secondary'
}

const isDueSoon = (dueDate: string | Date) => {
  const due = new Date(dueDate)
  const now = new Date()
  const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays <= 7 && diffDays >= 0
}
</script>

<style scoped>
.matter-overview-tab {
  @apply space-y-6;
}
</style>
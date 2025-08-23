<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">{{ $t('modules.dashboard.title') }}</h1>
        <p class="text-muted-foreground mt-1">{{ $t('modules.dashboard.subtitle') }}</p>
      </div>
      <Button @click="createNewCase">
        <Icon name="lucide:plus" class="w-4 h-4 mr-2"/>
        {{ $t('modules.dashboard.sections.quickActions.newMatter') }}
      </Button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card
          v-for="stat in dashboardStats"
          :key="stat.key"
          class="transition-all duration-200 hover:shadow-md"
      >
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">{{ $t(stat.labelKey) }}</CardTitle>
          <Icon :name="stat.icon" class="w-4 h-4 text-muted-foreground"/>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ formatStatValue(stat) }}</div>
          <p class="text-xs text-muted-foreground">
            <span
                :class="stat.change.startsWith('+') ? 'text-green-600' : stat.change.startsWith('-') ? 'text-red-600' : 'text-gray-600'">
            {{ stat.change }}
          </span>
          </p>
        </CardContent>
      </Card>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{{ $t('modules.dashboard.sections.quickActions.title') }}</CardTitle>
          <CardDescription>{{ $t('foundation.actions.selection.select') }}</CardDescription>
        </CardHeader>
        <CardContent class="grid grid-cols-2 gap-4">
          <Button
              v-for="action in quickActions"
              :key="action.key"
              variant="outline"
              class="h-20 flex-col transition-all duration-200 hover:bg-muted/50"
              @click="handleQuickAction(action.action)"
          >
            <Icon :name="action.icon" class="w-6 h-6 mb-2"/>
            {{ $t(action.labelKey) }}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{{ $t('modules.dashboard.sections.recentMatters.title') }}</CardTitle>
          <CardDescription>{{ $t('foundation.actions.ui.more') }}</CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="isLoadingActivity" class="space-y-4">
            <Skeleton
                v-for="i in 3"
                :key="i"
                class="h-12 w-full"
            />
          </div>
          <div v-else-if="recentActivities.length === 0" class="text-center py-8">
            <Icon name="lucide:inbox" class="h-8 w-8 text-muted-foreground mx-auto mb-2"/>
            <p class="text-sm text-muted-foreground">{{ $t('foundation.table.states.empty.description') }}</p>
          </div>
          <div v-else class="space-y-4">
            <div
                v-for="activity in recentActivities"
                :key="activity.id"
                class="flex items-start gap-3"
            >
              <div
                  class="w-2 h-2 rounded-full mt-2"
                  :class="getActivityColor(activity.type)"
              />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{{ activity.title }}</p>
                <p class="text-xs text-muted-foreground">
                  {{ formatActivityInfo(activity) }}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import {formatRelative} from 'date-fns'
import {ja} from 'date-fns/locale'
import {Skeleton} from '~/foundation/components/ui/skeleton'
import {useDashboardData} from '~/modules/dashboard/composables/useDashboardData'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "~/foundation/components/ui/card";
import {Button} from "~/foundation/components/ui/button";

// Page metadata
definePageMeta({
  title: 'dashboard.title',
})

// Types
interface IDashboardStat {
  key: string
  labelKey: string
  icon: string
  value: number
  change: string
  format?: 'number' | 'currency'
}

interface IQuickAction {
  key: string
  labelKey: string
  icon: string
  action: string
}

interface IActivity {
  id: string
  type: 'case' | 'document' | 'deadline' | 'client'
  title: string
  subtitle: string
  timestamp: Date
}

// Composables
const router = useRouter()

// Dashboard data composable
const {getDashboardData, refreshDashboard} = useDashboardData()

// Get dashboard data
const {data: dashboardData, pending: isLoadingActivity} = getDashboardData()

// Computed properties for stats and activities
const dashboardStats = computed(() => dashboardData.value?.stats || [])
const recentActivities = computed(() => dashboardData.value?.recentActivities || [])

// Configuration for quick actions
const quickActions: IQuickAction[] = [
  {
    key: 'newCase',
    labelKey: 'modules.dashboard.sections.quickActions.newMatter',
    icon: 'lucide:plus',
    action: 'newCase'
  },
  {
    key: 'newClient',
    labelKey: 'modules.dashboard.sections.quickActions.newClient',
    icon: 'lucide:user-plus',
    action: 'newClient'
  },
  {
    key: 'createDocument',
    labelKey: 'modules.dashboard.sections.quickActions.createDocument',
    icon: 'lucide:file-plus',
    action: 'createDocument'
  },
  {
    key: 'addExpense',
    labelKey: 'modules.dashboard.sections.quickActions.addExpense',
    icon: 'lucide:receipt',
    action: 'addExpense'
  }
]

// Utility functions
const {locale, n} = useI18n()

const formatStatValue = (stat: IDashboardStat): string => {
  if (stat.format === 'currency') {
    return n(stat.value, 'currency')
  }
  return new Intl.NumberFormat(locale.value).format(stat.value)
}

const formatRelativeTime = (timestamp: Date): string => {
  return formatRelative(timestamp, new Date(), {locale: ja})
}

const formatActivityInfo = (activity: IActivity): string => {
  return `${activity.subtitle} - ${formatRelativeTime(activity.timestamp)}`
}

const getActivityColor = (type: IActivity['type']): string => {
  const colors = {
    case: 'bg-blue-500',
    document: 'bg-green-500',
    deadline: 'bg-orange-500',
    client: 'bg-purple-500'
  }
  return colors[type] || 'bg-gray-500'
}

// Event handlers
const createNewCase = () => {
  router.push('/cases/new')
}

const handleQuickAction = (action: string) => {
  const actions: Record<string, () => void> = {
    newCase: () => router.push('/cases/new'),
    newClient: () => router.push('/clients/new'),
    createDocument: () => router.push('/documents/upload'),
    addExpense: () => router.push('/expenses/new')
  }

  const handler = actions[action]
  if (handler) {
    handler()
  }
}

// Initialize dashboard data
onMounted(() => {
  refreshDashboard()
})
</script>
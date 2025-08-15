<template>
  <div class="expense-reports-page">
    <!-- Breadcrumb -->
    <Breadcrumb class="mb-6">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink :as="NuxtLink" to="/expenses">
            {{ t('expense.navigation.title') }}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>
            {{ t('expense.reports.title') }}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>

    <!-- Page Header -->
    <div class="page-header mb-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 class="text-2xl font-bold">{{ t('expense.reports.title') }}</h1>
        <Button :disabled="exporting" @click="exportReport">
          <Icon v-if="exporting" name="lucide:loader-2" class="w-4 h-4 mr-2 animate-spin" />
          <Icon v-else name="lucide:download" class="w-4 h-4 mr-2" />
          {{ t('expense.reports.actions.export') }}
        </Button>
      </div>
    </div>

    <!-- Report Filters -->
    <Card class="mb-6">
      <CardHeader>
        <CardTitle>{{ t('expense.reports.filters.title') }}</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Period Filter -->
          <div>
            <Label for="period">{{ t('expense.reports.filters.period') }}</Label>
            <Select v-model="filters.period" @update:model-value="handleFilterChange">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">{{ t('expense.reports.periods.month') }}</SelectItem>
                <SelectItem value="quarter">{{ t('expense.reports.periods.quarter') }}</SelectItem>
                <SelectItem value="year">{{ t('expense.reports.periods.year') }}</SelectItem>
                <SelectItem value="custom">{{ t('expense.reports.periods.custom') }}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Custom Date Range -->
          <template v-if="filters.period === 'custom'">
            <div>
              <Label for="startDate">{{ t('expense.reports.filters.startDate') }}</Label>
              <Input 
                id="startDate"
                v-model="filters.startDate" 
                type="date"
                @change="handleFilterChange"
              />
            </div>
            <div>
              <Label for="endDate">{{ t('expense.reports.filters.endDate') }}</Label>
              <Input 
                id="endDate"
                v-model="filters.endDate" 
                type="date"
                @change="handleFilterChange"
              />
            </div>
          </template>

          <!-- Group By -->
          <div>
            <Label for="groupBy">{{ t('expense.reports.filters.groupBy') }}</Label>
            <Select v-model="filters.groupBy" @update:model-value="handleFilterChange">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="category">{{ t('expense.reports.groupBy.category') }}</SelectItem>
                <SelectItem value="case">{{ t('expense.reports.groupBy.case') }}</SelectItem>
                <SelectItem value="user">{{ t('expense.reports.groupBy.user') }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">
            {{ t('expense.reports.summary.totalIncome') }}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-2xl font-bold text-green-600">
            {{ formatCurrency(summary.totalIncome) }}
          </p>
          <p class="text-xs text-muted-foreground mt-1">
            <span :class="summary.incomeChange >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ summary.incomeChange >= 0 ? '+' : '' }}{{ summary.incomeChange }}%
            </span>
            {{ t('expense.reports.summary.fromLastPeriod') }}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">
            {{ t('expense.reports.summary.totalExpense') }}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-2xl font-bold text-red-600">
            {{ formatCurrency(summary.totalExpense) }}
          </p>
          <p class="text-xs text-muted-foreground mt-1">
            <span :class="summary.expenseChange >= 0 ? 'text-red-600' : 'text-green-600'">
              {{ summary.expenseChange >= 0 ? '+' : '' }}{{ summary.expenseChange }}%
            </span>
            {{ t('expense.reports.summary.fromLastPeriod') }}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">
            {{ t('expense.reports.summary.balance') }}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-2xl font-bold" :class="summary.balance >= 0 ? 'text-green-600' : 'text-red-600'">
            {{ formatCurrency(summary.balance) }}
          </p>
          <p class="text-xs text-muted-foreground mt-1">
            {{ t('expense.reports.summary.netAmount') }}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">
            {{ t('expense.reports.summary.transactionCount') }}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-2xl font-bold">
            {{ summary.count }}
          </p>
          <p class="text-xs text-muted-foreground mt-1">
            {{ t('expense.reports.summary.transactions') }}
          </p>
        </CardContent>
      </Card>
    </div>

    <!-- Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- Pie Chart -->
      <Card>
        <CardHeader>
          <CardTitle>{{ t('expense.reports.charts.breakdown') }}</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="h-[300px] flex items-center justify-center">
            <!-- Placeholder for chart -->
            <div class="text-center text-muted-foreground">
              <Icon name="lucide:pie-chart" class="w-16 h-16 mx-auto mb-4" />
              <p>{{ t('expense.reports.charts.pieChart') }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Bar Chart -->
      <Card>
        <CardHeader>
          <CardTitle>{{ t('expense.reports.charts.trend') }}</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="h-[300px] flex items-center justify-center">
            <!-- Placeholder for chart -->
            <div class="text-center text-muted-foreground">
              <Icon name="lucide:bar-chart-3" class="w-16 h-16 mx-auto mb-4" />
              <p>{{ t('expense.reports.charts.barChart') }}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Detailed Table -->
    <Card>
      <CardHeader>
        <CardTitle>{{ t('expense.reports.table.title') }}</CardTitle>
      </CardHeader>
      <CardContent>
        <div v-if="loading" class="flex justify-center py-8">
          <Icon name="lucide:loader-2" class="w-8 h-8 animate-spin text-primary" />
        </div>
        
        <div v-else-if="tableData.length === 0" class="text-center py-8 text-muted-foreground">
          {{ t('expense.reports.table.noData') }}
        </div>
        
        <div v-else class="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{{ getGroupByLabel() }}</TableHead>
                <TableHead class="text-right">{{ t('expense.reports.table.income') }}</TableHead>
                <TableHead class="text-right">{{ t('expense.reports.table.expense') }}</TableHead>
                <TableHead class="text-right">{{ t('expense.reports.table.balance') }}</TableHead>
                <TableHead class="text-right">{{ t('expense.reports.table.count') }}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="row in tableData" :key="row.name">
                <TableCell class="font-medium">{{ row.name }}</TableCell>
                <TableCell class="text-right text-green-600">
                  {{ formatCurrency(row.income) }}
                </TableCell>
                <TableCell class="text-right text-red-600">
                  {{ formatCurrency(row.expense) }}
                </TableCell>
                <TableCell class="text-right" :class="row.balance >= 0 ? 'text-green-600' : 'text-red-600'">
                  {{ formatCurrency(row.balance) }}
                </TableCell>
                <TableCell class="text-right">{{ row.count }}</TableCell>
              </TableRow>
              <!-- Total Row -->
              <TableRow class="font-bold border-t-2">
                <TableCell>{{ t('expense.reports.table.total') }}</TableCell>
                <TableCell class="text-right text-green-600">
                  {{ formatCurrency(summary.totalIncome) }}
                </TableCell>
                <TableCell class="text-right text-red-600">
                  {{ formatCurrency(summary.totalExpense) }}
                </TableCell>
                <TableCell class="text-right" :class="summary.balance >= 0 ? 'text-green-600' : 'text-red-600'">
                  {{ formatCurrency(summary.balance) }}
                </TableCell>
                <TableCell class="text-right">{{ summary.count }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@ui/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { Button } from '@ui/button/index'
import { Input } from '@ui/input/index'
import { Label } from '@ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ui/table'
import { Icon } from '#components'

import authMiddleware from '~/infrastructure/middleware/auth'

defineOptions({
  name: 'ExpenseReports'
})

// Meta
definePageMeta({
  title: 'expense.reports.title',
  middleware: [authMiddleware]
})

// Composables
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const NuxtLink = resolveComponent('NuxtLink')

// State
const loading = ref(false)
const exporting = ref(false)

// Filters
const filters = ref({
  period: 'month',
  startDate: '',
  endDate: '',
  groupBy: 'category'
})

// Report data
const summary = ref({
  totalIncome: 250000,
  totalExpense: 180000,
  balance: 70000,
  count: 42,
  incomeChange: 12.5,
  expenseChange: -5.2
})

const tableData = ref([
  { name: '交通費', income: 0, expense: 45000, balance: -45000, count: 12 },
  { name: '飲食費', income: 0, expense: 32000, balance: -32000, count: 8 },
  { name: '事務用品', income: 0, expense: 18000, balance: -18000, count: 5 },
  { name: '通信費', income: 0, expense: 15000, balance: -15000, count: 4 },
  { name: '売上', income: 250000, expense: 0, balance: 250000, count: 10 },
  { name: 'その他', income: 0, expense: 70000, balance: -70000, count: 3 }
])

// Methods
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY'
  }).format(amount)
}

const getGroupByLabel = (): string => {
  switch (filters.value.groupBy) {
    case 'category':
      return t('expense.reports.table.category')
    case 'case':
      return t('expense.reports.table.case')
    case 'user':
      return t('expense.reports.table.user')
    default:
      return ''
  }
}

const handleFilterChange = () => {
  loadReportData()
}

const loadReportData = async () => {
  loading.value = true
  
  try {
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Update URL with filter params
    const query: Record<string, string> = {
      period: filters.value.period,
      group_by: filters.value.groupBy
    }
    
    if (filters.value.period === 'custom') {
      query.start_date = filters.value.startDate
      query.end_date = filters.value.endDate
    }
    
    router.push({ query })
  } catch (error) {
    console.error('Failed to load report data:', error)
  } finally {
    loading.value = false
  }
}

const exportReport = async () => {
  exporting.value = true
  
  try {
    // Mock export
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // In real implementation, this would download a file
    console.log('Exporting report...')
  } catch (error) {
    console.error('Failed to export report:', error)
  } finally {
    exporting.value = false
  }
}

// Initialize filters from query params
onMounted(() => {
  if (route.query.period) {
    filters.value.period = route.query.period as string
  }
  if (route.query.group_by) {
    filters.value.groupBy = route.query.group_by as string
  }
  if (route.query.start_date) {
    filters.value.startDate = route.query.start_date as string
  }
  if (route.query.end_date) {
    filters.value.endDate = route.query.end_date as string
  }
  
  loadReportData()
})

// SEO
useSeoMeta({
  title: t('expense.reports.title'),
  description: t('expense.reports.description')
})
</script>

<style scoped>
.expense-reports-page {
  @apply container mx-auto px-4 py-6;
}

@media (max-width: 640px) {
  .expense-reports-page {
    @apply px-2 py-4;
  }
}
</style>
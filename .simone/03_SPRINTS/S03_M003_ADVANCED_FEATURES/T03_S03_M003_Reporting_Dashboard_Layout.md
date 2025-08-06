---
task_id: T03_S03_M003
title: Reporting Dashboard Layout for Expense Analytics
status: pending
estimated_hours: 7
actual_hours: null
assigned_to: Claude
dependencies: ["T05_S02_M003_Edit_Expense_Functionality"]
complexity: Medium
updated: null
completed: null
---

# T03_S03_M003: Reporting Dashboard Layout for Expense Analytics

## Description
Create a comprehensive reporting dashboard layout for expense analytics in the legal practice management system. This includes metric cards for key statistics, interactive navigation and filters, responsive layout system, and chart placeholders for future data visualization. The dashboard will provide attorneys and practice managers with insights into expense patterns, budget tracking, and financial performance metrics.

## Acceptance Criteria
- [ ] Create responsive dashboard page with card-based layout
- [ ] Implement metric cards for key expense statistics
- [ ] Build comprehensive filter system for date ranges and categories
- [ ] Create navigation structure for different report types
- [ ] Design chart placeholder components for future implementation
- [ ] Add export functionality for dashboard data
- [ ] Implement responsive design for mobile and tablet views
- [ ] Create loading states and skeleton components
- [ ] Add empty states for no-data scenarios
- [ ] Integrate with existing expense data and routing

## Technical Details

### 1. Dashboard Page Layout

**Location**: `frontend/app/pages/expenses/reports/index.vue`

**Page Structure**:
```vue
<template>
  <div class="expense-reports-page">
    <div class="page-header">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/expenses">
              {{ $t('expense.breadcrumb.expenses') }}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{{ $t('expense.reports.title') }}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div class="page-title-section">
        <h1 class="page-title">{{ $t('expense.reports.title') }}</h1>
        <p class="page-description">{{ $t('expense.reports.description') }}</p>
      </div>
      
      <div class="page-actions">
        <ReportsExportButton 
          :filters="currentFilters"
          :loading="isExporting"
          @export="handleExport"
        />
        <Button variant="outline" @click="openFilterDialog">
          <Icon name="filter" />
          {{ $t('expense.reports.filters') }}
        </Button>
      </div>
    </div>
    
    <div class="dashboard-content">
      <div class="filters-section">
        <ReportsFilters 
          v-model="currentFilters"
          @update="handleFiltersUpdate"
        />
      </div>
      
      <div class="metrics-grid">
        <MetricCard
          v-for="metric in metrics"
          :key="metric.id"
          :metric="metric"
          :loading="isLoading"
        />
      </div>
      
      <div class="charts-grid">
        <ChartCard
          v-for="chart in charts"
          :key="chart.id"
          :chart="chart"
          :data="chartData[chart.id]"
          :loading="isLoading"
        />
      </div>
      
      <div class="detailed-reports-section">
        <DetailedReportsTable 
          :data="detailedData"
          :filters="currentFilters"
          :loading="isLoading"
        />
      </div>
    </div>
  </div>
</template>
```

**Composable for Dashboard Logic**:
```typescript
// frontend/app/composables/useExpenseReports.ts
export const useExpenseReports = () => {
  const isLoading = ref(false)
  const isExporting = ref(false)
  const currentFilters = ref<ReportFilters>({
    dateRange: {
      startDate: startOfMonth(new Date()),
      endDate: endOfMonth(new Date())
    },
    categories: [],
    cases: [],
    attorneys: []
  })
  
  const metrics = computed(() => [
    {
      id: 'total-expenses',
      title: 'expense.reports.metrics.totalExpenses',
      value: formatCurrency(reportData.value?.totalExpenses || 0),
      change: reportData.value?.totalExpensesChange || 0,
      icon: 'credit-card',
      trend: 'up'
    },
    {
      id: 'monthly-average',
      title: 'expense.reports.metrics.monthlyAverage',
      value: formatCurrency(reportData.value?.monthlyAverage || 0),
      change: reportData.value?.monthlyAverageChange || 0,
      icon: 'trending-up',
      trend: 'up'
    },
    {
      id: 'expense-count',
      title: 'expense.reports.metrics.expenseCount',
      value: reportData.value?.expenseCount || 0,
      change: reportData.value?.expenseCountChange || 0,
      icon: 'receipt',
      trend: 'neutral'
    },
    {
      id: 'top-category',
      title: 'expense.reports.metrics.topCategory',
      value: reportData.value?.topCategory?.name || '--',
      subvalue: formatCurrency(reportData.value?.topCategory?.amount || 0),
      icon: 'tag',
      trend: 'neutral'
    }
  ])
  
  const charts = computed(() => [
    {
      id: 'expense-trend',
      title: 'expense.reports.charts.expenseTrend',
      type: 'line',
      height: 300
    },
    {
      id: 'category-breakdown',
      title: 'expense.reports.charts.categoryBreakdown',
      type: 'pie',
      height: 300
    },
    {
      id: 'case-comparison',
      title: 'expense.reports.charts.caseComparison',
      type: 'bar',
      height: 350
    },
    {
      id: 'monthly-comparison',
      title: 'expense.reports.charts.monthlyComparison',
      type: 'column',
      height: 300
    }
  ])
  
  const fetchReportData = async (filters: ReportFilters) => {
    isLoading.value = true
    try {
      const response = await $fetch<ReportDataResponse>(
        '/api/v1/expenses/reports/dashboard',
        {
          method: 'GET',
          query: {
            startDate: filters.dateRange.startDate.toISOString(),
            endDate: filters.dateRange.endDate.toISOString(),
            categories: filters.categories.join(','),
            cases: filters.cases.join(','),
            attorneys: filters.attorneys.join(',')
          }
        }
      )
      
      reportData.value = response.data
      chartData.value = response.charts
    } finally {
      isLoading.value = false
    }
  }
  
  return {
    isLoading: readonly(isLoading),
    isExporting: readonly(isExporting),
    currentFilters,
    metrics,
    charts,
    reportData,
    chartData,
    fetchReportData,
    exportReport
  }
}
```

### 2. Metric Cards Component

**Location**: `frontend/app/components/expenses/reports/MetricCard.vue`

**Card Design**:
```vue
<template>
  <Card class="metric-card">
    <CardContent class="p-6">
      <div class="metric-header">
        <div class="metric-icon">
          <Icon 
            :name="metric.icon" 
            class="h-5 w-5"
            :class="getIconColor(metric.trend)"
          />
        </div>
        <div class="metric-actions">
          <Button variant="ghost" size="sm" @click="showDetails">
            <Icon name="more-horizontal" class="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div class="metric-content">
        <div class="metric-value">
          <Skeleton v-if="loading" class="h-8 w-24" />
          <h3 v-else class="text-2xl font-bold">{{ metric.value }}</h3>
        </div>
        
        <div class="metric-label">
          <p class="text-sm text-muted-foreground">{{ $t(metric.title) }}</p>
        </div>
        
        <div v-if="metric.subvalue" class="metric-subvalue">
          <p class="text-xs text-muted-foreground">{{ metric.subvalue }}</p>
        </div>
        
        <div v-if="metric.change !== undefined" class="metric-change">
          <div 
            class="change-indicator"
            :class="{
              'text-green-600': metric.change > 0,
              'text-red-600': metric.change < 0,
              'text-gray-600': metric.change === 0
            }"
          >
            <Icon 
              :name="getChangeIcon(metric.change)" 
              class="h-3 w-3"
            />
            <span class="text-xs font-medium">
              {{ formatPercentage(Math.abs(metric.change)) }}
            </span>
          </div>
          <span class="text-xs text-muted-foreground ml-1">
            {{ $t('expense.reports.metrics.fromLastPeriod') }}
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
```

### 3. Reports Filter System

**Location**: `frontend/app/components/expenses/reports/ReportsFilters.vue`

**Filter Interface**:
```vue
<template>
  <Card class="filters-card">
    <CardContent class="p-4">
      <div class="filters-grid">
        <div class="filter-group">
          <Label>{{ $t('expense.reports.filters.dateRange') }}</Label>
          <DateRangePicker 
            v-model="localFilters.dateRange"
            :presets="datePresets"
            @update="handleDateRangeUpdate"
          />
        </div>
        
        <div class="filter-group">
          <Label>{{ $t('expense.reports.filters.categories') }}</Label>
          <MultiSelect
            v-model="localFilters.categories"
            :options="categoryOptions"
            :placeholder="$t('expense.reports.filters.selectCategories')"
            @update="handleCategoriesUpdate"
          />
        </div>
        
        <div class="filter-group">
          <Label>{{ $t('expense.reports.filters.cases') }}</Label>
          <CaseSelector
            v-model="localFilters.cases"
            :multiple="true"
            :placeholder="$t('expense.reports.filters.selectCases')"
            @update="handleCasesUpdate"
          />
        </div>
        
        <div class="filter-group">
          <Label>{{ $t('expense.reports.filters.attorneys') }}</Label>
          <AttorneySelector
            v-model="localFilters.attorneys"
            :multiple="true"
            :placeholder="$t('expense.reports.filters.selectAttorneys')"
            @update="handleAttorneysUpdate"
          />
        </div>
        
        <div class="filter-actions">
          <Button variant="outline" @click="resetFilters">
            {{ $t('common.reset') }}
          </Button>
          <Button @click="applyFilters">
            {{ $t('common.apply') }}
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
```

**Date Range Presets**:
```typescript
const datePresets = computed(() => [
  {
    label: 'expense.reports.datePresets.thisMonth',
    value: {
      startDate: startOfMonth(new Date()),
      endDate: endOfMonth(new Date())
    }
  },
  {
    label: 'expense.reports.datePresets.lastMonth',
    value: {
      startDate: startOfMonth(subMonths(new Date(), 1)),
      endDate: endOfMonth(subMonths(new Date(), 1))
    }
  },
  {
    label: 'expense.reports.datePresets.thisQuarter',
    value: {
      startDate: startOfQuarter(new Date()),
      endDate: endOfQuarter(new Date())
    }
  },
  {
    label: 'expense.reports.datePresets.thisYear',
    value: {
      startDate: startOfYear(new Date()),
      endDate: endOfYear(new Date())
    }
  },
  {
    label: 'expense.reports.datePresets.last12Months',
    value: {
      startDate: subMonths(new Date(), 12),
      endDate: new Date()
    }
  }
])
```

### 4. Chart Placeholder Components

**Location**: `frontend/app/components/expenses/reports/ChartCard.vue`

**Chart Container**:
```vue
<template>
  <Card class="chart-card">
    <CardHeader>
      <CardTitle class="flex items-center justify-between">
        <span>{{ $t(chart.title) }}</span>
        <div class="chart-actions">
          <Button variant="ghost" size="sm" @click="fullscreen">
            <Icon name="maximize-2" class="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" @click="exportChart">
            <Icon name="download" class="h-4 w-4" />
          </Button>
        </div>
      </CardTitle>
    </CardHeader>
    
    <CardContent>
      <div 
        class="chart-container"
        :style="{ height: `${chart.height}px` }"
      >
        <ChartSkeleton v-if="loading" :height="chart.height" />
        
        <div v-else-if="!data || data.length === 0" class="chart-empty">
          <div class="empty-state">
            <Icon name="bar-chart" class="h-12 w-12 text-muted-foreground" />
            <h3 class="text-lg font-medium text-muted-foreground">
              {{ $t('expense.reports.charts.noData') }}
            </h3>
            <p class="text-sm text-muted-foreground">
              {{ $t('expense.reports.charts.noDataDescription') }}
            </p>
          </div>
        </div>
        
        <div v-else class="chart-placeholder">
          <!-- Chart implementation will be added in future sprint -->
          <div class="placeholder-content">
            <Icon 
              :name="getChartTypeIcon(chart.type)" 
              class="h-16 w-16 text-muted-foreground"
            />
            <h4 class="text-md font-medium">{{ $t(chart.title) }}</h4>
            <p class="text-sm text-muted-foreground">
              {{ $t('expense.reports.charts.placeholder', { type: chart.type }) }}
            </p>
            <div class="data-summary">
              <p class="text-xs">
                {{ $t('expense.reports.charts.dataPoints', { count: data.length }) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
```

### 5. Responsive Layout System

**Grid System**:
```vue
<style scoped>
.metrics-grid {
  @apply grid gap-6 mb-8;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.charts-grid {
  @apply grid gap-6 mb-8;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .charts-grid {
    grid-template-columns: 1fr;
  }
  
  .chart-container {
    height: 250px !important;
  }
}

@media (max-width: 640px) {
  .page-header {
    @apply space-y-4;
  }
  
  .page-actions {
    @apply flex-col space-y-2;
  }
  
  .filters-grid {
    @apply grid-cols-1 gap-4;
  }
}
</style>
```

## Integration Guidelines

### 1. Existing Component Integration

**Card Components Usage**:
```typescript
// Leverage existing Card components from frontend/app/components/ui/card/
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

// Follow established card patterns from ExpenseDetailView.vue
const cardClasses = 'card-hover transition-shadow duration-200'
```

**Navigation Integration**:
```typescript
// Integrate with existing expense routing from useExpenseRouting.ts
import { useExpenseRouting } from '~/composables/useExpenseRouting'

export const useReportsNavigation = () => {
  const { navigateToExpenseList } = useExpenseRouting()
  
  const navigateToDetailedReport = (reportType: string, filters: ReportFilters) => {
    return navigateTo(`/expenses/reports/${reportType}`, {
      query: {
        ...filters,
        startDate: filters.dateRange.startDate.toISOString(),
        endDate: filters.dateRange.endDate.toISOString()
      }
    })
  }
  
  return {
    navigateToDetailedReport,
    navigateToExpenseList
  }
}
```

### 2. Data Integration Patterns

**Expense Store Integration**:
```typescript
// Extend existing expense store or create dedicated reports store
export const useExpenseReportsStore = defineStore('expenseReports', () => {
  const reportData = ref<ReportData | null>(null)
  const chartData = ref<Record<string, ChartDataset[]>>({})
  const isLoading = ref(false)
  const lastFetchTime = ref<Date | null>(null)
  
  const fetchDashboardData = async (filters: ReportFilters) => {
    // Check cache validity (5 minutes)
    if (lastFetchTime.value && 
        (Date.now() - lastFetchTime.value.getTime()) < 5 * 60 * 1000) {
      return
    }
    
    isLoading.value = true
    try {
      const response = await useApi().get<ReportDataResponse>(
        '/api/v1/expenses/reports/dashboard',
        { params: filters }
      )
      
      reportData.value = response.data
      chartData.value = response.charts
      lastFetchTime.value = new Date()
    } finally {
      isLoading.value = false
    }
  }
  
  return {
    reportData: readonly(reportData),
    chartData: readonly(chartData),
    isLoading: readonly(isLoading),
    fetchDashboardData
  }
})
```

### 3. Filter Integration

**Existing Filter Patterns**:
```typescript
// Integrate with existing filter patterns from useExpenseFilters.ts
import { useExpenseFilters } from '~/composables/useExpenseFilters'

export const useReportsFilters = () => {
  const { categoryOptions, caseOptions } = useExpenseFilters()
  
  const reportFilters = ref<ReportFilters>({
    dateRange: getDefaultDateRange(),
    categories: [],
    cases: [],
    attorneys: []
  })
  
  const applyFilters = (filters: ReportFilters) => {
    reportFilters.value = { ...filters }
    // Trigger report data refresh
    refreshReportData()
  }
  
  return {
    reportFilters: readonly(reportFilters),
    categoryOptions,
    caseOptions,
    applyFilters
  }
}
```

## Research Findings

### Existing Layout Patterns

**Page Structure** (from `frontend/app/pages/expenses/index.vue`):
- Consistent breadcrumb navigation
- Page header with title and actions
- Filter sections with card containers
- Grid-based content layout
- Responsive design breakpoints

**Component Patterns** (from existing expense components):
- Card-based information display
- Loading skeletons for async content
- Empty states with actionable guidance
- Consistent button and icon usage
- Mobile-first responsive design

**Filter Components** (from `ExpenseFilters.vue`):
- Date range pickers with presets
- Multi-select dropdowns for categories
- Search and clear functionality
- Responsive filter layouts
- Real-time filter application

### Card Component Patterns

**Metric Display** (from expense detail cards):
- Header with icon and actions
- Primary value with emphasis
- Secondary information and context
- Trend indicators and comparisons
- Consistent spacing and typography

## Subtasks
- [ ] Create responsive dashboard page layout
- [ ] Implement metric cards with loading and empty states
- [ ] Build comprehensive reports filter system
- [ ] Create chart placeholder components
- [ ] Add export functionality for dashboard data
- [ ] Implement navigation between different report views
- [ ] Create loading skeletons for all components
- [ ] Add mobile-responsive layouts
- [ ] Create Storybook stories for dashboard components
- [ ] Integrate with existing expense routing and stores

## Testing Requirements
- [ ] Dashboard loads and displays correctly across all screen sizes
- [ ] Metric cards show loading states and handle empty data
- [ ] Filter system works with all combinations of filters
- [ ] Chart placeholders display correctly with proper sizing
- [ ] Export functionality generates valid data files
- [ ] Navigation integrates seamlessly with existing expense pages
- [ ] Performance is acceptable with large datasets
- [ ] Accessibility standards are met (WCAG 2.1 AA)

## Success Metrics
- Dashboard page loads in under 3 seconds
- Metric cards render within 1 second of data availability
- Filter operations complete in under 500ms
- Mobile usability score > 85%
- Desktop layout utilizes full screen effectively
- Accessibility compliance score > 95%
- User engagement with filters > 60%

## Notes
- This task focuses on layout and structure - chart implementation in future sprint
- Emphasize responsive design for mobile attorneys and managers
- Ensure consistent styling with existing expense management interface
- Plan for future chart library integration (Chart.js, D3, etc.)
- Consider data refresh strategies for real-time reporting needs
- Placeholder components should clearly indicate future functionality

## Dependencies Analysis
- Integrates with existing expense data models and services
- Uses established UI component library and design system
- Leverages existing filter and navigation patterns
- Requires backend reporting API endpoints (separate backend task)

## Implementation Priority
1. Dashboard page structure and responsive layout (25% of effort)
2. Metric cards with loading and empty states (25% of effort)
3. Comprehensive filter system integration (25% of effort)
4. Chart placeholder components and grid layout (15% of effort)
5. Export functionality and navigation integration (10% of effort)
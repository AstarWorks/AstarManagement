---
task_id: T04_S03_M003
title: Analytics Charts for Expense Reporting
status: pending
estimated_hours: 8
actual_hours: null
assigned_to: Claude
dependencies: ["T03_S03_M003_Reporting_Dashboard_Layout"]
complexity: Medium
updated: null
completed: null
---

# T04_S03_M003: Analytics Charts for Expense Reporting

## Description
Implement interactive chart components for expense analytics with category breakdown, date trends, and case comparisons. Focus on performance optimization for large datasets and provide rich interactivity features like drill-down and filtering. Integrate with the existing reporting dashboard layout to provide comprehensive visual analytics for legal practice expense management.

## Acceptance Criteria
- [ ] Implement pie chart for expense category breakdown
- [ ] Create line chart for expense trends over time
- [ ] Build bar chart for case-wise expense comparison
- [ ] Add interactive features (tooltips, drill-down, filtering)
- [ ] Support Japanese localization for all chart elements
- [ ] Optimize performance for datasets up to 1000 expense records
- [ ] Implement responsive design for mobile and desktop
- [ ] Add export functionality (PNG, SVG, PDF)
- [ ] Integrate with existing dashboard filters
- [ ] Support real-time data updates

## Technical Details

### 1. Chart Library Integration

**Primary Library**: Chart.js with Vue-ChartJS wrapper
**Installation**:
```bash
bun add chart.js vue-chartjs chartjs-adapter-date-fns
bun add -d @types/chart.js
```

**Base Chart Component Structure**:
```vue
<!-- components/charts/BaseChart.vue -->
<template>
  <div class="chart-container" :style="{ height: height }">
    <canvas ref="chartCanvas" />
  </div>
</template>

<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  type ChartConfiguration
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)
</script>
```

### 2. Chart Component Implementations

**Location**: `frontend/app/components/charts/`

#### 2.1 Expense Category Pie Chart
**File**: `ExpenseCategoryPieChart.vue`

```vue
<template>
  <BaseChart
    :chart-config="pieChartConfig"
    :height="'400px'"
    @chart-click="handleCategoryClick"
  />
</template>

<script setup lang="ts">
import type { ChartConfiguration } from 'chart.js'
import type { ExpenseCategory, CategoryBreakdown } from '~/types/expense'

interface Props {
  data: CategoryBreakdown[]
  title?: string
  showLegend?: boolean
  interactive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  showLegend: true,
  interactive: true
})

const emit = defineEmits<{
  categorySelect: [category: ExpenseCategory]
}>()

const { t } = useI18n()

const pieChartConfig = computed<ChartConfiguration<'pie'>>(() => ({
  type: 'pie',
  data: {
    labels: props.data.map(item => t(`expense.categories.${item.category}`)),
    datasets: [{
      data: props.data.map(item => item.amount),
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: Boolean(props.title),
        text: props.title,
        font: { size: 16, weight: 'bold' }
      },
      legend: {
        display: props.showLegend,
        position: 'bottom'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed
            const total = props.data.reduce((sum, item) => sum + item.amount, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return `${context.label}: ¥${value.toLocaleString()} (${percentage}%)`
          }
        }
      }
    },
    onClick: props.interactive ? handleChartClick : undefined
  }
}))
</script>
```

#### 2.2 Expense Trend Line Chart
**File**: `ExpenseTrendLineChart.vue`

```vue
<template>
  <BaseChart
    :chart-config="lineChartConfig"
    :height="'400px'"
  />
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { ExpenseTrend } from '~/types/expense'

interface Props {
  data: ExpenseTrend[]
  period: 'daily' | 'weekly' | 'monthly'
  showIncome?: boolean
  showExpense?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showIncome: true,
  showExpense: true
})

const { t } = useI18n()

const lineChartConfig = computed<ChartConfiguration<'line'>>(() => {
  const datasets = []
  
  if (props.showIncome) {
    datasets.push({
      label: t('expense.analytics.income'),
      data: props.data.map(item => item.income),
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      tension: 0.4,
      fill: true
    })
  }
  
  if (props.showExpense) {
    datasets.push({
      label: t('expense.analytics.expense'),
      data: props.data.map(item => item.expense),
      borderColor: '#EF4444',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      tension: 0.4,
      fill: true
    })
  }

  return {
    type: 'line',
    data: {
      labels: props.data.map(item => 
        format(new Date(item.date), getDateFormat(), { locale: ja })
      ),
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.parsed.y
              return `${context.dataset.label}: ¥${value.toLocaleString()}`
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => `¥${Number(value).toLocaleString()}`
          }
        }
      }
    }
  }
})

const getDateFormat = () => {
  switch (props.period) {
    case 'daily': return 'M/d'
    case 'weekly': return 'M/d'
    case 'monthly': return 'yyyy/M'
    default: return 'M/d'
  }
}
</script>
```

#### 2.3 Case Comparison Bar Chart
**File**: `CaseComparisonBarChart.vue`

```vue
<template>
  <BaseChart
    :chart-config="barChartConfig"
    :height="'400px'"
    @chart-click="handleCaseClick"
  />
</template>

<script setup lang="ts">
import type { CaseExpenseSummary } from '~/types/expense'

interface Props {
  data: CaseExpenseSummary[]
  maxItems?: number
  horizontal?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  maxItems: 10,
  horizontal: false
})

const emit = defineEmits<{
  caseSelect: [caseId: string]
}>()

const { t } = useI18n()

const displayData = computed(() => 
  props.data
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, props.maxItems)
)

const barChartConfig = computed<ChartConfiguration<'bar'>>(() => ({
  type: 'bar',
  data: {
    labels: displayData.value.map(item => item.caseName || `Case ${item.caseId}`),
    datasets: [{
      label: t('expense.analytics.totalExpense'),
      data: displayData.value.map(item => item.totalAmount),
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: props.horizontal ? 'y' : 'x',
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed[props.horizontal ? 'x' : 'y']
            return `${t('expense.analytics.totalExpense')}: ¥${value.toLocaleString()}`
          }
        }
      }
    },
    scales: {
      [props.horizontal ? 'x' : 'y']: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `¥${Number(value).toLocaleString()}`
        }
      }
    },
    onClick: handleChartClick
  }
}))
</script>
```

### 3. Chart Integration with Reports Page

**Update Location**: `frontend/app/pages/expenses/reports.vue`

**Integration Pattern**:
```vue
<template>
  <!-- Existing content... -->
  
  <!-- Charts Section - Replace placeholders -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
    <!-- Category Breakdown Chart -->
    <Card>
      <CardHeader>
        <CardTitle>{{ t('expense.reports.charts.breakdown') }}</CardTitle>
      </CardHeader>
      <CardContent>
        <ExpenseCategoryPieChart
          :data="categoryBreakdownData"
          :interactive="true"
          @category-select="handleCategoryFilter"
        />
      </CardContent>
    </Card>

    <!-- Trend Chart -->
    <Card>
      <CardHeader>
        <CardTitle>{{ t('expense.reports.charts.trend') }}</CardTitle>
      </CardHeader>
      <CardContent>
        <ExpenseTrendLineChart
          :data="trendData"
          :period="filters.period"
          :show-income="true"
          :show-expense="true"
        />
      </CardContent>
    </Card>
  </div>

  <!-- Case Comparison Chart -->
  <Card class="mb-6">
    <CardHeader>
      <CardTitle>{{ t('expense.reports.charts.caseComparison') }}</CardTitle>
    </CardHeader>
    <CardContent>
      <CaseComparisonBarChart
        :data="caseComparisonData"
        :max-items="10"
        :horizontal="false"
        @case-select="handleCaseFilter"
      />
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
// Import chart components
import ExpenseCategoryPieChart from '~/components/charts/ExpenseCategoryPieChart.vue'
import ExpenseTrendLineChart from '~/components/charts/ExpenseTrendLineChart.vue'
import CaseComparisonBarChart from '~/components/charts/CaseComparisonBarChart.vue'

// Chart data computation
const categoryBreakdownData = computed(() => {
  // Transform tableData to category breakdown format
  return tableData.value.map(row => ({
    category: row.name,
    amount: Math.abs(row.expense),
    count: row.count
  }))
})

const trendData = computed(() => {
  // Generate trend data based on filters
  return generateTrendData(filters.value)
})

const caseComparisonData = computed(() => {
  // Generate case comparison data
  return generateCaseComparisonData(filters.value)
})
</script>
```

### 4. Performance Optimization

**Data Virtualization for Large Datasets**:
```typescript
// composables/useChartOptimization.ts
export const useChartOptimization = () => {
  const optimizeDataForChart = <T>(
    data: T[],
    maxPoints: number = 100
  ): T[] => {
    if (data.length <= maxPoints) return data
    
    // Sample data points evenly
    const step = Math.ceil(data.length / maxPoints)
    return data.filter((_, index) => index % step === 0)
  }
  
  const aggregateDataByPeriod = (
    data: ExpenseRecord[],
    period: 'daily' | 'weekly' | 'monthly'
  ) => {
    // Group and aggregate data by time period
    const groupedData = new Map()
    
    data.forEach(expense => {
      const key = getGroupKey(expense.date, period)
      if (!groupedData.has(key)) {
        groupedData.set(key, { income: 0, expense: 0, count: 0 })
      }
      
      const group = groupedData.get(key)
      group.income += expense.incomeAmount || 0
      group.expense += expense.expenseAmount || 0
      group.count += 1
    })
    
    return Array.from(groupedData.entries()).map(([date, data]) => ({
      date,
      ...data
    }))
  }
  
  return {
    optimizeDataForChart,
    aggregateDataByPeriod
  }
}
```

### 5. Export Functionality

**Chart Export Service**:
```typescript
// services/chartExportService.ts
export class ChartExportService {
  static async exportChartAsPNG(
    chartRef: HTMLCanvasElement,
    filename: string
  ): Promise<void> {
    const url = chartRef.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `${filename}.png`
    link.href = url
    link.click()
  }
  
  static async exportChartAsSVG(
    chartConfig: ChartConfiguration,
    filename: string
  ): Promise<void> {
    // SVG export implementation using Chart.js plugins
    // This requires additional Chart.js plugins
  }
  
  static async exportChartData(
    data: any[],
    filename: string,
    format: 'csv' | 'json' = 'csv'
  ): Promise<void> {
    // Export underlying chart data
    if (format === 'csv') {
      const csv = convertToCSV(data)
      downloadBlob(csv, `${filename}.csv`, 'text/csv')
    } else {
      const json = JSON.stringify(data, null, 2)
      downloadBlob(json, `${filename}.json`, 'application/json')
    }
  }
}
```

## Integration Guidelines

### 1. Existing Codebase Integration

**Reports Page Integration**:
- Integrate with existing filter system in `pages/expenses/reports.vue`
- Use existing data structure from mock data
- Follow established card layout patterns
- Maintain responsive design consistency

**Data Flow Pattern**:
```typescript
// Follow existing pattern from reports page
const loadChartData = async () => {
  loading.value = true
  
  try {
    // Use existing API patterns
    const response = await $fetch('/api/expenses/analytics', {
      query: {
        period: filters.value.period,
        group_by: filters.value.groupBy,
        start_date: filters.value.startDate,
        end_date: filters.value.endDate
      }
    })
    
    // Transform data for charts
    categoryBreakdownData.value = transformCategoryData(response.categoryBreakdown)
    trendData.value = transformTrendData(response.trends)
    caseComparisonData.value = transformCaseData(response.caseComparison)
  } catch (error) {
    console.error('Failed to load chart data:', error)
  } finally {
    loading.value = false
  }
}
```

### 2. Component Architecture

**Chart Component Hierarchy**:
```
components/charts/
├── BaseChart.vue           # Core Chart.js wrapper
├── ExpenseCategoryPieChart.vue
├── ExpenseTrendLineChart.vue
├── CaseComparisonBarChart.vue
└── ChartExportButton.vue   # Export functionality
```

**Composable Pattern**:
```typescript
// composables/useExpenseCharts.ts
export const useExpenseCharts = () => {
  const chartData = ref({
    categories: [],
    trends: [],
    cases: []
  })
  
  const loadChartData = async (filters: ReportFilters) => {
    // Implementation
  }
  
  const exportChart = async (chartType: string, format: string) => {
    // Implementation
  }
  
  return {
    chartData: readonly(chartData),
    loadChartData,
    exportChart
  }
}
```

### 3. Type Definitions

**Chart Data Types**:
```typescript
// types/expense/analytics.ts
export interface CategoryBreakdown {
  category: ExpenseCategory
  amount: number
  count: number
  percentage: number
}

export interface ExpenseTrend {
  date: string
  income: number
  expense: number
  balance: number
}

export interface CaseExpenseSummary {
  caseId: string
  caseName?: string
  totalAmount: number
  expenseCount: number
  categories: CategoryBreakdown[]
}

export interface ChartExportOptions {
  format: 'png' | 'svg' | 'pdf'
  width?: number
  height?: number
  backgroundColor?: string
}
```

## Research Findings

### Existing Codebase Patterns

**Reports Page Structure** (from `pages/expenses/reports.vue`):
- Card-based layout with consistent styling
- Filter system with period/groupBy options
- Mock data structure with summary statistics
- Placeholder chart containers ready for implementation
- Responsive grid layout for chart arrangement

**UI Component Patterns**:
- Consistent use of shadcn/ui components (Card, Button, Select)
- Icon integration with Lucide icons
- Loading states and error handling patterns
- Japanese localization with i18n integration

**Data Transformation Patterns**:
- Currency formatting with Japanese Yen
- Date formatting with Japanese locale
- Mock data structure indicates expected API response format
- Filter state management with URL synchronization

### Performance Considerations

**Large Dataset Handling**:
- Chart.js performance optimizations for 1000+ data points
- Data sampling strategies for trend charts
- Lazy loading for chart components
- Progressive data loading with pagination

**Memory Management**:
- Chart instance cleanup on component unmount
- Data structure optimization for chart rendering
- Debounced filter updates to prevent excessive re-renders

## Subtasks
- [ ] Install and configure Chart.js with Vue-ChartJS
- [ ] Create BaseChart wrapper component
- [ ] Implement ExpenseCategoryPieChart with interactivity
- [ ] Build ExpenseTrendLineChart with time period support
- [ ] Create CaseComparisonBarChart with drill-down
- [ ] Integrate charts with existing reports page
- [ ] Add chart export functionality (PNG, CSV)
- [ ] Implement performance optimizations for large datasets
- [ ] Add responsive design for mobile devices
- [ ] Create chart-specific composables and utilities
- [ ] Add comprehensive TypeScript types
- [ ] Implement loading states and error handling

## Testing Requirements
- [ ] Charts render correctly with various data sizes
- [ ] Interactive features work (clicks, tooltips, filters)
- [ ] Export functionality produces valid files
- [ ] Performance remains smooth with 1000+ data points
- [ ] Responsive design works on all screen sizes
- [ ] Japanese localization displays correctly
- [ ] Charts update properly when filters change
- [ ] Error states display appropriate messages

## Success Metrics
- Render 1000-point chart in under 2 seconds
- Interactive features respond within 100ms
- Export functionality works for all supported formats
- Memory usage stays under 50MB for largest charts
- Charts display correctly on screens from 320px to 1920px width
- 100% accessibility compliance for chart interactions
- All chart text properly localized in Japanese

## Notes
- Focus on Chart.js for consistency and performance
- Prioritize legal practice use cases (category breakdown, case comparison)
- Consider future extensibility for additional chart types
- Ensure accessibility compliance for screen readers
- Export functionality should support both image and data formats
- Performance optimization is critical for user adoption

## Implementation Priority
1. Chart library setup and BaseChart component (25% of effort)
2. Core chart implementations (pie, line, bar) (40% of effort)
3. Integration with reports page and data flow (20% of effort)
4. Export functionality and performance optimization (10% of effort)
5. Testing, responsive design, and polish (5% of effort)
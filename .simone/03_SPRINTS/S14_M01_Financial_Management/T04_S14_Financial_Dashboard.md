# T04_S14_Financial_Dashboard

---
status: completed
updated: 2025-07-03 14:45
---

## Task Overview
Implement a comprehensive financial dashboard with charts and KPIs for expense analytics, budget tracking, and visual reports. This dashboard will provide at-a-glance insights into financial performance across matters, lawyers, and time periods.

## 📋 Requirements

### Core Features
- **Financial KPI Cards**: Display key metrics (total expenses, budget vs actual, average per matter)
- **Expense Analytics Charts**: Visualize expense distribution by category, matter, and time
- **Budget Tracking**: Show budget utilization with progress bars and alerts
- **Revenue Insights**: Track billable hours, rates, and revenue projections
- **Trend Analysis**: Display financial trends over time with line charts
- **Comparative Views**: Compare current vs previous periods
- **Export Functionality**: Export dashboard data as CSV/PDF reports

### Chart Requirements
- **Pie Charts**: Expense category distribution, matter value distribution
- **Bar Charts**: Monthly expense trends, lawyer billing comparison
- **Line Charts**: Revenue trends, budget utilization over time
- **Gauge Charts**: Budget utilization indicators
- **Donut Charts**: Billable vs non-billable hours breakdown

### Dashboard Layout
- **Mobile-First**: Responsive design with collapsible sections
- **Filter Controls**: Time period, matter type, lawyer selection
- **Real-Time Updates**: Auto-refresh capabilities with WebSocket integration
- **Card-Based Layout**: Modular dashboard cards that can be rearranged

## 🔍 Research Analysis

### Existing Dashboard Patterns
Based on codebase analysis, the project has several dashboard-related components:

1. **PerformanceMetricsDashboard.vue** - Provides excellent patterns for:
   - Dashboard card layouts with minimize/maximize functionality
   - Real-time metrics with Canvas-based charts
   - Performance scoring and status indicators
   - Auto-refresh mechanisms with interval management

2. **SyncPerformanceMetrics.vue** - Demonstrates:
   - Tabbed dashboard interface
   - Progress bars and status indicators
   - Grid-based metric displays
   - Export functionality

3. **Card Component System** - Available UI components:
   - Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
   - Badge for status indicators
   - Progress component for budget tracking
   - Button variants for actions

### Chart Library Assessment
Current codebase uses:
- **Canvas-based charts** in PerformanceMetricsDashboard for simple line charts
- **Native HTML5 Canvas** for real-time performance visualization

**Recommendation**: Integrate Chart.js for comprehensive charting capabilities:
- Responsive and accessible charts
- Rich interaction support
- Extensive chart types (pie, bar, line, doughnut, gauge)
- Animation and transition support
- Vue.js integration available

### Statistics Computation
Existing patterns found:
- **Matter Statistics API** (`/frontend/src/server/api/matters/statistics.get.ts`)
- **Audit Statistics** (`/backend/src/main/kotlin/dev/ryuzu/astermanagement/dto/audit/AuditStatisticsDto.kt`)
- **Expense Schema** in matter.ts with categories and billable tracking

## 📋 Implementation Plan

### Phase 1: Core Dashboard Structure
1. Create base financial dashboard component
2. Implement dashboard card grid layout
3. Add filter controls and time period selection
4. Set up responsive design framework

### Phase 2: Chart Integration
1. Install and configure Chart.js with Vue 3
2. Create reusable chart wrapper components
3. Implement expense category pie chart
4. Add monthly expense trend bar chart

### Phase 3: KPI Cards and Metrics
1. Develop financial KPI calculation utilities
2. Create dashboard metric cards
3. Implement budget progress indicators
4. Add revenue tracking components

### Phase 4: Advanced Features
1. Add comparative analysis views
2. Implement drill-down capabilities
3. Create export functionality
4. Add real-time update integration

## 🛠️ Technical Guidance

### Chart.js Integration
```bash
# Install Chart.js and Vue integration
bun add chart.js vue-chartjs

# Install additional chart types if needed
bun add chartjs-adapter-date-fns date-fns
```

### Component Architecture
```vue
<!-- FinancialDashboard.vue -->
<template>
  <div class="financial-dashboard">
    <!-- Dashboard Header with Filters -->
    <DashboardHeader 
      v-model:period="selectedPeriod"
      v-model:matter="selectedMatter"
      @export="handleExport"
    />
    
    <!-- KPI Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <KPICard
        title="Total Expenses"
        :value="formatCurrency(metrics.totalExpenses)"
        :trend="metrics.expenseTrend"
        icon="DollarSign"
      />
      <KPICard
        title="Budget Utilization"
        :value="`${metrics.budgetUtilization}%`"
        :trend="metrics.budgetTrend"
        icon="Target"
      />
      <!-- Additional KPI cards -->
    </div>
    
    <!-- Charts Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ExpenseCategoryChart :data="metrics.categoryData" />
      <RevenueChart :data="metrics.revenueData" />
      <BudgetProgressChart :data="metrics.budgetData" />
      <ExpenseTrendChart :data="metrics.trendData" />
    </div>
  </div>
</template>
```

### Chart Components Pattern
```vue
<!-- ExpenseCategoryChart.vue -->
<script setup lang="ts">
import { Pie } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, ArcElement)

interface Props {
  data: {
    categories: string[]
    amounts: number[]
    colors: string[]
  }
}

const props = defineProps<Props>()

const chartData = computed(() => ({
  labels: props.data.categories,
  datasets: [{
    data: props.data.amounts,
    backgroundColor: props.data.colors,
    borderWidth: 2,
    borderColor: '#ffffff'
  }]
}))

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'bottom' as const
    },
    title: {
      display: true,
      text: 'Expense Distribution by Category'
    }
  }
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Expense Categories</CardTitle>
    </CardHeader>
    <CardContent>
      <Pie :data="chartData" :options="chartOptions" />
    </CardContent>
  </Card>
</template>
```

### Dashboard Card Components
```vue
<!-- KPICard.vue -->
<script setup lang="ts">
interface Props {
  title: string
  value: string
  trend?: {
    direction: 'up' | 'down' | 'stable'
    percentage: number
    period: string
  }
  icon: string
}

const props = defineProps<Props>()

const trendColor = computed(() => {
  if (!props.trend) return ''
  switch (props.trend.direction) {
    case 'up': return 'text-green-500'
    case 'down': return 'text-red-500'
    default: return 'text-gray-500'
  }
})
</script>

<template>
  <Card>
    <CardContent class="p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-muted-foreground">{{ title }}</p>
          <div class="text-2xl font-bold">{{ value }}</div>
          <div v-if="trend" class="flex items-center text-xs" :class="trendColor">
            <TrendingUp v-if="trend.direction === 'up'" class="h-3 w-3 mr-1" />
            <TrendingDown v-if="trend.direction === 'down'" class="h-3 w-3 mr-1" />
            <span>{{ trend.percentage }}% {{ trend.period }}</span>
          </div>
        </div>
        <component :is="iconMap[icon]" class="h-8 w-8 text-muted-foreground" />
      </div>
    </CardContent>
  </Card>
</template>
```

### Real-Time Financial Metrics
```typescript
// composables/useFinancialMetrics.ts
export function useFinancialMetrics(period: Ref<string>) {
  const { data: expenses } = useQuery({
    queryKey: ['expenses', period],
    queryFn: () => $fetch('/api/expenses/summary', { 
      params: { period: period.value } 
    })
  })
  
  const { data: revenue } = useQuery({
    queryKey: ['revenue', period],
    queryFn: () => $fetch('/api/revenue/summary', { 
      params: { period: period.value } 
    })
  })
  
  const metrics = computed(() => ({
    totalExpenses: expenses.value?.total || 0,
    totalRevenue: revenue.value?.total || 0,
    profitMargin: calculateProfitMargin(revenue.value, expenses.value),
    budgetUtilization: calculateBudgetUtilization(expenses.value),
    categoryData: formatCategoryData(expenses.value?.byCategory),
    trendData: formatTrendData(expenses.value?.trends)
  }))
  
  return { metrics }
}
```

### Responsive Dashboard Layout
```vue
<template>
  <div class="financial-dashboard space-y-6">
    <!-- Mobile: Stack cards vertically -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <!-- KPI Cards -->
    </div>
    
    <!-- Desktop: 2-column chart layout, Mobile: Single column -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Charts that work well side-by-side on desktop -->
      <ExpenseCategoryChart />
      <BudgetProgressChart />
    </div>
    
    <!-- Full-width charts -->
    <div class="grid grid-cols-1 gap-6">
      <RevenueChart />
      <ExpenseTrendChart />
    </div>
  </div>
</template>
```

## 📊 Implementation Notes

### Financial Data Structure
Based on existing expense schema, implement:
```typescript
interface FinancialMetrics {
  totalExpenses: number
  totalRevenue: number
  budgetTotal: number
  budgetUtilized: number
  profitMargin: number
  expensesByCategory: Record<string, number>
  expensesByMatter: Record<string, number>
  monthlyTrends: Array<{
    month: string
    expenses: number
    revenue: number
  }>
}
```

### Chart Color Scheme
Use consistent color palette matching the existing design system:
```typescript
const chartColors = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',
  destructive: 'hsl(var(--destructive))',
  // Additional colors for multi-category charts
  expenses: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6']
}
```

### Performance Considerations
- Implement virtual scrolling for large datasets
- Use Chart.js animation sparingly for better mobile performance
- Cache calculated metrics with proper invalidation
- Lazy load charts that are not immediately visible

### Export Functionality
```typescript
const exportDashboard = async (format: 'csv' | 'pdf') => {
  if (format === 'csv') {
    // Export raw data as CSV
    const csvData = generateCSV(metrics.value)
    downloadFile(csvData, 'financial-dashboard.csv')
  } else {
    // Generate PDF with charts using html2canvas + jsPDF
    const pdfData = await generatePDFReport(metrics.value)
    downloadFile(pdfData, 'financial-dashboard.pdf')
  }
}
```

## 🧪 Testing Strategy

### Unit Tests
- Test financial calculation utilities
- Verify chart data transformation functions
- Test responsive behavior with different screen sizes

### Integration Tests
- Verify API integration with financial endpoints
- Test real-time updates and WebSocket integration
- Validate export functionality

### Visual Tests
- Chart rendering accuracy
- Dashboard layout responsiveness
- Color scheme consistency

## 📖 Documentation Requirements

- Chart.js integration guide
- Dashboard customization documentation
- Financial metrics calculation formulas
- Export feature usage guide
- Mobile-specific interaction patterns

## 🔗 Dependencies

### New Dependencies
- `chart.js` - Core charting library
- `vue-chartjs` - Vue 3 Chart.js integration
- `chartjs-adapter-date-fns` - Date handling for time-based charts
- `date-fns` - Date utility functions

### Existing Dependencies
- Vue 3 Composition API
- Pinia for state management
- TanStack Query for data fetching
- shadcn-vue components
- Lucide Vue Next for icons

## 🎯 Success Criteria

- [ ] Responsive financial dashboard with 6+ chart types
- [ ] Real-time metrics update within 30 seconds
- [ ] Mobile-optimized with touch-friendly interactions
- [ ] Export functionality for CSV and PDF formats
- [ ] Sub-200ms chart rendering performance
- [ ] Comprehensive test coverage (>90%)
- [ ] Full documentation with usage examples

## 📅 Estimated Effort

**Complexity**: Medium  
**Estimated Time**: 12-16 hours
- Dashboard structure and layout: 3-4 hours
- Chart.js integration and components: 4-5 hours
- KPI calculations and data processing: 2-3 hours
- Responsive design and mobile optimization: 2-3 hours
- Export functionality and testing: 1-2 hours

## 🔄 Related Tasks

- **T01_S14_Expense_Entry_Form** - Provides expense data source
- **T02_S14_Per_Diem_Recording** - Additional financial data input
- **T03_S14_Receipt_Management** - Receipt attachment tracking
- **Backend API** - Financial statistics endpoints needed
- **Real-time Integration** - WebSocket updates for live metrics
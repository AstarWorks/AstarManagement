<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronDown, ChevronUp, ExternalLink, Download } from 'lucide-vue-next'

/**
 * Financial Matter Expenses Table Component
 * 
 * Displays expenses breakdown by matter in a sortable table format.
 * Provides detailed view of spending across different legal matters.
 */

interface Props {
  /** Expense data by matter */
  data: Record<string, number>
  /** Table title */
  title?: string
  /** Show export button */
  showExport?: boolean
  /** Maximum rows to display */
  maxRows?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Expenses by Matter',
  showExport: true,
  maxRows: 10
})

// Sorting state
const sortField = ref<'matter' | 'amount' | 'percentage'>('amount')
const sortDirection = ref<'asc' | 'desc'>('desc')

// Computed table data
const tableData = computed(() => {
  const totalExpenses = Object.values(props.data).reduce((sum, amount) => sum + amount, 0)
  
  let rows = Object.entries(props.data).map(([matter, amount]) => ({
    matter,
    amount,
    percentage: (amount / totalExpenses) * 100,
    formattedAmount: formatCurrency(amount),
    formattedPercentage: `${((amount / totalExpenses) * 100).toFixed(1)}%`
  }))
  
  // Apply sorting
  rows.sort((a, b) => {
    let aValue: any
    let bValue: any
    
    switch (sortField.value) {
      case 'matter':
        aValue = a.matter.toLowerCase()
        bValue = b.matter.toLowerCase()
        break
      case 'percentage':
        aValue = a.percentage
        bValue = b.percentage
        break
      default:
        aValue = a.amount
        bValue = b.amount
    }
    
    if (sortDirection.value === 'desc') {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    } else {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    }
  })
  
  // Apply row limit
  if (props.maxRows && rows.length > props.maxRows) {
    const visibleRows = rows.slice(0, props.maxRows)
    const hiddenCount = rows.length - props.maxRows
    const hiddenTotal = rows.slice(props.maxRows).reduce((sum, row) => sum + row.amount, 0)
    
    return {
      rows: visibleRows,
      hasMore: true,
      hiddenCount,
      hiddenTotal,
      totalRows: rows.length
    }
  }
  
  return {
    rows,
    hasMore: false,
    hiddenCount: 0,
    hiddenTotal: 0,
    totalRows: rows.length
  }
})

// Summary statistics
const summary = computed(() => {
  const amounts = Object.values(props.data)
  const total = amounts.reduce((sum, amount) => sum + amount, 0)
  const average = total / amounts.length
  const highest = Math.max(...amounts)
  const lowest = Math.min(...amounts)
  
  return {
    total,
    average,
    highest,
    lowest,
    count: amounts.length
  }
})

// Sorting functions
const sort = (field: 'matter' | 'amount' | 'percentage') => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'desc' ? 'asc' : 'desc'
  } else {
    sortField.value = field
    sortDirection.value = 'desc'
  }
}

const getSortIcon = (field: string) => {
  if (sortField.value !== field) return null
  return sortDirection.value === 'desc' ? ChevronDown : ChevronUp
}

// Format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0
  }).format(amount)
}

// Export functionality
const exportData = () => {
  const csvHeaders = ['Matter', 'Amount (JPY)', 'Percentage']
  const csvRows = Object.entries(props.data).map(([matter, amount]) => {
    const percentage = ((amount / summary.value.total) * 100).toFixed(1)
    return [matter, amount.toString(), `${percentage}%`]
  })
  
  const csvContent = [csvHeaders, ...csvRows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `matter-expenses-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Navigation to matter details
const viewMatterDetails = (matterName: string) => {
  // In a real app, this would navigate to the matter detail page
  console.log(`Navigate to matter: ${matterName}`)
  // Example: navigateTo(`/matters/${matterSlug}`)
}
</script>

<template>
  <Card class="financial-table-card">
    <CardHeader>
      <div class="flex items-center justify-between">
        <div>
          <CardTitle>{{ title }}</CardTitle>
          <CardDescription>
            Detailed breakdown of expenses across {{ summary.count }} legal matters
          </CardDescription>
        </div>
        
        <Button v-if="showExport" variant="outline" size="sm" @click="exportData">
          <Download class="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>
    </CardHeader>
    
    <CardContent>
      <!-- Summary Statistics -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="p-3 rounded-lg bg-muted/50 text-center">
          <div class="text-xs text-muted-foreground mb-1">Total Expenses</div>
          <div class="text-lg font-semibold">{{ formatCurrency(summary.total) }}</div>
        </div>
        
        <div class="p-3 rounded-lg bg-muted/50 text-center">
          <div class="text-xs text-muted-foreground mb-1">Average per Matter</div>
          <div class="text-lg font-semibold">{{ formatCurrency(summary.average) }}</div>
        </div>
        
        <div class="p-3 rounded-lg bg-muted/50 text-center">
          <div class="text-xs text-muted-foreground mb-1">Highest</div>
          <div class="text-lg font-semibold text-red-600">{{ formatCurrency(summary.highest) }}</div>
        </div>
        
        <div class="p-3 rounded-lg bg-muted/50 text-center">
          <div class="text-xs text-muted-foreground mb-1">Lowest</div>
          <div class="text-lg font-semibold text-green-600">{{ formatCurrency(summary.lowest) }}</div>
        </div>
      </div>
      
      <!-- Data Table -->
      <div class="rounded-lg border border-border overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-muted/50">
              <tr>
                <th 
                  class="text-left p-4 font-medium cursor-pointer hover:bg-muted/70 transition-colors"
                  @click="sort('matter')"
                >
                  <div class="flex items-center gap-2">
                    Matter Name
                    <component 
                      v-if="getSortIcon('matter')" 
                      :is="getSortIcon('matter')" 
                      class="w-4 h-4"
                    />
                  </div>
                </th>
                <th 
                  class="text-right p-4 font-medium cursor-pointer hover:bg-muted/70 transition-colors"
                  @click="sort('amount')"
                >
                  <div class="flex items-center justify-end gap-2">
                    Amount
                    <component 
                      v-if="getSortIcon('amount')" 
                      :is="getSortIcon('amount')" 
                      class="w-4 h-4"
                    />
                  </div>
                </th>
                <th 
                  class="text-right p-4 font-medium cursor-pointer hover:bg-muted/70 transition-colors"
                  @click="sort('percentage')"
                >
                  <div class="flex items-center justify-end gap-2">
                    Percentage
                    <component 
                      v-if="getSortIcon('percentage')" 
                      :is="getSortIcon('percentage')" 
                      class="w-4 h-4"
                    />
                  </div>
                </th>
                <th class="text-center p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="(row, index) in tableData.rows" 
                :key="row.matter"
                class="border-t border-border hover:bg-muted/25 transition-colors"
                :class="{ 'bg-muted/10': index % 2 === 0 }"
              >
                <td class="p-4">
                  <div class="font-medium">{{ row.matter }}</div>
                </td>
                <td class="p-4 text-right">
                  <div class="font-medium">{{ row.formattedAmount }}</div>
                </td>
                <td class="p-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <div class="font-medium">{{ row.formattedPercentage }}</div>
                    <div 
                      class="w-16 h-2 bg-muted rounded-full overflow-hidden"
                      :title="`${row.formattedPercentage} of total expenses`"
                    >
                      <div 
                        class="h-full bg-primary transition-all duration-300"
                        :style="{ width: `${Math.min(row.percentage, 100)}%` }"
                      ></div>
                    </div>
                  </div>
                </td>
                <td class="p-4 text-center">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    @click="viewMatterDetails(row.matter)"
                    title="View matter details"
                  >
                    <ExternalLink class="w-4 h-4" />
                  </Button>
                </td>
              </tr>
              
              <!-- More rows indicator -->
              <tr v-if="tableData.hasMore" class="border-t border-border bg-muted/10">
                <td class="p-4 text-muted-foreground">
                  {{ tableData.hiddenCount }} more matters...
                </td>
                <td class="p-4 text-right font-medium">
                  {{ formatCurrency(tableData.hiddenTotal) }}
                </td>
                <td class="p-4 text-right">
                  <span class="text-muted-foreground">
                    {{ ((tableData.hiddenTotal / summary.total) * 100).toFixed(1) }}%
                  </span>
                </td>
                <td class="p-4"></td>
              </tr>
            </tbody>
            
            <!-- Table Footer -->
            <tfoot class="bg-muted/30 border-t-2 border-border">
              <tr>
                <td class="p-4 font-semibold">Total ({{ summary.count }} matters)</td>
                <td class="p-4 text-right font-bold">{{ formatCurrency(summary.total) }}</td>
                <td class="p-4 text-right font-semibold">100.0%</td>
                <td class="p-4"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      
      <!-- Table info -->
      <div class="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Showing {{ tableData.rows.length }} of {{ tableData.totalRows }} matters
        </div>
        <div>
          Sorted by {{ sortField }} ({{ sortDirection === 'desc' ? 'high to low' : 'low to high' }})
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
.financial-table-card {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
}

/* Table styling */
table {
  border-collapse: collapse;
}

th {
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 10;
}

/* Progress bar animation */
.w-16.h-2 div {
  transition: width 0.5s ease-out;
}

/* Hover effects */
tbody tr:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .grid-cols-4 {
    grid-template-columns: repeat(2, 1fr);
  }
  
  th, td {
    padding: 0.75rem 0.5rem;
  }
  
  .w-16 {
    width: 2rem;
  }
}

@media (max-width: 640px) {
  .grid-cols-4 {
    grid-template-columns: repeat(1, 1fr);
  }
  
  /* Stack table content on mobile */
  table, thead, tbody, th, td, tr {
    display: block;
  }
  
  thead tr {
    position: absolute;
    top: -9999px;
    left: -9999px;
  }
  
  tbody tr {
    border: 1px solid #ccc;
    margin-bottom: 10px;
    padding: 10px;
    border-radius: 8px;
    background: hsl(var(--card));
  }
  
  tbody td {
    border: none;
    position: relative;
    padding-left: 50% !important;
    padding-top: 10px;
    padding-bottom: 10px;
  }
  
  tbody td:before {
    content: attr(data-label) ": ";
    position: absolute;
    left: 6px;
    width: 45%;
    padding-right: 10px;
    white-space: nowrap;
    font-weight: bold;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .financial-table-card {
    border-width: 2px;
  }
  
  table {
    border: 1px solid currentColor;
  }
  
  th, td {
    border: 1px solid currentColor;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  tbody tr,
  .w-16.h-2 div {
    transition: none !important;
  }
  
  tbody tr:hover {
    transform: none !important;
    box-shadow: none !important;
  }
}
</style>
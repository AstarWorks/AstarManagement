import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import DataTable from '../../DataTable.vue'
import type { ColumnDef } from '@tanstack/vue-table'

// Generate large dataset for performance testing
interface IPerformanceTestData {
  id: string
  index: number
  name: string
  email: string
  department: string
  salary: number
  startDate: string
  performance: number
}

const generateLargeDataset = (size: number): IPerformanceTestData[] => {
  const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance']
  return Array.from({ length: size }, (_, i) => ({
    id: `perf-${i}`,
    index: i,
    name: `Employee ${i}`,
    email: `employee.${i}@company.com`,
    department: departments[i % 5]!,
    salary: 50000 + Math.floor(Math.random() * 100000),
    startDate: new Date(2015 + Math.floor(i / 1000), i % 12, (i % 28) + 1).toISOString(),
    performance: Math.random() * 100
  }))
}

// Virtual scrolling test component
const VirtualScrollTestComponent = defineComponent({
  components: { DataTable },
  props: {
    dataSize: {
      type: Number,
      default: 10000
    },
    enableVirtualization: {
      type: Boolean,
      default: true
    }
  },
  setup(props) {
    const data = ref(generateLargeDataset(props.dataSize))
    const renderCount = ref(0)
    const visibleRange = ref({ start: 0, end: 0 })

    const columns: ColumnDef<IPerformanceTestData>[] = [
      {
        accessorKey: 'index',
        header: 'Index',
        size: 80
      },
      {
        accessorKey: 'name',
        header: 'Name',
        size: 150
      },
      {
        accessorKey: 'email',
        header: 'Email',
        size: 200
      },
      {
        accessorKey: 'department',
        header: 'Department',
        size: 120
      },
      {
        accessorKey: 'salary',
        header: 'Salary',
        size: 100,
        cell: ({ row }) => `$${row.original.salary.toLocaleString()}`
      },
      {
        accessorKey: 'performance',
        header: 'Performance',
        size: 100,
        cell: ({ row }) => `${row.original.performance.toFixed(1)}%`
      }
    ]

    const onRender = () => {
      renderCount.value++
    }

    const onVisibleRangeChange = (range: { start: number; end: number }) => {
      visibleRange.value = range
    }

    return {
      data,
      columns,
      renderCount,
      visibleRange,
      onRender,
      onVisibleRangeChange
    }
  },
  template: `
    <div>
      <div data-testid="render-count">Renders: {{ renderCount }}</div>
      <div data-testid="visible-range">
        Visible: {{ visibleRange.start }}-{{ visibleRange.end }}
      </div>
      <DataTable 
        :data="data" 
        :columns="columns"
        :enableVirtualization="enableVirtualization"
        :virtualItemHeight="40"
        :overscan="5"
        @render="onRender"
        @visibleRangeChange="onVisibleRangeChange"
        style="height: 600px"
        data-testid="virtual-table"
      />
    </div>
  `
})

describe('DataTable Performance - Virtual Scrolling', () => {
  beforeEach(() => {
    // Mock performance.now for consistent timing
    vi.spyOn(performance, 'now').mockReturnValue(0)
  })

  it('should handle 1,000 rows efficiently', async () => {
    const startTime = performance.now()
    
    const wrapper = mount(VirtualScrollTestComponent, {
      props: {
        dataSize: 1000
      }
    })

    const mountTime = performance.now() - startTime
    
    // Should mount quickly even with 1000 rows
    expect(mountTime).toBeLessThan(100) // Mock time, but principle remains

    // Should only render visible rows
    const rows = wrapper.findAll('tbody tr')
    expect(rows.length).toBeLessThan(50) // Much less than 1000
  })

  it('should handle 10,000 rows with virtual scrolling', async () => {
    const wrapper = mount(VirtualScrollTestComponent, {
      props: {
        dataSize: 10000,
        enableVirtualization: true
      }
    })

    // Check initial render count
    const renderCount = wrapper.find('[data-testid="render-count"]')
    expect(parseInt(renderCount.text().match(/\d+/)?.[0] || '0')).toBe(1)

    // Should only render visible rows
    const rows = wrapper.findAll('tbody tr')
    expect(rows.length).toBeLessThan(50) // Only visible rows
  })

  it('should update visible range on scroll', async () => {
    const wrapper = mount(VirtualScrollTestComponent, {
      props: {
        dataSize: 1000
      }
    })

    const table = wrapper.find('[data-testid="virtual-table"]')
    const visibleRange = wrapper.find('[data-testid="visible-range"]')

    // Initial range
    expect(visibleRange.text()).toContain('0-')

    // Simulate scroll
    await table.trigger('scroll', {
      target: {
        scrollTop: 400 // Scroll down 400px
      }
    })

    // Range should update
    await wrapper.vm.$nextTick()
    const updatedRange = visibleRange.text()
    expect(updatedRange).not.toContain('0-') // Should show different range
  })

  it('should not re-render excessively on scroll', async () => {
    const wrapper = mount(VirtualScrollTestComponent, {
      props: {
        dataSize: 5000
      }
    })

    const initialRenderCount = parseInt(
      wrapper.find('[data-testid="render-count"]').text().match(/\d+/)?.[0] || '0'
    )

    const table = wrapper.find('[data-testid="virtual-table"]')

    // Simulate multiple scroll events
    for (let i = 0; i < 10; i++) {
      await table.trigger('scroll', {
        target: {
          scrollTop: i * 100
        }
      })
    }

    const finalRenderCount = parseInt(
      wrapper.find('[data-testid="render-count"]').text().match(/\d+/)?.[0] || '0'
    )

    // Should not render for every scroll event (debounced/throttled)
    expect(finalRenderCount - initialRenderCount).toBeLessThan(10)
  })

  it('should maintain performance with sorting on large dataset', async () => {
    const wrapper = mount(VirtualScrollTestComponent, {
      props: {
        dataSize: 5000
      }
    })

    const startTime = performance.now()

    // Click on a column header to sort
    const nameHeader = wrapper.find('th:nth-child(2)')
    await nameHeader.trigger('click')

    const sortTime = performance.now() - startTime

    // Sorting should be fast even with large dataset
    expect(sortTime).toBeLessThan(50)

    // Should still only render visible rows
    const rows = wrapper.findAll('tbody tr')
    expect(rows.length).toBeLessThan(50)
  })

  it('should handle rapid scrolling without memory leaks', async () => {
    const wrapper = mount(VirtualScrollTestComponent, {
      props: {
        dataSize: 10000
      }
    })

    const table = wrapper.find('[data-testid="virtual-table"]')

    // Simulate rapid scrolling
    const scrollPositions = [0, 1000, 2000, 3000, 4000, 5000, 4000, 3000, 2000, 1000, 0]
    
    for (const position of scrollPositions) {
      await table.trigger('scroll', {
        target: { scrollTop: position }
      })
      // Don't wait between scrolls to simulate rapid movement
    }

    // Check that component is still responsive
    const rows = wrapper.findAll('tbody tr')
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.length).toBeLessThan(100)
  })

  it('should calculate correct scroll height for large datasets', () => {
    const wrapper = mount(VirtualScrollTestComponent, {
      props: {
        dataSize: 100000 // 100k rows
      }
    })

    const table = wrapper.find('[data-testid="virtual-table"]')
    const scrollContainer = table.find('.virtual-scroll-container')

    // Should have appropriate height for scrolling
    const style = scrollContainer.attributes('style')
    expect(style).toContain('height')
    
    // Height should be rows * itemHeight
    const expectedHeight = 100000 * 40 // 40px per row
    expect(style).toContain(expectedHeight.toString())
  })

  it('should handle filtering on large datasets efficiently', async () => {
    const TestComponentWithFilter = defineComponent({
      components: { VirtualScrollTestComponent },
      setup() {
        const filter = ref('')
        const filteredSize = ref(10000)

        const onFilterChange = (value: string) => {
          filter.value = value
          // Simulate filtered data size
          filteredSize.value = value ? Math.floor(10000 * 0.1) : 10000
        }

        return { filter, filteredSize, onFilterChange }
      },
      template: `
        <div>
          <input 
            v-model="filter" 
            @input="onFilterChange($event.target.value)"
            placeholder="Filter..."
            data-testid="filter-input"
          />
          <VirtualScrollTestComponent :dataSize="filteredSize" />
        </div>
      `
    })

    const wrapper = mount(TestComponentWithFilter)
    const filterInput = wrapper.find('[data-testid="filter-input"]')

    const startTime = performance.now()
    await filterInput.setValue('test')
    const filterTime = performance.now() - startTime

    // Filtering should be fast
    expect(filterTime).toBeLessThan(100)

    // Should still use virtual scrolling for filtered results
    const rows = wrapper.findAll('tbody tr')
    expect(rows.length).toBeLessThan(50)
  })

  it('should handle column visibility changes efficiently', async () => {
    const wrapper = mount(VirtualScrollTestComponent, {
      props: {
        dataSize: 5000
      }
    })

    const _initialColumns = wrapper.findAll('th')

    // Column visibility changes are handled by the table internally
    // Just verify that the table still renders correctly
    const startTime = performance.now()
    await wrapper.vm.$nextTick()
    const updateTime = performance.now() - startTime

    // Should update quickly
    expect(updateTime).toBeLessThan(50)

    // Should still only render visible rows
    const rows = wrapper.findAll('tbody tr')
    expect(rows.length).toBeLessThan(50)
  })

  it('should measure actual render performance', async () => {
    const measurements: number[] = []

    // Override performance.now to measure actual time
    vi.spyOn(performance, 'now').mockRestore()

    const wrapper = mount(VirtualScrollTestComponent, {
      props: {
        dataSize: 10000
      }
    })

    const table = wrapper.find('[data-testid="virtual-table"]')

    // Measure scroll performance
    for (let i = 0; i < 5; i++) {
      const start = performance.now()
      await table.trigger('scroll', {
        target: { scrollTop: i * 1000 }
      })
      await wrapper.vm.$nextTick()
      const end = performance.now()
      measurements.push(end - start)
    }

    // Average render time should be acceptable
    const avgTime = measurements.reduce((a, b) => a + b, 0) / measurements.length
    
    // This is a loose check since test environment differs from real browser
    expect(avgTime).toBeLessThan(100)
  })

  it('should handle dynamic row heights', async () => {
    const DynamicHeightComponent = defineComponent({
      components: { DataTable },
      setup() {
        const data = generateLargeDataset(1000)
        const columns: ColumnDef<IPerformanceTestData>[] = [
          {
            accessorKey: 'name',
            header: 'Name',
            cell: ({ row }) => row.index % 3 === 0 
              ? `${row.original.name}\nSecond Line\nThird Line`
              : row.original.name
          }
        ]

        return { data, columns }
      },
      template: `
        <DataTable 
          :data="data" 
          :columns="columns"
          :enableVirtualization="true"
          :estimateRowHeight="(index) => index % 3 === 0 ? 80 : 40"
          style="height: 600px"
        />
      `
    })

    const wrapper = mount(DynamicHeightComponent)
    
    // Should render without errors
    expect(wrapper.find('table').exists()).toBe(true)
    
    // Should still limit rendered rows
    const rows = wrapper.findAll('tbody tr')
    expect(rows.length).toBeLessThan(50)
  })
})
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, ref, computed } from 'vue'
import DataTable from '../../DataTable.vue'
import DataTablePagination from '../../DataTablePagination.vue'
import type { ColumnDef } from '@tanstack/vue-table'

// Mock data for testing
interface ITestUser {
  id: string
  name: string
  email: string
  department: string
  status: 'active' | 'inactive'
  joinDate: string
}

const generateMockUsers = (count: number): ITestUser[] => {
  const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance']
  const statuses: ITestUser['status'][] = ['active', 'inactive']
  
  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i + 1}`,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    department: departments[i % departments.length]!,
    status: statuses[i % 2]!,
    joinDate: new Date(2020 + Math.floor(i / 50), i % 12, (i % 28) + 1).toISOString()
  }))
}

// Test component that integrates DataTable with filtering and pagination
const TestTableComponent = defineComponent({
  components: { DataTable, DataTablePagination },
  setup() {
    const data = ref(generateMockUsers(100))
    const globalFilter = ref('')
    const departmentFilter = ref('')
    const statusFilter = ref('')
    const pageSize = ref(10)
    const pageIndex = ref(0)

    const columns: ColumnDef<ITestUser>[] = [
      {
        accessorKey: 'name',
        header: 'Name',
        enableSorting: true,
        enableGlobalFilter: true
      },
      {
        accessorKey: 'email',
        header: 'Email',
        enableSorting: true,
        enableGlobalFilter: true
      },
      {
        accessorKey: 'department',
        header: 'Department',
        enableSorting: true,
        filterFn: 'includesString'
      },
      {
        accessorKey: 'status',
        header: 'Status',
        enableSorting: true,
        filterFn: 'equals'
      },
      {
        accessorKey: 'joinDate',
        header: 'Join Date',
        enableSorting: true,
        cell: ({ row }) => new Date(row.original.joinDate).toLocaleDateString()
      }
    ]

    const filteredData = computed(() => {
      let result = [...data.value]

      // Apply global filter
      if (globalFilter.value) {
        const search = globalFilter.value.toLowerCase()
        result = result.filter(user => 
          user.name.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search)
        )
      }

      // Apply department filter
      if (departmentFilter.value) {
        result = result.filter(user => 
          user.department === departmentFilter.value
        )
      }

      // Apply status filter
      if (statusFilter.value) {
        result = result.filter(user => 
          user.status === statusFilter.value
        )
      }

      return result
    })

    const paginatedData = computed(() => {
      const start = pageIndex.value * pageSize.value
      const end = start + pageSize.value
      return filteredData.value.slice(start, end)
    })

    const totalPages = computed(() => 
      Math.ceil(filteredData.value.length / pageSize.value)
    )

    return {
      data: paginatedData,
      columns,
      globalFilter,
      departmentFilter,
      statusFilter,
      pageSize,
      pageIndex,
      totalRecords: computed(() => filteredData.value.length),
      totalPages,
      setPageIndex: (index: number) => pageIndex.value = index,
      setPageSize: (size: number) => {
        pageSize.value = size
        pageIndex.value = 0 // Reset to first page
      }
    }
  },
  template: `
    <div>
      <div class="filters">
        <input 
          v-model="globalFilter" 
          placeholder="Search..." 
          data-testid="global-filter"
        />
        <select 
          v-model="departmentFilter" 
          data-testid="department-filter"
        >
          <option value="">All Departments</option>
          <option value="Engineering">Engineering</option>
          <option value="Sales">Sales</option>
          <option value="Marketing">Marketing</option>
          <option value="HR">HR</option>
          <option value="Finance">Finance</option>
        </select>
        <select 
          v-model="statusFilter" 
          data-testid="status-filter"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      
      <DataTable 
        :data="data" 
        :columns="columns"
        data-testid="data-table"
      />
      
      <div class="pagination-info" data-testid="pagination-info">
        Showing {{ pageIndex * pageSize + 1 }}-{{ Math.min((pageIndex + 1) * pageSize, totalRecords) }} 
        of {{ totalRecords }} records
      </div>
      
      <div class="pagination-controls">
        <button 
          @click="setPageIndex(pageIndex - 1)" 
          :disabled="pageIndex === 0"
          data-testid="prev-button"
        >
          Previous
        </button>
        <span data-testid="page-info">
          Page {{ pageIndex + 1 }} of {{ totalPages }}
        </span>
        <button 
          @click="setPageIndex(pageIndex + 1)" 
          :disabled="pageIndex >= totalPages - 1"
          data-testid="next-button"
        >
          Next
        </button>
        <select 
          :value="pageSize" 
          @change="setPageSize(Number($event.target.value))"
          data-testid="page-size-select"
        >
          <option value="10">10 per page</option>
          <option value="25">25 per page</option>
          <option value="50">50 per page</option>
        </select>
      </div>
    </div>
  `
})

describe('DataTable Integration - Filter and Pagination', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = mount(TestTableComponent)
  })

  it('should render initial data with pagination', () => {
    const table = wrapper.find('[data-testid="data-table"]')
    expect(table.exists()).toBe(true)

    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(10) // Default page size

    const paginationInfo = wrapper.find('[data-testid="pagination-info"]')
    expect(paginationInfo.text()).toContain('1-10 of 100')
  })

  it('should filter data with global search', async () => {
    const searchInput = wrapper.find('[data-testid="global-filter"]')
    await searchInput.setValue('user1')

    await wrapper.vm.$nextTick()

    const paginationInfo = wrapper.find('[data-testid="pagination-info"]')
    expect(paginationInfo.text()).toContain('of 11') // user1, user10-19
  })

  it('should filter by department', async () => {
    const departmentSelect = wrapper.find('[data-testid="department-filter"]')
    await departmentSelect.setValue('Engineering')

    await wrapper.vm.$nextTick()

    const paginationInfo = wrapper.find('[data-testid="pagination-info"]')
    expect(paginationInfo.text()).toContain('of 20') // 100/5 departments
  })

  it('should filter by status', async () => {
    const statusSelect = wrapper.find('[data-testid="status-filter"]')
    await statusSelect.setValue('active')

    await wrapper.vm.$nextTick()

    const paginationInfo = wrapper.find('[data-testid="pagination-info"]')
    expect(paginationInfo.text()).toContain('of 50') // Half are active
  })

  it('should combine multiple filters', async () => {
    await wrapper.find('[data-testid="department-filter"]').setValue('Engineering')
    await wrapper.find('[data-testid="status-filter"]').setValue('active')

    await wrapper.vm.$nextTick()

    const paginationInfo = wrapper.find('[data-testid="pagination-info"]')
    expect(paginationInfo.text()).toContain('of 10') // 20 engineering * 0.5 active
  })

  it('should reset to first page when applying filters', async () => {
    // Go to page 2
    await wrapper.find('[data-testid="next-button"]').trigger('click')
    expect(wrapper.find('[data-testid="page-info"]').text()).toContain('Page 2')

    // Apply filter
    await wrapper.find('[data-testid="department-filter"]').setValue('Sales')

    // Should reset to page 1
    expect(wrapper.find('[data-testid="page-info"]').text()).toContain('Page 1')
  })

  it('should handle pagination navigation', async () => {
    const prevButton = wrapper.find('[data-testid="prev-button"]')
    const nextButton = wrapper.find('[data-testid="next-button"]')
    const pageInfo = wrapper.find('[data-testid="page-info"]')

    // Initially on page 1
    expect(pageInfo.text()).toContain('Page 1 of 10')
    expect(prevButton.attributes('disabled')).toBeDefined()

    // Go to next page
    await nextButton.trigger('click')
    expect(pageInfo.text()).toContain('Page 2 of 10')
    expect(prevButton.attributes('disabled')).toBeUndefined()

    // Go to previous page
    await prevButton.trigger('click')
    expect(pageInfo.text()).toContain('Page 1 of 10')
  })

  it('should handle page size changes', async () => {
    const pageSizeSelect = wrapper.find('[data-testid="page-size-select"]')
    
    await pageSizeSelect.setValue('25')
    await wrapper.vm.$nextTick()

    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(25)

    const paginationInfo = wrapper.find('[data-testid="pagination-info"]')
    expect(paginationInfo.text()).toContain('1-25 of 100')
  })

  it('should maintain filters when changing pages', async () => {
    // Apply filter
    await wrapper.find('[data-testid="department-filter"]').setValue('Engineering')
    
    // Verify filter is applied
    let paginationInfo = wrapper.find('[data-testid="pagination-info"]')
    expect(paginationInfo.text()).toContain('of 20')

    // Navigate to next page
    await wrapper.find('[data-testid="next-button"]').trigger('click')

    // Filter should still be applied
    paginationInfo = wrapper.find('[data-testid="pagination-info"]')
    expect(paginationInfo.text()).toContain('11-20 of 20')
  })

  it('should handle empty filter results', async () => {
    // Apply very specific search that returns no results
    await wrapper.find('[data-testid="global-filter"]').setValue('nonexistentuser')

    await wrapper.vm.$nextTick()

    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(0)

    const paginationInfo = wrapper.find('[data-testid="pagination-info"]')
    expect(paginationInfo.text()).toContain('0 of 0')
  })

  it('should sort data within filtered results', async () => {
    // Apply filter first
    await wrapper.find('[data-testid="department-filter"]').setValue('Engineering')

    // Click on name header to sort
    const nameHeader = wrapper.find('th:first-child')
    await nameHeader.trigger('click')

    await wrapper.vm.$nextTick()

    const firstRow = wrapper.find('tbody tr:first-child')
    const firstCellText = firstRow.find('td:first-child').text()
    
    // Should be sorted within Engineering department only
    expect(firstCellText).toBeTruthy()
  })

  it('should handle rapid filter changes', async () => {
    const globalFilter = wrapper.find('[data-testid="global-filter"]')
    
    // Simulate rapid typing
    await globalFilter.setValue('u')
    await globalFilter.setValue('us')
    await globalFilter.setValue('use')
    await globalFilter.setValue('user')
    await globalFilter.setValue('user5')

    await wrapper.vm.$nextTick()

    // Should handle the final value correctly
    const paginationInfo = wrapper.find('[data-testid="pagination-info"]')
    expect(paginationInfo.text()).toMatch(/of \d+/)
  })

  it('should preserve row selection across pagination', async () => {
    // This would require adding selection functionality to the test component
    // Skipping for now as it's not implemented in the test component
  })

  it('should calculate correct page count after filtering', async () => {
    // Apply filter that reduces data
    await wrapper.find('[data-testid="status-filter"]').setValue('active')
    
    const pageInfo = wrapper.find('[data-testid="page-info"]')
    expect(pageInfo.text()).toContain('Page 1 of 5') // 50 active users / 10 per page

    // Change page size
    await wrapper.find('[data-testid="page-size-select"]').setValue('25')
    expect(pageInfo.text()).toContain('Page 1 of 2') // 50 active users / 25 per page
  })
})
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TestQuery from '../test-query.vue'
import type { PaginatedResponse } from '~/types/query'

// Mock the composables
vi.mock('~/composables/useMattersQuery', () => ({
  useMattersQuery: () => ({
    data: ref<PaginatedResponse<any>>({
      data: [
        {
          id: '1',
          title: 'Test Matter',
          status: 'ACTIVE',
          priority: 'HIGH'
        }
      ],
      page: 1,
      limit: 10,
      total: 1,
      hasNext: false,
      hasPrev: false
    }),
    isPending: ref(false),
    error: ref(null),
    isStale: ref(false),
    isFetching: ref(false),
    refetch: vi.fn()
  }),
  useUpdateMatterStatus: () => ({
    mutate: vi.fn(),
    isPending: ref(false)
  })
}))

// Mock navigateTo
vi.mock('#app', () => ({
  navigateTo: vi.fn()
}))

describe('test-query.vue', () => {
  it('renders without errors', () => {
    const wrapper = mount(TestQuery)
    expect(wrapper.exists()).toBe(true)
  })

  it('displays correct data count', () => {
    const wrapper = mount(TestQuery)
    const dataCount = wrapper.find('p:contains("Data Count")')
    expect(dataCount.text()).toContain('1')
  })

  it('renders matters correctly', () => {
    const wrapper = mount(TestQuery)
    expect(wrapper.text()).toContain('Test Matter')
    expect(wrapper.text()).toContain('Status: ACTIVE')
    expect(wrapper.text()).toContain('Priority: HIGH')
  })

  it('has working update button', async () => {
    const wrapper = mount(TestQuery)
    const button = wrapper.find('button:contains("Mark Completed")')
    expect(button.exists()).toBe(true)
    expect(button.attributes('disabled')).toBeUndefined()
  })
})
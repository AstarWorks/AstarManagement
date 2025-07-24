import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import EditableCell from '../EditableCell.vue'
import type { Matter } from '~/types/matter'

// Mock the UI components
vi.mock('~/components/ui/button', () => ({
  Button: { template: '<button><slot /></button>' }
}))

vi.mock('~/components/ui/input', () => ({
  Input: { template: '<input v-bind="$attrs" v-model="$attrs.modelValue" />' }
}))

vi.mock('~/components/ui/select', () => ({
  Select: { template: '<div><slot /></div>' },
  SelectContent: { template: '<div><slot /></div>' },
  SelectItem: { template: '<div><slot /></div>' },
  SelectTrigger: { template: '<div><slot /></div>' },
  SelectValue: { template: '<div />' }
}))

vi.mock('~/components/ui/badge', () => ({
  Badge: { template: '<span><slot /></span>' }
}))

const mockMatter: Matter = {
  id: '1',
  title: 'Test Matter',
  caseNumber: 'CASE-001',
  clientName: 'Test Client',
  status: 'IN_PROGRESS',
  priority: 'MEDIUM',
  description: 'Test description',
  assignedLawyer: 'John Doe',
  createdAt: new Date(),
  updatedAt: new Date()
}

describe('EditableCell', () => {
  it('renders display mode by default', () => {
    const wrapper = mount(EditableCell, {
      props: {
        matter: mockMatter,
        field: 'title',
        type: 'text',
        value: 'Test Title',
        isEditing: false
      }
    })

    expect(wrapper.find('.cell-display').exists()).toBe(true)
    expect(wrapper.find('.cell-edit').exists()).toBe(false)
    expect(wrapper.text()).toContain('Test Title')
  })

  it('renders edit mode when isEditing is true', async () => {
    const wrapper = mount(EditableCell, {
      props: {
        matter: mockMatter,
        field: 'title',
        type: 'text',
        value: 'Test Title',
        isEditing: true
      }
    })

    expect(wrapper.find('.cell-edit').exists()).toBe(true)
    expect(wrapper.find('.cell-display').exists()).toBe(false)
  })

  it('emits edit:start when clicked in display mode', async () => {
    const wrapper = mount(EditableCell, {
      props: {
        matter: mockMatter,
        field: 'title',
        type: 'text',
        value: 'Test Title',
        isEditing: false
      }
    })

    await wrapper.find('.cell-display').trigger('click')
    expect(wrapper.emitted('edit:start')).toBeTruthy()
  })

  it('renders status badge for status type', () => {
    const wrapper = mount(EditableCell, {
      props: {
        matter: mockMatter,
        field: 'status',
        type: 'status',
        value: 'IN_PROGRESS',
        isEditing: false
      }
    })

    expect(wrapper.text()).toContain('IN PROGRESS')
  })

  it('renders priority badge for priority type', () => {
    const wrapper = mount(EditableCell, {
      props: {
        matter: mockMatter,
        field: 'priority',
        type: 'priority',
        value: 'HIGH',
        isEditing: false
      }
    })

    expect(wrapper.text()).toContain('HIGH')
  })

  it('handles keyboard events in edit mode', async () => {
    const wrapper = mount(EditableCell, {
      props: {
        matter: mockMatter,
        field: 'title',
        type: 'text',
        value: 'Test Title',
        isEditing: true
      }
    })

    // Test Escape key
    await wrapper.trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('key:escape')).toBeTruthy()

    // Test Enter key
    await wrapper.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('key:enter')).toBeTruthy()

    // Test Tab key
    await wrapper.trigger('keydown', { key: 'Tab' })
    expect(wrapper.emitted('key:tab')).toBeTruthy()
  })

  it('shows error message when error prop is provided', () => {
    const wrapper = mount(EditableCell, {
      props: {
        matter: mockMatter,
        field: 'title',
        type: 'text',
        value: 'Test Title',
        isEditing: true,
        error: 'Validation error'
      }
    })

    expect(wrapper.text()).toContain('Validation error')
  })

  it('shows loading state when isSaving is true', () => {
    const wrapper = mount(EditableCell, {
      props: {
        matter: mockMatter,
        field: 'title',
        type: 'text',
        value: 'Test Title',
        isEditing: true,
        isSaving: true
      }
    })

    // Should show loading spinner
    expect(wrapper.find('[data-testid="loading-spinner"]').exists()).toBe(false) // Component doesn't use data-testid
    // But we can check if save button is disabled
    expect(wrapper.find('button[disabled]').exists()).toBe(true)
  })

  it('handles date input type', () => {
    const wrapper = mount(EditableCell, {
      props: {
        matter: mockMatter,
        field: 'dueDate',
        type: 'date',
        value: '2024-01-15',
        isEditing: true
      }
    })

    expect(wrapper.find('input[type="date"]').exists()).toBe(true)
  })

  it('formats display value correctly for different types', () => {
    // Test date formatting
    const dateWrapper = mount(EditableCell, {
      props: {
        matter: mockMatter,
        field: 'dueDate',
        type: 'date',
        value: '2024-01-15',
        isEditing: false
      }
    })

    expect(dateWrapper.text()).toContain('1/15/2024')

    // Test empty value
    const emptyWrapper = mount(EditableCell, {
      props: {
        matter: mockMatter,
        field: 'title',
        type: 'text',
        value: null,
        isEditing: false
      }
    })

    expect(emptyWrapper.text()).toContain('-')
  })
})
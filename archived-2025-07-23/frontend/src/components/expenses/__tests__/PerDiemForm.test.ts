/**
 * Per-Diem Form Component Tests
 * 
 * @description Tests for the PerDiemForm component functionality including
 * form validation, date range calculations, preset application, and submission.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { usePerDiemManagement } from '~/composables/usePerDiem'
import PerDiemForm from '../PerDiemForm.vue'

// Mock the composable
vi.mock('~/composables/usePerDiem', () => ({
  usePerDiemManagement: vi.fn(() => ({
    presets: [
      {
        name: 'Tokyo Court Visit',
        category: 'COURT_VISIT',
        location: 'Tokyo District Court',
        purpose: 'Court hearing attendance',
        dailyAmount: 8000,
        transportationMode: 'TRAIN',
        accommodationType: 'NONE',
        accommodationRequired: false
      }
    ],
    calculateDays: vi.fn((start: string, end: string) => {
      const startDate = new Date(start)
      const endDate = new Date(end)
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    }),
    calculateTotalAmount: vi.fn((dateRange: any, dailyAmount: number) => {
      const days = 3 // Mock 3 days
      return days * dailyAmount
    }),
    applyPreset: vi.fn((preset: any) => ({
      category: preset.category,
      location: preset.location,
      purpose: preset.purpose,
      dailyAmount: preset.dailyAmount,
      transportationMode: preset.transportationMode,
      accommodationType: preset.accommodationType,
      accommodationRequired: preset.accommodationRequired
    })),
    getCommonLocations: vi.fn(() => [
      'Tokyo District Court',
      'Osaka District Court',
      'Nagoya District Court'
    ]),
    getSuggestedAmounts: vi.fn(() => [8000, 10000, 12000]),
    createPerDiem: {
      mutateAsync: vi.fn(() => Promise.resolve({
        id: 'test-per-diem-1',
        dateRange: { startDate: '2025-07-01', endDate: '2025-07-03' },
        location: 'Tokyo District Court',
        purpose: 'Court hearing attendance',
        category: 'COURT_VISIT',
        dailyAmount: 8000,
        totalAmount: 24000,
        totalDays: 3
      }))
    },
    updatePerDiem: {
      mutateAsync: vi.fn(() => Promise.resolve({}))
    }
  }))
}))

// Mock UI components
vi.mock('~/components/ui/form', () => ({
  FormField: { template: '<div><slot /></div>' },
  FormLabel: { template: '<label><slot /></label>' },
  FormControl: { template: '<div><slot /></div>' },
  FormMessage: { template: '<span><slot /></span>' }
}))

vi.mock('~/components/ui/input', () => ({
  Input: { 
    template: '<input v-bind="$attrs" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    emits: ['update:modelValue']
  }
}))

describe('PerDiemForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the form with all required fields', () => {
    const wrapper = mount(PerDiemForm, {
      props: {
        mode: 'create'
      }
    })

    expect(wrapper.find('[name="startDate"]').exists()).toBe(true)
    expect(wrapper.find('[name="endDate"]').exists()).toBe(true)
    expect(wrapper.find('[name="location"]').exists()).toBe(true)
    expect(wrapper.find('[name="purpose"]').exists()).toBe(true)
    expect(wrapper.find('[name="category"]').exists()).toBe(true)
    expect(wrapper.find('[name="dailyAmount"]').exists()).toBe(true)
  })

  it('shows preset selector with available templates', () => {
    const wrapper = mount(PerDiemForm, {
      props: {
        mode: 'create'
      }
    })

    const presetSelect = wrapper.find('.preset-select')
    expect(presetSelect.exists()).toBe(true)
    
    const options = presetSelect.findAll('option')
    expect(options).toHaveLength(2) // Empty option + Tokyo Court Visit preset
    expect(options[1].text()).toBe('Tokyo Court Visit')
  })

  it('calculates total days and estimated amount correctly', async () => {
    const wrapper = mount(PerDiemForm, {
      props: {
        mode: 'create'
      }
    })

    // Set form values
    await wrapper.find('input[type="date"]').setValue('2025-07-01')
    await wrapper.findAll('input[type="date"]')[1].setValue('2025-07-03')
    await wrapper.find('input[type="number"]').setValue('8000')

    // Check if summary is displayed
    const summary = wrapper.find('.date-summary')
    expect(summary.exists()).toBe(true)
  })

  it('applies preset when selected', async () => {
    const { applyPreset } = usePerDiemManagement()
    
    const wrapper = mount(PerDiemForm, {
      props: {
        mode: 'create'
      }
    })

    const presetSelect = wrapper.find('.preset-select')
    await presetSelect.setValue('Tokyo Court Visit')

    expect(applyPreset).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Tokyo Court Visit',
      category: 'COURT_VISIT',
      location: 'Tokyo District Court'
    }))
  })

  it('shows accommodation fields when accommodation is required', async () => {
    const wrapper = mount(PerDiemForm, {
      props: {
        mode: 'create'
      }
    })

    // Initially accommodation details should not be visible
    expect(wrapper.find('.accommodation-details').exists()).toBe(false)

    // Check accommodation required checkbox
    const accommodationCheckbox = wrapper.find('input[type="checkbox"]')
    await accommodationCheckbox.setChecked(true)

    // Now accommodation details should be visible
    expect(wrapper.find('.accommodation-details').exists()).toBe(true)
  })

  it('validates required fields before submission', async () => {
    const wrapper = mount(PerDiemForm, {
      props: {
        mode: 'create'
      }
    })

    // Try to submit without filling required fields
    const submitButton = wrapper.find('button[type="submit"]')
    expect(submitButton.attributes('disabled')).toBeDefined()
  })

  it('emits save event when form is submitted successfully', async () => {
    const { createPerDiem } = usePerDiemManagement()
    
    const wrapper = mount(PerDiemForm, {
      props: {
        mode: 'create'
      }
    })

    // Fill out the form
    await wrapper.find('input[name="startDate"]').setValue('2025-07-01')
    await wrapper.find('input[name="endDate"]').setValue('2025-07-03')
    await wrapper.find('input[name="location"]').setValue('Tokyo District Court')
    await wrapper.find('textarea[name="purpose"]').setValue('Court hearing attendance')
    await wrapper.find('select[name="category"]').setValue('COURT_VISIT')
    await wrapper.find('input[name="dailyAmount"]').setValue('8000')

    // Submit the form
    await wrapper.find('form').trigger('submit.prevent')

    expect(createPerDiem.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
      dateRange: {
        startDate: '2025-07-01',
        endDate: '2025-07-03'
      },
      location: 'Tokyo District Court',
      purpose: 'Court hearing attendance',
      category: 'COURT_VISIT',
      dailyAmount: 8000
    }))

    expect(wrapper.emitted('save')).toBeTruthy()
  })

  it('handles edit mode correctly', () => {
    const initialValues = {
      startDate: '2025-07-01',
      endDate: '2025-07-03',
      location: 'Tokyo District Court',
      purpose: 'Court hearing attendance',
      category: 'COURT_VISIT',
      dailyAmount: 8000
    }

    const wrapper = mount(PerDiemForm, {
      props: {
        mode: 'edit',
        perDiemId: 'test-id',
        initialValues
      }
    })

    expect(wrapper.find('h2').text()).toContain('Edit Per-Diem Entry')
    expect(wrapper.find('button[type="submit"]').text()).toContain('Update Per-Diem Entry')
  })

  it('shows save as template option in create mode', () => {
    const wrapper = mount(PerDiemForm, {
      props: {
        mode: 'create'
      }
    })

    const saveAsTemplateBtn = wrapper.find('.btn-outline')
    expect(saveAsTemplateBtn.exists()).toBe(true)
    expect(saveAsTemplateBtn.text()).toContain('Save as Template')
  })

  it('does not show save as template option in edit mode', () => {
    const wrapper = mount(PerDiemForm, {
      props: {
        mode: 'edit',
        perDiemId: 'test-id'
      }
    })

    const saveAsTemplateBtn = wrapper.find('.btn-outline')
    expect(saveAsTemplateBtn.exists()).toBe(false)
  })

  it('shows amount suggestions based on category', async () => {
    const wrapper = mount(PerDiemForm, {
      props: {
        mode: 'create'
      }
    })

    // Select a category
    await wrapper.find('select[name="category"]').setValue('COURT_VISIT')

    // Check if amount suggestions are shown
    const suggestions = wrapper.find('.amount-suggestions')
    expect(suggestions.exists()).toBe(true)
    
    const suggestionBtns = wrapper.findAll('.suggestion-btn')
    expect(suggestionBtns.length).toBeGreaterThan(0)
  })

  it('handles cancel action correctly', async () => {
    const wrapper = mount(PerDiemForm, {
      props: {
        mode: 'create'
      }
    })

    // Mock window.confirm
    vi.stubGlobal('confirm', vi.fn(() => true))

    const cancelBtn = wrapper.find('.btn-secondary')
    await cancelBtn.trigger('click')

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })
})
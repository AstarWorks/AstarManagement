import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import MatterDateFields from '../MatterDateFields.vue'

// Mock the form components
vi.mock('~/components/forms', () => ({
  FormFieldWrapper: {
    template: '<div class="form-wrapper"><label v-if="label">{{ label }}<span v-if="required"> *</span></label><div class="description" v-if="description">{{ description }}</div><slot /></div>',
    props: ['label', 'description', 'required']
  },
  FormDatePicker: {
    template: '<input type="date" :name="name" :placeholder="placeholder" :min="min" :max="max" :error="error" />',
    props: ['name', 'placeholder', 'min', 'max', 'error']
  }
}))

// Mock UI components
vi.mock('~/components/ui/alert', () => ({
  Alert: {
    template: '<div class="alert" :class="variant"><slot /></div>',
    props: ['variant']
  },
  AlertDescription: {
    template: '<div class="alert-description"><slot /></div>'
  }
}))

vi.mock('~/components/ui/badge', () => ({
  Badge: {
    template: '<span class="badge" :class="variant"><slot /></span>',
    props: ['variant']
  }
}))

// Mock lucide icons
vi.mock('lucide-vue-next', () => ({
  Calendar: { template: '<svg class="calendar-icon"></svg>' },
  AlertTriangle: { template: '<svg class="alert-triangle-icon"></svg>' },
  Info: { template: '<svg class="info-icon"></svg>' }
}))

// Mock vee-validate
const mockUseField = vi.fn()
vi.mock('vee-validate', () => ({
  useField: mockUseField
}))

describe('MatterDateFields', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock implementation for useField
    mockUseField.mockReturnValue({
      value: '',
      setValue: vi.fn(),
      errorMessage: '',
      meta: { touched: false, dirty: false, valid: true }
    })
  })

  it('renders with default props', () => {
    const wrapper = mount(MatterDateFields)
    
    expect(wrapper.find('.matter-date-fields').exists()).toBe(true)
    expect(wrapper.text()).toContain('Matter Open Date')
    expect(wrapper.text()).toContain('Matter Close Date')
  })

  it('passes correct props to FormDatePicker components', () => {
    const wrapper = mount(MatterDateFields, {
      props: {
        openDateName: 'customOpenDate',
        closeDateName: 'customCloseDate',
        openDateError: 'Open date error',
        closeDateError: 'Close date error'
      }
    })

    const datePickers = wrapper.findAllComponents({ name: 'FormDatePicker' })
    expect(datePickers).toHaveLength(2)
    
    // Open date picker
    expect(datePickers[0].props('name')).toBe('customOpenDate')
    expect(datePickers[0].props('error')).toBe('Open date error')
    expect(datePickers[0].props('placeholder')).toBe('Select open date...')
    
    // Close date picker
    expect(datePickers[1].props('name')).toBe('customCloseDate')
    expect(datePickers[1].props('error')).toBe('Close date error')
    expect(datePickers[1].props('placeholder')).toBe('Select close date (optional)...')
  })

  it('calculates duration correctly when both dates are provided', () => {
    // Mock useField to return specific dates
    mockUseField
      .mockReturnValueOnce({ value: '2024-01-01' })  // openDate
      .mockReturnValueOnce({ value: '2024-01-31' })  // closeDate

    const wrapper = mount(MatterDateFields)
    const component = wrapper.vm as any

    const duration = component.matterDuration
    expect(duration).not.toBeNull()
    expect(duration.days).toBe(30)
    expect(duration.months).toBe(1)
    expect(duration.years).toBe(0)
  })

  it('shows duration display when both dates are set', () => {
    mockUseField
      .mockReturnValueOnce({ value: '2024-01-01' })  // openDate
      .mockReturnValueOnce({ value: '2024-02-01' })  // closeDate

    const wrapper = mount(MatterDateFields)
    
    expect(wrapper.text()).toContain('Matter Duration')
    expect(wrapper.find('.badge').exists()).toBe(true)
  })

  it('formats duration correctly for different time spans', () => {
    const wrapper = mount(MatterDateFields)
    const component = wrapper.vm as any

    // Test days only
    let duration = { days: 5, months: 0, years: 0 }
    expect(component.formatDuration(duration)).toBe('5 days')

    // Test single day
    duration = { days: 1, months: 0, years: 0 }
    expect(component.formatDuration(duration)).toBe('1 day')

    // Test months only
    duration = { days: 31, months: 1, years: 0 }
    expect(component.formatDuration(duration)).toBe('1 month')

    // Test multiple months
    duration = { days: 62, months: 2, years: 0 }
    expect(component.formatDuration(duration)).toBe('2 months')

    // Test years and months
    duration = { days: 365, months: 14, years: 1 }
    expect(component.formatDuration(duration)).toBe('1 year, 2 months')

    // Test multiple years
    duration = { days: 730, months: 25, years: 2 }
    expect(component.formatDuration(duration)).toBe('2 years, 1 month')
  })

  it('shows validation warnings for invalid date combinations', () => {
    mockUseField
      .mockReturnValueOnce({ value: '2024-01-31' })  // openDate (after close date)
      .mockReturnValueOnce({ value: '2024-01-01' })  // closeDate (before open date)

    const wrapper = mount(MatterDateFields)
    const component = wrapper.vm as any

    const warnings = component.dateValidationWarnings
    expect(warnings).toHaveLength(1)
    expect(warnings[0].type).toBe('error')
    expect(warnings[0].message).toBe('Close date must be after open date')
  })

  it('shows warning for future open date', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 10)
    
    mockUseField
      .mockReturnValueOnce({ value: futureDate.toISOString().split('T')[0] })  // openDate in future
      .mockReturnValueOnce({ value: '' })  // closeDate

    const wrapper = mount(MatterDateFields)
    const component = wrapper.vm as any

    const warnings = component.dateValidationWarnings
    expect(warnings.some((w: any) => w.message === 'Matter open date is in the future')).toBe(true)
  })

  it('shows warning for very long duration', () => {
    mockUseField
      .mockReturnValueOnce({ value: '2020-01-01' })  // openDate (4+ years ago)
      .mockReturnValueOnce({ value: '2024-12-31' })  // closeDate

    const wrapper = mount(MatterDateFields)
    const component = wrapper.vm as any

    const warnings = component.dateValidationWarnings
    expect(warnings.some((w: any) => w.message.includes('exceeds 3 years'))).toBe(true)
  })

  it('shows warning for very short duration', () => {
    mockUseField
      .mockReturnValueOnce({ value: '2024-01-01' })  // openDate
      .mockReturnValueOnce({ value: '2024-01-01' })  // closeDate (same day)

    const wrapper = mount(MatterDateFields)
    const component = wrapper.vm as any

    const warnings = component.dateValidationWarnings
    expect(warnings.some((w: any) => w.message.includes('less than 1 day'))).toBe(true)
  })

  it('calculates date constraints correctly', () => {
    const today = new Date().toISOString().split('T')[0]
    
    mockUseField
      .mockReturnValueOnce({ value: '2024-01-01' })  // openDate
      .mockReturnValueOnce({ value: '2024-06-01' })  // closeDate

    const wrapper = mount(MatterDateFields)
    const component = wrapper.vm as any

    // Max open date should be today or close date, whichever is earlier
    const maxOpenDate = component.maxOpenDate
    expect(maxOpenDate).toBe('2024-06-01')

    // Min close date should be open date
    const minCloseDate = component.minCloseDate
    expect(minCloseDate).toBe('2024-01-01')
  })

  it('shows date guidelines when expanded', async () => {
    const wrapper = mount(MatterDateFields)
    
    const details = wrapper.find('details')
    expect(details.exists()).toBe(true)
    
    const summary = wrapper.find('summary')
    expect(summary.text()).toContain('Date field guidelines')
    
    // Simulate clicking to expand
    await summary.trigger('click')
    await nextTick()
    
    expect(wrapper.text()).toContain('Open Date:')
    expect(wrapper.text()).toContain('Usually the date the matter was initiated')
    expect(wrapper.text()).toContain('Close Date:')
    expect(wrapper.text()).toContain('Optional field for ongoing matters')
    expect(wrapper.text()).toContain('Business Rules:')
  })

  it('displays validation warnings when showWarnings is true', () => {
    mockUseField
      .mockReturnValueOnce({ value: '2024-01-31' })  // openDate
      .mockReturnValueOnce({ value: '2024-01-01' })  // closeDate (invalid)

    const wrapper = mount(MatterDateFields, {
      props: {
        showWarnings: true
      }
    })

    expect(wrapper.findComponent({ name: 'Alert' }).exists()).toBe(true)
    expect(wrapper.text()).toContain('Close date must be after open date')
  })

  it('hides validation warnings when showWarnings is false', () => {
    mockUseField
      .mockReturnValueOnce({ value: '2024-01-31' })  // openDate
      .mockReturnValueOnce({ value: '2024-01-01' })  // closeDate (invalid)

    const wrapper = mount(MatterDateFields, {
      props: {
        showWarnings: false
      }
    })

    expect(wrapper.findComponent({ name: 'Alert' }).exists()).toBe(false)
  })

  it('applies required styling when required prop is true', () => {
    const wrapper = mount(MatterDateFields, {
      props: {
        required: true
      }
    })

    const formWrappers = wrapper.findAllComponents({ name: 'FormFieldWrapper' })
    expect(formWrappers[0].props('required')).toBe(true)  // Open date
    expect(formWrappers[1].props('required')).toBe(false) // Close date (always optional)
  })

  it('uses default field names when not provided', () => {
    const wrapper = mount(MatterDateFields)
    
    const datePickers = wrapper.findAllComponents({ name: 'FormDatePicker' })
    expect(datePickers[0].props('name')).toBe('openDate')
    expect(datePickers[1].props('name')).toBe('closeDate')
  })

  it('handles null duration correctly', () => {
    mockUseField
      .mockReturnValueOnce({ value: '' })  // openDate (empty)
      .mockReturnValueOnce({ value: '' })  // closeDate (empty)

    const wrapper = mount(MatterDateFields)
    const component = wrapper.vm as any

    expect(component.matterDuration).toBeNull()
    expect(component.formatDuration(null)).toBe('')
  })

  it('has proper accessibility attributes', () => {
    const wrapper = mount(MatterDateFields)
    
    const details = wrapper.find('details')
    expect(details.exists()).toBe(true)
    expect(details.classes()).toContain('cursor-pointer')
  })

  it('matches snapshot', () => {
    mockUseField
      .mockReturnValueOnce({ value: '2024-01-01' })
      .mockReturnValueOnce({ value: '2024-06-01' })

    const wrapper = mount(MatterDateFields, {
      props: {
        required: true,
        showWarnings: true
      }
    })
    
    expect(wrapper.html()).toMatchSnapshot()
  })
})
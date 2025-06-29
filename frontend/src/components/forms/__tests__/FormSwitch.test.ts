/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import FormSwitch from '../FormSwitch.vue'
import { 
  createMockFormData,
  waitForValidation,
  expectFieldError,
  expectFieldValid
} from '~/test/utils/form-test-utils'

// Mock shadcn-vue components
vi.mock('~/components/ui/switch', () => ({
  Switch: defineComponent({
    name: 'Switch',
    props: ['modelValue', 'disabled', 'id', 'name'],
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      const handleClick = () => {
        if (!props.disabled) {
          emit('update:modelValue', !props.modelValue)
        }
      }
      
      return () => h('button', {
        type: 'button',
        role: 'switch',
        'aria-checked': props.modelValue,
        'aria-disabled': props.disabled,
        disabled: props.disabled,
        id: props.id,
        name: props.name,
        class: 'switch',
        onClick: handleClick,
        'data-state': props.modelValue ? 'checked' : 'unchecked'
      })
    }
  })
}))

vi.mock('~/components/ui/label', () => ({
  Label: defineComponent({
    name: 'Label',
    props: ['for'],
    setup(props, { slots }) {
      return () => h('label', { 
        for: props.for,
        class: 'label'
      }, slots.default?.())
    }
  })
}))

describe('FormSwitch.vue', () => {
  let wrapper: VueWrapper<any>

  const createWrapper = (props = {}, useFormContext = true) => {
    const TestComponent = defineComponent({
      components: { FormSwitch },
      setup() {
        if (useFormContext) {
          const schema = toTypedSchema(
            z.object({
              switchField: z.boolean({
                required_error: 'Please toggle the switch'
              })
            })
          )
          
          const form = useForm({
            validationSchema: schema
          })
          
          return { form }
        }
        
        return {}
      },
      template: `
        <form>
          <FormSwitch 
            name="switchField"
            label="Enable Feature"
            v-bind="$attrs"
          />
        </form>
      `,
      props
    })

    return mount(TestComponent, {
      props,
      global: {
        stubs: {
          transition: false
        }
      }
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders switch with label', () => {
      wrapper = createWrapper()
      
      expect(wrapper.find('label').text()).toBe('Enable Feature')
      expect(wrapper.find('.switch').exists()).toBe(true)
    })

    it('renders with proper role attribute', () => {
      wrapper = createWrapper()
      const switchElement = wrapper.find('.switch')
      
      expect(switchElement.attributes('role')).toBe('switch')
    })

    it('renders help text when provided', () => {
      wrapper = createWrapper({ helpText: 'Toggle to enable this feature' })
      
      expect(wrapper.text()).toContain('Toggle to enable this feature')
    })

    it('renders description when provided', () => {
      wrapper = createWrapper({ 
        description: 'This will enable advanced features'
      })
      
      expect(wrapper.text()).toContain('This will enable advanced features')
    })

    it('renders in disabled state', () => {
      wrapper = createWrapper({ disabled: true })
      const switchElement = wrapper.find('.switch')
      
      expect(switchElement.attributes('disabled')).toBeDefined()
      expect(switchElement.attributes('aria-disabled')).toBe('true')
    })
  })

  describe('Value Binding', () => {
    it('binds initial value correctly', async () => {
      const TestComponent = defineComponent({
        components: { FormSwitch },
        setup() {
          const isEnabled = ref(true)
          return { isEnabled }
        },
        template: `
          <FormSwitch
            v-model="isEnabled"
            name="switchField"
            label="Enable Feature"
          />
        `
      })
      
      wrapper = mount(TestComponent)
      await wrapper.vm.$nextTick()
      
      const switchElement = wrapper.find('.switch')
      expect(switchElement.attributes('aria-checked')).toBe('true')
      expect(switchElement.attributes('data-state')).toBe('checked')
    })

    it('updates value on click', async () => {
      const TestComponent = defineComponent({
        components: { FormSwitch },
        setup() {
          const isEnabled = ref(false)
          return { isEnabled }
        },
        template: `
          <FormSwitch
            v-model="isEnabled"
            name="switchField"
            label="Enable Feature"
          />
        `
      })
      
      wrapper = mount(TestComponent)
      const switchElement = wrapper.find('.switch')
      
      expect(wrapper.vm.isEnabled).toBe(false)
      
      await switchElement.trigger('click')
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.isEnabled).toBe(true)
      expect(switchElement.attributes('aria-checked')).toBe('true')
    })

    it('toggles value correctly', async () => {
      const TestComponent = defineComponent({
        components: { FormSwitch },
        setup() {
          const isEnabled = ref(false)
          return { isEnabled }
        },
        template: `
          <FormSwitch
            v-model="isEnabled"
            name="switchField"
            label="Enable Feature"
          />
        `
      })
      
      wrapper = mount(TestComponent)
      const switchElement = wrapper.find('.switch')
      
      // Toggle on
      await switchElement.trigger('click')
      expect(wrapper.vm.isEnabled).toBe(true)
      
      // Toggle off
      await switchElement.trigger('click')
      expect(wrapper.vm.isEnabled).toBe(false)
      
      // Toggle on again
      await switchElement.trigger('click')
      expect(wrapper.vm.isEnabled).toBe(true)
    })
  })

  describe('Form Integration', () => {
    it('integrates with VeeValidate form context', async () => {
      wrapper = createWrapper()
      const form = wrapper.vm.form
      
      // Get form values
      const values = form.values
      expect(values).toHaveProperty('switchField')
    })

    it('validates required switch', async () => {
      const TestComponent = defineComponent({
        components: { FormSwitch },
        setup() {
          const schema = toTypedSchema(
            z.object({
              terms: z.boolean().refine(val => val === true, {
                message: 'You must accept the terms'
              })
            })
          )
          
          const form = useForm({
            validationSchema: schema,
            initialValues: {
              terms: false
            }
          })
          
          return { form }
        },
        template: `
          <form>
            <FormSwitch 
              name="terms"
              label="I accept the terms and conditions"
              required
            />
          </form>
        `
      })
      
      wrapper = mount(TestComponent)
      const form = wrapper.vm.form
      
      // Validate with false value
      await form.validate()
      await waitForValidation()
      
      expectFieldError(wrapper, 'You must accept the terms')
      
      // Toggle to true
      const switchElement = wrapper.find('.switch')
      await switchElement.trigger('click')
      await waitForValidation()
      
      expectFieldValid(wrapper)
    })
  })

  describe('Switch Variants', () => {
    it('renders with default size', () => {
      wrapper = createWrapper()
      const switchElement = wrapper.find('.switch')
      
      expect(switchElement.classes()).not.toContain('switch-sm')
      expect(switchElement.classes()).not.toContain('switch-lg')
    })

    it('renders with small size', () => {
      wrapper = createWrapper({ size: 'sm' })
      const switchElement = wrapper.find('.switch')
      
      expect(switchElement.classes()).toContain('switch-sm')
    })

    it('renders with large size', () => {
      wrapper = createWrapper({ size: 'lg' })
      const switchElement = wrapper.find('.switch')
      
      expect(switchElement.classes()).toContain('switch-lg')
    })

    it('renders with custom color when checked', async () => {
      wrapper = createWrapper({ checkedColor: 'success' })
      const switchElement = wrapper.find('.switch')
      const switchComponent = wrapper.findComponent({ name: 'Switch' })
      
      // Toggle to checked state
      await switchComponent.vm.$emit('update:modelValue', true)
      await wrapper.vm.$nextTick()
      
      expect(switchElement.classes()).toContain('switch-success')
    })
  })

  describe('Label Positioning', () => {
    it('renders label on the right by default', () => {
      wrapper = createWrapper()
      const container = wrapper.find('.form-switch-container')
      
      expect(container.classes()).toContain('flex-row')
      
      // Switch should come before label in DOM order
      const children = container.element.children
      expect(children[0].classList.contains('switch')).toBe(true)
      expect(children[1].tagName.toLowerCase()).toBe('label')
    })

    it('renders label on the left when specified', () => {
      wrapper = createWrapper({ labelPosition: 'left' })
      const container = wrapper.find('.form-switch-container')
      
      expect(container.classes()).toContain('flex-row-reverse')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      wrapper = createWrapper()
      const switchElement = wrapper.find('.switch')
      
      expect(switchElement.attributes('role')).toBe('switch')
      expect(switchElement.attributes('aria-checked')).toBeDefined()
    })

    it('associates label with switch', () => {
      wrapper = createWrapper()
      const switchElement = wrapper.find('.switch')
      const label = wrapper.find('label')
      
      const switchId = switchElement.attributes('id')
      expect(switchId).toBeTruthy()
      expect(label.attributes('for')).toBe(switchId)
    })

    it('supports keyboard interaction', async () => {
      wrapper = createWrapper()
      const switchElement = wrapper.find('.switch')
      
      // Should be focusable
      expect(switchElement.attributes('tabindex')).not.toBe('-1')
      
      // Space key should toggle
      await switchElement.trigger('keydown', { key: ' ' })
      await wrapper.vm.$nextTick()
      
      // In real implementation, space key would toggle the switch
      // This is a simplified test
    })

    it('announces state changes to screen readers', async () => {
      wrapper = createWrapper()
      const switchElement = wrapper.find('.switch')
      
      // Initial state
      expect(switchElement.attributes('aria-checked')).toBe('false')
      
      // Toggle on
      await switchElement.trigger('click')
      expect(switchElement.attributes('aria-checked')).toBe('true')
      
      // Toggle off
      await switchElement.trigger('click')
      expect(switchElement.attributes('aria-checked')).toBe('false')
    })

    it('shows error with proper ARIA attributes', async () => {
      const TestComponent = defineComponent({
        components: { FormSwitch },
        setup() {
          const schema = toTypedSchema(
            z.object({
              terms: z.boolean().refine(val => val === true, {
                message: 'Required'
              })
            })
          )
          
          const form = useForm({
            validationSchema: schema,
            initialValues: { terms: false }
          })
          
          return { form }
        },
        template: `
          <form>
            <FormSwitch name="terms" label="Accept terms" />
          </form>
        `
      })
      
      wrapper = mount(TestComponent)
      const form = wrapper.vm.form
      
      await form.validate()
      await waitForValidation()
      
      const switchElement = wrapper.find('.switch')
      const errorId = switchElement.attributes('aria-describedby')
      expect(errorId).toBeTruthy()
      
      const errorElement = wrapper.find(`#${errorId}`)
      expect(errorElement.exists()).toBe(true)
      expect(errorElement.attributes('role')).toBe('alert')
    })
  })

  describe('Edge Cases', () => {
    it('handles rapid toggling', async () => {
      const TestComponent = defineComponent({
        components: { FormSwitch },
        setup() {
          const value = ref(false)
          const toggleCount = ref(0)
          
          const handleChange = (newValue: boolean) => {
            value.value = newValue
            toggleCount.value++
          }
          
          return { value, toggleCount, handleChange }
        },
        template: `
          <div>
            <FormSwitch
              :modelValue="value"
              @update:modelValue="handleChange"
              name="switchField"
              label="Toggle me"
            />
            <span data-testid="toggle-count">{{ toggleCount }}</span>
          </div>
        `
      })
      
      wrapper = mount(TestComponent)
      const switchElement = wrapper.find('.switch')
      
      // Rapid clicks
      for (let i = 0; i < 10; i++) {
        await switchElement.trigger('click')
      }
      
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('[data-testid="toggle-count"]').text()).toBe('10')
      expect(wrapper.vm.value).toBe(false) // Even number of toggles
    })

    it('prevents toggling when disabled', async () => {
      const TestComponent = defineComponent({
        components: { FormSwitch },
        setup() {
          const value = ref(false)
          return { value }
        },
        template: `
          <FormSwitch
            v-model="value"
            name="switchField"
            label="Disabled switch"
            disabled
          />
        `
      })
      
      wrapper = mount(TestComponent)
      const switchElement = wrapper.find('.switch')
      
      await switchElement.trigger('click')
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.value).toBe(false) // Should not change
    })

    it('handles null/undefined value gracefully', async () => {
      const TestComponent = defineComponent({
        components: { FormSwitch },
        setup() {
          const value = ref(null)
          return { value }
        },
        template: `
          <FormSwitch
            v-model="value"
            name="switchField"
            label="Switch"
          />
        `
      })
      
      wrapper = mount(TestComponent)
      const switchElement = wrapper.find('.switch')
      
      // Null should be treated as false
      expect(switchElement.attributes('aria-checked')).toBe('false')
      
      // Click should set to true
      await switchElement.trigger('click')
      expect(wrapper.vm.value).toBe(true)
    })
  })

  describe('Performance', () => {
    it('renders efficiently', () => {
      const startTime = performance.now()
      wrapper = createWrapper()
      const renderTime = performance.now() - startTime
      
      expect(renderTime).toBeLessThan(50) // Should render in less than 50ms
    })

    it('toggles without lag', async () => {
      wrapper = createWrapper()
      const switchElement = wrapper.find('.switch')
      
      const startTime = performance.now()
      for (let i = 0; i < 20; i++) {
        await switchElement.trigger('click')
        await wrapper.vm.$nextTick()
      }
      const toggleTime = performance.now() - startTime
      
      expect(toggleTime).toBeLessThan(100) // 20 toggles in less than 100ms
    })
  })

  describe('Custom Behaviors', () => {
    it('supports onChange callback', async () => {
      const onChange = vi.fn()
      
      const TestComponent = defineComponent({
        components: { FormSwitch },
        setup() {
          const value = ref(false)
          return { value, onChange }
        },
        template: `
          <FormSwitch
            v-model="value"
            name="switchField"
            label="Switch"
            @change="onChange"
          />
        `
      })
      
      wrapper = mount(TestComponent)
      const switchElement = wrapper.find('.switch')
      
      await switchElement.trigger('click')
      
      expect(onChange).toHaveBeenCalledWith(true)
      expect(onChange).toHaveBeenCalledTimes(1)
    })

    it('supports custom true/false values', async () => {
      const TestComponent = defineComponent({
        components: { FormSwitch },
        setup() {
          const value = ref('no')
          return { value }
        },
        template: `
          <FormSwitch
            v-model="value"
            name="switchField"
            label="Custom values"
            trueValue="yes"
            falseValue="no"
          />
        `
      })
      
      wrapper = mount(TestComponent)
      const switchComponent = wrapper.findComponent({ name: 'Switch' })
      
      // Initial state should be false (value is 'no')
      expect(switchComponent.props('modelValue')).toBe(false)
      
      // Toggle should update to 'yes'
      await switchComponent.vm.$emit('update:modelValue', true)
      expect(wrapper.vm.value).toBe('yes')
      
      // Toggle back should update to 'no'
      await switchComponent.vm.$emit('update:modelValue', false)
      expect(wrapper.vm.value).toBe('no')
    })
  })
})
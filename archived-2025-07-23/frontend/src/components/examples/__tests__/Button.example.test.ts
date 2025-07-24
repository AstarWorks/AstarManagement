/**
 * Example: Basic Component Testing
 * 
 * This example demonstrates testing patterns for a simple Button component
 * including props validation, event handling, and slots.
 */

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'

// Example Button component for testing demonstration
const Button = defineComponent({
  name: 'Button',
  props: {
    variant: {
      type: String,
      default: 'default'
    },
    size: {
      type: String,
      default: 'default'
    },
    disabled: Boolean
  },
  emits: ['click'],
  setup(props, { emit }) {
    const handleClick = () => {
      if (!props.disabled) {
        emit('click')
      }
    }
    return { handleClick }
  },
  template: `
    <button
      :class="[
        'inline-flex items-center justify-center',
        variant === 'destructive' && 'bg-destructive text-destructive-foreground',
        variant === 'outline' && 'border',
        variant === 'ghost' && 'hover:bg-accent',
        variant === 'default' && 'bg-primary',
        size === 'sm' && 'h-9 px-3',
        size === 'default' && 'h-10 px-4'
      ]"
      :disabled="disabled"
      :aria-disabled="disabled"
      @click="handleClick"
    >
      <slot />
    </button>
  `
})

describe('Button Component - Basic Testing Example', () => {
  // Basic rendering test
  it('renders with default props', () => {
    const wrapper = mount(Button)
    
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.classes()).toContain('inline-flex')
  })

  // Props testing
  it('applies variant classes correctly', () => {
    const wrapper = mount(Button, {
      props: {
        variant: 'destructive'
      }
    })
    
    expect(wrapper.classes()).toContain('bg-destructive')
    expect(wrapper.classes()).toContain('text-destructive-foreground')
  })

  // Slot testing
  it('renders slot content', () => {
    const wrapper = mount(Button, {
      slots: {
        default: 'Click me'
      }
    })
    
    expect(wrapper.text()).toBe('Click me')
  })

  // Event testing
  it('emits click event when clicked', async () => {
    const wrapper = mount(Button)
    
    await wrapper.trigger('click')
    
    expect(wrapper.emitted()).toHaveProperty('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  // Disabled state testing
  it('prevents click events when disabled', async () => {
    const onClick = vi.fn()
    const wrapper = mount(Button, {
      props: {
        disabled: true
      },
      attrs: {
        onClick
      }
    })
    
    await wrapper.trigger('click')
    
    expect(onClick).not.toHaveBeenCalled()
  })

  // Accessibility testing
  it('has proper ARIA attributes', () => {
    const wrapper = mount(Button, {
      props: {
        disabled: true
      }
    })
    
    expect(wrapper.attributes('aria-disabled')).toBe('true')
  })

  // Multiple props combination
  it('combines size and variant correctly', () => {
    const wrapper = mount(Button, {
      props: {
        variant: 'outline',
        size: 'sm'
      }
    })
    
    expect(wrapper.classes()).toContain('border')
    expect(wrapper.classes()).toContain('h-9')
    expect(wrapper.classes()).toContain('px-3')
  })

  // Dynamic props testing
  it('updates classes when props change', async () => {
    const wrapper = mount(Button, {
      props: {
        variant: 'default'
      }
    })
    
    expect(wrapper.classes()).toContain('bg-primary')
    
    await wrapper.setProps({ variant: 'ghost' })
    
    expect(wrapper.classes()).not.toContain('bg-primary')
    expect(wrapper.classes()).toContain('hover:bg-accent')
  })
})
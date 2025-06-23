import type { Meta, StoryObj } from '@storybook/vue3'
import { ref, onMounted, watch, computed } from 'vue'
import { useTouchGestures, useMobileInteractions } from './useTouchGestures'

const TouchGestureDemo = {
  name: 'TouchGestureDemo',
  setup() {
    const demoRef = ref<HTMLElement>()
    const events = ref<string[]>([])
    
    const addEvent = (event: string) => {
      events.value.unshift(`${new Date().toLocaleTimeString()}: ${event}`)
      if (events.value.length > 10) {
        events.value.pop()
      }
    }
    
    const {
      isPressed,
      isPinching,
      isLongPress,
      swipeDirection,
      pinchScale,
      dragPosition,
      dragOffset,
      velocity,
      reset
    } = useTouchGestures(demoRef, {
      enableHapticFeedback: true,
      longPressTime: 500,
      swipeThreshold: 50,
      pinchThreshold: 0.1
    })
    
    const {
      isTouchDevice,
      orientation,
      safeAreaInsets,
      isIOS,
      isAndroid,
      useTouchClick
    } = useMobileInteractions()
    
    // Watch for gesture changes
    watch(isPressed, (pressed) => {
      addEvent(pressed ? 'Touch started' : 'Touch ended')
    })
    
    watch(isPinching, (pinching) => {
      addEvent(pinching ? 'Pinch started' : 'Pinch ended')
    })
    
    watch(isLongPress, (longPress) => {
      if (longPress) addEvent('Long press detected')
    })
    
    watch(swipeDirection, (direction) => {
      if (direction) addEvent(`Swiped ${direction}`)
    })
    
    watch(pinchScale, (scale) => {
      if (scale !== 1) addEvent(`Pinch scale: ${scale.toFixed(2)}`)
    })
    
    const handleReset = useTouchClick(() => {
      reset()
      events.value = []
      addEvent('Gestures reset')
    })
    
    const transformStyle = computed(() => {
      return `translate(-50%, -50%) translate(${dragOffset.value[0]}px, ${dragOffset.value[1]}px) scale(${pinchScale.value})`
    })
    
    return {
      demoRef,
      events,
      isPressed,
      isPinching,
      isLongPress,
      swipeDirection,
      pinchScale,
      dragPosition,
      dragOffset,
      velocity,
      isTouchDevice,
      orientation,
      safeAreaInsets,
      isIOS,
      isAndroid,
      handleReset,
      transformStyle
    }
  },
  template: `
    <div style="width: 100vw; height: 100vh; background: #f8fafc; position: relative; overflow: hidden;">
      <!-- Device info panel -->
      <div 
        style="
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(0,0,0,0.9);
          color: white;
          padding: 12px;
          border-radius: 8px;
          font-size: 12px;
          z-index: 100;
          min-width: 200px;
        "
      >
        <div style="font-weight: 600; margin-bottom: 8px;">📱 Device Info:</div>
        <div>Touch Device: {{ isTouchDevice ? 'Yes' : 'No' }}</div>
        <div>Platform: {{ isIOS ? 'iOS' : isAndroid ? 'Android' : 'Other' }}</div>
        <div>Orientation: {{ orientation }}</div>
        <div v-if="safeAreaInsets.top > 0">Safe Area: {{ safeAreaInsets.top }}px top</div>
      </div>
      
      <!-- Gesture state panel -->
      <div 
        style="
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(0,0,0,0.9);
          color: white;
          padding: 12px;
          border-radius: 8px;
          font-size: 12px;
          z-index: 100;
          min-width: 180px;
        "
      >
        <div style="font-weight: 600; margin-bottom: 8px;">🎯 Gesture State:</div>
        <div :style="{ color: isPressed ? '#10b981' : '#6b7280' }">
          Pressed: {{ isPressed ? 'Yes' : 'No' }}
        </div>
        <div :style="{ color: isPinching ? '#10b981' : '#6b7280' }">
          Pinching: {{ isPinching ? 'Yes' : 'No' }}
        </div>
        <div :style="{ color: isLongPress ? '#10b981' : '#6b7280' }">
          Long Press: {{ isLongPress ? 'Yes' : 'No' }}
        </div>
        <div v-if="swipeDirection" style="color: #10b981;">
          Swipe: {{ swipeDirection }}
        </div>
        <div v-if="pinchScale !== 1" style="color: #10b981;">
          Scale: {{ pinchScale.toFixed(2) }}
        </div>
        <div v-if="velocity > 0" style="color: #10b981;">
          Velocity: {{ velocity.toFixed(1) }}
        </div>
      </div>
      
      <!-- Main gesture area -->
      <div 
        ref="demoRef"
        style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 300px;
          height: 300px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 18px;
          font-weight: 600;
          text-align: center;
          cursor: pointer;
          user-select: none;
          touch-action: none;
          transition: transform 0.2s ease;
        "
        :style="{
          transform: transformStyle,
          boxShadow: isPressed ? '0 20px 40px rgba(0,0,0,0.3)' : '0 10px 20px rgba(0,0,0,0.2)',
          background: isPressed ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : 
                     isPinching ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' :
                     isLongPress ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' :
                     'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }"
      >
        <div>
          <div style="margin-bottom: 8px;">🤚 Touch & Gesture Area</div>
          <div style="font-size: 12px; opacity: 0.9;">
            Touch • Swipe • Pinch • Long Press
          </div>
          <div v-if="dragPosition[0] !== 0 || dragPosition[1] !== 0" style="font-size: 10px; margin-top: 8px; opacity: 0.8;">
            Position: {{ dragPosition[0] }}, {{ dragPosition[1] }}
          </div>
        </div>
      </div>
      
      <!-- Reset button -->
      <button
        @click="handleReset"
        style="
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: #3b82f6;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          z-index: 100;
        "
      >
        🔄 Reset Gestures
      </button>
      
      <!-- Event log -->
      <div 
        style="
          position: absolute;
          bottom: 20px;
          left: 20px;
          background: rgba(255,255,255,0.95);
          border-radius: 8px;
          padding: 12px;
          max-width: 300px;
          max-height: 200px;
          overflow-y: auto;
          font-size: 12px;
          z-index: 100;
        "
      >
        <div style="font-weight: 600; margin-bottom: 8px; color: #374151;">📝 Event Log:</div>
        <div v-if="events.length === 0" style="color: #6b7280; font-style: italic;">
          No events yet. Try interacting with the gesture area!
        </div>
        <div v-else>
          <div 
            v-for="event in events" 
            :key="event" 
            style="margin-bottom: 2px; font-family: monospace; color: #374151;"
          >
            {{ event }}
          </div>
        </div>
      </div>
      
      <!-- Instructions -->
      <div 
        style="
          position: absolute;
          bottom: 20px;
          right: 20px;
          background: rgba(0,0,0,0.8);
          color: white;
          padding: 12px;
          border-radius: 8px;
          font-size: 12px;
          max-width: 200px;
          z-index: 100;
        "
      >
        <div style="font-weight: 600; margin-bottom: 8px;">📖 Instructions:</div>
        <div style="line-height: 1.4;">
          • Single tap: Basic touch<br>
          • Drag: Move the element<br>
          • Long press: Hold for 500ms<br>
          • Swipe: Quick directional move<br>
          • Pinch: Two-finger zoom<br>
          • Reset: Clear all states
        </div>
      </div>
    </div>
  `
}

const meta: Meta<typeof TouchGestureDemo> = {
  title: 'Composables/useTouchGestures',
  component: TouchGestureDemo,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Comprehensive touch gesture detection composable using @vueuse/gesture for advanced mobile interactions. Supports drag, pinch, swipe, long press, and device detection.'
      }
    }
  },
  tags: ['autodocs']
}

export default meta
type Story = StoryObj<typeof meta>

export const InteractiveDemo: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Interactive demonstration of all touch gesture capabilities including visual feedback and event logging.'
      }
    }
  }
}

export const MobileDevice: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Optimized for mobile devices with touch-specific interactions and haptic feedback.'
      }
    }
  }
}

export const TabletDevice: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet'
    },
    docs: {
      description: {
        story: 'Tablet-optimized view with larger gesture area and enhanced multi-touch support.'
      }
    }
  }
}

export const DesktopFallback: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop'
    },
    docs: {
      description: {
        story: 'Desktop fallback showing how touch gestures degrade gracefully to mouse interactions.'
      }
    }
  }
}

// Component for gesture-specific demos
const GestureSpecificDemo = {
  name: 'GestureSpecificDemo',
  props: {
    gestureType: String,
    title: String,
    description: String
  },
  setup(props) {
    const demoRef = ref<HTMLElement>()
    const gestureState = ref('')
    const gestureData = ref<any>({})
    
    const { 
      isPressed, 
      isPinching, 
      isLongPress, 
      swipeDirection, 
      pinchScale, 
      dragOffset,
      velocity 
    } = useTouchGestures(demoRef, {
      enableHapticFeedback: true,
      longPressTime: 600
    })
    
    watch([isPressed, isPinching, isLongPress, swipeDirection, pinchScale, dragOffset, velocity], () => {
      switch (props.gestureType) {
        case 'drag':
          if (isPressed.value) {
            gestureState.value = 'Dragging'
            gestureData.value = { offset: dragOffset.value, velocity: velocity.value }
          } else {
            gestureState.value = 'Ready to drag'
            gestureData.value = {}
          }
          break
        case 'pinch':
          if (isPinching.value) {
            gestureState.value = 'Pinching'
            gestureData.value = { scale: pinchScale.value }
          } else {
            gestureState.value = 'Ready to pinch'
            gestureData.value = {}
          }
          break
        case 'longpress':
          if (isLongPress.value) {
            gestureState.value = 'Long press detected!'
            gestureData.value = { duration: '600ms+' }
          } else {
            gestureState.value = 'Press and hold'
            gestureData.value = {}
          }
          break
        case 'swipe':
          if (swipeDirection.value) {
            gestureState.value = `Swiped ${swipeDirection.value}`
            gestureData.value = { direction: swipeDirection.value, velocity: velocity.value }
          } else {
            gestureState.value = 'Ready to swipe'
            gestureData.value = {}
          }
          break
      }
    })
    
    const gestureTransform = computed(() => {
      switch (props.gestureType) {
        case 'drag':
          return `translate(${dragOffset.value[0]}px, ${dragOffset.value[1]}px)`
        case 'pinch':
          return `scale(${pinchScale.value})`
        default:
          return 'none'
      }
    })
    
    return {
      demoRef,
      gestureState,
      gestureData,
      isPressed,
      isPinching,
      isLongPress,
      swipeDirection,
      pinchScale,
      dragOffset,
      gestureTransform
    }
  },
  template: `
    <div style="width: 100vw; height: 100vh; background: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;">
      <div style="text-align: center; margin-bottom: 40px; max-width: 400px;">
        <h2 style="margin: 0 0 8px 0; font-size: 24px; color: #1f2937;">{{ title }}</h2>
        <p style="margin: 0; color: #6b7280; font-size: 16px;">{{ description }}</p>
      </div>
      
      <div 
        ref="demoRef"
        style="
          width: 250px;
          height: 250px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 18px;
          font-weight: 600;
          text-align: center;
          cursor: pointer;
          user-select: none;
          touch-action: none;
          transition: all 0.2s ease;
          margin-bottom: 30px;
        "
        :style="{
          transform: gestureTransform,
          background: isPressed || isPinching || isLongPress ? 
                     'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' :
                     'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: isPressed || isPinching || isLongPress ? 
                    '0 20px 40px rgba(0,0,0,0.3)' : 
                    '0 10px 20px rgba(0,0,0,0.2)'
        }"
      >
        <div>
          <div style="margin-bottom: 8px;">{{ gestureType === 'drag' ? '👆' : gestureType === 'pinch' ? '🤏' : gestureType === 'longpress' ? '⏱️' : '👋' }}</div>
          <div style="font-size: 14px;">{{ gestureState }}</div>
        </div>
      </div>
      
      <div 
        style="
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          min-width: 300px;
          text-align: center;
        "
      >
        <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #374151;">Gesture Data</h3>
        <div v-if="Object.keys(gestureData).length === 0" style="color: #6b7280; font-style: italic;">
          No gesture data
        </div>
        <div v-else style="font-family: monospace; font-size: 14px; color: #374151;">
          <div v-for="(value, key) in gestureData" :key="key" style="margin-bottom: 4px;">
            <strong>{{ key }}:</strong> {{ typeof value === 'object' ? JSON.stringify(value) : value }}
          </div>
        </div>
      </div>
    </div>
  `
}

export const DragGesture: Story = {
  render: () => ({
    components: { GestureSpecificDemo },
    template: `
      <GestureSpecificDemo
        gestureType="drag"
        title="Drag Gesture"
        description="Touch and drag to move the element. Watch the offset and velocity values update."
      />
    `
  }),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Demonstrates drag gesture detection with real-time offset and velocity tracking.'
      }
    }
  }
}

export const PinchGesture: Story = {
  render: () => ({
    components: { GestureSpecificDemo },
    template: `
      <GestureSpecificDemo
        gestureType="pinch"
        title="Pinch Gesture" 
        description="Use two fingers to pinch and zoom the element. Scale values are tracked in real-time."
      />
    `
  }),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Demonstrates pinch-to-zoom gesture with scale tracking and visual feedback.'
      }
    }
  }
}

export const LongPressGesture: Story = {
  render: () => ({
    components: { GestureSpecificDemo },
    template: `
      <GestureSpecificDemo
        gestureType="longpress"
        title="Long Press Gesture"
        description="Press and hold for 600ms to trigger the long press gesture with haptic feedback."
      />
    `
  }),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Demonstrates long press detection with configurable timing and haptic feedback.'
      }
    }
  }
}

export const SwipeGesture: Story = {
  render: () => ({
    components: { GestureSpecificDemo },
    template: `
      <GestureSpecificDemo
        gestureType="swipe"
        title="Swipe Gesture"
        description="Quickly swipe in any direction (up, down, left, right) to trigger directional detection."
      />
    `
  }),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Demonstrates directional swipe detection with velocity tracking and direction identification.'
      }
    }
  }
}
/**
 * Animation Constants for Aster Management
 * 
 * Defines timing, easing curves, and motion tokens following Material Design principles
 * All animations are optimized for 60fps performance and accessibility
 */

// Animation Durations (in milliseconds)
export const ANIMATION_DURATION = {
  instant: 0,
  fast: 150,
  normal: 200,
  moderate: 300,
  slow: 400,
  verySlow: 600,
  // Specific use cases
  dragStart: 150,
  dragEnd: 200,
  cardExpand: 300,
  modalOpen: 250,
  toastShow: 150,
  skeletonPulse: 1500,
} as const

// Easing Functions (CSS cubic-bezier values)
export const ANIMATION_EASING = {
  // Standard eases
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  
  // Material Design easing curves
  standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)', // Standard curve
  decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)', // Enter/expand
  accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)', // Exit/collapse
  sharp: 'cubic-bezier(0.4, 0.0, 0.6, 1)', // Quick actions
  
  // Custom curves
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  elastic: 'cubic-bezier(0.68, -0.55, 0.265, 1.25)',
  smooth: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
} as const

// Animation Delays
export const ANIMATION_DELAY = {
  none: 0,
  short: 50,
  normal: 100,
  long: 200,
  stagger: 50, // For list animations
} as const

// Spring Physics (for gesture-based animations)
export const SPRING_CONFIG = {
  default: {
    tension: 200,
    friction: 25,
    mass: 1,
  },
  gentle: {
    tension: 120,
    friction: 14,
    mass: 1,
  },
  wobbly: {
    tension: 180,
    friction: 12,
    mass: 1,
  },
  stiff: {
    tension: 400,
    friction: 40,
    mass: 1,
  },
} as const

// GPU-Accelerated Properties
export const GPU_ACCELERATED_PROPS = [
  'transform',
  'opacity',
  'filter',
  'backdrop-filter',
] as const

// Animation Classes
export const ANIMATION_CLASSES = {
  // Transitions
  fadeIn: 'animate-fade-in',
  fadeOut: 'animate-fade-out',
  slideIn: 'animate-slide-in',
  slideOut: 'animate-slide-out',
  scaleIn: 'animate-scale-in',
  scaleOut: 'animate-scale-out',
  
  // Micro-interactions
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  shake: 'animate-shake',
  spin: 'animate-spin',
  ping: 'animate-ping',
  
  // Skeleton loading
  skeleton: 'animate-skeleton',
  shimmer: 'animate-shimmer',
} as const

// Performance Thresholds
export const PERFORMANCE_THRESHOLDS = {
  targetFPS: 60,
  maxFrameTime: 16, // ms (1000/60)
  jankThreshold: 100, // ms
  animationBudget: 200, // ms total
} as const

// Reduced Motion Queries
export const MOTION_QUERIES = {
  prefersReducedMotion: '(prefers-reduced-motion: reduce)',
  prefersReducedTransparency: '(prefers-reduced-transparency: reduce)',
  prefersContrast: '(prefers-contrast: high)',
} as const

// Animation Presets for common patterns
export const ANIMATION_PRESETS = {
  // Card animations
  cardHover: {
    duration: ANIMATION_DURATION.fast,
    easing: ANIMATION_EASING.standard,
    properties: ['transform', 'box-shadow'],
  },
  cardDrag: {
    duration: ANIMATION_DURATION.dragStart,
    easing: ANIMATION_EASING.sharp,
    properties: ['transform', 'opacity'],
  },
  cardDrop: {
    duration: ANIMATION_DURATION.dragEnd,
    easing: ANIMATION_EASING.decelerate,
    properties: ['transform'],
  },
  
  // List animations
  listItemEnter: {
    duration: ANIMATION_DURATION.normal,
    easing: ANIMATION_EASING.decelerate,
    delay: ANIMATION_DELAY.stagger,
    properties: ['transform', 'opacity'],
  },
  listItemExit: {
    duration: ANIMATION_DURATION.fast,
    easing: ANIMATION_EASING.accelerate,
    properties: ['transform', 'opacity'],
  },
  
  // Modal animations
  modalEnter: {
    duration: ANIMATION_DURATION.modalOpen,
    easing: ANIMATION_EASING.decelerate,
    properties: ['transform', 'opacity'],
  },
  modalExit: {
    duration: ANIMATION_DURATION.fast,
    easing: ANIMATION_EASING.accelerate,
    properties: ['transform', 'opacity'],
  },
} as const

// CSS Custom Properties for runtime control
export const CSS_ANIMATION_VARS = {
  '--animation-duration': '200ms',
  '--animation-easing': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  '--animation-delay': '0ms',
  '--animation-fill-mode': 'both',
  '--animation-play-state': 'running',
} as const

// Transition configurations for Vue TransitionGroup
export const VUE_TRANSITION_CONFIGS = {
  fade: {
    name: 'fade',
    mode: 'out-in',
    duration: ANIMATION_DURATION.normal,
  },
  slide: {
    name: 'slide',
    mode: 'out-in',
    duration: ANIMATION_DURATION.normal,
  },
  scale: {
    name: 'scale',
    mode: 'out-in',
    duration: ANIMATION_DURATION.fast,
  },
  list: {
    name: 'list',
    tag: 'div',
    moveClass: 'list-move',
    duration: ANIMATION_DURATION.normal,
  },
} as const

// Export utility function to get CSS variables
export function getAnimationCSSVars(preset?: keyof typeof ANIMATION_PRESETS) {
  if (!preset) return CSS_ANIMATION_VARS
  
  const config = ANIMATION_PRESETS[preset]
  return {
    '--animation-duration': `${config.duration}ms`,
    '--animation-easing': config.easing,
    '--animation-delay': `${(config as any).delay || 0}ms`,
  }
}

// Export types
export type AnimationDuration = typeof ANIMATION_DURATION[keyof typeof ANIMATION_DURATION]
export type AnimationEasing = typeof ANIMATION_EASING[keyof typeof ANIMATION_EASING]
export type AnimationPreset = keyof typeof ANIMATION_PRESETS
/**
 * Component Type Definitions
 * 
 * @description Global type definitions for Vue components,
 * including shadcn-vue component props and utilities.
 */

import type { ClassValue } from 'clsx'

// Utility function types
declare global {
  /**
   * Class name utility function for merging Tailwind classes
   */
  function cn(...inputs: ClassValue[]): string
}

// Component prop types
export interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
}

export interface BadgeProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

export interface CardProps {
  class?: string
}

export interface InputProps {
  type?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  error?: boolean
  modelValue?: string | number
}

export interface SelectProps {
  placeholder?: string
  disabled?: boolean
  modelValue?: string | number
  options?: Array<{
    label: string
    value: string | number
    disabled?: boolean
  }>
}

// Theme types
export type Theme = 'light' | 'dark' | 'system'

export interface ThemeConfig {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  isDark: boolean
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

// Mobile detection types
export interface MobileConfig {
  isMobile: boolean
}

export {}
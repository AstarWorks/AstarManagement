'use client'

import { ReactNode, useMemo } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Props for the ConditionalField component
 */
export interface ConditionalFieldProps {
  /** Function to determine if field should be shown */
  showWhen: (values: any) => boolean
  /** Form instance from react-hook-form */
  form: UseFormReturn<any>
  /** Children to render when condition is met */
  children: ReactNode
  /** Whether to animate the show/hide transition */
  animate?: boolean
  /** Whether to unmount children when hidden */
  unmountOnHide?: boolean
  /** Custom animation variants */
  animationVariants?: {
    hidden: any
    visible: any
  }
  /** Animation duration in seconds */
  duration?: number
  /** Whether to clear field values when hidden */
  clearOnHide?: boolean
  /** Field names to clear when hidden */
  clearFields?: string[]
}

/**
 * Default animation variants for field transitions
 */
const defaultVariants = {
  hidden: {
    opacity: 0,
    height: 0,
    marginTop: 0,
    marginBottom: 0,
    paddingTop: 0,
    paddingBottom: 0,
    overflow: 'hidden'
  },
  visible: {
    opacity: 1,
    height: 'auto',
    marginTop: 'initial',
    marginBottom: 'initial',
    paddingTop: 'initial',
    paddingBottom: 'initial',
    overflow: 'visible'
  }
}

/**
 * A component that conditionally renders form fields based on form values
 * 
 * @param props - Component props
 * @returns The conditional field component
 */
export function ConditionalField({
  showWhen,
  form,
  children,
  animate = true,
  unmountOnHide = true,
  animationVariants = defaultVariants,
  duration = 0.3,
  clearOnHide = true,
  clearFields = []
}: ConditionalFieldProps) {
  // Watch form values to determine visibility
  const formValues = form.watch()
  const shouldShow = useMemo(() => showWhen(formValues), [showWhen, formValues])

  // Clear fields when hidden
  const clearFieldValues = () => {
    if (!clearOnHide) return

    if (clearFields.length > 0) {
      // Clear specific fields
      clearFields.forEach(field => {
        form.setValue(field as any, undefined)
      })
    } else {
      // Auto-detect and clear fields from children
      // This is a best-effort approach - may not work for all complex cases
      try {
        const formState = form.getValues()
        const fieldsToCheck = Object.keys(formState)
        
        // For now, we'll just unregister all fields since we can't easily detect
        // which fields belong to this conditional component
        // This is a limitation compared to the Vue version
      } catch (error) {
        console.warn('Failed to auto-clear conditional fields:', error)
      }
    }
  }

  // Handle field clearing when component becomes hidden
  const handleAnimationComplete = (variant: string) => {
    if (variant === 'hidden' && clearOnHide) {
      clearFieldValues()
    }
  }

  if (!animate) {
    // Simple show/hide without animation
    if (!shouldShow) {
      if (clearOnHide) {
        clearFieldValues()
      }
      return unmountOnHide ? null : <div style={{ display: 'none' }}>{children}</div>
    }
    return <>{children}</>
  }

  return (
    <AnimatePresence mode="wait" onExitComplete={() => handleAnimationComplete('hidden')}>
      {shouldShow && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={animationVariants}
          transition={{ duration, ease: 'easeInOut' }}
          onAnimationComplete={handleAnimationComplete}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * A simpler conditional field without animations
 */
export function SimpleConditionalField({
  showWhen,
  form,
  children,
  clearOnHide = false,
  clearFields = []
}: Pick<ConditionalFieldProps, 'showWhen' | 'form' | 'children' | 'clearOnHide' | 'clearFields'>) {
  return (
    <ConditionalField
      showWhen={showWhen}
      form={form}
      animate={false}
      clearOnHide={clearOnHide}
      clearFields={clearFields}
    >
      {children}
    </ConditionalField>
  )
}

/**
 * Hook for creating conditional field logic
 * 
 * @param form - React Hook Form instance
 * @param condition - Function to determine visibility
 * @returns Object with show state and helper functions
 */
export function useConditionalField(
  form: UseFormReturn<any>,
  condition: (values: any) => boolean
) {
  const formValues = form.watch()
  const shouldShow = useMemo(() => condition(formValues), [condition, formValues])

  return {
    shouldShow,
    formValues,
    createConditionalField: (children: ReactNode, options?: Partial<ConditionalFieldProps>) => (
      <ConditionalField
        showWhen={condition}
        form={form}
        {...options}
      >
        {children}
      </ConditionalField>
    )
  }
}

/**
 * Higher-order component for conditional fields
 */
export function withConditionalField<P extends object>(
  Component: React.ComponentType<P>,
  condition: (values: any) => boolean,
  options?: Partial<ConditionalFieldProps>
) {
  return function ConditionalFieldWrapper(props: P & { form: UseFormReturn<any> }) {
    const { form, ...componentProps } = props
    
    return (
      <ConditionalField
        showWhen={condition}
        form={form}
        {...options}
      >
        <Component {...(componentProps as P)} />
      </ConditionalField>
    )
  }
}

/**
 * Utility function to create common conditional logic
 */
export const conditionalLogic = {
  /** Show when a field equals a specific value */
  equals: (fieldName: string, value: any) => (values: any) => values[fieldName] === value,
  
  /** Show when a field does not equal a specific value */
  notEquals: (fieldName: string, value: any) => (values: any) => values[fieldName] !== value,
  
  /** Show when a field is truthy */
  isTrue: (fieldName: string) => (values: any) => !!values[fieldName],
  
  /** Show when a field is falsy */
  isFalse: (fieldName: string) => (values: any) => !values[fieldName],
  
  /** Show when a field is not empty */
  isNotEmpty: (fieldName: string) => (values: any) => {
    const value = values[fieldName]
    return value !== null && value !== undefined && value !== ''
  },
  
  /** Show when a field is empty */
  isEmpty: (fieldName: string) => (values: any) => {
    const value = values[fieldName]
    return value === null || value === undefined || value === ''
  },
  
  /** Show when a field contains a specific value (for arrays) */
  contains: (fieldName: string, value: any) => (values: any) => {
    const fieldValue = values[fieldName]
    return Array.isArray(fieldValue) && fieldValue.includes(value)
  },
  
  /** Show when multiple conditions are all true (AND) */
  and: (...conditions: Array<(values: any) => boolean>) => (values: any) =>
    conditions.every(condition => condition(values)),
  
  /** Show when at least one condition is true (OR) */
  or: (...conditions: Array<(values: any) => boolean>) => (values: any) =>
    conditions.some(condition => condition(values)),
  
  /** Show when condition is false (NOT) */
  not: (condition: (values: any) => boolean) => (values: any) => !condition(values),
  
  /** Show when field value is in a list of values */
  in: (fieldName: string, values: any[]) => (formValues: any) =>
    values.includes(formValues[fieldName]),
  
  /** Show when field value matches a pattern */
  matches: (fieldName: string, pattern: RegExp) => (values: any) => {
    const value = values[fieldName]
    return typeof value === 'string' && pattern.test(value)
  }
}

// Export types
export type ConditionalLogic = typeof conditionalLogic
export type ConditionFunction = (values: any) => boolean
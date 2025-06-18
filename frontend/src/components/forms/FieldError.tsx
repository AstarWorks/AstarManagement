/**
 * Field-level validation error display components
 * 
 * @description Provides consistent field validation error display across
 * the application with internationalization support and accessibility features.
 * Integrates with react-hook-form and Zod validation patterns.
 */

'use client'

import { AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FieldValidationError {
  field: string
  message: string
  type?: 'error' | 'warning' | 'info'
  code?: string
}

interface FieldErrorProps {
  error?: string | FieldValidationError
  className?: string
  variant?: 'error' | 'warning' | 'info'
  showIcon?: boolean
}

/**
 * Individual field error display component
 */
export function FieldError({ 
  error, 
  className, 
  variant = 'error',
  showIcon = true 
}: FieldErrorProps) {
  if (!error) return null

  const errorMessage = typeof error === 'string' ? error : error.message
  const errorType = typeof error === 'string' ? variant : (error.type || variant)

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return AlertTriangle
      case 'info':
        return Info
      default:
        return AlertCircle
    }
  }

  const getStyles = (type: string) => {
    switch (type) {
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'info':
        return 'text-blue-600 dark:text-blue-400'
      default:
        return 'text-red-600 dark:text-red-400'
    }
  }

  const Icon = getIcon(errorType)

  return (
    <div 
      className={cn(
        'flex items-start gap-1 text-sm mt-1',
        getStyles(errorType),
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {showIcon && <Icon className="size-4 mt-0.5 flex-shrink-0" />}
      <span>{errorMessage}</span>
    </div>
  )
}

interface FieldErrorListProps {
  errors: FieldValidationError[]
  className?: string
  maxVisible?: number
  showFieldNames?: boolean
}

/**
 * Multiple field errors display component
 */
export function FieldErrorList({ 
  errors, 
  className,
  maxVisible = 5,
  showFieldNames = true
}: FieldErrorListProps) {
  if (!errors || errors.length === 0) return null

  const visibleErrors = errors.slice(0, maxVisible)
  const hiddenCount = errors.length - maxVisible

  return (
    <div 
      className={cn('space-y-1', className)}
      role="alert"
      aria-live="polite"
    >
      {visibleErrors.map((error, index) => (
        <div key={`${error.field}-${index}`} className="flex items-start gap-1 text-sm">
          <AlertCircle className="size-4 mt-0.5 flex-shrink-0 text-red-500" />
          <span className="text-red-600 dark:text-red-400">
            {showFieldNames && (
              <span className="font-medium capitalize">
                {error.field.replace(/([A-Z])/g, ' $1').toLowerCase()}:
              </span>
            )} {error.message}
          </span>
        </div>
      ))}
      
      {hiddenCount > 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          + {hiddenCount} more {hiddenCount === 1 ? 'error' : 'errors'}
        </div>
      )}
    </div>
  )
}

interface FormErrorSummaryProps {
  errors: FieldValidationError[]
  title?: string
  className?: string
  collapsible?: boolean
}

/**
 * Form-level error summary component
 */
export function FormErrorSummary({ 
  errors, 
  title = 'Please fix the following errors:',
  className,
  collapsible = false
}: FormErrorSummaryProps) {
  if (!errors || errors.length === 0) return null

  const groupedErrors = errors.reduce((acc, error) => {
    const type = error.type || 'error'
    if (!acc[type]) acc[type] = []
    acc[type].push(error)
    return acc
  }, {} as Record<string, FieldValidationError[]>)

  const Content = () => (
    <div className="space-y-3">
      {title && (
        <h4 className="font-medium text-red-700 dark:text-red-300">
          {title}
        </h4>
      )}
      
      {Object.entries(groupedErrors).map(([type, typeErrors]) => (
        <div key={type}>
          {Object.keys(groupedErrors).length > 1 && (
            <h5 className="text-sm font-medium mb-1 capitalize text-gray-700 dark:text-gray-300">
              {type} {typeErrors.length === 1 ? 'Issue' : 'Issues'}
            </h5>
          )}
          <FieldErrorList 
            errors={typeErrors} 
            showFieldNames={true}
          />
        </div>
      ))}
    </div>
  )

  if (collapsible) {
    return (
      <details 
        className={cn(
          'border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-950/20',
          className
        )}
        open
      >
        <summary className="cursor-pointer font-medium text-red-700 dark:text-red-300">
          {errors.length} {errors.length === 1 ? 'Error' : 'Errors'} Found
        </summary>
        <div className="mt-3">
          <Content />
        </div>
      </details>
    )
  }

  return (
    <div 
      className={cn(
        'border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-950/20',
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <Content />
    </div>
  )
}

/**
 * Hook to convert react-hook-form errors to FieldValidationError format
 */
export function useFormErrors(errors: Record<string, any>): FieldValidationError[] {
  return Object.entries(errors).map(([field, error]) => ({
    field,
    message: error?.message || 'This field has an error',
    type: 'error' as const,
    code: error?.type
  }))
}

/**
 * Hook to convert Zod errors to FieldValidationError format
 */
export function useZodErrors(zodError: any): FieldValidationError[] {
  if (!zodError?.issues) return []
  
  return zodError.issues.map((issue: any) => ({
    field: issue.path.join('.') || 'form',
    message: issue.message,
    type: 'error' as const,
    code: issue.code
  }))
}

/**
 * Utility to highlight form fields with errors
 */
export function getFieldErrorClass(hasError: boolean, baseClass: string = '') {
  return cn(
    baseClass,
    hasError && 'border-red-500 dark:border-red-400 focus:border-red-500 focus:ring-red-500'
  )
}
// Re-export all schemas and types
export * from './matter-schemas'
export * from './common-schemas'

// Common validation utilities
import { z } from 'zod'

/**
 * Helper function to format Zod validation errors for display
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const formattedErrors: Record<string, string> = {}
  
  error.errors.forEach((err) => {
    const path = err.path.join('.')
    formattedErrors[path] = err.message
  })
  
  return formattedErrors
}

/**
 * Helper function to get the first error message from a Zod error
 */
export function getFirstZodError(error: z.ZodError): string {
  return error.errors[0]?.message || 'Validation error'
}

/**
 * Helper function to validate data and return formatted errors
 */
export function validateWithErrors<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  return {
    success: false,
    errors: formatZodErrors(result.error)
  }
}

/**
 * Create a schema for optional fields that can be undefined or empty string
 */
export const optionalString = () => z.string().optional().or(z.literal(''))

/**
 * Create a schema for optional UUID fields
 */
export const optionalUuid = () => z.string().uuid().optional()

/**
 * Create a schema for optional date fields
 */
export const optionalDate = () => z.string().datetime().optional()

/**
 * Create a schema for required date fields with validation
 */
export const requiredDate = (fieldName: string) => 
  z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: `${fieldName} must be a valid date`
  })

/**
 * Japanese text validation schema
 */
export const japaneseTextSchema = () => 
  z.string().refine((val) => {
    // Allow hiragana, katakana, kanji, and basic punctuation
    const japaneseRegex = /^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3000-\u303F\w\s\-.,!?()[\]{}""''：；・]+$/
    return japaneseRegex.test(val)
  }, {
    message: 'Must contain valid Japanese characters'
  })

/**
 * Phone number validation schema (supports Japanese and international formats)
 */
export const phoneSchema = () =>
  z.string().refine((val) => {
    // Japanese phone: 03-1234-5678, 090-1234-5678, +81-3-1234-5678
    // International: +1-234-567-8900
    const phoneRegex = /^(\+\d{1,3}[-.]?)?\(?\d{1,4}\)?[-.]?\d{1,4}[-.]?\d{1,4}[-.]?\d{0,4}$/
    return phoneRegex.test(val.replace(/\s/g, ''))
  }, {
    message: 'Must be a valid phone number'
  })

/**
 * Case number validation for Japanese legal system
 */
export const caseNumberSchema = () =>
  z.string().regex(
    /^\d{4}-(CV|CR|FA|IP|AD|EX|BK|AR)-\d{4}$/,
    'Case number must follow format YYYY-TT-NNNN (e.g., 2025-CV-0001)'
  )

/**
 * Japanese postal code validation
 */
export const postalCodeSchema = () =>
  z.string().regex(
    /^\d{3}-\d{4}$/,
    'Postal code must follow format XXX-XXXX'
  )
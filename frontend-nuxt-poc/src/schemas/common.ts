import { z } from 'zod'

/**
 * Common validation schemas and utilities
 * 
 * These schemas provide reusable validation patterns that can be
 * composed into larger form schemas throughout the application.
 */

// Base field validations
export const requiredString = z.string().min(1, 'This field is required')
export const optionalString = z.string().optional()

// String validations with length limits
export const optionalStringWithMax = (maxLength: number, message?: string) => 
  z.string().max(maxLength, message || `Must be less than ${maxLength} characters`).optional()

export const requiredStringWithMax = (maxLength: number, message?: string) => 
  z.string().min(1, 'This field is required').max(maxLength, message || `Must be less than ${maxLength} characters`)
export const requiredNumber = z.number().min(1, 'This field is required')
export const optionalNumber = z.number().optional()

// Email validation
export const email = z
  .string()
  .email('Please enter a valid email address')
  .max(255, 'Email address is too long')

export const optionalEmail = email.optional().or(z.literal(''))

// Password validation
export const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/\d/, 'Password must contain at least one number')

export const strongPassword = password
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character')

// Phone number validation (flexible for international numbers)
export const phoneNumber = z
  .string()
  .regex(/^[\+]?[\d\s\-\(\)]{8,15}$/, 'Please enter a valid phone number')
  .optional()

// Japanese postal code
export const postalCode = z
  .string()
  .regex(/^\d{3}-\d{4}$/, 'Please enter a valid postal code (XXX-XXXX)')
  .optional()

// URL validation
export const url = z
  .string()
  .url('Please enter a valid URL')
  .optional()

// Date validation
export const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please enter a valid date (YYYY-MM-DD)')

export const futureDate = dateString.refine(
  (date) => new Date(date) > new Date(),
  'Date must be in the future'
)

export const pastDate = dateString.refine(
  (date) => new Date(date) < new Date(),
  'Date must be in the past'
)

// File validation
export const fileSize = (maxSizeInMB: number) =>
  z.custom<File>((file) => {
    if (!(file instanceof File)) return false
    return file.size <= maxSizeInMB * 1024 * 1024
  }, `File size must be less than ${maxSizeInMB}MB`)

export const fileType = (allowedTypes: string[]) =>
  z.custom<File>((file) => {
    if (!(file instanceof File)) return false
    return allowedTypes.includes(file.type)
  }, `File type must be one of: ${allowedTypes.join(', ')}`)

// Common file validations
export const imageFile = z
  .custom<File>((file) => {
    if (!(file instanceof File)) return false
    return file.type.startsWith('image/')
  }, 'File must be an image')
  .and(fileSize(5)) // 5MB limit

export const documentFile = z
  .custom<File>((file) => {
    if (!(file instanceof File)) return false
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]
    return allowedTypes.includes(file.type)
  }, 'File must be a PDF, Word document, or text file')
  .and(fileSize(10)) // 10MB limit

// Legal matter specific validations
export const matterNumber = z
  .string()
  .regex(/^[A-Z]{2,3}-\d{4}-\d{3,4}$/, 'Matter number format: AB-YYYY-NNN')

export const clientCode = z
  .string()
  .regex(/^[A-Z]{3,5}\d{3,4}$/, 'Client code format: ABC1234')

// Japanese specific validations
export const katakana = z
  .string()
  .regex(/^[\u30A0-\u30FF\s]+$/, 'Please enter only Katakana characters')

export const hiragana = z
  .string()
  .regex(/^[\u3040-\u309F\s]+$/, 'Please enter only Hiragana characters')

export const kanji = z
  .string()
  .regex(/^[\u4E00-\u9FAF\s]+$/, 'Please enter only Kanji characters')

export const japaneseText = z
  .string()
  .regex(/^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s]+$/, 'Please enter only Japanese characters')

// Address validation (Japanese format)
export const addressSchema = z.object({
  postalCode: postalCode.refine(val => !!val, 'Postal code is required'),
  prefecture: z.string().min(1, 'Prefecture is required'),
  city: z.string().min(1, 'City is required'),
  address1: z.string().min(1, 'Address line 1 is required'),
  address2: z.string().optional(),
  building: z.string().optional()
})

// Contact information schema
export const contactSchema = z.object({
  email: email,
  phone: phoneNumber,
  mobile: phoneNumber,
  fax: phoneNumber
})

// Person name schema (Japanese)
export const personNameSchema = z.object({
  lastName: z.string().min(1, 'Last name is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastNameKana: katakana.optional(),
  firstNameKana: katakana.optional()
})

// Company information schema
export const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  nameKana: katakana.optional(),
  registrationNumber: z.string().optional(),
  taxId: z.string().optional(),
  address: addressSchema,
  contact: contactSchema
})

// Custom refinements for complex validations
export const confirmPassword = (passwordField: string = 'password') =>
  z.object({
    [passwordField]: password,
    confirmPassword: z.string()
  }).refine(
    (data) => data[passwordField as keyof typeof data] === data.confirmPassword,
    {
      message: 'Passwords do not match',
      path: ['confirmPassword']
    }
  )

export const dateRange = z.object({
  startDate: dateString,
  endDate: dateString
}).refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  {
    message: 'End date must be after start date',
    path: ['endDate']
  }
)

// Array validations
export const nonEmptyArray = <T>(schema: z.ZodSchema<T>) =>
  z.array(schema).min(1, 'At least one item is required')

export const uniqueArray = <T>(schema: z.ZodSchema<T>, getKey: (item: T) => string) =>
  z.array(schema).refine(
    (items) => {
      const keys = items.map(getKey)
      return keys.length === new Set(keys).size
    },
    'Duplicate items are not allowed'
  )

// Conditional validations
export const conditionalRequired = <T>(
  schema: z.ZodSchema<T>,
  condition: (data: any) => boolean,
  message: string = 'This field is required'
) =>
  z.any().superRefine((val, ctx) => {
    if (condition(ctx.path) && !val) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message
      })
    }
  })

// Form-specific helper schemas
export const searchQuerySchema = z.object({
  query: z.string().min(1, 'Search query is required').max(255),
  filters: z.record(z.string()).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
})

export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).optional()
})

// Export commonly used composite schemas
export const baseEntitySchema = z.object({
  id: z.string().uuid().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  version: z.number().optional()
})

export const auditableSchema = baseEntitySchema.extend({
  createdBy: z.string().optional(),
  updatedBy: z.string().optional()
})
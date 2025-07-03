import { z } from 'zod'
import {
  requiredString,
  optionalString,
  requiredStringWithMax,
  optionalStringWithMax,
  dateString,
  auditableSchema
} from './common'

/**
 * Per-Diem Recording Form Schemas
 * 
 * Validation schemas for per-diem entry forms used in the legal case
 * management system. Per-diems are specialized expense entries for
 * daily allowances during travel, court visits, and business activities.
 */

// Transportation mode enum
export const transportationModeSchema = z.enum([
  'TRAIN',
  'CAR', 
  'PLANE',
  'BUS',
  'TAXI',
  'WALKING',
  'OTHER'
])

// Enhanced currency support with extended options
export const currencySchema = z.enum(['JPY', 'USD', 'EUR', 'GBP', 'KRW', 'CNY', 'SGD']).default('JPY')

// Per-diem category enum (specific to Japanese legal practice)
export const perDiemCategorySchema = z.enum([
  'COURT_VISIT',           // 裁判所出廷
  'CLIENT_MEETING',        // 依頼者面談
  'BUSINESS_TRAVEL',       // 業務出張
  'CONFERENCE',           // 会議・研修
  'SITE_INSPECTION',      // 現地調査
  'DOCUMENT_FILING',      // 書類提出
  'OTHER'                 // その他
])

// Per-diem accommodation type
export const accommodationTypeSchema = z.enum([
  'NONE',           // 日帰り
  'HOTEL',          // ホテル
  'RYOKAN',         // 旅館
  'BUSINESS_HOTEL', // ビジネスホテル
  'GUEST_HOUSE',    // ゲストハウス
  'OTHER'           // その他
])

// Date range schema with business logic validation
export const dateRangeSchema = z.object({
  startDate: dateString,
  endDate: dateString
}).refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  {
    message: 'End date must be after or equal to start date',
    path: ['endDate']
  }
).refine(
  (data) => {
    const start = new Date(data.startDate)
    const end = new Date(data.endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 90 // Maximum 90 days per entry
  },
  {
    message: 'Date range cannot exceed 90 days',
    path: ['endDate']
  }
).refine(
  (data) => {
    const start = new Date(data.startDate)
    const today = new Date()
    today.setHours(23, 59, 59, 999) // End of today
    return start <= today
  },
  {
    message: 'Start date cannot be in the future',
    path: ['startDate']
  }
)

// Japanese per-diem amount validation
export const perDiemAmountSchema = z.number()
  .min(1000, 'Daily amount must be at least ¥1,000')
  .max(50000, 'Daily amount cannot exceed ¥50,000')
  .multipleOf(100, 'Amount must be in increments of ¥100')

// Location validation with common Japanese locations
export const locationSchema = z.string()
  .min(2, 'Location must be at least 2 characters')
  .max(100, 'Location must be less than 100 characters')
  .refine(
    (val) => val.trim().length >= 2,
    'Location cannot be empty or only whitespace'
  )

// Purpose validation for business justification
export const purposeSchema = z.string()
  .min(5, 'Purpose must be at least 5 characters')
  .max(500, 'Purpose must be less than 500 characters')
  .refine(
    (val) => val.trim().length >= 5,
    'Purpose cannot be empty or only whitespace'
  )

// Base per-diem entry schema
export const perDiemEntrySchema = z.object({
  // Date range for the per-diem period
  dateRange: dateRangeSchema,
  
  // Core per-diem information
  location: locationSchema,
  purpose: purposeSchema,
  category: perDiemCategorySchema,
  dailyAmount: perDiemAmountSchema,
  currency: currencySchema.default('JPY'),
  
  // Optional matter association
  matterId: z.string().uuid().optional(),
  
  // Transportation details
  transportationMode: transportationModeSchema.optional(),
  transportationNotes: optionalStringWithMax(200, 'Transportation notes must be less than 200 characters'),
  
  // Accommodation details
  accommodationType: accommodationTypeSchema.default('NONE'),
  accommodationRequired: z.boolean().default(false),
  accommodationNotes: optionalStringWithMax(200, 'Accommodation notes must be less than 200 characters'),
  
  // Participants (for meetings/conferences)
  participants: z.array(z.string()).optional(),
  participantNames: optionalStringWithMax(300, 'Participant names must be less than 300 characters'),
  
  // Additional information
  notes: optionalStringWithMax(1000, 'Notes must be less than 1000 characters'),
  internalNotes: optionalStringWithMax(500, 'Internal notes must be less than 500 characters'),
  
  // Billing information
  isBillable: z.boolean().default(true),
  isReimbursable: z.boolean().default(false),
  
  // Approval workflow
  requiresApproval: z.boolean().default(true),
  approvedBy: z.string().uuid().optional(),
  approvedAt: z.string().datetime().optional()
}).refine(
  (data) => {
    // If accommodation is required, accommodation type cannot be NONE
    if (data.accommodationRequired && data.accommodationType === 'NONE') {
      return false
    }
    return true
  },
  {
    message: 'Accommodation type must be specified when accommodation is required',
    path: ['accommodationType']
  }
).refine(
  (data) => {
    // For court visits, location should contain court-related keywords
    if (data.category === 'COURT_VISIT') {
      const courtKeywords = ['裁判所', '法廷', 'court', '家庭裁判所', '地方裁判所', '高等裁判所', '最高裁判所']
      const locationLower = data.location.toLowerCase()
      return courtKeywords.some(keyword => locationLower.includes(keyword.toLowerCase()))
    }
    return true
  },
  {
    message: 'For court visits, location should specify the court name',
    path: ['location']
  }
)

// Per-diem creation schema (for API)
export const createPerDiemSchema = z.object({
  // Copy all fields from perDiemEntrySchema
  dateRange: dateRangeSchema,
  location: locationSchema,
  purpose: purposeSchema,
  category: perDiemCategorySchema,
  dailyAmount: perDiemAmountSchema,
  currency: currencySchema.default('JPY'),
  matterId: z.string().uuid().optional(),
  transportationMode: transportationModeSchema.optional(),
  transportationNotes: optionalStringWithMax(200, 'Transportation notes must be less than 200 characters'),
  accommodationType: accommodationTypeSchema.default('NONE'),
  accommodationRequired: z.boolean().default(false),
  accommodationNotes: optionalStringWithMax(200, 'Accommodation notes must be less than 200 characters'),
  participants: z.array(z.string()).optional(),
  participantNames: optionalStringWithMax(300, 'Participant names must be less than 300 characters'),
  notes: optionalStringWithMax(1000, 'Notes must be less than 1000 characters'),
  internalNotes: optionalStringWithMax(500, 'Internal notes must be less than 500 characters'),
  isBillable: z.boolean().default(true),
  isReimbursable: z.boolean().default(false),
  requiresApproval: z.boolean().default(true),
  approvedBy: z.string().uuid().optional(),
  approvedAt: z.string().datetime().optional(),
  
  // Additional fields for creation
  createdFor: z.string().uuid().optional(), // User creating on behalf of
  submittedAt: z.string().datetime().optional(),
  
  // Template information
  templateName: optionalStringWithMax(100, 'Template name must be less than 100 characters'),
  saveAsTemplate: z.boolean().default(false)
})

// Per-diem update schema
export const updatePerDiemSchema = z.object({
  id: z.string().uuid('Per-diem ID is required'),
  version: z.number().optional(), // For optimistic locking
  
  // All other fields are optional for updates
  dateRange: dateRangeSchema.optional(),
  location: locationSchema.optional(),
  purpose: purposeSchema.optional(),
  category: perDiemCategorySchema.optional(),
  dailyAmount: perDiemAmountSchema.optional(),
  currency: currencySchema.optional(),
  matterId: z.string().uuid().optional(),
  transportationMode: transportationModeSchema.optional(),
  transportationNotes: optionalStringWithMax(200, 'Transportation notes must be less than 200 characters'),
  accommodationType: accommodationTypeSchema.optional(),
  accommodationRequired: z.boolean().optional(),
  accommodationNotes: optionalStringWithMax(200, 'Accommodation notes must be less than 200 characters'),
  participants: z.array(z.string()).optional(),
  participantNames: optionalStringWithMax(300, 'Participant names must be less than 300 characters'),
  notes: optionalStringWithMax(1000, 'Notes must be less than 1000 characters'),
  internalNotes: optionalStringWithMax(500, 'Internal notes must be less than 500 characters'),
  isBillable: z.boolean().optional(),
  isReimbursable: z.boolean().optional(),
  requiresApproval: z.boolean().optional(),
  approvedBy: z.string().uuid().optional(),
  approvedAt: z.string().datetime().optional()
})

// Per-diem search/filter schema
export const perDiemSearchSchema = z.object({
  query: optionalStringWithMax(255),
  category: perDiemCategorySchema.optional(),
  matterId: z.string().uuid().optional(),
  submittedBy: z.string().uuid().optional(),
  dateFrom: dateString.optional(),
  dateTo: dateString.optional(),
  amountMin: z.number().min(0).optional(),
  amountMax: z.number().min(0).optional(),
  location: optionalStringWithMax(100),
  transportationMode: transportationModeSchema.optional(),
  accommodationRequired: z.boolean().optional(),
  isBillable: z.boolean().optional(),
  isApproved: z.boolean().optional(),
  sortBy: z.enum([
    'dateRange.startDate',
    'location',
    'dailyAmount',
    'category',
    'createdAt'
  ]).default('dateRange.startDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20)
}).refine(
  (data) => {
    if (data.dateFrom && data.dateTo) {
      return new Date(data.dateFrom) <= new Date(data.dateTo)
    }
    return true
  },
  {
    message: 'Date from must be before date to',
    path: ['dateTo']
  }
).refine(
  (data) => {
    if (data.amountMin && data.amountMax) {
      return data.amountMin <= data.amountMax
    }
    return true
  },
  {
    message: 'Minimum amount must be less than maximum amount',
    path: ['amountMax']
  }
)

// Bulk per-diem creation schema
export const bulkPerDiemSchema = z.object({
  entries: z.array(createPerDiemSchema).min(1, 'At least one per-diem entry is required'),
  globalNotes: optionalStringWithMax(500, 'Global notes must be less than 500 characters'),
  batchName: optionalStringWithMax(100, 'Batch name must be less than 100 characters')
}).refine(
  (data) => {
    // Validate that all entries have the same matter ID if specified
    const matterIds = data.entries
      .map(entry => entry.matterId)
      .filter(id => id !== undefined)
    
    if (matterIds.length > 0) {
      return matterIds.every(id => id === matterIds[0])
    }
    return true
  },
  {
    message: 'All per-diem entries in a batch must belong to the same matter',
    path: ['entries']
  }
)

// Per-diem template schema
export const perDiemTemplateSchema = z.object({
  name: requiredStringWithMax(100, 'Template name must be less than 100 characters'),
  description: optionalStringWithMax(300, 'Template description must be less than 300 characters'),
  category: perDiemCategorySchema,
  location: locationSchema,
  purpose: purposeSchema,
  dailyAmount: perDiemAmountSchema,
  transportationMode: transportationModeSchema.optional(),
  accommodationType: accommodationTypeSchema.default('NONE'),
  accommodationRequired: z.boolean().default(false),
  isBillable: z.boolean().default(true),
  isReimbursable: z.boolean().default(false),
  isPublic: z.boolean().default(false), // Available to all users or just creator
  createdBy: z.string().uuid().optional(),
  tags: z.array(z.string()).optional()
})

// Common Japanese per-diem presets
export const commonPerDiemPresets = [
  {
    name: 'Tokyo Court Visit',
    category: 'COURT_VISIT' as const,
    location: 'Tokyo District Court',
    purpose: 'Court hearing attendance',
    dailyAmount: 8000,
    transportationMode: 'TRAIN' as const,
    accommodationType: 'NONE' as const,
    accommodationRequired: false
  },
  {
    name: 'Osaka Client Meeting',
    category: 'CLIENT_MEETING' as const,
    location: 'Osaka Business District',
    purpose: 'Client consultation meeting',
    dailyAmount: 10000,
    transportationMode: 'TRAIN' as const,
    accommodationType: 'NONE' as const,
    accommodationRequired: false
  },
  {
    name: 'Multi-day Conference',
    category: 'CONFERENCE' as const,
    location: 'Convention Center',
    purpose: 'Legal conference attendance',
    dailyAmount: 15000,
    transportationMode: 'TRAIN' as const,
    accommodationType: 'HOTEL' as const,
    accommodationRequired: true
  },
  {
    name: 'Site Inspection',
    category: 'SITE_INSPECTION' as const,
    location: 'Property Site',
    purpose: 'On-site property inspection',
    dailyAmount: 12000,
    transportationMode: 'CAR' as const,
    accommodationType: 'NONE' as const,
    accommodationRequired: false
  }
] as const

// Combined schemas with auditing
export const auditablePerDiemSchema = createPerDiemSchema.and(auditableSchema)
export const auditablePerDiemTemplateSchema = perDiemTemplateSchema.and(auditableSchema)

// Export type definitions for TypeScript
export type TransportationMode = z.infer<typeof transportationModeSchema>
export type Currency = z.infer<typeof currencySchema>
export type PerDiemCategory = z.infer<typeof perDiemCategorySchema>
export type AccommodationType = z.infer<typeof accommodationTypeSchema>

export type PerDiemEntryForm = z.infer<typeof perDiemEntrySchema>
export type CreatePerDiemForm = z.infer<typeof createPerDiemSchema>
export type UpdatePerDiemForm = z.infer<typeof updatePerDiemSchema>
export type PerDiemSearchForm = z.infer<typeof perDiemSearchSchema>
export type BulkPerDiemForm = z.infer<typeof bulkPerDiemSchema>
export type PerDiemTemplateForm = z.infer<typeof perDiemTemplateSchema>

export type PerDiemPreset = typeof commonPerDiemPresets[number]

// Date range type for convenience
export type DateRange = z.infer<typeof dateRangeSchema>
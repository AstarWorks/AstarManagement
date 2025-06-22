import { z } from 'zod'
import {
  requiredString,
  optionalString,
  email,
  phoneNumber,
  dateString,
  futureDate,
  matterNumber,
  clientCode,
  personNameSchema,
  companySchema,
  addressSchema,
  auditableSchema
} from './common'

/**
 * Matter management form schemas
 * 
 * These schemas define validation rules for matter-related forms
 * throughout the legal case management application.
 */

// Matter status enum
export const matterStatusSchema = z.enum([
  'INVESTIGATION',
  'RESEARCH', 
  'MEDIATION',
  'TRIAL',
  'SETTLEMENT',
  'CLOSED'
])

// Matter type enum
export const matterTypeSchema = z.enum([
  'CIVIL',
  'CRIMINAL',
  'CORPORATE',
  'FAMILY',
  'IMMIGRATION',
  'INTELLECTUAL_PROPERTY',
  'LABOR',
  'REAL_ESTATE',
  'TAX',
  'OTHER'
])

// Matter priority enum
export const matterPrioritySchema = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT'
])

// Client type enum
export const clientTypeSchema = z.enum([
  'INDIVIDUAL',
  'CORPORATION',
  'GOVERNMENT',
  'NON_PROFIT'
])

// Base matter schema
export const baseMatterSchema = z.object({
  title: requiredString.max(255, 'Title must be less than 255 characters'),
  description: optionalString.max(2000, 'Description must be less than 2000 characters'),
  matterNumber: matterNumber,
  status: matterStatusSchema,
  type: matterTypeSchema,
  priority: matterPrioritySchema.default('MEDIUM'),
  openDate: dateString,
  closeDate: dateString.optional(),
  estimatedValue: z.number().positive().optional(),
  billableHours: z.number().min(0).optional()
})

// Client information schema
export const clientSchema = z.object({
  id: z.string().uuid().optional(),
  type: clientTypeSchema,
  clientCode: clientCode,
  
  // Individual client fields
  personalInfo: personNameSchema.optional(),
  
  // Corporate client fields
  companyInfo: companySchema.optional(),
  
  // Contact information
  email: email.optional(),
  phone: phoneNumber,
  mobile: phoneNumber,
  
  // Address
  address: addressSchema,
  
  // Additional information
  notes: optionalString.max(1000, 'Notes must be less than 1000 characters'),
  referralSource: optionalString,
  isActive: z.boolean().default(true)
}).refine(
  (data) => {
    if (data.type === 'INDIVIDUAL') {
      return !!data.personalInfo
    }
    if (data.type === 'CORPORATION') {
      return !!data.companyInfo
    }
    return true
  },
  {
    message: 'Client information is required based on client type',
    path: ['personalInfo']
  }
)

// Matter creation schema
export const createMatterSchema = baseMatterSchema.extend({
  clientId: z.string().uuid('Please select a valid client'),
  assignedLawyerIds: z
    .array(z.string().uuid())
    .min(1, 'At least one lawyer must be assigned'),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.string()).optional()
})

// Matter update schema (all fields optional except ID)
export const updateMatterSchema = baseMatterSchema
  .partial()
  .extend({
    id: z.string().uuid('Matter ID is required'),
    clientId: z.string().uuid().optional(),
    assignedLawyerIds: z.array(z.string().uuid()).optional(),
    tags: z.array(z.string()).optional(),
    customFields: z.record(z.string()).optional()
  })

// Matter status transition schema
export const matterStatusTransitionSchema = z.object({
  matterId: z.string().uuid('Matter ID is required'),
  fromStatus: matterStatusSchema,
  toStatus: matterStatusSchema,
  reason: requiredString.max(500, 'Reason must be less than 500 characters'),
  effectiveDate: dateString.optional(),
  notes: optionalString.max(1000, 'Notes must be less than 1000 characters')
}).refine(
  (data) => data.fromStatus !== data.toStatus,
  {
    message: 'New status must be different from current status',
    path: ['toStatus']
  }
)

// Matter search schema
export const matterSearchSchema = z.object({
  query: optionalString.max(255),
  status: matterStatusSchema.optional(),
  type: matterTypeSchema.optional(),
  priority: matterPrioritySchema.optional(),
  clientId: z.string().uuid().optional(),
  assignedLawyerId: z.string().uuid().optional(),
  openDateFrom: dateString.optional(),
  openDateTo: dateString.optional(),
  closeDateFrom: dateString.optional(),
  closeDateTo: dateString.optional(),
  tags: z.array(z.string()).optional(),
  sortBy: z.enum([
    'title',
    'matterNumber', 
    'status',
    'priority',
    'openDate',
    'closeDate',
    'estimatedValue'
  ]).default('openDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20)
}).refine(
  (data) => {
    if (data.openDateFrom && data.openDateTo) {
      return new Date(data.openDateFrom) <= new Date(data.openDateTo)
    }
    return true
  },
  {
    message: 'Open date from must be before open date to',
    path: ['openDateTo']
  }
).refine(
  (data) => {
    if (data.closeDateFrom && data.closeDateTo) {
      return new Date(data.closeDateFrom) <= new Date(data.closeDateTo)
    }
    return true
  },
  {
    message: 'Close date from must be before close date to',
    path: ['closeDateTo']
  }
)

// Matter assignment schema
export const matterAssignmentSchema = z.object({
  matterId: z.string().uuid('Matter ID is required'),
  lawyerId: z.string().uuid('Lawyer ID is required'),
  role: z.enum(['PRIMARY', 'SECONDARY', 'CONSULTANT']).default('PRIMARY'),
  assignedDate: dateString,
  notes: optionalString.max(500, 'Notes must be less than 500 characters')
})

// Document attachment schema
export const documentAttachmentSchema = z.object({
  matterId: z.string().uuid('Matter ID is required'),
  title: requiredString.max(255, 'Title must be less than 255 characters'),
  description: optionalString.max(1000, 'Description must be less than 1000 characters'),
  category: z.enum([
    'PLEADING',
    'EVIDENCE',
    'CORRESPONDENCE',
    'RESEARCH',
    'CONTRACT',
    'COURT_ORDER',
    'OTHER'
  ]),
  tags: z.array(z.string()).optional(),
  isConfidential: z.boolean().default(false),
  // File will be handled separately in the component
  fileName: requiredString,
  fileSize: z.number().positive(),
  mimeType: z.string()
})

// Time entry schema
export const timeEntrySchema = z.object({
  matterId: z.string().uuid('Matter ID is required'),
  lawyerId: z.string().uuid('Lawyer ID is required'),
  date: dateString,
  hours: z.number().positive().max(24, 'Hours cannot exceed 24 per day'),
  description: requiredString.max(1000, 'Description must be less than 1000 characters'),
  billableRate: z.number().positive().optional(),
  isBillable: z.boolean().default(true),
  category: z.enum([
    'RESEARCH',
    'DRAFTING',
    'COURT_APPEARANCE',
    'CLIENT_MEETING',
    'PHONE_CALL',
    'EMAIL',
    'TRAVEL',
    'ADMINISTRATIVE',
    'OTHER'
  ]),
  notes: optionalString.max(500, 'Notes must be less than 500 characters')
})

// Expense entry schema
export const expenseEntrySchema = z.object({
  matterId: z.string().uuid('Matter ID is required'),
  date: dateString,
  amount: z.number().positive('Amount must be positive'),
  description: requiredString.max(500, 'Description must be less than 500 characters'),
  category: z.enum([
    'COURT_FEES',
    'FILING_FEES',
    'TRAVEL',
    'ACCOMMODATION',
    'MEALS',
    'POSTAGE',
    'PRINTING',
    'RESEARCH',
    'EXPERT_WITNESS',
    'OTHER'
  ]),
  vendor: optionalString.max(255, 'Vendor name must be less than 255 characters'),
  receiptNumber: optionalString.max(100, 'Receipt number must be less than 100 characters'),
  isBillable: z.boolean().default(true),
  isReimbursable: z.boolean().default(false),
  notes: optionalString.max(500, 'Notes must be less than 500 characters')
})

// Calendar event schema
export const calendarEventSchema = z.object({
  matterId: z.string().uuid('Matter ID is required'),
  title: requiredString.max(255, 'Title must be less than 255 characters'),
  description: optionalString.max(1000, 'Description must be less than 1000 characters'),
  startDate: z.string().datetime('Start date must be a valid datetime'),
  endDate: z.string().datetime('End date must be a valid datetime'),
  location: optionalString.max(255, 'Location must be less than 255 characters'),
  attendees: z.array(z.string().uuid()).optional(),
  type: z.enum([
    'COURT_HEARING',
    'CLIENT_MEETING',
    'DEPOSITION',
    'DEADLINE',
    'REMINDER',
    'OTHER'
  ]),
  isAllDay: z.boolean().default(false),
  reminderMinutes: z.number().min(0).optional(),
  recurrence: z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).default('NONE')
}).refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  {
    message: 'End date must be after start date',
    path: ['endDate']
  }
)

// Combined schemas with auditing
export const auditableMatterSchema = createMatterSchema.merge(auditableSchema)
export const auditableClientSchema = clientSchema.merge(auditableSchema)
export const auditableTimeEntrySchema = timeEntrySchema.merge(auditableSchema)
export const auditableExpenseEntrySchema = expenseEntrySchema.merge(auditableSchema)

// Export type definitions for TypeScript
export type MatterStatus = z.infer<typeof matterStatusSchema>
export type MatterType = z.infer<typeof matterTypeSchema>
export type MatterPriority = z.infer<typeof matterPrioritySchema>
export type ClientType = z.infer<typeof clientTypeSchema>

export type CreateMatterForm = z.infer<typeof createMatterSchema>
export type UpdateMatterForm = z.infer<typeof updateMatterSchema>
export type MatterStatusTransitionForm = z.infer<typeof matterStatusTransitionSchema>
export type MatterSearchForm = z.infer<typeof matterSearchSchema>
export type ClientForm = z.infer<typeof clientSchema>
export type TimeEntryForm = z.infer<typeof timeEntrySchema>
export type ExpenseEntryForm = z.infer<typeof expenseEntrySchema>
export type DocumentAttachmentForm = z.infer<typeof documentAttachmentSchema>
export type CalendarEventForm = z.infer<typeof calendarEventSchema>
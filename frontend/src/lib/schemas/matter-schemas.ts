import { z } from 'zod'

// Enums matching the backend API exactly
export const MatterStatusSchema = z.enum([
  'INTAKE',
  'INITIAL_REVIEW',
  'INVESTIGATION',
  'RESEARCH',
  'DRAFT_PLEADINGS',
  'FILED',
  'DISCOVERY',
  'MEDIATION',
  'TRIAL_PREP',
  'TRIAL',
  'SETTLEMENT',
  'CLOSED'
])

export const PrioritySchema = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT'
])

// Core Matter schema matching backend API
export const MatterSchema = z.object({
  id: z.string().uuid(),
  caseNumber: z.string()
    .min(1, 'Case number is required')
    .regex(/^\d{4}-(CV|CR|FA|IP)-\d{4}$/, 'Case number must follow format YYYY-TT-NNNN'),
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  description: z.string().optional(),
  clientName: z.string()
    .min(1, 'Client name is required')
    .max(100, 'Client name must be 100 characters or less'),
  clientContact: z.string().email().optional().or(z.literal('')),
  opposingParty: z.string().max(100).optional(),
  courtName: z.string().max(100).optional(),
  filingDate: z.string().datetime().optional(),
  status: MatterStatusSchema,
  priority: PrioritySchema.default('MEDIUM'),
  assignedLawyerId: z.string().uuid().optional(),
  assignedClerkId: z.string().uuid().optional(),
  estimatedCompletionDate: z.string().datetime().optional(),
  actualCompletionDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid()
})

// Form schemas for creating/editing matters
export const CreateMatterSchema = z.object({
  caseNumber: z.string()
    .min(1, 'Case number is required')
    .regex(/^\d{4}-(CV|CR|FA|IP)-\d{4}$/, 'Case number must follow format YYYY-TT-NNNN'),
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  description: z.string().optional(),
  clientName: z.string()
    .min(1, 'Client name is required')
    .max(100, 'Client name must be 100 characters or less'),
  clientContact: z.string()
    .optional()
    .refine((val) => !val || z.string().email().safeParse(val).success, {
      message: 'Must be a valid email address'
    }),
  opposingParty: z.string().max(100).optional(),
  courtName: z.string().max(100).optional(),
  filingDate: z.string().optional().refine((val) => {
    if (!val) return true
    return !isNaN(Date.parse(val))
  }, 'Must be a valid date'),
  priority: PrioritySchema.default('MEDIUM'),
  assignedLawyerId: z.string().uuid().optional(),
  estimatedCompletionDate: z.string().optional().refine((val) => {
    if (!val) return true
    return !isNaN(Date.parse(val))
  }, 'Must be a valid date'),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([])
})

export const UpdateMatterSchema = CreateMatterSchema.partial().extend({
  id: z.string().uuid()
})

// Status transition schema
export const MatterStatusTransitionSchema = z.object({
  matterId: z.string().uuid(),
  newStatus: MatterStatusSchema,
  reason: z.string().optional(),
  notes: z.string().optional()
})

// Search and filter schemas
export const MatterFilterSchema = z.object({
  status: z.array(MatterStatusSchema).optional(),
  priority: z.array(PrioritySchema).optional(),
  assignedLawyerId: z.string().uuid().optional(),
  assignedClerkId: z.string().uuid().optional(),
  searchTerm: z.string().optional(),
  filingDateFrom: z.string().datetime().optional(),
  filingDateTo: z.string().datetime().optional(),
  tags: z.array(z.string()).optional()
})

export const MatterSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  filters: MatterFilterSchema.optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'filingDate', 'title', 'priority']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// API response schemas
export const MatterListResponseSchema = z.object({
  matters: z.array(MatterSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number()
  })
})

export const MatterResponseSchema = z.object({
  matter: MatterSchema,
  message: z.string().optional()
})

// Type exports for use in components
export type Matter = z.infer<typeof MatterSchema>
export type CreateMatterRequest = z.infer<typeof CreateMatterSchema>
export type UpdateMatterRequest = z.infer<typeof UpdateMatterSchema>
export type MatterStatusTransition = z.infer<typeof MatterStatusTransitionSchema>
export type MatterFilter = z.infer<typeof MatterFilterSchema>
export type MatterSearch = z.infer<typeof MatterSearchSchema>
export type MatterListResponse = z.infer<typeof MatterListResponseSchema>
export type MatterResponse = z.infer<typeof MatterResponseSchema>
export type MatterStatus = z.infer<typeof MatterStatusSchema>
export type Priority = z.infer<typeof PrioritySchema>

// Validation helper functions
export const validateMatter = (data: unknown) => MatterSchema.safeParse(data)
export const validateCreateMatter = (data: unknown) => CreateMatterSchema.safeParse(data)
export const validateUpdateMatter = (data: unknown) => UpdateMatterSchema.safeParse(data)
export const validateMatterFilter = (data: unknown) => MatterFilterSchema.safeParse(data)
export const validateMatterSearch = (data: unknown) => MatterSearchSchema.safeParse(data)
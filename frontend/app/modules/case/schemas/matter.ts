import { z } from 'zod'

// Matter status enum
export const MatterStatusSchema = z.enum([
  'draft',
  'active', 
  'completed',
  'archived'
])

// Matter priority enum
export const MatterPrioritySchema = z.enum([
  'low',
  'medium',
  'high',
  'urgent'
])

// Matter type enum
export const MatterTypeSchema = z.enum([
  'civil',
  'criminal',
  'family',
  'corporate',
  'real_estate',
  'intellectual_property',
  'labor',
  'tax',
  'other'
])

// Base matter schema
export const MatterSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, '案件名は必須です').max(200, '案件名は200文字以内で入力してください'),
  description: z.string().max(2000, '説明は2000文字以内で入力してください').optional(),
  status: MatterStatusSchema,
  priority: MatterPrioritySchema,
  type: MatterTypeSchema,
  clientId: z.string().uuid(),
  assignedLawyerId: z.string().uuid().optional(),
  estimatedHours: z.number().min(0, '見積もり時間は0以上で入力してください').optional(),
  actualHours: z.number().min(0, '実績時間は0以上で入力してください').optional(),
  dueDate: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  tags: z.array(z.string()).default([]),
})

// Matter creation/update schemas
export const CreateMatterSchema = MatterSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const UpdateMatterSchema = CreateMatterSchema.partial()

// Filter schema for matter list
export const MatterFilterSchema = z.object({
  status: MatterStatusSchema.optional(),
  priority: MatterPrioritySchema.optional(),
  type: MatterTypeSchema.optional(),
  assignedLawyerId: z.string().uuid().optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

// Type exports
export type Matter = z.infer<typeof MatterSchema>
export type CreateMatter = z.infer<typeof CreateMatterSchema>
export type UpdateMatter = z.infer<typeof UpdateMatterSchema>
export type MatterStatus = z.infer<typeof MatterStatusSchema>
export type MatterPriority = z.infer<typeof MatterPrioritySchema>
export type MatterType = z.infer<typeof MatterTypeSchema>
export type MatterFilter = z.infer<typeof MatterFilterSchema>
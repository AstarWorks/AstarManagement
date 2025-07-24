/**
 * Unit tests for matter validation schemas
 * 
 * Tests Zod schemas used for matter forms including creation, update,
 * status transitions, and complex validation rules.
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import {
  matterCreateSchema,
  matterUpdateSchema,
  matterStatusSchema,
  matterPrioritySchema,
  matterSearchSchema,
  matterFilterSchema,
  matterBulkActionSchema,
  matterImportSchema,
  validateMatterTransition,
  MATTER_STATUS_TRANSITIONS
} from '../matter'

describe('Matter Schemas', () => {
  describe('matterCreateSchema', () => {
    it('validates valid matter creation data', () => {
      const validData = {
        title: 'Contract Review for ABC Corp',
        description: 'Review and negotiate terms for new service agreement',
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        priority: 'HIGH',
        dueDate: '2024-12-31',
        assigneeId: '123e4567-e89b-12d3-a456-426614174001',
        tags: ['contract', 'corporate', 'urgent'],
        estimatedHours: 40,
        billableRate: 250.00
      }
      
      const result = matterCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe(validData.title)
        expect(result.data.priority).toBe('HIGH')
        expect(result.data.tags).toEqual(['contract', 'corporate', 'urgent'])
      }
    })

    it('requires minimum fields', () => {
      const minimalData = {
        title: 'Basic Matter',
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        priority: 'MEDIUM'
      }
      
      const result = matterCreateSchema.safeParse(minimalData)
      expect(result.success).toBe(true)
    })

    it('rejects invalid title', () => {
      const invalidData = {
        title: 'AB', // Too short
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        priority: 'MEDIUM'
      }
      
      const result = matterCreateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('title')
        expect(result.error.issues[0].message).toContain('at least 3 characters')
      }
    })

    it('rejects title that is too long', () => {
      const invalidData = {
        title: 'A'.repeat(201), // Too long
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        priority: 'MEDIUM'
      }
      
      const result = matterCreateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('title')
        expect(result.error.issues[0].message).toContain('200 characters')
      }
    })

    it('validates UUID format for clientId', () => {
      const invalidData = {
        title: 'Valid Title',
        clientId: 'not-a-uuid',
        priority: 'MEDIUM'
      }
      
      const result = matterCreateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('clientId')
        expect(result.error.issues[0].message).toContain('Invalid uuid')
      }
    })

    it('validates priority enum values', () => {
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
      
      validPriorities.forEach(priority => {
        const data = {
          title: 'Test Matter',
          clientId: '123e4567-e89b-12d3-a456-426614174000',
          priority
        }
        
        const result = matterCreateSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
      
      const invalidData = {
        title: 'Test Matter',
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        priority: 'CRITICAL' // Invalid priority
      }
      
      const result = matterCreateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('validates due date format', () => {
      const validDates = [
        '2024-12-31',
        '2025-01-01',
        new Date('2024-12-31').toISOString()
      ]
      
      validDates.forEach(dueDate => {
        const data = {
          title: 'Test Matter',
          clientId: '123e4567-e89b-12d3-a456-426614174000',
          priority: 'MEDIUM',
          dueDate
        }
        
        const result = matterCreateSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    it('validates tags array', () => {
      const data = {
        title: 'Test Matter',
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        priority: 'MEDIUM',
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6'] // Max 5 tags
      }
      
      const result = matterCreateSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('tags')
        expect(result.error.issues[0].message).toContain('5')
      }
    })

    it('validates numeric fields', () => {
      const data = {
        title: 'Test Matter',
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        priority: 'MEDIUM',
        estimatedHours: -10, // Negative hours
        billableRate: -100 // Negative rate
      }
      
      const result = matterCreateSchema.safeParse(data)
      expect(result.success).toBe(false)
      
      const errors = result.error?.issues || []
      expect(errors.some(e => e.path.includes('estimatedHours'))).toBe(true)
      expect(errors.some(e => e.path.includes('billableRate'))).toBe(true)
    })

    it('transforms and sanitizes input data', () => {
      const data = {
        title: '  Contract Review  ', // Extra spaces
        description: '  Description with spaces  ',
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        priority: 'MEDIUM',
        tags: ['  tag1  ', 'TAG2', '  Tag3  '] // Mixed case and spaces
      }
      
      const result = matterCreateSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe('Contract Review')
        expect(result.data.description).toBe('Description with spaces')
        expect(result.data.tags).toEqual(['tag1', 'tag2', 'tag3'])
      }
    })
  })

  describe('matterUpdateSchema', () => {
    it('allows partial updates', () => {
      const updateData = {
        title: 'Updated Title'
      }
      
      const result = matterUpdateSchema.safeParse(updateData)
      expect(result.success).toBe(true)
    })

    it('validates all fields when provided', () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        dueDate: '2024-12-31',
        assigneeId: '123e4567-e89b-12d3-a456-426614174001'
      }
      
      const result = matterUpdateSchema.safeParse(updateData)
      expect(result.success).toBe(true)
    })

    it('allows empty object for no updates', () => {
      const result = matterUpdateSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('validates status transitions', () => {
      const validStatuses = ['DRAFT', 'OPEN', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'ARCHIVED', 'CANCELLED']
      
      validStatuses.forEach(status => {
        const result = matterUpdateSchema.safeParse({ status })
        expect(result.success).toBe(true)
      })
    })
  })

  describe('matterStatusSchema', () => {
    it('validates all valid status values', () => {
      const validStatuses = ['DRAFT', 'OPEN', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'ARCHIVED', 'CANCELLED']
      
      validStatuses.forEach(status => {
        const result = matterStatusSchema.safeParse(status)
        expect(result.success).toBe(true)
        expect(result.data).toBe(status)
      })
    })

    it('rejects invalid status values', () => {
      const invalidStatuses = ['PENDING', 'CLOSED', 'NEW', 'ACTIVE']
      
      invalidStatuses.forEach(status => {
        const result = matterStatusSchema.safeParse(status)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('matterPrioritySchema', () => {
    it('validates priority values', () => {
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
      
      validPriorities.forEach(priority => {
        const result = matterPrioritySchema.safeParse(priority)
        expect(result.success).toBe(true)
        expect(result.data).toBe(priority)
      })
    })

    it('provides custom error message', () => {
      const result = matterPrioritySchema.safeParse('CRITICAL')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid priority level')
      }
    })
  })

  describe('matterSearchSchema', () => {
    it('validates search parameters', () => {
      const searchParams = {
        query: 'contract review',
        status: ['OPEN', 'IN_PROGRESS'],
        priority: ['HIGH', 'URGENT'],
        assigneeId: '123e4567-e89b-12d3-a456-426614174001',
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        tags: ['contract', 'urgent'],
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }
      
      const result = matterSearchSchema.safeParse(searchParams)
      expect(result.success).toBe(true)
    })

    it('validates pagination limits', () => {
      const invalidParams = {
        page: 0, // Must be positive
        limit: 150 // Max 100
      }
      
      const result = matterSearchSchema.safeParse(invalidParams)
      expect(result.success).toBe(false)
      
      const errors = result.error?.issues || []
      expect(errors.some(e => e.path.includes('page'))).toBe(true)
      expect(errors.some(e => e.path.includes('limit'))).toBe(true)
    })

    it('validates sort options', () => {
      const validSortFields = ['title', 'createdAt', 'updatedAt', 'dueDate', 'priority']
      
      validSortFields.forEach(sortBy => {
        const result = matterSearchSchema.safeParse({ sortBy })
        expect(result.success).toBe(true)
      })
      
      const invalidSort = {
        sortBy: 'invalid_field',
        sortOrder: 'random'
      }
      
      const result = matterSearchSchema.safeParse(invalidSort)
      expect(result.success).toBe(false)
    })

    it('transforms search query', () => {
      const params = {
        query: '  Contract Review  '
      }
      
      const result = matterSearchSchema.safeParse(params)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.query).toBe('Contract Review')
      }
    })
  })

  describe('matterFilterSchema', () => {
    it('validates filter combinations', () => {
      const filters = {
        status: ['OPEN', 'IN_PROGRESS'],
        priority: ['HIGH'],
        hasDocuments: true,
        isOverdue: false,
        isAssigned: true,
        createdAfter: '2024-01-01',
        createdBefore: '2024-12-31'
      }
      
      const result = matterFilterSchema.safeParse(filters)
      expect(result.success).toBe(true)
    })

    it('allows empty filters', () => {
      const result = matterFilterSchema.safeParse({})
      expect(result.success).toBe(true)
    })
  })

  describe('matterBulkActionSchema', () => {
    it('validates bulk update action', () => {
      const bulkAction = {
        action: 'update',
        matterIds: [
          '123e4567-e89b-12d3-a456-426614174000',
          '123e4567-e89b-12d3-a456-426614174001'
        ],
        data: {
          priority: 'HIGH',
          assigneeId: '123e4567-e89b-12d3-a456-426614174002'
        }
      }
      
      const result = matterBulkActionSchema.safeParse(bulkAction)
      expect(result.success).toBe(true)
    })

    it('validates bulk archive action', () => {
      const bulkAction = {
        action: 'archive',
        matterIds: [
          '123e4567-e89b-12d3-a456-426614174000'
        ],
        reason: 'Completed and approved by client'
      }
      
      const result = matterBulkActionSchema.safeParse(bulkAction)
      expect(result.success).toBe(true)
    })

    it('requires reason for delete action', () => {
      const bulkAction = {
        action: 'delete',
        matterIds: ['123e4567-e89b-12d3-a456-426614174000']
        // Missing required reason
      }
      
      const result = matterBulkActionSchema.safeParse(bulkAction)
      expect(result.success).toBe(false)
    })

    it('validates matter IDs are UUIDs', () => {
      const bulkAction = {
        action: 'update',
        matterIds: ['invalid-id', '123'],
        data: { priority: 'HIGH' }
      }
      
      const result = matterBulkActionSchema.safeParse(bulkAction)
      expect(result.success).toBe(false)
    })
  })

  describe('matterImportSchema', () => {
    it('validates CSV import data', () => {
      const importData = {
        format: 'csv',
        data: [
          {
            title: 'Imported Matter 1',
            clientId: '123e4567-e89b-12d3-a456-426614174000',
            priority: 'MEDIUM',
            description: 'Imported from legacy system'
          },
          {
            title: 'Imported Matter 2',
            clientId: '123e4567-e89b-12d3-a456-426614174000',
            priority: 'HIGH'
          }
        ],
        options: {
          skipDuplicates: true,
          validateOnly: false
        }
      }
      
      const result = matterImportSchema.safeParse(importData)
      expect(result.success).toBe(true)
    })

    it('validates each row in import data', () => {
      const importData = {
        format: 'csv',
        data: [
          {
            title: 'Valid Matter',
            clientId: '123e4567-e89b-12d3-a456-426614174000',
            priority: 'MEDIUM'
          },
          {
            title: 'In', // Too short
            clientId: 'invalid-uuid',
            priority: 'INVALID'
          }
        ]
      }
      
      const result = matterImportSchema.safeParse(importData)
      expect(result.success).toBe(false)
    })
  })

  describe('validateMatterTransition', () => {
    it('allows valid status transitions', () => {
      const validTransitions = [
        { from: 'DRAFT', to: 'OPEN' },
        { from: 'OPEN', to: 'IN_PROGRESS' },
        { from: 'IN_PROGRESS', to: 'REVIEW' },
        { from: 'REVIEW', to: 'COMPLETED' },
        { from: 'COMPLETED', to: 'ARCHIVED' }
      ]
      
      validTransitions.forEach(({ from, to }) => {
        const result = validateMatterTransition(from, to)
        expect(result.valid).toBe(true)
        expect(result.reason).toBeUndefined()
      })
    })

    it('prevents invalid status transitions', () => {
      const invalidTransitions = [
        { from: 'COMPLETED', to: 'DRAFT', reason: 'Cannot move completed matter back to draft' },
        { from: 'ARCHIVED', to: 'OPEN', reason: 'Cannot reopen archived matter' },
        { from: 'CANCELLED', to: 'IN_PROGRESS', reason: 'Cannot resume cancelled matter' }
      ]
      
      invalidTransitions.forEach(({ from, to, reason }) => {
        const result = validateMatterTransition(from, to)
        expect(result.valid).toBe(false)
        expect(result.reason).toContain(reason)
      })
    })

    it('allows cancellation from most states', () => {
      const cancellableStates = ['DRAFT', 'OPEN', 'IN_PROGRESS', 'REVIEW']
      
      cancellableStates.forEach(from => {
        const result = validateMatterTransition(from, 'CANCELLED')
        expect(result.valid).toBe(true)
      })
    })

    it('prevents cancellation of completed matters', () => {
      const result = validateMatterTransition('COMPLETED', 'CANCELLED')
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('Cannot cancel completed matter')
    })
  })

  describe('Complex Validation Scenarios', () => {
    it('validates conditional required fields', () => {
      // Custom schema with conditional validation
      const conditionalSchema = z.object({
        matterType: z.enum(['litigation', 'contract', 'advisory']),
        courtDate: z.string().optional(),
        contractValue: z.number().optional(),
        advisoryHours: z.number().optional()
      }).refine(
        (data) => {
          if (data.matterType === 'litigation') {
            return !!data.courtDate
          }
          return true
        },
        { message: 'Court date required for litigation matters', path: ['courtDate'] }
      )
      
      const litigationData = {
        matterType: 'litigation'
        // Missing courtDate
      }
      
      const result = conditionalSchema.safeParse(litigationData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Court date required')
      }
    })

    it('validates business rules', () => {
      // Schema with business rule validation
      const businessRuleSchema = matterCreateSchema.extend({
        estimatedHours: z.number().positive(),
        billableRate: z.number().positive(),
        clientBudget: z.number().positive().optional()
      }).refine(
        (data) => {
          if (data.clientBudget && data.estimatedHours && data.billableRate) {
            const estimatedCost = data.estimatedHours * data.billableRate
            return estimatedCost <= data.clientBudget
          }
          return true
        },
        { message: 'Estimated cost exceeds client budget', path: ['estimatedHours'] }
      )
      
      const overBudgetData = {
        title: 'Test Matter',
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        priority: 'MEDIUM',
        estimatedHours: 100,
        billableRate: 500,
        clientBudget: 40000 // 100 * 500 = 50000 > 40000
      }
      
      const result = businessRuleSchema.safeParse(overBudgetData)
      expect(result.success).toBe(false)
    })
  })
})
/**
 * Batch Move Matters API Endpoint
 * 
 * @description Server endpoint for handling batch matter move operations
 * with transaction support and conflict resolution.
 * 
 * @author Claude
 * @created 2025-06-26
 * @task T12_S08 - Drag & Drop Mutations
 */

import { z } from 'zod'

/**
 * Request validation schema
 */
const batchMoveRequestSchema = z.object({
  operations: z.array(z.object({
    matterId: z.string().uuid('Invalid matter ID'),
    fromStatus: z.enum(['DRAFT', 'ACTIVE', 'REVIEW', 'COMPLETED', 'ARCHIVED']),
    toStatus: z.enum(['DRAFT', 'ACTIVE', 'REVIEW', 'COMPLETED', 'ARCHIVED']),
    fromIndex: z.number().int().min(0),
    toIndex: z.number().int().min(0),
    matter: z.object({
      id: z.string(),
      caseNumber: z.string(),
      title: z.string(),
      status: z.string()
    }).passthrough()
  })).min(1, 'At least one operation required').max(50, 'Maximum 50 operations per batch'),
  userId: z.string().uuid('Invalid user ID'),
  timestamp: z.string().datetime('Invalid timestamp format')
})

/**
 * Status transition validation rules
 */
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  'DRAFT': ['ACTIVE', 'ARCHIVED'],
  'ACTIVE': ['REVIEW', 'COMPLETED', 'ARCHIVED'],
  'REVIEW': ['ACTIVE', 'COMPLETED', 'ARCHIVED'],
  'COMPLETED': ['ACTIVE', 'ARCHIVED'],
  'ARCHIVED': ['DRAFT', 'ACTIVE']
}

/**
 * Simulate database operations with transaction support
 */
class MockBatchMoveService {
  private matters: any[] = []
  
  constructor() {
    // Initialize with mock data for demonstration
    this.matters = [
      {
        id: '1',
        caseNumber: 'CASE-001',
        title: 'Contract Review',
        status: 'DRAFT',
        position: 1000,
        updatedAt: new Date().toISOString(),
        version: 1
      },
      {
        id: '2', 
        caseNumber: 'CASE-002',
        title: 'Patent Application',
        status: 'ACTIVE',
        position: 2000,
        updatedAt: new Date().toISOString(),
        version: 1
      }
    ]
  }

  /**
   * Execute batch move operations with transaction semantics
   */
  async executeBatchMove(operations: any[], userId: string, timestamp: string) {
    const results: any[] = []
    const rollbackData: any[] = []
    
    try {
      // Phase 1: Validation and conflict detection
      for (const operation of operations) {
        const matter = this.matters.find(m => m.id === operation.matterId)
        
        if (!matter) {
          throw new Error(`Matter ${operation.matterId} not found`)
        }
        
        // Check if matter was modified since operation was initiated
        const operationTime = new Date(timestamp).getTime()
        const matterUpdated = new Date(matter.updatedAt).getTime()
        
        if (matterUpdated > operationTime) {
          throw new Error(`Conflict detected: Matter ${operation.matterId} was modified by another user`)
        }
        
        // Validate status transition
        const allowedStatuses = ALLOWED_TRANSITIONS[operation.fromStatus] || []
        if (!allowedStatuses.includes(operation.toStatus)) {
          throw new Error(`Invalid transition: ${operation.fromStatus} -> ${operation.toStatus}`)
        }
        
        // Store rollback data
        rollbackData.push({ ...matter })
      }
      
      // Phase 2: Calculate optimal positions
      const positionCalculations = this.calculateOptimalPositions(operations)
      
      // Phase 3: Execute operations atomically
      for (let i = 0; i < operations.length; i++) {
        const operation = operations[i]
        const newPosition = positionCalculations[i]
        
        const matterIndex = this.matters.findIndex(m => m.id === operation.matterId)
        
        if (matterIndex !== -1) {
          const updatedMatter = {
            ...this.matters[matterIndex],
            status: operation.toStatus,
            position: newPosition,
            updatedAt: new Date().toISOString(),
            version: this.matters[matterIndex].version + 1,
            lastModifiedBy: userId
          }
          
          this.matters[matterIndex] = updatedMatter
          results.push(updatedMatter)
        }
      }
      
      // Normalize positions to prevent future conflicts
      this.normalizePositionsByStatus()
      
      return results
      
    } catch (error) {
      // Rollback all changes
      for (const rollbackMatter of rollbackData) {
        const index = this.matters.findIndex(m => m.id === rollbackMatter.id)
        if (index !== -1) {
          this.matters[index] = rollbackMatter
        }
      }
      
      throw error
    }
  }
  
  /**
   * Calculate optimal positions for batch operations
   */
  private calculateOptimalPositions(operations: any[]): number[] {
    const positions: number[] = []
    
    // Group operations by target status
    const operationsByStatus = operations.reduce((acc, op, index) => {
      if (!acc[op.toStatus]) {
        acc[op.toStatus] = []
      }
      acc[op.toStatus].push({ ...op, originalIndex: index })
      return acc
    }, {} as Record<string, any[]>)
    
    // Calculate positions for each status group
    Object.entries(operationsByStatus).forEach(([status, ops]: [string, any[]]) => {
      const statusMatters = this.matters
        .filter(m => m.status === status)
        .sort((a, b) => a.position - b.position)
      
      ops.sort((a, b) => a.toIndex - b.toIndex)
      
      ops.forEach((op, index: number) => {
        let newPosition: number
        
        if (op.toIndex === 0) {
          // Insert at beginning
          newPosition = statusMatters.length > 0 
            ? Math.max(statusMatters[0].position - 1000, 0)
            : 1000
        } else if (op.toIndex >= statusMatters.length) {
          // Insert at end
          newPosition = statusMatters.length > 0
            ? statusMatters[statusMatters.length - 1].position + 1000 + (index * 100)
            : 1000 + (index * 100)
        } else {
          // Insert in middle
          const prevPosition = statusMatters[op.toIndex - 1]?.position || 0
          const nextPosition = statusMatters[op.toIndex]?.position || prevPosition + 2000
          newPosition = Math.floor((prevPosition + nextPosition) / 2) + (index * 10)
        }
        
        positions[op.originalIndex] = newPosition
      })
    })
    
    return positions
  }
  
  /**
   * Normalize positions to prevent conflicts
   */
  private normalizePositionsByStatus() {
    const statusGroups = this.matters.reduce((acc, matter) => {
      if (!acc[matter.status]) {
        acc[matter.status] = []
      }
      acc[matter.status].push(matter)
      return acc
    }, {} as Record<string, any[]>)
    
    Object.values(statusGroups).forEach((matters: any[]) => {
      matters
        .sort((a: any, b: any) => a.position - b.position)
        .forEach((matter: any, index: number) => {
          matter.position = (index + 1) * 1000
        })
    })
  }
  
  getMattersByIds(ids: string[]) {
    return this.matters.filter(m => ids.includes(m.id))
  }
}

// Global service instance
const batchMoveService = new MockBatchMoveService()

export default defineEventHandler(async (event: any) => {
  // Set CORS headers
  setHeader(event, 'Access-Control-Allow-Origin', '*')
  setHeader(event, 'Access-Control-Allow-Methods', 'PATCH, OPTIONS')
  setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization')
  setHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate')

  // Handle preflight requests
  if (event.node.req.method === 'OPTIONS') {
    return null
  }

  try {
    // Parse and validate request body
    const body = await readBody(event)
    
    if (!body) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Request body is required'
      })
    }

    // Validate request structure
    const validatedRequest = batchMoveRequestSchema.parse(body)
    
    // Simulate network latency for realistic testing
    const delay = Math.random() * 200 + 100 // 100-300ms
    await new Promise(resolve => setTimeout(resolve, delay))
    
    // Simulate occasional failures for testing error handling
    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error('Simulated server error for testing')
    }
    
    // Execute batch move operations
    const results = await batchMoveService.executeBatchMove(
      validatedRequest.operations,
      validatedRequest.userId,
      validatedRequest.timestamp
    )
    
    // Return updated matters
    return {
      success: true,
      data: results,
      operation: 'batch_move',
      timestamp: new Date().toISOString(),
      processedCount: results.length,
      metadata: {
        operationId: `batch-${Date.now()}`,
        userId: validatedRequest.userId,
        executionTime: delay
      }
    }
    
  } catch (error) {
    console.error('Batch move operation failed:', error)
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: {
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        }
      })
    }
    
    // Handle business logic errors
    if (error instanceof Error) {
      if (error.message.includes('Conflict detected')) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Conflict detected',
          data: {
            error: error.message,
            code: 'CONCURRENT_MODIFICATION',
            retryable: true
          }
        })
      }
      
      if (error.message.includes('Invalid transition')) {
        throw createError({
          statusCode: 422,
          statusMessage: 'Invalid status transition',
          data: {
            error: error.message,
            code: 'INVALID_TRANSITION',
            retryable: false
          }
        })
      }
      
      if (error.message.includes('not found')) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Matter not found',
          data: {
            error: error.message,
            code: 'MATTER_NOT_FOUND',
            retryable: false
          }
        })
      }
    }
    
    // Generic server error
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
      data: {
        error: 'Failed to process batch move operation',
        code: 'BATCH_MOVE_FAILED',
        retryable: true
      }
    })
  }
})
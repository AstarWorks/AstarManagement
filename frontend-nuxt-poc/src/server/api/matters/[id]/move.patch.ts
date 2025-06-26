/**
 * Move Matter API Endpoint
 * 
 * @description Dedicated endpoint for moving matters with position management
 * and status transition validation for drag-and-drop operations.
 * 
 * @author Claude
 * @created 2025-06-26
 * @task T12_S08 - Drag & Drop Mutations
 */

import { z } from 'zod'

/**
 * Move request validation schema
 */
const moveRequestSchema = z.object({
  status: z.enum(['DRAFT', 'ACTIVE', 'REVIEW', 'COMPLETED', 'ARCHIVED']),
  position: z.number().int().min(0, 'Position must be non-negative'),
  timestamp: z.string().datetime().optional()
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
 * Mock database service for matter position management
 */
class MockPositionService {
  private matters: Record<string, any> = {
    '1': {
      id: '1',
      caseNumber: 'CASE-001',
      title: 'Contract Review',
      description: 'Review and analysis of vendor contract',
      clientName: 'ABC Corp',
      status: 'DRAFT',
      priority: 'MEDIUM',
      position: 1000,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      assignedLawyer: 'lawyer-1',
      tags: ['contract', 'vendor'],
      version: 1
    },
    '2': {
      id: '2', 
      caseNumber: 'CASE-002',
      title: 'Patent Application',
      description: 'File patent application for new technology',
      clientName: 'Tech Startup Inc',
      status: 'ACTIVE',
      priority: 'HIGH',
      position: 2000,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
      assignedLawyer: 'lawyer-2',
      tags: ['patent', 'technology'],
      version: 1
    },
    '3': {
      id: '3',
      caseNumber: 'CASE-003', 
      title: 'Employment Dispute',
      description: 'Handle wrongful termination claim',
      clientName: 'Individual Client',
      status: 'REVIEW',
      priority: 'HIGH',
      position: 1500,
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      updatedAt: new Date(Date.now() - 10800000).toISOString(),
      assignedLawyer: 'lawyer-1',
      tags: ['employment', 'dispute'],
      version: 1
    }
  }

  getMatter(id: string) {
    return this.matters[id] || null
  }

  updateMatter(id: string, updates: any) {
    if (!this.matters[id]) {
      throw new Error(`Matter ${id} not found`)
    }

    this.matters[id] = {
      ...this.matters[id],
      ...updates,
      updatedAt: new Date().toISOString(),
      version: this.matters[id].version + 1
    }

    return this.matters[id]
  }

  getMattersByStatus(status: string) {
    return Object.values(this.matters)
      .filter(matter => matter.status === status)
      .sort((a, b) => a.position - b.position)
  }

  /**
   * Normalize positions for all matters in a status to prevent conflicts
   */
  normalizePositions(status: string) {
    const statusMatters = this.getMattersByStatus(status)
    
    statusMatters.forEach((matter, index) => {
      this.matters[matter.id].position = (index + 1) * 1000
    })
  }

  /**
   * Calculate optimal position for a matter being moved
   */
  calculateOptimalPosition(matterId: string, targetStatus: string, requestedPosition: number) {
    const statusMatters = this.getMattersByStatus(targetStatus)
    const movingMatter = this.getMatter(matterId)
    
    // Filter out the moving matter if it's already in the target status
    const existingMatters = statusMatters.filter(m => m.id !== matterId)
    
    // If no existing matters, use the requested position or default
    if (existingMatters.length === 0) {
      return requestedPosition || 1000
    }
    
    // Find the closest position that doesn't conflict
    const sortedPositions = existingMatters.map(m => m.position).sort((a, b) => a - b)
    
    // If requested position is smaller than all existing positions
    if (requestedPosition < sortedPositions[0]) {
      return Math.max(sortedPositions[0] - 1000, 0)
    }
    
    // If requested position is larger than all existing positions
    if (requestedPosition > sortedPositions[sortedPositions.length - 1]) {
      return sortedPositions[sortedPositions.length - 1] + 1000
    }
    
    // Find the best position between two existing positions
    for (let i = 0; i < sortedPositions.length - 1; i++) {
      if (requestedPosition >= sortedPositions[i] && requestedPosition <= sortedPositions[i + 1]) {
        const gap = sortedPositions[i + 1] - sortedPositions[i]
        if (gap > 100) {
          // Use the requested position if there's enough gap
          return requestedPosition
        } else {
          // Calculate middle position
          return Math.floor((sortedPositions[i] + sortedPositions[i + 1]) / 2)
        }
      }
    }
    
    return requestedPosition
  }
}

// Global service instance
const positionService = new MockPositionService()

export default defineEventHandler(async (event) => {
  // Set CORS headers
  setHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  })

  // Handle preflight requests
  if (getMethod(event) === 'OPTIONS') {
    return null
  }

  const matterId = getRouterParam(event, 'id')
  
  try {
    // Validate matter ID
    if (!matterId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Matter ID is required'
      })
    }

    // Get current matter
    const currentMatter = positionService.getMatter(matterId)
    if (!currentMatter) {
      throw createError({
        statusCode: 404,
        statusMessage: `Matter ${matterId} not found`
      })
    }

    // Parse and validate request body
    const body = await readBody(event)
    if (!body) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Request body is required'
      })
    }

    const validatedRequest = moveRequestSchema.parse(body)
    
    // Validate status transition
    const allowedStatuses = ALLOWED_TRANSITIONS[currentMatter.status] || []
    if (!allowedStatuses.includes(validatedRequest.status)) {
      throw createError({
        statusCode: 422,
        statusMessage: `Invalid status transition: ${currentMatter.status} -> ${validatedRequest.status}`,
        data: {
          currentStatus: currentMatter.status,
          requestedStatus: validatedRequest.status,
          allowedStatuses,
          code: 'INVALID_TRANSITION'
        }
      })
    }

    // Check for concurrent modifications if timestamp provided
    if (validatedRequest.timestamp) {
      const requestTime = new Date(validatedRequest.timestamp).getTime()
      const matterUpdated = new Date(currentMatter.updatedAt).getTime()
      
      if (matterUpdated > requestTime) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Conflict detected: Matter was modified by another user',
          data: {
            currentVersion: currentMatter.version,
            currentUpdatedAt: currentMatter.updatedAt,
            requestTimestamp: validatedRequest.timestamp,
            code: 'CONCURRENT_MODIFICATION'
          }
        })
      }
    }

    // Simulate processing time
    const delay = Math.random() * 150 + 50 // 50-200ms
    await new Promise(resolve => setTimeout(resolve, delay))
    
    // Simulate occasional failures for testing
    if (Math.random() < 0.03) { // 3% failure rate
      throw new Error('Simulated server error for move operation testing')
    }

    // Calculate optimal position
    const optimalPosition = positionService.calculateOptimalPosition(
      matterId,
      validatedRequest.status,
      validatedRequest.position
    )

    // Update the matter
    const updatedMatter = positionService.updateMatter(matterId, {
      status: validatedRequest.status,
      position: optimalPosition,
      lastModifiedBy: 'current-user' // TODO: Get from auth context
    })

    // Normalize positions if there are conflicts
    if (Math.abs(optimalPosition - validatedRequest.position) > 500) {
      // Position was adjusted significantly, normalize to prevent future conflicts
      setTimeout(() => {
        positionService.normalizePositions(validatedRequest.status)
      }, 1000)
    }

    // Set optimistic update headers
    setHeader(event, 'ETag', `"matter-${matterId}-${updatedMatter.version}"`)
    
    return {
      success: true,
      data: updatedMatter,
      operation: 'move',
      timestamp: new Date().toISOString(),
      metadata: {
        originalPosition: validatedRequest.position,
        finalPosition: optimalPosition,
        positionAdjusted: optimalPosition !== validatedRequest.position,
        executionTime: delay,
        transitionValidated: true
      }
    }
    
  } catch (error) {
    console.error(`Move operation failed for matter ${matterId}:`, error)
    
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
    
    // Re-throw HTTP errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    // Handle generic errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Matter not found',
          data: {
            matterId,
            error: error.message,
            code: 'MATTER_NOT_FOUND'
          }
        })
      }
    }
    
    // Generic server error
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
      data: {
        error: 'Failed to move matter',
        matterId,
        code: 'MOVE_OPERATION_FAILED',
        retryable: true
      }
    })
  }
})
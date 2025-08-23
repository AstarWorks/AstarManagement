/**
 * Default Mock Handler
 * Fallback handler for unmapped endpoints
 */

import type { IRequestOptions } from '../../types'
import { ApiError } from '../../core/ApiError'

export default function defaultHandler(options: IRequestOptions) {
  console.warn(`[MockHandler] No specific handler for: ${options.endpoint}`)
  
  // Return a default response based on method
  switch (options.method) {
    case 'GET':
      // Return empty list for list endpoints
      if (options.endpoint.match(/\/$/)) {
        return {
          data: [],
          total: 0,
          page: 1,
          pageSize: 20,
          hasNext: false,
          hasPrev: false
        }
      }
      // Return not found for specific resource
      throw new ApiError({
        message: 'Resource not found',
        statusCode: 404,
        code: 'NOT_FOUND',
        path: options.endpoint
      })
      
    case 'POST':
      // Echo back the posted data with a generated ID
      return {
        id: Math.random().toString(36).substring(7),
        ...(typeof options.body === 'object' && options.body !== null ? options.body : {}),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
    case 'PUT':
    case 'PATCH':
      // Echo back the updated data
      return {
        ...(typeof options.body === 'object' && options.body !== null ? options.body : {}),
        updatedAt: new Date().toISOString()
      }
      
    case 'DELETE':
      // Return success for delete operations
      return { success: true, message: 'Resource deleted successfully' }
      
    default:
      throw new ApiError({
        message: 'Method not allowed',
        statusCode: 405,
        code: 'METHOD_NOT_ALLOWED',
        path: options.endpoint
      })
  }
}
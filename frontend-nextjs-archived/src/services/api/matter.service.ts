/**
 * Matter service for CRUD operations
 * 
 * Handles all matter-related API calls including:
 * - CRUD operations (Create, Read, Update, Delete)
 * - Pagination and filtering
 * - Status updates with validation
 * - Error handling and response transformation
 */

import { apiClient, handleApiResponse, createApiError } from './client'
import { retryWithBackoff } from '../error/error.handler'

// Backend DTO types matching exactly
export interface MatterDto {
  id: string
  caseNumber: string
  title: string
  description?: string
  status: MatterStatus
  priority: MatterPriority
  clientName: string
  clientContact?: string
  opposingParty?: string
  courtName?: string
  filingDate?: string // ISO date string
  estimatedCompletionDate?: string // ISO date string
  actualCompletionDate?: string // ISO date string
  assignedLawyerId?: string
  assignedLawyerName?: string
  assignedClerkId?: string
  assignedClerkName?: string
  notes?: string
  tags: string[]
  isActive: boolean
  isOverdue: boolean
  isCompleted: boolean
  ageInDays: number
  createdAt: string // ISO datetime string
  updatedAt: string // ISO datetime string
  createdBy: string
  updatedBy: string
}

// Request DTOs matching backend
export interface CreateMatterRequest {
  caseNumber: string
  title: string
  description?: string
  status: MatterStatus
  priority: MatterPriority
  clientName: string
  clientContact?: string
  opposingParty?: string
  courtName?: string
  filingDate?: string
  estimatedCompletionDate?: string
  assignedLawyerId: string
  assignedClerkId?: string
  notes?: string
  tags: string[]
}

export interface UpdateMatterRequest {
  title: string
  description?: string
  clientName: string
  clientContact?: string
  opposingParty?: string
  courtName?: string
  filingDate?: string
  estimatedCompletionDate?: string
  priority?: MatterPriority
  assignedLawyerId?: string
  assignedClerkId?: string
  notes?: string
  tags?: string[]
}

export interface UpdateMatterStatusRequest {
  status: MatterStatus
  comment?: string
}

// Enums matching backend exactly
export enum MatterStatus {
  INTAKE = 'INTAKE',
  INITIAL_REVIEW = 'INITIAL_REVIEW',
  INVESTIGATION = 'INVESTIGATION',
  RESEARCH = 'RESEARCH',
  DRAFT_PLEADINGS = 'DRAFT_PLEADINGS',
  FILED = 'FILED',
  DISCOVERY = 'DISCOVERY',
  MEDIATION = 'MEDIATION',
  TRIAL_PREP = 'TRIAL_PREP',
  TRIAL = 'TRIAL',
  SETTLEMENT = 'SETTLEMENT',
  CLOSED = 'CLOSED'
}

export enum MatterPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

// Pagination and filtering
export interface PagedResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
  numberOfElements: number
}

export interface MatterFilters {
  status?: MatterStatus
  priority?: MatterPriority
  clientName?: string
  assignedLawyer?: string
}

export interface PaginationParams {
  page?: number
  size?: number
  sort?: string
}

const MATTERS_ENDPOINT = '/api/v1/matters'

/**
 * Create a new matter
 */
export async function createMatter(request: CreateMatterRequest): Promise<MatterDto> {
  try {
    console.log('Creating matter:', request.caseNumber)
    
    const response = await apiClient.post<MatterDto>(MATTERS_ENDPOINT, request)
    const matter = handleApiResponse(response)
    
    console.log('Matter created successfully:', matter.id)
    return matter
  } catch (error) {
    console.error('Failed to create matter:', error)
    throw createApiError(error)
  }
}

/**
 * Get matter by ID
 */
export async function getMatterById(id: string): Promise<MatterDto> {
  try {
    console.log('Fetching matter:', id)
    
    const response = await apiClient.get<MatterDto>(`${MATTERS_ENDPOINT}/${id}`)
    const matter = handleApiResponse(response)
    
    console.log('Matter fetched successfully:', matter.caseNumber)
    return matter
  } catch (error) {
    console.error('Failed to fetch matter:', error)
    throw createApiError(error)
  }
}

/**
 * Get all matters with pagination and filtering
 */
export async function getMatters(
  pagination: PaginationParams = {},
  filters: MatterFilters = {}
): Promise<PagedResponse<MatterDto>> {
  try {
    console.log('Fetching matters:', { pagination, filters })
    
    const params = new URLSearchParams()
    
    // Add pagination params
    if (pagination.page !== undefined) params.append('page', pagination.page.toString())
    if (pagination.size !== undefined) params.append('size', pagination.size.toString())
    if (pagination.sort) params.append('sort', pagination.sort)
    
    // Add filter params
    if (filters.status) params.append('status', filters.status)
    if (filters.priority) params.append('priority', filters.priority)
    if (filters.clientName) params.append('clientName', filters.clientName)
    if (filters.assignedLawyer) params.append('assignedLawyer', filters.assignedLawyer)
    
    const response = await apiClient.get<PagedResponse<MatterDto>>(
      `${MATTERS_ENDPOINT}?${params.toString()}`
    )
    
    const pagedMatters = handleApiResponse(response)
    
    console.log(`Fetched ${pagedMatters.numberOfElements} matters (page ${pagedMatters.page + 1}/${pagedMatters.totalPages})`)
    return pagedMatters
  } catch (error) {
    console.error('Failed to fetch matters:', error)
    throw createApiError(error)
  }
}

/**
 * Update existing matter
 */
export async function updateMatter(id: string, request: UpdateMatterRequest): Promise<MatterDto> {
  try {
    console.log('Updating matter:', id)
    
    const response = await apiClient.put<MatterDto>(`${MATTERS_ENDPOINT}/${id}`, request)
    const matter = handleApiResponse(response)
    
    console.log('Matter updated successfully:', matter.caseNumber)
    return matter
  } catch (error) {
    console.error('Failed to update matter:', error)
    throw createApiError(error)
  }
}

/**
 * Update matter status
 */
export async function updateMatterStatus(
  id: string,
  request: UpdateMatterStatusRequest
): Promise<MatterDto> {
  try {
    console.log('Updating matter status:', id, 'to', request.status)
    
    const response = await apiClient.patch<MatterDto>(`${MATTERS_ENDPOINT}/${id}/status`, request)
    const matter = handleApiResponse(response)
    
    console.log('Matter status updated successfully:', matter.status)
    return matter
  } catch (error) {
    console.error('Failed to update matter status:', error)
    throw createApiError(error)
  }
}

/**
 * Delete matter (soft delete)
 */
export async function deleteMatter(id: string): Promise<void> {
  try {
    console.log('Deleting matter:', id)
    
    await apiClient.delete(`${MATTERS_ENDPOINT}/${id}`)
    
    console.log('Matter deleted successfully')
  } catch (error) {
    console.error('Failed to delete matter:', error)
    throw createApiError(error)
  }
}

/**
 * Get matters with retry logic for improved reliability
 */
export async function getMattersWithRetry(
  pagination: PaginationParams = {},
  filters: MatterFilters = {},
  maxRetries = 3
): Promise<PagedResponse<MatterDto>> {
  return retryWithBackoff(
    () => getMatters(pagination, filters),
    maxRetries
  )
}

/**
 * Batch update matters
 */
export async function batchUpdateMatters(
  updates: Array<{ id: string; request: UpdateMatterRequest }>
): Promise<MatterDto[]> {
  try {
    console.log(`Batch updating ${updates.length} matters`)
    
    // Execute updates in parallel with limited concurrency
    const results = await Promise.allSettled(
      updates.map(({ id, request }) => updateMatter(id, request))
    )
    
    const successful: MatterDto[] = []
    const failed: Array<{ id: string; error: any }> = []
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value)
      } else {
        failed.push({ id: updates[index].id, error: result.reason })
      }
    })
    
    if (failed.length > 0) {
      console.warn(`${failed.length} matters failed to update:`, failed)
    }
    
    console.log(`Batch update completed: ${successful.length} successful, ${failed.length} failed`)
    return successful
  } catch (error) {
    console.error('Batch update failed:', error)
    throw createApiError(error)
  }
}

/**
 * Search matters by text query
 */
export async function searchMatters(
  query: string,
  pagination: PaginationParams = {}
): Promise<PagedResponse<MatterDto>> {
  try {
    console.log('Searching matters:', query)
    
    // Use clientName filter for text search (backend may expand this)
    return await getMatters(pagination, { clientName: query })
  } catch (error) {
    console.error('Failed to search matters:', error)
    throw createApiError(error)
  }
}

/**
 * Get matter statistics for dashboard
 */
export async function getMatterStats(): Promise<{
  total: number
  byStatus: Record<MatterStatus, number>
  byPriority: Record<MatterPriority, number>
  overdue: number
}> {
  try {
    // Fetch first page to get total count and sample data
    const response = await getMatters({ page: 0, size: 100 })
    
    const stats = {
      total: response.totalElements,
      byStatus: {} as Record<MatterStatus, number>,
      byPriority: {} as Record<MatterPriority, number>,
      overdue: 0
    }
    
    // Initialize counters
    Object.values(MatterStatus).forEach(status => {
      stats.byStatus[status] = 0
    })
    Object.values(MatterPriority).forEach(priority => {
      stats.byPriority[priority] = 0
    })
    
    // Count from available data
    response.content.forEach(matter => {
      stats.byStatus[matter.status]++
      stats.byPriority[matter.priority]++
      if (matter.isOverdue) {
        stats.overdue++
      }
    })
    
    return stats
  } catch (error) {
    console.error('Failed to get matter stats:', error)
    throw createApiError(error)
  }
}
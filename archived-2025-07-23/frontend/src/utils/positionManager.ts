/**
 * Position Management Utility
 * 
 * @description Utility functions for managing matter positions in Kanban columns
 * with conflict resolution and optimization algorithms.
 * 
 * @author Claude
 * @created 2025-06-26
 * @task T12_S08 - Drag & Drop Mutations
 */

import type { MatterCard, MatterStatus } from '~/types/kanban'

/**
 * Position calculation configuration
 */
export const POSITION_CONFIG = {
  DEFAULT_INCREMENT: 1000,
  MIN_GAP: 100,
  NORMALIZATION_THRESHOLD: 50,
  MAX_POSITION: 999999999,
  CONFLICT_RESOLUTION_ATTEMPTS: 3
} as const

/**
 * Position calculation result
 */
export interface PositionCalculation {
  position: number
  needsNormalization: boolean
  conflictResolved: boolean
  originalGap?: number
  adjustedGap?: number
}

/**
 * Position conflict detection
 */
export interface PositionConflict {
  matterId: string
  currentPosition: number
  conflictingMatter: MatterCard
  suggestedPosition: number
}

/**
 * Calculate optimal position for a matter being inserted into a column
 */
export function calculateInsertPosition(
  targetIndex: number,
  existingMatters: MatterCard[],
  excludeMatterId?: string
): PositionCalculation {
  // Filter out the matter being moved if it exists in the same column
  const filteredMatters = excludeMatterId 
    ? existingMatters.filter(m => m.id !== excludeMatterId)
    : existingMatters

  // Sort by position to ensure correct order
  const sortedMatters = filteredMatters.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  
  // If no existing matters, use default position
  if (sortedMatters.length === 0) {
    return {
      position: POSITION_CONFIG.DEFAULT_INCREMENT,
      needsNormalization: false,
      conflictResolved: true
    }
  }
  
  // Insert at the beginning
  if (targetIndex === 0) {
    const firstPosition = sortedMatters[0].position ?? POSITION_CONFIG.DEFAULT_INCREMENT
    const newPosition = Math.max(firstPosition - POSITION_CONFIG.DEFAULT_INCREMENT, 0)
    
    return {
      position: newPosition,
      needsNormalization: newPosition === 0 && firstPosition < POSITION_CONFIG.DEFAULT_INCREMENT,
      conflictResolved: true
    }
  }
  
  // Insert at the end
  if (targetIndex >= sortedMatters.length) {
    const lastPosition = sortedMatters[sortedMatters.length - 1].position ?? 0
    const newPosition = lastPosition + POSITION_CONFIG.DEFAULT_INCREMENT
    
    return {
      position: Math.min(newPosition, POSITION_CONFIG.MAX_POSITION),
      needsNormalization: newPosition >= POSITION_CONFIG.MAX_POSITION,
      conflictResolved: true
    }
  }
  
  // Insert in the middle
  const prevMatter = sortedMatters[targetIndex - 1]
  const nextMatter = sortedMatters[targetIndex]
  const gap = (nextMatter.position ?? 0) - (prevMatter.position ?? 0)
  
  if (gap <= POSITION_CONFIG.MIN_GAP) {
    // Gap too small, need normalization
    return {
      position: Math.floor(((prevMatter.position ?? 0) + (nextMatter.position ?? 0)) / 2),
      needsNormalization: true,
      conflictResolved: false,
      originalGap: gap,
      adjustedGap: gap / 2
    }
  }
  
  // Sufficient gap, calculate middle position
  const middlePosition = Math.floor(((prevMatter.position ?? 0) + (nextMatter.position ?? 0)) / 2)
  
  return {
    position: middlePosition,
    needsNormalization: false,
    conflictResolved: true,
    originalGap: gap,
    adjustedGap: gap / 2
  }
}

/**
 * Normalize positions for all matters in a status column
 */
export function normalizeColumnPositions(matters: MatterCard[]): MatterCard[] {
  return matters
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((matter, index) => ({
      ...matter,
      position: (index + 1) * POSITION_CONFIG.DEFAULT_INCREMENT
    }))
}

/**
 * Detect position conflicts in a set of matters
 */
export function detectPositionConflicts(matters: MatterCard[]): PositionConflict[] {
  const conflicts: PositionConflict[] = []
  const positionMap = new Map<number, MatterCard[]>()
  
  // Group matters by position
  matters.forEach(matter => {
    const position = matter.position ?? 0
    if (!positionMap.has(position)) {
      positionMap.set(position, [])
    }
    positionMap.get(position)!.push(matter)
  })
  
  // Find positions with multiple matters
  positionMap.forEach((mattersAtPosition, position) => {
    if (mattersAtPosition.length > 1) {
      mattersAtPosition.forEach((matter, index) => {
        if (index > 0) { // First matter keeps the position
          const suggestedPosition = position + (index * POSITION_CONFIG.MIN_GAP)
          conflicts.push({
            matterId: matter.id,
            currentPosition: position,
            conflictingMatter: mattersAtPosition[0],
            suggestedPosition: Math.min(suggestedPosition, POSITION_CONFIG.MAX_POSITION)
          })
        }
      })
    }
  })
  
  return conflicts
}

/**
 * Resolve position conflicts by adjusting conflicted matters
 */
export function resolvePositionConflicts(
  matters: MatterCard[], 
  conflicts: PositionConflict[]
): MatterCard[] {
  if (conflicts.length === 0) return matters
  
  const resolvedMatters = [...matters]
  
  conflicts.forEach(conflict => {
    const matterIndex = resolvedMatters.findIndex(m => m.id === conflict.matterId)
    if (matterIndex !== -1) {
      resolvedMatters[matterIndex] = {
        ...resolvedMatters[matterIndex],
        position: conflict.suggestedPosition
      }
    }
  })
  
  return resolvedMatters
}

/**
 * Calculate positions for a batch of matters being moved
 */
export function calculateBatchPositions(
  operations: Array<{
    matterId: string
    targetStatus: MatterStatus
    targetIndex: number
  }>,
  mattersByStatus: Record<MatterStatus, MatterCard[]>
): Record<string, number> {
  const positions: Record<string, number> = {}
  const workingState = { ...mattersByStatus }
  
  // Group operations by target status
  const operationsByStatus = operations.reduce((acc, op) => {
    if (!acc[op.targetStatus]) {
      acc[op.targetStatus] = []
    }
    acc[op.targetStatus].push(op)
    return acc
  }, {} as Record<MatterStatus, typeof operations>)
  
  // Process each status group
  Object.entries(operationsByStatus).forEach(([status, statusOps]) => {
    const statusMatters = workingState[status as MatterStatus] || []
    
    // Sort operations by target index
    const sortedOps = statusOps.sort((a, b) => a.targetIndex - b.targetIndex)
    
    sortedOps.forEach((op, opIndex) => {
      const calculation = calculateInsertPosition(
        op.targetIndex + opIndex, // Adjust index for previous insertions
        statusMatters,
        op.matterId
      )
      
      positions[op.matterId] = calculation.position
      
      // Add to working state for subsequent calculations
      statusMatters.push({
        id: op.matterId,
        position: calculation.position,
        status: status as MatterStatus
      } as MatterCard)
      
      statusMatters.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    })
  })
  
  return positions
}

/**
 * Optimize positions to prevent future conflicts
 */
export function optimizePositions(matters: MatterCard[]): MatterCard[] {
  const sortedMatters = matters.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  const optimized: MatterCard[] = []
  
  let currentPosition = POSITION_CONFIG.DEFAULT_INCREMENT
  
  sortedMatters.forEach(matter => {
    optimized.push({
      ...matter,
      position: currentPosition
    })
    currentPosition += POSITION_CONFIG.DEFAULT_INCREMENT
  })
  
  return optimized
}

/**
 * Check if positions need normalization
 */
export function needsNormalization(matters: MatterCard[]): boolean {
  if (matters.length === 0) return false
  
  const sortedMatters = matters.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  
  // Check for conflicts
  const conflicts = detectPositionConflicts(sortedMatters)
  if (conflicts.length > 0) return true
  
  // Check for insufficient gaps
  for (let i = 0; i < sortedMatters.length - 1; i++) {
    const gap = (sortedMatters[i + 1]?.position ?? 0) - (sortedMatters[i]?.position ?? 0)
    if (gap < POSITION_CONFIG.MIN_GAP) return true
  }
  
  // Check for positions too close to limits
  const firstPosition = sortedMatters[0]?.position ?? 0
  const lastPosition = sortedMatters[sortedMatters.length - 1]?.position ?? 0
  
  if (firstPosition < POSITION_CONFIG.MIN_GAP) return true
  if (lastPosition > POSITION_CONFIG.MAX_POSITION - POSITION_CONFIG.MIN_GAP) return true
  
  return false
}

/**
 * Get safe position for inserting a new matter
 */
export function getSafeInsertPosition(
  targetIndex: number,
  existingMatters: MatterCard[]
): number {
  const calculation = calculateInsertPosition(targetIndex, existingMatters)
  
  if (calculation.needsNormalization) {
    // Return a normalized position
    const normalizedMatters = normalizeColumnPositions(existingMatters)
    const normalizedCalculation = calculateInsertPosition(targetIndex, normalizedMatters)
    return normalizedCalculation.position
  }
  
  return calculation.position
}

/**
 * Position statistics for monitoring and debugging
 */
export function getPositionStatistics(matters: MatterCard[]) {
  if (matters.length === 0) {
    return {
      count: 0,
      minPosition: 0,
      maxPosition: 0,
      averageGap: 0,
      conflicts: 0,
      needsNormalization: false
    }
  }
  
  const sortedMatters = matters.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  const conflicts = detectPositionConflicts(sortedMatters)
  
  const gaps = []
  for (let i = 0; i < sortedMatters.length - 1; i++) {
    gaps.push((sortedMatters[i + 1]?.position ?? 0) - (sortedMatters[i]?.position ?? 0))
  }
  
  const averageGap = gaps.length > 0 ? gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length : 0
  
  return {
    count: matters.length,
    minPosition: sortedMatters[0]?.position ?? 0,
    maxPosition: sortedMatters[sortedMatters.length - 1]?.position ?? 0,
    averageGap,
    minGap: gaps.length > 0 ? Math.min(...gaps) : 0,
    maxGap: gaps.length > 0 ? Math.max(...gaps) : 0,
    conflicts: conflicts.length,
    needsNormalization: needsNormalization(sortedMatters)
  }
}
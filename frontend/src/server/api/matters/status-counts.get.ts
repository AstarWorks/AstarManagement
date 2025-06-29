/**
 * Matter Status Counts API Endpoint
 * 
 * @description Provides real-time counts of matters by status for Kanban columns
 * @author Claude
 * @created 2025-06-26
 * @task T11_S08 - Advanced Queries Search
 */

export default defineEventHandler(async (event: any) => {
  // Simulate quick count query
  await new Promise(resolve => setTimeout(resolve, 25))
  
  const query = getQuery(event)
  const includeEmpty = query.includeEmpty === 'true'
  const priority = query.priority as string
  const lawyer = query.lawyer as string
  const dateRange = query.dateRange as string // today, week, month, quarter, year
  
  // Mock status counts (would typically be a fast database query)
  let baseCounts = {
    intake: 2,
    investigation: 2,
    negotiation: 2,
    litigation: 1,
    settlement: 2,
    collection: 1,
    closed: 2
  }
  
  // Apply filters to counts
  if (priority) {
    // Simulate filtering by priority (reduce counts)
    const priorityMultiplier = {
      'LOW': 0.25,
      'MEDIUM': 0.33,
      'HIGH': 0.25,
      'URGENT': 0.17
    }
    const multiplier = priorityMultiplier[priority as keyof typeof priorityMultiplier] || 1
    
    Object.keys(baseCounts).forEach(status => {
      baseCounts[status as keyof typeof baseCounts] = Math.floor(
        baseCounts[status as keyof typeof baseCounts] * multiplier
      )
    })
  }
  
  if (lawyer) {
    // Simulate filtering by lawyer (different distribution)
    const lawyerMultipliers = {
      'lawyer-1': 0.4, // 田中太郎 handles more cases
      'lawyer-2': 0.25,
      'lawyer-3': 0.15,
      'lawyer-4': 0.15,
      'lawyer-5': 0.15
    }
    const multiplier = lawyerMultipliers[lawyer as keyof typeof lawyerMultipliers] || 0
    
    Object.keys(baseCounts).forEach(status => {
      baseCounts[status as keyof typeof baseCounts] = Math.floor(
        baseCounts[status as keyof typeof baseCounts] * multiplier
      )
    })
  }
  
  if (dateRange) {
    // Simulate date range filtering
    const dateMultipliers = {
      'today': 0.1,
      'week': 0.3,
      'month': 0.8,
      'quarter': 1.0,
      'year': 1.0
    }
    const multiplier = dateMultipliers[dateRange as keyof typeof dateMultipliers] || 1
    
    Object.keys(baseCounts).forEach(status => {
      baseCounts[status as keyof typeof baseCounts] = Math.floor(
        baseCounts[status as keyof typeof baseCounts] * multiplier
      )
    })
  }
  
  // Remove zero counts unless explicitly requested
  if (!includeEmpty) {
    Object.keys(baseCounts).forEach(status => {
      if (baseCounts[status as keyof typeof baseCounts] === 0) {
        delete baseCounts[status as keyof typeof baseCounts]
      }
    })
  }
  
  // Calculate additional metrics
  const totalActive = Object.values(baseCounts).reduce((sum, count) => sum + count, 0) - (baseCounts.closed || 0)
  const totalMatters = Object.values(baseCounts).reduce((sum, count) => sum + count, 0)
  const completionRate = totalMatters > 0 ? (baseCounts.closed || 0) / totalMatters : 0
  
  // Status metadata for UI
  const statusMetadata = {
    intake: { 
      label: 'Intake', 
      color: '#3B82F6', 
      order: 1,
      description: 'New matters awaiting initial review'
    },
    investigation: { 
      label: 'Investigation', 
      color: '#F59E0B', 
      order: 2,
      description: 'Active investigation and fact-finding'
    },
    negotiation: { 
      label: 'Negotiation', 
      color: '#8B5CF6', 
      order: 3,
      description: 'Settlement discussions in progress'
    },
    litigation: { 
      label: 'Litigation', 
      color: '#EF4444', 
      order: 4,
      description: 'Active court proceedings'
    },
    settlement: { 
      label: 'Settlement', 
      color: '#10B981', 
      order: 5,
      description: 'Settlement documentation and finalization'
    },
    collection: { 
      label: 'Collection', 
      color: '#F97316', 
      order: 6,
      description: 'Enforcement and collection activities'
    },
    closed: { 
      label: 'Closed', 
      color: '#6B7280', 
      order: 7,
      description: 'Completed matters'
    }
  }
  
  // Add trend indicators (simplified)
  const trendsData = Object.keys(baseCounts).reduce((acc, status) => {
    acc[status] = {
      current: baseCounts[status as keyof typeof baseCounts],
      previousPeriod: Math.max(0, baseCounts[status as keyof typeof baseCounts] + Math.floor(Math.random() * 3 - 1)), // Simulate previous period
      trend: Math.random() > 0.5 ? 'up' : 'down'
    }
    return acc
  }, {} as Record<string, any>)
  
  // Add caching headers (very short cache for real-time counts)
  setHeader(event, 'Cache-Control', 'public, max-age=30, stale-while-revalidate=60')
  
  return {
    counts: baseCounts,
    trends: trendsData,
    metadata: statusMetadata,
    summary: {
      totalActive,
      totalMatters,
      completionRate: Math.round(completionRate * 100) / 100,
      lastUpdated: new Date().toISOString()
    },
    filters: {
      priority,
      lawyer,
      dateRange,
      includeEmpty
    }
  }
})
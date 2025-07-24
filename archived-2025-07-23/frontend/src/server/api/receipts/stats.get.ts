import { defineEventHandler, getQuery } from 'h3'

/**
 * GET /api/receipts/stats
 * 
 * Get receipt statistics including counts by status and file sizes.
 */

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { expenseId, dateFrom, dateTo } = query

  try {
    // Mock statistics data
    const baseStats = {
      total: 125,
      pending: 8,
      processing: 3,
      completed: 108,
      failed: 6,
      totalFileSize: 45678901, // bytes
      avgProcessingTime: 2350, // milliseconds
      
      // Additional breakdown
      byMimeType: {
        'image/jpeg': 95,
        'image/png': 22,
        'image/webp': 6,
        'image/heic': 2
      },
      
      byFileSize: {
        'under1MB': 34,
        '1MB-5MB': 78,
        '5MB-10MB': 13,
        'over10MB': 0
      },
      
      recentActivity: {
        uploadedToday: 5,
        processedToday: 12,
        failedToday: 1
      },
      
      processingMetrics: {
        averageConfidence: 0.89,
        successRate: 0.94,
        avgExtractionAccuracy: 0.91
      }
    }

    // Apply filters to adjust stats
    let filteredStats = { ...baseStats }

    if (expenseId) {
      // If filtering by specific expense, reduce numbers
      filteredStats = {
        ...filteredStats,
        total: 8,
        pending: 1,
        processing: 0,
        completed: 6,
        failed: 1,
        totalFileSize: Math.round(baseStats.totalFileSize * 0.064), // 8/125
        recentActivity: {
          uploadedToday: 2,
          processedToday: 3,
          failedToday: 0
        }
      }
    }

    if (dateFrom || dateTo) {
      // If date filtering, adjust for time range
      const rangeFactor = 0.3 // Assume 30% of data in selected range
      filteredStats = {
        ...filteredStats,
        total: Math.round(filteredStats.total * rangeFactor),
        pending: Math.round(filteredStats.pending * rangeFactor),
        processing: Math.round(filteredStats.processing * rangeFactor),
        completed: Math.round(filteredStats.completed * rangeFactor),
        failed: Math.round(filteredStats.failed * rangeFactor),
        totalFileSize: Math.round(filteredStats.totalFileSize * rangeFactor)
      }
    }

    // Calculate derived metrics
    const successfullyProcessed = filteredStats.completed + filteredStats.failed
    const processingSuccessRate = successfullyProcessed > 0 
      ? filteredStats.completed / successfullyProcessed 
      : 0

    const response = {
      ...filteredStats,
      
      // Calculated fields
      successRate: Math.round(processingSuccessRate * 100) / 100,
      averageFileSize: filteredStats.total > 0 
        ? Math.round(filteredStats.totalFileSize / filteredStats.total)
        : 0,
      
      // Format file size for display
      formattedTotalSize: formatFileSize(filteredStats.totalFileSize),
      formattedAverageSize: filteredStats.total > 0 
        ? formatFileSize(Math.round(filteredStats.totalFileSize / filteredStats.total))
        : '0 B',
      
      // Processing queue info
      queueInfo: {
        itemsInQueue: filteredStats.pending + filteredStats.processing,
        estimatedWaitTime: (filteredStats.pending * filteredStats.avgProcessingTime) / 1000, // seconds
        isProcessing: filteredStats.processing > 0
      },
      
      // Health metrics
      healthMetrics: {
        status: filteredStats.failed / filteredStats.total < 0.1 ? 'healthy' : 'degraded',
        errorRate: filteredStats.total > 0 ? filteredStats.failed / filteredStats.total : 0,
        avgConfidence: filteredStats.processingMetrics.averageConfidence
      },
      
      // Generated at timestamp
      generatedAt: new Date().toISOString(),
      filters: {
        expenseId: expenseId || null,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null
      }
    }

    console.log('Receipt stats generated:', {
      total: response.total,
      filters: response.filters,
      generatedAt: response.generatedAt
    })

    return response

  } catch (error) {
    console.error('Failed to generate receipt stats:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate receipt statistics'
    })
  }
})

// Helper function to format file sizes
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
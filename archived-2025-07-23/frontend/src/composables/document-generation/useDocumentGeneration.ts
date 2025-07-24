import { ref, computed } from 'vue'
import type { Ref } from 'vue'

// Types
export interface GenerationParams {
  templateId: string
  matterId: string
  format: 'pdf' | 'docx' | 'html' | 'txt'
  options?: {
    pageSize?: 'a4' | 'letter' | 'legal'
    includeWatermark?: boolean
    customStyles?: string
  }
}

export interface GenerationJob {
  id: string
  templateId: string
  matterId: string
  format: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress: number
  startedAt?: Date
  completedAt?: Date
  error?: string
  resultDocumentId?: string
  estimatedTime?: number
}

export interface BatchOperation {
  id: string
  name: string
  templateIds: string[]
  matterIds: string[]
  format: string
  totalItems: number
  completedItems: number
  failedItems: number
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'paused'
  startedAt?: Date
  completedAt?: Date
  estimatedCompletion?: Date
  duration?: number
  error?: string
}

export interface GenerationHistory {
  id: string
  templateName: string
  matterTitle: string
  format: string
  status: 'completed' | 'failed'
  createdAt: Date
  downloadUrl?: string
  error?: string
}

// Mock data and simulation helpers
const generateId = () => Math.random().toString(36).substr(2, 9)

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Global state for document generation
const activeJobs = ref<GenerationJob[]>([])
const batchOperations = ref<BatchOperation[]>([])
const generationHistory = ref<GenerationHistory[]>([
  // Mock history data
  {
    id: '1',
    templateName: 'Estate Planning Template',
    matterTitle: 'Johnson Family Trust',
    format: 'pdf',
    status: 'completed',
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    downloadUrl: '/mock/documents/1.pdf'
  },
  {
    id: '2',
    templateName: 'Contract Amendment',
    matterTitle: 'TechCorp Merger',
    format: 'docx',
    status: 'completed',
    createdAt: new Date(Date.now() - 172800000), // 2 days ago
    downloadUrl: '/mock/documents/2.docx'
  },
  {
    id: '3',
    templateName: 'Settlement Agreement',
    matterTitle: 'Property Dispute',
    format: 'pdf',
    status: 'failed',
    createdAt: new Date(Date.now() - 259200000), // 3 days ago
    error: 'Template variable "settlement_amount" not found'
  }
])

/**
 * Main composable for document generation functionality
 */
export function useDocumentGeneration() {
  // Methods
  const generateDocument = async (params: GenerationParams): Promise<GenerationJob> => {
    const job: GenerationJob = {
      id: generateId(),
      templateId: params.templateId,
      matterId: params.matterId,
      format: params.format,
      status: 'pending',
      progress: 0,
      startedAt: new Date(),
      estimatedTime: Math.random() * 30000 + 10000 // 10-40 seconds
    }

    // Add to active jobs
    activeJobs.value.push(job)

    // Simulate processing
    setTimeout(async () => {
      await simulateJobProgress(job)
    }, 1000)

    return job
  }

  const simulateJobProgress = async (job: GenerationJob) => {
    try {
      // Update status to processing
      job.status = 'processing'
      
      // Simulate progress updates
      const steps = [
        { progress: 10, duration: 500 },
        { progress: 25, duration: 1000 },
        { progress: 50, duration: 1500 },
        { progress: 75, duration: 1000 },
        { progress: 90, duration: 800 },
        { progress: 100, duration: 500 }
      ]

      for (const step of steps) {
        await delay(step.duration)
        
        // Check if job was cancelled
        const currentJob = activeJobs.value.find(j => j.id === job.id)
        if (!currentJob || currentJob.status === 'cancelled') {
          return
        }

        job.progress = step.progress
      }

      // Simulate occasional failures (10% chance)
      if (Math.random() < 0.1) {
        job.status = 'failed'
        job.error = 'Failed to process template variables'
      } else {
        job.status = 'completed'
        job.completedAt = new Date()
        job.resultDocumentId = generateId()
        
        // Add to history
        generationHistory.value.unshift({
          id: job.id,
          templateName: `Template ${job.templateId}`,
          matterTitle: `Matter ${job.matterId}`,
          format: job.format,
          status: 'completed',
          createdAt: job.completedAt,
          downloadUrl: `/mock/documents/${job.id}.${job.format}`
        })
      }

      // Remove from active jobs after delay
      setTimeout(() => {
        const index = activeJobs.value.findIndex(j => j.id === job.id)
        if (index > -1) {
          activeJobs.value.splice(index, 1)
        }
      }, 5000)

    } catch (error) {
      job.status = 'failed'
      job.error = error instanceof Error ? error.message : 'Unknown error'
    }
  }

  const cancelGenerationJob = async (jobId: string): Promise<void> => {
    const job = activeJobs.value.find(j => j.id === jobId)
    if (job) {
      job.status = 'cancelled'
      job.completedAt = new Date()
      
      // Remove from active jobs
      setTimeout(() => {
        const index = activeJobs.value.findIndex(j => j.id === jobId)
        if (index > -1) {
          activeJobs.value.splice(index, 1)
        }
      }, 1000)
    }
  }

  const retryGenerationJob = async (jobId: string): Promise<void> => {
    const historyItem = generationHistory.value.find(h => h.id === jobId)
    if (historyItem && historyItem.status === 'failed') {
      // Create new job based on history
      await generateDocument({
        templateId: 'template-retry', // Would be actual template ID
        matterId: 'matter-retry', // Would be actual matter ID
        format: historyItem.format as any
      })
    }
  }

  const downloadGenerationResult = async (jobId: string): Promise<void> => {
    const historyItem = generationHistory.value.find(h => h.id === jobId)
    if (historyItem?.downloadUrl) {
      // Create mock download
      const link = document.createElement('a')
      link.href = historyItem.downloadUrl
      link.download = `document.${historyItem.format}`
      link.click()
    }
  }

  const createBatchOperation = async (
    templateIds: string[],
    matterIds: string[],
    format: string
  ): Promise<BatchOperation> => {
    const operation: BatchOperation = {
      id: generateId(),
      name: `Batch ${Date.now()}`,
      templateIds,
      matterIds,
      format,
      totalItems: templateIds.length * matterIds.length,
      completedItems: 0,
      failedItems: 0,
      status: 'queued',
      startedAt: new Date()
    }

    batchOperations.value.push(operation)

    // Start processing after delay
    setTimeout(() => {
      processBatchOperation(operation)
    }, 2000)

    return operation
  }

  const processBatchOperation = async (operation: BatchOperation) => {
    operation.status = 'processing'
    
    const totalTime = operation.totalItems * (5000 + Math.random() * 5000) // 5-10 seconds per item
    operation.estimatedCompletion = new Date(Date.now() + totalTime)

    // Simulate processing each item
    for (let i = 0; i < operation.totalItems; i++) {
      await delay(2000 + Math.random() * 3000) // 2-5 seconds per item
      
      // Check if operation was cancelled or paused (status could be changed externally)
      const currentStatus = operation.status as BatchOperation['status']
      if (currentStatus === 'cancelled' || currentStatus === 'paused') {
        return
      }

      // Simulate occasional failures (5% chance)
      if (Math.random() < 0.05) {
        operation.failedItems++
      } else {
        operation.completedItems++
      }
    }

    operation.status = 'completed'
    operation.completedAt = new Date()
    operation.duration = operation.completedAt.getTime() - operation.startedAt!.getTime()
  }

  const pauseBatchOperation = async (operationId: string): Promise<void> => {
    const operation = batchOperations.value.find(op => op.id === operationId)
    if (operation && operation.status === 'processing') {
      operation.status = 'paused'
    }
  }

  const resumeBatchOperation = async (operationId: string): Promise<void> => {
    const operation = batchOperations.value.find(op => op.id === operationId)
    if (operation && operation.status === 'paused') {
      operation.status = 'processing'
      // Resume processing logic would go here
    }
  }

  const cancelBatchOperation = async (operationId: string): Promise<void> => {
    const operation = batchOperations.value.find(op => op.id === operationId)
    if (operation) {
      operation.status = 'cancelled'
      operation.completedAt = new Date()
    }
  }

  const retryBatchOperation = async (operationId: string): Promise<void> => {
    const operation = batchOperations.value.find(op => op.id === operationId)
    if (operation && operation.status === 'failed') {
      // Reset operation state
      operation.status = 'queued'
      operation.completedItems = 0
      operation.failedItems = 0
      operation.startedAt = new Date()
      operation.completedAt = undefined
      operation.error = undefined
      
      // Restart processing
      setTimeout(() => {
        processBatchOperation(operation)
      }, 1000)
    }
  }

  // Computed values
  const activeJobsCount = computed(() => activeJobs.value.length)
  const processingJobsCount = computed(() => 
    activeJobs.value.filter(job => job.status === 'processing').length
  )
  const completedJobsToday = computed(() => 
    generationHistory.value.filter(item => {
      const today = new Date()
      const itemDate = new Date(item.createdAt)
      return itemDate.toDateString() === today.toDateString()
    }).length
  )

  return {
    // State
    activeJobs: activeJobs as Ref<GenerationJob[]>,
    batchOperations: batchOperations as Ref<BatchOperation[]>,
    generationHistory: generationHistory as Ref<GenerationHistory[]>,
    
    // Computed
    activeJobsCount,
    processingJobsCount,
    completedJobsToday,
    
    // Methods
    generateDocument,
    cancelGenerationJob,
    retryGenerationJob,
    downloadGenerationResult,
    createBatchOperation,
    pauseBatchOperation,
    resumeBatchOperation,
    cancelBatchOperation,
    retryBatchOperation
  }
}

/**
 * Composable for tracking individual job progress with SSE simulation
 */
export function useJobProgressTracking(jobId: string) {
  const isConnected = ref(false)
  const error = ref<string | null>(null)
  const jobProgress = ref<any>(null)

  const connect = () => {
    // Simulate SSE connection
    isConnected.value = true
    
    // Find and track the job
    const job = activeJobs.value.find(j => j.id === jobId)
    if (job) {
      // Update progress data periodically
      const interval = setInterval(() => {
        jobProgress.value = {
          jobId: job.id,
          status: job.status,
          overallProgress: job.progress,
          completedSteps: Math.floor(job.progress / 20),
          totalSteps: 5,
          currentStep: getCurrentStep(job.progress),
          steps: getStepHistory(job.progress),
          estimatedCompletion: job.estimatedTime 
            ? new Date(Date.now() + (job.estimatedTime * (100 - job.progress) / 100))
            : null,
          elapsedTime: Date.now() - (job.startedAt?.getTime() || Date.now()),
          error: job.error
        }

        // Stop tracking when job is complete
        if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
          clearInterval(interval)
          disconnect()
        }
      }, 1000)
    }
  }

  const disconnect = () => {
    isConnected.value = false
  }

  const getCurrentStep = (progress: number) => {
    if (progress < 20) return { name: 'Initializing', progress: progress * 5, description: 'Setting up generation environment' }
    if (progress < 40) return { name: 'Processing Template', progress: (progress - 20) * 5, description: 'Parsing template variables' }
    if (progress < 60) return { name: 'Generating Content', progress: (progress - 40) * 5, description: 'Rendering document content' }
    if (progress < 80) return { name: 'Formatting Document', progress: (progress - 60) * 5, description: 'Applying styles and formatting' }
    if (progress < 100) return { name: 'Finalizing', progress: (progress - 80) * 5, description: 'Preparing final document' }
    return { name: 'Complete', progress: 100, description: 'Document generation complete' }
  }

  const getStepHistory = (progress: number) => {
    const steps = [
      { id: 1, name: 'Initialize', status: progress > 0 ? 'completed' : 'pending', duration: progress > 20 ? '0.5s' : undefined },
      { id: 2, name: 'Process Template', status: progress > 20 ? 'completed' : progress > 0 ? 'processing' : 'pending', duration: progress > 40 ? '1.2s' : undefined },
      { id: 3, name: 'Generate Content', status: progress > 40 ? 'completed' : progress > 20 ? 'processing' : 'pending', duration: progress > 60 ? '2.1s' : undefined },
      { id: 4, name: 'Format Document', status: progress > 60 ? 'completed' : progress > 40 ? 'processing' : 'pending', duration: progress > 80 ? '0.8s' : undefined },
      { id: 5, name: 'Finalize', status: progress > 80 ? 'completed' : progress > 60 ? 'processing' : 'pending', duration: progress >= 100 ? '0.3s' : undefined }
    ]
    
    return steps
  }

  return {
    jobProgress,
    isConnected,
    error,
    connect,
    disconnect
  }
}

/**
 * Convenience function to create the progress tracking composable
 */
export const trackJobProgress = (jobId: string) => {
  return useJobProgressTracking(jobId)
}
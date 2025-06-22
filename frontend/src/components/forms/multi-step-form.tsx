'use client'

import { useState, useEffect, useCallback, ReactNode } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { ChevronLeft, ChevronRight, Loader2, CheckCircle } from 'lucide-react'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

/**
 * Configuration for a single step in the multi-step form
 */
export interface StepConfig<T = any> {
  /** Unique identifier for the step */
  id: string
  /** Display title for the step */
  title: string
  /** Optional description */
  description?: string
  /** Zod schema for step validation */
  schema: z.ZodSchema<T>
  /** Whether this step is optional */
  optional?: boolean
  /** Function to determine if step should be shown */
  condition?: (formData: any) => boolean
}

/**
 * Props for the MultiStepForm component
 */
export interface MultiStepFormProps {
  /** Array of step configurations */
  steps: StepConfig[]
  /** Initial form data */
  initialData?: Record<string, any>
  /** Whether to show progress indicator */
  showProgress?: boolean
  /** Whether to show step navigation */
  showStepNavigation?: boolean
  /** Whether to show validation summary */
  showValidationSummary?: boolean
  /** Whether to allow navigation to incomplete steps */
  allowIncompleteSteps?: boolean
  /** Whether to persist form data */
  persistData?: boolean
  /** Storage key for persistence */
  storageKey?: string
  /** Custom previous button text */
  previousButtonText?: string
  /** Custom next button text */
  nextButtonText?: string
  /** Custom submit button text */
  submitButtonText?: string
  /** Auto-advance after successful validation */
  autoAdvance?: boolean
  /** Children render function for step content */
  children: (props: {
    currentStep: number
    stepConfig: StepConfig
    formData: Record<string, any>
    form: UseFormReturn<any>
    isFirstStep: boolean
    isLastStep: boolean
    nextStep: () => void
    previousStep: () => void
    goToStep: (step: number) => void
  }) => ReactNode
  /** Called when a step is completed */
  onStepComplete?: (step: number, data: any) => void
  /** Called when form is submitted */
  onSubmit?: (data: any) => void
  /** Called when form is reset */
  onReset?: () => void
}

/**
 * A flexible multi-step form component with validation, persistence, and navigation
 * 
 * @param props - Component props
 * @returns The rendered multi-step form
 */
export function MultiStepForm({
  steps,
  initialData = {},
  showProgress = true,
  showStepNavigation = true,
  showValidationSummary = true,
  allowIncompleteSteps = false,
  persistData = true,
  storageKey = 'multi-step-form',
  previousButtonText = 'Previous',
  nextButtonText = 'Next',
  submitButtonText = 'Submit',
  autoAdvance = false,
  children,
  onStepComplete,
  onSubmit,
  onReset
}: MultiStepFormProps) {
  // State management
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Record<string, any>>(initialData)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Filter steps based on conditions
  const visibleSteps = steps.filter(step => 
    !step.condition || step.condition(formData)
  )

  const totalSteps = visibleSteps.length
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === totalSteps - 1
  const currentStepConfig = visibleSteps[currentStep]

  // Form persistence
  const persistFormData = useCallback(() => {
    if (!persistData || typeof window === 'undefined') return
    
    try {
      const dataToStore = {
        formData,
        currentStep,
        completedSteps: Array.from(completedSteps),
        timestamp: Date.now()
      }
      localStorage.setItem(storageKey, JSON.stringify(dataToStore))
    } catch (error) {
      console.warn('Failed to persist form data:', error)
    }
  }, [formData, currentStep, completedSteps, persistData, storageKey])

  const loadPersistedData = useCallback(() => {
    if (!persistData || typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem(storageKey)
      if (!stored) return
      
      const parsed = JSON.parse(stored)
      
      // Check if data is not too old (24 hours)
      if (Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(storageKey)
        return
      }
      
      setFormData({ ...initialData, ...parsed.formData })
      setCurrentStep(parsed.currentStep || 0)
      setCompletedSteps(new Set(parsed.completedSteps || []))
    } catch (error) {
      console.warn('Failed to load persisted form data:', error)
      localStorage.removeItem(storageKey)
    }
  }, [initialData, persistData, storageKey])

  const clearPersistedData = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey)
    }
  }, [storageKey])

  // Initialize form data
  useEffect(() => {
    loadPersistedData()
  }, [loadPersistedData])

  // Persist data when it changes
  useEffect(() => {
    persistFormData()
  }, [persistFormData])

  // Step validation
  const validateStep = useCallback((stepIndex: number, data: any) => {
    const stepConfig = visibleSteps[stepIndex]
    if (!stepConfig) return { success: true, data }

    try {
      const validated = stepConfig.schema.parse(data)
      return { success: true, data: validated }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {}
        error.errors.forEach(err => {
          const path = err.path.join('.')
          errors[path] = err.message
        })
        return { success: false, errors }
      }
      return { success: false, errors: { general: 'Validation failed' } }
    }
  }, [visibleSteps])

  // Navigation functions
  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= totalSteps) return
    
    if (!allowIncompleteSteps && stepIndex > currentStep) {
      // Check if all previous steps are completed
      for (let i = currentStep; i < stepIndex; i++) {
        if (!completedSteps.has(i) && !visibleSteps[i]?.optional) {
          console.warn(`Cannot skip to step ${stepIndex}: step ${i} is not completed`)
          return
        }
      }
    }
    
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentStep(stepIndex)
      setIsTransitioning(false)
    }, 150)
  }, [totalSteps, allowIncompleteSteps, currentStep, completedSteps, visibleSteps])

  const nextStep = useCallback(() => {
    if (!isLastStep) {
      goToStep(currentStep + 1)
    }
  }, [isLastStep, currentStep, goToStep])

  const previousStep = useCallback(() => {
    if (!isFirstStep) {
      goToStep(currentStep - 1)
    }
  }, [isFirstStep, currentStep, goToStep])

  // Step completion handling
  const handleStepComplete = useCallback((data: any) => {
    const validation = validateStep(currentStep, data)
    
    if (!validation.success) {
      setValidationErrors(validation.errors || {})
      return false
    }
    
    setValidationErrors({})
    
    // Update form data with validated data
    const updatedFormData = {
      ...formData,
      [currentStepConfig.id]: validation.data
    }
    setFormData(updatedFormData)
    
    // Mark step as completed
    setCompletedSteps(prev => new Set([...prev, currentStep]))
    
    // Call completion handler
    if (onStepComplete) {
      onStepComplete(currentStep, validation.data)
    }
    
    if (isLastStep) {
      // Final form submission
      if (onSubmit) {
        onSubmit(updatedFormData)
      }
      clearPersistedData()
    } else if (autoAdvance) {
      nextStep()
    }
    
    return true
  }, [currentStep, validateStep, formData, currentStepConfig, onStepComplete, isLastStep, onSubmit, clearPersistedData, autoAdvance, nextStep])

  // Reset form
  const reset = useCallback(() => {
    setCurrentStep(0)
    setFormData(initialData)
    setCompletedSteps(new Set())
    setValidationErrors({})
    clearPersistedData()
    
    if (onReset) {
      onReset()
    }
  }, [initialData, clearPersistedData, onReset])

  // Progress calculation
  const progressPercentage = Math.round((completedSteps.size / totalSteps) * 100)

  if (!currentStepConfig) {
    return (
      <Alert>
        <AlertDescription>
          No valid steps found. Please check your step configuration.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      {showProgress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Step {currentStep + 1} of {totalSteps}
            </span>
            <span className="text-muted-foreground">
              {progressPercentage}% Complete
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      )}

      {/* Step Navigation */}
      {showStepNavigation && totalSteps > 1 && (
        <div className="flex items-center justify-center space-x-2 py-4">
          {visibleSteps.map((step, index) => (
            <Button
              key={step.id}
              variant={index === currentStep ? 'default' : 'outline'}
              size="sm"
              onClick={() => goToStep(index)}
              disabled={!allowIncompleteSteps && index > currentStep && !completedSteps.has(index)}
              className="flex items-center gap-2"
            >
              {completedSteps.has(index) && (
                <CheckCircle className="size-3" />
              )}
              <span className="hidden sm:inline">{step.title}</span>
              <span className="sm:hidden">{index + 1}</span>
            </Button>
          ))}
        </div>
      )}

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{currentStepConfig.title}</span>
            {currentStepConfig.optional && (
              <Badge variant="secondary">Optional</Badge>
            )}
          </CardTitle>
          {currentStepConfig.description && (
            <CardDescription>
              {currentStepConfig.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {/* Loading Overlay */}
          {isTransitioning && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                <span>Loading step...</span>
              </div>
            </div>
          )}

          {/* Step Content */}
          <div className={isTransitioning ? 'opacity-50' : ''}>
            {children({
              currentStep,
              stepConfig: currentStepConfig,
              formData,
              form: {} as UseFormReturn<any>, // This will be provided by the parent
              isFirstStep,
              isLastStep,
              nextStep,
              previousStep,
              goToStep
            })}
          </div>

          {/* Validation Summary */}
          {showValidationSummary && Object.keys(validationErrors).length > 0 && (
            <Alert className="mt-6">
              <AlertDescription>
                <div>
                  <p className="font-medium mb-2">Please fix the following errors:</p>
                  <ul className="space-y-1">
                    {Object.entries(validationErrors).map(([field, error]) => (
                      <li key={field} className="text-sm">
                        • {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={previousStep}
              disabled={isFirstStep || isTransitioning}
            >
              <ChevronLeft className="size-4 mr-2" />
              {previousButtonText}
            </Button>

            <div className="flex items-center gap-2">
              {completedSteps.has(currentStep) && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle className="size-3" />
                  Completed
                </Badge>
              )}
            </div>

            <Button
              type="button"
              onClick={() => {
                // This will be handled by the form submission in the children
                // The children component should call handleStepComplete
              }}
              disabled={isTransitioning}
            >
              {isLastStep ? submitButtonText : nextButtonText}
              {!isLastStep && <ChevronRight className="size-4 ml-2" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Debug Information (Development only) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="text-xs text-muted-foreground">
          <summary>Debug Information</summary>
          <pre className="mt-2 p-2 bg-muted rounded text-xs">
            {JSON.stringify({
              currentStep,
              totalSteps,
              completedSteps: Array.from(completedSteps),
              formDataKeys: Object.keys(formData),
              validationErrors
            }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}

// Export helper for creating step configurations
export function createStepConfig<T>(config: StepConfig<T>): StepConfig<T> {
  return config
}
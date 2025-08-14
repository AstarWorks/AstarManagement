import { ref, computed, type ComputedRef, type Ref } from 'vue'
import type { ExpenseFormData } from '~/schemas/expense'
import { 
  EXPENSE_FORM_STEPS, 
  STEP_NAVIGATION, 
  STEP_HELPERS,
  ExpenseFormStepId
} from '~/constants/expenseFormSteps';
import type { IExpenseFormStepConfig ,
  ExpenseFormStepIndex
} from '~/constants/expenseFormSteps';

/**
 * Enhanced step configuration interface
 */
export interface IExpenseFormStep extends IExpenseFormStepConfig {
  readonly isValid: (values: Partial<ExpenseFormData>) => boolean
  readonly isComplete: (values: Partial<ExpenseFormData>) => boolean
}

/**
 * Step validation state
 */
export interface IStepValidationState {
  readonly canProceed: boolean
  readonly currentStepValid: boolean
  readonly allStepsValid: boolean
  readonly completedSteps: readonly number[]
}

/**
 * Step management composable return type
 */
export interface IExpenseFormStepsReturn {
  readonly currentStep: ComputedRef<ExpenseFormStepIndex>
  readonly steps: readonly IExpenseFormStep[]
  readonly stepValidation: ComputedRef<IStepValidationState>
  readonly canGoNext: ComputedRef<boolean>
  readonly canGoPrevious: ComputedRef<boolean>
  readonly isLastStep: ComputedRef<boolean>
  readonly isFirstStep: ComputedRef<boolean>
  readonly getStepClass: (index: number) => string
  nextStep: () => void
  previousStep: () => void
  goToStep: (step: number) => void
  resetSteps: () => void
}

/**
 * Type guard to check if a value is a valid number greater than 0
 */
const isPositiveNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value) && value > 0
}

/**
 * Type guard to check if a string is non-empty
 */
const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Step definitions with proper validation logic using constants
 */
const createStepDefinitions = (): readonly IExpenseFormStep[] => 
  EXPENSE_FORM_STEPS.map(stepConfig => ({
    ...stepConfig,
    isValid: (values) => {
      switch (stepConfig.id) {
        case ExpenseFormStepId.BASIC:
          return isNonEmptyString(values.date) &&
                 isNonEmptyString(values.category) &&
                 isNonEmptyString(values.description)
        case ExpenseFormStepId.AMOUNT:
          return isPositiveNumber(values.incomeAmount) || isPositiveNumber(values.expenseAmount)
        case ExpenseFormStepId.ADDITIONAL:
          return true // Additional info is always optional
        default:
          return false
      }
    },
    isComplete: (values) => {
      switch (stepConfig.id) {
        case ExpenseFormStepId.BASIC:
          return isNonEmptyString(values.date) &&
                 isNonEmptyString(values.category) &&
                 isNonEmptyString(values.description)
        case ExpenseFormStepId.AMOUNT:
          return isPositiveNumber(values.incomeAmount) || isPositiveNumber(values.expenseAmount)
        case ExpenseFormStepId.ADDITIONAL:
          return true
        default:
          return false
      }
    }
  }))

/**
 * Composable for managing expense form steps with type-safe validation
 * Handles step navigation, validation per step, and progress tracking
 */
export function useExpenseFormSteps(
  formValues: Ref<Partial<ExpenseFormData>>,
  emit?: (event: string, ...args: unknown[]) => void
): IExpenseFormStepsReturn {
  // Internal step state
  const _currentStep = ref(STEP_NAVIGATION.FIRST_STEP)
  const steps = createStepDefinitions()

  // Computed step validation state
  const stepValidation = computed<IStepValidationState>(() => {
    const values = formValues.value
    const currentStepData = steps[_currentStep.value]
    const currentStepValid = currentStepData?.isValid(values) ?? false
    
    const completedSteps = steps
      .map((step, index) => ({ step, index }))
      .filter(({ step }) => step.isComplete(values))
      .map(({ index }) => index)
    
    const allStepsValid = steps.every(step => step.isValid(values))
    const canProceed = _currentStep.value < STEP_NAVIGATION.LAST_STEP 
      ? currentStepValid 
      : allStepsValid

    return {
      canProceed,
      currentStepValid,
      allStepsValid,
      completedSteps
    }
  })

  // Computed navigation state
  const canGoNext = computed(() => {
    return _currentStep.value < STEP_NAVIGATION.LAST_STEP && stepValidation.value.currentStepValid
  })

  const canGoPrevious = computed(() => {
    return _currentStep.value > STEP_NAVIGATION.FIRST_STEP
  })

  const isLastStep = computed(() => {
    return _currentStep.value === (STEP_NAVIGATION.LAST_STEP as number)
  })

  const isFirstStep = computed(() => {
    return _currentStep.value === STEP_NAVIGATION.FIRST_STEP
  })

  // Step styling function
  const getStepClass = (index: number): string => {
    const current = _currentStep.value
    const isCompleted = stepValidation.value.completedSteps.includes(index)
    
    if (isCompleted && current > index) {
      return 'bg-primary border-primary text-primary-foreground'
    } else if (current === index) {
      return 'bg-background border-primary text-primary'
    } else {
      return 'bg-background border-muted text-muted-foreground'
    }
  }

  // Navigation functions
  const nextStep = (): void => {
    if (canGoNext.value) {
      _currentStep.value++
      emit?.('stepChange', _currentStep.value)
    }
  }

  const previousStep = (): void => {
    if (canGoPrevious.value) {
      _currentStep.value--
      emit?.('stepChange', _currentStep.value)
    }
  }

  const goToStep = (step: number): void => {
    if (STEP_HELPERS.isValidStepIndex(step)) {
      _currentStep.value = step
      emit?.('stepChange', step)
    }
  }

  const resetSteps = (): void => {
    _currentStep.value = STEP_NAVIGATION.FIRST_STEP
    emit?.('stepChange', STEP_NAVIGATION.FIRST_STEP)
  }

  return {
    currentStep: computed(() => _currentStep.value),
    steps,
    stepValidation,
    canGoNext,
    canGoPrevious,
    isLastStep,
    isFirstStep,
    getStepClass,
    nextStep,
    previousStep,
    goToStep,
    resetSteps
  }
}
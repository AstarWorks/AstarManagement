/**
 * Expense Amount Step Composable
 * Contains all business logic for the expense amount step component
 */
import { useFieldValue, useField } from 'vee-validate'
import type { Ref } from 'vue'
import { AMOUNT_LIMITS, AMOUNT_PRESETS, BALANCE_HELPERS, type AmountType, type IAmountPreset } from '~/constants/expenseFormConstants'
import { useExpenseFormatters } from '~/composables/useExpenseFormatters'

/**
 * Return type for the useExpenseAmountStep composable
 */
export interface IUseExpenseAmountStepReturn {
  // State
  amountType: Ref<AmountType>
  calculatedBalance: Ref<number>
  isAmountValid: Ref<boolean>
  
  // Configuration
  amountPresets: readonly IAmountPreset[]
  amountLimits: typeof AMOUNT_LIMITS
  
  // Computed properties
  balanceColorClass: Ref<string>
  balanceDescription: Ref<string>
  
  // Methods
  handleIncomeInput: (event: Event) => void
  handleExpenseInput: (event: Event) => void
  applyAmountPreset: (amount: number) => void
  
  // Formatters
  formatCurrency: (amount: number) => string
}

/**
 * Composable for managing expense amount step logic
 */
export function useExpenseAmountStep(): IUseExpenseAmountStepReturn {
  const { t } = useI18n()
  const { formatCurrency } = useExpenseFormatters()
  
  // Form field references
  const incomeAmount = useFieldValue<number>('incomeAmount')
  const expenseAmount = useFieldValue<number>('expenseAmount')
  const { setValue: setIncomeAmount } = useField<number>('incomeAmount')
  const { setValue: setExpenseAmount } = useField<number>('expenseAmount')
  
  // Amount type state
  const amountType = ref<AmountType>('expense')
  
  // Balance calculation
  const calculatedBalance = computed(() => {
    const income = Number(incomeAmount.value) || 0
    const expense = Number(expenseAmount.value) || 0
    return income - expense
  })
  
  // Balance styling
  const balanceColorClass = computed(() => 
    BALANCE_HELPERS.getBalanceColorClass(calculatedBalance.value)
  )
  
  // Balance description
  const balanceDescription = computed(() => {
    const balanceType = BALANCE_HELPERS.getBalanceType(calculatedBalance.value)
    return t(`expense.form.balanceTypes.${balanceType}`)
  })
  
  // Amount validation
  const isAmountValid = computed(() => {
    const income = Number(incomeAmount.value) || 0
    const expense = Number(expenseAmount.value) || 0
    return income > 0 || expense > 0
  })
  
  /**
   * Safely parse numeric input value
   */
  const parseNumericInput = (value: string): number => {
    const parsed = Number(value)
    if (isNaN(parsed) || !isFinite(parsed)) {
      return 0
    }
    return Math.max(AMOUNT_LIMITS.MIN, Math.min(AMOUNT_LIMITS.MAX, Math.floor(parsed)))
  }
  
  /**
   * Handle income amount input with validation
   */
  const handleIncomeInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    const value = parseNumericInput(target.value)
    setIncomeAmount(value)
  }
  
  /**
   * Handle expense amount input with validation
   */
  const handleExpenseInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    const value = parseNumericInput(target.value)
    setExpenseAmount(value)
  }
  
  /**
   * Apply amount preset to the currently selected amount type
   */
  const applyAmountPreset = (amount: number) => {
    if (amountType.value === 'expense') {
      setExpenseAmount(amount)
    } else {
      setIncomeAmount(amount)
    }
  }
  
  // Watch amount type changes and clear opposite field
  watch(amountType, (newType) => {
    if (newType === 'expense') {
      setIncomeAmount(0)
    } else {
      setExpenseAmount(0)
    }
  })
  
  // Auto-detect amount type based on input
  watch([incomeAmount, expenseAmount], ([income, expense]) => {
    const incomeNum = Number(income) || 0
    const expenseNum = Number(expense) || 0
    
    if (incomeNum > 0 && expenseNum === 0) {
      amountType.value = 'income'
    } else if (expenseNum > 0 && incomeNum === 0) {
      amountType.value = 'expense'
    }
  }, { immediate: true })
  
  return {
    // State
    amountType,
    calculatedBalance,
    isAmountValid,
    
    // Configuration
    amountPresets: AMOUNT_PRESETS,
    amountLimits: AMOUNT_LIMITS,
    
    // Computed properties
    balanceColorClass,
    balanceDescription,
    
    // Methods
    handleIncomeInput,
    handleExpenseInput,
    applyAmountPreset,
    
    // Formatters
    formatCurrency
  }
}
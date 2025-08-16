import type { IExpense } from '~/modules/expense/types'

/**
 * Expense関連の計算ロジック
 * balance計算やその他の派生値の計算を提供
 */
export const useExpenseCalculations = (expense: Ref<IExpense> | ComputedRef<IExpense>) => {
  /**
   * 残高計算 (収入 - 支出)
   */
  const balance = computed(() => 
    expense.value.incomeAmount - expense.value.expenseAmount
  )
  
  /**
   * 残高に応じたCSSクラス
   */
  const balanceClass = computed(() => 
    balance.value >= 0 ? 'text-green-600' : 'text-red-600'
  )
  
  /**
   * 収支タイプの判定
   */
  const balanceType = computed(() => {
    if (balance.value > 0) return 'income' as const
    if (balance.value < 0) return 'expense' as const
    return 'neutral' as const
  })
  
  /**
   * 金額の絶対値
   */
  const absoluteBalance = computed(() => Math.abs(balance.value))
  
  /**
   * 収入があるかどうか
   */
  const hasIncome = computed(() => expense.value.incomeAmount > 0)
  
  /**
   * 支出があるかどうか
   */
  const hasExpense = computed(() => expense.value.expenseAmount > 0)
  
  return {
    balance,
    balanceClass,
    balanceType,
    absoluteBalance,
    hasIncome,
    hasExpense
  }
}

/**
 * 複数のExpenseの集計計算
 */
export const useExpenseAggregations = (expenses: Ref<IExpense[]> | ComputedRef<IExpense[]>) => {
  /**
   * 総収入
   */
  const totalIncome = computed(() => 
    expenses.value.reduce((sum, expense) => sum + expense.incomeAmount, 0)
  )
  
  /**
   * 総支出
   */
  const totalExpense = computed(() => 
    expenses.value.reduce((sum, expense) => sum + expense.expenseAmount, 0)
  )
  
  /**
   * 純残高
   */
  const netBalance = computed(() => totalIncome.value - totalExpense.value)
  
  /**
   * カテゴリ別集計
   */
  const categoryBreakdown = computed(() => {
    const breakdown = new Map<string, { income: number; expense: number; balance: number; count: number }>()
    
    expenses.value.forEach((expense) => {
      const current = breakdown.get(expense.category) || { income: 0, expense: 0, balance: 0, count: 0 }
      current.income += expense.incomeAmount
      current.expense += expense.expenseAmount
      current.balance = current.income - current.expense
      current.count += 1
      breakdown.set(expense.category, current)
    })
    
    return Array.from(breakdown.entries()).map(([category, data]) => ({
      category,
      ...data
    }))
  })
  
  return {
    totalIncome,
    totalExpense,
    netBalance,
    categoryBreakdown
  }
}
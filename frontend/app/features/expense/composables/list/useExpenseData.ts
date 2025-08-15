import type { IExpense, IExpenseWithRelations } from '@expense/types/expense'

/**
 * Expense データフローの管理
 * リスト表示とdetail表示の型の使い分けを明確化
 */
export const useExpenseData = () => {
  // リスト表示用のExpenseデータ（relationは含まない）
  const expenses = ref<IExpense[]>([])
  
  // 詳細表示用のExpenseデータ（relationを含む）
  const selectedExpense = ref<IExpenseWithRelations | null>(null)
  
  // Loading states
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  /**
   * IExpense が relations を持っているかチェック
   */
  const isExpenseWithRelations = (
    expense: IExpense | IExpenseWithRelations
  ): expense is IExpenseWithRelations => {
    return 'tags' in expense && 'attachments' in expense && 'case' in expense
  }
  
  /**
   * IExpense を IExpenseWithRelations に変換
   * 必要に応じてAPI呼び出しでrelationsを取得
   */
  const enrichExpenseWithRelations = async (
    expense: IExpense
  ): Promise<IExpenseWithRelations> => {
    // 既にrelationsがある場合はそのまま返す
    if (isExpenseWithRelations(expense)) {
      return expense
    }
    
    // TODO: 実際のAPI実装時にrelationsを取得
    // 現在はmock実装
    return {
      ...expense,
      tags: [],
      attachments: [],
      case: undefined
    } satisfies IExpenseWithRelations
  }
  
  /**
   * 選択されたExpenseの詳細を設定
   */
  const selectExpense = async (expense: IExpense) => {
    try {
      isLoading.value = true
      error.value = null
      selectedExpense.value = await enrichExpenseWithRelations(expense)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * 選択解除
   */
  const clearSelection = () => {
    selectedExpense.value = null
    error.value = null
  }
  
  return {
    // State
    expenses,
    selectedExpense,
    isLoading,
    error,
    
    // Type guards
    isExpenseWithRelations,
    
    // Actions
    enrichExpenseWithRelations,
    selectExpense,
    clearSelection
  }
}
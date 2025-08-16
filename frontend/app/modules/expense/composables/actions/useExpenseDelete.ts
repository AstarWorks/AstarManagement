import { ref, readonly } from 'vue'
import { toast } from 'vue-sonner'

export interface IExpenseDeleteResult {
  success: boolean
  error?: string
}

export interface IExpenseDeleteComposable {
  isDeleting: Readonly<Ref<boolean>>
  deleteError: Readonly<Ref<string | null>>
  deleteExpense: (expenseId: string) => Promise<IExpenseDeleteResult>
  undoDelete: (expenseId: string) => Promise<IExpenseDeleteResult>
}

export const useExpenseDelete = (): IExpenseDeleteComposable => {
  const { t } = useI18n()
  
  const isDeleting = ref(false)
  const deleteError = ref<string | null>(null)
  
  const deleteExpense = async (expenseId: string): Promise<IExpenseDeleteResult> => {
    isDeleting.value = true
    deleteError.value = null
    
    try {
      await $fetch(`/api/v1/expenses/${expenseId}`, {
        method: 'DELETE'
      })
      
      toast.success(t('expense.delete.success'), {
        description: t('expense.delete.successDescription'),
        action: {
          label: t('expense.delete.undo'),
          onClick: () => undoDelete(expenseId)
        }
      })
      
      return { success: true }
    } catch (error: unknown) {
      deleteError.value = (error as Error).message || t('expense.delete.error')
      
      toast.error(t('expense.delete.error'), {
        description: deleteError.value || ''
      })
      
      return { success: false, error: deleteError.value || undefined }
    } finally {
      isDeleting.value = false
    }
  }
  
  const undoDelete = async (expenseId: string): Promise<IExpenseDeleteResult> => {
    try {
      await $fetch(`/api/v1/expenses/${expenseId}/restore`, {
        method: 'POST'
      })
      
      toast.success(t('expense.restore.success'), {
        description: t('expense.restore.successDescription')
      })
      
      return { success: true }
    } catch (error: unknown) {
      toast.error(t('expense.restore.error'), {
        description: (error as Error).message
      })
      
      return { success: false, error: (error as Error).message }
    }
  }
  
  return {
    isDeleting: readonly(isDeleting),
    deleteError: readonly(deleteError),
    deleteExpense,
    undoDelete
  }
}
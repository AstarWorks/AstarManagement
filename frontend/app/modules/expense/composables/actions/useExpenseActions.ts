import { useClipboard } from '@vueuse/core'
import type { IExpense } from '~/modules/expense/types'
import { toast } from 'vue-sonner'

export const useExpenseActions = () => {
  const { copy } = useClipboard()
  const { t } = useI18n()
  
  // Format date
  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('ja-JP')
  }
  
  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount)
  }
  
  // Format expense as text
  const formatExpenseText = (expense: IExpense): string => {
    const lines: string[] = [
      `${t('expense.form.fields.date')}: ${formatDate(expense.date)}`,
      `${t('expense.form.fields.category')}: ${t(`expense.categories.${expense.category}`)}`,
      `${t('expense.form.fields.description')}: ${expense.description}`,
      `${t('expense.form.fields.incomeAmount')}: ${formatCurrency(expense.incomeAmount)}`,
      `${t('expense.form.fields.expenseAmount')}: ${formatCurrency(expense.expenseAmount)}`,
      `${t('expense.form.fields.balance')}: ${formatCurrency(expense.incomeAmount - expense.expenseAmount)}`
    ]
    
    if (expense.caseId) {
      lines.push(`${t('expense.form.fields.case')}: ${expense.caseId}`)
    }
    
    if (expense.memo) {
      lines.push(`${t('expense.form.fields.memo')}: ${expense.memo}`)
    }
    
    if (expense.tagIds && expense.tagIds.length > 0) {
      lines.push(`${t('expense.form.fields.tags')}: ${expense.tagIds.join(', ')}`)
    }
    
    return lines.join('\n')
  }
  
  // Handle copy to clipboard
  const handleCopy = async (expense: IExpense) => {
    try {
      const text = formatExpenseText(expense)
      await copy(text)
      
      toast.success(t('expense.actions.copySuccess'), {
        description: t('expense.actions.copySuccessDescription')
      })
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error(t('expense.actions.copyFailed'), {
        description: t('expense.actions.copyFailedDescription')
      })
    }
  }
  
  // Handle print
  const handlePrint = () => {
    // The print styles are handled in the component CSS
    window.print()
  }
  
  return {
    handleCopy,
    handlePrint,
    formatExpenseText
  }
}
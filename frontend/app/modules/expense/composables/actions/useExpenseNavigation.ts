import type { IExpense } from '~/modules/expense/types'

import type { IBreadcrumbItem } from '~/foundation/types/navigation'

export const useExpenseNavigation = () => {
  const route = useRoute()
  const { t } = useI18n()

  const getExpenseBreadcrumb = (expense?: IExpense): IBreadcrumbItem[] => {
    const base: IBreadcrumbItem[] = [
      { label: t('dashboard.title'), to: '/dashboard' },
      { label: t('expense.navigation.title'), to: '/expenses' }
    ]

    const routeName = route.name as string
    
    if (routeName.includes('expenses-new')) {
      return [...base, { label: t('expense.form.title.create') }]
    }
    
    if (routeName.includes('expenses-import')) {
      return [...base, { label: t('expense.navigation.import') }]
    }
    
    if (routeName.includes('expenses-reports')) {
      return [...base, { label: t('expense.navigation.reports') }]
    }
    
    if (expense) {
      const expenseBase = [...base, { 
        label: expense.description || expense.id, 
        to: `/expenses/${expense.id}` 
      }]
      
      if (routeName.includes('edit')) {
        return [...expenseBase, { label: t('expense.actions.edit') }]
      }
      
      if (routeName.includes('attachments')) {
        return [...expenseBase, { label: t('expense.form.fields.attachments') }]
      }
      
      return expenseBase
    }
    
    return base
  }

  const getPageTitle = (expense?: IExpense): string => {
    const routeName = route.name as string
    
    if (routeName.includes('expenses-new')) return t('expense.form.title.create')
    if (routeName.includes('expenses-import')) return t('expense.navigation.import')
    if (routeName.includes('expenses-reports')) return t('expense.navigation.reports')
    if (routeName.includes('edit')) return t('expense.form.title.edit')
    if (expense) return expense.description || t('expense.form.title.view')
    
    return t('expense.navigation.title')
  }

  return {
    getExpenseBreadcrumb,
    getPageTitle
  }
}
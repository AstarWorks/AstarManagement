#!/bin/bash

# Update import paths after directory restructuring
echo "Updating import paths for expense module restructuring..."

# Components that moved from expense/ to expenses/form/
find /IdeaProjects/AstarManagement/frontend/app -type f -name "*.vue" -o -name "*.ts" | while read file; do
  # Update component imports
  sed -i "s|from '~/components/expense/ExpenseForm|from '~/components/expenses/form/ExpenseForm|g" "$file"
  sed -i "s|from '~/components/expense/ExpenseDeleteDialog|from '~/components/expenses/form/ExpenseDeleteDialog|g" "$file"
  sed -i "s|from '~/components/expense/ExpenseBasicInfoStep|from '~/components/expenses/form/ExpenseBasicInfoStep|g" "$file"
  sed -i "s|from '~/components/expense/ExpenseAmountStep|from '~/components/expenses/form/ExpenseAmountStep|g" "$file"
  sed -i "s|from '~/components/expense/ExpenseAdditionalInfoStep|from '~/components/expenses/form/ExpenseAdditionalInfoStep|g" "$file"
  
  # Update composable imports - form related
  sed -i "s|from '~/composables/expense/useExpenseForm|from '~/composables/domains/expense/form/useExpenseForm|g" "$file"
  sed -i "s|from '~/composables/expense/useExpenseFormDraft|from '~/composables/domains/expense/form/useExpenseFormDraft|g" "$file"
  sed -i "s|from '~/composables/expense/useExpenseFormErrorHandling|from '~/composables/domains/expense/form/useExpenseFormErrorHandling|g" "$file"
  sed -i "s|from '~/composables/expense/useExpenseFormSteps|from '~/composables/domains/expense/form/useExpenseFormSteps|g" "$file"
  sed -i "s|from '~/composables/expense/useExpenseAmountStep|from '~/composables/domains/expense/form/useExpenseAmountStep|g" "$file"
  
  # Update composable imports - list related
  sed -i "s|from '~/composables/expense/useExpenseData|from '~/composables/domains/expense/list/useExpenseData|g" "$file"
  sed -i "s|from '~/composables/expense/useExpenseFilters|from '~/composables/domains/expense/list/useExpenseFilters|g" "$file"
  sed -i "s|from '~/composables/expense/useExpenseListBehavior|from '~/composables/domains/expense/list/useExpenseListBehavior|g" "$file"
  
  # Update composable imports - actions
  sed -i "s|from '~/composables/expense/useExpenseActions|from '~/composables/domains/expense/actions/useExpenseActions|g" "$file"
  sed -i "s|from '~/composables/expense/useExpenseDelete|from '~/composables/domains/expense/actions/useExpenseDelete|g" "$file"
  sed -i "s|from '~/composables/expense/useExpenseNavigation|from '~/composables/domains/expense/actions/useExpenseNavigation|g" "$file"
  
  # Update composable imports - shared
  sed -i "s|from '~/composables/expense/useExpenseCalculations|from '~/composables/domains/expense/shared/useExpenseCalculations|g" "$file"
  sed -i "s|from '~/composables/expense/useExpenseFormatters|from '~/composables/domains/expense/shared/useExpenseFormatters|g" "$file"
  sed -i "s|from '~/composables/expense/useExpenseCases|from '~/composables/domains/expense/shared/useExpenseCases|g" "$file"
  sed -i "s|from '~/composables/expense/useExpenseCategories|from '~/composables/domains/expense/shared/useExpenseCategories|g" "$file"
  sed -i "s|from '~/composables/expense/useExpenseTags|from '~/composables/domains/expense/shared/useExpenseTags|g" "$file"
  sed -i "s|from '~/composables/expense/useExpenseAttachments|from '~/composables/domains/expense/shared/useExpenseAttachments|g" "$file"
  sed -i "s|from '~/composables/expense/useExpenseRouting|from '~/composables/domains/expense/shared/useExpenseRouting|g" "$file"
  
  # Update type imports to use the new unified file
  sed -i "s|from '~/types/expense/expense'|from '~/types/domains/expense'|g" "$file"
  sed -i "s|from '~/types/expense/api'|from '~/types/domains/expense'|g" "$file"
  sed -i "s|from '~/types/expense/tag'|from '~/types/domains/expense'|g" "$file"
  sed -i "s|from '~/types/expense/attachment'|from '~/types/domains/expense'|g" "$file"
  sed -i "s|from '~/types/expense/index'|from '~/types/domains/expense'|g" "$file"
  sed -i "s|from '~/types/expense'|from '~/types/domains/expense'|g" "$file"
  
  # Update states component imports
  sed -i "s|from '~/components/expense/states|from '~/components/expenses/shared/states|g" "$file"
  sed -i "s|from '~/components/expenses/states|from '~/components/expenses/shared/states|g" "$file"
done

echo "Import paths updated successfully!"
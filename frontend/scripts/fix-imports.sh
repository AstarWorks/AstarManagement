#!/bin/bash

echo "Fixing remaining import issues..."

# Fix case composables imports that were missed
find frontend/app -type f \( -name "*.vue" -o -name "*.ts" \) -exec sed -i \
  -e "s|'useCaseData'|'~/composables/domains/case/useCaseData'|g" \
  -e "s|'useCaseFilters'|'~/composables/domains/case/useCaseFilters'|g" \
  -e "s|'useCaseModal'|'~/composables/domains/case/useCaseModal'|g" \
  -e "s|'useCaseDragDrop'|'~/composables/domains/case/useCaseDragDrop'|g" \
  -e "s|'useCaseActions'|'~/composables/domains/case/useCaseActions'|g" {} \;

# Fix navigation composables
find frontend/app -type f \( -name "*.vue" -o -name "*.ts" \) -exec sed -i \
  -e "s|'useNavigation'|'~/composables/shared/navigation/useNavigation'|g" \
  -e "s|'usePermissions'|'~/composables/domains/auth/usePermissions'|g" \
  -e "s|'useUnauthorizedError'|'~/composables/domains/auth/useUnauthorizedError'|g" \
  -e "s|'useSecurityAudit'|'~/composables/domains/auth/useSecurityAudit'|g" {} \;

# Fix form composables
find frontend/app -type f \( -name "*.vue" -o -name "*.ts" \) -exec sed -i \
  -e "s|'useFormSubmissionOptimistic'|'~/composables/shared/form/useFormSubmissionOptimistic'|g" \
  -e "s|'useFormNavigationGuards'|'~/composables/shared/form/useFormNavigationGuards'|g" {} \;

# Fix dashboard composables
find frontend/app -type f \( -name "*.vue" -o -name "*.ts" \) -exec sed -i \
  -e "s|'useDashboardData'|'~/composables/shared/common/useDashboardData'|g" {} \;

# Fix expense component imports
find frontend/app -type f \( -name "*.vue" -o -name "*.ts" \) -exec sed -i \
  -e "s|'~/components/expenses/ExpenseFilters.vue'|'~/components/expenses/list/ExpenseFilters.vue'|g" \
  -e "s|'~/components/expenses/ExpenseDataTable.vue'|'~/components/expenses/list/ExpenseDataTable.vue'|g" \
  -e "s|'~/components/expenses/ExpensePagination.vue'|'~/components/expenses/list/ExpensePagination.vue'|g" \
  -e "s|'~/components/expenses/ExpenseFormFields.vue'|'~/components/expenses/list/ExpenseFormFields.vue'|g" \
  -e "s|'~/components/expenses/ConflictResolutionDialog.vue'|'~/components/expenses/list/ConflictResolutionDialog.vue'|g" {} \;

# Fix relative imports in moved files
find frontend/app/components/expenses/list -type f \( -name "*.vue" -o -name "*.ts" \) -exec sed -i \
  -e "s|'./list/|'./|g" \
  -e "s|\"./list/|\"|g" \
  -e "s|'./states/|'../shared/states/|g" \
  -e "s|\"./states/|\"../shared/states/|g" {} \;

# Fix useExpenseFormatters import
find frontend/app -type f \( -name "*.vue" -o -name "*.ts" \) -exec sed -i \
  -e "s|'~/composables/useExpenseFormatters'|'~/composables/domains/expense/shared/useExpenseFormatters'|g" \
  -e "s|\"~/composables/useExpenseFormatters\"|\"~/composables/domains/expense/shared/useExpenseFormatters\"|g" {} \;

# Fix useTableColumns import
find frontend/app -type f \( -name "*.vue" -o -name "*.ts" \) -exec sed -i \
  -e "s|'~/composables/useTableColumns'|'~/composables/shared/table/useTableColumns'|g" \
  -e "s|\"~/composables/useTableColumns\"|\"~/composables/shared/table/useTableColumns\"|g" \
  -e "s|useExpenseTableColumns|useTableColumns|g" {} \;

# Fix locales import
find frontend/app/composables/shared/common -type f -name "*.ts" -exec sed -i \
  -e "s|'../locales/ja'|'~/locales/ja'|g" \
  -e "s|\"../locales/ja\"|\"~/locales/ja\"|g" {} \;

echo "Import fixes completed!"
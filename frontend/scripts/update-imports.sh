#!/bin/bash

# Update import paths for moved composables

echo "Updating import paths..."

# Update case composables imports
find frontend/app -type f \( -name "*.vue" -o -name "*.ts" \) -exec sed -i \
  -e "s|'~/composables/case/|'~/composables/domains/case/|g" \
  -e "s|\"~/composables/case/|\"~/composables/domains/case/|g" \
  -e "s|'~/composables/useCase|'~/composables/domains/case/useCase|g" \
  -e "s|\"~/composables/useCase|\"~/composables/domains/case/useCase|g" {} \;

# Update auth composables imports
find frontend/app -type f \( -name "*.vue" -o -name "*.ts" \) -exec sed -i \
  -e "s|'~/composables/auth/|'~/composables/domains/auth/|g" \
  -e "s|\"~/composables/auth/|\"~/composables/domains/auth/|g" \
  -e "s|'~/composables/useAuth|'~/composables/domains/auth/useAuth|g" \
  -e "s|\"~/composables/useAuth|\"~/composables/domains/auth/useAuth|g" \
  -e "s|'~/composables/useLogin|'~/composables/domains/auth/useLogin|g" \
  -e "s|\"~/composables/useLogin|\"~/composables/domains/auth/useLogin|g" \
  -e "s|'~/composables/usePermissions|'~/composables/domains/auth/usePermissions|g" \
  -e "s|\"~/composables/usePermissions|\"~/composables/domains/auth/usePermissions|g" \
  -e "s|'~/composables/useToken|'~/composables/domains/auth/useToken|g" \
  -e "s|\"~/composables/useToken|\"~/composables/domains/auth/useToken|g" \
  -e "s|'~/composables/useUnauthorized|'~/composables/domains/auth/useUnauthorized|g" \
  -e "s|\"~/composables/useUnauthorized|\"~/composables/domains/auth/useUnauthorized|g" \
  -e "s|'~/composables/useSecurity|'~/composables/domains/auth/useSecurity|g" \
  -e "s|\"~/composables/useSecurity|\"~/composables/domains/auth/useSecurity|g" {} \;

# Update shared/api composables imports
find frontend/app -type f \( -name "*.vue" -o -name "*.ts" \) -exec sed -i \
  -e "s|'~/composables/api/|'~/composables/shared/api/|g" \
  -e "s|\"~/composables/api/|\"~/composables/shared/api/|g" \
  -e "s|'~/composables/useApi|'~/composables/shared/api/useApi|g" \
  -e "s|\"~/composables/useApi|\"~/composables/shared/api/useApi|g" \
  -e "s|'~/composables/useAsync|'~/composables/shared/api/useAsync|g" \
  -e "s|\"~/composables/useAsync|\"~/composables/shared/api/useAsync|g" \
  -e "s|'~/composables/useMockExpenseApi|'~/composables/shared/api/useMockExpenseApi|g" \
  -e "s|\"~/composables/useMockExpenseApi|\"~/composables/shared/api/useMockExpenseApi|g" {} \;

# Update shared/table composables imports
find frontend/app -type f \( -name "*.vue" -o -name "*.ts" \) -exec sed -i \
  -e "s|'~/composables/table/|'~/composables/shared/table/|g" \
  -e "s|\"~/composables/table/|\"~/composables/shared/table/|g" \
  -e "s|'~/composables/usePagination|'~/composables/shared/table/usePagination|g" \
  -e "s|\"~/composables/usePagination|\"~/composables/shared/table/usePagination|g" \
  -e "s|'~/composables/useTable|'~/composables/shared/table/useTable|g" \
  -e "s|\"~/composables/useTable|\"~/composables/shared/table/useTable|g" \
  -e "s|'~/composables/useVirtualScrolling|'~/composables/shared/table/useVirtualScrolling|g" \
  -e "s|\"~/composables/useVirtualScrolling|\"~/composables/shared/table/useVirtualScrolling|g" {} \;

# Update shared/ui composables imports
find frontend/app -type f \( -name "*.vue" -o -name "*.ts" \) -exec sed -i \
  -e "s|'~/composables/ui/|'~/composables/shared/ui/|g" \
  -e "s|\"~/composables/ui/|\"~/composables/shared/ui/|g" \
  -e "s|'~/composables/useError|'~/composables/shared/ui/useError|g" \
  -e "s|\"~/composables/useError|\"~/composables/shared/ui/useError|g" \
  -e "s|'~/composables/useLoading|'~/composables/shared/ui/useLoading|g" \
  -e "s|\"~/composables/useLoading|\"~/composables/shared/ui/useLoading|g" \
  -e "s|'~/composables/useDueDate|'~/composables/shared/ui/useDueDate|g" \
  -e "s|\"~/composables/useDueDate|\"~/composables/shared/ui/useDueDate|g" {} \;

# Update shared/form composables imports
find frontend/app -type f \( -name "*.vue" -o -name "*.ts" \) -exec sed -i \
  -e "s|'~/composables/form/|'~/composables/shared/form/|g" \
  -e "s|\"~/composables/form/|\"~/composables/shared/form/|g" \
  -e "s|'~/composables/useForm|'~/composables/shared/form/useForm|g" \
  -e "s|\"~/composables/useForm|\"~/composables/shared/form/useForm|g" {} \;

# Update shared/navigation composables imports
find frontend/app -type f \( -name "*.vue" -o -name "*.ts" \) -exec sed -i \
  -e "s|'~/composables/navigation/|'~/composables/shared/navigation/|g" \
  -e "s|\"~/composables/navigation/|\"~/composables/shared/navigation/|g" \
  -e "s|'~/composables/useNavigation|'~/composables/shared/navigation/useNavigation|g" \
  -e "s|\"~/composables/useNavigation|\"~/composables/shared/navigation/useNavigation|g" \
  -e "s|'~/composables/useHeader|'~/composables/shared/navigation/useHeader|g" \
  -e "s|\"~/composables/useHeader|\"~/composables/shared/navigation/useHeader|g" \
  -e "s|'~/composables/useActiveRoute|'~/composables/shared/navigation/useActiveRoute|g" \
  -e "s|\"~/composables/useActiveRoute|\"~/composables/shared/navigation/useActiveRoute|g" {} \;

# Update shared/common composables imports
find frontend/app -type f \( -name "*.vue" -o -name "*.ts" \) -exec sed -i \
  -e "s|'~/composables/common/|'~/composables/shared/common/|g" \
  -e "s|\"~/composables/common/|\"~/composables/shared/common/|g" \
  -e "s|'~/composables/useI18n|'~/composables/shared/common/useI18n|g" \
  -e "s|\"~/composables/useI18n|\"~/composables/shared/common/useI18n|g" \
  -e "s|'~/composables/useTypedI18n|'~/composables/shared/common/useTypedI18n|g" \
  -e "s|\"~/composables/useTypedI18n|\"~/composables/shared/common/useTypedI18n|g" \
  -e "s|'~/composables/useFilters|'~/composables/shared/common/useFilters|g" \
  -e "s|\"~/composables/useFilters|\"~/composables/shared/common/useFilters|g" \
  -e "s|'~/composables/useDashboard|'~/composables/shared/common/useDashboard|g" \
  -e "s|\"~/composables/useDashboard|\"~/composables/shared/common/useDashboard|g" {} \;

echo "Import paths updated successfully!"
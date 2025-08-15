#!/bin/bash

# Update import paths for consolidated expense components

echo "Updating expense component import paths..."

# Update table -> list imports
find frontend/app -type f \( -name "*.vue" -o -name "*.ts" \) -exec sed -i \
  -e "s|'~/components/expenses/table/|'~/components/expenses/list/|g" \
  -e "s|\"~/components/expenses/table/|\"~/components/expenses/list/|g" \
  -e "s|'./table/|'./list/|g" \
  -e "s|\"./table/|\"./list/|g" \
  -e "s|from '\.\./table/|from '\.\./list/|g" \
  -e "s|from \"\.\./table/|from \"\.\./list/|g" {} \;

# Update pagination -> list imports
find frontend/app -type f \( -name "*.vue" -o -name "*.ts" \) -exec sed -i \
  -e "s|'~/components/expenses/pagination/|'~/components/expenses/list/|g" \
  -e "s|\"~/components/expenses/pagination/|\"~/components/expenses/list/|g" \
  -e "s|'./pagination/|'./list/|g" \
  -e "s|\"./pagination/|\"./list/|g" \
  -e "s|from '\.\./pagination/|from '\.\./list/|g" \
  -e "s|from \"\.\./pagination/|from \"\.\./list/|g" {} \;

# Update filters -> list imports
find frontend/app -type f \( -name "*.vue" -o -name "*.ts" \) -exec sed -i \
  -e "s|'~/components/expenses/filters/|'~/components/expenses/list/|g" \
  -e "s|\"~/components/expenses/filters/|\"~/components/expenses/list/|g" \
  -e "s|'./filters/|'./list/|g" \
  -e "s|\"./filters/|\"./list/|g" \
  -e "s|from '\.\./filters/|from '\.\./list/|g" \
  -e "s|from \"\.\./filters/|from \"\.\./list/|g" {} \;

echo "Expense component import paths updated successfully!"
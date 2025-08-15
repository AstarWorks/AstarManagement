#!/bin/bash

# Update import paths for consolidated case components

echo "Updating case component import paths..."

# Update filters -> layout imports
find frontend/app -type f \( -name "*.vue" -o -name "*.ts" \) -exec sed -i \
  -e "s|'~/components/cases/filters/|'~/components/cases/layout/|g" \
  -e "s|\"~/components/cases/filters/|\"~/components/cases/layout/|g" \
  -e "s|'./filters/|'./layout/|g" \
  -e "s|\"./filters/|\"./layout/|g" \
  -e "s|from '\.\./filters/|from '\.\./layout/|g" \
  -e "s|from \"\.\./filters/|from \"\.\./layout/|g" {} \;

# Update wrappers -> common imports
find frontend/app -type f \( -name "*.vue" -o -name "*.ts" \) -exec sed -i \
  -e "s|'~/components/cases/display/wrappers/|'~/components/common/|g" \
  -e "s|\"~/components/cases/display/wrappers/|\"~/components/common/|g" \
  -e "s|'./wrappers/|'~/components/common/|g" \
  -e "s|\"./wrappers/|\"~/components/common/|g" \
  -e "s|from '\.\./wrappers/|from '~/components/common/|g" \
  -e "s|from \"\.\./wrappers/|from \"~/components/common/|g" \
  -e "s|from '\.\./\.\./wrappers/|from '~/components/common/|g" \
  -e "s|from \"\.\./\.\./wrappers/|from \"~/components/common/|g" {} \;

echo "Case component import paths updated successfully!"
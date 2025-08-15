#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Import path mappings
const importMappings = {
  // UI components
  '~/components/ui/': '@ui/',
  '@/components/ui/': '@ui/',
  
  // Layout components
  '~/components/layout/': '@core/layouts/components/',
  
  // Feature components
  '~/components/expenses/': '@expense/components/',
  '~/components/cases/': '@case/components/',
  '~/components/auth/': '@auth/components/',
  
  // Common/shared components
  '~/components/common/': '@shared/components/',
  '~/components/dashboard/': '@shared/components/dashboard/',
  '~/components/navigation/': '@shared/components/navigation/',
  '~/components/user/': '@shared/components/user/',
  
  // Composables
  '~/composables/shared/': '@shared/composables/',
  '~/composables/domains/expense/': '@expense/composables/',
  '~/composables/domains/case/': '@case/composables/',
  '~/composables/domains/auth/': '@auth/composables/',
  
  // Types
  '~/types/auth': '@auth/types',
  '~/types/case': '@case/types',
  '~/types/expense': '@expense/types/expense',
  '~/types/domains/expense': '@expense/types/expense',
  '~/types/common': '@shared/types/common',
  
  // Config
  '~/config/': '@core/config/',
  
  // Utils
  '~/utils/': '@shared/utils/',
  
  // Services
  '~/services/authService': '@auth/services/authService',
  '~/services/mockAuth': '@auth/services/mockAuth',
};

function updateImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  for (const [oldPath, newPath] of Object.entries(importMappings)) {
    const regex = new RegExp(`(from|import)\\s+['"\`]${oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
    if (content.match(regex)) {
      content = content.replace(regex, `$1 '${newPath}`);
      hasChanges = true;
    }
  }
  
  if (hasChanges) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated: ${filePath}`);
  }
}

// Find all Vue and TypeScript files
const patterns = [
  'app/**/*.vue',
  'app/**/*.ts',
  'app/**/*.js',
];

for (const pattern of patterns) {
  const files = await glob(pattern, { cwd: process.cwd() });
  for (const file of files) {
    updateImports(path.join(process.cwd(), file));
  }
}

console.log('Import paths updated successfully!');
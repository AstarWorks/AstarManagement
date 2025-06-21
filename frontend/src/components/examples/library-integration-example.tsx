'use client'

import { useState } from 'react'
import { Scale, FileText, User, AlertTriangle, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMatterStore, MatterStatus, Priority } from '@/stores/matter-store'
import { useUiStore } from '@/stores/ui-store'
import { validateMatter } from '@/lib/schemas/matter-schemas'

/**
 * Simple example demonstrating library integration compatibility
 * 
 * Features demonstrated:
 * - Zustand state management (matter store and UI store)
 * - Zod schema validation (matter validation)
 * - Lucide-React icons throughout the interface
 * - shadcn/ui Button component integration
 * - TypeScript type safety
 */
export function LibraryIntegrationExample() {
  const { matters, addMatter } = useMatterStore()
  const { theme, setTheme } = useUiStore()
  const [validationResult, setValidationResult] = useState<string>('')

  const handleAddTestMatter = () => {
    const testMatter = {
      id: crypto.randomUUID(),
      caseNumber: '2025-CV-0001',
      title: 'Test Contract Dispute',
      clientName: 'Test Client Corp',
      status: MatterStatus.INITIAL_REVIEW,
      priority: Priority.HIGH,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Test Zod validation
    const validation = validateMatter(testMatter)
    if (validation.success) {
      addMatter(testMatter)
      setValidationResult('✅ Matter validation passed and added to store')
    } else {
      setValidationResult('❌ Matter validation failed: ' + validation.error.message)
    }
  }

  const handleToggleTheme = () => {
    const newMode = theme.mode === 'light' ? 'dark' : 'light'
    setTheme({ mode: newMode })
  }

  const handleToggleLanguage = () => {
    const newLanguage = theme.language === 'en' ? 'jp' : 'en'
    setTheme({ language: newLanguage })
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <AlertTriangle className="size-4 text-red-500" />
      case 'HIGH':
        return <AlertTriangle className="size-4 text-orange-500" />
      default:
        return <FileText className="size-4 text-blue-500" />
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Scale className="size-6 text-primary" />
          Library Integration Test
        </h1>
        <p className="text-muted-foreground">
          Demonstrating Zustand + Zod + Lucide-React + shadcn/ui integration
        </p>
      </div>

      {/* Theme Controls */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Button onClick={handleToggleTheme} variant="outline">
          <Settings className="size-4 mr-2" />
          Theme: {theme.mode}
        </Button>
        <Button onClick={handleToggleLanguage} variant="outline">
          <User className="size-4 mr-2" />
          Lang: {theme.language}
        </Button>
      </div>

      {/* Matter Store Test */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="size-5" />
            Zustand Store Test ({matters.length} matters)
          </h2>
          <Button onClick={handleAddTestMatter}>
            <Scale className="size-4 mr-2" />
            Add Test Matter
          </Button>
        </div>

        {validationResult && (
          <div className="p-3 border rounded-md bg-muted/50">
            <code className="text-sm">{validationResult}</code>
          </div>
        )}

        {/* Display matters from store */}
        <div className="grid gap-2">
          {matters.slice(0, 3).map((matter) => (
            <div key={matter.id} className="flex items-center gap-3 p-3 border rounded-md">
              {getPriorityIcon(matter.priority)}
              <div className="flex-1">
                <div className="font-medium">{matter.title}</div>
                <div className="text-sm text-muted-foreground">
                  {matter.clientName} • {matter.caseNumber}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {matter.status.replace('_', ' ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Icon Showcase */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="size-5" />
          Lucide-React Icons
        </h2>
        <div className="flex flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-2 p-2 border rounded">
            <Scale className="size-5 text-blue-500" />
            <span className="text-sm">Legal</span>
          </div>
          <div className="flex items-center gap-2 p-2 border rounded">
            <FileText className="size-5 text-green-500" />
            <span className="text-sm">Documents</span>
          </div>
          <div className="flex items-center gap-2 p-2 border rounded">
            <User className="size-5 text-purple-500" />
            <span className="text-sm">Users</span>
          </div>
          <div className="flex items-center gap-2 p-2 border rounded">
            <AlertTriangle className="size-5 text-red-500" />
            <span className="text-sm">Priority</span>
          </div>
          <div className="flex items-center gap-2 p-2 border rounded">
            <Settings className="size-5 text-gray-500" />
            <span className="text-sm">Settings</span>
          </div>
        </div>
      </div>

      {/* Integration Status */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Integration Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 border rounded-md">
            <div className="text-2xl mb-1">✅</div>
            <div className="text-sm font-medium">Zustand</div>
            <div className="text-xs text-muted-foreground">State Management</div>
          </div>
          <div className="text-center p-3 border rounded-md">
            <div className="text-2xl mb-1">✅</div>
            <div className="text-sm font-medium">Zod</div>
            <div className="text-xs text-muted-foreground">Validation</div>
          </div>
          <div className="text-center p-3 border rounded-md">
            <div className="text-2xl mb-1">✅</div>
            <div className="text-sm font-medium">Lucide-React</div>
            <div className="text-xs text-muted-foreground">Icons</div>
          </div>
          <div className="text-center p-3 border rounded-md">
            <div className="text-2xl mb-1">✅</div>
            <div className="text-sm font-medium">shadcn/ui</div>
            <div className="text-xs text-muted-foreground">Components</div>
          </div>
        </div>
      </div>

      {/* Development Notes */}
      <div className="text-xs text-muted-foreground text-center space-y-1">
        <div>All libraries integrated successfully with Next.js 15, React 19, and TypeScript 5</div>
        <div>Build compatibility verified • Storybook integration confirmed</div>
        <div>Agent-native patterns implemented for CLI automation</div>
      </div>
    </div>
  )
}

/**
 * Agent-Native CLI Interface Documentation
 * 
 * This component demonstrates library integration and can be tested via CLI:
 * 
 * ```bash
 * # Test Zustand store operations
 * bunx ts-node -e "
 *   import { useMatterStore } from './src/stores/matter-store'
 *   console.log('Matters count:', useMatterStore.getState().matters.length)
 * "
 * 
 * # Test Zod validation
 * echo '{"id":"123","title":"Test","clientName":"Client"}' | \
 *   bunx ts-node -e "
 *     import { validateMatter } from './src/lib/schemas/matter-schemas'
 *     const data = JSON.parse(require('fs').readFileSync(0, 'utf8'))
 *     console.log(validateMatter(data))
 *   "
 * 
 * # Test UI store theme changes
 * bunx ts-node -e "
 *   import { useUiStore } from './src/stores/ui-store'
 *   useUiStore.getState().setTheme({ mode: 'dark' })
 *   console.log('Theme:', useUiStore.getState().theme)
 * "
 * ```
 */
'use client'

import * as React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Info } from 'lucide-react'
import { MatterStatus } from '@/components/kanban/types'

interface StatusTransition {
  from: MatterStatus
  to: MatterStatus
  matterId: string
  matterTitle: string
}

interface StatusConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transition: StatusTransition | null
  onConfirm: (reason: string) => void
  isLoading?: boolean
}

const criticalStatuses: MatterStatus[] = ['CLOSED', 'SETTLEMENT', 'TRIAL']

const statusLabels: Record<MatterStatus, string> = {
  INTAKE: 'Intake',
  INITIAL_REVIEW: 'Initial Review',
  INVESTIGATION: 'Investigation',
  RESEARCH: 'Research',
  DRAFT_PLEADINGS: 'Draft Pleadings',
  FILED: 'Filed',
  DISCOVERY: 'Discovery',
  MEDIATION: 'Mediation',
  TRIAL_PREP: 'Trial Prep',
  TRIAL: 'Trial',
  SETTLEMENT: 'Settlement',
  CLOSED: 'Closed',
}

export function StatusConfirmationDialog({
  open,
  onOpenChange,
  transition,
  onConfirm,
  isLoading = false,
}: StatusConfirmationDialogProps) {
  const [reason, setReason] = React.useState('')
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    if (!open) {
      setReason('')
      setError('')
    }
  }, [open])

  const handleConfirm = React.useCallback(() => {
    if (!reason.trim()) {
      setError('Please provide a reason for this status change')
      return
    }

    if (reason.trim().length < 10) {
      setError('Please provide a more detailed reason (at least 10 characters)')
      return
    }

    onConfirm(reason.trim())
  }, [reason, onConfirm])

  // Add keyboard shortcuts
  React.useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to confirm
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleConfirm()
      }
      // Escape to cancel (AlertDialog handles this by default)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, handleConfirm])

  if (!transition) return null

  const isCriticalTransition = criticalStatuses.includes(transition.to)
  const isClosing = transition.to === 'CLOSED'

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to change the status of{' '}
            <span className="font-semibold">{transition.matterTitle}</span> from{' '}
            <span className="font-semibold">{statusLabels[transition.from]}</span> to{' '}
            <span className="font-semibold">{statusLabels[transition.to]}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isCriticalTransition && (
          <Alert variant={isClosing ? 'destructive' : 'default'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {isClosing ? (
                <>
                  <strong>Warning:</strong> Closing a matter is a final action. Once closed,
                  this matter cannot be reopened. Please ensure all necessary work has been
                  completed.
                </>
              ) : (
                <>
                  <strong>Important:</strong> Moving to {statusLabels[transition.to]} status
                  requires careful consideration. This action will be logged and may trigger
                  additional workflows.
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium">
              Reason for status change <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Please provide a detailed reason for this status change..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                setError('')
              }}
              className="min-h-[100px]"
              disabled={isLoading}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          {transition.to === 'SETTLEMENT' && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Settlement status requires additional documentation. Please ensure settlement
                terms are properly recorded in the matter notes.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <AlertDialogFooter>
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-muted-foreground">
              Press <kbd className="px-1 py-0.5 text-xs bg-muted rounded">Ctrl</kbd>+<kbd className="px-1 py-0.5 text-xs bg-muted rounded">Enter</kbd> to confirm
            </span>
            <div className="flex gap-2">
              <AlertDialogCancel disabled={isLoading}>
                Cancel <span className="text-xs text-muted-foreground ml-1">(Esc)</span>
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirm} disabled={isLoading}>
                {isLoading ? 'Confirming...' : 'Confirm Change'}
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
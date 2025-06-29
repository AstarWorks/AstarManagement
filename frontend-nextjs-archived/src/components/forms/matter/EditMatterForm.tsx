'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Save, X, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { UpdateMatterSchema, type UpdateMatterRequest, type Matter } from '@/lib/schemas/matter-schemas'
import { useMatterStore } from '@/stores/matter-store'
import { updateMatter as updateMatterApi, getMatterById } from '@/services/api/matter.service'
import { MatterFormFields } from './MatterFormFields'

interface EditMatterFormProps {
  matter: Matter
  onSuccess?: () => void
  onCancel?: () => void
}

export function EditMatterForm({ matter, onSuccess, onCancel }: EditMatterFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { updateMatter } = useMatterStore()

  const form = useForm<UpdateMatterRequest>({
    resolver: zodResolver(UpdateMatterSchema),
    defaultValues: {
      id: matter.id,
      caseNumber: matter.caseNumber,
      title: matter.title,
      description: matter.description || '',
      clientName: matter.clientName,
      clientContact: matter.clientContact || '',
      opposingParty: matter.opposingParty || '',
      courtName: matter.courtName || '',
      filingDate: matter.filingDate || undefined,
      priority: matter.priority,
      assignedLawyerId: matter.assignedLawyerId || undefined,
      assignedClerkId: matter.assignedClerkId || undefined,
      estimatedCompletionDate: matter.estimatedCompletionDate || undefined,
      notes: matter.notes || '',
      tags: matter.tags || []
    }
  })

  // Check if another user has updated the matter
  useEffect(() => {
    let mounted = true
    
    const checkForUpdates = async () => {
      if (!mounted) return
      
      try {
        const latestMatter = await getMatterById(matter.id)
        if (!mounted) return
        
        if (new Date(latestMatter.updatedAt) > new Date(matter.updatedAt)) {
          toast.warning('This matter has been updated by another user', {
            description: 'Please refresh to see the latest changes.',
            action: {
              label: 'Refresh',
              onClick: () => window.location.reload()
            }
          })
        }
      } catch (error) {
        if (!mounted) return
        console.error('Failed to check for updates:', error)
      }
    }

    // Check for updates every 60 seconds (less aggressive)
    const interval = setInterval(checkForUpdates, 60000)
    
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [matter.id, matter.updatedAt])

  const onSubmit = async (data: UpdateMatterRequest) => {
    try {
      setIsSubmitting(true)
      
      // Only send changed fields
      const changedFields = Object.keys(form.formState.dirtyFields).reduce((acc, key) => {
        acc[key as keyof UpdateMatterRequest] = data[key as keyof UpdateMatterRequest]
        return acc
      }, { id: matter.id } as UpdateMatterRequest)
      
      // Call API to update matter
      const updatedMatter = await updateMatterApi(matter.id, changedFields)
      
      // Update local store
      updateMatter(matter.id, updatedMatter)
      
      toast.success('Matter updated successfully', {
        description: `Case ${updatedMatter.caseNumber} has been updated.`
      })
      
      // Call success callback or navigate
      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/matters/${updatedMatter.id}`)
      }
    } catch (error) {
      console.error('Failed to update matter:', error)
      toast.error('Failed to update matter', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      router.back()
    }
  }

  const handleReset = () => {
    form.reset()
    toast.info('Form reset to original values')
  }

  const isDirty = Object.keys(form.formState.dirtyFields).length > 0

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <MatterFormFields form={form} isEditing />
        
        <div className="flex items-center justify-between gap-2 sticky bottom-0 bg-background pt-4 pb-4 border-t">
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            disabled={!isDirty || isSubmitting}
          >
            <RefreshCw className="size-4 mr-2" />
            Reset
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              <X className="size-4 mr-2" />
              Cancel
            </Button>
            
            <Button 
              type="submit" 
              disabled={isSubmitting || !isDirty}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="size-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Save, X, FileText } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { CreateMatterSchema, type CreateMatterRequest } from '@/lib/schemas/matter-schemas'
import { useMatterStore } from '@/stores/matter-store'
import { createMatter } from '@/services/api/matter.service'
import { MatterFormFields } from './MatterFormFields'
import { useFormPersistence } from '@/hooks/useFormPersistence'

interface CreateMatterFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function CreateMatterForm({ onSuccess, onCancel }: CreateMatterFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { addMatter } = useMatterStore()

  const form = useForm<CreateMatterRequest>({
    resolver: zodResolver(CreateMatterSchema),
    defaultValues: {
      caseNumber: '',
      title: '',
      description: '',
      clientName: '',
      clientContact: '',
      opposingParty: '',
      courtName: '',
      priority: 'MEDIUM',
      notes: '',
      tags: []
    }
  })

  // Form persistence
  const { clearPersistedData, hasDraft } = useFormPersistence(form, {
    key: 'create-matter-draft',
    exclude: ['id'],
    enabled: true
  })

  // Show notification when draft is restored
  useEffect(() => {
    const handleDraftRestored = () => {
      toast.info('Draft restored', {
        description: 'Your previous form data has been restored.',
        action: {
          label: 'Clear',
          onClick: () => {
            clearPersistedData()
            form.reset()
          }
        }
      })
    }

    window.addEventListener('formDraftRestored', handleDraftRestored)
    return () => window.removeEventListener('formDraftRestored', handleDraftRestored)
  }, [clearPersistedData, form])

  const onSubmit = async (data: CreateMatterRequest) => {
    try {
      setIsSubmitting(true)
      
      // Call API to create matter
      const createdMatter = await createMatter(data)
      
      // Update local store
      addMatter(createdMatter)
      
      toast.success('Matter created successfully', {
        description: `Case ${createdMatter.caseNumber} has been created.`
      })
      
      // Clear persisted draft
      clearPersistedData()
      
      // Reset form
      form.reset()
      
      // Call success callback or navigate
      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/matters/${createdMatter.id}`)
      }
    } catch (error) {
      console.error('Failed to create matter:', error)
      toast.error('Failed to create matter', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (isDirty && hasDraft()) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to cancel?')
      if (!confirmed) return
    }
    
    clearPersistedData()
    
    if (onCancel) {
      onCancel()
    } else {
      router.back()
    }
  }

  const isDirty = Object.keys(form.formState.dirtyFields).length > 0

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <MatterFormFields form={form} />
        
        <div className="flex items-center justify-between sticky bottom-0 bg-background pt-4 pb-4 border-t">
          {hasDraft() && !isSubmitting && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="size-4" />
              <span>Draft saved automatically</span>
            </div>
          )}
          
          <div className="flex items-center justify-end gap-2 ml-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              <X className="size-4 mr-2" />
              Cancel
            </Button>
          </div>
          
          <Button 
            type="submit" 
            disabled={isSubmitting || !isDirty}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="size-4 mr-2" />
                Create Matter
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
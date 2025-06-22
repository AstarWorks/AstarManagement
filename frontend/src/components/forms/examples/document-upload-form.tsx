'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Upload, File, X, Plus, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { FieldArray } from '../field-array'
import { ConditionalField, conditionalLogic } from '../conditional-field'
import { useAutoSave } from '@/hooks/useAutoSave'

// Document schema
const documentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Document name is required"),
  file: z.any().optional(), // File object
  type: z.enum(['contract', 'evidence', 'correspondence', 'court_filing', 'other']),
  description: z.string().optional(),
  confidential: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  uploadProgress: z.number().optional()
})

// Main form schema
const documentUploadSchema = z.object({
  matterId: z.string().min(1, "Matter selection is required"),
  category: z.enum(['case_documents', 'evidence', 'correspondence', 'filings']),
  documents: z.array(documentSchema).min(1, "At least one document is required"),
  notes: z.string().optional(),
  notifyStakeholders: z.boolean().default(false),
  reminderDate: z.string().optional()
})

type DocumentUploadFormData = z.infer<typeof documentUploadSchema>

/**
 * Document upload form demonstrating field arrays and file handling
 */
export function DocumentUploadForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  const form = useForm<DocumentUploadFormData>({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: {
      category: 'case_documents',
      documents: [
        {
          name: '',
          type: 'contract',
          description: '',
          confidential: false,
          tags: []
        }
      ],
      notifyStakeholders: false
    }
  })

  // Auto-save
  const autoSave = useAutoSave(form, {
    key: 'document-upload-form',
    exclude: ['documents.*.file'], // Don't save file objects
    debounce: 1000,
    onSaveSuccess: () => console.log('Form auto-saved')
  })

  // Mock file upload function
  const uploadFile = async (file: File, docId: string): Promise<string> => {
    return new Promise((resolve) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 20
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)
          setUploadProgress(prev => ({ ...prev, [docId]: 100 }))
          resolve(`uploaded-${file.name}`)
        } else {
          setUploadProgress(prev => ({ ...prev, [docId]: progress }))
        }
      }, 200)
    })
  }

  // Handle file selection
  const handleFileSelect = (index: number, file: File | null) => {
    const docId = `doc-${index}`
    form.setValue(`documents.${index}.file`, file)
    
    if (file) {
      // Auto-fill name if empty
      const currentName = form.getValues(`documents.${index}.name`)
      if (!currentName) {
        form.setValue(`documents.${index}.name`, file.name.replace(/\.[^/.]+$/, ''))
      }
      
      // Start upload simulation
      setUploadProgress(prev => ({ ...prev, [docId]: 0 }))
      uploadFile(file, docId)
    } else {
      setUploadProgress(prev => {
        const newProgress = { ...prev }
        delete newProgress[docId]
        return newProgress
      })
    }
  }

  // Form submission
  const handleSubmit = async (data: DocumentUploadFormData) => {
    setIsSubmitting(true)
    try {
      console.log('Uploading documents:', data)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      autoSave.clear()
      alert('Documents uploaded successfully!')
      
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const matters = [
    { value: '1', label: '2025-CV-0001 - Contract Dispute - ABC Corp' },
    { value: '2', label: '2025-CV-0002 - Employment Issue - XYZ Ltd' },
    { value: '3', label: '2025-CV-0003 - Real Estate - Yamada Holdings' }
  ]

  const documentTypes = [
    { value: 'contract', label: 'Contract' },
    { value: 'evidence', label: 'Evidence' },
    { value: 'correspondence', label: 'Correspondence' },
    { value: 'court_filing', label: 'Court Filing' },
    { value: 'other', label: 'Other' }
  ]

  const availableTags = [
    'urgent', 'confidential', 'client-facing', 'internal', 'draft', 'final', 'signed'
  ]

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Upload Documents</h1>
        <p className="text-muted-foreground mt-2">
          Upload and organize case documents with metadata and categorization.
        </p>
        
        {autoSave.hasSavedData && (
          <Alert className="mt-4">
            <AlertCircle className="size-4" />
            <AlertDescription>
              You have unsaved changes from a previous session.
              <Button variant="link" className="p-0 h-auto ml-2" onClick={() => autoSave.clear()}>
                Clear draft
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          {/* Matter Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Case Information</CardTitle>
              <CardDescription>Select the matter to associate these documents with</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="matterId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Matter *</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a matter..." />
                          </SelectTrigger>
                          <SelectContent>
                            {matters.map((matter) => (
                              <SelectItem key={matter.value} value={matter.value}>
                                {matter.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Category *</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="case_documents">Case Documents</SelectItem>
                            <SelectItem value="evidence">Evidence</SelectItem>
                            <SelectItem value="correspondence">Correspondence</SelectItem>
                            <SelectItem value="filings">Court Filings</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Documents Field Array */}
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>Upload and configure document metadata</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldArray
                form={form}
                name="documents"
                addButtonLabel="Add Another Document"
                defaultValue={{
                  name: '',
                  type: 'contract',
                  description: '',
                  confidential: false,
                  tags: []
                }}
                maxItems={20}
                minItems={1}
                renderItem={({ item, index, remove }) => {
                  const docId = `doc-${index}`
                  const progress = uploadProgress[docId]
                  
                  return (
                    <div className="space-y-4">
                      {/* File Upload */}
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                        <div className="text-center">
                          <Upload className="mx-auto size-12 text-muted-foreground" />
                          <div className="mt-4">
                            <label htmlFor={`file-${index}`} className="cursor-pointer">
                              <span className="mt-2 block text-sm font-medium text-foreground">
                                Click to upload or drag and drop
                              </span>
                              <span className="mt-1 block text-xs text-muted-foreground">
                                PDF, DOC, DOCX, JPG, PNG up to 10MB
                              </span>
                            </label>
                            <input
                              id={`file-${index}`}
                              type="file"
                              className="sr-only"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileSelect(index, e.target.files?.[0] || null)}
                            />
                          </div>
                          
                          {progress !== undefined && (
                            <div className="mt-4 space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span>Uploading...</span>
                                <span>{Math.round(progress)}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                            </div>
                          )}
                          
                          {form.watch(`documents.${index}.file`) && progress === 100 && (
                            <div className="mt-4 flex items-center justify-center gap-2 text-green-600">
                              <File className="size-4" />
                              <span className="text-sm font-medium">Upload complete</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Document Metadata */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`documents.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Document Name *</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter document name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`documents.${index}.type`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Document Type *</FormLabel>
                              <FormControl>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {documentTypes.map((type) => (
                                      <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name={`documents.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="Brief description of the document content"
                                className="min-h-[80px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Tags */}
                      <FormField
                        control={form.control}
                        name={`documents.${index}.tags`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tags</FormLabel>
                            <FormControl>
                              <div className="flex flex-wrap gap-2">
                                {availableTags.map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant={field.value?.includes(tag) ? "default" : "outline"}
                                    className="cursor-pointer"
                                    onClick={() => {
                                      const current = field.value || []
                                      if (current.includes(tag)) {
                                        field.onChange(current.filter(t => t !== tag))
                                      } else {
                                        field.onChange([...current, tag])
                                      }
                                    }}
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </FormControl>
                            <FormDescription>
                              Click tags to add/remove them
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Confidential Flag */}
                      <FormField
                        control={form.control}
                        name={`documents.${index}.confidential`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={(e) => field.onChange(e.target.checked)}
                                className="mt-1"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Mark as Confidential</FormLabel>
                              <FormDescription>
                                Restrict access to this document
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  )
                }}
              />
            </CardContent>
          </Card>

          {/* Additional Options */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Options</CardTitle>
              <CardDescription>Configure notifications and reminders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Upload Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Any additional notes about this document upload..."
                        className="min-h-[80px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notifyStakeholders"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="mt-1"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Notify Stakeholders</FormLabel>
                      <FormDescription>
                        Send email notifications to assigned lawyers and clerks
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <ConditionalField
                form={form}
                showWhen={conditionalLogic.isTrue('notifyStakeholders')}
              >
                <FormField
                  control={form.control}
                  name="reminderDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reminder Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </FormControl>
                      <FormDescription>
                        Set a reminder to follow up on these documents
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </ConditionalField>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => form.reset()}
            >
              Reset Form
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="min-w-32"
            >
              {isSubmitting ? 'Uploading...' : 'Upload Documents'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, FileText, Settings, Calendar, Users, Building } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

import { MultiStepForm, createStepConfig } from '../multi-step-form'
import { ConditionalField, conditionalLogic } from '../conditional-field'
import { FieldArray } from '../field-array'
import { useAutoSave } from '@/hooks/useAutoSave'

// Schemas for each step
const clientInformationSchema = z.object({
  clientType: z.enum(['new', 'existing']),
  existingClientId: z.string().optional(),
  clientEntityType: z.enum(['individual', 'corporate']).optional(),
  // Individual fields
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  // Corporate fields
  companyName: z.string().optional(),
  taxId: z.string().optional(),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  // Address
  address1: z.string().optional(),
  address2: z.string().optional(),
  city: z.string().optional(),
  prefecture: z.string().optional(),
  postalCode: z.string().optional()
}).refine((data) => {
  if (data.clientType === 'existing') {
    return !!data.existingClientId
  }
  if (data.clientType === 'new' && data.clientEntityType === 'individual') {
    return !!data.firstName && !!data.lastName && !!data.email
  }
  if (data.clientType === 'new' && data.clientEntityType === 'corporate') {
    return !!data.companyName && !!data.contactEmail
  }
  return true
}, {
  message: "Please fill in the required fields for the selected client type"
})

const matterDetailsSchema = z.object({
  matterTitle: z.string().min(1, "Matter title is required"),
  matterType: z.enum(['CIVIL', 'CRIMINAL', 'CORPORATE', 'FAMILY', 'IMMIGRATION', 'INTELLECTUAL_PROPERTY', 'LABOR', 'REAL_ESTATE', 'TAX', 'OTHER']),
  matterDescription: z.string().min(10, "Description must be at least 10 characters"),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  openDate: z.string(),
  estimatedValue: z.number().optional(),
  opposingParties: z.array(z.object({
    name: z.string().min(1, "Party name is required"),
    representative: z.string().optional()
  })).optional()
})

const caseSettingsSchema = z.object({
  assignedLawyer: z.string().min(1, "Primary lawyer is required"),
  responsibleClerk: z.string().optional(),
  billingType: z.enum(['hourly', 'flat', 'contingency']),
  hourlyRate: z.number().optional(),
  flatFee: z.number().optional(),
  statuteLimitation: z.string().optional(),
  nextHearing: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isConfidential: z.boolean().default(false),
  enableAutoReminders: z.boolean().default(true)
}).refine((data) => {
  if (data.billingType === 'hourly') {
    return !!data.hourlyRate && data.hourlyRate > 0
  }
  if (data.billingType === 'flat') {
    return !!data.flatFee && data.flatFee > 0
  }
  return true
}, {
  message: "Please specify the billing rate for the selected billing type"
})

const reviewSchema = z.object({})

// Combined form schema
const matterCreationSchema = z.object({
  client: clientInformationSchema,
  matter: matterDetailsSchema,
  settings: caseSettingsSchema,
  review: reviewSchema
})

type MatterCreationFormData = z.infer<typeof matterCreationSchema>

// Form steps configuration
const formSteps = [
  createStepConfig({
    id: 'client',
    title: 'Client Information',
    description: 'Select or add client details',
    schema: clientInformationSchema
  }),
  createStepConfig({
    id: 'matter',
    title: 'Matter Details',
    description: 'Case information and opposing parties',
    schema: matterDetailsSchema
  }),
  createStepConfig({
    id: 'settings',
    title: 'Case Settings',
    description: 'Billing, assignments, and deadlines',
    schema: caseSettingsSchema
  }),
  createStepConfig({
    id: 'review',
    title: 'Review & Submit',
    description: 'Confirm all details before creating the matter',
    schema: reviewSchema
  })
]

/**
 * Comprehensive multi-step matter creation form demonstrating complex form patterns
 */
export function MatterCreationMultiStepForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<MatterCreationFormData>({
    resolver: zodResolver(matterCreationSchema),
    defaultValues: {
      client: {
        clientType: 'new',
        clientEntityType: 'individual'
      },
      matter: {
        priority: 'MEDIUM',
        openDate: new Date().toISOString().split('T')[0],
        opposingParties: []
      },
      settings: {
        billingType: 'hourly',
        enableAutoReminders: true,
        isConfidential: false,
        tags: []
      },
      review: {}
    }
  })

  // Auto-save with enhanced options
  const autoSave = useAutoSave(form, {
    key: 'matter-creation-form',
    debounce: 1500,
    saveOnlyWhenDirty: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    compress: true,
    version: '2.0',
    exclude: ['review'],
    onSaveSuccess: () => console.log('Form auto-saved'),
    onSaveError: (error) => console.error('Auto-save failed:', error)
  })

  // Form submission
  const handleSubmit = async (data: MatterCreationFormData) => {
    setIsSubmitting(true)
    try {
      console.log('Creating matter with data:', data)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Clear auto-save data on success
      autoSave.clear()
      
      // Navigate or show success message
      alert('Matter created successfully!')
      
    } catch (error) {
      console.error('Failed to create matter:', error)
      alert('Failed to create matter. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStepComplete = (step: number, data: any) => {
    console.log(`Step ${step + 1} completed:`, data)
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Matter</h1>
        <p className="text-muted-foreground mt-2">
          Complete the multi-step process to create a new legal matter with client information and case details.
        </p>
        
        {autoSave.hasSavedData && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <Badge variant="secondary">Draft Available</Badge>
            <span className="text-muted-foreground">
              Last saved: {autoSave.lastSave?.toLocaleTimeString()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => autoSave.clear()}
            >
              Clear Draft
            </Button>
          </div>
        )}
      </div>

      <Form {...form}>
        <MultiStepForm
          steps={formSteps}
          initialData={form.getValues()}
          persistData={false} // We're using our own auto-save
          storageKey="matter-creation-steps"
          onStepComplete={handleStepComplete}
          onSubmit={handleSubmit}
          autoAdvance={false}
          showProgress={true}
          showStepNavigation={true}
        >
          {({ currentStep, stepConfig, form: stepForm, nextStep, isLastStep }) => (
            <>
              {/* Step 1: Client Information */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="client.clientType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client Type *</FormLabel>
                          <FormControl>
                            <RadioGroup
                              value={field.value}
                              onValueChange={field.onChange}
                              className="flex flex-col space-y-2"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="new" id="new" />
                                <label htmlFor="new" className="text-sm font-medium">New Client</label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="existing" id="existing" />
                                <label htmlFor="existing" className="text-sm font-medium">Existing Client</label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <ConditionalField
                      form={form}
                      showWhen={conditionalLogic.equals('client.clientType', 'existing')}
                    >
                      <FormField
                        control={form.control}
                        name="client.existingClientId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Existing Client *</FormLabel>
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Search existing clients..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">Yamada Corporation</SelectItem>
                                  <SelectItem value="2">Tanaka Industries</SelectItem>
                                  <SelectItem value="3">Sato Holdings</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </ConditionalField>
                  </div>

                  <ConditionalField
                    form={form}
                    showWhen={conditionalLogic.equals('client.clientType', 'new')}
                  >
                    <div className="space-y-6">
                      <Separator />
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <User className="size-5" />
                        New Client Information
                      </h3>
                      
                      <FormField
                        control={form.control}
                        name="client.clientEntityType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Entity Type *</FormLabel>
                            <FormControl>
                              <RadioGroup
                                value={field.value}
                                onValueChange={field.onChange}
                                className="flex space-x-4"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="individual" id="individual" />
                                  <label htmlFor="individual" className="text-sm">Individual</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="corporate" id="corporate" />
                                  <label htmlFor="corporate" className="text-sm">Corporation</label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <ConditionalField
                        form={form}
                        showWhen={conditionalLogic.equals('client.clientEntityType', 'individual')}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="client.firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name *</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="client.lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name *</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="client.email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email *</FormLabel>
                                <FormControl>
                                  <Input type="email" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="client.phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </ConditionalField>

                      <ConditionalField
                        form={form}
                        showWhen={conditionalLogic.equals('client.clientEntityType', 'corporate')}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="client.companyName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Company Name *</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="client.taxId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tax ID</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="client.contactPerson"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Contact Person</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="client.contactEmail"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Contact Email *</FormLabel>
                                <FormControl>
                                  <Input type="email" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </ConditionalField>

                      {/* Address Information */}
                      <div className="space-y-4">
                        <h4 className="font-medium flex items-center gap-2">
                          <Building className="size-4" />
                          Address Information
                        </h4>
                        <div className="grid grid-cols-1 gap-4">
                          <FormField
                            control={form.control}
                            name="client.address1"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address Line 1</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="client.address2"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address Line 2</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name="client.city"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>City</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="client.prefecture"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Prefecture</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="client.postalCode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Postal Code</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="123-4567" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </ConditionalField>
                </div>
              )}

              {/* Step 2: Matter Details */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                    <FileText className="size-5" />
                    Case Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="matter.matterTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Matter Title *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="matter.matterType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Matter Type *</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="CIVIL">Civil Law</SelectItem>
                                <SelectItem value="CRIMINAL">Criminal Law</SelectItem>
                                <SelectItem value="CORPORATE">Corporate Law</SelectItem>
                                <SelectItem value="FAMILY">Family Law</SelectItem>
                                <SelectItem value="IMMIGRATION">Immigration Law</SelectItem>
                                <SelectItem value="INTELLECTUAL_PROPERTY">Intellectual Property</SelectItem>
                                <SelectItem value="LABOR">Labor Law</SelectItem>
                                <SelectItem value="REAL_ESTATE">Real Estate Law</SelectItem>
                                <SelectItem value="TAX">Tax Law</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
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
                    name="matter.matterDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Case Description *</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Provide a detailed description of the legal matter..."
                            className="min-h-[100px]"
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value?.length || 0}/2000 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="matter.priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="LOW">Low Priority</SelectItem>
                                <SelectItem value="MEDIUM">Medium Priority</SelectItem>
                                <SelectItem value="HIGH">High Priority</SelectItem>
                                <SelectItem value="URGENT">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="matter.openDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Case Open Date *</FormLabel>
                          <FormControl>
                            <DatePicker
                              date={field.value ? new Date(field.value) : new Date()}
                              onDateChange={(date) => 
                                field.onChange(date ? date.toISOString().split('T')[0] : '')
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="matter.estimatedValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Value (¥)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Opposing Parties Field Array */}
                  <div className="space-y-4">
                    <FieldArray
                      form={form}
                      name="matter.opposingParties"
                      title="Opposing Parties"
                      addButtonLabel="Add Opposing Party"
                      defaultValue={{ name: '', representative: '' }}
                      maxItems={10}
                      renderItem={({ item, index, remove }) => (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`matter.opposingParties.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name/Company *</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`matter.opposingParties.${index}.representative`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Legal Representative</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Case Settings */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                    <Settings className="size-5" />
                    Case Management Settings
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="settings.assignedLawyer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Lawyer *</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select lawyer..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="lawyer1">Tanaka Hiroshi</SelectItem>
                                <SelectItem value="lawyer2">Yamada Akiko</SelectItem>
                                <SelectItem value="lawyer3">Sato Kenji</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="settings.responsibleClerk"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Responsible Clerk</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select clerk..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="clerk1">Suzuki Yuki</SelectItem>
                                <SelectItem value="clerk2">Takahashi Mai</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Billing Settings */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Billing Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="settings.billingType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Billing Type *</FormLabel>
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="hourly">Hourly Rate</SelectItem>
                                  <SelectItem value="flat">Flat Fee</SelectItem>
                                  <SelectItem value="contingency">Contingency</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <ConditionalField
                        form={form}
                        showWhen={conditionalLogic.equals('settings.billingType', 'hourly')}
                      >
                        <FormField
                          control={form.control}
                          name="settings.hourlyRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hourly Rate (¥) *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </ConditionalField>
                      
                      <ConditionalField
                        form={form}
                        showWhen={conditionalLogic.equals('settings.billingType', 'flat')}
                      >
                        <FormField
                          control={form.control}
                          name="settings.flatFee"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Flat Fee (¥) *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </ConditionalField>
                    </div>
                  </div>

                  {/* Important Dates */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Calendar className="size-4" />
                      Important Dates
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="settings.statuteLimitation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Statute of Limitations</FormLabel>
                            <FormControl>
                              <DatePicker
                                date={field.value ? new Date(field.value) : undefined}
                                onDateChange={(date) => 
                                  field.onChange(date ? date.toISOString().split('T')[0] : '')
                                }
                                placeholder="Select deadline..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="settings.nextHearing"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Next Court Hearing</FormLabel>
                            <FormControl>
                              <DatePicker
                                date={field.value ? new Date(field.value) : undefined}
                                onDateChange={(date) => 
                                  field.onChange(date ? date.toISOString() : '')
                                }
                                placeholder="Select hearing date..."
                                showTime
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Tags and Settings */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="settings.tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Case Tags</FormLabel>
                          <FormControl>
                            <div className="flex flex-wrap gap-2">
                              {['contract', 'litigation', 'consultation', 'urgent', 'pro_bono'].map((tag) => (
                                <div key={tag} className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={field.value?.includes(tag)}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || []
                                      if (checked) {
                                        field.onChange([...current, tag])
                                      } else {
                                        field.onChange(current.filter(t => t !== tag))
                                      }
                                    }}
                                  />
                                  <label className="text-sm capitalize">{tag.replace('_', ' ')}</label>
                                </div>
                              ))}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="settings.isConfidential"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Confidential Case</FormLabel>
                              <FormDescription>
                                Mark this case as confidential with restricted access
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="settings.enableAutoReminders"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Enable Automatic Reminders</FormLabel>
                              <FormDescription>
                                Send email reminders for important deadlines
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold border-b pb-2">Review Matter Details</h3>
                  
                  {/* Form summary would go here - simplified for demo */}
                  <div className="space-y-4">
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Summary</h4>
                      <div className="text-sm space-y-1">
                        <p><strong>Client:</strong> {form.watch('client.firstName')} {form.watch('client.lastName') || form.watch('client.companyName')}</p>
                        <p><strong>Matter:</strong> {form.watch('matter.matterTitle')}</p>
                        <p><strong>Type:</strong> {form.watch('matter.matterType')}</p>
                        <p><strong>Priority:</strong> {form.watch('matter.priority')}</p>
                        <p><strong>Assigned Lawyer:</strong> {form.watch('settings.assignedLawyer')}</p>
                      </div>
                    </div>
                    
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Next Steps</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Matter will be created and assigned to the primary lawyer</li>
                        <li>• Initial case file will be set up automatically</li>
                        <li>• Calendar reminders will be created for important dates</li>
                        <li>• Client will receive confirmation email with case details</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation handled by MultiStepForm */}
              <div className="flex justify-end mt-6">
                <Button
                  type="button"
                  onClick={() => {
                    if (isLastStep) {
                      form.handleSubmit(handleSubmit)()
                    } else {
                      nextStep()
                    }
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : isLastStep ? 'Create Matter' : 'Next'}
                </Button>
              </div>
            </>
          )}
        </MultiStepForm>
      </Form>
    </div>
  )
}
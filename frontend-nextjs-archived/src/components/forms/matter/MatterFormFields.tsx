'use client'

import { UseFormReturn } from 'react-hook-form'
import { CreateMatterRequest, UpdateMatterRequest } from '@/lib/schemas/matter-schemas'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, User, Calendar, Tag, AlertCircle } from 'lucide-react'

interface MatterFormFieldsProps<T extends CreateMatterRequest | UpdateMatterRequest> {
  form: UseFormReturn<T>
  isEditing?: boolean
}

export function MatterFormFields<T extends CreateMatterRequest | UpdateMatterRequest>({ 
  form, 
  isEditing = false 
}: MatterFormFieldsProps<T>) {
  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Basic Information
          </CardTitle>
          <CardDescription>
            Core details about the matter
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="caseNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Case Number *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="2025-CV-0001" 
                      {...field} 
                      disabled={isEditing}
                    />
                  </FormControl>
                  <FormDescription>
                    Format: YYYY-TT-NNNN (e.g., 2025-CV-0001)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value || 'MEDIUM'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter matter title" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Provide a detailed description of the matter"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Client Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5" />
            Client Information
          </CardTitle>
          <CardDescription>
            Details about the client and opposing party
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="John Doe or ABC Corporation" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder="client@example.com" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="opposingParty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Opposing Party</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Name of opposing party" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Case Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-5" />
            Case Details
          </CardTitle>
          <CardDescription>
            Court information and important dates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="courtName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Court Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Tokyo District Court" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="filingDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Filing Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value ? new Date(field.value) : undefined}
                      onDateChange={(date) => 
                        field.onChange(date ? date.toISOString() : undefined)
                      }
                      placeholder="Select filing date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estimatedCompletionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Completion Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value ? new Date(field.value) : undefined}
                      onDateChange={(date) => 
                        field.onChange(date ? date.toISOString() : undefined)
                      }
                      placeholder="Select estimated completion"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5" />
            Assignment
          </CardTitle>
          <CardDescription>
            Assign lawyers and clerks to this matter
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="assignedLawyerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Lawyer</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Lawyer ID (temporary)" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    TODO: Replace with user selection dropdown
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assignedClerkId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Clerk</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Clerk ID (temporary)" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    TODO: Replace with user selection dropdown
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="size-5" />
            Additional Information
          </CardTitle>
          <CardDescription>
            Notes and tags for organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Additional notes or comments"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter tags separated by commas" 
                    value={field.value?.join(', ') || ''}
                    onChange={(e) => {
                      const tags = e.target.value
                        .split(',')
                        .map(tag => tag.trim())
                        .filter(tag => tag.length > 0)
                      field.onChange(tags.length > 0 ? tags : [])
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Separate multiple tags with commas
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Validation Notice */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <AlertCircle className="size-4" />
        <span>Fields marked with * are required</span>
      </div>
    </div>
  )
}
"use client"

import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton, TextSkeleton, ButtonSkeleton } from './EnhancedSkeleton'
import { cn } from '@/lib/utils'

interface FormSkeletonProps {
  fields?: number
  showHeader?: boolean
  showFooter?: boolean
  layout?: 'single' | 'double' | 'grid'
  className?: string
}

/**
 * Form field skeleton component
 */
function FormFieldSkeleton({
  hasLabel = true,
  hasHelperText = false,
  fieldType = 'input',
  className
}: {
  hasLabel?: boolean
  hasHelperText?: boolean
  fieldType?: 'input' | 'textarea' | 'select' | 'checkbox' | 'radio'
  className?: string
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {/* Field label */}
      {hasLabel && (
        <Skeleton className="h-4 w-24 rounded" />
      )}
      
      {/* Field input */}
      {fieldType === 'input' && (
        <Skeleton className="h-9 w-full rounded-md" />
      )}
      
      {fieldType === 'textarea' && (
        <Skeleton className="h-20 w-full rounded-md" />
      )}
      
      {fieldType === 'select' && (
        <Skeleton className="h-9 w-full rounded-md" />
      )}
      
      {fieldType === 'checkbox' && (
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-32 rounded" />
        </div>
      )}
      
      {fieldType === 'radio' && (
        <div className="space-y-2">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
          ))}
        </div>
      )}
      
      {/* Helper text */}
      {hasHelperText && (
        <Skeleton className="h-3 w-40 rounded" />
      )}
    </div>
  )
}

/**
 * Generic form skeleton
 */
export function FormSkeleton({
  fields = 4,
  showHeader = true,
  showFooter = true,
  layout = 'single',
  className
}: FormSkeletonProps) {
  const gridClasses = {
    single: 'grid-cols-1',
    double: 'grid-cols-1 md:grid-cols-2',
    grid: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  }

  return (
    <Card className={cn("w-full max-w-2xl", className)}>
      {/* Form header */}
      {showHeader && (
        <CardHeader>
          <div className="space-y-2">
            <Skeleton className="h-6 w-48 rounded" />
            <Skeleton className="h-4 w-64 rounded" />
          </div>
        </CardHeader>
      )}
      
      <CardContent className="space-y-6">
        {/* Form fields */}
        <div className={cn("grid gap-4", gridClasses[layout])}>
          {Array.from({ length: fields }, (_, i) => (
            <FormFieldSkeleton 
              key={i}
              fieldType={i % 4 === 0 ? 'textarea' : i % 3 === 0 ? 'select' : 'input'}
              hasHelperText={i % 3 === 0}
            />
          ))}
        </div>
        
        {/* Form footer */}
        {showFooter && (
          <div className="flex items-center justify-between pt-4 border-t">
            <ButtonSkeleton size="default" className="bg-muted/50" />
            <div className="flex gap-2">
              <ButtonSkeleton size="default" />
              <ButtonSkeleton size="default" className="w-16" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Matter form skeleton (specific to the application)
 */
export function MatterFormSkeleton({
  className
}: {
  className?: string
}) {
  return (
    <Card className={cn("w-full max-w-4xl", className)}>
      <CardHeader>
        <div className="space-y-2">
          <Skeleton className="h-6 w-40 rounded" />
          <Skeleton className="h-4 w-72 rounded" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Basic information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormFieldSkeleton fieldType="input" />
          <FormFieldSkeleton fieldType="input" />
          <FormFieldSkeleton fieldType="select" />
          <FormFieldSkeleton fieldType="select" />
        </div>
        
        {/* Client information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormFieldSkeleton fieldType="input" />
          <FormFieldSkeleton fieldType="input" />
          <FormFieldSkeleton fieldType="input" />
          <FormFieldSkeleton fieldType="input" />
        </div>
        
        {/* Description */}
        <FormFieldSkeleton fieldType="textarea" hasHelperText />
        
        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormFieldSkeleton fieldType="input" />
          <FormFieldSkeleton fieldType="input" />
        </div>
        
        {/* Assignments */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormFieldSkeleton fieldType="select" />
          <FormFieldSkeleton fieldType="select" />
        </div>
        
        {/* Tags */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-16 rounded" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-6 w-16 rounded-full" />
            ))}
          </div>
        </div>
        
        {/* Form actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <ButtonSkeleton className="bg-muted/50" />
          <div className="flex gap-2">
            <ButtonSkeleton />
            <ButtonSkeleton className="w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Search form skeleton
 */
export function SearchFormSkeleton({
  showFilters = true,
  className
}: {
  showFilters?: boolean
  className?: string
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Search input */}
      <div className="relative">
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="absolute right-3 top-3 h-4 w-4 rounded" />
      </div>
      
      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
        </div>
      )}
      
      {/* Search suggestions */}
      <div className="space-y-2">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 flex-1 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
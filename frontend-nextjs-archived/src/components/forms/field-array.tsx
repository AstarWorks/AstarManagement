'use client'

import { ReactNode } from 'react'
import { useFieldArray, UseFormReturn, FieldArrayPath, FieldArray } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, GripVertical, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

/**
 * Props for the FieldArray component
 */
export interface FieldArrayProps<T extends Record<string, any>> {
  /** Form instance from react-hook-form */
  form: UseFormReturn<T>
  /** Name of the field array */
  name: FieldArrayPath<T>
  /** Function to render each array item */
  renderItem: (props: {
    item: any
    index: number
    remove: () => void
    move: (from: number, to: number) => void
    form: UseFormReturn<T>
  }) => ReactNode
  /** Default value for new items */
  defaultValue?: any
  /** Minimum number of items required */
  minItems?: number
  /** Maximum number of items allowed */
  maxItems?: number
  /** Label for the add button */
  addButtonLabel?: string
  /** Title for the field array section */
  title?: string
  /** Description for the field array section */
  description?: string
  /** Whether to show item numbers */
  showItemNumbers?: boolean
  /** Whether to show remove buttons */
  showRemoveButton?: boolean
  /** Whether to show add button */
  showAddButton?: boolean
  /** Whether to enable drag and drop reordering */
  enableReordering?: boolean
  /** Whether to animate item additions/removals */
  animate?: boolean
  /** Custom validation for the array */
  validate?: (items: any[]) => string | undefined
  /** Custom styling */
  className?: string
  /** Whether to wrap items in cards */
  wrapInCards?: boolean
  /** Card variant when wrapping in cards */
  cardVariant?: 'default' | 'outline'
  /** Custom empty state message */
  emptyMessage?: string
  /** Custom item header renderer */
  renderItemHeader?: (props: {
    item: any
    index: number
    remove: () => void
  }) => ReactNode
}

/**
 * Default animation variants for field array items
 */
const itemVariants = {
  hidden: {
    opacity: 0,
    height: 0,
    marginBottom: 0,
    overflow: 'hidden'
  },
  visible: {
    opacity: 1,
    height: 'auto',
    marginBottom: 16,
    overflow: 'visible'
  },
  exit: {
    opacity: 0,
    height: 0,
    marginBottom: 0,
    overflow: 'hidden'
  }
}

/**
 * A flexible field array component for dynamic form fields
 * 
 * @param props - Component props
 * @returns The field array component
 */
export function FieldArray<T extends Record<string, any>>({
  form,
  name,
  renderItem,
  defaultValue = {},
  minItems = 0,
  maxItems = Infinity,
  addButtonLabel = 'Add Item',
  title,
  description,
  showItemNumbers = true,
  showRemoveButton = true,
  showAddButton = true,
  enableReordering = false,
  animate = true,
  validate,
  className = '',
  wrapInCards = true,
  cardVariant = 'default',
  emptyMessage = 'No items added yet.',
  renderItemHeader
}: FieldArrayProps<T>) {
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name
  })

  // Validation
  const validationError = validate ? validate(fields) : undefined
  const canAdd = fields.length < maxItems
  const canRemove = fields.length > minItems

  // Handle add item
  const handleAdd = () => {
    if (canAdd) {
      append(defaultValue as any)
    }
  }

  // Handle remove item
  const handleRemove = (index: number) => {
    if (canRemove) {
      remove(index)
    }
  }

  // Handle move item
  const handleMove = (from: number, to: number) => {
    if (enableReordering) {
      move(from, to)
    }
  }

  // Render item wrapper
  const renderItemWrapper = (item: any, index: number) => {
    const itemContent = renderItem({
      item,
      index,
      remove: () => handleRemove(index),
      move: handleMove,
      form
    })

    const itemHeader = renderItemHeader ? renderItemHeader({
      item,
      index,
      remove: () => handleRemove(index)
    }) : null

    if (wrapInCards) {
      return (
        <Card key={item.id} className={cardVariant === 'outline' ? 'border-dashed' : ''}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {enableReordering && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="cursor-grab"
                  >
                    <GripVertical className="size-4" />
                  </Button>
                )}
                
                {showItemNumbers && (
                  <Badge variant="secondary">
                    {index + 1}
                  </Badge>
                )}
                
                {title && (
                  <CardTitle className="text-base">
                    {title} {showItemNumbers ? index + 1 : ''}
                  </CardTitle>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {itemHeader}
                {showRemoveButton && canRemove && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {itemContent}
          </CardContent>
        </Card>
      )
    }

    return (
      <div key={item.id} className="relative border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {enableReordering && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="cursor-grab"
              >
                <GripVertical className="size-4" />
              </Button>
            )}
            
            {showItemNumbers && (
              <Badge variant="secondary">
                Item {index + 1}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {itemHeader}
            {showRemoveButton && canRemove && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(index)}
                className="text-destructive hover:text-destructive"
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        </div>
        
        {itemContent}
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      {(title || description) && (
        <div className="space-y-2">
          {title && (
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{title}</h3>
              <Badge variant="outline">
                {fields.length} {fields.length === 1 ? 'item' : 'items'}
              </Badge>
            </div>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          <Separator />
        </div>
      )}

      {/* Items */}
      <div className="space-y-4">
        {fields.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>{emptyMessage}</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {fields.map((item, index) => (
              animate ? (
                <motion.div
                  key={item.id}
                  layout
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={itemVariants}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  {renderItemWrapper(item, index)}
                </motion.div>
              ) : (
                renderItemWrapper(item, index)
              )
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="text-sm text-destructive">
          {validationError}
        </div>
      )}

      {/* Add Button */}
      {showAddButton && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={handleAdd}
            disabled={!canAdd}
            className="w-full sm:w-auto"
          >
            <Plus className="size-4 mr-2" />
            {addButtonLabel}
            {maxItems !== Infinity && (
              <Badge variant="secondary" className="ml-2">
                {fields.length}/{maxItems}
              </Badge>
            )}
          </Button>
        </div>
      )}

      {/* Limits Info */}
      {(minItems > 0 || maxItems !== Infinity) && (
        <div className="text-xs text-muted-foreground text-center">
          {minItems > 0 && maxItems !== Infinity ? (
            `Required: ${minItems}-${maxItems} items`
          ) : minItems > 0 ? (
            `Minimum: ${minItems} items`
          ) : (
            `Maximum: ${maxItems} items`
          )}
        </div>
      )}
    </div>
  )
}

/**
 * A simplified field array for common use cases
 */
export function SimpleFieldArray<T extends Record<string, any>>({
  form,
  name,
  renderItem,
  defaultValue = {},
  title,
  addButtonLabel = 'Add Item',
  ...props
}: Pick<FieldArrayProps<T>, 'form' | 'name' | 'renderItem' | 'defaultValue' | 'title' | 'addButtonLabel'> & 
  Partial<FieldArrayProps<T>>) {
  return (
    <FieldArray
      form={form}
      name={name}
      renderItem={renderItem}
      defaultValue={defaultValue}
      title={title}
      addButtonLabel={addButtonLabel}
      wrapInCards={false}
      animate={false}
      enableReordering={false}
      {...props}
    />
  )
}

/**
 * Hook for field array functionality
 */
export function useFieldArrayHelpers<T extends Record<string, any>>(
  form: UseFormReturn<T>,
  name: FieldArrayPath<T>
) {
  const fieldArray = useFieldArray({
    control: form.control,
    name
  })

  return {
    ...fieldArray,
    isEmpty: fieldArray.fields.length === 0,
    count: fieldArray.fields.length,
    addWithDefaults: (defaults: any) => fieldArray.append(defaults as any),
    removeAll: () => {
      for (let i = fieldArray.fields.length - 1; i >= 0; i--) {
        fieldArray.remove(i)
      }
    },
    moveUp: (index: number) => {
      if (index > 0) {
        fieldArray.move(index, index - 1)
      }
    },
    moveDown: (index: number) => {
      if (index < fieldArray.fields.length - 1) {
        fieldArray.move(index, index + 1)
      }
    }
  }
}

/**
 * Common field array validators
 */
export const fieldArrayValidators = {
  minLength: (min: number) => (items: any[]) =>
    items.length < min ? `At least ${min} items required` : undefined,
  
  maxLength: (max: number) => (items: any[]) =>
    items.length > max ? `Maximum ${max} items allowed` : undefined,
  
  exactLength: (length: number) => (items: any[]) =>
    items.length !== length ? `Exactly ${length} items required` : undefined,
  
  notEmpty: (items: any[]) =>
    items.length === 0 ? 'At least one item is required' : undefined,
  
  uniqueBy: (key: string) => (items: any[]) => {
    const values = items.map(item => item[key]).filter(Boolean)
    const unique = new Set(values)
    return values.length !== unique.size ? `Duplicate ${key} values not allowed` : undefined
  }
}

// Export types
export type FieldArrayInstance = ReturnType<typeof useFieldArrayHelpers>
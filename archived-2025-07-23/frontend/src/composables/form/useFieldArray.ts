import { ref, computed, watch } from 'vue'
import { useField } from './useField'
import type { z } from 'zod'

/**
 * Field array item interface
 */
export interface FieldArrayItem {
  key: string
  value: any
  index: number
}

/**
 * Options for the useFieldArray composable
 */
export interface UseFieldArrayOptions {
  /** Default value for new items */
  defaultValue?: any
  /** Maximum number of items allowed */
  maxItems?: number
  /** Minimum number of items required */
  minItems?: number
  /** Whether to validate items individually */
  validateItems?: boolean
}

/**
 * Field array composable for managing dynamic arrays of form fields
 * 
 * Provides functionality to add, remove, and reorder items in a form array,
 * with proper validation and state management.
 * 
 * @param name - Field name for the array
 * @param options - Configuration options
 * @returns Field array management interface
 */
export function useFieldArray(
  name: string,
  options: UseFieldArrayOptions = {}
) {
  const {
    defaultValue = {},
    maxItems,
    minItems = 0,
    validateItems = true
  } = options

  // Main field for the array
  const field = useField(name)
  
  // Generate unique keys for items
  let keyCounter = 0
  const generateKey = () => `item_${++keyCounter}_${Date.now()}`

  // Computed array of items with keys
  const fields = computed((): FieldArrayItem[] => {
    const value = field.value.value
    if (!Array.isArray(value)) return []
    
    return value.map((item, index) => ({
      key: item._key || generateKey(),
      value: item,
      index
    }))
  })

  // Array state
  const length = computed(() => fields.value.length)
  const isEmpty = computed(() => length.value === 0)
  const isFull = computed(() => maxItems ? length.value >= maxItems : false)
  const isMinimum = computed(() => length.value <= minItems)

  /**
   * Add a new item to the array
   */
  const push = (item: any = defaultValue) => {
    if (isFull.value) {
      console.warn(`Cannot add item: maximum of ${maxItems} items allowed`)
      return
    }

    const currentValue = Array.isArray(field.value.value) ? [...field.value.value] : []
    const newItem = {
      ...item,
      _key: generateKey()
    }
    
    currentValue.push(newItem)
    field.handleChange(currentValue)
  }

  /**
   * Add item at specific index
   */
  const insert = (index: number, item: any = defaultValue) => {
    if (isFull.value) {
      console.warn(`Cannot insert item: maximum of ${maxItems} items allowed`)
      return
    }

    const currentValue = Array.isArray(field.value.value) ? [...field.value.value] : []
    const newItem = {
      ...item,
      _key: generateKey()
    }
    
    currentValue.splice(index, 0, newItem)
    field.handleChange(currentValue)
  }

  /**
   * Remove item at specific index
   */
  const remove = (index: number) => {
    if (isMinimum.value) {
      console.warn(`Cannot remove item: minimum of ${minItems} items required`)
      return
    }

    const currentValue = Array.isArray(field.value.value) ? [...field.value.value] : []
    
    if (index >= 0 && index < currentValue.length) {
      currentValue.splice(index, 1)
      field.handleChange(currentValue)
    }
  }

  /**
   * Remove the last item
   */
  const pop = () => {
    if (isMinimum.value) {
      console.warn(`Cannot remove item: minimum of ${minItems} items required`)
      return
    }

    const currentValue = Array.isArray(field.value.value) ? [...field.value.value] : []
    
    if (currentValue.length > 0) {
      currentValue.pop()
      field.handleChange(currentValue)
    }
  }

  /**
   * Move item from one index to another
   */
  const move = (fromIndex: number, toIndex: number) => {
    const currentValue = Array.isArray(field.value.value) ? [...field.value.value] : []
    
    if (fromIndex >= 0 && fromIndex < currentValue.length &&
        toIndex >= 0 && toIndex < currentValue.length) {
      const item = currentValue.splice(fromIndex, 1)[0]
      currentValue.splice(toIndex, 0, item)
      field.handleChange(currentValue)
    }
  }

  /**
   * Swap two items
   */
  const swap = (indexA: number, indexB: number) => {
    const currentValue = Array.isArray(field.value.value) ? [...field.value.value] : []
    
    if (indexA >= 0 && indexA < currentValue.length &&
        indexB >= 0 && indexB < currentValue.length) {
      const temp = currentValue[indexA]
      currentValue[indexA] = currentValue[indexB]
      currentValue[indexB] = temp
      field.handleChange(currentValue)
    }
  }

  /**
   * Replace item at specific index
   */
  const replace = (index: number, item: any) => {
    const currentValue = Array.isArray(field.value.value) ? [...field.value.value] : []
    
    if (index >= 0 && index < currentValue.length) {
      const newItem = {
        ...item,
        _key: currentValue[index]._key || generateKey()
      }
      currentValue[index] = newItem
      field.handleChange(currentValue)
    }
  }

  /**
   * Update item at specific index
   */
  const update = (index: number, updates: any) => {
    const currentValue = Array.isArray(field.value.value) ? [...field.value.value] : []
    
    if (index >= 0 && index < currentValue.length) {
      currentValue[index] = {
        ...currentValue[index],
        ...updates
      }
      field.handleChange(currentValue)
    }
  }

  /**
   * Clear all items
   */
  const clear = () => {
    field.handleChange([])
  }

  /**
   * Reset to initial value
   */
  const reset = () => {
    field.reset()
  }

  /**
   * Prepend item to the beginning
   */
  const prepend = (item: any = defaultValue) => {
    insert(0, item)
  }

  /**
   * Get field name for specific array item field
   */
  const getFieldName = (index: number, fieldName: string): string => {
    return `${name}[${index}].${fieldName}`
  }

  /**
   * Get value at specific index
   */
  const getValue = (index: number) => {
    const currentValue = Array.isArray(field.value.value) ? field.value.value : []
    return currentValue[index]
  }

  /**
   * Validate the entire array
   */
  const validate = async () => {
    return await field.validate()
  }

  return {
    // Field reference
    field,
    
    // Array data
    fields: readonly(fields),
    length: readonly(length),
    isEmpty: readonly(isEmpty),
    isFull: readonly(isFull),
    isMinimum: readonly(isMinimum),
    
    // Array operations
    push,
    pop,
    insert,
    remove,
    move,
    swap,
    replace,
    update,
    clear,
    reset,
    prepend,
    
    // Utilities
    getFieldName,
    getValue,
    validate
  }
}

/**
 * Type for the return value of useFieldArray
 */
export type FieldArrayInstance = ReturnType<typeof useFieldArray>
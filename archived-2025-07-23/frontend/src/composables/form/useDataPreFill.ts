import { ref, type Ref } from 'vue'
import type { ParsedTemplateVariable, DataSource, FieldType } from './types'

export interface PreFillContext {
  matterId?: string
  clientId?: string
  userId?: string
  [key: string]: any
}

export interface PreFillOptions {
  transformValues?: boolean
  skipErrors?: boolean
  onFieldLoad?: (fieldName: string, value: any) => void
  onFieldError?: (fieldName: string, error: Error) => void
}

export interface PreFillResult {
  data: Record<string, any>
  errors: Record<string, Error>
  loaded: string[]
  failed: string[]
}

/**
 * Mock data fetchers - replace with actual API calls
 */
const fetchMatterField = async (matterId: string, fieldPath: string): Promise<any> => {
  // Mock implementation - replace with actual API call
  await new Promise(resolve => setTimeout(resolve, 100))
  
  const mockMatterData: Record<string, any> = {
    'title': 'Smith v. Johnson',
    'caseNumber': '2024-CV-1234',
    'filingDate': '2024-01-15',
    'court': 'Superior Court of California',
    'judge': 'Hon. Jane Doe',
    'status': 'active',
    'type': 'civil',
    'description': 'Breach of contract dispute',
    'plaintiff': 'John Smith',
    'defendant': 'ABC Corporation',
    'amount': '50000.00'
  }
  
  return mockMatterData[fieldPath] ?? null
}

const fetchClientField = async (clientId: string, fieldPath: string): Promise<any> => {
  // Mock implementation - replace with actual API call
  await new Promise(resolve => setTimeout(resolve, 100))
  
  const mockClientData: Record<string, any> = {
    'name': 'John Smith',
    'email': 'john.smith@example.com',
    'phone': '555-0123',
    'address': '123 Main St, Suite 100',
    'city': 'San Francisco',
    'state': 'CA',
    'zip': '94105',
    'company': 'Smith Enterprises',
    'type': 'individual'
  }
  
  return mockClientData[fieldPath] ?? null
}

const fetchUserField = async (fieldPath: string): Promise<any> => {
  // Mock implementation - replace with actual API call
  await new Promise(resolve => setTimeout(resolve, 50))
  
  const mockUserData: Record<string, any> = {
    'name': 'Attorney Jane Doe',
    'email': 'jane.doe@lawfirm.com',
    'phone': '555-0456',
    'barNumber': 'CA123456',
    'title': 'Senior Partner',
    'signature': 'Jane Doe, Esq.'
  }
  
  return mockUserData[fieldPath] ?? null
}

const fetchFromAPI = async (endpoint: string, fieldPath?: string): Promise<any> => {
  // Mock implementation - replace with actual API call
  await new Promise(resolve => setTimeout(resolve, 150))
  
  // Mock response based on endpoint
  if (endpoint.includes('courts')) {
    return ['Superior Court', 'District Court', 'Appellate Court']
  }
  
  return null
}

/**
 * Composable for pre-filling form data from external sources
 */
export function useDataPreFill() {
  const isLoading = ref(false)
  const errors = ref<Record<string, Error>>({})

  /**
   * Transform value based on field type
   */
  const transformValue = (value: any, type: FieldType): any => {
    if (value === null || value === undefined) {
      return value
    }

    switch (type.base) {
      case 'date':
        if (typeof value === 'string') {
          // Ensure proper date format
          const date = new Date(value)
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0]
          }
        }
        if (value instanceof Date) {
          return value.toISOString().split('T')[0]
        }
        break

      case 'number':
        const num = typeof value === 'string' ? parseFloat(value) : value
        return isNaN(num) ? null : num

      case 'checkbox':
        return Boolean(value)

      case 'select':
        // Ensure value is string for select fields
        return String(value)

      default:
        // Convert to string for text-based fields
        return String(value)
    }

    return value
  }

  /**
   * Load data for a single field
   */
  const loadFieldData = async (
    variable: ParsedTemplateVariable,
    context: PreFillContext,
    options: PreFillOptions = {}
  ): Promise<any> => {
    if (!variable.dataSource) {
      return variable.defaultValue ?? null
    }

    const { type, field, endpoint, compute } = variable.dataSource

    try {
      let value: any = null

      switch (type) {
        case 'matter':
          if (context.matterId && field) {
            value = await fetchMatterField(context.matterId, field)
          }
          break

        case 'client':
          if (context.clientId && field) {
            value = await fetchClientField(context.clientId, field)
          }
          break

        case 'user':
          if (field) {
            value = await fetchUserField(field)
          }
          break

        case 'api':
          if (endpoint) {
            value = await fetchFromAPI(endpoint, field)
          }
          break

        case 'computed':
          if (compute && typeof compute === 'function') {
            value = compute(context)
          }
          break
      }

      // Transform value if needed
      if (value !== null && options.transformValues !== false) {
        value = transformValue(value, variable.type)
      }

      // Notify success
      options.onFieldLoad?.(variable.name, value)

      return value
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to load field data')
      
      if (!options.skipErrors) {
        errors.value[variable.name] = err
        options.onFieldError?.(variable.name, err)
      }
      
      return variable.defaultValue ?? null
    }
  }

  /**
   * Pre-fill form data for all variables
   */
  const prefillFormData = async (
    variables: ParsedTemplateVariable[],
    context: PreFillContext,
    options: PreFillOptions = {}
  ): Promise<PreFillResult> => {
    isLoading.value = true
    errors.value = {}

    const result: PreFillResult = {
      data: {},
      errors: {},
      loaded: [],
      failed: []
    }

    try {
      // Group variables by data source for potential optimization
      const loadPromises: Promise<void>[] = []

      for (const variable of variables) {
        const promise = loadFieldData(variable, context, options).then(value => {
          if (value !== null && value !== undefined) {
            result.data[variable.name] = value
            result.loaded.push(variable.name)
          } else if (variable.defaultValue !== undefined) {
            result.data[variable.name] = variable.defaultValue
            result.loaded.push(variable.name)
          }
        }).catch(error => {
          result.errors[variable.name] = error instanceof Error ? error : new Error('Unknown error')
          result.failed.push(variable.name)
        })

        loadPromises.push(promise)
      }

      // Wait for all fields to load
      await Promise.all(loadPromises)

      result.errors = { ...errors.value }
      return result
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Pre-fill a single field
   */
  const prefillField = async (
    variable: ParsedTemplateVariable,
    context: PreFillContext,
    options: PreFillOptions = {}
  ): Promise<any> => {
    return loadFieldData(variable, context, options)
  }

  /**
   * Clear all errors
   */
  const clearErrors = () => {
    errors.value = {}
  }

  /**
   * Create computed data source
   */
  const createComputedSource = (
    compute: (context: PreFillContext) => any
  ): DataSource => {
    return {
      type: 'computed',
      compute
    }
  }

  /**
   * Create API data source
   */
  const createAPISource = (
    endpoint: string,
    field?: string
  ): DataSource => {
    return {
      type: 'api',
      endpoint,
      field
    }
  }

  return {
    // State
    isLoading: ref(isLoading) as Ref<boolean>,
    errors: ref(errors) as Ref<Record<string, Error>>,

    // Methods
    prefillFormData,
    prefillField,
    loadFieldData,
    transformValue,
    clearErrors,
    createComputedSource,
    createAPISource
  }
}
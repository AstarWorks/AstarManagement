/**
 * Unauthorized Error Composable
 * Handles parsing and displaying unauthorized access error details
 */

import { computed } from 'vue'

interface IUnauthorizedErrorOptions {
  reason?: string
  originalPath?: string
  requiredString?: string
}

interface IErrorDetails {
  reason: string
  originalPath: string
  required: string[]
  message: string
}

export function useUnauthorizedError(options: IUnauthorizedErrorOptions) {
  const { t } = useI18n()
  
  // Parse error details from URL parameters
  const errorDetails = computed<IErrorDetails>(() => {
    const reason = options.reason || 'unknown'
    const originalPath = options.originalPath || '/'
    const required = options.requiredString ? options.requiredString.split(',') : []
    
    // Generate appropriate error message based on reason
    let message = t('error.unauthorized.generic')
    
    switch (reason) {
      case 'no_permission':
        message = t('error.unauthorized.noPermission')
        break
      case 'insufficient_role':
        message = t('error.unauthorized.insufficientRole')
        break
      case 'session_expired':
        message = t('error.unauthorized.sessionExpired')
        break
      case 'access_denied':
        message = t('error.unauthorized.accessDenied')
        break
      default:
        message = t('error.unauthorized.generic')
        break
    }
    
    return {
      reason,
      originalPath,
      required,
      message
    }
  })
  
  return {
    errorDetails
  }
}
import { defineRule, configure } from 'vee-validate'
import { required, email, min, max, confirmed } from '@vee-validate/rules'

/**
 * VeeValidate configuration plugin
 * 
 * Sets up global validation rules and error message templates
 * for consistent form validation across the application.
 */
export default defineNuxtPlugin(() => {
  // Define commonly used validation rules
  defineRule('required', required)
  defineRule('email', email)
  defineRule('min', min)
  defineRule('max', max)
  defineRule('confirmed', confirmed)

  // Custom validation rules
  defineRule('password', (value: string) => {
    if (!value) return true // Optional field, use 'required' rule for required fields
    
    // Password must be at least 8 characters with at least one letter and one number
    const hasMinLength = value.length >= 8
    const hasLetter = /[a-zA-Z]/.test(value)
    const hasNumber = /\d/.test(value)
    
    if (!hasMinLength) {
      return 'Password must be at least 8 characters long'
    }
    if (!hasLetter) {
      return 'Password must contain at least one letter'
    }
    if (!hasNumber) {
      return 'Password must contain at least one number'
    }
    
    return true
  })

  defineRule('phone', (value: string) => {
    if (!value) return true // Optional field
    
    // Basic phone number validation (adjust pattern based on requirements)
    const phonePattern = /^[\+]?[\d\s\-\(\)]{8,15}$/
    if (!phonePattern.test(value)) {
      return 'Please enter a valid phone number'
    }
    
    return true
  })

  defineRule('postal_code', (value: string) => {
    if (!value) return true // Optional field
    
    // Japanese postal code pattern (XXX-XXXX)
    const postalPattern = /^\d{3}-\d{4}$/
    if (!postalPattern.test(value)) {
      return 'Please enter a valid postal code (XXX-XXXX)'
    }
    
    return true
  })

  // Configure global settings
  configure({
    // Generate error messages
    generateMessage: (ctx) => {
      const messages: Record<string, string> = {
        required: `${ctx.field} is required`,
        email: `${ctx.field} must be a valid email address`,
        min: `${ctx.field} must be at least ${ctx.rule?.params?.[0]} characters`,
        max: `${ctx.field} must not exceed ${ctx.rule?.params?.[0]} characters`,
        confirmed: `${ctx.field} does not match`,
        password: 'Password must be at least 8 characters with a letter and number',
        phone: 'Please enter a valid phone number',
        postal_code: 'Please enter a valid postal code (XXX-XXXX)'
      }

      return messages[ctx.rule?.name as string] || `${ctx.field} is invalid`
    },

    // Validation behavior
    validateOnBlur: true,
    validateOnChange: true,
    validateOnInput: false, // Only validate on input for specific cases
    validateOnModelUpdate: true
  })
})
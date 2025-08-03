/**
 * Validation Helpers
 * Simple over Easy: Type-safe validation with i18n support
 */

import { z } from 'zod'

/**
 * Create internationalized validation messages
 * Uses the global $t function for translations
 */
export const createI18nValidation = () => {
  // Get the global i18n function with proper typing
  const { $t } = useNuxtApp()
  const t = $t as (key: string, params?: Record<string, string | number>) => string

  return {
    email: z
      .string()
      .min(1, t('auth.validation.email.required'))
      .email(t('auth.validation.email.invalid')),

    password: (minLength: number = 8) => z
      .string()
      .min(1, t('auth.validation.password.required'))
      .min(minLength, t('auth.validation.password.minLength', { min: minLength })),

    passwordWithPattern: (minLength: number = 8) => z
      .string()
      .min(1, t('auth.validation.password.required'))
      .min(minLength, t('auth.validation.password.minLength', { min: minLength }))
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        t('auth.validation.password.pattern')
      ),

    twoFactorSecret: z
      .string()
      .min(1, t('auth.validation.twoFactor.required')),

    twoFactorCode: z
      .string()
      .length(6, t('auth.validation.twoFactor.codeRequired'))
      .regex(/^\d+$/, t('auth.validation.twoFactor.codeInvalid')),

    resetToken: z
      .string()
      .min(1, t('auth.validation.passwordReset.tokenRequired')),

    confirmPassword: z
      .string()
      .min(1, t('auth.validation.passwordReset.confirmRequired')),

    rememberMe: z.boolean().optional(),
  }
}

/**
 * Create password confirmation validation
 */
export const createPasswordConfirmation = (
  passwordField: string = 'newPassword',
  confirmField: string = 'confirmPassword'
) => {
  const { $t: _$t } = useNuxtApp()
  
  return (data: Record<string, unknown>) => {
    return data[passwordField] === data[confirmField]
  }
}

/**
 * Create validation error message for password mismatch
 */
export const getPasswordMismatchMessage = () => {
  const { $t } = useNuxtApp()
  const _t = $t as (key: string) => string
  return _t('auth.validation.passwordReset.mismatch') || 'パスワードが一致しません' // Static fallback message
}
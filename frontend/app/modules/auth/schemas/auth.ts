import { z } from 'zod'
import { createI18nValidation } from '~/foundation/utils/validationHelpers'

/**
 * ログインフォームのバリデーションスキーマ
 * Login form validation schema with i18n support
 */
export const createLoginSchema = (t: (key: string, params?: Record<string, string | number>) => string) => {
  const validation = createI18nValidation(t)
  
  return z.object({
    email: validation.email,
    password: validation.password(8),
    rememberMe: validation.rememberMe,
  })
}

// Note: This export is removed to prevent top-level execution
// Use createLoginSchema() within components instead

/**
 * パスワードリセット要求フォームのバリデーションスキーマ
 * Password reset request form validation schema with i18n support
 */
export const createPasswordResetRequestSchema = (t: (key: string, params?: Record<string, string | number>) => string) => {
  const validation = createI18nValidation(t)
  
  return z.object({
    email: validation.email,
  })
}

// Note: This export is removed to prevent top-level execution

/**
 * パスワードリセットフォームのバリデーションスキーマ
 * Password reset form validation schema with i18n support
 */
export const createPasswordResetSchema = (t: (key: string, params?: Record<string, string | number>) => string) => {
  const validation = createI18nValidation(t)
  
  return z.object({
    token: validation.resetToken,
    newPassword: validation.passwordWithPattern(8),
    confirmPassword: validation.confirmPassword,
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: t('auth.validation.password.mismatch'),
    path: ['confirmPassword'],
  })
}

// Note: This export is removed to prevent top-level execution

/**
 * 2要素認証設定スキーマ
 * Two-factor authentication setup schema with i18n support
 */
export const createTwoFactorSetupSchema = (t: (key: string, params?: Record<string, string | number>) => string) => {
  const validation = createI18nValidation(t)
  
  return z.object({
    secret: validation.twoFactorSecret,
    token: validation.twoFactorCode,
  })
}

// Note: This export is removed to prevent top-level execution

/**
 * 2要素認証確認スキーマ
 * Two-factor authentication verification schema with i18n support
 */
export const createTwoFactorVerifySchema = (t: (key: string, params?: Record<string, string | number>) => string) => {
  const validation = createI18nValidation(t)
  
  return z.object({
    token: validation.twoFactorCode,
  })
}

// Note: This export is removed to prevent top-level execution

// TypeScript型定義のエクスポート
// Note: Types are now inferred from the schema creation functions
export type LoginForm = z.infer<ReturnType<typeof createLoginSchema>>
export type PasswordResetRequestForm = z.infer<ReturnType<typeof createPasswordResetRequestSchema>>
export type PasswordResetForm = z.infer<ReturnType<typeof createPasswordResetSchema>>
export type TwoFactorSetupForm = z.infer<ReturnType<typeof createTwoFactorSetupSchema>>
export type TwoFactorVerifyForm = z.infer<ReturnType<typeof createTwoFactorVerifySchema>>
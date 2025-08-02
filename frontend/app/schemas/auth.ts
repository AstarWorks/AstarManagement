import { z } from 'zod'
import { createI18nValidation } from '~/utils/validationHelpers'

/**
 * ログインフォームのバリデーションスキーマ
 * Login form validation schema with i18n support
 */
export const createLoginSchema = () => {
  const validation = createI18nValidation()
  
  return z.object({
    email: validation.email,
    password: validation.password(8),
    rememberMe: validation.rememberMe,
  })
}

// Backward compatibility export
export const loginSchema = createLoginSchema()

/**
 * パスワードリセット要求フォームのバリデーションスキーマ
 * Password reset request form validation schema with i18n support
 */
export const createPasswordResetRequestSchema = () => {
  const validation = createI18nValidation()
  
  return z.object({
    email: validation.email,
  })
}

export const passwordResetRequestSchema = createPasswordResetRequestSchema()

/**
 * パスワードリセットフォームのバリデーションスキーマ
 * Password reset form validation schema with i18n support
 */
export const createPasswordResetSchema = () => {
  const validation = createI18nValidation()
  
  return z.object({
    token: validation.resetToken,
    newPassword: validation.passwordWithPattern(8),
    confirmPassword: validation.confirmPassword,
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'パスワードが一致しません', // Fallback message
    path: ['confirmPassword'],
  })
}

export const passwordResetSchema = createPasswordResetSchema()

/**
 * 2要素認証設定スキーマ
 * Two-factor authentication setup schema with i18n support
 */
export const createTwoFactorSetupSchema = () => {
  const validation = createI18nValidation()
  
  return z.object({
    secret: validation.twoFactorSecret,
    token: validation.twoFactorCode,
  })
}

export const twoFactorSetupSchema = createTwoFactorSetupSchema()

/**
 * 2要素認証確認スキーマ
 * Two-factor authentication verification schema with i18n support
 */
export const createTwoFactorVerifySchema = () => {
  const validation = createI18nValidation()
  
  return z.object({
    token: validation.twoFactorCode,
  })
}

export const twoFactorVerifySchema = createTwoFactorVerifySchema()

// TypeScript型定義のエクスポート
export type LoginForm = z.infer<typeof loginSchema>
export type PasswordResetRequestForm = z.infer<typeof passwordResetRequestSchema>
export type PasswordResetForm = z.infer<typeof passwordResetSchema>
export type TwoFactorSetupForm = z.infer<typeof twoFactorSetupSchema>
export type TwoFactorVerifyForm = z.infer<typeof twoFactorVerifySchema>
/**
 * 認証バリデーションスキーマ
 * 業界標準の入力検証
 */

import { z } from 'zod'

/**
 * ログインフォームのバリデーションスキーマ
 */
export const createLoginSchema = (t: (key: string) => string) => {
  return z.object({
    email: z
      .string()
      .min(1, t('foundation.form.validation.required'))
      .email(t('foundation.form.validation.email')),
    password: z
      .string()
      .min(1, t('foundation.form.validation.required'))
      .min(8, t('foundation.form.validation.min').replace('{min}', '8')),
    rememberMe: z.boolean().optional()
  })
}

/**
 * パスワードリセットフォームのバリデーションスキーマ
 */
export const createPasswordResetSchema = (t: (key: string) => string) => {
  return z.object({
    email: z
      .string()
      .min(1, t('foundation.form.validation.required'))
      .email(t('foundation.form.validation.email'))
  })
}

/**
 * 新しいパスワード設定フォームのバリデーションスキーマ
 */
export const createNewPasswordSchema = (t: (key: string) => string) => {
  return z.object({
    password: z
      .string()
      .min(8, t('foundation.form.validation.min').replace('{min}', '8'))
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        t('foundation.form.validation.pattern')
      ),
    confirmPassword: z
      .string()
      .min(1, t('foundation.form.validation.required'))
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('foundation.form.validation.confirmed'),
    path: ['confirmPassword']
  })
}
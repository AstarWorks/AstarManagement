import { z } from 'zod'

/**
 * ログインフォームのバリデーションスキーマ
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('有効なメールアドレスを入力してください'),
  password: z
    .string()
    .min(1, 'パスワードを入力してください')
    .min(8, 'パスワードは8文字以上で入力してください'),
  rememberMe: z.boolean().optional(),
})

/**
 * パスワードリセット要求フォームのバリデーションスキーマ
 */
export const passwordResetRequestSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('有効なメールアドレスを入力してください'),
})

/**
 * パスワードリセットフォームのバリデーションスキーマ
 */
export const passwordResetSchema = z.object({
  token: z.string().min(1, 'リセットトークンが必要です'),
  newPassword: z
    .string()
    .min(8, 'パスワードは8文字以上で入力してください')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'パスワードは英小文字、英大文字、数字を含む必要があります'
    ),
  confirmPassword: z.string().min(1, 'パスワード確認を入力してください'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword'],
})

/**
 * 2要素認証設定スキーマ
 */
export const twoFactorSetupSchema = z.object({
  secret: z.string().min(1, '2要素認証シークレットが必要です'),
  token: z
    .string()
    .length(6, '認証コードは6桁で入力してください')
    .regex(/^\d+$/, '認証コードは数字のみで入力してください'),
})

/**
 * 2要素認証確認スキーマ
 */
export const twoFactorVerifySchema = z.object({
  token: z
    .string()
    .length(6, '認証コードは6桁で入力してください')
    .regex(/^\d+$/, '認証コードは数字のみで入力してください'),
})

// TypeScript型定義のエクスポート
export type LoginForm = z.infer<typeof loginSchema>
export type PasswordResetRequestForm = z.infer<typeof passwordResetRequestSchema>
export type PasswordResetForm = z.infer<typeof passwordResetSchema>
export type TwoFactorSetupForm = z.infer<typeof twoFactorSetupSchema>
export type TwoFactorVerifyForm = z.infer<typeof twoFactorVerifySchema>
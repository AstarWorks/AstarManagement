/**
 * Validation Helpers
 * 共通のバリデーション関数
 */

/**
 * 必須フィールドのバリデーションメッセージ
 */
export const requiredMessage = (field: string): string => {
  return `${field}は必須です`
}

/**
 * 最小文字数のバリデーションメッセージ
 */
export const minLengthMessage = (field: string, min: number): string => {
  return `${field}は${min}文字以上入力してください`
}

/**
 * 最大文字数のバリデーションメッセージ
 */
export const maxLengthMessage = (field: string, max: number): string => {
  return `${field}は${max}文字以内で入力してください`
}

/**
 * メールアドレスのバリデーションメッセージ
 */
export const emailMessage = (): string => {
  return '有効なメールアドレスを入力してください'
}

/**
 * パスワードのバリデーションメッセージ
 */
export const passwordMessage = (): string => {
  return 'パスワードは8文字以上で、大文字・小文字・数字を含めてください'
}

/**
 * 日付のバリデーションメッセージ
 */
export const dateMessage = (): string => {
  return '有効な日付を入力してください'
}

/**
 * 数値のバリデーションメッセージ
 */
export const numberMessage = (field: string): string => {
  return `${field}は数値で入力してください`
}

/**
 * 選択必須のバリデーションメッセージ
 */
export const selectMessage = (field: string): string => {
  return `${field}を選択してください`
}

/**
 * i18n対応のバリデーション関数作成ヘルパー
 * Creates i18n-enabled validation functions
 */
export const createI18nValidation = (t: (key: string, params?: Record<string, string | number>) => string) => {
  return {
    required: (field: string) => t('foundation.form.validation.required', { field }),
    minLength: (field: string, min: number) => t('foundation.form.validation.minLength', { field, min }),
    maxLength: (field: string, max: number) => t('foundation.form.validation.maxLength', { field, max }),
    email: () => t('foundation.form.validation.email'),
    password: () => t('foundation.form.validation.password'),
    date: () => t('foundation.form.validation.date'),
    number: (field: string) => t('foundation.form.validation.number', { field }),
    select: (field: string) => t('foundation.form.validation.select', { field })
  }
}
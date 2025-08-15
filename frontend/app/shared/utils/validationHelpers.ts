/**
 * Validation Helpers
 * Simple over Easy: Type-safe validation with i18n support
 */

import {z} from 'zod'

/**
 * Create internationalized validation messages
 * Uses the provided translation function
 */
export const createI18nValidation = (t: (key: string, params?: Record<string, string | number>) => string) => {
    return {
        email: z
            .string()
            .min(1, t('auth.validation.email.required'))
            .email(t('auth.validation.email.invalid')),

        password: (minLength: number = 8) => z
            .string()
            .min(1, t('auth.validation.password.required'))
            .min(minLength, t('auth.validation.password.minLength', {min: minLength})),

        passwordWithPattern: (minLength: number = 8) => z
            .string()
            .min(1, t('auth.validation.password.required'))
            .min(minLength, t('auth.validation.password.minLength', {min: minLength}))
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
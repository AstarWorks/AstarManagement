/**
 * Security middleware - Optional additional security checks
 * Handles 2FA and other security requirements
 * Industry-standard implementation without business logic
 */

import type { SecuritySettings } from '@modules/auth/types/security'

export default defineNuxtRouteMiddleware((to, _from) => {
    // Get security settings from a dedicated security composable
    // This should be implemented separately from business profile
    const securitySettings = useState<SecuritySettings | null>('security-settings')
    const twoFactorVerified = useState<boolean>('2fa-verified', () => false)

    // Skip on server-side (SPA mode)
    if (import.meta.server) {
        return
    }

    // Check if 2FA is required
    if (securitySettings.value?.twoFactorEnabled && !twoFactorVerified.value) {
        // Skip if already on 2FA page
        if (to.path === '/auth/two-factor') {
            return
        }

        // Redirect to 2FA verification
        return navigateTo({
            path: '/auth/two-factor',
            query: {
                redirect: to.fullPath
            }
        })
    }

    // Additional security checks can be added here
    // e.g., IP whitelist, device verification, session expiry, etc.
})
/**
 * Type definitions for @sidebase/nuxt-auth
 */

declare module '#auth/client' {
  export { useAuth } from '@sidebase/nuxt-auth/client'
}

declare module '#auth' {
  export { NuxtAuthHandler, getServerSession } from '@sidebase/nuxt-auth/server'
  
  /**
   * Session data structure for local provider
   * Keep it minimal and industry-standard
   */
  export interface SessionData {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
    } | null
    expires?: string
    // JWT token fields for authentication
    accessToken?: string
    token?: string
  }
}

// Extend the Session type from next-auth for authjs provider
declare module 'next-auth' {
  interface Session {
    accessToken?: string
    user: {
      id: string
      email?: string | null
      name?: string | null
      image?: string | null
      role?: string
      roles?: Array<{
        id: string
        name: string
        displayName: string
        permissions: readonly string[]
      }>
      permissions?: readonly string[]
      isActive?: boolean
    }
  }
}
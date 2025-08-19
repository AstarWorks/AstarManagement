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
  }
}
/**
 * Business-specific profile types
 * Separated from authentication to maintain industry standards
 * Generic implementation without domain-specific fields
 */

/**
 * Role information for business logic
 */
export interface IBusinessRole {
  id: string
  name: string
  displayName: string
  description?: string
  permissions: readonly string[]
}

/**
 * Generic business user profile
 * Industry-standard fields only, no domain-specific information
 */
export interface IBusinessProfile {
  // Basic info
  id: string
  email: string
  name?: string | null
  displayName?: string
  avatar?: string
  
  // Organization info (generic)
  organizationId?: string
  organizationName?: string
  team?: string
  position?: string
  
  // Access control (generic)
  roles: readonly IBusinessRole[]
  permissions: readonly string[]
  
  // Contact info (generic)
  phone?: string
  
  // Metadata (generic)
  isActive: boolean
  lastLoginAt?: Date
  createdAt?: Date
  updatedAt?: Date
  
  // User preferences (generic)
  preferences?: {
    language: string
    timezone: string
    theme: string
    notifications: {
      email: boolean
      browser: boolean
      mobile: boolean
    }
  }
}

/**
 * Simplified profile for UI components
 */
export interface IUserDisplayProfile {
  id: string
  name?: string | null
  email: string
  avatar?: string
  role?: string
}
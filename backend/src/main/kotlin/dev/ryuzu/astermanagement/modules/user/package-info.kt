/**
 * User Module
 * 
 * This module handles user-related operations and serves as the central API
 * for user management across the application. It follows Spring Modulith
 * architecture patterns to provide clean module boundaries.
 * 
 * ## Module Structure
 * 
 * - `api/` - Public interfaces and contracts
 * - `infrastructure/` - Service implementations and controllers
 * 
 * Note: The domain entities remain in the root domain package to maintain
 * backward compatibility during the modular architecture migration.
 * 
 * ## Dependencies
 * 
 * This module depends on:
 * - `domain.user` package for entity definitions
 * 
 * ## Dependents
 * 
 * This module is used by:
 * - `auth` package for authentication services
 * - Other modules requiring user information
 */
package dev.ryuzu.astermanagement.modules.user
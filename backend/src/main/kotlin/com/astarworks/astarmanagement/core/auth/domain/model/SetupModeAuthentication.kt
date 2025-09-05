package com.astarworks.astarmanagement.core.auth.domain.model

import org.springframework.security.authentication.AbstractAuthenticationToken
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.oauth2.jwt.Jwt

/**
 * Authentication token for setup mode.
 * 
 * This authentication is used for first-time users who don't have an org_id in their JWT yet.
 * It provides limited authorities to only allow setup-related operations.
 * 
 * After completing the setup process (creating default tenant), users must re-authenticate
 * with the proper org_id to access the full system functionality.
 * 
 * @property jwt The original JWT token from Auth0
 * @property auth0Sub The Auth0 subject identifier
 * @property email The user's email address (optional)
 * @property authorities Limited authorities for setup operations only
 */
class SetupModeAuthentication(
    val jwt: Jwt,
    val auth0Sub: String,
    val email: String?,
    authorities: Collection<GrantedAuthority>
) : AbstractAuthenticationToken(authorities) {
    
    init {
        // Mark as authenticated since we have a valid JWT
        isAuthenticated = true
    }
    
    /**
     * Returns the JWT token as credentials.
     */
    override fun getCredentials(): Any = jwt
    
    /**
     * Returns the setup mode context as principal.
     */
    override fun getPrincipal(): Any = SetupModeContext(auth0Sub, email)
    
    /**
     * Returns the Auth0 subject as the name.
     */
    override fun getName(): String = auth0Sub
    
    /**
     * Returns the JWT token as details for traceability.
     */
    override fun getDetails(): Any = jwt
}

/**
 * Context information for setup mode.
 * 
 * Contains minimal user information needed for the setup process.
 * 
 * @property auth0Sub The Auth0 subject identifier
 * @property email The user's email address (optional)
 */
data class SetupModeContext(
    val auth0Sub: String,
    val email: String?
)
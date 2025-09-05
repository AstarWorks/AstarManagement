package com.astarworks.astarmanagement.fixture

import com.nimbusds.jose.JWSAlgorithm
import com.nimbusds.jose.JWSHeader
import com.nimbusds.jose.crypto.RSASSASigner
import com.nimbusds.jwt.JWTClaimsSet
import com.nimbusds.jwt.SignedJWT
import java.time.Instant
import java.util.*

/**
 * Simple JWT fixture for testing authentication.
 * Provides minimal JWT generation for test purposes.
 * Uses RS256 (RSA) algorithm for compatibility with TestSecurityConfig.
 */
object AuthFixture {
    
    /**
     * Create a valid JWT token for testing using JwtTestFixture
     */
    fun validJwt(
        userId: String = "11111111-1111-1111-1111-111111111111",
        tenantId: String = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        email: String = "test@example.com",
        roles: List<String> = listOf("USER"),
        expiresInMinutes: Long = 60
    ): String {
        val now = Instant.now()
        val expiry = now.plusSeconds(expiresInMinutes * 60)
        
        return JwtTestFixture.createValidJwt(
            subject = "auth0|test_$userId",
            orgId = "org_tenant_${tenantId.substring(0, 1)}_test",
            email = email,
            issuer = "https://test-auth.com/",
            audience = "test-api",
            expiresAt = expiry,
            issuedAt = now,
            additionalClaims = mapOf(
                "email_verified" to true,
                "https://your-app.com/user_id" to userId,
                "https://your-app.com/tenant_id" to tenantId,
                "https://your-app.com/roles" to roles
            )
        )
    }
    
    /**
     * Create an expired JWT token
     */
    fun expiredJwt(
        userId: String = "11111111-1111-1111-1111-111111111111"
    ): String {
        return validJwt(userId = userId, expiresInMinutes = -60) // Expired 60 minutes ago
    }
    
    /**
     * Create a JWT without tenant information
     */
    fun jwtWithoutTenant(
        userId: String = "11111111-1111-1111-1111-111111111111"
    ): String {
        return JwtTestFixture.createJwtWithoutOrgId(
            subject = "auth0|test_$userId",
            email = "test@example.com"
        )
    }
    
    // Predefined users for consistency
    object Users {
        const val ADMIN_ID = "11111111-1111-1111-1111-111111111111"
        const val USER_ID = "22222222-2222-2222-2222-222222222222"
        const val VIEWER_ID = "33333333-3333-3333-3333-333333333333"
    }
    
    // Predefined tenants
    object Tenants {
        const val TENANT_A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
        const val TENANT_B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
    }
    
    // Quick helper functions
    fun adminJwt(tenantId: String = Tenants.TENANT_A) = validJwt(
        userId = Users.ADMIN_ID,
        tenantId = tenantId,
        email = "tenant1-admin@test.com",
        roles = listOf("ADMIN")
    )
    
    fun userJwt(tenantId: String = Tenants.TENANT_A) = validJwt(
        userId = Users.USER_ID,
        tenantId = tenantId,
        email = "tenant1-user@test.com",
        roles = listOf("USER")
    )
    
    fun viewerJwt(tenantId: String = Tenants.TENANT_A) = validJwt(
        userId = Users.VIEWER_ID,
        tenantId = tenantId,
        email = "tenant1-viewer@test.com",
        roles = listOf("VIEWER")
    )
}
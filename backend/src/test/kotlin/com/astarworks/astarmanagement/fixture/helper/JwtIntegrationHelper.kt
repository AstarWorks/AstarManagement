package com.astarworks.astarmanagement.fixture.helper

import com.astarworks.astarmanagement.fixture.AuthFixture
import com.astarworks.astarmanagement.fixture.setup.IntegrationTestSetup
import org.springframework.stereotype.Component

/**
 * JWT helper for integration tests.
 * Builds upon AuthFixture.kt to provide integration-test specific JWT generation.
 */
@Component
class JwtIntegrationHelper {

    /**
     * Create JWT for Tenant A admin user
     */
    fun tenantAAdminJwt(): String {
        return AuthFixture.adminJwt(AuthFixture.Tenants.TENANT_A)
    }

    /**
     * Create JWT for Tenant A regular user  
     */
    fun tenantAUserJwt(): String {
        return AuthFixture.userJwt(AuthFixture.Tenants.TENANT_A)
    }

    /**
     * Create JWT for Tenant A viewer user
     */
    fun tenantAViewerJwt(): String {
        return AuthFixture.viewerJwt(AuthFixture.Tenants.TENANT_A)
    }

    /**
     * Create JWT for Tenant B admin user
     */
    fun tenantBAdminJwt(): String {
        return AuthFixture.adminJwt(AuthFixture.Tenants.TENANT_B)
    }

    /**
     * Create JWT for multi-tenant scenario: admin user accessing Tenant B
     */
    fun crossTenantAdminJwt(): String {
        return AuthFixture.adminJwt(AuthFixture.Tenants.TENANT_B)
    }

    /**
     * Create expired JWT for testing authentication failure
     */
    fun expiredJwt(): String {
        return AuthFixture.expiredJwt(AuthFixture.Users.ADMIN_ID)
    }

    /**
     * Create JWT without tenant context for testing tenant validation
     */
    fun jwtWithoutTenant(): String {
        return AuthFixture.jwtWithoutTenant(AuthFixture.Users.ADMIN_ID)
    }

    /**
     * Create custom JWT with specific parameters for edge case testing
     */
    fun customJwt(
        userId: String,
        tenantId: String,
        email: String,
        roles: List<String> = listOf("USER"),
        expiresInMinutes: Long = 60
    ): String {
        return AuthFixture.validJwt(
            userId = userId,
            tenantId = tenantId,
            email = email,
            roles = roles,
            expiresInMinutes = expiresInMinutes
        )
    }

    /**
     * Helper object with predefined JWTs for common test scenarios
     */
    object Predefined {
        /**
         * Admin user JWT for Tenant A (most common test case)
         */
        fun defaultAdminJwt(helper: JwtIntegrationHelper) = helper.tenantAAdminJwt()

        /**
         * Regular user JWT for Tenant A
         */
        fun defaultUserJwt(helper: JwtIntegrationHelper) = helper.tenantAUserJwt()

        /**
         * Viewer user JWT for Tenant A (minimal permissions)
         */
        fun defaultViewerJwt(helper: JwtIntegrationHelper) = helper.tenantAViewerJwt()
    }
}
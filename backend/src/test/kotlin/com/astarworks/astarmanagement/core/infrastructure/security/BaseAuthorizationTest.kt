package com.astarworks.astarmanagement.core.infrastructure.security

import com.astarworks.astarmanagement.base.IntegrationTest
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles

/**
 * Base class for all authorization integration tests.
 * 
 * Provides common configuration and setup for role-based authorization testing
 * using standard Spring Security Test patterns.
 * 
 * Features:
 * - Standard @WithMockUser and JWT RequestPostProcessor patterns
 * - Focus on authorization logic testing (not JWT generation)
 * - Fast execution without HTTP connections or external dependencies
 * - Common test configuration for all authorization test classes
 */
@SpringBootTest
@ActiveProfiles("test")
abstract class BaseAuthorizationTest : IntegrationTest() {
    
    /**
     * Common endpoint paths used across authorization tests.
     */
    companion object {
        const val PUBLIC_ENDPOINT = "/api/v1/test/public"
        const val AUTHENTICATED_ENDPOINT = "/api/v1/test/authenticated"
        const val ADMIN_ONLY_ENDPOINT = "/api/v1/test/admin-only"
        const val USER_ONLY_ENDPOINT = "/api/v1/test/user-only"
        const val VIEWER_ONLY_ENDPOINT = "/api/v1/test/viewer-only"
        const val ADMIN_OR_USER_ENDPOINT = "/api/v1/test/admin-or-user"
        
        // Expected response messages
        const val PUBLIC_ACCESS_MESSAGE = "Public access - no authentication required"
        const val AUTHENTICATED_ACCESS_MESSAGE = "Authenticated access - any valid token"
        const val ADMIN_ACCESS_MESSAGE = "Admin access granted"
        const val USER_ACCESS_MESSAGE = "User access granted"
        const val VIEWER_ACCESS_MESSAGE = "Viewer access granted"
        const val ADMIN_OR_USER_ACCESS_MESSAGE = "Admin or User access granted"
    }
}
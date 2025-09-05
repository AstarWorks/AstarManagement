package com.astarworks.astarmanagement.fixture.helper

import org.springframework.http.MediaType
import org.springframework.stereotype.Component
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.ResultActions
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*

/**
 * MockMvc helper for integration tests.
 * Provides convenient methods for common HTTP operations with authentication.
 */
@Component
class MockMvcHelper(
    private val mockMvc: MockMvc
) {

    /**
     * Perform authenticated GET request
     */
    fun authenticatedGet(url: String, jwt: String): ResultActions {
        return mockMvc.perform(
            get(url)
                .header("Authorization", "Bearer $jwt")
                .contentType(MediaType.APPLICATION_JSON)
        )
    }

    /**
     * Perform authenticated POST request with JSON body
     */
    fun authenticatedPost(url: String, jwt: String, jsonBody: String? = null): ResultActions {
        val request = post(url)
            .header("Authorization", "Bearer $jwt")
            .contentType(MediaType.APPLICATION_JSON)
            
        jsonBody?.let { request.content(it) }
        
        return mockMvc.perform(request)
    }

    /**
     * Perform authenticated PUT request with JSON body
     */
    fun authenticatedPut(url: String, jwt: String, jsonBody: String? = null): ResultActions {
        val request = put(url)
            .header("Authorization", "Bearer $jwt")
            .contentType(MediaType.APPLICATION_JSON)
            
        jsonBody?.let { request.content(it) }
        
        return mockMvc.perform(request)
    }

    /**
     * Perform authenticated DELETE request
     */
    fun authenticatedDelete(url: String, jwt: String): ResultActions {
        return mockMvc.perform(
            delete(url)
                .header("Authorization", "Bearer $jwt")
                .contentType(MediaType.APPLICATION_JSON)
        )
    }

    /**
     * Perform unauthenticated GET request (for testing auth failures)
     */
    fun unauthenticatedGet(url: String): ResultActions {
        return mockMvc.perform(
            get(url)
                .contentType(MediaType.APPLICATION_JSON)
        )
    }

    /**
     * Perform unauthenticated POST request (for testing auth failures)
     */
    fun unauthenticatedPost(url: String, jsonBody: String? = null): ResultActions {
        val request = post(url)
            .contentType(MediaType.APPLICATION_JSON)
            
        jsonBody?.let { request.content(it) }
        
        return mockMvc.perform(request)
    }

    /**
     * Perform request with invalid JWT
     */
    fun invalidJwtGet(url: String): ResultActions {
        return mockMvc.perform(
            get(url)
                .header("Authorization", "Bearer invalid.jwt.token")
                .contentType(MediaType.APPLICATION_JSON)
        )
    }

    /**
     * Common assertions for successful responses
     */
    object Assertions {
        /**
         * Assert successful response with user data
         */
        fun assertUserResponse(result: ResultActions, expectedUserId: String, expectedEmail: String): ResultActions {
            return result
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.auth0Sub").value("auth0|test_$expectedUserId"))
                .andExpect(jsonPath("$.email").value(expectedEmail))
        }

        /**
         * Assert unauthorized response (401 status)
         */
        fun assertUnauthorized(result: ResultActions): ResultActions {
            return result
                .andExpect(status().isUnauthorized)
                // Note: JSON response format may vary depending on the authentication failure type
        }
        
        /**
         * Assert unauthorized response with JSON check
         */
        fun assertUnauthorizedWithJson(result: ResultActions): ResultActions {
            return result
                .andExpect(status().isUnauthorized)
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.message").exists())
        }

        /**
         * Assert forbidden response (403 status)
         */
        fun assertForbidden(result: ResultActions): ResultActions {
            return result
                .andExpect(status().isForbidden)
        }

        /**
         * Assert admin access granted response
         */
        fun assertAdminAccess(result: ResultActions): ResultActions {
            return result
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.message").value("Admin access granted"))
        }

        /**
         * Assert tenant context in response
         */
        fun assertTenantContext(result: ResultActions, expectedTenantId: String): ResultActions {
            return result
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.tenantId").value(expectedTenantId))
        }

        /**
         * Assert roles in authentication response
         */
        fun assertRoles(result: ResultActions, expectedRoles: List<String>): ResultActions {
            var assertion = result
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.roles").isArray)
            
            expectedRoles.forEach { role ->
                assertion = assertion.andExpect(jsonPath("$.roles[?(@ == '$role')]").exists())
            }
            
            return assertion
        }
    }

    /**
     * Common test scenarios
     */
    object Scenarios {
        /**
         * Test basic authentication flow
         */
        fun testBasicAuthentication(
            helper: MockMvcHelper,
            jwt: String,
            expectedUserId: String,
            expectedEmail: String,
            expectedTenantId: String
        ) {
            helper.authenticatedGet("/api/v1/auth/me", jwt)
                .let { result ->
                    Assertions.assertUserResponse(result, expectedUserId, expectedEmail)
                    Assertions.assertTenantContext(result, expectedTenantId)
                }
        }

        /**
         * Test authentication failure scenarios
         */
        fun testAuthenticationFailure(helper: MockMvcHelper) {
            // Test without JWT - Spring Security returns 403 for missing authentication
            Assertions.assertForbidden(
                helper.unauthenticatedGet("/api/v1/auth/me")
            )

            // Test with invalid JWT - Returns 401 for invalid token
            Assertions.assertUnauthorized(
                helper.invalidJwtGet("/api/v1/auth/me")
            )
        }

        /**
         * Test role-based access control
         */
        fun testRoleBasedAccess(
            helper: MockMvcHelper,
            adminJwt: String,
            userJwt: String,
            protectedEndpoint: String = "/api/v1/auth/test/admin-only"
        ) {
            // Admin should have access
            Assertions.assertAdminAccess(
                helper.authenticatedGet(protectedEndpoint, adminJwt)
            )

            // Regular user should be forbidden
            Assertions.assertForbidden(
                helper.authenticatedGet(protectedEndpoint, userJwt)
            )
        }
    }
}
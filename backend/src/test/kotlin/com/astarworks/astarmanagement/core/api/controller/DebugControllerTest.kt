package com.astarworks.astarmanagement.core.api.controller

import com.astarworks.astarmanagement.base.IntegrationTest
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.DisplayName
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*

/**
 * Integration tests for DebugController endpoints.
 * Tests debug endpoints availability and functionality in test environment.
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = ["auth.mock.enabled=true"])
class DebugControllerTest : IntegrationTest() {
    
    @Test
    @DisplayName("GET /api/v1/debug/config - debug config accessible in test environment")
    fun `should return debug config when mock auth enabled`() {
        mockMvc.perform(get("/api/v1/debug/config"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.activeProfiles").isArray)
            .andExpect(jsonPath("$.jwtConfig.expectedAudience").exists())
            .andExpect(jsonPath("$.mockAuth.enabled").value(true))
            .andExpect(jsonPath("$.jwtConfig.auth0Domain").exists())
    }
    
    @Test
    @DisplayName("GET /api/v1/debug/health - debug health check")
    fun `should return health status for debug endpoints`() {
        mockMvc.perform(get("/api/v1/debug/health"))
            .andExpect(status().isOk)
            .andExpect(content().string("Debug endpoints are active"))
    }
    
    @Test
    @DisplayName("Debug endpoints contain expected JWT configuration")
    fun `should return expected JWT configuration values`() {
        mockMvc.perform(get("/api/v1/debug/config"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.expectedTokenClaims.rolesClaimKey").value("https://your-app.com/roles"))
            .andExpect(jsonPath("$.mockAuth.tokenEndpoint").exists())
            .andExpect(jsonPath("$.mockAuth.jwksEndpoint").exists())
    }
}
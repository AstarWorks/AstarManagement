package com.astarworks.astarmanagement.core.api.controller

import com.astarworks.astarmanagement.base.IntegrationTest
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.DisplayName
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*

/**
 * Integration tests for HealthController endpoints.
 * Tests public health endpoints accessibility without authentication.
 */
@SpringBootTest
@ActiveProfiles("test")
class HealthControllerTest : IntegrationTest() {
    
    @Test
    @DisplayName("GET /api/v1/health - public health endpoint")
    fun `should return health status without authentication`() {
        mockMvc.perform(get("/api/v1/health"))
            .andExpect(status().isOk)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.status").value("UP"))
            .andExpect(jsonPath("$.timestamp").exists())
            .andExpect(jsonPath("$.version").exists())
            .andExpect(jsonPath("$.environment").exists())
    }
    
    @Test
    @DisplayName("GET /api/v1/health/ping - ping endpoint")
    fun `should return pong for ping request`() {
        mockMvc.perform(get("/api/v1/health/ping"))
            .andExpect(status().isOk)
            .andExpect(content().contentType(MediaType.parseMediaType("text/plain;charset=UTF-8")))
            .andExpect(content().string("pong"))
    }
    
    @Test
    @DisplayName("Health endpoints are publicly accessible")
    fun `should allow public access to all health endpoints`() {
        val healthEndpoints = listOf(
            "/api/v1/health",
            "/api/v1/health/ping"
        )
        
        healthEndpoints.forEach { endpoint ->
            mockMvc.perform(get(endpoint))
                .andExpect(status().isOk)
        }
    }
}
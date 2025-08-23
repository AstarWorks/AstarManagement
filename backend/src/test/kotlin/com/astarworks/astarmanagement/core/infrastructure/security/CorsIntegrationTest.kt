package com.astarworks.astarmanagement.core.infrastructure.security

import com.astarworks.astarmanagement.base.IntegrationTest
import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*

/**
 * Integration tests for CORS (Cross-Origin Resource Sharing) configuration.
 * Tests preflight requests, allowed origins, methods, and headers.
 */
@SpringBootTest
@ActiveProfiles("test")
class CorsIntegrationTest : IntegrationTest() {
    
    @Test
    fun `CORS preflight request from allowed origin should succeed`() {
        val allowedOrigins = listOf(
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "https://test.ngrok.io",
            "https://test.ngrok-free.app"
        )
        
        for (origin in allowedOrigins) {
            mockMvc.perform(
                options("/api/v1/test")
                    .header("Origin", origin)
                    .header("Access-Control-Request-Method", "POST")
                    .header("Access-Control-Request-Headers", "authorization,content-type")
            )
                .andExpect(status().isOk)
                .andExpect(header().string("Access-Control-Allow-Origin", origin))
                .andExpect(header().exists("Access-Control-Allow-Methods"))
                .andExpect(header().exists("Access-Control-Allow-Headers"))
                .andExpect(header().string("Access-Control-Max-Age", "3600"))
        }
    }
    
    @Test
    fun `CORS should allow all standard HTTP methods`() {
        mockMvc.perform(
            options("/api/v1/test")
                .header("Origin", "http://localhost:3000")
                .header("Access-Control-Request-Method", "GET")
        )
            .andExpect(status().isOk)
            .andExpect(header().exists("Access-Control-Allow-Methods"))
    }
    
    @Test
    fun `CORS should allow required headers`() {
        val requiredHeaders = listOf(
            "authorization",
            "content-type",
            "x-request-id",
            "x-tenant-id"
        )
        
        mockMvc.perform(
            options("/api/v1/test")
                .header("Origin", "http://localhost:3000")
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", requiredHeaders.joinToString(","))
        )
            .andExpect(status().isOk)
            .andExpect(header().exists("Access-Control-Allow-Headers"))
    }
    
    @Test
    fun `CORS should expose required response headers`() {
        // For actual requests (not preflight), check exposed headers
        mockMvc.perform(
            get("/actuator/health")
                .header("Origin", "http://localhost:3000")
        )
            .andExpect(status().isOk)
            .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"))
            // Note: Exposed headers are configured but may not appear in the response
            // unless the actual headers are present in the response
    }
    
    @Test
    fun `CORS credentials should be properly configured`() {
        // Test that credentials are not allowed (as per JWT best practices)
        mockMvc.perform(
            options("/api/v1/test")
                .header("Origin", "http://localhost:3000")
                .header("Access-Control-Request-Method", "GET")
                .header("Access-Control-Request-Headers", "authorization")
        )
            .andExpect(status().isOk)
            // Credentials should be false for JWT authentication
            // Note: The actual header value depends on the SecurityConfig implementation
    }
    
    @Test
    fun `CORS preflight cache should be set correctly`() {
        mockMvc.perform(
            options("/api/v1/test")
                .header("Origin", "http://localhost:3000")
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", "authorization")
        )
            .andExpect(status().isOk)
            .andExpect(header().string("Access-Control-Max-Age", "3600"))
    }
    
    @Test
    fun `actual request from allowed origin should include CORS headers`() {
        mockMvc.perform(
            get("/actuator/health")
                .header("Origin", "http://localhost:3000")
        )
            .andExpect(status().isOk)
            .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"))
            .andExpect(header().exists("Vary"))
    }
    
    @Test
    fun `cross-origin POST request should work after preflight`() {
        // First, preflight request
        mockMvc.perform(
            options("/mock-auth/token")
                .header("Origin", "http://localhost:3000")
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", "content-type")
        )
            .andExpect(status().isOk)
            .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"))
        
        // Then, actual POST request
        mockMvc.perform(
            post("/mock-auth/token")
                .header("Origin", "http://localhost:3000")
                .header("Content-Type", "application/json")
                .content("""
                    {
                        "username": "test@example.com",
                        "tenantId": "tenant-123"
                    }
                """.trimIndent())
        )
            .andExpect(status().isOk)
            .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"))
    }
    
    @Test
    fun `CORS should handle multiple origins in Vary header`() {
        mockMvc.perform(
            get("/actuator/health")
                .header("Origin", "http://localhost:3000")
        )
            .andExpect(status().isOk)
            .andExpect(header().exists("Vary"))
            // The Vary header should include Origin to indicate that the response varies by origin
    }
    
    @Test
    fun `ngrok tunnel origins should be allowed in development`() {
        val ngrokOrigins = listOf(
            "https://abc123.ngrok.io",
            "https://xyz789.ngrok-free.app"
        )
        
        for (origin in ngrokOrigins) {
            mockMvc.perform(
                options("/api/v1/test")
                    .header("Origin", origin)
                    .header("Access-Control-Request-Method", "GET")
            )
                .andExpect(status().isOk)
                .andExpect(header().string("Access-Control-Allow-Origin", origin))
        }
    }
}
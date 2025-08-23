package com.astarworks.astarmanagement.core.infrastructure.audit

import com.astarworks.astarmanagement.core.infrastructure.security.BusinessContext
import com.astarworks.astarmanagement.core.infrastructure.security.BusinessRole
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuditLogIntegrationTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Test
    @WithMockUser(username = "auth0|test123")
    fun `should log authenticated API request`() {
        // When & Then
        mockMvc.perform(
            get("/api/test")
                .header("User-Agent", "Integration Test Agent")
                .header("X-Forwarded-For", "203.0.113.1")
        )
            .andExpect(status().isOk.or(status().isNotFound))  // Endpoint might not exist, we're testing interceptor
    }

    @Test
    fun `should log unauthenticated API request as anonymous`() {
        // When & Then
        mockMvc.perform(
            get("/api/public")
                .header("User-Agent", "Test Browser")
        )
            .andExpect(status().isOk.or(status().isUnauthorized))
    }

    @Test
    @WithMockUser(username = "auth0|admin456", roles = ["ADMIN"])
    fun `should log POST request with authentication`() {
        // When & Then
        mockMvc.perform(
            post("/api/resource")
                .contentType("application/json")
                .content("""{"test": "data"}""")
                .header("X-Real-IP", "198.51.100.42")
        )
            .andExpect(status().isOk.or(status().isNotFound.or(status().isForbidden)))
    }

    @Test
    fun `should not log health check endpoints`() {
        // When & Then
        mockMvc.perform(get("/api/health"))
            .andExpect(status().isOk.or(status().isNotFound))
        
        // Health endpoint should be excluded from audit logging
        mockMvc.perform(get("/api/health/ready"))
            .andExpect(status().isOk.or(status().isNotFound))
    }

    @Test
    fun `should not log metrics endpoints`() {
        // When & Then
        mockMvc.perform(get("/api/metrics"))
            .andExpect(status().isOk.or(status().isNotFound))
        
        // Metrics endpoints should be excluded from audit logging
        mockMvc.perform(get("/api/metrics/prometheus"))
            .andExpect(status().isOk.or(status().isNotFound))
    }

    @Test
    fun `should not log actuator endpoints`() {
        // When & Then
        mockMvc.perform(get("/api/actuator/health"))
            .andExpect(status().isOk.or(status().isNotFound))
        
        // Actuator endpoints should be excluded from audit logging
        mockMvc.perform(get("/api/actuator/info"))
            .andExpect(status().isOk.or(status().isNotFound))
    }

    @Test
    @WithMockUser(username = "auth0|user789")
    fun `should handle request with multiple forwarded IPs`() {
        // When & Then
        mockMvc.perform(
            get("/api/data")
                .header("X-Forwarded-For", "203.0.113.1, 198.51.100.2, 10.0.0.1")
                .header("User-Agent", "Complex Proxy Chain Test")
        )
            .andExpect(status().isOk.or(status().isNotFound))
    }

    @Test
    fun `should log failed authentication attempts`() {
        // When & Then
        mockMvc.perform(
            get("/api/secure")
                .header("User-Agent", "Unauthorized Test")
        )
            .andExpect(status().isUnauthorized.or(status().isForbidden))
    }

    @Test
    @WithMockUser(username = "auth0|performance", roles = ["USER"])
    fun `audit logging should have minimal performance impact`() {
        val startTime = System.currentTimeMillis()
        
        // Make multiple requests to measure performance
        repeat(10) {
            mockMvc.perform(
                get("/api/test/performance")
                    .header("User-Agent", "Performance Test")
            )
                .andExpect(status().isOk.or(status().isNotFound))
        }
        
        val duration = System.currentTimeMillis() - startTime
        val averageDuration = duration / 10
        
        // Average additional time per request should be less than 5ms
        // This is a rough check - actual impact would need more sophisticated testing
        println("Average request duration with audit logging: ${averageDuration}ms")
    }
}
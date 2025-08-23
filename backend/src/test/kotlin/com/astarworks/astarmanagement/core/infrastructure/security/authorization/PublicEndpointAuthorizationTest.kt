package com.astarworks.astarmanagement.core.infrastructure.security.authorization

import com.astarworks.astarmanagement.core.infrastructure.security.BaseAuthorizationTest
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.DisplayName
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*

/**
 * Tests for public endpoints that should be accessible without authentication.
 */
class PublicEndpointAuthorizationTest : BaseAuthorizationTest() {
    
    @Test
    @DisplayName("Public endpoint should be accessible without authentication")
    fun `public endpoint should be accessible without authentication`() {
        mockMvc.perform(get(PUBLIC_ENDPOINT))
            .andExpect(status().isOk)
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.message").value(PUBLIC_ACCESS_MESSAGE))
            .andExpect(jsonPath("$.endpoint").value("/public"))
            .andExpect(jsonPath("$.testResult").value("SUCCESS"))
    }
}
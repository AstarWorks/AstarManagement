package com.astarworks.astarmanagement.debug

import com.astarworks.astarmanagement.base.IntegrationTestBase
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.context.jdbc.Sql
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*

/**
 * Debug test to investigate 500 error in authentication failure scenarios.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Sql(scripts = ["/sql/cleanup-test-data.sql"], executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
class AuthControllerDebugTest : IntegrationTestBase() {
    
    // mockMvc is inherited from IntegrationTestBase
    
    @Test
    fun `debug unauthenticated access to auth me endpoint`() {
        // Perform request and dump detailed response
        val result = mockMvc.perform(
            get("/api/v1/auth/me")
                .contentType(MediaType.APPLICATION_JSON)
        )
        
        println("=== DEBUG: Response Status ===")
        println(result.andReturn().response.status)
        
        println("=== DEBUG: Response Body ===")
        println(result.andReturn().response.contentAsString)
        
        println("=== DEBUG: Response Headers ===")
        result.andReturn().response.headerNames.forEach { headerName ->
            println("$headerName: ${result.andReturn().response.getHeaders(headerName)}")
        }
        
        // Also check what the actual response status is
        val status = result.andReturn().response.status
        if (status != 401) {
            println("=== ERROR: Expected 401 but got $status ===")
        }
    }
}
package com.astarworks.astarmanagement.base

import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.test.context.ActiveProfiles
import org.junit.jupiter.api.Tag
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.test.web.servlet.MockMvc

/**
 * Base class for web layer (controller) tests.
 * 
 * Web tests should:
 * - Test controller behavior in isolation
 * - Mock service layer dependencies
 * - Validate request/response mapping
 * - Test authorization rules
 */
@Tag("web")
@WebMvcTest
@ActiveProfiles("unit")
abstract class WebMvcTestBase {
    
    @Autowired
    protected lateinit var mockMvc: MockMvc
}
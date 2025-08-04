package com.astarworks.astarmanagement.base

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.web.servlet.MockMvc

/**
 * Base class for Spring integration tests
 */
@SpringBootTest
@AutoConfigureMockMvc
abstract class IntegrationTest {
    @Autowired
    lateinit var mockMvc: MockMvc
    
    @Autowired
    lateinit var objectMapper: ObjectMapper
    
    protected fun asJson(obj: Any): String = objectMapper.writeValueAsString(obj)
}
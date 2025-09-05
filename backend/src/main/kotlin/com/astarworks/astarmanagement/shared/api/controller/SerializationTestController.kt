package com.astarworks.astarmanagement.shared.api.controller

import kotlinx.serialization.Contextual
import kotlinx.serialization.Serializable
import org.springframework.web.bind.annotation.*
import java.time.Instant
import java.util.UUID

/**
 * Test controller for verifying Kotlin Serialization functionality.
 * This controller provides simple endpoints to test if Kotlin Serialization
 * works correctly with Spring Boot 4.0.0-M2.
 */
@RestController
@RequestMapping("/api/test/serialization")
class SerializationTestController {
    
    /**
     * Echo endpoint - returns the request data back as response
     */
    @PostMapping("/echo")
    fun echo(@RequestBody request: TestRequest): TestResponse {
        return TestResponse(
            id = request.id,
            name = request.name,
            timestamp = request.timestamp,
            message = "Echo successful: ${request.name}",
            success = true
        )
    }
    
    /**
     * Simple GET endpoint - returns a simple response without request body
     */
    @GetMapping("/simple")
    fun simple(): SimpleResponse {
        return SimpleResponse(
            message = "Kotlin Serialization is working!",
            serverTime = Instant.now()
        )
    }
    
    /**
     * Complex GET endpoint - returns a response with various data types
     */
    @GetMapping("/complex")
    fun complex(): ComplexResponse {
        return ComplexResponse(
            id = UUID.randomUUID(),
            name = "Test Object",
            count = 42,
            active = true,
            tags = listOf("kotlin", "serialization", "test"),
            metadata = mapOf(
                "version" to "1.0",
                "environment" to "test"
            ),
            createdAt = Instant.now()
        )
    }
}

/**
 * Test request DTO with @Serializable annotation
 */
@Serializable
data class TestRequest(
    @Contextual
    val id: UUID,
    val name: String,
    @Contextual
    val timestamp: Instant = Instant.now()
)

/**
 * Test response DTO with @Serializable annotation
 */
@Serializable
data class TestResponse(
    @Contextual
    val id: UUID,
    val name: String,
    @Contextual
    val timestamp: Instant,
    val message: String,
    val success: Boolean
)

/**
 * Simple response DTO with minimal fields
 */
@Serializable
data class SimpleResponse(
    val message: String,
    @Contextual
    val serverTime: Instant
)

/**
 * Complex response DTO with various data types
 */
@Serializable
data class ComplexResponse(
    @Contextual
    val id: UUID,
    val name: String,
    val count: Int,
    val active: Boolean,
    val tags: List<String>,
    val metadata: Map<String, String>,
    @Contextual
    val createdAt: Instant
)
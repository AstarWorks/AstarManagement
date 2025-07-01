package dev.ryuzu.astermanagement.security.session

import dev.ryuzu.astermanagement.config.SessionProperties
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.session.web.http.HttpSessionIdResolver
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.testcontainers.containers.GenericContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import kotlin.test.assertNotNull

/**
 * Integration test to verify session management configuration is properly loaded.
 */
@SpringBootTest
@Testcontainers
class SessionIntegrationTest {

    companion object {
        @Container
        val redis: GenericContainer<*> = GenericContainer("redis:7-alpine")
            .withExposedPorts(6379)

        @JvmStatic
        @DynamicPropertySource
        fun redisProperties(registry: DynamicPropertyRegistry) {
            registry.add("spring.data.redis.host") { redis.host }
            registry.add("spring.data.redis.port") { redis.getMappedPort(6379) }
        }
    }

    @Autowired
    private lateinit var httpSessionIdResolver: HttpSessionIdResolver

    @Autowired
    private lateinit var sessionProperties: SessionProperties

    @Test
    fun `session configuration should be properly loaded`() {
        // Verify session components are loaded
        assertNotNull(httpSessionIdResolver)
        assertNotNull(sessionProperties)
    }

    @Test
    fun `session properties should have correct values`() {
        // Verify configuration properties
        assertNotNull(sessionProperties.timeout)
        assertNotNull(sessionProperties.maxConcurrentSessions)
        assertNotNull(sessionProperties.concurrentSessionPolicy)
    }
}
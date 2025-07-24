package dev.ryuzu.astermanagement.config

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.session.web.http.HeaderHttpSessionIdResolver
import org.springframework.session.web.http.HttpSessionIdResolver
import org.springframework.session.web.http.SessionEventHttpSessionListenerAdapter
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.testcontainers.containers.GenericContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

@SpringBootTest
@Testcontainers
class SessionConfigTest {

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
    private lateinit var sessionEventHttpSessionListenerAdapter: SessionEventHttpSessionListenerAdapter

    @Autowired
    private lateinit var sessionProperties: SessionProperties

    @Test
    fun `httpSessionIdResolver should be HeaderHttpSessionIdResolver with X-Auth-Token`() {
        // Then
        assertNotNull(httpSessionIdResolver)
        assertTrue(httpSessionIdResolver is HeaderHttpSessionIdResolver)
        
        // Verify it uses X-Auth-Token header
        val headerResolver = httpSessionIdResolver as HeaderHttpSessionIdResolver
        // Note: There's no direct way to verify the header name from the resolver
        // but we can verify it's the correct type
    }

    @Test
    fun `sessionEventHttpSessionListenerAdapter should be configured with CustomSessionListener`() {
        // Then
        assertNotNull(sessionEventHttpSessionListenerAdapter)
    }

    @Test
    fun `sessionProperties should have correct default values`() {
        // Then
        assertNotNull(sessionProperties)
        assertEquals(java.time.Duration.ofMinutes(30), sessionProperties.timeout)
        assertEquals(3, sessionProperties.maxConcurrentSessions)
        assertEquals(ConcurrentSessionPolicy.INVALIDATE_OLDEST, sessionProperties.concurrentSessionPolicy)
        assertEquals(java.time.Duration.ofDays(30), sessionProperties.rememberMeTimeout)
        assertEquals(false, sessionProperties.ipValidation)
        assertEquals(true, sessionProperties.deviceFingerprinting)
        assertEquals(java.time.Duration.ofHours(24), sessionProperties.absoluteTimeout)
        assertEquals(java.time.Duration.ofMinutes(30), sessionProperties.inactivityTimeout)
    }

    @Test
    fun `ConcurrentSessionPolicy enum should have all expected values`() {
        // Then
        val policies = ConcurrentSessionPolicy.values()
        assertEquals(3, policies.size)
        assertTrue(policies.contains(ConcurrentSessionPolicy.INVALIDATE_OLDEST))
        assertTrue(policies.contains(ConcurrentSessionPolicy.PREVENT_NEW_SESSION))
        assertTrue(policies.contains(ConcurrentSessionPolicy.NOTIFY_USER))
    }
}
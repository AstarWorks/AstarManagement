package com.astarworks.astarmanagement.config

import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset

/**
 * Test configuration providing fixed time and other test utilities.
 * Ensures consistent time-based behavior in tests.
 */
@TestConfiguration
class TestConfig {
    
    /**
     * Provides a fixed clock for consistent time-based testing.
     * Fixed at 2024-01-15T10:00:00Z for reproducible results.
     */
    @Bean
    fun fixedClock(): Clock = Clock.fixed(
        Instant.parse("2024-01-15T10:00:00Z"),
        ZoneOffset.UTC
    )
}
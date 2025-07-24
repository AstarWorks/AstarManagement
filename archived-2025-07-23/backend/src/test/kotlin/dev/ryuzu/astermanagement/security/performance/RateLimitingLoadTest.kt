package dev.ryuzu.astermanagement.security.performance

import dev.ryuzu.astermanagement.security.ratelimit.impl.RedisRateLimiter
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.TestPropertySource
import java.time.Duration
import java.util.concurrent.*
import java.util.concurrent.atomic.AtomicInteger
import kotlin.test.assertTrue

/**
 * Load testing for rate limiting implementation
 * Tests performance and accuracy under high load
 */
@SpringBootTest
@TestPropertySource(properties = ["spring.profiles.active=test"])
@EnabledIfEnvironmentVariable(named = "LOAD_TESTS_ENABLED", matches = "true")
class RateLimitingLoadTest {

    @Autowired
    private lateinit var rateLimiter: RedisRateLimiter

    @Test
    @DisplayName("Load Test: Rate Limiting Under Concurrent Load")
    fun testRateLimitingUnderLoad() {
        val threadCount = 50
        val requestsPerThread = 20
        val totalRequests = threadCount * requestsPerThread
        val rateLimit = 100
        val window = Duration.ofMinutes(1)
        
        val executor = Executors.newFixedThreadPool(threadCount)
        val latch = CountDownLatch(threadCount)
        val successfulRequests = AtomicInteger(0)
        val rateLimitedRequests = AtomicInteger(0)
        
        val startTime = System.currentTimeMillis()
        
        repeat(threadCount) { threadId ->
            executor.submit {
                try {
                    repeat(requestsPerThread) { requestId ->
                        val key = "load_test_user_$threadId"
                        
                        if (rateLimiter.isAllowed(key, rateLimit, window)) {
                            successfulRequests.incrementAndGet()
                        } else {
                            rateLimitedRequests.incrementAndGet()
                        }
                        
                        // Small delay to simulate real requests
                        Thread.sleep(10)
                    }
                } finally {
                    latch.countDown()
                }
            }
        }
        
        latch.await(30, TimeUnit.SECONDS)
        executor.shutdown()
        
        val endTime = System.currentTimeMillis()
        val duration = endTime - startTime
        
        println("Load test results:")
        println("  Total requests: $totalRequests")
        println("  Successful: ${successfulRequests.get()}")
        println("  Rate limited: ${rateLimitedRequests.get()}")
        println("  Duration: ${duration}ms")
        println("  Throughput: ${totalRequests * 1000L / duration} req/sec")
        
        // Verify rate limiting worked correctly
        assertTrue(successfulRequests.get() > 0, "Some requests should succeed")
        assertTrue(rateLimitedRequests.get() > 0, "Some requests should be rate limited")
        assertTrue(successfulRequests.get() + rateLimitedRequests.get() == totalRequests, 
            "All requests should be accounted for")
    }

    @Test
    @DisplayName("Load Test: Rate Limiter Performance")
    fun testRateLimiterPerformance() {
        val iterations = 10000
        val limit = 1000
        val window = Duration.ofHours(1)
        val key = "performance_test"
        
        val startTime = System.nanoTime()
        
        repeat(iterations) {
            rateLimiter.isAllowed(key, limit, window)
        }
        
        val endTime = System.nanoTime()
        val duration = Duration.ofNanos(endTime - startTime)
        val avgLatency = duration.toNanos() / iterations / 1_000_000.0 // Convert to milliseconds
        
        println("Performance test results:")
        println("  Iterations: $iterations")
        println("  Total time: ${duration.toMillis()}ms")
        println("  Average latency: ${String.format("%.3f", avgLatency)}ms")
        println("  Throughput: ${iterations * 1000L / duration.toMillis()} req/sec")
        
        // Assert reasonable performance (< 5ms average latency)
        assertTrue(avgLatency < 5.0, "Average latency should be less than 5ms, was $avgLatency ms")
    }
}
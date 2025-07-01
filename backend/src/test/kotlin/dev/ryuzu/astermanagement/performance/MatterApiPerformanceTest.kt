package dev.ryuzu.astermanagement.performance

import com.fasterxml.jackson.databind.ObjectMapper
import dev.ryuzu.astermanagement.domain.matter.MatterStatus
import dev.ryuzu.astermanagement.dto.matter.CreateMatterRequest
import dev.ryuzu.astermanagement.testutil.TestDataFactory
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.client.TestRestTemplate
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.boot.testcontainers.service.connection.ServiceConnection
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.test.context.ActiveProfiles
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import java.util.concurrent.CompletableFuture
import java.util.concurrent.Executors
import java.util.*
import kotlin.random.Random

/**
 * Performance tests for Matter API endpoints
 * Ensures response times meet SLA requirements (p95 < 200ms)
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@ActiveProfiles("test")
@DisplayName("Matter API Performance Tests")
class MatterApiPerformanceTest {
    
    @LocalServerPort
    private var port: Int = 0
    
    @Autowired
    private lateinit var restTemplate: TestRestTemplate
    
    @Autowired
    private lateinit var objectMapper: ObjectMapper
    
    companion object {
        @Container
        @ServiceConnection
        @JvmStatic
        val postgres = PostgreSQLContainer("postgres:15")
            .withDatabaseName("perftest")
            .withUsername("test")
            .withPassword("test")
            .withLabel("perf-test", "matter-api")
        
        private const val PERFORMANCE_THRESHOLD_MS = 200L
        private const val CONCURRENT_REQUESTS = 10
        private const val LOAD_TEST_REQUESTS = 100
    }
    
    private fun getBaseUrl(): String = "http://localhost:$port/v1"
    
    @Nested
    @DisplayName("Single Request Performance Tests")
    inner class SingleRequestPerformanceTests {
        
        @Test
        @WithMockUser(roles = ["LAWYER"])
        @DisplayName("Create matter should complete within 200ms")
        fun `POST matters should complete within performance threshold`() {
            // Given
            val request = CreateMatterRequest(
                caseNumber = "2025-PERF-${Random.nextInt(1000, 9999)}",
                title = "Performance Test Matter",
                description = "Testing API performance under load",
                clientName = "Performance Test Client",
                clientContact = "perf@test.com",
                status = MatterStatus.INTAKE,
                assignedLawyerId = UUID.randomUUID()
            )
            
            val headers = HttpHeaders().apply {
                contentType = MediaType.APPLICATION_JSON
                setBearerAuth("mock-jwt-token")
            }
            val httpEntity = HttpEntity(request, headers)
            
            // When
            val startTime = System.currentTimeMillis()
            
            val response = restTemplate.postForEntity(
                "${getBaseUrl()}/matters",
                httpEntity,
                String::class.java
            )
            
            val duration = System.currentTimeMillis() - startTime
            
            // Then
            response.statusCode shouldBe HttpStatus.CREATED
            assert(duration < PERFORMANCE_THRESHOLD_MS) {
                "Create matter took too long: ${duration}ms (threshold: ${PERFORMANCE_THRESHOLD_MS}ms)"
            }
            
            println("✅ Create matter completed in ${duration}ms")
        }
        
        @Test
        @WithMockUser(roles = ["LAWYER"])
        @DisplayName("Get matters list should complete within 200ms")
        fun `GET matters should complete within performance threshold`() {
            // Given
            val headers = HttpHeaders().apply {
                setBearerAuth("mock-jwt-token")
            }
            val httpEntity = HttpEntity<String>(headers)
            
            // When
            val startTime = System.currentTimeMillis()
            
            val response = restTemplate.exchange(
                "${getBaseUrl()}/matters?page=0&size=20",
                HttpMethod.GET,
                httpEntity,
                String::class.java
            )
            
            val duration = System.currentTimeMillis() - startTime
            
            // Then
            response.statusCode shouldBe HttpStatus.OK
            assert(duration < PERFORMANCE_THRESHOLD_MS) {
                "Get matters took too long: ${duration}ms (threshold: ${PERFORMANCE_THRESHOLD_MS}ms)"
            }
            
            println("✅ Get matters completed in ${duration}ms")
        }
        
        @Test
        @WithMockUser(roles = ["LAWYER"])
        @DisplayName("Get matter by ID should complete within 200ms")
        fun `GET matters by ID should complete within performance threshold`() {
            // Given - First create a matter to retrieve
            val createRequest = CreateMatterRequest(
                caseNumber = "2025-GET-${Random.nextInt(1000, 9999)}",
                title = "Matter for Get Test",
                clientName = "Get Test Client",
                assignedLawyerId = UUID.randomUUID()
            )
            
            val headers = HttpHeaders().apply {
                contentType = MediaType.APPLICATION_JSON
                setBearerAuth("mock-jwt-token")
            }
            
            val createResponse = restTemplate.postForEntity(
                "${getBaseUrl()}/matters",
                HttpEntity(createRequest, headers),
                Map::class.java
            )
            
            val matterId = (createResponse.body?.get("id") as String?)
            matterId shouldNotBe null
            
            // When - Get the matter by ID
            val startTime = System.currentTimeMillis()
            
            val getHeaders = HttpHeaders().apply { setBearerAuth("mock-jwt-token") }
            val response = restTemplate.exchange(
                "${getBaseUrl()}/matters/$matterId",
                HttpMethod.GET,
                HttpEntity<String>(getHeaders),
                String::class.java
            )
            
            val duration = System.currentTimeMillis() - startTime
            
            // Then
            response.statusCode shouldBe HttpStatus.OK
            assert(duration < PERFORMANCE_THRESHOLD_MS) {
                "Get matter by ID took too long: ${duration}ms (threshold: ${PERFORMANCE_THRESHOLD_MS}ms)"
            }
            
            println("✅ Get matter by ID completed in ${duration}ms")
        }
    }
    
    @Nested
    @DisplayName("Concurrent Request Performance Tests")
    inner class ConcurrentPerformanceTests {
        
        @Test
        @WithMockUser(roles = ["LAWYER"])
        @DisplayName("Should handle concurrent create matter requests efficiently")
        fun `should handle multiple concurrent create requests within threshold`() {
            // Given
            val executor = Executors.newFixedThreadPool(CONCURRENT_REQUESTS)
            val futures = mutableListOf<CompletableFuture<Long>>()
            
            // When - Execute concurrent requests
            repeat(CONCURRENT_REQUESTS) { index ->
                val future = CompletableFuture.supplyAsync({
                    val request = CreateMatterRequest(
                        caseNumber = "2025-CONC-${String.format("%04d", index)}",
                        title = "Concurrent Test Matter $index",
                        clientName = "Concurrent Client $index",
                        assignedLawyerId = UUID.randomUUID()
                    )
                    
                    val headers = HttpHeaders().apply {
                        contentType = MediaType.APPLICATION_JSON
                        setBearerAuth("mock-jwt-token")
                    }
                    
                    val startTime = System.currentTimeMillis()
                    val response = restTemplate.postForEntity(
                        "${getBaseUrl()}/matters",
                        HttpEntity(request, headers),
                        String::class.java
                    )
                    val duration = System.currentTimeMillis() - startTime
                    
                    assert(response.statusCode == HttpStatus.CREATED) {
                        "Request $index failed with status: ${response.statusCode}"
                    }
                    
                    duration
                }, executor)
                
                futures.add(future)
            }
            
            // Then - Collect results and analyze performance
            val durations = futures.map { it.get() }
            val maxDuration = durations.maxOrNull()!!
            val avgDuration = durations.average()
            val p95Duration = durations.sorted()[(durations.size * 0.95).toInt()]
            
            executor.shutdown()
            
            println("📊 Concurrent Performance Results:")
            println("   Requests: $CONCURRENT_REQUESTS")
            println("   Max duration: ${maxDuration}ms")
            println("   Avg duration: ${"%.2f".format(avgDuration)}ms")
            println("   P95 duration: ${p95Duration}ms")
            
            assert(p95Duration < PERFORMANCE_THRESHOLD_MS) {
                "P95 duration exceeds threshold: ${p95Duration}ms > ${PERFORMANCE_THRESHOLD_MS}ms"
            }
            
            println("✅ All concurrent requests completed within threshold")
        }
        
        @Test
        @WithMockUser(roles = ["LAWYER"])
        @DisplayName("Should handle concurrent read requests efficiently")
        fun `should handle multiple concurrent get requests within threshold`() {
            // Given - Create some matters first
            val matterIds = mutableListOf<String>()
            repeat(5) { index ->
                val request = CreateMatterRequest(
                    caseNumber = "2025-READ-${String.format("%04d", index)}",
                    title = "Read Test Matter $index",
                    clientName = "Read Client $index",
                    assignedLawyerId = UUID.randomUUID()
                )
                
                val headers = HttpHeaders().apply {
                    contentType = MediaType.APPLICATION_JSON
                    setBearerAuth("mock-jwt-token")
                }
                
                val response = restTemplate.postForEntity(
                    "${getBaseUrl()}/matters",
                    HttpEntity(request, headers),
                    Map::class.java
                )
                
                matterIds.add(response.body?.get("id") as String)
            }
            
            // When - Execute concurrent read requests
            val executor = Executors.newFixedThreadPool(CONCURRENT_REQUESTS)
            val futures = mutableListOf<CompletableFuture<Long>>()
            
            repeat(CONCURRENT_REQUESTS) { index ->
                val future = CompletableFuture.supplyAsync({
                    val matterId = matterIds[index % matterIds.size]
                    val headers = HttpHeaders().apply { setBearerAuth("mock-jwt-token") }
                    
                    val startTime = System.currentTimeMillis()
                    val response = restTemplate.exchange(
                        "${getBaseUrl()}/matters/$matterId",
                        HttpMethod.GET,
                        HttpEntity<String>(headers),
                        String::class.java
                    )
                    val duration = System.currentTimeMillis() - startTime
                    
                    assert(response.statusCode == HttpStatus.OK) {
                        "Read request $index failed with status: ${response.statusCode}"
                    }
                    
                    duration
                }, executor)
                
                futures.add(future)
            }
            
            // Then
            val durations = futures.map { it.get() }
            val p95Duration = durations.sorted()[(durations.size * 0.95).toInt()]
            
            executor.shutdown()
            
            println("📊 Concurrent Read Performance:")
            println("   P95 duration: ${p95Duration}ms")
            
            assert(p95Duration < PERFORMANCE_THRESHOLD_MS) {
                "P95 read duration exceeds threshold: ${p95Duration}ms > ${PERFORMANCE_THRESHOLD_MS}ms"
            }
            
            println("✅ All concurrent read requests completed within threshold")
        }
    }
    
    @Nested
    @DisplayName("Load Testing")
    inner class LoadTests {
        
        @Test
        @WithMockUser(roles = ["LAWYER"])
        @DisplayName("Should maintain performance under sustained load")
        fun `should maintain performance with sustained load of requests`() {
            // Given
            val durations = mutableListOf<Long>()
            val headers = HttpHeaders().apply { setBearerAuth("mock-jwt-token") }
            
            // When - Execute sustained load
            println("🚀 Starting load test with $LOAD_TEST_REQUESTS requests...")
            
            repeat(LOAD_TEST_REQUESTS) { index ->
                val startTime = System.currentTimeMillis()
                
                val response = restTemplate.exchange(
                    "${getBaseUrl()}/matters?page=0&size=10",
                    HttpMethod.GET,
                    HttpEntity<String>(headers),
                    String::class.java
                )
                
                val duration = System.currentTimeMillis() - startTime
                durations.add(duration)
                
                assert(response.statusCode == HttpStatus.OK) {
                    "Request $index failed with status: ${response.statusCode}"
                }
                
                if ((index + 1) % 20 == 0) {
                    println("   Completed ${index + 1}/$LOAD_TEST_REQUESTS requests")
                }
            }
            
            // Then - Analyze performance metrics
            val sortedDurations = durations.sorted()
            val p50 = sortedDurations[sortedDurations.size / 2]
            val p95 = sortedDurations[(sortedDurations.size * 0.95).toInt()]
            val p99 = sortedDurations[(sortedDurations.size * 0.99).toInt()]
            val avgDuration = durations.average()
            val maxDuration = durations.maxOrNull()!!
            
            println("📊 Load Test Results:")
            println("   Total requests: $LOAD_TEST_REQUESTS")
            println("   Average: ${"%.2f".format(avgDuration)}ms")
            println("   P50: ${p50}ms")
            println("   P95: ${p95}ms")
            println("   P99: ${p99}ms")
            println("   Max: ${maxDuration}ms")
            
            assert(p95 < PERFORMANCE_THRESHOLD_MS) {
                "P95 under load exceeds threshold: ${p95}ms > ${PERFORMANCE_THRESHOLD_MS}ms"
            }
            
            // Additional assertions for performance degradation
            assert(avgDuration < PERFORMANCE_THRESHOLD_MS * 0.5) {
                "Average response time is too high: ${"%.2f".format(avgDuration)}ms"
            }
            
            println("✅ Load test passed - performance maintained under sustained load")
        }
    }
    
    @Nested
    @DisplayName("Memory and Resource Tests")
    inner class ResourceTests {
        
        @Test
        @DisplayName("Should not cause memory leaks under repeated requests")
        fun `should maintain stable memory usage under repeated requests`() {
            // Given
            val runtime = Runtime.getRuntime()
            val headers = HttpHeaders().apply { setBearerAuth("mock-jwt-token") }
            
            // Baseline memory measurement
            System.gc()
            Thread.sleep(100)
            val initialMemory = runtime.totalMemory() - runtime.freeMemory()
            
            // When - Execute many requests
            repeat(500) { index ->
                restTemplate.exchange(
                    "${getBaseUrl()}/matters?page=0&size=5",
                    HttpMethod.GET,
                    HttpEntity<String>(headers),
                    String::class.java
                )
                
                if (index % 100 == 0) {
                    System.gc()
                    Thread.sleep(10)
                }
            }
            
            // Final memory measurement
            System.gc()
            Thread.sleep(100)
            val finalMemory = runtime.totalMemory() - runtime.freeMemory()
            
            val memoryIncrease = finalMemory - initialMemory
            val memoryIncreasePercent = (memoryIncrease.toDouble() / initialMemory) * 100
            
            println("📊 Memory Usage:")
            println("   Initial: ${initialMemory / 1024 / 1024}MB")
            println("   Final: ${finalMemory / 1024 / 1024}MB")
            println("   Increase: ${memoryIncrease / 1024 / 1024}MB (${String.format("%.2f", memoryIncreasePercent)}%)")
            
            // Then - Memory increase should be reasonable (less than 50% increase)
            assert(memoryIncreasePercent < 50.0) {
                "Memory usage increased too much: ${String.format("%.2f", memoryIncreasePercent)}%"
            }
            
            println("✅ Memory usage remains stable")
        }
    }
}
package dev.ryuzu.astermanagement.service

import dev.ryuzu.astermanagement.domain.matter.Matter
import dev.ryuzu.astermanagement.domain.matter.MatterRepository
import dev.ryuzu.astermanagement.domain.matter.MatterStatus
import dev.ryuzu.astermanagement.domain.matter.MatterPriority
import dev.ryuzu.astermanagement.domain.user.User
import dev.ryuzu.astermanagement.domain.user.UserRepository
import dev.ryuzu.astermanagement.domain.user.UserRole
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.util.*
import kotlin.system.measureTimeMillis

/**
 * Performance tests for StatusTransitionService with high-volume scenarios
 * These tests are enabled only when PERFORMANCE_TESTS environment variable is set
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
@EnabledIfEnvironmentVariable(named = "PERFORMANCE_TESTS", matches = "true")
class StatusTransitionPerformanceTest {

    @Autowired
    private lateinit var statusTransitionService: StatusTransitionService

    @Autowired
    private lateinit var cachedStatusTransitionService: CachedStatusTransitionService

    @Autowired
    private lateinit var matterRepository: MatterRepository

    @Autowired
    private lateinit var userRepository: UserRepository

    private lateinit var testLawyer: User
    private lateinit var testClerk: User
    private val testMatters = mutableListOf<Matter>()

    companion object {
        private const val BULK_SIZE = 100
        private const val PERFORMANCE_THRESHOLD_MS = 2000L // 2 seconds max for bulk operations
        private const val SINGLE_VALIDATION_THRESHOLD_MS = 50L // 50ms max for single validation
    }

    @BeforeEach
    fun setUp() {
        // Create test users
        testLawyer = User().apply {
            username = "perf.lawyer@test.com"
            email = "perf.lawyer@test.com"
            firstName = "Performance"
            lastName = "Lawyer"
            role = UserRole.LAWYER
            isActive = true
        }
        testLawyer = userRepository.save(testLawyer)

        testClerk = User().apply {
            username = "perf.clerk@test.com"
            email = "perf.clerk@test.com"
            firstName = "Performance"
            lastName = "Clerk"
            role = UserRole.CLERK
            isActive = true
        }
        testClerk = userRepository.save(testClerk)

        // Create test matters
        repeat(BULK_SIZE) { index ->
            val matter = Matter().apply {
                caseNumber = "PERF-${String.format("%03d", index)}"
                title = "Performance Test Matter $index"
                clientName = "Performance Client $index"
                status = MatterStatus.values().random() // Random status for variety
                priority = MatterPriority.values().random()
                assignedLawyer = testLawyer
                assignedClerk = testClerk
                createdAt = LocalDateTime.now().minusDays(index.toLong())
            }
            testMatters.add(matterRepository.save(matter))
        }
    }

    @Test
    @WithMockUser(username = "perf.lawyer@test.com", roles = ["LAWYER"])
    fun `should validate bulk transitions within performance threshold`() {
        // Given - create bulk transition contexts
        val transitionContexts = testMatters.map { matter ->
            val validTransitions = matter.status.getValidTransitions()
            if (validTransitions.isNotEmpty()) {
                StatusTransitionContext(
                    matterId = matter.id!!,
                    currentStatus = matter.status,
                    newStatus = validTransitions.first(),
                    reason = "Bulk performance test",
                    userId = testLawyer.id!!,
                    userRole = UserRole.LAWYER,
                    matter = matter
                )
            } else {
                // Create a transition context that will be valid but not executed
                StatusTransitionContext(
                    matterId = matter.id!!,
                    currentStatus = MatterStatus.INTAKE,
                    newStatus = MatterStatus.INITIAL_REVIEW,
                    reason = "Bulk performance test",
                    userId = testLawyer.id!!,
                    userRole = UserRole.LAWYER,
                    matter = matter
                )
            }
        }

        // When - execute bulk validation
        val executionTime = measureTimeMillis {
            val results = cachedStatusTransitionService.validateBulkTransitions(transitionContexts)
            
            // Then - verify results
            assertThat(results).hasSize(transitionContexts.size)
            assertThat(results.values.count { it.isValid() }).isGreaterThan(0)
        }

        // Performance assertion
        assertThat(executionTime)
            .describedAs("Bulk validation of $BULK_SIZE transitions should complete within ${PERFORMANCE_THRESHOLD_MS}ms")
            .isLessThan(PERFORMANCE_THRESHOLD_MS)

        println("Bulk validation performance: ${executionTime}ms for $BULK_SIZE transitions (${executionTime.toDouble() / BULK_SIZE}ms per transition)")
    }

    @Test
    @WithMockUser(username = "perf.lawyer@test.com", roles = ["LAWYER"])
    fun `should get valid transitions with caching performance improvement`() {
        val matter = testMatters.first()
        
        // First call (cold cache)
        val coldCacheTime = measureTimeMillis {
            repeat(10) {
                cachedStatusTransitionService.getValidTransitionsForRole(matter.status, UserRole.LAWYER)
            }
        }

        // Second call (warm cache)
        val warmCacheTime = measureTimeMillis {
            repeat(10) {
                cachedStatusTransitionService.getValidTransitionsForRole(matter.status, UserRole.LAWYER)
            }
        }

        // Cache should provide significant improvement
        assertThat(warmCacheTime)
            .describedAs("Cached calls should be significantly faster than cold cache")
            .isLessThan(coldCacheTime / 2)

        println("Cache performance improvement: ${coldCacheTime}ms (cold) vs ${warmCacheTime}ms (warm)")
    }

    @Test
    @WithMockUser(username = "perf.lawyer@test.com", roles = ["LAWYER"])
    fun `should validate single transitions within performance threshold`() {
        val matter = testMatters.first()
        val validTransitions = matter.status.getValidTransitions()
        
        if (validTransitions.isNotEmpty()) {
            val context = StatusTransitionContext(
                matterId = matter.id!!,
                currentStatus = matter.status,
                newStatus = validTransitions.first(),
                reason = "Single performance test",
                userId = testLawyer.id!!,
                userRole = UserRole.LAWYER,
                matter = matter
            )

            // When - measure single validation time
            val executionTime = measureTimeMillis {
                repeat(20) {
                    statusTransitionService.validateTransition(context)
                }
            }

            val averageTime = executionTime / 20

            // Performance assertion
            assertThat(averageTime)
                .describedAs("Single validation should complete within ${SINGLE_VALIDATION_THRESHOLD_MS}ms")
                .isLessThan(SINGLE_VALIDATION_THRESHOLD_MS)

            println("Single validation performance: ${averageTime}ms average over 20 calls")
        }
    }

    @Test
    @WithMockUser(username = "perf.lawyer@test.com", roles = ["LAWYER"])
    fun `should handle concurrent validations efficiently`() {
        val matter = testMatters.first()
        val validTransitions = matter.status.getValidTransitions()
        
        if (validTransitions.isNotEmpty()) {
            val contexts = (1..50).map {
                StatusTransitionContext(
                    matterId = matter.id!!,
                    currentStatus = matter.status,
                    newStatus = validTransitions.first(),
                    reason = "Concurrent test $it",
                    userId = testLawyer.id!!,
                    userRole = UserRole.LAWYER,
                    matter = matter
                )
            }

            // When - execute concurrent validations
            val executionTime = measureTimeMillis {
                val futures = contexts.map { context ->
                    cachedStatusTransitionService.validateTransitionAsync(context)
                }
                
                // Wait for all to complete
                futures.forEach { future ->
                    val result = future.get()
                    assertThat(result.isValid()).isTrue()
                }
            }

            // Performance assertion
            assertThat(executionTime)
                .describedAs("Concurrent validations should benefit from parallelization")
                .isLessThan(PERFORMANCE_THRESHOLD_MS)

            println("Concurrent validation performance: ${executionTime}ms for 50 parallel validations")
        }
    }

    @Test
    @WithMockUser(username = "perf.lawyer@test.com", roles = ["LAWYER"])
    fun `should warm up cache efficiently`() {
        // When - warm up cache
        val warmUpTime = measureTimeMillis {
            cachedStatusTransitionService.warmUpCache()
        }

        // Then - verify cache is populated by testing fast access
        val cacheTestTime = measureTimeMillis {
            MatterStatus.values().forEach { status ->
                UserRole.values().forEach { role ->
                    cachedStatusTransitionService.getValidTransitionsForRole(status, role)
                }
            }
        }

        // Cache warm-up should be reasonable
        assertThat(warmUpTime)
            .describedAs("Cache warm-up should complete within reasonable time")
            .isLessThan(5000L) // 5 seconds max for warm-up

        // Cached access should be very fast
        assertThat(cacheTestTime)
            .describedAs("Cached access should be very fast after warm-up")
            .isLessThan(100L) // 100ms max for all cached access

        println("Cache warm-up performance: ${warmUpTime}ms warm-up, ${cacheTestTime}ms for full cached access")
    }

    @Test
    @WithMockUser(username = "perf.lawyer@test.com", roles = ["LAWYER"])
    fun `should generate transition matrix efficiently`() {
        // When - generate full transition matrix
        val matrixGenerationTime = measureTimeMillis {
            val matrix = cachedStatusTransitionService.getFullTransitionMatrix()
            
            // Verify matrix completeness
            assertThat(matrix).hasSize(MatterStatus.values().size)
            matrix.values.forEach { roleMap ->
                assertThat(roleMap).hasSize(UserRole.values().size)
            }
        }

        // Performance assertion
        assertThat(matrixGenerationTime)
            .describedAs("Transition matrix generation should be efficient")
            .isLessThan(1000L) // 1 second max

        println("Transition matrix generation performance: ${matrixGenerationTime}ms")
    }

    @Test
    @WithMockUser(username = "perf.lawyer@test.com", roles = ["LAWYER"])
    fun `should scale linearly with matter count`() {
        // Test with different batch sizes to verify linear scaling
        val batchSizes = listOf(10, 25, 50, 100)
        val results = mutableMapOf<Int, Long>()

        batchSizes.forEach { batchSize ->
            val contexts = testMatters.take(batchSize).map { matter ->
                StatusTransitionContext(
                    matterId = matter.id!!,
                    currentStatus = MatterStatus.INTAKE,
                    newStatus = MatterStatus.INITIAL_REVIEW,
                    reason = "Scaling test",
                    userId = testLawyer.id!!,
                    userRole = UserRole.LAWYER,
                    matter = matter
                )
            }

            val time = measureTimeMillis {
                cachedStatusTransitionService.validateBulkTransitions(contexts)
            }

            results[batchSize] = time
            println("Batch size $batchSize: ${time}ms (${time.toDouble() / batchSize}ms per item)")
        }

        // Verify roughly linear scaling (allowing for some overhead)
        val timePerItem10 = results[10]!! / 10.0
        val timePerItem100 = results[100]!! / 100.0
        
        assertThat(timePerItem100)
            .describedAs("Performance should scale roughly linearly")
            .isLessThan(timePerItem10 * 3) // Allow 3x overhead for larger batches
    }
}
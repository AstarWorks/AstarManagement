package dev.ryuzu.astermanagement.service.batch

import com.fasterxml.jackson.databind.ObjectMapper
import dev.ryuzu.astermanagement.config.DocumentProcessingProperties
import dev.ryuzu.astermanagement.domain.batch.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.kotlin.*
import org.springframework.data.redis.core.ListOperations
import org.springframework.data.redis.core.RedisTemplate
import org.springframework.data.redis.core.HashOperations
import org.springframework.data.redis.core.SetOperations
import java.time.Instant
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

@ExtendWith(MockitoExtension::class)
class RedisJobQueueServiceTest {

    @Mock
    private lateinit var redisTemplate: RedisTemplate<String, Any>

    @Mock
    private lateinit var listOperations: ListOperations<String, Any>

    @Mock
    private lateinit var hashOperations: HashOperations<String, String, Any>

    @Mock
    private lateinit var setOperations: SetOperations<String, Any>

    @Mock
    private lateinit var objectMapper: ObjectMapper

    private lateinit var documentProcessingProperties: DocumentProcessingProperties
    private lateinit var redisJobQueueService: RedisJobQueueService

    @BeforeEach
    fun setUp() {
        documentProcessingProperties = DocumentProcessingProperties()
        
        whenever(redisTemplate.opsForList()).thenReturn(listOperations)
        whenever(redisTemplate.opsForHash<String, Any>()).thenReturn(hashOperations)
        whenever(redisTemplate.opsForSet()).thenReturn(setOperations)

        redisJobQueueService = RedisJobQueueService(
            redisTemplate,
            objectMapper,
            documentProcessingProperties
        )
    }

    @Test
    fun `should enqueue job successfully`() {
        // Given
        val jobRequest = DocumentProcessingJobRequest(
            documentId = "doc123",
            userId = "user123",
            jobType = JobType.DOCUMENT_UPLOAD,
            priority = JobPriority.HIGH
        )

        whenever(listOperations.size(any())).thenReturn(0)
        whenever(listOperations.leftPush(any(), any())).thenReturn(1)

        // When
        val jobId = redisJobQueueService.enqueueJob(jobRequest)

        // Then
        assertNotNull(jobId)
        verify(listOperations).leftPush(eq("aster:jobs:queue:high"), any())
        verify(hashOperations).put(eq("aster:jobs:status"), eq(jobId), any())
    }

    @Test
    fun `should throw exception when queue capacity exceeded`() {
        // Given
        val jobRequest = DocumentProcessingJobRequest(
            documentId = "doc123",
            userId = "user123",
            jobType = JobType.DOCUMENT_UPLOAD,
            priority = JobPriority.HIGH
        )

        whenever(listOperations.size(any())).thenReturn(1001) // Exceeds max capacity

        // When & Then
        org.junit.jupiter.api.assertThrows<IllegalStateException> {
            redisJobQueueService.enqueueJob(jobRequest)
        }
    }

    @Test
    fun `should dequeue high priority job first`() {
        // Given
        val highPriorityJob = JobQueueEntry(
            jobId = "job123",
            documentId = "doc123",
            userId = "user123",
            priority = JobPriority.HIGH,
            jobType = JobType.DOCUMENT_UPLOAD,
            createdAt = Instant.now(),
            ttl = 3600
        )

        whenever(listOperations.rightPop("aster:jobs:queue:high")).thenReturn(highPriorityJob)

        // When
        val dequeuedJob = redisJobQueueService.dequeueJob()

        // Then
        assertNotNull(dequeuedJob)
        assertEquals("job123", dequeuedJob.jobId)
        assertEquals(JobPriority.HIGH, dequeuedJob.priority)
        verify(setOperations).add("aster:jobs:active", "job123")
    }

    @Test
    fun `should dequeue normal priority job when no high priority jobs`() {
        // Given
        val normalPriorityJob = JobQueueEntry(
            jobId = "job123",
            documentId = "doc123",
            userId = "user123",
            priority = JobPriority.NORMAL,
            jobType = JobType.DOCUMENT_UPLOAD,
            createdAt = Instant.now(),
            ttl = 3600
        )

        whenever(listOperations.rightPop("aster:jobs:queue:high")).thenReturn(null)
        whenever(listOperations.rightPop("aster:jobs:queue:normal")).thenReturn(normalPriorityJob)

        // When
        val dequeuedJob = redisJobQueueService.dequeueJob()

        // Then
        assertNotNull(dequeuedJob)
        assertEquals("job123", dequeuedJob.jobId)
        assertEquals(JobPriority.NORMAL, dequeuedJob.priority)
    }

    @Test
    fun `should update job status correctly`() {
        // Given
        val jobId = "job123"
        val status = JobStatus.RUNNING
        val progress = 50
        val details = "Processing in progress"

        // When
        redisJobQueueService.updateJobStatus(jobId, status, progress, details)

        // Then
        verify(hashOperations).put(eq("aster:jobs:status"), eq(jobId), any<JobStatusEntry>())
        verify(listOperations).leftPush(eq("aster:jobs:history:$jobId"), any<JobStatusEntry>())
    }

    @Test
    fun `should get job status correctly`() {
        // Given
        val jobId = "job123"
        val statusEntry = JobStatusEntry(
            jobId = jobId,
            status = JobStatus.RUNNING,
            progress = 50,
            updatedAt = Instant.now()
        )

        whenever(hashOperations.get("aster:jobs:status", jobId)).thenReturn(statusEntry)

        // When
        val result = redisJobQueueService.getJobStatus(jobId)

        // Then
        assertNotNull(result)
        assertEquals(jobId, result.jobId)
        assertEquals(JobStatus.RUNNING, result.status)
        assertEquals(50, result.progress)
    }

    @Test
    fun `should get queue stats correctly`() {
        // Given
        whenever(listOperations.size("aster:jobs:queue:high")).thenReturn(5)
        whenever(listOperations.size("aster:jobs:queue:normal")).thenReturn(10)
        whenever(setOperations.size("aster:jobs:active")).thenReturn(3)
        whenever(hashOperations.entries("aster:jobs:metrics")).thenReturn(mapOf(
            "completedJobs" to 100L,
            "failedJobs" to 5L,
            "averageProcessingTimeMs" to 1500.0
        ))

        // When
        val stats = redisJobQueueService.getQueueStats()

        // Then
        assertEquals(15, stats.totalQueued)
        assertEquals(5, stats.highPriorityQueued)
        assertEquals(10, stats.normalPriorityQueued)
        assertEquals(3, stats.activeJobs)
        assertEquals(100L, stats.completedJobs)
        assertEquals(5L, stats.failedJobs)
        assertEquals(1500.0, stats.averageProcessingTimeMs)
    }

    @Test
    fun `should cancel job successfully`() {
        // Given
        val jobId = "job123"
        val reason = "User requested cancellation"
        val currentStatus = JobStatusEntry(
            jobId = jobId,
            status = JobStatus.RUNNING,
            progress = 30,
            updatedAt = Instant.now()
        )

        whenever(hashOperations.get("aster:jobs:status", jobId)).thenReturn(currentStatus)

        // When
        redisJobQueueService.cancelJob(jobId, reason)

        // Then
        verify(hashOperations).put(eq("aster:jobs:status"), eq(jobId), any<JobStatusEntry>())
        verify(setOperations).remove("aster:jobs:active", jobId)
    }

    @Test
    fun `should throw exception when cancelling terminal job`() {
        // Given
        val jobId = "job123"
        val reason = "User requested cancellation"
        val currentStatus = JobStatusEntry(
            jobId = jobId,
            status = JobStatus.COMPLETED,
            progress = 100,
            updatedAt = Instant.now()
        )

        whenever(hashOperations.get("aster:jobs:status", jobId)).thenReturn(currentStatus)

        // When & Then
        org.junit.jupiter.api.assertThrows<IllegalStateException> {
            redisJobQueueService.cancelJob(jobId, reason)
        }
    }

    @Test
    fun `should retry failed job successfully`() {
        // Given
        val jobId = "job123"
        val failedStatus = JobStatusEntry(
            jobId = jobId,
            status = JobStatus.FAILED,
            progress = 0,
            updatedAt = Instant.now()
        )

        whenever(hashOperations.get("aster:jobs:status", jobId)).thenReturn(failedStatus)

        // When
        val result = redisJobQueueService.retryJob(jobId)

        // Then
        assertEquals(jobId, result)
        verify(hashOperations).put(eq("aster:jobs:status"), eq(jobId), any<JobStatusEntry>())
    }

    @Test
    fun `should throw exception when retrying non-failed job`() {
        // Given
        val jobId = "job123"
        val runningStatus = JobStatusEntry(
            jobId = jobId,
            status = JobStatus.RUNNING,
            progress = 50,
            updatedAt = Instant.now()
        )

        whenever(hashOperations.get("aster:jobs:status", jobId)).thenReturn(runningStatus)

        // When & Then
        org.junit.jupiter.api.assertThrows<IllegalStateException> {
            redisJobQueueService.retryJob(jobId)
        }
    }

    @Test
    fun `should cleanup expired jobs`() {
        // Given
        val expiredJobId = "expired123"
        val activeJobId = "active123"
        
        val expiredStatus = JobStatusEntry(
            jobId = expiredJobId,
            status = JobStatus.COMPLETED,
            progress = 100,
            updatedAt = Instant.now().minusSeconds(7200) // 2 hours ago
        )
        
        val activeStatus = JobStatusEntry(
            jobId = activeJobId,
            status = JobStatus.RUNNING,
            progress = 50,
            updatedAt = Instant.now()
        )

        whenever(hashOperations.keys("aster:jobs:status")).thenReturn(setOf(expiredJobId, activeJobId))
        whenever(hashOperations.get("aster:jobs:status", expiredJobId)).thenReturn(expiredStatus)
        whenever(hashOperations.get("aster:jobs:status", activeJobId)).thenReturn(activeStatus)

        // When
        val cleanedCount = redisJobQueueService.cleanupExpiredJobs()

        // Then
        assertTrue(cleanedCount > 0)
        verify(hashOperations).delete("aster:jobs:status", expiredJobId)
        verify(redisTemplate).delete("aster:jobs:history:$expiredJobId")
    }
}
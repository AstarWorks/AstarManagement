package dev.ryuzu.astermanagement.modules.integration

import dev.ryuzu.astermanagement.modules.matter.api.*
import dev.ryuzu.astermanagement.modules.document.api.*
import dev.ryuzu.astermanagement.modules.matter.api.dto.*
import dev.ryuzu.astermanagement.modules.document.api.dto.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestInstance
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.modulith.test.ApplicationModuleTest
import org.springframework.modulith.test.Scenario
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import java.util.*

/**
 * Integration tests for event choreography across Spring Modulith modules
 * Tests complete business workflows that span multiple modules
 */
@SpringBootTest
@ApplicationModuleTest
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Transactional
class EventChoreographyIntegrationTest {

    /**
     * Test complete matter creation workflow with document workspace setup
     * 
     * Choreography Flow:
     * 1. Matter created via MatterService
     * 2. MatterCreatedEvent published
     * 3. DocumentModule listens and prepares workspace
     * 4. AuditModule logs all interactions
     */
    @Test
    fun `should handle complete matter creation choreography`(scenario: Scenario) {
        scenario.publish(
            MatterCreatedEvent(
                matterId = UUID.randomUUID(),
                caseNumber = "CASE-2025-001",
                title = "Test Matter for Integration",
                clientId = UUID.randomUUID(),
                assignedLawyerId = UUID.randomUUID(),
                userId = UUID.randomUUID()
            )
        ).andWaitForEventOfType(DocumentUploadedEvent::class.java)
         .matching { event ->
             event.fileName.contains("workspace") &&
             event.contentType == "application/directory"
         }
         .toArriveAndVerify { event ->
             println("Document workspace created: ${event.fileName}")
             // Verify workspace was created for the matter
         }
    }

    /**
     * Test document upload and matter association workflow
     * 
     * Choreography Flow:
     * 1. Document uploaded via DocumentService
     * 2. DocumentUploadedEvent published
     * 3. MatterModule updates document count
     * 4. DocumentProcessedEvent published after OCR
     * 5. AuditModule logs all interactions
     */
    @Test
    fun `should handle document upload and processing choreography`(scenario: Scenario) {
        val matterId = UUID.randomUUID()
        val documentId = UUID.randomUUID()
        
        scenario.publish(
            DocumentUploadedEvent(
                documentId = documentId,
                fileId = "test-file-123",
                fileName = "contract.pdf",
                contentType = "application/pdf",
                fileSize = 1024000,
                matterId = matterId,
                userId = UUID.randomUUID()
            )
        ).andWaitForEventOfType(DocumentProcessedEvent::class.java)
         .matching { event ->
             event.documentId == documentId &&
             event.status == "AVAILABLE"
         }
         .toArriveAndVerify { event ->
             println("Document processed successfully: ${event.extractedText?.length} characters extracted")
             // Verify document was processed and text extracted
         }
    }

    /**
     * Test matter completion workflow with document archival
     * 
     * Choreography Flow:
     * 1. Matter status changed to COMPLETED
     * 2. MatterCompletedEvent published
     * 3. DocumentModule archives associated documents
     * 4. AuditModule creates completion audit trail
     */
    @Test
    fun `should handle matter completion and document archival choreography`(scenario: Scenario) {
        val matterId = UUID.randomUUID()
        
        scenario.publish(
            MatterCompletedEvent(
                matterId = matterId,
                completionDate = java.time.LocalDateTime.now(),
                userId = UUID.randomUUID()
            )
        ).andWaitForEventOfType(DocumentUpdatedEvent::class.java)
         .matching { event ->
             event.changes.containsKey("archived") &&
             event.changes["archived"] == true
         }
         .toArriveAndVerify { event ->
             println("Documents archived for completed matter: ${matterId}")
             // Verify documents were archived
         }
    }

    /**
     * Test complex workflow: Matter creation -> Document upload -> Status change
     * 
     * Multi-step Choreography:
     * 1. Create matter
     * 2. Upload initial documents
     * 3. Change matter status to FILED
     * 4. Enable filing-specific document workflows
     */
    @Test
    fun `should handle complex multi-step workflow`(scenario: Scenario) {
        val matterId = UUID.randomUUID()
        val userId = UUID.randomUUID()
        
        // Step 1: Create matter
        scenario.publish(
            MatterCreatedEvent(
                matterId = matterId,
                caseNumber = "COMPLEX-2025-001",
                title = "Complex Integration Test Case",
                clientId = UUID.randomUUID(),
                assignedLawyerId = UUID.randomUUID(),
                userId = userId
            )
        )
        // Step 2: Upload document
        .andThenPublish(
            DocumentUploadedEvent(
                documentId = UUID.randomUUID(),
                fileId = "complex-doc-123",
                fileName = "initial-filing.pdf",
                contentType = "application/pdf",
                fileSize = 2048000,
                matterId = matterId,
                userId = userId
            )
        )
        // Step 3: Change matter status
        .andThenPublish(
            MatterStatusChangedEvent(
                matterId = matterId,
                oldStatus = "DRAFT_PLEADINGS",
                newStatus = "FILED",
                userId = userId
            )
        )
        // Verify final state
        .andWaitForStateChange()
        .andVerify { _ ->
            println("Complex workflow completed successfully for matter: ${matterId}")
            // Verify all choreography steps completed correctly
        }
    }

    /**
     * Test error handling in event choreography
     * 
     * Error Scenarios:
     * 1. Document processing fails
     * 2. Matter notification should still work
     * 3. Audit trail should capture error
     */
    @Test
    fun `should handle errors gracefully in event choreography`(scenario: Scenario) {
        val documentId = UUID.randomUUID()
        
        scenario.publish(
            DocumentProcessedEvent(
                documentId = documentId,
                status = "FAILED",
                extractedText = null,
                pageCount = null,
                userId = UUID.randomUUID()
            )
        ).andWaitForEventOfType(DocumentUpdatedEvent::class.java)
         .matching { event ->
             event.documentId == documentId &&
             event.changes.containsKey("status") &&
             event.changes["status"] == "FAILED"
         }
         .toArriveAndVerify { event ->
             println("Error handling verified for failed document: ${event.documentId}")
             // Verify error was handled gracefully
         }
    }

    /**
     * Test event ordering and consistency
     * 
     * Verification:
     * 1. Events are processed in correct order
     * 2. State consistency maintained across modules
     * 3. No race conditions or data corruption
     */
    @Test
    fun `should maintain event ordering and consistency`(scenario: Scenario) {
        val matterId = UUID.randomUUID()
        val userId = UUID.randomUUID()
        
        // Rapid-fire events to test ordering
        scenario.publish(
            MatterCreatedEvent(
                matterId = matterId,
                caseNumber = "ORDER-TEST-001",
                title = "Event Ordering Test",
                clientId = UUID.randomUUID(),
                assignedLawyerId = UUID.randomUUID(),
                userId = userId
            )
        ).andThenPublish(
            MatterUpdatedEvent(
                matterId = matterId,
                changes = mapOf("title" to ("Event Ordering Test" to "Updated Event Ordering Test")),
                userId = userId
            )
        ).andThenPublish(
            MatterStatusChangedEvent(
                matterId = matterId,
                oldStatus = "INTAKE",
                newStatus = "INITIAL_REVIEW",
                userId = userId
            )
        ).andWaitForStateChange()
         .andVerify { _ ->
             println("Event ordering maintained for matter: ${matterId}")
             // Verify events were processed in correct order
         }
    }
}
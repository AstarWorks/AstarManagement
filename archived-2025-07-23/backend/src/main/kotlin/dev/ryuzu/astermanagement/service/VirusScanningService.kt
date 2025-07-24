package dev.ryuzu.astermanagement.service

import java.time.OffsetDateTime
import java.util.*

/**
 * Service interface for virus scanning functionality
 */
interface VirusScanningService {
    
    /**
     * Scan a document for viruses
     * 
     * @param documentId The document ID to scan
     * @return Virus scan result
     */
    fun scanDocument(documentId: UUID): VirusScanResult
    
    /**
     * Scan a file path for viruses
     * 
     * @param filePath The file path to scan
     * @return Virus scan result
     */
    fun scanFile(filePath: String): VirusScanResult
}

/**
 * Result of virus scanning operation
 */
data class VirusScanResult(
    val clean: Boolean,
    val threats: List<String> = emptyList(),
    val scanEngine: String,
    val scanDate: OffsetDateTime = OffsetDateTime.now()
)
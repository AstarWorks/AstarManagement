package dev.ryuzu.astermanagement.domain.batch

/**
 * Enum representing the various states of a document processing job
 */
enum class JobStatus {
    QUEUED,
    RUNNING,
    COMPLETED,
    FAILED,
    CANCELLED,
    RETRYING
}

/**
 * Enum representing job priority levels
 */
enum class JobPriority {
    HIGH,
    NORMAL
}

/**
 * Enum representing different types of document processing jobs
 */
enum class JobType {
    DOCUMENT_UPLOAD,
    THUMBNAIL_GENERATION,
    VIRUS_SCAN,
    OCR_PROCESSING,
    METADATA_EXTRACTION,
    FILE_VALIDATION,
    DOCUMENT_CONVERSION,
    BATCH_PROCESSING
}
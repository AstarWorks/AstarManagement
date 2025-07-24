package dev.ryuzu.astermanagement.config

import dev.ryuzu.astermanagement.service.batch.DocumentProcessingJobListener
import dev.ryuzu.astermanagement.service.batch.DocumentProcessingStepFactory
import org.slf4j.LoggerFactory
import org.springframework.batch.core.Job
import org.springframework.batch.core.configuration.annotation.EnableBatchProcessing
import org.springframework.batch.core.job.builder.JobBuilder
import org.springframework.batch.core.launch.JobLauncher
import org.springframework.batch.core.launch.support.TaskExecutorJobLauncher
import org.springframework.batch.core.repository.JobRepository
import org.springframework.batch.core.repository.support.JobRepositoryFactoryBean
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Primary
import org.springframework.core.task.TaskExecutor
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor
import org.springframework.transaction.PlatformTransactionManager
import javax.sql.DataSource

/**
 * Spring Batch configuration for document processing
 * Sets up job repository, launcher, and core document processing jobs
 */
@Configuration
@EnableBatchProcessing
@EnableConfigurationProperties(DocumentProcessingProperties::class)
class DocumentProcessingBatchConfig(
    private val dataSource: DataSource,
    private val transactionManager: PlatformTransactionManager,
    private val documentProcessingProperties: DocumentProcessingProperties
) {
    
    companion object {
        private val logger = LoggerFactory.getLogger(DocumentProcessingBatchConfig::class.java)
    }
    
    /**
     * Job repository configuration with PostgreSQL backend
     */
    @Bean
    fun jobRepository(): JobRepository {
        val factoryBean = JobRepositoryFactoryBean().apply {
            setDataSource(dataSource)
            setTransactionManager(transactionManager)
            setIsolationLevelForCreate("ISOLATION_SERIALIZABLE")
            setTablePrefix("BATCH_")
            setMaxVarCharLength(1000)
            afterPropertiesSet()
        }
        
        logger.info("JobRepository configured with PostgreSQL backend")
        return factoryBean.getObject()
    }
    
    /**
     * Job launcher with async execution capabilities
     */
    @Bean
    fun jobLauncher(jobRepository: JobRepository): JobLauncher {
        val jobLauncher = TaskExecutorJobLauncher().apply {
            setJobRepository(jobRepository)
            setTaskExecutor(jobExecutionTaskExecutor())
            afterPropertiesSet()
        }
        
        logger.info("JobLauncher configured with async execution")
        return jobLauncher
    }
    
    /**
     * Task executor for job execution with configured thread pool
     */
    @Bean
    @Primary
    fun jobExecutionTaskExecutor(): TaskExecutor {
        val executor = ThreadPoolTaskExecutor().apply {
            corePoolSize = documentProcessingProperties.concurrency.corePoolSize
            maxPoolSize = documentProcessingProperties.concurrency.maxPoolSize
            queueCapacity = documentProcessingProperties.concurrency.queueCapacity
            keepAliveSeconds = documentProcessingProperties.concurrency.keepAliveSeconds
            setAllowCoreThreadTimeOut(documentProcessingProperties.concurrency.allowCoreThreadTimeout)
            setThreadNamePrefix("doc-processing-")
            setRejectedExecutionHandler { runnable, _ ->
                logger.warn("Document processing task rejected, consider increasing thread pool size")
                throw RuntimeException("Document processing queue is full")
            }
            initialize()
        }
        
        logger.info("Job execution TaskExecutor configured: core={}, max={}, queue={}", 
            documentProcessingProperties.concurrency.corePoolSize,
            documentProcessingProperties.concurrency.maxPoolSize,
            documentProcessingProperties.concurrency.queueCapacity)
        
        return executor
    }
    
    /**
     * Main document processing job definition
     */
    @Bean
    fun documentProcessingJob(
        jobRepository: JobRepository,
        documentProcessingStepFactory: DocumentProcessingStepFactory,
        documentProcessingJobListener: DocumentProcessingJobListener
    ): Job {
        return JobBuilder("documentProcessingJob", jobRepository)
            .start(documentProcessingStepFactory.createInitializationStep())
            .next(documentProcessingStepFactory.createValidationStep())
            .next(documentProcessingStepFactory.createProcessingStep())
            .next(documentProcessingStepFactory.createFinalizationStep())
            .listener(documentProcessingJobListener)
            .build()
            .also {
                logger.info("Document processing job configured with {} steps", 4)
            }
    }
    
    /**
     * Thumbnail generation job for quick image processing
     */
    @Bean
    fun thumbnailGenerationJob(
        jobRepository: JobRepository,
        documentProcessingStepFactory: DocumentProcessingStepFactory,
        documentProcessingJobListener: DocumentProcessingJobListener
    ): Job {
        return JobBuilder("thumbnailGenerationJob", jobRepository)
            .start(documentProcessingStepFactory.createThumbnailStep())
            .listener(documentProcessingJobListener)
            .build()
            .also {
                logger.info("Thumbnail generation job configured")
            }
    }
    
    /**
     * Virus scanning job for security validation
     */
    @Bean
    fun virusScanningJob(
        jobRepository: JobRepository,
        documentProcessingStepFactory: DocumentProcessingStepFactory,
        documentProcessingJobListener: DocumentProcessingJobListener
    ): Job {
        return JobBuilder("virusScanningJob", jobRepository)
            .start(documentProcessingStepFactory.createVirusScanStep())
            .listener(documentProcessingJobListener)
            .build()
            .also {
                logger.info("Virus scanning job configured")
            }
    }
    
    /**
     * OCR processing job for text extraction
     */
    @Bean
    fun ocrProcessingJob(
        jobRepository: JobRepository,
        documentProcessingStepFactory: DocumentProcessingStepFactory,
        documentProcessingJobListener: DocumentProcessingJobListener
    ): Job {
        return JobBuilder("ocrProcessingJob", jobRepository)
            .start(documentProcessingStepFactory.createOcrStep())
            .listener(documentProcessingJobListener)
            .build()
            .also {
                logger.info("OCR processing job configured")
            }
    }
    
    /**
     * Batch processing job for multiple documents
     */
    @Bean
    fun batchProcessingJob(
        jobRepository: JobRepository,
        documentProcessingStepFactory: DocumentProcessingStepFactory,
        documentProcessingJobListener: DocumentProcessingJobListener
    ): Job {
        return JobBuilder("batchProcessingJob", jobRepository)
            .start(documentProcessingStepFactory.createBatchInitializationStep())
            .next(documentProcessingStepFactory.createBatchValidationStep())
            .next(documentProcessingStepFactory.createBatchProcessingStep())
            .next(documentProcessingStepFactory.createBatchFinalizationStep())
            .listener(documentProcessingJobListener)
            .build()
            .also {
                logger.info("Batch processing job configured with {} steps", 4)
            }
    }
}
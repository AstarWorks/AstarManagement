package dev.ryuzu.astermanagement.modules.visualization

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestInstance
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.modulith.core.ApplicationModules
import org.springframework.modulith.docs.Documenter
import org.springframework.test.context.ActiveProfiles
import java.io.File
import java.io.FileWriter

/**
 * Test class for generating module dependency visualizations and documentation
 * Creates various diagrams and reports for understanding the Spring Modulith architecture
 */
@SpringBootTest
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ModuleDependencyVisualizationTest {

    @Test
    fun generateComprehensiveModuleDocumentation() {
        val modules = ApplicationModules.of("dev.ryuzu.astermanagement")
        
        // Generate standard Spring Modulith documentation
        Documenter(modules)
            .writeDocumentation()
            .writeIndividualModulesAsPlantUml()
        
        println("✅ Standard Spring Modulith documentation generated")
        println("   Location: build/spring-modulith-docs/")
    }

    @Test
    fun generateModuleDependencyGraph() {
        val modules = ApplicationModules.of("dev.ryuzu.astermanagement")
        
        val graphContent = StringBuilder()
        graphContent.appendLine("@startuml Spring_Modulith_Module_Dependencies")
        graphContent.appendLine("!theme plain")
        graphContent.appendLine("skinparam componentStyle rectangle")
        graphContent.appendLine("skinparam component {")
        graphContent.appendLine("  BackgroundColor lightblue")
        graphContent.appendLine("  BorderColor darkblue")
        graphContent.appendLine("}")
        graphContent.appendLine()
        
        // Add modules as components
        modules.forEach { module ->
            val moduleName = module.name.replaceFirstChar { it.uppercase() }
            graphContent.appendLine("component \"$moduleName Module\" as ${module.name} {")
            
            // Add API layer
            graphContent.appendLine("  interface \"${moduleName}Service\" as ${module.name}_api")
            graphContent.appendLine("  component \"${moduleName}ServiceImpl\" as ${module.name}_impl")
            graphContent.appendLine("  component \"${moduleName}Controller\" as ${module.name}_ctrl")
            graphContent.appendLine("  database \"${moduleName}Repository\" as ${module.name}_repo")
            
            // Internal connections
            graphContent.appendLine("  ${module.name}_ctrl --> ${module.name}_api")
            graphContent.appendLine("  ${module.name}_impl ..|> ${module.name}_api")
            graphContent.appendLine("  ${module.name}_impl --> ${module.name}_repo")
            
            graphContent.appendLine("}")
            graphContent.appendLine()
        }
        
        // Add inter-module dependencies
        modules.forEach { module ->
            module.dependencies.forEach { dependency ->
                if (modules.any { it.name == dependency.name }) {
                    graphContent.appendLine("${module.name} ..> ${dependency.name} : uses API")
                }
            }
        }
        
        // Add event flows
        graphContent.appendLine()
        graphContent.appendLine("' Event-driven communication")
        graphContent.appendLine("component \"Event Bus\" as eventbus {")
        graphContent.appendLine("  interface \"ApplicationEventPublisher\" as pub")
        graphContent.appendLine("  interface \"ApplicationModuleListener\" as sub")
        graphContent.appendLine("}")
        
        // Connect modules to event bus
        listOf("matter", "document", "audit").forEach { moduleName ->
            if (modules.any { it.name == moduleName }) {
                graphContent.appendLine("${moduleName} --> pub : publishes events")
                graphContent.appendLine("sub --> ${moduleName} : receives events")
            }
        }
        
        graphContent.appendLine()
        graphContent.appendLine("@enduml")
        
        // Write to file
        val outputDir = File("build/module-docs")
        outputDir.mkdirs()
        val outputFile = File(outputDir, "module-dependency-graph.puml")
        FileWriter(outputFile).use { writer ->
            writer.write(graphContent.toString())
        }
        
        println("✅ Module dependency graph generated")
        println("   Location: ${outputFile.absolutePath}")
    }

    @Test
    fun generateEventFlowDiagram() {
        val eventFlowContent = StringBuilder()
        eventFlowContent.appendLine("@startuml Event_Flow_Choreography")
        eventFlowContent.appendLine("!theme plain")
        eventFlowContent.appendLine("skinparam sequence {")
        eventFlowContent.appendLine("  ArrowColor darkblue")
        eventFlowContent.appendLine("  ActorBorderColor darkblue")
        eventFlowContent.appendLine("  LifeLineBorderColor blue")
        eventFlowContent.appendLine("  ParticipantBorderColor darkblue")
        eventFlowContent.appendLine("}")
        eventFlowContent.appendLine()
        
        // Participants
        eventFlowContent.appendLine("actor Client")
        eventFlowContent.appendLine("participant \"Matter Module\" as Matter")
        eventFlowContent.appendLine("participant \"Document Module\" as Document")
        eventFlowContent.appendLine("participant \"Audit Module\" as Audit")
        eventFlowContent.appendLine("participant \"Event Bus\" as Events")
        eventFlowContent.appendLine()
        
        // Matter Creation Workflow
        eventFlowContent.appendLine("== Matter Creation with Document Workflow ==")
        eventFlowContent.appendLine("Client -> Matter: createMatter()")
        eventFlowContent.appendLine("activate Matter")
        eventFlowContent.appendLine("Matter -> Matter: save(matter)")
        eventFlowContent.appendLine("Matter -> Events: publish(MatterCreatedEvent)")
        eventFlowContent.appendLine("deactivate Matter")
        eventFlowContent.appendLine()
        
        eventFlowContent.appendLine("Events -> Document: on(MatterCreatedEvent)")
        eventFlowContent.appendLine("activate Document")
        eventFlowContent.appendLine("Document -> Document: createWorkspace()")
        eventFlowContent.appendLine("Document -> Events: publish(DocumentUploadedEvent)")
        eventFlowContent.appendLine("deactivate Document")
        eventFlowContent.appendLine()
        
        eventFlowContent.appendLine("Events -> Audit: on(MatterCreatedEvent)")
        eventFlowContent.appendLine("activate Audit")
        eventFlowContent.appendLine("Audit -> Audit: logMatterCreation()")
        eventFlowContent.appendLine("deactivate Audit")
        eventFlowContent.appendLine()
        
        eventFlowContent.appendLine("Events -> Audit: on(DocumentUploadedEvent)")
        eventFlowContent.appendLine("activate Audit")
        eventFlowContent.appendLine("Audit -> Audit: logDocumentUpload()")
        eventFlowContent.appendLine("deactivate Audit")
        eventFlowContent.appendLine()
        
        // Document Processing Workflow
        eventFlowContent.appendLine("== Document Processing Workflow ==")
        eventFlowContent.appendLine("Client -> Document: uploadDocument()")
        eventFlowContent.appendLine("activate Document")
        eventFlowContent.appendLine("Document -> Document: save(document)")
        eventFlowContent.appendLine("Document -> Events: publish(DocumentUploadedEvent)")
        eventFlowContent.appendLine("Document -> Document: processDocument()")
        eventFlowContent.appendLine("Document -> Events: publish(DocumentProcessedEvent)")
        eventFlowContent.appendLine("deactivate Document")
        eventFlowContent.appendLine()
        
        eventFlowContent.appendLine("Events -> Matter: on(DocumentProcessedEvent)")
        eventFlowContent.appendLine("activate Matter")
        eventFlowContent.appendLine("Matter -> Matter: updateDocumentCount()")
        eventFlowContent.appendLine("deactivate Matter")
        eventFlowContent.appendLine()
        
        // Matter Status Change Workflow
        eventFlowContent.appendLine("== Matter Status Change Workflow ==")
        eventFlowContent.appendLine("Client -> Matter: updateStatus()")
        eventFlowContent.appendLine("activate Matter")
        eventFlowContent.appendLine("Matter -> Matter: validateTransition()")
        eventFlowContent.appendLine("Matter -> Matter: updateStatus()")
        eventFlowContent.appendLine("Matter -> Events: publish(MatterStatusChangedEvent)")
        eventFlowContent.appendLine("deactivate Matter")
        eventFlowContent.appendLine()
        
        eventFlowContent.appendLine("Events -> Audit: on(MatterStatusChangedEvent)")
        eventFlowContent.appendLine("activate Audit")
        eventFlowContent.appendLine("Audit -> Audit: logStatusChange()")
        eventFlowContent.appendLine("deactivate Audit")
        eventFlowContent.appendLine()
        
        eventFlowContent.appendLine("@enduml")
        
        // Write to file
        val outputDir = File("build/module-docs")
        outputDir.mkdirs()
        val outputFile = File(outputDir, "event-flow-choreography.puml")
        FileWriter(outputFile).use { writer ->
            writer.write(eventFlowContent.toString())
        }
        
        println("✅ Event flow choreography diagram generated")
        println("   Location: ${outputFile.absolutePath}")
    }

    @Test
    fun generateModuleAPIDocumentation() {
        val modules = ApplicationModules.of("dev.ryuzu.astermanagement")
        
        val apiDocContent = StringBuilder()
        apiDocContent.appendLine("# Spring Modulith API Documentation")
        apiDocContent.appendLine()
        apiDocContent.appendLine("Generated: ${java.time.LocalDateTime.now()}")
        apiDocContent.appendLine()
        
        modules.forEach { module ->
            apiDocContent.appendLine("## ${module.name.replaceFirstChar { it.uppercase() }} Module")
            apiDocContent.appendLine()
            apiDocContent.appendLine("**Base Package:** `${module.basePackage}`")
            apiDocContent.appendLine()
            
            // API Interfaces
            apiDocContent.appendLine("### Public API")
            val apiInterfaces = module.namedInterfaces.filter { it.name.contains("api") }
            if (apiInterfaces.isNotEmpty()) {
                apiInterfaces.forEach { interface ->
                    apiDocContent.appendLine("- `${interface.name}`")
                }
            } else {
                apiDocContent.appendLine("- No public API interfaces exposed")
            }
            apiDocContent.appendLine()
            
            // Dependencies
            apiDocContent.appendLine("### Dependencies")
            if (module.dependencies.isNotEmpty()) {
                module.dependencies.forEach { dependency ->
                    apiDocContent.appendLine("- `${dependency.name}`")
                }
            } else {
                apiDocContent.appendLine("- No external dependencies")
            }
            apiDocContent.appendLine()
            
            // Event Types (if it's a known module)
            when (module.name) {
                "matter" -> {
                    apiDocContent.appendLine("### Published Events")
                    apiDocContent.appendLine("- `MatterCreatedEvent`")
                    apiDocContent.appendLine("- `MatterUpdatedEvent`")
                    apiDocContent.appendLine("- `MatterStatusChangedEvent`")
                    apiDocContent.appendLine("- `MatterAssignedEvent`")
                    apiDocContent.appendLine("- `MatterCompletedEvent`")
                    apiDocContent.appendLine("- `MatterDeletedEvent`")
                    apiDocContent.appendLine("- `MatterDocumentsRequestedEvent`")
                }
                "document" -> {
                    apiDocContent.appendLine("### Published Events")
                    apiDocContent.appendLine("- `DocumentUploadedEvent`")
                    apiDocContent.appendLine("- `DocumentProcessedEvent`")
                    apiDocContent.appendLine("- `DocumentAssociatedWithMatterEvent`")
                    apiDocContent.appendLine("- `DocumentDisassociatedFromMatterEvent`")
                    apiDocContent.appendLine("- `DocumentUpdatedEvent`")
                    apiDocContent.appendLine("- `DocumentDeletedEvent`")
                    apiDocContent.appendLine("- `DocumentVersionCreatedEvent`")
                    apiDocContent.appendLine("- `DocumentAccessedEvent`")
                    apiDocContent.appendLine("- `DocumentIndexedEvent`")
                }
                "audit" -> {
                    apiDocContent.appendLine("### Event Listeners")
                    apiDocContent.appendLine("- Listens to all Matter module events")
                    apiDocContent.appendLine("- Listens to all Document module events")
                    apiDocContent.appendLine("- Provides comprehensive audit trail")
                }
            }
            apiDocContent.appendLine()
            apiDocContent.appendLine("---")
            apiDocContent.appendLine()
        }
        
        // Write to file
        val outputDir = File("build/module-docs")
        outputDir.mkdirs()
        val outputFile = File(outputDir, "module-api-documentation.md")
        FileWriter(outputFile).use { writer ->
            writer.write(apiDocContent.toString())
        }
        
        println("✅ Module API documentation generated")
        println("   Location: ${outputFile.absolutePath}")
    }

    @Test
    fun generateMicroserviceExtractionGuide() {
        val extractionGuideContent = StringBuilder()
        extractionGuideContent.appendLine("# Microservice Extraction Pattern")
        extractionGuideContent.appendLine()
        extractionGuideContent.appendLine("## Overview")
        extractionGuideContent.appendLine("This guide demonstrates how to extract Spring Modulith modules into independent microservices.")
        extractionGuideContent.appendLine()
        
        extractionGuideContent.appendLine("## Current Module Structure")
        extractionGuideContent.appendLine("```")
        extractionGuideContent.appendLine("Aster Management Monolith")
        extractionGuideContent.appendLine("├── matter/ (module)")
        extractionGuideContent.appendLine("├── document/ (module)")
        extractionGuideContent.appendLine("└── audit/ (module)")
        extractionGuideContent.appendLine("```")
        extractionGuideContent.appendLine()
        
        extractionGuideContent.appendLine("## Step 1: Extract Document Module")
        extractionGuideContent.appendLine()
        extractionGuideContent.appendLine("### 1.1 Create New Service")
        extractionGuideContent.appendLine("```kotlin")
        extractionGuideContent.appendLine("// New document-service project")
        extractionGuideContent.appendLine("@SpringBootApplication")
        extractionGuideContent.appendLine("class DocumentServiceApplication")
        extractionGuideContent.appendLine("```")
        extractionGuideContent.appendLine()
        
        extractionGuideContent.appendLine("### 1.2 Move Module Code")
        extractionGuideContent.appendLine("- Copy `modules/document/` to new service")
        extractionGuideContent.appendLine("- Remove Spring Modulith dependencies")
        extractionGuideContent.appendLine("- Add message broker dependencies (RabbitMQ/Kafka)")
        extractionGuideContent.appendLine()
        
        extractionGuideContent.appendLine("### 1.3 Replace Events with Messages")
        extractionGuideContent.appendLine("```kotlin")
        extractionGuideContent.appendLine("// Before: Spring Modulith events")
        extractionGuideContent.appendLine("@ApplicationModuleListener")
        extractionGuideContent.appendLine("fun on(event: DocumentUploadedEvent) { }")
        extractionGuideContent.appendLine()
        extractionGuideContent.appendLine("// After: Message broker")
        extractionGuideContent.appendLine("@RabbitListener(queues = [\"document.uploaded\"])")
        extractionGuideContent.appendLine("fun onDocumentUploaded(event: DocumentUploadedEvent) { }")
        extractionGuideContent.appendLine("```")
        extractionGuideContent.appendLine()
        
        extractionGuideContent.appendLine("### 1.4 Extract Database")
        extractionGuideContent.appendLine("- Move document tables to separate database")
        extractionGuideContent.appendLine("- Update connection strings")
        extractionGuideContent.appendLine("- Implement data consistency patterns")
        extractionGuideContent.appendLine()
        
        extractionGuideContent.appendLine("### 1.5 API Gateway Routing")
        extractionGuideContent.appendLine("```yaml")
        extractionGuideContent.appendLine("# API Gateway configuration")
        extractionGuideContent.appendLine("routes:")
        extractionGuideContent.appendLine("  - id: document-service")
        extractionGuideContent.appendLine("    uri: http://document-service:8080")
        extractionGuideContent.appendLine("    predicates:")
        extractionGuideContent.appendLine("      - Path=/api/documents/**")
        extractionGuideContent.appendLine("```")
        extractionGuideContent.appendLine()
        
        extractionGuideContent.appendLine("## Step 2: Update Matter Module")
        extractionGuideContent.appendLine()
        extractionGuideContent.appendLine("### 2.1 Remove Direct Dependencies")
        extractionGuideContent.appendLine("```kotlin")
        extractionGuideContent.appendLine("// Remove document module dependencies")
        extractionGuideContent.appendLine("// Replace with HTTP client or message publishing")
        extractionGuideContent.appendLine("@FeignClient(\"document-service\")")
        extractionGuideContent.appendLine("interface DocumentServiceClient {")
        extractionGuideContent.appendLine("    @GetMapping(\"/api/documents/matter/{matterId}\")")
        extractionGuideContent.appendLine("    fun getDocumentsByMatter(@PathVariable matterId: UUID): List<DocumentDTO>")
        extractionGuideContent.appendLine("}")
        extractionGuideContent.appendLine("```")
        extractionGuideContent.appendLine()
        
        extractionGuideContent.appendLine("## Step 3: Benefits Achieved")
        extractionGuideContent.appendLine()
        extractionGuideContent.appendLine("### 3.1 Independent Deployment")
        extractionGuideContent.appendLine("- Document service can be deployed independently")
        extractionGuideContent.appendLine("- Different release cycles")
        extractionGuideContent.appendLine("- Technology stack flexibility")
        extractionGuideContent.appendLine()
        
        extractionGuideContent.appendLine("### 3.2 Scalability")
        extractionGuideContent.appendLine("- Scale document processing independently")
        extractionGuideContent.appendLine("- Different resource requirements")
        extractionGuideContent.appendLine("- Horizontal scaling by service")
        extractionGuideContent.appendLine()
        
        extractionGuideContent.appendLine("### 3.3 Fault Isolation")
        extractionGuideContent.appendLine("- Document service failures don't affect matter management")
        extractionGuideContent.appendLine("- Circuit breaker patterns")
        extractionGuideContent.appendLine("- Graceful degradation")
        extractionGuideContent.appendLine()
        
        extractionGuideContent.appendLine("## Implementation Checklist")
        extractionGuideContent.appendLine()
        extractionGuideContent.appendLine("- [ ] Set up message broker (RabbitMQ/Kafka)")
        extractionGuideContent.appendLine("- [ ] Create document-service project")
        extractionGuideContent.appendLine("- [ ] Move document module code")
        extractionGuideContent.appendLine("- [ ] Replace events with messages")
        extractionGuideContent.appendLine("- [ ] Extract document database")
        extractionGuideContent.appendLine("- [ ] Configure API gateway")
        extractionGuideContent.appendLine("- [ ] Update matter module dependencies")
        extractionGuideContent.appendLine("- [ ] Implement circuit breakers")
        extractionGuideContent.appendLine("- [ ] Set up monitoring and tracing")
        extractionGuideContent.appendLine("- [ ] Test end-to-end workflows")
        extractionGuideContent.appendLine("- [ ] Plan rollback strategy")
        extractionGuideContent.appendLine()
        
        // Write to file
        val outputDir = File("build/module-docs")
        outputDir.mkdirs()
        val outputFile = File(outputDir, "microservice-extraction-pattern.md")
        FileWriter(outputFile).use { writer ->
            writer.write(extractionGuideContent.toString())
        }
        
        println("✅ Microservice extraction pattern guide generated")
        println("   Location: ${outputFile.absolutePath}")
    }

    @Test
    fun generateComprehensiveVisualizationSummary() {
        val outputDir = File("build/module-docs")
        outputDir.mkdirs()
        
        val summaryContent = StringBuilder()
        summaryContent.appendLine("# Spring Modulith Visualization and Documentation Summary")
        summaryContent.appendLine()
        summaryContent.appendLine("Generated: ${java.time.LocalDateTime.now()}")
        summaryContent.appendLine()
        
        summaryContent.appendLine("## Generated Documentation")
        summaryContent.appendLine()
        summaryContent.appendLine("### 1. Module Dependencies")
        summaryContent.appendLine("- **File:** `module-dependency-graph.puml`")
        summaryContent.appendLine("- **Description:** PlantUML diagram showing module relationships and API boundaries")
        summaryContent.appendLine("- **Usage:** Open in PlantUML viewer or generate PNG/SVG")
        summaryContent.appendLine()
        
        summaryContent.appendLine("### 2. Event Flow Choreography")
        summaryContent.appendLine("- **File:** `event-flow-choreography.puml`")
        summaryContent.appendLine("- **Description:** Sequence diagrams for major event-driven workflows")
        summaryContent.appendLine("- **Workflows Covered:** Matter creation, document processing, status changes")
        summaryContent.appendLine()
        
        summaryContent.appendLine("### 3. Module API Documentation")
        summaryContent.appendLine("- **File:** `module-api-documentation.md`")
        summaryContent.appendLine("- **Description:** Comprehensive API reference for all modules")
        summaryContent.appendLine("- **Includes:** Public interfaces, events, dependencies")
        summaryContent.appendLine()
        
        summaryContent.appendLine("### 4. Microservice Extraction Guide")
        summaryContent.appendLine("- **File:** `microservice-extraction-pattern.md`")
        summaryContent.appendLine("- **Description:** Step-by-step guide for extracting modules to microservices")
        summaryContent.appendLine("- **Example:** Document module extraction with message broker integration")
        summaryContent.appendLine()
        
        summaryContent.appendLine("### 5. Spring Modulith Standard Docs")
        summaryContent.appendLine("- **Location:** `build/spring-modulith-docs/`")
        summaryContent.appendLine("- **Description:** Auto-generated Spring Modulith documentation")
        summaryContent.appendLine("- **Includes:** Module structure, dependencies, PlantUML diagrams")
        summaryContent.appendLine()
        
        summaryContent.appendLine("## Architecture Highlights")
        summaryContent.appendLine()
        summaryContent.appendLine("### Module Structure")
        summaryContent.appendLine("- **3 Core Modules:** Matter, Document, Audit")
        summaryContent.appendLine("- **Clear Boundaries:** API/Domain/Infrastructure separation")
        summaryContent.appendLine("- **Event-Driven:** 19+ event types for cross-module communication")
        summaryContent.appendLine()
        
        summaryContent.appendLine("### Event Choreography")
        summaryContent.appendLine("- **Asynchronous Processing:** Non-blocking event handling")
        summaryContent.appendLine("- **Audit Trail:** Comprehensive logging of all interactions")
        summaryContent.appendLine("- **Performance Monitoring:** Metrics and observability built-in")
        summaryContent.appendLine()
        
        summaryContent.appendLine("### Microservice Readiness")
        summaryContent.appendLine("- **Clean APIs:** Well-defined module interfaces")
        summaryContent.appendLine("- **Event Externalization:** @Externalized annotations for external messaging")
        summaryContent.appendLine("- **Database Separation:** Independent data models per module")
        summaryContent.appendLine()
        
        summaryContent.appendLine("## Next Steps")
        summaryContent.appendLine()
        summaryContent.appendLine("1. **Review Generated Diagrams:** Validate architecture understanding")
        summaryContent.appendLine("2. **Update Documentation:** Keep docs in sync with code changes")
        summaryContent.appendLine("3. **Plan Microservice Migration:** Use extraction guide when ready to scale")
        summaryContent.appendLine("4. **Monitor Performance:** Use built-in metrics for production readiness")
        summaryContent.appendLine()
        
        val summaryFile = File(outputDir, "README.md")
        FileWriter(summaryFile).use { writer ->
            writer.write(summaryContent.toString())
        }
        
        println("✅ Comprehensive visualization summary generated")
        println("   Location: ${summaryFile.absolutePath}")
        println()
        println("📁 All documentation files created in: ${outputDir.absolutePath}")
        
        // List all generated files
        outputDir.listFiles()?.forEach { file ->
            println("   - ${file.name}")
        }
    }
}
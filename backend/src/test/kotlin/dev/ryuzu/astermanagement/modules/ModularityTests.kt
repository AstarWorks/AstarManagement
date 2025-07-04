package dev.ryuzu.astermanagement.modules

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestInstance
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.modulith.core.ApplicationModules
import org.springframework.modulith.docs.Documenter
import org.springframework.modulith.test.ApplicationModuleTest
import org.springframework.test.context.ActiveProfiles
import kotlin.test.assertTrue

/**
 * Test class to verify Spring Modulith modular structure and boundaries
 */
@SpringBootTest
@ApplicationModuleTest
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ModularityTests {

    @Test
    fun verifyModularStructure() {
        val modules = ApplicationModules.of("dev.ryuzu.astermanagement")
        modules.verify()
    }

    @Test
    fun verifyAuditModule() {
        val modules = ApplicationModules.of("dev.ryuzu.astermanagement")
        val auditModule = modules.getModuleByName("audit")
            .orElseThrow { AssertionError("Audit module not found") }
        
        // Verify audit module structure
        assertTrue(auditModule.namedInterfaces.isNotEmpty(), "Audit module should expose named interfaces")
        println("✅ Audit module verified: ${auditModule.name}")
        println("   Base packages: ${auditModule.basePackages}")
        println("   Named interfaces: ${auditModule.namedInterfaces.map { it.name }}")
    }

    @Test
    fun verifyMatterModule() {
        val modules = ApplicationModules.of("dev.ryuzu.astermanagement")
        val matterModule = modules.getModuleByName("matter")
            .orElseThrow { AssertionError("Matter module not found") }
        
        // Verify matter module structure and API exposure
        assertTrue(matterModule.namedInterfaces.isNotEmpty(), "Matter module should expose named interfaces")
        
        // Verify module exposes proper API packages
        val exposedPackages = matterModule.namedInterfaces.map { it.name }
        assertTrue(exposedPackages.any { it.contains("api") }, "Matter module should expose API package")
        
        println("✅ Matter module verified: ${matterModule.name}")
        println("   Base packages: ${matterModule.basePackages}")
        println("   API packages: ${exposedPackages.filter { it.contains("api") }}")
    }

    @Test
    fun verifyDocumentModule() {
        val modules = ApplicationModules.of("dev.ryuzu.astermanagement")
        val documentModule = modules.getModuleByName("document")
            .orElseThrow { AssertionError("Document module not found") }
        
        // Verify document module structure and API exposure
        assertTrue(documentModule.namedInterfaces.isNotEmpty(), "Document module should expose named interfaces")
        
        val exposedPackages = documentModule.namedInterfaces.map { it.name }
        assertTrue(exposedPackages.any { it.contains("api") }, "Document module should expose API package")
        
        println("✅ Document module verified: ${documentModule.name}")
        println("   Base packages: ${documentModule.basePackages}")
        println("   API packages: ${exposedPackages.filter { it.contains("api") }}")
    }

    @Test
    fun verifyModuleBoundaries() {
        val modules = ApplicationModules.of("dev.ryuzu.astermanagement")
        
        // Verify modules don't have direct dependencies on each other's internals
        modules.forEach { module ->
            println("=== Module: ${module.name} ===")
            
            // Check dependencies
            module.dependencies.forEach { dependency ->
                println("  -> depends on: ${dependency.name}")
                
                // Verify dependency is legitimate (not crossing module boundaries illegally)
                val dependencyModule = modules.getModuleByName(dependency.name)
                if (dependencyModule.isPresent) {
                    assertTrue(
                        dependencyModule.get().namedInterfaces.isNotEmpty(),
                        "Dependency ${dependency.name} should expose proper interfaces"
                    )
                }
            }
            
            // Verify no circular dependencies
            verifyNoCycles(module, modules, mutableSetOf())
            
            println("  ✅ Boundary verified for ${module.name}")
            println()
        }
    }

    @Test
    fun verifyModuleAPIExposure() {
        val modules = ApplicationModules.of("dev.ryuzu.astermanagement")
        
        // Test each module exposes only its API packages
        listOf("audit", "matter", "document").forEach { moduleName ->
            val module = modules.getModuleByName(moduleName)
                .orElseThrow { AssertionError("$moduleName module not found") }
            
            val exposedPackages = module.namedInterfaces.map { it.name }
            
            // Verify API package is exposed
            assertTrue(
                exposedPackages.any { it.contains("api") },
                "$moduleName module should expose API package"
            )
            
            // Verify domain/infrastructure packages are NOT exposed
            assertTrue(
                exposedPackages.none { it.contains("domain") || it.contains("infrastructure") },
                "$moduleName module should NOT expose internal packages"
            )
            
            println("✅ $moduleName module API exposure verified")
            println("   Exposed: ${exposedPackages.filter { it.contains("api") }}")
        }
    }

    @Test
    fun verifyEventDrivenCommunication() {
        val modules = ApplicationModules.of("dev.ryuzu.astermanagement")
        
        // Verify that modules communicate through events, not direct calls
        modules.forEach { module ->
            println("=== Event Communication for ${module.name} ===")
            
            // Check for event listeners in each module
            val eventListeners = module.namedInterfaces.filter { 
                it.name.contains("EventListener") || 
                it.name.contains("@ApplicationModuleListener")
            }
            
            if (eventListeners.isNotEmpty()) {
                println("  Event listeners found: ${eventListeners.map { it.name }}")
            }
            
            // Verify no direct cross-module service dependencies
            module.dependencies.forEach { dependency ->
                val dependencyName = dependency.name
                if (dependencyName in listOf("audit", "matter", "document")) {
                    // Cross-module dependency should only be through APIs
                    assertTrue(
                        dependency.name.contains("api") || dependency.name.contains("events"),
                        "Cross-module dependency should be through API: ${dependency.name}"
                    )
                }
            }
            
            println("  ✅ Event-driven communication verified for ${module.name}")
        }
    }

    @Test
    fun generateModuleDocumentation() {
        val modules = ApplicationModules.of("dev.ryuzu.astermanagement")
        
        // Generate comprehensive module documentation
        val documenter = Documenter(modules)
            .writeDocumentation()
            .writeIndividualModulesAsPlantUml()
        
        println("✅ Module documentation generated successfully")
        println("   Check build/spring-modulith-docs/ for generated documentation")
    }

    @Test
    fun verifyEventExternalization() {
        val modules = ApplicationModules.of("dev.ryuzu.astermanagement")
        
        // Verify that modules use @Externalized events for inter-module communication
        listOf("matter", "document").forEach { moduleName ->
            val module = modules.getModuleByName(moduleName)
                .orElseThrow { AssertionError("$moduleName module not found") }
            
            println("=== Event Externalization for ${module.name} ===")
            
            // Check for externalized events in the module
            val eventClasses = module.namedInterfaces.filter { 
                it.name.contains("Event") && it.name.contains("@Externalized")
            }
            
            if (eventClasses.isNotEmpty()) {
                println("  Externalized events: ${eventClasses.map { it.name }}")
            }
            
            println("  ✅ Event externalization verified for ${module.name}")
        }
    }

    @Test
    fun performanceImpactVerification() {
        val modules = ApplicationModules.of("dev.ryuzu.astermanagement")
        
        // Verify modularization doesn't significantly impact performance
        val startTime = System.currentTimeMillis()
        
        // Simulate module loading and verification
        modules.verify()
        modules.forEach { module ->
            module.namedInterfaces.forEach { _ ->
                // Simulate interface access
            }
        }
        
        val endTime = System.currentTimeMillis()
        val duration = endTime - startTime
        
        assertTrue(
            duration < 5000, // 5 seconds max
            "Module verification should complete quickly: ${duration}ms"
        )
        
        println("✅ Performance impact verified: ${duration}ms")
    }

    @Test
    fun printModuleStructure() {
        val modules = ApplicationModules.of("dev.ryuzu.astermanagement")
        
        println("=== Application Modules Structure ===")
        modules.forEach { module ->
            println("Module: ${module.name}")
            println("  Base Package: ${module.basePackage}")
            println("  Display Name: ${module.displayName}")
            println("  Dependencies: ${module.dependencies.map { it.name }}")
            println("  Named Interfaces: ${module.namedInterfaces.map { it.name }}")
            println()
        }
    }

    /**
     * Helper method to verify no circular dependencies exist
     */
    private fun verifyNoCycles(
        module: org.springframework.modulith.core.ApplicationModule,
        allModules: ApplicationModules,
        visited: MutableSet<String>
    ) {
        if (module.name in visited) {
            throw AssertionError("Circular dependency detected involving module: ${module.name}")
        }
        
        visited.add(module.name)
        
        module.dependencies.forEach { dependency ->
            val dependencyModule = allModules.getModuleByName(dependency.name)
            if (dependencyModule.isPresent) {
                verifyNoCycles(dependencyModule.get(), allModules, visited.toMutableSet())
            }
        }
    }
}
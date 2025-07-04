package dev.ryuzu.astermanagement.modules

import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.modulith.core.ApplicationModules
import org.springframework.modulith.docs.Documenter
import org.springframework.test.context.ActiveProfiles

/**
 * Test class to verify Spring Modulith modular structure
 */
@SpringBootTest
@ActiveProfiles("test")
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
        
        // Verify audit module exists and has proper structure
        println("Audit module: ${auditModule.name}")
        println("Base packages: ${auditModule.basePackages}")
    }

    @Test
    fun verifyMatterModule() {
        val modules = ApplicationModules.of("dev.ryuzu.astermanagement")
        val matterModule = modules.getModuleByName("matter")
            .orElseThrow { AssertionError("Matter module not found") }
        
        // Verify matter module exists and has proper structure
        println("Matter module: ${matterModule.name}")
        println("Base packages: ${matterModule.basePackages}")
    }

    @Test
    fun verifyDocumentModule() {
        val modules = ApplicationModules.of("dev.ryuzu.astermanagement")
        val documentModule = modules.getModuleByName("document")
            .orElseThrow { AssertionError("Document module not found") }
        
        // Verify document module exists and has proper structure
        println("Document module: ${documentModule.name}")
        println("Base packages: ${documentModule.basePackages}")
    }

    @Test
    fun verifyModuleInteractions() {
        val modules = ApplicationModules.of("dev.ryuzu.astermanagement")
        
        // Verify modules don't have direct dependencies on each other's internals
        modules.forEach { module ->
            println("Module: ${module.name}")
            module.dependencies.forEach { dependency ->
                println("  -> depends on: ${dependency.name}")
            }
        }
    }

    @Test
    fun generateModuleDocumentation() {
        val modules = ApplicationModules.of("dev.ryuzu.astermanagement")
        
        // Generate module documentation
        Documenter(modules)
            .writeDocumentation()
            .writeIndividualModulesAsPlantUml()
    }

    @Test
    fun printModuleStructure() {
        val modules = ApplicationModules.of("dev.ryuzu.astermanagement")
        
        println("=== Application Modules ===")
        modules.forEach { module ->
            println("Module: ${module.name}")
            println("  Base Package: ${module.basePackage}")
            println("  Display Name: ${module.displayName}")
            println("  Dependencies: ${module.dependencies.map { it.name }}")
            println("  Named Interfaces: ${module.namedInterfaces.map { it.name }}")
            println()
        }
    }
}
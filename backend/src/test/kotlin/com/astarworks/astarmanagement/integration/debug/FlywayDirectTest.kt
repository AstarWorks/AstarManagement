package com.astarworks.astarmanagement.integration.debug

import com.astarworks.astarmanagement.base.IntegrationTestBase
import org.flywaydb.core.Flyway
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.context.ApplicationContext
import javax.sql.DataSource

/**
 * Flyway test using shared TestContainerConfig
 */
class FlywayDirectTest : IntegrationTestBase() {

    @Autowired(required = false)
    var flyway: Flyway? = null

    @Autowired
    override lateinit var dataSource: DataSource
    
    @Autowired
    lateinit var applicationContext: ApplicationContext

    @Test
    fun `test flyway bean creation`() {
        println("=== FlywayDirectTest Starting ===")
        
        // Spring Contextの確認
        println("\n=== Spring Context Analysis ===")
        val flywayBeans = applicationContext.getBeansOfType(Flyway::class.java)
        println("Flyway beans in context: ${flywayBeans.size}")
        flywayBeans.forEach { (name, bean) ->
            println("  Bean name: $name, Bean: $bean")
            
            // Flyway情報を取得
            val info = bean.info()
            println("    Current version: ${info.current()?.version}")
            println("    Applied migrations: ${info.applied().size}")
        }
        
        // AutoConfigurationの確認
        val beanNames = applicationContext.beanDefinitionNames
        val flywayRelatedBeans = beanNames.filter { it.contains("flyway", ignoreCase = true) }
        println("\nFlyway-related bean names:")
        flywayRelatedBeans.forEach { println("  - $it") }
        
        println("\nFlyway bean injected: ${flyway != null}")
        
        if (flyway != null) {
            val info = flyway!!.info()
            println("\n=== Injected Flyway Info ===")
            println("Current version: ${info.current()?.version}")
            println("Applied migrations: ${info.applied().size}")
            
            info.all().forEach { migration ->
                println("V${migration.version} - ${migration.description} - ${migration.state}")
            }
        }
        
        println("\n=== FlywayDirectTest Completed ===")
    }
}
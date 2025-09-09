import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile
import java.time.Duration

plugins {
    kotlin("jvm") version "2.2.10"
    kotlin("plugin.spring") version "2.2.10"
    kotlin("plugin.serialization") version "2.2.10"
    id("org.springframework.boot") version "4.0.0-M2"
    id("io.spring.dependency-management") version "1.1.7"
    id("org.springdoc.openapi-gradle-plugin") version "1.9.0"
    // id("io.gitlab.arturbosch.detekt") version "1.23.6" // Temporarily disabled due to Kotlin 2.2.10 incompatibility
    jacoco
}

group = "com.astarworks"
version = "0.0.1"

java {
    sourceCompatibility = JavaVersion.VERSION_21
}

repositories {
    mavenCentral()
}

// ===========================================
// Test Configuration
// ===========================================
// All tests now run from the standard src/test/ directory
// Organized into subdirectories: unit/, integration/, e2e/
// ===========================================
// Dependencies
// ===========================================
dependencies {
    // === Kotlin Core ===
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.9.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.10.2")
    implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.6.0")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8")
    
    // KAML for YAML support
    implementation("com.charleskorn.kaml:kaml:0.61.0")
    
    // === Spring Boot Starters ===
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jdbc")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-oauth2-resource-server")
    implementation("org.springframework.boot:spring-boot-starter-aop")
    implementation("org.springframework.boot:spring-boot-starter-cache")
    
    // === Database ===
    implementation("org.springframework.boot:spring-boot-starter-flyway")
    implementation("org.flywaydb:flyway-database-postgresql")
    implementation("org.postgresql:postgresql")
    runtimeOnly("com.h2database:h2")
    
    // === Security & JWT ===
    implementation("io.jsonwebtoken:jjwt-api:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.6")
    implementation("org.springframework.security:spring-security-oauth2-jose")
    implementation("com.nimbusds:nimbus-jose-jwt:9.40")
    
    // === Caching ===
    implementation("com.github.ben-manes.caffeine:caffeine:3.1.8")
    
    // === Resilience ===
    implementation("io.github.resilience4j:resilience4j-spring-boot3:2.3.0")
    implementation("io.github.resilience4j:resilience4j-circuitbreaker:2.3.0")
    
    // === API Documentation ===
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.11")
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-api:2.8.11")
    implementation("com.google.code.gson:gson")  // OpenAPI JSON serialization
    
    // === Development ===
    developmentOnly("org.springframework.boot:spring-boot-devtools")
    
    // === Testing ===
    testImplementation("org.springframework.boot:spring-boot-starter-test") {
        exclude(group = "org.mockito")
    }
    testImplementation("org.springframework.security:spring-security-test")
    testImplementation("io.mockk:mockk:1.14.5")
    testImplementation("com.ninja-squad:springmockk:4.0.2")
    testImplementation("org.assertj:assertj-core:3.24.2")
    
    // Kotest
    testImplementation("io.kotest:kotest-runner-junit5:5.8.0")
    testImplementation("io.kotest:kotest-assertions-core:5.8.0")
    testImplementation("io.kotest:kotest-property:5.8.0")
    
    // TestContainers
    testImplementation("org.testcontainers:testcontainers:1.21.3")
    testImplementation("org.testcontainers:postgresql:1.21.3")
    testImplementation("org.testcontainers:junit-jupiter:1.21.3")
    testImplementation("org.springframework.boot:spring-boot-testcontainers")
}

// ===========================================
// Kotlin Compilation
// ===========================================
tasks.withType<KotlinCompile> {
    compilerOptions {
        freeCompilerArgs.add("-Xjsr305=strict")
        jvmTarget.set(JvmTarget.JVM_21)
    }
}

// ===========================================
// Test Tasks Configuration
// ===========================================

// Common test configuration
tasks.withType<Test> {
    useJUnitPlatform()
    testLogging {
        events("passed", "skipped", "failed")
    }
}


// Integration tests (TestContainers + real database)
val integrationTest = tasks.register<Test>("integrationTest") {
    description = "Runs integration tests with TestContainers PostgreSQL"
    group = "verification"
    
    useJUnitPlatform {
        includeTags("integration")
    }
    
    // Sequential execution to avoid RLS conflicts
    maxParallelForks = 1
    
    // Longer timeout for container startup
    timeout.set(Duration.ofMinutes(10))
    
    // Spring Boot will automatically load application-integration.yml for integration profile
    
    // Enable detailed test logging
    testLogging {
        events("passed", "skipped", "failed", "standardOut", "standardError")
        showStandardStreams = true  // Show println() output
        showExceptions = true
        showStackTraces = true
        showCauses = true
        exceptionFormat = org.gradle.api.tasks.testing.logging.TestExceptionFormat.FULL
    }
    
    shouldRunAfter(tasks.test)
}

// E2E tests (full API testing)
val e2eTest = tasks.register<Test>("e2eTest") {
    description = "Runs end-to-end API tests"
    group = "verification"
    
    useJUnitPlatform {
        includeTags("e2e")
    }
    
    // Sequential execution for E2E tests
    maxParallelForks = 1
    
    // Longer timeout for E2E scenarios
    timeout.set(Duration.ofMinutes(15))
    
    // Spring Boot will automatically load application-e2e.yml for e2e profile
    
    shouldRunAfter(integrationTest)
}

// Unit tests configuration (new dedicated task)
val unitTest = tasks.register<Test>("unitTest") {
    description = "Runs unit tests with mocked dependencies"
    group = "verification"
    
    useJUnitPlatform {
        includeTags("unit")
    }
    
    // Run unit tests in parallel for speed
    maxParallelForks = (Runtime.getRuntime().availableProcessors() / 2).coerceAtLeast(1)
    
    // Spring Boot will automatically load application-unit.yml for unit profile
}

// Main test task - runs all test types
//tasks.test {
//    description = "Runs all tests (unit, integration, and e2e)"
//    group = "verification"
//    
//    dependsOn(unitTest)
//    dependsOn(integrationTest)
//    dependsOn(e2eTest)
//}

// Include all test types in check task
tasks.check {
    dependsOn(tasks.test)
}

// ===========================================
// JaCoCo Configuration
// ===========================================
jacoco {
    toolVersion = "0.8.11"
}

tasks.jacocoTestReport {
    dependsOn(unitTest, integrationTest)
    
    executionData(
        unitTest.get(),
        integrationTest.get()
    )
    
    reports {
        xml.required.set(true)
        html.required.set(true)
        csv.required.set(false)
        html.outputLocation.set(layout.buildDirectory.dir("jacocoHtml"))
    }
    
    classDirectories.setFrom(
        files(classDirectories.files.map {
            fileTree(it) {
                exclude(
                    "**/config/**",
                    "**/dto/**",
                    "**/entity/**",
                    "**/*Application*"
                )
            }
        })
    )
}

tasks.jacocoTestCoverageVerification {
    violationRules {
        rule {
            limit {
                minimum = "0.85".toBigDecimal()
            }
        }
    }
}
plugins {
    kotlin("jvm") version "2.1.0"
    kotlin("plugin.spring") version "2.1.0"
    kotlin("plugin.jpa") version "2.1.0"
    id("org.springframework.boot") version "3.5.0"
    id("io.spring.dependency-management") version "1.1.7"
    id("org.hibernate.orm") version "6.6.15.Final"
    id("org.graalvm.buildtools.native") version "0.10.6"
    id("org.asciidoctor.jvm.convert") version "3.3.2"
    jacoco
    id("org.jetbrains.kotlinx.kover") version "0.8.3"
    id("io.gitlab.arturbosch.detekt") version "1.23.7"
    id("com.github.spotbugs") version "6.0.24"
    id("org.owasp.dependencycheck") version "11.1.0"
    id("org.sonarqube") version "5.1.0.4882"
}

group = "dev.ryuzu"
version = "0.0.1"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

extra["snippetsDir"] = file("build/generated-snippets")
extra["springAiVersion"] = "1.0.0-M5"
extra["springModulithVersion"] = "1.4.0"
extra["postgresqlVersion"] = "42.7.4"
extra["testcontainersVersion"] = "1.20.4"

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-batch")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-data-redis")
    implementation("org.springframework.boot:spring-boot-starter-mail")
    implementation("org.springframework.boot:spring-boot-starter-oauth2-client")
    implementation("org.springframework.boot:spring-boot-starter-oauth2-resource-server")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-websocket")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8")
    implementation("org.flywaydb:flyway-core")
    runtimeOnly("org.flywaydb:flyway-database-postgresql")
    
    // OpenAPI/Swagger
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.6.0")
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-api:2.6.0")
    
    // Rate Limiting - Using Redis-based simple implementation
    
    // Storage Providers
    implementation("io.minio:minio:8.5.12")                    // MinIO Java SDK
    implementation("com.google.cloud:google-cloud-storage:2.42.0") // Google Cloud Storage SDK
    
    // Spring AI - Commented out to resolve Vertex AI configuration issues
    // implementation("org.springframework.ai:spring-ai-pdf-document-reader")
    // implementation("org.springframework.ai:spring-ai-starter-model-vertex-ai-embedding")
    // implementation("org.springframework.ai:spring-ai-starter-model-vertex-ai-gemini")
    
    // Spring Modulith
    implementation("org.springframework.modulith:spring-modulith-starter-core")
    implementation("org.springframework.modulith:spring-modulith-starter-jpa")
    implementation("org.springframework.session:spring-session-data-redis")
    
    // Two-Factor Authentication
    implementation("com.warrenstrange:googleauth:1.5.0")  // TOTP implementation
    implementation("com.google.zxing:core:3.5.2")         // QR code generation
    implementation("com.google.zxing:javase:3.5.2")       // QR code image processing
    
    // Development
//    developmentOnly("org.springframework.boot:spring-boot-devtools")
    developmentOnly("org.springframework.boot:spring-boot-docker-compose")
    runtimeOnly("org.postgresql:postgresql:${property("postgresqlVersion")}")
    runtimeOnly("com.h2database:h2") // For testing
    // developmentOnly("org.springframework.ai:spring-ai-spring-boot-docker-compose")
    runtimeOnly("org.springframework.modulith:spring-modulith-actuator")
    runtimeOnly("org.springframework.modulith:spring-modulith-observability")
    
    // Testing
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.boot:spring-boot-testcontainers")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
    // testImplementation("org.springframework.ai:spring-ai-spring-boot-testcontainers")
    testImplementation("org.springframework.batch:spring-batch-test")
    testImplementation("org.springframework.modulith:spring-modulith-starter-test")
    testImplementation("org.springframework.modulith:spring-modulith-docs")
    testImplementation("org.springframework.restdocs:spring-restdocs-mockmvc")
    testImplementation("org.springframework.security:spring-security-test")
    testImplementation("org.testcontainers:junit-jupiter")
    testImplementation("org.testcontainers:postgresql")
    testImplementation("org.testcontainers:minio")
    testImplementation("org.junit.jupiter:junit-jupiter-api")
    testImplementation("org.junit.jupiter:junit-jupiter-engine")
    testImplementation("org.mockito.kotlin:mockito-kotlin:5.1.0")
    
    // Additional Test Utilities
    testImplementation("io.mockk:mockk:1.13.12") 
    testImplementation("com.ninja-squad:springmockk:4.0.2")
    testImplementation("org.springframework.boot:spring-boot-starter-webflux") // For WebTestClient
    testImplementation("io.rest-assured:rest-assured:5.5.0")
    testImplementation("io.kotest:kotest-assertions-core:5.8.0")
    
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

dependencyManagement {
    imports {
        mavenBom("org.springframework.modulith:spring-modulith-bom:${property("springModulithVersion")}")
        mavenBom("org.testcontainers:testcontainers-bom:${property("testcontainersVersion")}")
        // mavenBom("org.springframework.ai:spring-ai-bom:${property("springAiVersion")}")
    }
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict")
    }
}

hibernate {
    enhancement {
        enableAssociationManagement = true
    }
}

allOpen {
    annotation("jakarta.persistence.Entity")
    annotation("jakarta.persistence.MappedSuperclass")
    annotation("jakarta.persistence.Embeddable")
}

tasks.withType<Test> {
    useJUnitPlatform()
}

tasks.test {
    outputs.dir(project.extra["snippetsDir"]!!)
}

tasks.asciidoctor {
    inputs.dir(project.extra["snippetsDir"]!!)
    dependsOn(tasks.test)
}

// JaCoCo Configuration
jacoco {
    toolVersion = "0.8.12"
}

tasks.jacocoTestReport {
    dependsOn(tasks.test)
    reports {
        xml.required = true
        html.required = true
        csv.required = false
    }
    finalizedBy(tasks.jacocoTestCoverageVerification)
}

tasks.jacocoTestCoverageVerification {
    violationRules {
        rule {
            limit {
                minimum = "0.90".toBigDecimal() // 90% coverage required
            }
        }
        rule {
            element = "CLASS"
            excludes = listOf(
                "*.config.*",
                "*.dto.*",
                "*Application*",
                "*.TestcontainersConfiguration*"
            )
            limit {
                counter = "LINE"
                minimum = "0.85".toBigDecimal()
            }
        }
    }
}

tasks.check {
    dependsOn(tasks.jacocoTestCoverageVerification)
}

// Detekt Configuration (Kotlin code analysis)
detekt {
    toolVersion = "1.23.7"
    config.setFrom("$projectDir/config/detekt/detekt.yml")
    buildUponDefaultConfig = true
    autoCorrect = true
}

tasks.withType<io.gitlab.arturbosch.detekt.Detekt>().configureEach {
    reports {
        html.required.set(true)
        xml.required.set(false)
        txt.required.set(false)
        sarif.required.set(false)
        md.required.set(false)
    }
}

// Kover Configuration (Kotlin code coverage)
kover {
    reports {
        total {
            html {
                onCheck = true
            }
            xml {
                onCheck = true
            }
        }
    }
}

koverReport {
    filters {
        excludes {
            classes(
                "*Application*",
                "*Config*",
                "*Configuration*",
                "*.dto.*",
                "*.entity.*"
            )
            packages(
                "dev.ryuzu.astarmanagement.config",
                "dev.ryuzu.astarmanagement.dto"
            )
        }
    }
    verify {
        rule {
            minBound(85)
        }
    }
}

// OWASP Dependency Check Configuration
dependencyCheck {
    failBuildOnCVSS = 7.0f
    format = "ALL"
    outputDirectory = "${layout.buildDirectory.get()}/reports"
    suppressionFile = "config/owasp/suppressions.xml"
}

// SonarQube Configuration
sonar {
    properties {
        property("sonar.projectKey", "astar-management-backend")
        property("sonar.organization", "ryuzu-dev")
        property("sonar.host.url", "https://sonarcloud.io")
        property("sonar.coverage.jacoco.xmlReportPaths", "${layout.buildDirectory.get()}/reports/jacoco/test/jacocoTestReport.xml")
        property("sonar.kotlin.detekt.reportPaths", "${layout.buildDirectory.get()}/reports/detekt/detekt.xml")
    }
}

// Custom tasks for development workflow
tasks.register("qualityCheck") {
    group = "verification"
    description = "Run all quality checks"
    dependsOn("detekt", "koverVerify", "jacocoTestCoverageVerification")
}

tasks.register("securityCheck") {
    group = "verification" 
    description = "Run security-related checks"
    dependsOn("dependencyCheckAnalyze")
}

plugins {
    kotlin("jvm") version "1.9.25"
    kotlin("plugin.spring") version "1.9.25"
    id("org.springframework.boot") version "3.5.0"
    id("io.spring.dependency-management") version "1.1.7"
    id("org.hibernate.orm") version "6.6.15.Final"
    id("org.graalvm.buildtools.native") version "0.10.6"
    id("org.asciidoctor.jvm.convert") version "3.3.2"
    kotlin("plugin.jpa") version "1.9.25"
    jacoco
    checkstyle
    id("com.github.spotbugs") version "6.0.7"
    id("org.owasp.dependencycheck") version "9.2.0"
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
extra["springAiVersion"] = "1.0.0"
extra["springModulithVersion"] = "1.4.0"

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
    runtimeOnly("org.postgresql:postgresql")
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
    testImplementation("org.testcontainers:minio:1.19.3")
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

// Checkstyle Configuration
checkstyle {
    toolVersion = "10.17.0"
    configFile = file("${rootDir}/config/checkstyle/checkstyle.xml")
    isIgnoreFailures = false
    maxWarnings = 0
}

tasks.checkstyleMain {
    source = fileTree("src/main/kotlin")
}

tasks.checkstyleTest {
    source = fileTree("src/test/kotlin")
}

// SpotBugs Configuration
spotbugs {
    ignoreFailures = false
    effort = com.github.spotbugs.snom.Effort.DEFAULT
    reportLevel = com.github.spotbugs.snom.Confidence.MEDIUM
    excludeFilter = file("${rootDir}/config/spotbugs/exclude.xml")
}

tasks.spotbugsMain {
    reports.create("html") {
        required = true
        outputLocation = file("${buildDir}/reports/spotbugs/main.html")
        setStylesheet("fancy-hist.xsl")
    }
}

tasks.spotbugsTest {
    reports.create("html") {
        required = true
        outputLocation = file("${buildDir}/reports/spotbugs/test.html")
        setStylesheet("fancy-hist.xsl")
    }
}

// OWASP Dependency Check Configuration
dependencyCheck {
    failBuildOnCVSS = 7.0f
    suppressionFile = "${rootDir}/config/owasp/suppressions.xml"
    analyzers {
        assemblyEnabled = false
        nugetconfEnabled = false
        nodeEnabled = false
        cocoapodsEnabled = false
        swiftEnabled = false
    }
    format = org.owasp.dependencycheck.reporting.ReportGenerator.Format.ALL
    outputDirectory = "${buildDir}/reports"
}

---
task_id: T03_S05
sprint_sequence_id: S05
status: open
complexity: Medium
last_updated: 2025-06-28T10:30:00Z
---

# Task: Setup Spring Modulith Foundation and Migrate Audit Module

## Description
Configure Spring Modulith in the existing Spring Boot application and establish the foundational modular architecture. Begin with migrating the Audit module as it already has clear boundaries and an established event-driven pattern. This will serve as a template for migrating other modules and validate the Spring Modulith setup.

## Goal / Objectives
- Add Spring Modulith dependencies and configuration to the project
- Establish the module structure conventions and patterns
- Migrate the existing Audit functionality into a proper Spring Modulith module
- Set up module testing infrastructure
- Create documentation generation pipeline

## Acceptance Criteria
- [ ] Spring Modulith dependencies are added to build.gradle.kts
- [ ] Audit module is properly structured with api, domain, and infrastructure packages
- [ ] Audit module's public API is clearly defined with interfaces and events
- [ ] Module verification tests pass for the Audit module
- [ ] Module documentation is generated for the Audit module
- [ ] Existing audit functionality continues to work without breaking changes
- [ ] Basic module structure template is documented for future modules

## Technical Guidance

### Spring Modulith Setup
1. Add dependencies to `build.gradle.kts`:
```kotlin
dependencies {
    implementation("org.springframework.modulith:spring-modulith-starter-core")
    implementation("org.springframework.modulith:spring-modulith-starter-jpa")
    testImplementation("org.springframework.modulith:spring-modulith-starter-test")
    
    // For documentation generation
    testImplementation("org.springframework.modulith:spring-modulith-docs")
}
```

2. Configure module verification in test suite

### Audit Module Migration
The existing audit system provides a solid foundation:
- `AuditEvent` sealed class hierarchy
- `AuditEventPublisher` service
- Event listeners (`AuditEventListener`, `SecurityAuditEventListener`)

Structure the module as:
```
audit/
├── api/
│   ├── AuditEventPublisher.kt (interface)
│   ├── AuditEvent.kt (sealed class - public API)
│   └── AuditEventTypes.kt
├── domain/
│   ├── AuditLogEntity.kt
│   └── AuditLogRepository.kt
└── infrastructure/
    ├── AuditEventPublisherImpl.kt
    ├── AuditEventListener.kt
    └── SecurityAuditEventListener.kt
```

### Module Testing
Create verification tests:
```kotlin
@Modulith
class ModularityTests {
    @Test
    fun verifyModularStructure(modules: ApplicationModules) {
        modules.verify()
    }
}
```

## Subtasks
- [ ] Add Spring Modulith dependencies to build.gradle.kts
- [ ] Create base module package structure under dev.ryuzu.astermanagement.modules
- [ ] Move audit-related classes into modules.audit package
- [ ] Define audit.api package with public interfaces and events
- [ ] Move internal audit implementations to audit.infrastructure
- [ ] Create module verification test for Audit module
- [ ] Set up module documentation generation
- [ ] Update existing code to use Audit module's public API
- [ ] Document module structure conventions in developer guidelines
- [ ] Verify all existing audit functionality works correctly

## Output Log
*(This section is populated as work progresses on the task)*

[YYYY-MM-DD HH:MM:SS] Started task
[YYYY-MM-DD HH:MM:SS] Modified files: file1.kt, file2.kt
[YYYY-MM-DD HH:MM:SS] Completed subtask: Implemented feature X
[YYYY-MM-DD HH:MM:SS] Task completed
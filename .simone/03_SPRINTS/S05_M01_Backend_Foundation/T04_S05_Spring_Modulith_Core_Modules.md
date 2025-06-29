---
task_id: T04_S05
sprint_sequence_id: S05
status: open
complexity: Medium
last_updated: 2025-06-28T10:30:00Z
---

# Task: Extract Matter and Document Modules with Clear Boundaries

## Description
Building on the Spring Modulith foundation, extract the Matter (case management) and Document modules from the existing codebase. These represent core business domains that need clear separation. The Document functionality will be extracted from the current Matter domain to establish proper bounded contexts with well-defined module APIs.

## Goal / Objectives
- Extract Matter functionality into a dedicated Spring Modulith module
- Separate Document management from Matter into its own module
- Define clear public APIs for both modules
- Establish module boundaries that prevent direct cross-module dependencies
- Implement proper module interaction through APIs and events

## Acceptance Criteria
- [ ] Matter module is properly structured with clear package organization
- [ ] Document module is extracted and independently structured
- [ ] Public APIs are defined for both modules with DTOs and interfaces
- [ ] No direct dependencies exist between Matter and Document modules
- [ ] Module verification tests pass for both modules
- [ ] Existing REST APIs continue to function without breaking changes
- [ ] Inter-module communication uses only public APIs

## Technical Guidance

### Matter Module Structure
```
matter/
├── api/
│   ├── MatterService.kt (interface)
│   ├── MatterDTO.kt
│   ├── MatterStatusDTO.kt
│   └── MatterEvents.kt (MatterCreated, MatterUpdated, etc.)
├── domain/
│   ├── Matter.kt
│   ├── MatterStatus.kt
│   └── MatterRepository.kt
└── infrastructure/
    ├── MatterServiceImpl.kt
    ├── MatterController.kt (moved from controller package)
    └── MatterEventPublisher.kt
```

### Document Module Extraction
Currently, document-related functionality is mixed within the Matter domain. Extract:
- Document entities and DTOs
- Document storage and retrieval logic
- Document-Matter associations (through events/APIs)

```
document/
├── api/
│   ├── DocumentService.kt (interface)
│   ├── DocumentDTO.kt
│   ├── DocumentEvents.kt (DocumentUploaded, DocumentDeleted)
│   └── DocumentMatterAssociation.kt
├── domain/
│   ├── Document.kt
│   └── DocumentRepository.kt
└── infrastructure/
    ├── DocumentServiceImpl.kt
    ├── DocumentController.kt
    └── DocumentStorageService.kt
```

### Module Interaction Patterns
1. **Matter creates Document**: Matter module publishes `DocumentRequested` event
2. **Document uploaded**: Document module publishes `DocumentUploaded` event with matter reference
3. **Query documents for matter**: Use Document module's public API with matter ID

### Dependency Rules
- Controllers can depend on multiple module APIs
- Modules cannot have direct dependencies on each other
- Shared DTOs should be in module API packages
- Common utilities can be in a shared module

## Subtasks
- [ ] Create Matter module structure under modules.matter
- [ ] Move Matter domain classes to matter.domain package
- [ ] Define Matter public API with interfaces and DTOs
- [ ] Move Matter controller to matter.infrastructure
- [ ] Create Document module structure under modules.document
- [ ] Extract document-related code from Matter domain
- [ ] Define Document public API
- [ ] Implement event-based communication between modules
- [ ] Update existing controllers to use module APIs
- [ ] Create module verification tests for both modules
- [ ] Document module interaction patterns
- [ ] Verify all existing functionality remains operational

## Output Log
*(This section is populated as work progresses on the task)*

[YYYY-MM-DD HH:MM:SS] Started task
[YYYY-MM-DD HH:MM:SS] Modified files: file1.kt, file2.kt
[YYYY-MM-DD HH:MM:SS] Completed subtask: Implemented feature X
[YYYY-MM-DD HH:MM:SS] Task completed
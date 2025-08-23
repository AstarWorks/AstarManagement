# Simone Framework - Astar Management

## Overview

This directory contains the Simone project management framework for the Astar Management platform. Simone provides structured documentation and task management for complex software development projects.

## Directory Structure

```
.simone/
├── 01_PROJECT_DOCS/      # Core project documentation
│   ├── ARCHITECTURE.md   # System architecture overview
│   └── PROJECT_MANIFEST.md # Project summary and metadata
├── 02_MILESTONES/        # Major project milestones
│   └── M001_Auth0_Integration.md
├── 03_GENERAL_TASKS/     # Individual development tasks
│   └── T001_Auth0_Migration.md
├── 04_BUG_REPORTS/       # Bug tracking and resolution
├── 05_FEATURE_REQUESTS/  # New feature proposals
├── 06_DISCUSSIONS/       # Technical discussions and decisions
├── 07_WIKI/             # Knowledge base and guides
├── 08_AUTOMATION/        # CI/CD and automation scripts
└── README.md            # This file
```

## Quick Start

### Viewing Documentation
1. **Architecture**: Start with [ARCHITECTURE.md](01_PROJECT_DOCS/ARCHITECTURE.md) for system overview
2. **Current Sprint**: Check [M001_Auth0_Integration.md](02_MILESTONES/M001_Auth0_Integration.md)
3. **Active Tasks**: Review tasks in [03_GENERAL_TASKS/](03_GENERAL_TASKS/)

### Creating New Documents

#### New Task
```bash
# Create a new task file
touch .simone/03_GENERAL_TASKS/T002_Your_Task.md
```

Use this template:
```markdown
# Task T002: [Task Title]

## Task Information
**ID**: T002
**Status**: Not Started | In Progress | Completed | Blocked
**Priority**: Low | Medium | High | Critical
**Milestone**: M001 (if applicable)

## Task Description
[Describe what needs to be done]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Technical Requirements
[Technical details and implementation notes]
```

#### New Bug Report
```bash
# Create a bug report
touch .simone/04_BUG_REPORTS/B001_Bug_Title.md
```

#### New Feature Request
```bash
# Create a feature request
touch .simone/05_FEATURE_REQUESTS/F001_Feature_Name.md
```

## Current Status

### Active Milestone
- **M001**: Auth0 Integration (Due: 2025-02-01)

### In-Progress Tasks
- **T001**: Auth0 Authentication Migration

### Team Focus
The team is currently focused on migrating authentication from custom JWT to Auth0 OAuth2 Resource Server.

## Integration with Development

### Referencing Simone Documents
When working on code, reference Simone documents in commits and PRs:
```bash
git commit -m "feat(auth): implement JWT validation [T001]"
```

### Updating Task Status
Always update task status when progress is made:
1. Edit the task file
2. Update the Status field
3. Add entry to Progress Log
4. Commit changes

### Linking Code to Documentation
In code comments, reference Simone documents:
```kotlin
// Implementation follows design in .simone/02_MILESTONES/M001_Auth0_Integration.md
class Auth0JwtAuthenticationConverter { 
    // ...
}
```

## Best Practices

1. **Keep Documents Updated**: Update status and progress regularly
2. **Use Consistent Naming**: Follow the ID convention (T001, M001, B001, etc.)
3. **Link Related Documents**: Always cross-reference related items
4. **Track Decisions**: Document important decisions in 06_DISCUSSIONS
5. **Version Control**: Commit Simone changes with descriptive messages

## Useful Commands

### Find all open tasks
```bash
grep -r "Status: In Progress" .simone/03_GENERAL_TASKS/
```

### List all milestones
```bash
ls .simone/02_MILESTONES/
```

### Search for specific topic
```bash
grep -r "Auth0" .simone/
```

## External Documentation

For detailed project documentation outside of Simone:
- [Platform Vision](../docs/00-overview/PLATFORM_VISION.md)
- [System Architecture](../docs/20-architecture/)
- [API Specifications](../docs/40-specs/)
- [Claude AI Instructions](../CLAUDE.md)

## Support

For questions about Simone framework usage:
1. Check the [07_WIKI](07_WIKI/) directory
2. Create a discussion in [06_DISCUSSIONS](06_DISCUSSIONS/)
3. Ask the team in the development chat

---
*Simone Framework initialized: 2025-01-18*  
*Framework Version: 1.0.0*
# Check for Reinventing the Wheel - shadcn/ui Component Usage

## Overview
This command checks if the codebase is reinventing UI components that are already available in shadcn/ui.

## Purpose
Identify custom implementations that could be replaced with existing shadcn/ui components to:
- Reduce maintenance burden
- Ensure consistency
- Leverage tested and accessible components
- Follow the "Simple over Easy" principle

## Prerequisites
- `.claude/commands/astarworks/shadcn-component-list.json` containing 54 available components
- Understanding of the project's UI requirements

## Process

### Step 1: Load shadcn Component List
1. Read `shadcn-component-list.json` to get all available components
2. Parse component names, descriptions, and use cases

### Step 2: Analyze Custom Components
For each custom component in the codebase:
1. Identify the component's purpose and functionality
2. Check if a similar shadcn/ui component exists
3. Evaluate if the custom implementation is justified

### Step 3: Pattern Detection
Look for common reinvention patterns based on available shadcn/ui components:

#### Form Components
- Custom inputs → **Input**, **Textarea**, **Number Field**
- Custom selects → **Select**, **Combobox**
- Custom checkboxes → **Checkbox**
- Custom radio buttons → **Radio Group**
- Custom switches → **Switch**
- Custom sliders → **Slider**
- Custom date inputs → **Calendar**, **Date Picker**, **Range Calendar**
- Custom PIN/OTP inputs → **PIN Input**
- Custom tag inputs → **Tags Input**

#### Layout & Navigation
- Custom modals → **Dialog**, **Alert Dialog**, **Sheet**, **Drawer**
- Custom dropdowns → **Dropdown Menu**, **Context Menu**, **Menubar**
- Custom popovers → **Popover**, **Hover Card**, **Tooltip**
- Custom navigation → **Navigation Menu**, **Breadcrumb**
- Custom tabs → **Tabs**
- Custom accordions → **Accordion**, **Collapsible**

#### Display Components
- Custom cards → **Card**
- Custom tables → **Table**, **Data Table**
- Custom lists → Consider **Table** or **Card** patterns
- Custom badges → **Badge**
- Custom avatars → **Avatar**
- Custom progress indicators → **Progress**, **Skeleton**
- Custom separators → **Separator**

#### Interactive Components
- Custom buttons → **Button**, **Toggle**, **Toggle Group**
- Custom command palettes → **Command**
- Custom carousels → **Carousel**
- Custom steppers → **Stepper**
- Custom resizable panels → **Resizable**

#### Feedback Components
- Custom alerts → **Alert**, **Toast** (via Sonner)
- Custom loading states → **Skeleton**
- Custom scroll areas → **Scroll Area**

#### Utility Components
- Custom aspect ratio containers → **Aspect Ratio**
- Custom pagination → **Pagination**

### Step 4: Report Generation

## Output Format

```markdown
# Reinventing the Wheel Analysis Report

## Summary
- Total custom components analyzed: [number]
- Potential replacements found: [number]
- Estimated reduction in code: [percentage]

## Recommendations

### High Priority (Direct Replacements)
| Custom Component | shadcn/ui Alternative | Justification |
|-----------------|----------------------|---------------|
| [Component Name] | [shadcn Component] | [Why to replace] |

### Medium Priority (Partial Replacements)
| Custom Component | shadcn/ui Alternative | Migration Notes |
|-----------------|----------------------|-----------------|
| [Component Name] | [shadcn Component] | [What needs adaptation] |

### Low Priority (Justified Custom Implementation)
| Custom Component | Similar shadcn/ui | Justification for Custom |
|-----------------|------------------|-------------------------|
| [Component Name] | [shadcn Component] | [Why custom is needed] |

## Detailed Analysis

### [Custom Component Name]
- **Location**: `path/to/component.vue`
- **Purpose**: [What it does]
- **shadcn/ui Alternative**: [Component name]
- **Migration Effort**: [Low/Medium/High]
- **Benefits of Migration**:
  - [Benefit 1]
  - [Benefit 2]
- **Code Example**:
  ```vue
  // Current custom implementation
  [code snippet]
  
  // Proposed shadcn/ui implementation
  [code snippet]
  ```

## Action Items
1. [Specific action with priority]
2. [Specific action with priority]
3. [Specific action with priority]
```

## Special Considerations

### When Custom Implementation is Justified
- Highly specific business requirements
- Performance optimizations needed
- Accessibility requirements beyond shadcn/ui
- Integration with legacy systems

### Common Pitfalls
- Assuming shadcn/ui components are "too simple"
- Not checking shadcn/ui documentation thoroughly
- Overlooking composition possibilities
- Not considering future maintenance costs

## Usage
```bash
# Analyze entire frontend
check_reinventing_wheel.md frontend/

# Analyze specific component directory
check_reinventing_wheel.md frontend/components/expense/

# Analyze specific component
check_reinventing_wheel.md frontend/components/common/CustomSelect.vue
```

## Implementation Script
When executing this analysis:

1. **Read shadcn component list**:
   ```typescript
   const shadcnComponents = JSON.parse(
     readFileSync('.claude/commands/astarworks/shadcn-component-list.json', 'utf-8')
   ).components;
   ```

2. **Scan for custom implementations**:
   - Look for component names containing: Modal, Dialog, Button, Input, Select, etc.
   - Check component templates for custom implementations of common UI patterns
   - Analyze props and emits to understand component functionality

3. **Match against shadcn/ui components**:
   - Compare functionality, not just names
   - Consider composition possibilities
   - Check if multiple shadcn components could replace one custom component

## Integration with Review Process
This analysis should be run:
- Before starting new component development
- During code reviews
- As part of technical debt assessment
- When refactoring existing components
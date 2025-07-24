# T01_S05_Codebase_Analysis_and_Dependency_Mapping

## Front Matter
- **Task ID**: T01_S05
- **Sprint**: S05_M02 Migration Foundation and Planning
- **Module**: Migration Foundation 
- **Type**: Analysis & Documentation
- **Priority**: High
- **Status**: completed
- **Assigned**: Development Team
- **Estimated Hours**: 24-32 hours
- **Dependencies**: None (foundational task)
- **Related ADRs**: ADR-001 (Framework Migration Decision)

## Task Description

Conduct comprehensive analysis of the existing React/Next.js codebase in `/frontend-nextjs-archived/` to create detailed mapping and inventory for Vue/Nuxt.js migration. This foundational task establishes the migration blueprint by cataloging all components, dependencies, architectural patterns, and identifying potential migration challenges.

## Objectives

### Primary Objectives
1. **Complete Component Inventory**: Catalog all React components with complexity assessment, dependencies, and migration effort estimates
2. **Dependency Analysis**: Map all 63 npm packages to Vue/Nuxt equivalents with migration strategies
3. **Architecture Pattern Documentation**: Document React-specific patterns and their Vue/Nuxt translations
4. **Performance Baseline**: Establish current performance metrics for post-migration comparison
5. **Risk Assessment**: Identify technical and business risks with mitigation strategies

### Secondary Objectives
1. **Migration Timeline Estimation**: Provide realistic timelines based on complexity analysis
2. **Testing Strategy**: Document current test coverage and migration testing requirements
3. **Documentation Analysis**: Inventory existing documentation and identify gaps
4. **Third-party Integration Assessment**: Evaluate external service integrations requiring updates

## Analysis Framework

### Component Analysis Structure
```
Component Name | File Path | Type | Complexity | Dependencies | Migration Effort | Notes
-------------- | --------- | ---- | ---------- | ------------ | --------------- | -----
MatterCard | /components/kanban/MatterCard.tsx | Feature | Medium | @dnd-kit/core, framer-motion | 8-12 hours | Drag-drop migration critical
KanbanBoard | /components/kanban/KanbanBoard.tsx | Layout | High | @dnd-kit/sortable, zustand | 16-20 hours | Core functionality
```

### Dependency Mapping Template
```
React Package | Vue Equivalent | Migration Strategy | Compatibility | Risk Level | Notes
------------- | -------------- | ------------------ | ------------- | ---------- | -----
@dnd-kit/core | @vueuse/gesture + vue-draggable-plus | Pattern Migration | Partial | Medium | Drag-drop behavior differences
zustand | pinia | State Architecture | Full | Low | Direct pattern mapping
```

## Acceptance Criteria

### AC1: Component Inventory Complete
- [ ] All 70+ React components cataloged with metadata
- [ ] Component complexity assessment using standardized matrix
- [ ] Migration effort estimation for each component
- [ ] Component dependency tree documentation
- [ ] High-risk components identified with specific concerns

### AC2: Dependency Analysis Report
- [ ] All 63 npm packages analyzed for Vue/Nuxt equivalents
- [ ] Migration strategy defined for each dependency
- [ ] Compatibility matrix created for library alternatives
- [ ] Package-specific migration guides documented
- [ ] Breaking change implications identified

### AC3: Architecture Mapping Guide
- [ ] React patterns mapped to Vue/Nuxt equivalents
- [ ] State management migration (Zustand → Pinia) documented
- [ ] Routing migration (Next.js → Nuxt 3) patterns defined
- [ ] Component lifecycle migration patterns
- [ ] Hook to Composable conversion guide

### AC4: Performance Baseline Report
- [ ] Current bundle size analysis (dev/prod)
- [ ] Core Web Vitals measurements
- [ ] Runtime performance metrics
- [ ] Memory usage patterns
- [ ] Network request analysis

### AC5: Risk Assessment Documentation
- [ ] Technical risk matrix with likelihood/impact scoring
- [ ] Business risk analysis with mitigation strategies
- [ ] Migration timeline with risk-adjusted estimates
- [ ] Rollback strategy documentation
- [ ] Quality assurance requirements

## Technical Implementation

### Phase 1: Automated Analysis (8-10 hours)
```bash
# Component Discovery
find /frontend-nextjs-archived/src/components -name "*.tsx" -o -name "*.ts" | 
  xargs wc -l | sort -nr > component_complexity_raw.txt

# Dependency Analysis
cd /frontend-nextjs-archived && npm ls --depth=0 --json > dependency_tree.json

# Bundle Analysis
cd /frontend-nextjs-archived && npm run build && 
  npx webpack-bundle-analyzer .next/static/chunks/*.js --mode=json > bundle_analysis.json
```

### Phase 2: Manual Component Analysis (12-16 hours)
1. **Component Categorization**:
   - UI Components (shadcn/ui): 25+ components
   - Feature Components (kanban, forms): 20+ components
   - Layout Components: 8+ components
   - Utility Components: 10+ components

2. **Complexity Assessment Matrix**:
   ```
   Simple (1-4 hours): Basic UI, minimal state
   Medium (5-12 hours): Business logic, multiple dependencies
   Complex (13-24 hours): Advanced patterns, critical functionality
   High Risk (25+ hours): Core system components, extensive testing
   ```

3. **Critical Component Analysis**:
   - **KanbanBoard**: @dnd-kit/sortable integration, complex state management
   - **MatterCard**: Drag-drop + framer-motion animations
   - **FilterBar**: Advanced filtering with URL persistence
   - **KanbanBoardMobile**: Touch gesture handling
   - **VirtualizedBoard**: @tanstack/react-virtual performance optimization

### Phase 3: Architecture Documentation (6-8 hours)
1. **State Management Patterns**:
   ```typescript
   // Zustand → Pinia Migration Pattern
   // Before (React/Zustand)
   const useKanbanStore = create<KanbanState>((set) => ({
     columns: [],
     updateColumn: (id, data) => set((state) => ({ ... }))
   }))
   
   // After (Vue/Pinia)
   export const useKanbanStore = defineStore('kanban', {
     state: (): KanbanState => ({ columns: [] }),
     actions: { updateColumn(id: string, data: Partial<Column>) { ... } }
   })
   ```

2. **Component Lifecycle Mapping**:
   ```typescript
   // React useEffect → Vue onMounted/watch
   // Before: useEffect(() => { fetchData() }, [dependency])
   // After: watch(() => dependency, () => { fetchData() })
   ```

### Phase 4: Performance Baseline (4-6 hours)
1. **Bundle Analysis**:
   ```bash
   # Current bundle sizes
   npm run build && du -sh .next/static/chunks/*
   
   # Lighthouse audit
   npx lighthouse http://localhost:3000 --output=json --output-path=performance_baseline.json
   ```

2. **Performance Metrics**:
   - Bundle size (dev/prod)
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Time to Interactive (TTI)
   - Memory usage patterns

## File Structure for Deliverables

```
/S05_M02_Migration_Foundation_and_Planning/
├── T01_S05_Codebase_Analysis_and_Dependency_Mapping.md (this file)
├── component_inventory.csv
├── dependency_analysis_report.md
├── react_to_vue_migration_mapping.md
├── performance_baseline_report.md
├── migration_risk_assessment.md
├── vue_library_evaluation_matrix.md
├── component_hierarchy_diagram.md
└── technical_risk_analysis.md
```

## ADR References

This task provides foundational analysis that supports multiple ADR decisions:
- **ADR-001**: Frontend Framework Migration - Component inventory validates migration scope
- **ADR-002**: State Management Solution - Zustand store analysis informs Pinia migration  
- **ADR-003**: Component Library Selection - UI component analysis supports shadcn-vue choice
- **ADR-005**: Build Tool Selection - Dependency analysis validates Bun adoption
- **ADR-007**: API Integration Pattern - API usage analysis informs TanStack Query implementation

## Key Analysis Areas

### 1. Component Inventory Focus
- **UI Components**: 25+ shadcn/ui components requiring shadcn-vue mapping
- **Kanban System**: 12+ components with complex drag-drop interactions
- **Form Components**: 8+ components with react-hook-form + zod validation
- **Layout Components**: 6+ components with responsive design patterns
- **Utility Components**: 10+ components with React-specific hooks

### 2. Dependency Analysis Priority
**High Priority Dependencies (Critical Path)**:
- `@dnd-kit/core` + `@dnd-kit/sortable` → Vue drag-drop solution
- `zustand` → `pinia` (state management)
- `@tanstack/react-query` → `@tanstack/vue-query`
- `react-hook-form` → `vee-validate`
- `lucide-react` → `lucide-vue-next`

**Medium Priority Dependencies**:
- `framer-motion` → Vue animation library
- `@radix-ui/react-*` → `radix-vue`
- `react-day-picker` → Vue date picker
- `sonner` → Vue toast library

**Low Priority Dependencies**:
- `class-variance-authority` → Direct compatibility
- `tailwind-merge` → Direct compatibility
- `date-fns` → Direct compatibility

### 3. Architecture Pattern Analysis
1. **State Management**: Zustand stores → Pinia stores
2. **Component Composition**: React children → Vue slots
3. **Event Handling**: React events → Vue events
4. **Lifecycle Management**: useEffect → Vue lifecycle hooks
5. **Form Handling**: react-hook-form → vee-validate patterns

### 4. Performance Considerations
- **Bundle Size**: Current React bundle vs. estimated Vue bundle
- **Runtime Performance**: React rendering vs. Vue reactivity
- **Memory Usage**: React fiber vs. Vue 3 composition API
- **Development Experience**: Build times and HMR performance

## Risk Assessment Framework

### Technical Risks
1. **Drag-Drop Complexity**: @dnd-kit migration to Vue ecosystem
2. **State Management**: Complex Zustand patterns in Pinia
3. **Performance Regressions**: Bundle size and runtime performance
4. **Testing Coverage**: Existing test suite migration
5. **Third-party Integration**: External service compatibility

### Business Risks
1. **Timeline Overruns**: Underestimated migration complexity
2. **Feature Regression**: Lost functionality during migration
3. **Team Productivity**: Learning curve impact
4. **User Experience**: Temporary performance degradation
5. **Technical Debt**: Quick migration decisions creating future issues

## Success Metrics

### Quantitative Metrics
- **Component Coverage**: 100% of components inventoried
- **Dependency Mapping**: 100% of packages analyzed
- **Performance Baseline**: Complete metrics captured
- **Documentation Quality**: All templates and guides created

### Qualitative Metrics
- **Migration Readiness**: Clear understanding of migration scope
- **Risk Mitigation**: Comprehensive risk identification and planning
- **Team Confidence**: Development team prepared for migration
- **Stakeholder Alignment**: Business stakeholders understand scope and timeline

## Implementation Commands

### Analysis Commands
```bash
# Navigate to archived frontend
cd /IdeaProjects/AsterManagement/frontend-nextjs-archived

# Component analysis
find src/components -name "*.tsx" -exec grep -l "export.*function\|export.*const.*=.*=>" {} \; | 
  xargs -I {} sh -c 'echo "=== {} ===" && head -20 "{}"' > component_exports.txt

# Dependency extraction
jq '.dependencies + .devDependencies' package.json > all_dependencies.json

# Bundle analysis
npm run build 2>&1 | grep -E "(chunk|bundle)" > build_output.txt

# Performance baseline
npm run dev & 
sleep 10 && 
npx lighthouse http://localhost:3000 --output=json --output-path=../performance_baseline.json
```

### Documentation Commands
```bash
# Create deliverable files
touch component_inventory.csv
touch dependency_analysis_report.md
touch react_to_vue_migration_mapping.md
touch performance_baseline_report.md
touch migration_risk_assessment.md

# Component counting
find src/components -name "*.tsx" | wc -l  # Should show 70+ components
find src/components -name "*.ts" | wc -l   # Additional TypeScript files
```

## Subtasks

### 1. Component Discovery and Cataloging (8 hours)
- [ ] Run component discovery scripts
- [ ] Categorize components by type and complexity
- [ ] Document component dependencies
- [ ] Create component hierarchy diagram
- [ ] Identify high-risk components

### 2. Dependency Analysis and Mapping (10 hours)
- [ ] Extract all package dependencies
- [ ] Research Vue/Nuxt equivalents for each package
- [ ] Create compatibility matrix
- [ ] Document migration strategies
- [ ] Identify breaking changes and workarounds

### 3. Architecture Pattern Documentation (8 hours)
- [ ] Document React patterns in current codebase
- [ ] Create Vue/Nuxt equivalent patterns
- [ ] Map state management patterns
- [ ] Document component lifecycle migrations
- [ ] Create migration code examples

### 4. Performance Baseline Establishment (6 hours)
- [ ] Run bundle analysis
- [ ] Capture performance metrics
- [ ] Document current performance characteristics
- [ ] Create performance comparison framework
- [ ] Establish monitoring benchmarks

## Notes

### Critical Success Factors
1. **Comprehensive Analysis**: No component or dependency overlooked
2. **Accurate Effort Estimation**: Realistic timeline for migration planning
3. **Risk Identification**: Proactive identification of potential issues
4. **Documentation Quality**: Clear, actionable migration guides
5. **Stakeholder Communication**: Regular updates on analysis progress

### Implementation Guidelines
1. **Start with Automated Analysis**: Use scripts to gather initial data
2. **Focus on High-Risk Components**: Prioritize complex components like KanbanBoard
3. **Document Everything**: Create comprehensive migration artifacts
4. **Validate Findings**: Cross-reference analysis with team expertise
5. **Plan for Iteration**: Analysis may reveal additional requirements

### Migration Preparation
This analysis serves as the foundation for all subsequent migration tasks. The deliverables will inform:
- Sprint planning and timeline estimation
- Resource allocation and team assignments
- Risk mitigation strategies
- Quality assurance requirements
- Post-migration validation criteria

The success of the entire Vue/Nuxt migration depends on the thoroughness and accuracy of this analysis phase.
---
task_id: T06_S12
sprint_sequence_id: S12
status: open
complexity: Medium
last_updated: 2025-06-29T00:00:00Z
---

# Task: Matter Info Panels

## Description
Create Vue 3 components for displaying matter information panels and status widgets. These components will provide lawyers and clerks with a clear, organized view of matter metadata, key dates, parties involved, and current status information. The panels will form the foundation of the matter detail view, focusing on information display and status visualization.

## Goal / Objectives
- Create reusable info panel components displaying matter metadata and key information
- Build status widgets showing matter progress, deadlines, and SLA information
- Implement responsive card-based layouts for organizing matter details
- Ensure components integrate with existing state management and query patterns
- Maintain consistent UX patterns with existing Kanban components
- Support real-time updates for status changes and key information

## Acceptance Criteria
- [ ] Matter info panels display all core matter fields with appropriate formatting
- [ ] Status widgets show current progress, upcoming deadlines, and SLA status
- [ ] Panels use consistent card-based layout with shadcn-vue components
- [ ] All date fields display in user-friendly format with relative time
- [ ] Components handle loading and error states gracefully
- [ ] Real-time status updates are reflected immediately
- [ ] Components are fully responsive and work on mobile devices
- [ ] Accessibility standards are met (WCAG 2.1 AA)
- [ ] TypeScript types are properly defined for all component props
- [ ] Components integrate seamlessly with Pinia stores

## Subtasks
- [ ] Create MatterInfoCard component for basic matter information
- [ ] Build MatterPartiesPanel component for client, opposing party, and judge info
- [ ] Implement MatterDatesWidget showing key dates and deadlines
- [ ] Develop MatterStatusWidget with progress indicators and SLA tracking
- [ ] Create MatterSummaryPanel with description and key highlights
- [ ] Add proper loading skeletons for each panel component
- [ ] Implement real-time update integration for status changes
- [ ] Create Storybook stories for all panel components
- [ ] Write unit tests for component logic and formatting
- [ ] Add mobile-optimized layouts for compact viewing

## Technical Guidance

### Component Structure
- Follow Vue 3 Composition API patterns from existing components
- Use TypeScript interfaces for all props and emits
- Leverage shadcn-vue Card, Badge, and Alert components
- Implement proper component composition with slots

### Data Integration
- Use existing `useMattersQuery` composable for data fetching
- Integrate with matter store for state management
- Handle real-time updates through WebSocket patterns
- Implement proper error boundaries

### UI/UX Patterns
- Use consistent color coding for matter priorities and statuses
- Implement same badge styles as Kanban board
- Follow existing spacing and typography patterns
- Use relative time formatting with full date on hover

### Mobile Considerations
- Stack panels vertically on mobile screens
- Ensure touch-friendly interaction areas
- Optimize information density for small screens
- Maintain readability with appropriate font sizes

## Implementation Notes
- Info panels should be composable and work independently
- Consider implementing collapsible sections for complex information
- Status widgets should provide visual indicators (progress bars, charts)
- All panels should handle empty/null data gracefully
- Date formatting should respect user locale settings
- Consider implementing edit-in-place functionality for future enhancement

## Output Log
*(This section is populated as work progresses on the task)*
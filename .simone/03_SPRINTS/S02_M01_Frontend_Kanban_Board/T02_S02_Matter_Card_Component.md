---
task_id: T02_S02
sprint_sequence_id: S02
status: open
complexity: Low
last_updated: 2025-01-17T00:00:00Z
---

# Task: Matter Card Component

## Description
Create the core Matter card component that will be used in the Kanban board to display case information. This component needs to show all essential case details at a glance while maintaining visual hierarchy and clear priority indicators through color coding. The card should be interactive, accessible, and performant.

## Goal / Objectives
- Create a reusable Matter card component that displays comprehensive case information
- Implement visual priority indicators using color-coded borders and badges
- Ensure the component is accessible and keyboard navigable
- Optimize for performance when rendering multiple cards

## Acceptance Criteria
- [ ] Matter card displays all required fields: case number, client name, current status, priority, assigned lawyer, last updated
- [ ] Priority-based color coding is implemented (High=red, Medium=yellow, Low=green, Urgent=purple)
- [ ] Card has hover states and visual feedback for interactions
- [ ] Long text is properly truncated with tooltips showing full content
- [ ] Component is fully keyboard accessible with proper focus indicators
- [ ] Loading and error states are implemented
- [ ] Component is optimized with React.memo to prevent unnecessary re-renders
- [ ] TypeScript interfaces match the backend Matter entity structure
- [ ] Component follows the design system and uses Tailwind CSS with CSS variables

## Subtasks
- [ ] Create MatterCard.tsx component file in src/components/kanban/
- [ ] Define TypeScript interfaces for Matter entity matching backend structure
- [ ] Implement base card layout with all required fields
- [ ] Add priority-based color coding using Tailwind CSS and CSS variables
- [ ] Implement text truncation with tooltip functionality
- [ ] Add hover states and interaction feedback
- [ ] Implement loading skeleton state
- [ ] Add error state handling
- [ ] Add keyboard navigation support
- [ ] Optimize component with React.memo
- [ ] Add Lucide React icons for visual indicators
- [ ] Write unit tests for the component
- [ ] Add Storybook stories for different card states

## Technical Guidance
- Reference the Matter entity structure from backend (20+ fields)
- Use Tailwind CSS for priority-based styling with CSS variables
- Implement with React 19 and TypeScript
- Consider using Radix UI primitives for interactive elements
- Use Lucide React icons for visual indicators

## Implementation Notes
- Create reusable card component in src/components/kanban/MatterCard.tsx
- Use TypeScript interfaces matching the backend Matter entity
- Implement proper truncation for long text with tooltips
- Ensure cards are keyboard navigable
- Add loading and error states
- Consider performance with React.memo for re-render optimization

## Output Log
*(This section is populated as work progresses on the task)*

[YYYY-MM-DD HH:MM:SS] Task created
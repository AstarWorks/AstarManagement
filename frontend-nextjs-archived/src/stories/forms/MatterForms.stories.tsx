import type { Meta, StoryObj } from '@storybook/nextjs'
import { CreateMatterForm } from '@/components/forms/matter/CreateMatterForm'
import { EditMatterForm } from '@/components/forms/matter/EditMatterForm'
import { within, userEvent, expect } from '@storybook/test'

const meta: Meta<typeof CreateMatterForm> = {
  title: 'Forms/Matter',
  component: CreateMatterForm,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const CreateForm: Story = {
  args: {
    onSuccess: () => console.log('Form submitted successfully'),
    onCancel: () => console.log('Form cancelled')
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Test keyboard navigation
    const firstInput = await canvas.findByLabelText('Case Number *')
    await userEvent.tab() // Should focus on first input
    await expect(document.activeElement).toBe(firstInput)
    
    // Test required field validation
    const submitButton = await canvas.findByRole('button', { name: /create matter/i })
    await userEvent.click(submitButton)
    
    // Should show validation errors
    const errors = await canvas.findAllByRole('alert')
    await expect(errors.length).toBeGreaterThan(0)
  }
}

export const EditForm: Story = {
  render: () => {
    const mockMatter = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      caseNumber: '2025-CV-0001',
      title: 'Contract Dispute - ABC Corp vs XYZ Ltd',
      description: 'Breach of contract claim regarding software development agreement',
      clientName: 'ABC Corporation',
      clientContact: 'legal@abccorp.com',
      opposingParty: 'XYZ Limited',
      courtName: 'Tokyo District Court',
      filingDate: '2025-01-15T00:00:00Z',
      status: 'FILED' as const,
      priority: 'HIGH' as const,
      assignedLawyerId: '987e6543-e89b-12d3-a456-426614174000',
      assignedClerkId: '456e7890-e89b-12d3-a456-426614174000',
      estimatedCompletionDate: '2025-06-30T00:00:00Z',
      notes: 'Client is seeking damages of ¥50,000,000',
      tags: ['contract', 'software', 'urgent'],
      createdAt: '2025-01-10T10:00:00Z',
      updatedAt: '2025-01-15T14:30:00Z',
      createdBy: '987e6543-e89b-12d3-a456-426614174000',
      updatedBy: '987e6543-e89b-12d3-a456-426614174000'
    }
    
    return (
      <EditMatterForm 
        matter={mockMatter}
        onSuccess={() => console.log('Form updated successfully')}
        onCancel={() => console.log('Form cancelled')}
      />
    )
  }
}

export const CreateFormWithAccessibility: Story = {
  name: 'Create Form - Accessibility Test',
  args: {
    onSuccess: () => console.log('Form submitted successfully'),
    onCancel: () => console.log('Form cancelled')
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Test ARIA labels and descriptions
    const caseNumberInput = await canvas.findByLabelText('Case Number *')
    await expect(caseNumberInput).toHaveAttribute('aria-describedby')
    
    // Test form field associations
    const titleInput = await canvas.findByLabelText('Title *')
    await expect(titleInput).toHaveAttribute('id')
    
    // Test error state ARIA attributes
    const submitButton = await canvas.findByRole('button', { name: /create matter/i })
    await userEvent.click(submitButton)
    
    // Wait for validation
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Check that invalid fields have aria-invalid
    await expect(caseNumberInput).toHaveAttribute('aria-invalid', 'true')
    
    // Test keyboard navigation through all form sections
    await userEvent.tab() // Move through form fields
    await userEvent.keyboard('{ArrowDown}') // Test select navigation
    
    // Verify all interactive elements are keyboard accessible
    const allButtons = await canvas.findAllByRole('button')
    const allInputs = await canvas.findAllByRole('textbox')
    const allSelects = await canvas.findAllByRole('combobox')
    
    await expect(allButtons.length).toBeGreaterThan(0)
    await expect(allInputs.length).toBeGreaterThan(0)
    await expect(allSelects.length).toBeGreaterThan(0)
  }
}

export const MobileResponsive: Story = {
  name: 'Create Form - Mobile View',
  args: {
    onSuccess: () => console.log('Form submitted successfully'),
    onCancel: () => console.log('Form cancelled')
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
}

export const WithPersistence: Story = {
  name: 'Create Form - With Draft Persistence',
  args: {
    onSuccess: () => console.log('Form submitted successfully'),
    onCancel: () => console.log('Form cancelled')
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // Fill in some fields
    const caseNumberInput = await canvas.findByLabelText('Case Number *')
    await userEvent.type(caseNumberInput, '2025-CV-0002')
    
    const titleInput = await canvas.findByLabelText('Title *')
    await userEvent.type(titleInput, 'Test Matter with Draft')
    
    const clientNameInput = await canvas.findByLabelText('Client Name *')
    await userEvent.type(clientNameInput, 'Test Client')
    
    // Wait for persistence (debounced)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Check that draft saved message appears
    const draftMessage = await canvas.findByText(/draft saved automatically/i)
    await expect(draftMessage).toBeInTheDocument()
  }
}
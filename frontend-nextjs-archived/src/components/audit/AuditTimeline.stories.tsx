/**
 * Storybook stories for AuditTimeline component
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuditTimeline } from './AuditTimeline';
import { AuditEventType } from '@/types/audit';

// Mock data generator
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function generateMockAuditLogs(count: number = 100) {
  const eventTypes = Object.values(AuditEventType);
  const users = [
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'LAWYER' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'CLERK' },
    { id: '3', name: 'Admin User', email: 'admin@example.com', role: 'ADMIN' }
  ];
  
  const logs = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const date = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Random date within 30 days
    
    logs.push({
      id: `log-${i}`,
      eventType,
      entityType: Math.random() > 0.5 ? 'MATTER' : 'DOCUMENT',
      entityId: `entity-${Math.floor(Math.random() * 10)}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      timestamp: date.toISOString(),
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      eventDetails: eventType === 'STATUS_CHANGE' 
        ? { oldStatus: 'IN_PROGRESS', newStatus: 'COMPLETED' }
        : eventType.includes('FILE')
        ? { fileName: `document-${i}.pdf`, fileSize: Math.floor(Math.random() * 10000000) }
        : undefined,
      oldValues: eventType === 'UPDATE' 
        ? { title: 'Old Title', description: 'Old description' }
        : undefined,
      newValues: eventType === 'UPDATE'
        ? { title: 'New Title', description: 'New description' }
        : undefined,
      correlationId: Math.random() > 0.8 ? `corr-${Math.floor(Math.random() * 5)}` : undefined
    });
  }
  
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// Create a wrapper with QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 5 * 60 * 1000
    }
  }
});

function StoryWrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

const meta: Meta<typeof AuditTimeline> = {
  title: 'Features/Audit/AuditTimeline',
  component: AuditTimeline,
  decorators: [
    (Story) => (
      <StoryWrapper>
        <div style={{ height: '600px', width: '100%', border: '1px solid #e5e7eb' }}>
          <Story />
        </div>
      </StoryWrapper>
    )
  ],
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers: [
        // Mock API handlers would go here
      ]
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Default audit timeline showing all audit events'
      }
    }
  }
};

export const EntitySpecific: Story = {
  args: {
    entityType: 'MATTER',
    entityId: '123e4567-e89b-12d3-a456-426614174000'
  },
  parameters: {
    docs: {
      description: {
        story: 'Audit timeline filtered to show events for a specific entity'
      }
    }
  }
};

export const MatterAudit: Story = {
  args: {
    matterId: '123e4567-e89b-12d3-a456-426614174000'
  },
  parameters: {
    docs: {
      description: {
        story: 'Audit timeline for a specific matter showing comprehensive audit trail'
      }
    }
  }
};

export const WithMockData: Story = {
  render: () => {
    // In a real scenario, you would mock the API calls
    // For now, this serves as a visual demonstration
    return <AuditTimeline />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Timeline with mock data for visual testing. In production, this would fetch from the API.'
      }
    }
  }
};

export const EmptyState: Story = {
  args: {
    entityType: 'MATTER',
    entityId: 'non-existent-id'
  },
  parameters: {
    docs: {
      description: {
        story: 'Timeline showing empty state when no audit logs are found'
      }
    }
  }
};

export const LoadingState: Story = {
  render: () => {
    // Would need to mock loading state
    return <AuditTimeline />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Timeline in loading state while fetching data'
      }
    }
  }
};

export const ErrorState: Story = {
  render: () => {
    // Would need to mock error state
    return <AuditTimeline />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Timeline showing error state when data fetch fails'
      }
    }
  }
};
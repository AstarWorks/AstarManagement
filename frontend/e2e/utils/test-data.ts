import { APIRequestContext } from '@playwright/test';

interface CreateMatterRequest {
  caseNumber: string;
  title: string;
  clientName: string;
  status: string;
  priority: string;
  description?: string;
  assignedLawyerId?: string;
  tags?: string[];
}

interface CreateUserRequest {
  email: string;
  name: string;
  role: 'LAWYER' | 'CLERK' | 'CLIENT';
  password: string;
}

export class TestDataManager {
  constructor(private request: APIRequestContext) {}

  async createTestMatter(data: Partial<CreateMatterRequest>): Promise<any> {
    const response = await this.request.post('/api/v1/matters', {
      data: {
        caseNumber: `TEST-${Date.now()}`,
        title: 'Test Matter',
        clientName: 'Test Client',
        status: 'INTAKE',
        priority: 'MEDIUM',
        ...data
      },
      headers: {
        'Authorization': `Bearer ${process.env.TEST_API_TOKEN}`
      }
    });
    
    if (!response.ok()) {
      throw new Error(`Failed to create test matter: ${response.status()}`);
    }
    
    return response.json();
  }

  async createTestUser(role: 'LAWYER' | 'CLERK' | 'CLIENT'): Promise<any> {
    const timestamp = Date.now();
    const response = await this.request.post('/api/v1/users', {
      data: {
        email: `test-${role.toLowerCase()}-${timestamp}@example.com`,
        name: `Test ${role}`,
        role: role,
        password: 'TestPass123!'
      },
      headers: {
        'Authorization': `Bearer ${process.env.TEST_ADMIN_TOKEN}`
      }
    });
    
    if (!response.ok()) {
      throw new Error(`Failed to create test user: ${response.status()}`);
    }
    
    return response.json();
  }

  async cleanupTestData() {
    try {
      // Delete all test matters
      const mattersResponse = await this.request.get('/api/v1/matters?search=TEST-', {
        headers: {
          'Authorization': `Bearer ${process.env.TEST_API_TOKEN}`
        }
      });
      
      if (mattersResponse.ok()) {
        const mattersData = await mattersResponse.json();
        
        for (const matter of mattersData.content || []) {
          await this.request.delete(`/api/v1/matters/${matter.id}`, {
            headers: {
              'Authorization': `Bearer ${process.env.TEST_API_TOKEN}`
            }
          });
        }
      }

      // Delete all test users
      const usersResponse = await this.request.get('/api/v1/users?search=test-', {
        headers: {
          'Authorization': `Bearer ${process.env.TEST_ADMIN_TOKEN}`
        }
      });
      
      if (usersResponse.ok()) {
        const usersData = await usersResponse.json();
        
        for (const user of usersData.content || []) {
          await this.request.delete(`/api/v1/users/${user.id}`, {
            headers: {
              'Authorization': `Bearer ${process.env.TEST_ADMIN_TOKEN}`
            }
          });
        }
      }
    } catch (error) {
      console.error('Error during test data cleanup:', error);
    }
  }

  async createMultipleTestMatters(count: number): Promise<any[]> {
    const matters = [];
    const statuses = ['INTAKE', 'INITIAL_REVIEW', 'INVESTIGATION', 'RESEARCH', 'DRAFT_PLEADINGS'];
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    
    for (let i = 0; i < count; i++) {
      const matter = await this.createTestMatter({
        caseNumber: `TEST-${Date.now()}-${i}`,
        title: `Test Matter ${i + 1}`,
        clientName: `Test Client ${i + 1}`,
        status: statuses[i % statuses.length],
        priority: priorities[i % priorities.length],
        description: `This is test matter number ${i + 1}`
      });
      matters.push(matter);
    }
    
    return matters;
  }
}

// Global setup hook
export async function globalSetup() {
  console.log('Running global setup for E2E tests...');
  // Any global setup logic can go here
  // For example, seeding test database, creating test users, etc.
}

// Global teardown hook
export async function globalTeardown() {
  console.log('Running global teardown for E2E tests...');
  // Any global cleanup logic can go here
}
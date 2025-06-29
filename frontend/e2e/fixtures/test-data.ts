/**
 * Test Data Factories and Fixtures
 * 
 * Provides structured test data generation for E2E tests
 */

import { faker } from '@faker-js/faker'

// Types for test data
export interface TestMatter {
  id: string
  title: string
  description: string
  status: 'intake' | 'active' | 'pending' | 'completed' | 'archived'
  clientId: string
  clientName: string
  assignedLawyer: string
  createdAt: string
  updatedAt: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  estimatedHours: number
  billableRate: number
  tags: string[]
  documents: TestDocument[]
}

export interface TestDocument {
  id: string
  name: string
  type: 'contract' | 'correspondence' | 'evidence' | 'filing' | 'memo'
  size: number
  uploadedAt: string
  version: number
}

export interface TestUser {
  id: string
  email: string
  name: string
  role: 'lawyer' | 'clerk' | 'client' | 'admin'
  permissions: string[]
  isActive: boolean
  lastLogin?: string
  twoFactorEnabled: boolean
}

export interface TestOrganization {
  id: string
  name: string
  address: string
  phone: string
  email: string
  licenses: string[]
}

/**
 * Matter Factory
 */
export class MatterFactory {
  static create(overrides: Partial<TestMatter> = {}): TestMatter {
    const baseStatus = faker.helpers.arrayElement(['intake', 'active', 'pending', 'completed', 'archived'])
    
    return {
      id: faker.string.uuid(),
      title: faker.company.name() + ' Legal Matter',
      description: faker.lorem.paragraph(),
      status: baseStatus,
      clientId: faker.string.uuid(),
      clientName: faker.person.fullName(),
      assignedLawyer: faker.person.fullName(),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'urgent']),
      estimatedHours: faker.number.int({ min: 10, max: 200 }),
      billableRate: faker.number.int({ min: 150, max: 500 }),
      tags: faker.helpers.arrayElements(['contract', 'litigation', 'regulatory', 'employment', 'corporate'], { min: 1, max: 3 }),
      documents: DocumentFactory.createBatch(faker.number.int({ min: 1, max: 5 })),
      ...overrides
    }
  }

  static createBatch(count: number, overrides: Partial<TestMatter> = {}): TestMatter[] {
    return Array.from({ length: count }, () => this.create(overrides))
  }

  static createWithStatus(status: TestMatter['status'], count: number = 1): TestMatter[] {
    return this.createBatch(count, { status })
  }

  static createForClient(clientId: string, clientName: string, count: number = 1): TestMatter[] {
    return this.createBatch(count, { clientId, clientName })
  }

  static createForLawyer(lawyerName: string, count: number = 1): TestMatter[] {
    return this.createBatch(count, { assignedLawyer: lawyerName })
  }

  static createHighPriority(count: number = 1): TestMatter[] {
    return this.createBatch(count, { 
      priority: 'urgent',
      status: 'active',
      estimatedHours: faker.number.int({ min: 50, max: 200 })
    })
  }
}

/**
 * Document Factory
 */
export class DocumentFactory {
  static create(overrides: Partial<TestDocument> = {}): TestDocument {
    const docType = faker.helpers.arrayElement(['contract', 'correspondence', 'evidence', 'filing', 'memo'])
    
    return {
      id: faker.string.uuid(),
      name: `${faker.system.fileName()}.pdf`,
      type: docType,
      size: faker.number.int({ min: 1024, max: 10485760 }), // 1KB to 10MB
      uploadedAt: faker.date.recent().toISOString(),
      version: faker.number.int({ min: 1, max: 5 }),
      ...overrides
    }
  }

  static createBatch(count: number, overrides: Partial<TestDocument> = {}): TestDocument[] {
    return Array.from({ length: count }, () => this.create(overrides))
  }

  static createByType(type: TestDocument['type'], count: number = 1): TestDocument[] {
    return this.createBatch(count, { type })
  }
}

/**
 * User Factory
 */
export class UserFactory {
  static create(overrides: Partial<TestUser> = {}): TestUser {
    const role = faker.helpers.arrayElement(['lawyer', 'clerk', 'client', 'admin'])
    
    return {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      name: faker.person.fullName(),
      role,
      permissions: this.getPermissionsForRole(role),
      isActive: faker.datatype.boolean({ probability: 0.9 }),
      lastLogin: faker.date.recent().toISOString(),
      twoFactorEnabled: faker.datatype.boolean({ probability: 0.7 }),
      ...overrides
    }
  }

  static createBatch(count: number, overrides: Partial<TestUser> = {}): TestUser[] {
    return Array.from({ length: count }, () => this.create(overrides))
  }

  static createByRole(role: TestUser['role'], count: number = 1): TestUser[] {
    return this.createBatch(count, { 
      role,
      permissions: this.getPermissionsForRole(role)
    })
  }

  static createLawyer(overrides: Partial<TestUser> = {}): TestUser {
    return this.create({
      role: 'lawyer',
      permissions: this.getPermissionsForRole('lawyer'),
      twoFactorEnabled: true,
      ...overrides
    })
  }

  static createClerk(overrides: Partial<TestUser> = {}): TestUser {
    return this.create({
      role: 'clerk',
      permissions: this.getPermissionsForRole('clerk'),
      ...overrides
    })
  }

  static createClient(overrides: Partial<TestUser> = {}): TestUser {
    return this.create({
      role: 'client',
      permissions: this.getPermissionsForRole('client'),
      twoFactorEnabled: false,
      ...overrides
    })
  }

  static createAdmin(overrides: Partial<TestUser> = {}): TestUser {
    return this.create({
      role: 'admin',
      permissions: this.getPermissionsForRole('admin'),
      twoFactorEnabled: true,
      isActive: true,
      ...overrides
    })
  }

  private static getPermissionsForRole(role: TestUser['role']): string[] {
    const permissionMap = {
      admin: ['*'],
      lawyer: [
        'matter:create', 'matter:read', 'matter:update', 'matter:delete',
        'document:create', 'document:read', 'document:update', 'document:delete',
        'client:read', 'client:update',
        'billing:read', 'billing:create'
      ],
      clerk: [
        'matter:read', 'matter:update',
        'document:create', 'document:read', 'document:update',
        'client:read'
      ],
      client: [
        'matter:read',
        'document:read'
      ]
    }
    
    return permissionMap[role] || []
  }
}

/**
 * Organization Factory
 */
export class OrganizationFactory {
  static create(overrides: Partial<TestOrganization> = {}): TestOrganization {
    return {
      id: faker.string.uuid(),
      name: faker.company.name() + ' Law Firm',
      address: faker.location.streetAddress({ useFullAddress: true }),
      phone: faker.phone.number(),
      email: faker.internet.email(),
      licenses: [
        faker.location.state() + ' Bar License',
        'Federal Court Admission'
      ],
      ...overrides
    }
  }
}

/**
 * Predefined Test Scenarios
 */
export const TestScenarios = {
  // Typical law firm with various matter types
  lawFirmScenario: () => ({
    organization: OrganizationFactory.create({
      name: 'Williams & Associates Law Firm'
    }),
    lawyers: UserFactory.createByRole('lawyer', 3),
    clerks: UserFactory.createByRole('clerk', 2),
    clients: UserFactory.createByRole('client', 10),
    matters: [
      ...MatterFactory.createWithStatus('intake', 5),
      ...MatterFactory.createWithStatus('active', 10),
      ...MatterFactory.createWithStatus('pending', 3),
      ...MatterFactory.createWithStatus('completed', 15)
    ]
  }),

  // High-volume practice scenario
  highVolumeScenario: () => ({
    organization: OrganizationFactory.create({
      name: 'Metro Legal Services'
    }),
    lawyers: UserFactory.createByRole('lawyer', 8),
    clerks: UserFactory.createByRole('clerk', 5),
    clients: UserFactory.createByRole('client', 50),
    matters: MatterFactory.createBatch(100)
  }),

  // Urgent matters scenario
  urgentMattersScenario: () => ({
    organization: OrganizationFactory.create(),
    lawyers: UserFactory.createByRole('lawyer', 2),
    clerks: UserFactory.createByRole('clerk', 1),
    clients: UserFactory.createByRole('client', 5),
    matters: MatterFactory.createHighPriority(8)
  }),

  // Single client with multiple matters
  multiMatterClientScenario: () => {
    const client = UserFactory.createClient({ name: 'Acme Corporation' })
    return {
      organization: OrganizationFactory.create(),
      lawyers: UserFactory.createByRole('lawyer', 2),
      clerks: UserFactory.createByRole('clerk', 1),
      clients: [client],
      matters: MatterFactory.createForClient(client.id, client.name, 12)
    }
  }
}

/**
 * Test Data Cleanup Utilities
 */
export class TestDataCleanup {
  static async cleanupMatters(matterIds: string[]): Promise<void> {
    // Implementation would depend on your API
    console.log('Cleaning up matters:', matterIds)
  }

  static async cleanupUsers(userIds: string[]): Promise<void> {
    // Implementation would depend on your API
    console.log('Cleaning up users:', userIds)
  }

  static async cleanupOrganization(orgId: string): Promise<void> {
    // Implementation would depend on your API
    console.log('Cleaning up organization:', orgId)
  }

  static async cleanupAll(scenario: any): Promise<void> {
    const matterIds = scenario.matters.map((m: TestMatter) => m.id)
    const userIds = [
      ...scenario.lawyers.map((u: TestUser) => u.id),
      ...scenario.clerks.map((u: TestUser) => u.id),
      ...scenario.clients.map((u: TestUser) => u.id)
    ]

    await Promise.all([
      this.cleanupMatters(matterIds),
      this.cleanupUsers(userIds),
      this.cleanupOrganization(scenario.organization.id)
    ])
  }
}

/**
 * Mock API Response Builders
 */
export const MockResponses = {
  matters: {
    success: (matters?: TestMatter[]) => ({
      status: 200,
      json: {
        data: matters || MatterFactory.createBatch(5),
        total: matters?.length || 5,
        page: 1,
        pageSize: 20
      }
    }),
    
    created: (matter?: TestMatter) => ({
      status: 201,
      json: {
        data: matter || MatterFactory.create(),
        message: 'Matter created successfully'
      }
    }),
    
    updated: (matter?: TestMatter) => ({
      status: 200,
      json: {
        data: matter || MatterFactory.create(),
        message: 'Matter updated successfully'
      }
    }),
    
    deleted: () => ({
      status: 204,
      json: {
        message: 'Matter deleted successfully'
      }
    }),
    
    error: (code: number = 400, message: string = 'Bad Request') => ({
      status: code,
      json: {
        error: message,
        code
      }
    })
  },

  auth: {
    success: (user?: TestUser) => ({
      status: 200,
      json: {
        user: user || UserFactory.createLawyer(),
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600
      }
    }),
    
    loginRequired: () => ({
      status: 401,
      json: {
        error: 'Authentication required',
        code: 401
      }
    }),
    
    forbidden: () => ({
      status: 403,
      json: {
        error: 'Insufficient permissions',
        code: 403
      }
    }),
    
    twoFactorRequired: () => ({
      status: 200,
      json: {
        requiresTwoFactor: true,
        sessionId: 'temp-session-id'
      }
    })
  },

  documents: {
    success: (documents?: TestDocument[]) => ({
      status: 200,
      json: {
        data: documents || DocumentFactory.createBatch(3)
      }
    }),
    
    uploaded: (document?: TestDocument) => ({
      status: 201,
      json: {
        data: document || DocumentFactory.create(),
        message: 'Document uploaded successfully'
      }
    })
  }
}

/**
 * Test Database Seeding
 */
export class TestDatabaseSeeder {
  static async seedLawFirm(): Promise<any> {
    const scenario = TestScenarios.lawFirmScenario()
    // Implementation would seed your test database
    return scenario
  }

  static async seedHighVolume(): Promise<any> {
    const scenario = TestScenarios.highVolumeScenario()
    // Implementation would seed your test database
    return scenario
  }

  static async clearDatabase(): Promise<void> {
    // Implementation would clear your test database
    console.log('Database cleared for testing')
  }
}
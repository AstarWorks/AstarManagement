/**
 * User Mock Repository
 * Implementation using mock data for development
 */

import { BaseRepository } from '@shared/api/core/BaseRepository'
import { useApiClient } from '@shared/api/composables/useApiClient'
import type { IPaginatedResponse } from '@shared/api/types'
import type { UserRepository } from './UserRepository'
import type { UserProfile, UserStats, UserStatsParams, UpdateUserProfileDto, RoleResponse } from '../types'

// Mock user data
const mockUsers = new Map<string, UserProfile>([
  ['dev-user-001', {
    id: 'dev-user-001',
    email: 'dev@example.com',
    name: '開発 太郎',
    displayName: 'Dev User',
    avatar: '/images/avatars/dev-user.png',
    organizationId: 'org-001',
    organizationName: 'Astar Works',
    team: '開発チーム',
    position: 'シニアエンジニア',
    roles: [
      {
        id: 'role-admin',
        tenantId: 'org-001',
        name: 'ADMIN',
        displayName: '管理者',
        color: '#FF0000',
        position: 1,
        permissions: [],
        userCount: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        system: false
      } as RoleResponse
    ],
    permissions: ['users.view', 'users.edit', 'settings.edit', 'all'] as readonly string[],
    phone: '090-1234-5678',
    isActive: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date().toISOString(),
    preferences: {
      language: 'ja',
      theme: 'light',
      notifications: {
        email: true,
        browser: true,
        mobile: false
      }
    }
  }],
  ['admin-user-001', {
    id: 'admin-user-001',
    email: 'admin@example.com',
    name: '管理 花子',
    displayName: 'Admin User',
    avatar: '/images/avatars/admin-user.png',
    organizationId: 'org-001',
    organizationName: 'Astar Works',
    team: '管理部',
    position: 'システム管理者',
    roles: [
      {
        id: 'role-admin',
        tenantId: 'org-001',
        name: 'ADMIN',
        displayName: '管理者',
        color: '#FF0000',
        position: 1,
        permissions: [],
        userCount: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        system: false
      } as RoleResponse
    ],
    permissions: ['all'] as readonly string[],
    phone: '090-9876-5432',
    isActive: true,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date().toISOString(),
    preferences: {
      language: 'ja',
      theme: 'dark',
      notifications: {
        email: true,
        browser: true,
        mobile: true
      }
    }
  }],
  ['user-001', {
    id: 'user-001',
    email: 'user@example.com',
    name: '一般 次郎',
    displayName: 'Normal User',
    avatar: undefined,
    organizationId: 'org-001',
    organizationName: 'Astar Works',
    team: '営業部',
    position: '営業担当',
    roles: [
      {
        id: 'role-user',
        tenantId: 'org-001',
        name: 'USER',
        displayName: 'ユーザー',
        color: '#0000FF',
        position: 2,
        permissions: [],
        userCount: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        system: false
      } as RoleResponse
    ],
    permissions: ['users.view', 'self.edit'] as readonly string[],
    phone: '090-5555-5555',
    isActive: true,
    createdAt: new Date('2024-02-01').toISOString(),
    updatedAt: new Date().toISOString(),
    preferences: {
      language: 'ja',
      theme: 'light',
      notifications: {
        email: true,
        browser: false,
        mobile: false
      }
    }
  }]
])

// Mock user stats
const mockStats = new Map<string, UserStats>([
  ['dev-user-001', {
    activeCases: 12,
    tasksToday: 5,
    unreadMessages: 3,
    totalRevenue: 1250000,
    pendingInvoices: 2,
    hoursThisWeek: 38,
    hoursThisMonth: 152,
    completionRate: 0.92,
    averageResponseTime: 2.4
  }],
  ['admin-user-001', {
    activeCases: 25,
    tasksToday: 8,
    unreadMessages: 7,
    totalRevenue: 3500000,
    pendingInvoices: 5,
    hoursThisWeek: 42,
    hoursThisMonth: 168,
    completionRate: 0.95,
    averageResponseTime: 1.8
  }],
  ['user-001', {
    activeCases: 5,
    tasksToday: 3,
    unreadMessages: 1,
    totalRevenue: 450000,
    pendingInvoices: 1,
    hoursThisWeek: 35,
    hoursThisMonth: 140,
    completionRate: 0.88,
    averageResponseTime: 3.2
  }]
])

export class UserMockRepository extends BaseRepository implements UserRepository {
  
  constructor() {
    const client = useApiClient()
    super(client)
  }
  
  async list(_params?: Record<string, unknown>): Promise<IPaginatedResponse<UserProfile>> {
    // Simulate API delay
    await this.delay(200)
    
    const users = Array.from(mockUsers.values())
    
    return {
      data: users,
      total: users.length,
      page: 1,
      pageSize: 10,
      hasNext: false,
      hasPrev: false
    }
  }
  
  async get(id: string): Promise<UserProfile> {
    // Simulate API delay
    await this.delay(150)
    
    const user = mockUsers.get(id)
    if (!user) {
      throw new Error(`User not found: ${id}`)
    }
    
    return { ...user }
  }
  
  async getProfile(id: string): Promise<UserProfile> {
    return this.get(id)
  }
  
  async create(data: Partial<UserProfile>): Promise<UserProfile> {
    // Simulate API delay
    await this.delay(300)
    
    const id = `user-${Date.now()}`
    const newUser: UserProfile = {
      id,
      email: data.email || '',
      name: data.name || '',
      displayName: data.displayName,
      avatar: data.avatar,
      organizationId: 'org-001',
      organizationName: 'Astar Works',
      team: data.team,
      position: data.position,
      roles: [] as readonly RoleResponse[],
      permissions: [] as readonly string[],
      phone: data.phone,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      preferences: {
        language: 'ja',
        theme: 'light',
        notifications: {
          email: true,
          browser: true,
          mobile: false
        }
      }
    }
    
    mockUsers.set(id, newUser)
    return newUser
  }
  
  async update(id: string, data: Partial<UserProfile>): Promise<UserProfile> {
    // Convert Partial<UserProfile> to UpdateUserProfileDto
    const updateDto: UpdateUserProfileDto = {
      email: data.email || '',
      phone: data.phone,
      team: data.team,
      position: data.position,
      preferences: data.preferences as UpdateUserProfileDto['preferences']
    }
    return this.updateProfile(id, updateDto)
  }
  
  async updateProfile(id: string, data: UpdateUserProfileDto): Promise<UserProfile> {
    // Simulate API delay
    await this.delay(250)
    
    const user = mockUsers.get(id)
    if (!user) {
      throw new Error(`User not found: ${id}`)
    }
    
    const updatedUser: UserProfile = {
      ...user,
      email: data.email !== undefined ? data.email : user.email,
      phone: data.phone !== undefined ? data.phone : user.phone,
      team: data.team !== undefined ? data.team : user.team,
      position: data.position !== undefined ? data.position : user.position,
      preferences: data.preferences ? {
        ...user.preferences!,
        ...data.preferences
      } : user.preferences,
      updatedAt: new Date().toISOString()
    }
    
    mockUsers.set(id, updatedUser)
    return updatedUser
  }
  
  async delete(id: string): Promise<void> {
    // Simulate API delay
    await this.delay(200)
    
    if (!mockUsers.has(id)) {
      throw new Error(`User not found: ${id}`)
    }
    
    mockUsers.delete(id)
    mockStats.delete(id)
  }
  
  async getStats(id: string, params?: UserStatsParams): Promise<UserStats> {
    // Simulate API delay
    await this.delay(100)
    
    const stats = mockStats.get(id)
    if (!stats) {
      // Return default stats if not found
      return {
        activeCases: 0,
        tasksToday: 0,
        unreadMessages: 0,
        totalRevenue: 0,
        pendingInvoices: 0,
        hoursThisWeek: 0,
        hoursThisMonth: 0,
        completionRate: 0,
        averageResponseTime: 0
      }
    }
    
    // Simulate different stats based on period
    if (params?.period === 'day') {
      return {
        ...stats,
        activeCases: Math.floor(stats.activeCases / 7),
        tasksToday: stats.tasksToday,
        totalRevenue: stats.totalRevenue ? Math.floor(stats.totalRevenue / 30) : undefined
      }
    } else if (params?.period === 'week') {
      return {
        ...stats,
        totalRevenue: stats.totalRevenue ? Math.floor(stats.totalRevenue / 4) : undefined
      }
    }
    
    return { ...stats }
  }
  
  async uploadAvatar(id: string, _file: File): Promise<string> {
    // Simulate API delay
    await this.delay(500)
    
    const user = mockUsers.get(id)
    if (!user) {
      throw new Error(`User not found: ${id}`)
    }
    
    // Simulate file upload and return a mock URL
    const avatarUrl = `/images/avatars/${id}-${Date.now()}.png`
    
    user.avatar = avatarUrl
    user.updatedAt = new Date().toISOString()
    mockUsers.set(id, user)
    
    return avatarUrl
  }
  
  async removeAvatar(id: string): Promise<void> {
    // Simulate API delay
    await this.delay(200)
    
    const user = mockUsers.get(id)
    if (!user) {
      throw new Error(`User not found: ${id}`)
    }
    
    user.avatar = undefined
    user.updatedAt = new Date().toISOString()
    mockUsers.set(id, user)
  }
  
  async getByEmail(email: string): Promise<UserProfile | null> {
    // Simulate API delay
    await this.delay(150)
    
    const user = Array.from(mockUsers.values()).find(u => u.email === email)
    return user ? { ...user } : null
  }
  
  /**
   * Helper method to simulate network delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
/**
 * User Mock Repository
 * Implementation using mock data for development
 */

import { BaseRepository } from '@shared/api/core/BaseRepository'
import type { IPaginatedResponse } from '@shared/api/types'
import type { IUserRepository } from './IUserRepository'
import type { IUserProfile, IUserStats, IUserStatsParams, IUpdateUserProfileDto } from '../types'

// Mock user data
const mockUsers = new Map<string, IUserProfile>([
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
        name: 'ADMIN',
        displayName: '管理者',
        permissions: ['users.view', 'users.edit', 'settings.edit', 'all'] as const
      }
    ],
    permissions: ['users.view', 'users.edit', 'settings.edit', 'all'] as const,
    phone: '090-1234-5678',
    isActive: true,
    lastLoginAt: new Date(),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    preferences: {
      language: 'ja',
      timezone: 'Asia/Tokyo',
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
        name: 'ADMIN',
        displayName: '管理者',
        permissions: ['all'] as const
      }
    ],
    permissions: ['all'] as const,
    phone: '090-9876-5432',
    isActive: true,
    lastLoginAt: new Date(),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    preferences: {
      language: 'ja',
      timezone: 'Asia/Tokyo',
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
        name: 'USER',
        displayName: 'ユーザー',
        permissions: ['users.view', 'self.edit'] as const
      }
    ],
    permissions: ['users.view', 'self.edit'] as const,
    phone: '090-5555-5555',
    isActive: true,
    lastLoginAt: new Date(),
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date(),
    preferences: {
      language: 'ja',
      timezone: 'Asia/Tokyo',
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
const mockStats = new Map<string, IUserStats>([
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

export class UserMockRepository extends BaseRepository implements IUserRepository {
  
  async list(_params?: Record<string, unknown>): Promise<IPaginatedResponse<IUserProfile>> {
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
  
  async get(id: string): Promise<IUserProfile> {
    // Simulate API delay
    await this.delay(150)
    
    const user = mockUsers.get(id)
    if (!user) {
      throw new Error(`User not found: ${id}`)
    }
    
    return { ...user }
  }
  
  async getProfile(id: string): Promise<IUserProfile> {
    return this.get(id)
  }
  
  async create(data: Partial<IUserProfile>): Promise<IUserProfile> {
    // Simulate API delay
    await this.delay(300)
    
    const id = `user-${Date.now()}`
    const newUser: IUserProfile = {
      id,
      email: data.email || '',
      name: data.name,
      displayName: data.displayName,
      avatar: data.avatar,
      organizationId: 'org-001',
      organizationName: 'Astar Works',
      team: data.team,
      position: data.position,
      roles: [],
      permissions: [],
      phone: data.phone,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      preferences: {
        language: 'ja',
        timezone: 'Asia/Tokyo',
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
  
  async update(id: string, data: Partial<IUserProfile>): Promise<IUserProfile> {
    // Convert Partial<IUserProfile> to IUpdateUserProfileDto
    const updateDto: IUpdateUserProfileDto = {
      name: data.name !== null ? data.name : undefined,
      displayName: data.displayName,
      phone: data.phone,
      team: data.team,
      position: data.position,
      preferences: data.preferences as IUpdateUserProfileDto['preferences']
    }
    return this.updateProfile(id, updateDto)
  }
  
  async updateProfile(id: string, data: IUpdateUserProfileDto): Promise<IUserProfile> {
    // Simulate API delay
    await this.delay(250)
    
    const user = mockUsers.get(id)
    if (!user) {
      throw new Error(`User not found: ${id}`)
    }
    
    const updatedUser: IUserProfile = {
      ...user,
      name: data.name !== undefined ? data.name : user.name,
      displayName: data.displayName !== undefined ? data.displayName : user.displayName,
      phone: data.phone !== undefined ? data.phone : user.phone,
      team: data.team !== undefined ? data.team : user.team,
      position: data.position !== undefined ? data.position : user.position,
      preferences: data.preferences ? {
        ...user.preferences!,
        ...data.preferences
      } : user.preferences,
      updatedAt: new Date()
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
  
  async getStats(id: string, params?: IUserStatsParams): Promise<IUserStats> {
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
    user.updatedAt = new Date()
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
    user.updatedAt = new Date()
    mockUsers.set(id, user)
  }
  
  async getByEmail(email: string): Promise<IUserProfile | null> {
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
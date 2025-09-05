/**
 * User API Repository
 * Implementation using real API endpoints
 */

import { BaseRepository } from '@shared/api/core/BaseRepository'
import type { IPaginatedResponse } from '@shared/api/types'
import type { IUserRepository } from './IUserRepository'
import type { UserProfile, IUserStats, IUserStatsParams, IUpdateUserProfileDto } from '../types'

export class UserApiRepository extends BaseRepository implements IUserRepository {
  
  async list(params?: Record<string, unknown>): Promise<IPaginatedResponse<UserProfile>> {
    const queryString = this.buildQueryString(params)
    
    return this.client.request({
      method: 'GET',
      endpoint: `/users${queryString}`
    })
  }
  
  async get(id: string): Promise<UserProfile> {
    this.validateId(id)
    
    return this.client.request({
      method: 'GET',
      endpoint: `/users/${id}`
    })
  }
  
  async getProfile(id: string): Promise<UserProfile> {
    this.validateId(id)
    
    return this.client.request({
      method: 'GET',
      endpoint: `/users/${id}/profile`
    })
  }
  
  async create(data: Partial<UserProfile>): Promise<UserProfile> {
    this.validateRequiredFields(data, ['email'])
    
    return this.client.request({
      method: 'POST',
      endpoint: '/users',
      body: data
    })
  }
  
  async update(id: string, data: Partial<UserProfile>): Promise<UserProfile> {
    this.validateId(id)
    
    return this.client.request({
      method: 'PUT',
      endpoint: `/users/${id}`,
      body: data
    })
  }
  
  async updateProfile(id: string, data: IUpdateUserProfileDto): Promise<UserProfile> {
    this.validateId(id)
    
    return this.client.request({
      method: 'PATCH',
      endpoint: `/users/${id}/profile`,
      body: data
    })
  }
  
  async delete(id: string): Promise<void> {
    this.validateId(id)
    
    await this.client.request({
      method: 'DELETE',
      endpoint: `/users/${id}`
    })
  }
  
  async getStats(id: string, params?: IUserStatsParams): Promise<IUserStats> {
    this.validateId(id)
    
    const queryString = this.buildQueryString(params as Record<string, unknown>)
    
    return this.client.request({
      method: 'GET',
      endpoint: `/users/${id}/stats${queryString}`
    })
  }
  
  async uploadAvatar(id: string, file: File): Promise<string> {
    this.validateId(id)
    
    // Validate file
    if (!file) {
      throw new Error('File is required')
    }
    
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image')
    }
    
    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB')
    }
    
    // Create FormData
    const formData = new FormData()
    formData.append('avatar', file)
    
    const response = await this.client.request<{ url: string }>({
      method: 'POST',
      endpoint: `/users/${id}/avatar`,
      body: formData,
      headers: {
        // Let browser set Content-Type with boundary for multipart/form-data
      }
    })
    
    return response.url
  }
  
  async removeAvatar(id: string): Promise<void> {
    this.validateId(id)
    
    await this.client.request({
      method: 'DELETE',
      endpoint: `/users/${id}/avatar`
    })
  }
  
  async getByEmail(email: string): Promise<UserProfile | null> {
    if (!email || !email.includes('@')) {
      throw new Error('Valid email is required')
    }
    
    try {
      const response = await this.client.request<IPaginatedResponse<UserProfile>>({
        method: 'GET',
        endpoint: `/users?email=${encodeURIComponent(email)}`
      })
      
      return response.data[0] || null
    } catch (error) {
      // If 404, return null
      if (error instanceof Error && error.message.includes('404')) {
        return null
      }
      throw error
    }
  }
}
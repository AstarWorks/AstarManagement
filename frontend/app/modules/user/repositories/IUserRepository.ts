/**
 * User Repository Interface
 * Defines the contract for user data operations
 */

import type { IRepository } from '@shared/api/types'
import type { IUserProfile, IUserStats, IUserStatsParams, IUpdateUserProfileDto } from '../types'

export interface IUserRepository extends IRepository<IUserProfile> {
  /**
   * Get user profile by ID
   */
  getProfile(id: string): Promise<IUserProfile>
  
  /**
   * Update user profile
   */
  updateProfile(id: string, data: IUpdateUserProfileDto): Promise<IUserProfile>
  
  /**
   * Get user statistics
   */
  getStats(id: string, params?: IUserStatsParams): Promise<IUserStats>
  
  /**
   * Upload user avatar
   */
  uploadAvatar(id: string, file: File): Promise<string>
  
  /**
   * Remove user avatar
   */
  removeAvatar(id: string): Promise<void>
  
  /**
   * Get user by email (for search/lookup)
   */
  getByEmail(email: string): Promise<IUserProfile | null>
}
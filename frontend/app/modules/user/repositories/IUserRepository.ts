/**
 * User Repository Interface
 * Defines the contract for user data operations
 */

import type { IRepository } from '@shared/api/types'
import type { UserProfile, IUserStats, IUserStatsParams, IUpdateUserProfileDto } from '../types'

export interface IUserRepository extends IRepository<UserProfile> {
  /**
   * Get user profile by ID
   */
  getProfile(id: string): Promise<UserProfile>
  
  /**
   * Update user profile
   */
  updateProfile(id: string, data: IUpdateUserProfileDto): Promise<UserProfile>
  
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
  getByEmail(email: string): Promise<UserProfile | null>
}
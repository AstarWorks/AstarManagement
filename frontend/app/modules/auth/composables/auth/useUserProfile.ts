/**
 * Legacy composable for backward compatibility
 * @deprecated Use useAuthSession() for auth and useBusinessProfile() for business logic
 */

import { useBusinessProfile } from '../business/useBusinessProfile'

export const useUserProfile = () => {
  // Delegate to the new business profile composable
  return useBusinessProfile()
}
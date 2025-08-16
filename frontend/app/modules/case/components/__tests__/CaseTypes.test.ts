import { describe, it, expect } from 'vitest'
import { 
  isValidStatusTransition, 
  getNextAvailableStatuses, 
  getCaseStatusOrder,
  CASE_STATUSES 
} from "~/modules/case/types/case";
import type {CaseStatus} from "~/modules/case/types/case";

describe('Case Management Types', () => {
  describe('Status Transition Validation', () => {
    it('should allow valid status transitions', () => {
      expect(isValidStatusTransition('new', 'accepted')).toBe(true)
      expect(isValidStatusTransition('accepted', 'investigation')).toBe(true)
      expect(isValidStatusTransition('investigation', 'preparation')).toBe(true)
      expect(isValidStatusTransition('negotiation', 'completed')).toBe(true)
    })

    it('should reject invalid status transitions', () => {
      expect(isValidStatusTransition('new', 'trial')).toBe(false)
      expect(isValidStatusTransition('completed', 'new')).toBe(false)
      expect(isValidStatusTransition('new', 'completed')).toBe(false)
    })

    it('should return next available statuses correctly', () => {
      const newStatuses = getNextAvailableStatuses('new')
      expect(newStatuses).toEqual(['accepted'])

      const acceptedStatuses = getNextAvailableStatuses('accepted')
      expect(acceptedStatuses).toContain('investigation')
      expect(acceptedStatuses).toContain('completed')

      const completedStatuses = getNextAvailableStatuses('completed')
      expect(completedStatuses).toEqual([])
    })
  })

  describe('Case Status Ordering', () => {
    it('should return correct status order', () => {
      expect(getCaseStatusOrder('new')).toBe(1)
      expect(getCaseStatusOrder('accepted')).toBe(2)
      expect(getCaseStatusOrder('investigation')).toBe(3)
      expect(getCaseStatusOrder('preparation')).toBe(4)
      expect(getCaseStatusOrder('negotiation')).toBe(5)
      expect(getCaseStatusOrder('trial')).toBe(6)
      expect(getCaseStatusOrder('completed')).toBe(7)
    })

    it('should maintain proper progression order', () => {
      const statuses: CaseStatus[] = ['new', 'accepted', 'investigation', 'preparation', 'negotiation', 'trial', 'completed']
      
      for (let i = 0; i < statuses.length - 1; i++) {
        const currentOrder = getCaseStatusOrder(statuses[i]!)
        const nextOrder = getCaseStatusOrder(statuses[i + 1]!)
        expect(nextOrder).toBeGreaterThan(currentOrder)
      }
    })
  })

  describe('Case Status Labels', () => {
    it('should have proper Japanese labels for all statuses', () => {
      expect(CASE_STATUSES.new.label).toBe('新規')
      expect(CASE_STATUSES.accepted.label).toBe('受任')
      expect(CASE_STATUSES.investigation.label).toBe('調査')
      expect(CASE_STATUSES.preparation.label).toBe('準備')
      expect(CASE_STATUSES.negotiation.label).toBe('交渉')
      expect(CASE_STATUSES.trial.label).toBe('裁判')
      expect(CASE_STATUSES.completed.label).toBe('完了')
    })

    it('should have descriptions for all statuses', () => {
      Object.values(CASE_STATUSES).forEach(status => {
        expect(status.description).toBeDefined()
        expect(status.description.length).toBeGreaterThan(0)
      })
    })
  })
})
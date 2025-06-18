/**
 * Audit API service
 */

import { api } from '@/lib/api';
import type { AuditLog, AuditSearchParams, AuditStatistics } from '@/types/audit';

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export const auditService = {
  /**
   * Get audit trail for a specific entity
   */
  async getEntityAudit(
    entityType: string, 
    entityId: string, 
    params?: AuditSearchParams
  ): Promise<PagedResponse<AuditLog>> {
    const response = await api.get(`/v1/audit/entity/${entityType}/${entityId}`, {
      params
    });
    return response.data;
  },

  /**
   * Get user activity log
   */
  async getUserActivity(
    userId: string, 
    params?: AuditSearchParams
  ): Promise<PagedResponse<AuditLog>> {
    const response = await api.get(`/v1/audit/user/${userId}`, {
      params
    });
    return response.data;
  },

  /**
   * Search audit logs with advanced filters
   */
  async searchAuditLogs(params: AuditSearchParams): Promise<PagedResponse<AuditLog>> {
    const response = await api.post('/v1/audit/search', params);
    return response.data;
  },

  /**
   * Get audit statistics
   */
  async getStatistics(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<AuditStatistics> {
    const response = await api.get('/v1/audit/statistics', {
      params
    });
    return response.data;
  },

  /**
   * Export audit logs to CSV
   */
  async exportToCsv(params: AuditSearchParams): Promise<Blob> {
    const response = await api.post('/v1/audit/export', params, {
      responseType: 'blob',
      headers: {
        'Accept': 'text/csv'
      }
    });
    return response.data;
  },

  /**
   * Get matter-specific audit trail
   */
  async getMatterAudit(
    matterId: string,
    params?: AuditSearchParams
  ): Promise<PagedResponse<AuditLog>> {
    const response = await api.get(`/v1/matters/${matterId}/audit/comprehensive`, {
      params
    });
    return response.data;
  }
};
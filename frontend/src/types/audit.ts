/**
 * Audit types matching backend DTOs
 */

export enum AuditEventType {
  // CRUD Operations
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  
  // Authentication & Authorization
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',
  PERMISSION_GRANT = 'PERMISSION_GRANT',
  PERMISSION_REVOKE = 'PERMISSION_REVOKE',
  ROLE_ASSIGN = 'ROLE_ASSIGN',
  ROLE_UNASSIGN = 'ROLE_UNASSIGN',
  
  // File Operations
  FILE_UPLOAD = 'FILE_UPLOAD',
  FILE_DOWNLOAD = 'FILE_DOWNLOAD',
  FILE_VIEW = 'FILE_VIEW',
  FILE_DELETE = 'FILE_DELETE',
  FILE_SHARE = 'FILE_SHARE',
  
  // Status Changes
  STATUS_CHANGE = 'STATUS_CHANGE',
  WORKFLOW_TRANSITION = 'WORKFLOW_TRANSITION',
  
  // Data Export/Import
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  BULK_OPERATION = 'BULK_OPERATION',
  
  // System Events
  SYSTEM_CONFIG_CHANGE = 'SYSTEM_CONFIG_CHANGE',
  BACKUP_CREATE = 'BACKUP_CREATE',
  BACKUP_RESTORE = 'BACKUP_RESTORE',
  
  // Administrative
  AUDIT_VIEW = 'AUDIT_VIEW',
  AUDIT_EXPORT = 'AUDIT_EXPORT',
  DATA_RETENTION = 'DATA_RETENTION'
}

export interface AuditLog {
  id: string;
  eventType: AuditEventType;
  entityType: string;
  entityId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  eventDetails?: Record<string, any>;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  correlationId?: string;
  additionalContext?: Record<string, any>;
}

export interface AuditSearchParams {
  entityType?: string;
  entityId?: string;
  userId?: string;
  eventTypes?: AuditEventType[];
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface AuditStatistics {
  totalEvents: number;
  eventsByType: Record<AuditEventType, number>;
  eventsByUser: Record<string, number>;
  eventsByDate: Record<string, number>;
  securityEvents: number;
  dataModifications: number;
}

export interface TimelineGroup {
  date: string;
  events: AuditLog[];
}

export interface AuditFilterState {
  eventTypes: AuditEventType[];
  userId?: string;
  dateRange: {
    start?: Date;
    end?: Date;
  };
}
/**
 * Audit event card component for timeline display
 */

import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  User, 
  FileText, 
  Shield, 
  Download,
  Upload,
  Edit,
  Trash,
  LogIn,
  LogOut,
  Key,
  Settings,
  AlertCircle,
  XCircle,
  RefreshCw,
  GitBranch
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AuditLog, AuditEventType } from '@/types/audit';

interface AuditEventCardProps {
  event: AuditLog;
  isLast?: boolean;
}

/**
 * Get icon for audit event type
 */
function getEventIcon(eventType: AuditEventType) {
  const iconProps = { className: 'h-4 w-4' };
  
  switch (eventType) {
    case 'CREATE':
      return <FileText {...iconProps} className="h-4 w-4 text-green-600" />;
    case 'UPDATE':
      return <Edit {...iconProps} className="h-4 w-4 text-blue-600" />;
    case 'DELETE':
      return <Trash {...iconProps} className="h-4 w-4 text-red-600" />;
    case 'LOGIN':
      return <LogIn {...iconProps} className="h-4 w-4 text-green-600" />;
    case 'LOGOUT':
      return <LogOut {...iconProps} className="h-4 w-4 text-gray-600" />;
    case 'LOGIN_FAILED':
      return <XCircle {...iconProps} className="h-4 w-4 text-red-600" />;
    case 'FILE_UPLOAD':
      return <Upload {...iconProps} className="h-4 w-4 text-blue-600" />;
    case 'FILE_DOWNLOAD':
      return <Download {...iconProps} className="h-4 w-4 text-blue-600" />;
    case 'STATUS_CHANGE':
      return <RefreshCw {...iconProps} className="h-4 w-4 text-orange-600" />;
    case 'PERMISSION_GRANT':
    case 'PERMISSION_REVOKE':
      return <Shield {...iconProps} className="h-4 w-4 text-purple-600" />;
    case 'PASSWORD_CHANGE':
    case 'PASSWORD_RESET':
      return <Key {...iconProps} className="h-4 w-4 text-yellow-600" />;
    case 'SYSTEM_CONFIG_CHANGE':
      return <Settings {...iconProps} className="h-4 w-4 text-gray-600" />;
    default:
      return <AlertCircle {...iconProps} className="h-4 w-4 text-gray-500" />;
  }
}

/**
 * Get event type color
 */
function getEventTypeColor(eventType: AuditEventType): string {
  if (eventType.includes('CREATE')) return 'bg-green-100 text-green-800';
  if (eventType.includes('DELETE')) return 'bg-red-100 text-red-800';
  if (eventType.includes('UPDATE') || eventType.includes('CHANGE')) return 'bg-blue-100 text-blue-800';
  if (eventType.includes('LOGIN') || eventType.includes('LOGOUT')) return 'bg-purple-100 text-purple-800';
  if (eventType.includes('FILE')) return 'bg-cyan-100 text-cyan-800';
  if (eventType.includes('PERMISSION') || eventType.includes('ROLE')) return 'bg-orange-100 text-orange-800';
  return 'bg-gray-100 text-gray-800';
}

/**
 * Format event description
 */
function getEventDescription(event: AuditLog): string {
  const { eventType, entityType, eventDetails } = event;
  
  switch (eventType) {
    case 'CREATE':
      return `Created new ${entityType}`;
    case 'UPDATE':
      return `Updated ${entityType}`;
    case 'DELETE':
      return `Deleted ${entityType}`;
    case 'STATUS_CHANGE':
      return `Changed status from ${eventDetails?.oldStatus} to ${eventDetails?.newStatus}`;
    case 'FILE_UPLOAD':
      return `Uploaded file: ${eventDetails?.fileName}`;
    case 'LOGIN':
      return 'Logged in';
    case 'LOGOUT':
      return 'Logged out';
    case 'LOGIN_FAILED':
      return `Failed login attempt${eventDetails?.reason ? `: ${eventDetails.reason}` : ''}`;
    default:
      return eventType.toLowerCase().replace(/_/g, ' ');
  }
}

/**
 * Render field changes
 */
function FieldChanges({ oldValues, newValues }: { oldValues?: Record<string, unknown>; newValues?: Record<string, unknown> }) {
  if (!oldValues && !newValues) return null;
  
  const changedFields = new Set([
    ...Object.keys(oldValues || {}),
    ...Object.keys(newValues || {})
  ]);
  
  return (
    <div className="mt-3 space-y-2">
      <div className="text-sm font-medium text-gray-700">Changes:</div>
      <div className="space-y-1">
        {Array.from(changedFields).map(field => (
          <div key={field} className="text-sm">
            <span className="font-medium text-gray-600">{field}:</span>
            {oldValues?.[field] !== undefined && (
              <span className="ml-2 line-through text-red-600">
                {String(JSON.stringify(oldValues[field]))}
              </span>
            )}
            {newValues?.[field] !== undefined && (
              <span className="ml-2 text-green-600">
                {String(JSON.stringify(newValues[field]))}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AuditEventCard({ event, isLast = false }: AuditEventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const time = new Date(event.timestamp).toLocaleTimeString();
  
  return (
    <div className="relative flex items-start gap-4">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-5 top-10 h-full w-0.5 bg-gray-200" />
      )}
      
      {/* Icon */}
      <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white border-2 border-gray-200">
        {getEventIcon(event.eventType)}
      </div>
      
      {/* Content */}
      <Card className="flex-1 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className={cn('text-xs', getEventTypeColor(event.eventType))}>
                {event.eventType}
              </Badge>
              <span className="text-sm text-gray-600">{time}</span>
              {event.ipAddress && (
                <span className="text-xs text-gray-500">IP: {event.ipAddress}</span>
              )}
            </div>
            
            <p className="mt-1 text-sm font-medium">
              {getEventDescription(event)}
            </p>
            
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
              <User className="h-3 w-3" />
              <span>{event.userName} ({event.userRole})</span>
            </div>
            
            {(event.oldValues || event.newValues || event.eventDetails) && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              >
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                {isExpanded ? 'Hide details' : 'Show details'}
              </button>
            )}
            
            {isExpanded && (
              <div className="mt-3 border-t pt-3">
                <FieldChanges oldValues={event.oldValues} newValues={event.newValues} />
                
                {event.eventDetails && (
                  <div className="mt-3">
                    <div className="text-sm font-medium text-gray-700">Additional Details:</div>
                    <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-auto">
                      {JSON.stringify(event.eventDetails, null, 2)}
                    </pre>
                  </div>
                )}
                
                {event.correlationId && (
                  <div className="mt-2 text-xs text-gray-500">
                    <GitBranch className="inline h-3 w-3 mr-1" />
                    Correlation ID: {event.correlationId}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
/**
 * Audit timeline filter component
 */

import * as React from 'react';
import { Calendar, Filter, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { AuditEventType, type AuditFilterState } from '@/types/audit';

interface AuditFiltersProps {
  filters: AuditFilterState;
  onFiltersChange: (filters: AuditFilterState) => void;
  onExport: () => void;
  isExporting?: boolean;
}

/**
 * Event type groups for better organization
 */
const eventTypeGroups = {
  'Data Operations': [
    AuditEventType.CREATE,
    AuditEventType.UPDATE,
    AuditEventType.DELETE,
    AuditEventType.READ
  ],
  'Authentication': [
    AuditEventType.LOGIN,
    AuditEventType.LOGOUT,
    AuditEventType.LOGIN_FAILED,
    AuditEventType.TOKEN_REFRESH,
    AuditEventType.PASSWORD_CHANGE,
    AuditEventType.PASSWORD_RESET
  ],
  'File Operations': [
    AuditEventType.FILE_UPLOAD,
    AuditEventType.FILE_DOWNLOAD,
    AuditEventType.FILE_VIEW,
    AuditEventType.FILE_DELETE,
    AuditEventType.FILE_SHARE
  ],
  'Permissions': [
    AuditEventType.PERMISSION_GRANT,
    AuditEventType.PERMISSION_REVOKE,
    AuditEventType.ROLE_ASSIGN,
    AuditEventType.ROLE_UNASSIGN
  ],
  'System': [
    AuditEventType.SYSTEM_CONFIG_CHANGE,
    AuditEventType.BACKUP_CREATE,
    AuditEventType.BACKUP_RESTORE,
    AuditEventType.DATA_RETENTION
  ],
  'Other': [
    AuditEventType.STATUS_CHANGE,
    AuditEventType.WORKFLOW_TRANSITION,
    AuditEventType.EXPORT,
    AuditEventType.IMPORT,
    AuditEventType.BULK_OPERATION,
    AuditEventType.AUDIT_VIEW,
    AuditEventType.AUDIT_EXPORT
  ]
};

export function AuditFilters({ filters, onFiltersChange, onExport, isExporting }: AuditFiltersProps) {
  const activeFilterCount = filters.eventTypes.length + (filters.userId ? 1 : 0) + 
    (filters.dateRange.start || filters.dateRange.end ? 1 : 0);

  const handleEventTypeToggle = (eventType: AuditEventType) => {
    const newEventTypes = filters.eventTypes.includes(eventType)
      ? filters.eventTypes.filter(t => t !== eventType)
      : [...filters.eventTypes, eventType];
    
    onFiltersChange({
      ...filters,
      eventTypes: newEventTypes
    });
  };

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [field]: value ? new Date(value) : undefined
      }
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      eventTypes: [],
      userId: undefined,
      dateRange: { start: undefined, end: undefined }
    });
  };

  const [isFilterOpen, setIsFilterOpen] = React.useState(false);

  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-white border-b">
      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={() => setIsFilterOpen(true)}
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
        
        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetContent className="w-[400px] sm:max-w-[400px]">
            <SheetHeader>
              <SheetTitle>Filter Audit Logs</SheetTitle>
            </SheetHeader>
            
            <div className="mt-6 space-y-6">
              {/* Date Range */}
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date Range
                </h3>
                <div className="space-y-2">
                  <Input
                    type="date"
                    placeholder="Start date"
                    value={filters.dateRange.start?.toISOString().split('T')[0] || ''}
                    onChange={(e) => handleDateChange('start', e.target.value)}
                  />
                  <Input
                    type="date"
                    placeholder="End date"
                    value={filters.dateRange.end?.toISOString().split('T')[0] || ''}
                    onChange={(e) => handleDateChange('end', e.target.value)}
                  />
                </div>
              </div>

              {/* User Filter */}
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  User
                </h3>
                <Input
                  placeholder="Filter by user ID or email"
                  value={filters.userId || ''}
                  onChange={(e) => onFiltersChange({ ...filters, userId: e.target.value || undefined })}
                />
              </div>

              {/* Event Types */}
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Event Types
                </h3>
                <div className="space-y-4">
                  {Object.entries(eventTypeGroups).map(([group, types]) => (
                    <div key={group}>
                      <h4 className="text-xs font-medium text-gray-600 mb-2">{group}</h4>
                      <div className="space-y-2">
                        {types.map(type => (
                          <label key={type} className="flex items-center space-x-2 cursor-pointer">
                            <Checkbox
                              checked={filters.eventTypes.includes(type)}
                              onCheckedChange={() => handleEventTypeToggle(type)}
                            />
                            <span className="text-sm">{type.replace(/_/g, ' ')}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <Button onClick={clearFilters} variant="outline" size="sm" className="flex-1">
                Clear All
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Quick filters */}
        <div className="flex gap-2">
          {filters.dateRange.start && (
            <Badge variant="secondary" className="gap-1">
              From: {filters.dateRange.start.toLocaleDateString()}
              <button
                onClick={() => handleDateChange('start', '')}
                className="ml-1 hover:text-red-600"
              >
                ×
              </button>
            </Badge>
          )}
          {filters.dateRange.end && (
            <Badge variant="secondary" className="gap-1">
              To: {filters.dateRange.end.toLocaleDateString()}
              <button
                onClick={() => handleDateChange('end', '')}
                className="ml-1 hover:text-red-600"
              >
                ×
              </button>
            </Badge>
          )}
          {filters.userId && (
            <Badge variant="secondary" className="gap-1">
              User: {filters.userId}
              <button
                onClick={() => onFiltersChange({ ...filters, userId: undefined })}
                className="ml-1 hover:text-red-600"
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      </div>

      <Button
        onClick={onExport}
        disabled={isExporting}
        size="sm"
        variant="outline"
      >
        {isExporting ? 'Exporting...' : 'Export CSV'}
      </Button>
    </div>
  );
}
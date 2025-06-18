/**
 * Hook for managing audit timeline data with infinite scroll
 */

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { auditService, type PagedResponse } from '@/services/audit.service';
import type { AuditLog, AuditSearchParams, TimelineGroup } from '@/types/audit';

export interface UseAuditTimelineOptions extends AuditSearchParams {
  entityType?: string;
  entityId?: string;
  matterId?: string;
  enabled?: boolean;
}

/**
 * Groups audit logs by date for timeline display
 */
function groupAuditLogsByDate(logs: AuditLog[]): TimelineGroup[] {
  const groups = new Map<string, AuditLog[]>();
  
  logs.forEach(log => {
    const date = new Date(log.timestamp).toLocaleDateString();
    if (!groups.has(date)) {
      groups.set(date, []);
    }
    groups.get(date)!.push(log);
  });
  
  return Array.from(groups.entries())
    .map(([date, events]) => ({ date, events }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Hook for fetching and managing audit timeline data
 */
export function useAuditTimeline(options: UseAuditTimelineOptions) {
  const {
    entityType,
    entityId,
    matterId,
    enabled = true,
    ...searchParams
  } = options;

  // Determine which API to call based on parameters
  const queryKey = matterId
    ? ['audit', 'matter', matterId, searchParams]
    : entityType && entityId
    ? ['audit', 'entity', entityType, entityId, searchParams]
    : ['audit', 'search', searchParams];

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error
  } = useInfiniteQuery<PagedResponse<AuditLog>, Error>({
    queryKey,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const params: AuditSearchParams = {
        ...searchParams,
        page: pageParam as number,
        size: searchParams.size || 50
      };

      if (matterId) {
        return auditService.getMatterAudit(matterId, params);
      } else if (entityType && entityId) {
        return auditService.getEntityAudit(entityType, entityId, params);
      } else {
        return auditService.searchAuditLogs(params);
      }
    },
    getNextPageParam: (lastPage: PagedResponse<AuditLog>) => {
      if (lastPage.last) return undefined;
      return lastPage.number + 1;
    },
    enabled
  });

  // Flatten all pages and group by date
  const timelineGroups = useMemo(() => {
    if (!data) return [];
    
    const allLogs = data.pages.flatMap((page: PagedResponse<AuditLog>) => page.content);
    return groupAuditLogsByDate(allLogs);
  }, [data]);

  const totalEvents = data?.pages?.[0]?.totalElements || 0;

  return {
    timelineGroups,
    totalEvents,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error
  };
}

/**
 * Hook for exporting audit logs
 */
export function useAuditExport() {
  const exportAuditLogs = async (params: AuditSearchParams) => {
    const blob = await auditService.exportToCsv(params);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return { exportAuditLogs };
}
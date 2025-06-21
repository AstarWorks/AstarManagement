/**
 * Main audit timeline component with virtual scrolling
 */

import React, { useRef, useCallback, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Loader2, AlertCircle } from 'lucide-react';
import { AuditEventCard } from './AuditEventCard';
import { AuditFilters } from './AuditFilters';
import { useAuditTimeline, useAuditExport } from '@/hooks/useAuditTimeline';
import { cn } from '@/lib/utils';
import type { AuditFilterState, AuditSearchParams, AuditLog } from '@/types/audit';

interface AuditTimelineProps {
  entityType?: string;
  entityId?: string;
  matterId?: string;
  className?: string;
}

export function AuditTimeline({ 
  entityType, 
  entityId, 
  matterId,
  className 
}: AuditTimelineProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<AuditFilterState>({
    eventTypes: [],
    dateRange: {}
  });

  // Convert filters to search params
  const searchParams: AuditSearchParams = {
    eventTypes: filters.eventTypes.length > 0 ? filters.eventTypes : undefined,
    userId: filters.userId,
    startDate: filters.dateRange.start?.toISOString(),
    endDate: filters.dateRange.end?.toISOString()
  };

  const {
    timelineGroups,
    totalEvents,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error
  } = useAuditTimeline({
    entityType,
    entityId,
    matterId,
    ...searchParams
  });

  const { exportAuditLogs } = useAuditExport();
  const [isExporting, setIsExporting] = useState(false);

  // Flatten timeline groups for virtualization
  const allItems = React.useMemo(() => {
    const items: Array<{ type: 'date' | 'event'; data: AuditLog | string; groupIndex: number; eventIndex?: number }> = [];
    
    timelineGroups.forEach((group, groupIndex) => {
      items.push({ type: 'date', data: group.date, groupIndex });
      group.events.forEach((event, eventIndex) => {
        items.push({ type: 'event', data: event, groupIndex, eventIndex });
      });
    });
    
    return items;
  }, [timelineGroups]);

  // Virtual list configuration
  const rowVirtualizer = useVirtualizer({
    count: allItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback((index: number) => {
      return allItems[index].type === 'date' ? 40 : 120;
    }, [allItems]),
    overscan: 5
  });

  // Load more when scrolling near the bottom
  React.useEffect(() => {
    const [lastItem] = rowVirtualizer.getVirtualItems().slice(-1);
    
    if (!lastItem) return;
    
    if (
      lastItem.index >= allItems.length - 5 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    rowVirtualizer,
    allItems.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage
  ]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportAuditLogs({
        entityType,
        entityId,
        ...searchParams
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
        <p className="text-sm text-gray-600">Failed to load audit logs</p>
        <p className="text-xs text-gray-500 mt-1">{error?.message}</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full bg-gray-50', className)}>
      <AuditFilters
        filters={filters}
        onFiltersChange={setFilters}
        onExport={handleExport}
        isExporting={isExporting}
      />
      
      <div className="flex-1 overflow-hidden">
        <div
          ref={parentRef}
          className="h-full overflow-auto"
        >
          {allItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">No audit logs found</p>
              <p className="text-xs text-gray-500 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative'
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                const item = allItems[virtualItem.index];
                
                return (
                  <div
                    key={virtualItem.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`
                    }}
                  >
                    {item.type === 'date' ? (
                      <div className="sticky top-0 z-20 bg-gray-50 px-6 py-2">
                        <div className="text-sm font-medium text-gray-700">
                          {item.data as string}
                        </div>
                      </div>
                    ) : (
                      <div className="px-6 py-2">
                        <AuditEventCard
                          event={item.data as AuditLog}
                          isLast={
                            virtualItem.index === allItems.length - 1 ||
                            (allItems[virtualItem.index + 1]?.type === 'date')
                          }
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
            </div>
          )}
        </div>
      </div>
      
      {totalEvents > 0 && (
        <div className="border-t bg-white px-6 py-2 text-xs text-gray-600">
          Showing {allItems.filter(i => i.type === 'event').length} of {totalEvents} events
        </div>
      )}
    </div>
  );
}
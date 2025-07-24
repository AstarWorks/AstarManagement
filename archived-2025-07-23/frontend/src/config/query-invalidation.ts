import type { QueryClient } from '@tanstack/vue-query'
import { useQueryClient } from '@tanstack/vue-query'
import type { Matter, MatterStatus } from '~/types/matter'

/**
 * Query key patterns for different query types
 */
export const QUERY_KEYS = {
  // Matter queries
  matters: {
    all: ['matters'] as const,
    lists: () => [...QUERY_KEYS.matters.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...QUERY_KEYS.matters.lists(), filters] as const,
    details: () => [...QUERY_KEYS.matters.all, 'detail'] as const,
    detail: (id: string) => [...QUERY_KEYS.matters.details(), id] as const,
  },
  
  // Kanban queries
  kanban: {
    all: ['kanban'] as const,
    boards: () => [...QUERY_KEYS.kanban.all, 'board'] as const,
    board: (id?: string) => [...QUERY_KEYS.kanban.boards(), id] as const,
    columns: () => [...QUERY_KEYS.kanban.all, 'column'] as const,
    column: (status: MatterStatus) => [...QUERY_KEYS.kanban.columns(), status] as const,
  },
  
  // Activity/History queries
  activity: {
    all: ['activity'] as const,
    matter: (matterId: string) => [...QUERY_KEYS.activity.all, 'matter', matterId] as const,
    user: (userId: string) => [...QUERY_KEYS.activity.all, 'user', userId] as const,
    recent: () => [...QUERY_KEYS.activity.all, 'recent'] as const,
  },
  
  // Search queries
  search: {
    all: ['search'] as const,
    results: (query: string) => [...QUERY_KEYS.search.all, query] as const,
  },
  
  // Statistics/Analytics queries
  stats: {
    all: ['stats'] as const,
    dashboard: () => [...QUERY_KEYS.stats.all, 'dashboard'] as const,
    kanban: () => [...QUERY_KEYS.stats.all, 'kanban'] as const,
    matter: (matterId: string) => [...QUERY_KEYS.stats.all, 'matter', matterId] as const,
  },
  
  // Background sync queries
  sync: {
    all: ['sync'] as const,
    status: () => [...QUERY_KEYS.sync.all, 'status'] as const,
    queue: () => [...QUERY_KEYS.sync.all, 'queue'] as const,
  },
} as const

/**
 * Invalidation scope types
 */
export type InvalidationScope = 'immediate' | 'background' | 'conditional'

/**
 * Invalidation pattern configuration
 */
export interface InvalidationPattern {
  queries: Array<((...args: any[]) => readonly unknown[])>
  scope?: InvalidationScope
  condition?: (data: any) => boolean
  delay?: number // milliseconds
}

/**
 * Mutation types
 */
export type MutationType =
  | 'matter:create'
  | 'matter:update'
  | 'matter:delete'
  | 'matter:move'
  | 'matter:bulk-move'
  | 'matter:status-change'
  | 'matter:assign'
  | 'matter:archive'
  | 'matter:restore'
  | 'document:upload'
  | 'document:delete'
  | 'comment:create'
  | 'comment:update'
  | 'comment:delete'

/**
 * Query invalidation configuration
 * Defines which queries to invalidate for each mutation type
 */
export const INVALIDATION_CONFIG: Record<MutationType, InvalidationPattern[]> = {
  'matter:create': [
    {
      queries: [
        () => QUERY_KEYS.matters.lists(),
        () => QUERY_KEYS.kanban.boards(),
        () => QUERY_KEYS.stats.dashboard(),
      ],
      scope: 'immediate',
    },
    {
      queries: [
        () => QUERY_KEYS.activity.recent(),
        () => QUERY_KEYS.stats.kanban(),
      ],
      scope: 'background',
    },
  ],
  
  'matter:update': [
    {
      queries: [
        (data: { id: string }) => QUERY_KEYS.matters.detail(data.id),
        () => QUERY_KEYS.matters.lists(),
        () => QUERY_KEYS.kanban.boards(),
      ],
      scope: 'immediate',
    },
    {
      queries: [
        (data: { id: string }) => QUERY_KEYS.activity.matter(data.id),
        () => QUERY_KEYS.activity.recent(),
      ],
      scope: 'background',
    },
  ],
  
  'matter:delete': [
    {
      queries: [
        () => QUERY_KEYS.matters.lists(),
        () => QUERY_KEYS.kanban.boards(),
        () => QUERY_KEYS.stats.dashboard(),
        () => QUERY_KEYS.stats.kanban(),
      ],
      scope: 'immediate',
    },
    {
      queries: [
        () => QUERY_KEYS.activity.recent(),
        () => QUERY_KEYS.search.all,
      ],
      scope: 'background',
    },
  ],
  
  'matter:move': [
    {
      queries: [
        (data: { matterId: string; fromStatus: MatterStatus; toStatus: MatterStatus }) => [
          QUERY_KEYS.matters.detail(data.matterId),
          QUERY_KEYS.kanban.column(data.fromStatus),
          QUERY_KEYS.kanban.column(data.toStatus),
        ],
      ],
      scope: 'immediate',
    },
    {
      queries: [
        () => QUERY_KEYS.kanban.boards(),
        () => QUERY_KEYS.stats.kanban(),
        (data: { matterId: string }) => QUERY_KEYS.activity.matter(data.matterId),
      ],
      scope: 'background',
      delay: 100,
    },
  ],
  
  'matter:bulk-move': [
    {
      queries: [
        () => QUERY_KEYS.kanban.all,
        () => QUERY_KEYS.matters.lists(),
        () => QUERY_KEYS.stats.kanban(),
      ],
      scope: 'immediate',
    },
    {
      queries: [
        () => QUERY_KEYS.activity.recent(),
        () => QUERY_KEYS.search.all,
      ],
      scope: 'background',
      delay: 500,
    },
  ],
  
  'matter:status-change': [
    {
      queries: [
        (data: { matterId: string; newStatus: MatterStatus }) => [
          QUERY_KEYS.matters.detail(data.matterId),
          QUERY_KEYS.kanban.column(data.newStatus),
        ],
      ],
      scope: 'immediate',
    },
    {
      queries: [
        () => QUERY_KEYS.matters.lists(),
        () => QUERY_KEYS.stats.dashboard(),
        (data: { matterId: string }) => QUERY_KEYS.activity.matter(data.matterId),
      ],
      scope: 'conditional',
      condition: (data) => data.newStatus === 'completed' || data.newStatus === 'cancelled',
    },
  ],
  
  'matter:assign': [
    {
      queries: [
        (data: { matterId: string }) => QUERY_KEYS.matters.detail(data.matterId),
        () => QUERY_KEYS.matters.lists(),
      ],
      scope: 'immediate',
    },
    {
      queries: [
        (data: { matterId: string; assigneeId: string }) => [
          QUERY_KEYS.activity.matter(data.matterId),
          QUERY_KEYS.activity.user(data.assigneeId),
        ],
      ],
      scope: 'background',
    },
  ],
  
  'matter:archive': [
    {
      queries: [
        () => QUERY_KEYS.matters.lists(),
        () => QUERY_KEYS.kanban.boards(),
        () => QUERY_KEYS.stats.all,
      ],
      scope: 'immediate',
    },
  ],
  
  'matter:restore': [
    {
      queries: [
        () => QUERY_KEYS.matters.lists(),
        () => QUERY_KEYS.kanban.boards(),
        () => QUERY_KEYS.stats.all,
      ],
      scope: 'immediate',
    },
  ],
  
  'document:upload': [
    {
      queries: [
        (data: { matterId: string }) => QUERY_KEYS.matters.detail(data.matterId),
      ],
      scope: 'immediate',
    },
    {
      queries: [
        (data: { matterId: string }) => QUERY_KEYS.activity.matter(data.matterId),
        () => QUERY_KEYS.activity.recent(),
      ],
      scope: 'background',
    },
  ],
  
  'document:delete': [
    {
      queries: [
        (data: { matterId: string }) => QUERY_KEYS.matters.detail(data.matterId),
      ],
      scope: 'immediate',
    },
  ],
  
  'comment:create': [
    {
      queries: [
        (data: { matterId: string }) => QUERY_KEYS.matters.detail(data.matterId),
        (data: { matterId: string }) => QUERY_KEYS.activity.matter(data.matterId),
      ],
      scope: 'immediate',
    },
  ],
  
  'comment:update': [
    {
      queries: [
        (data: { matterId: string }) => QUERY_KEYS.matters.detail(data.matterId),
      ],
      scope: 'immediate',
    },
  ],
  
  'comment:delete': [
    {
      queries: [
        (data: { matterId: string }) => QUERY_KEYS.matters.detail(data.matterId),
      ],
      scope: 'immediate',
    },
  ],
}

/**
 * Invalidation executor
 * Handles the actual query invalidation based on patterns
 */
export class InvalidationExecutor {
  constructor(private queryClient: QueryClient) {}
  
  /**
   * Execute invalidations for a mutation
   */
  async execute(
    mutationType: MutationType,
    data?: any,
    options?: {
      skipBackground?: boolean
      forceImmediate?: boolean
    }
  ): Promise<void> {
    const patterns = INVALIDATION_CONFIG[mutationType]
    if (!patterns) return
    
    const promises: Promise<void>[] = []
    
    for (const pattern of patterns) {
      // Check condition if specified
      if (pattern.condition && !pattern.condition(data)) {
        continue
      }
      
      // Skip background invalidations if requested
      if (options?.skipBackground && pattern.scope === 'background') {
        continue
      }
      
      // Force immediate execution if requested
      const scope = options?.forceImmediate ? 'immediate' : pattern.scope
      
      // Execute based on scope
      if (scope === 'immediate') {
        promises.push(this.invalidateQueries(pattern, data))
      } else if (scope === 'background') {
        // Use setTimeout for background invalidations
        setTimeout(() => {
          this.invalidateQueries(pattern, data)
        }, pattern.delay || 0)
      } else if (scope === 'conditional') {
        promises.push(this.invalidateQueries(pattern, data))
      }
    }
    
    await Promise.all(promises)
  }
  
  /**
   * Invalidate queries based on pattern
   */
  private async invalidateQueries(
    pattern: InvalidationPattern,
    data?: any
  ): Promise<void> {
    const queryKeys = pattern.queries.flatMap(queryFn => {
      const result = queryFn(data)
      // Handle nested arrays (e.g., from matter:move)
      return Array.isArray(result[0]) ? result : [result]
    })
    
    await Promise.all(
      queryKeys.map(queryKey =>
        this.queryClient.invalidateQueries({ queryKey: queryKey as readonly unknown[] })
      )
    )
  }
  
  /**
   * Invalidate all queries (nuclear option)
   */
  async invalidateAll(): Promise<void> {
    await this.queryClient.invalidateQueries()
  }
  
  /**
   * Invalidate queries matching a predicate
   */
  async invalidateMatching(
    predicate: (query: any) => boolean
  ): Promise<void> {
    await this.queryClient.invalidateQueries({ predicate })
  }
}

/**
 * Create invalidation executor instance
 */
export function createInvalidationExecutor(queryClient: QueryClient): InvalidationExecutor {
  return new InvalidationExecutor(queryClient)
}

/**
 * Composable for using invalidation executor
 */
export function useQueryInvalidation() {
  const queryClient = useQueryClient()
  const executor = createInvalidationExecutor(queryClient)
  
  return {
    invalidate: executor.execute.bind(executor),
    invalidateAll: executor.invalidateAll.bind(executor),
    invalidateMatching: executor.invalidateMatching.bind(executor),
  }
}

/**
 * Utility to get all query keys for a specific entity
 */
export function getEntityQueryKeys(entityType: 'matter' | 'kanban' | 'activity', entityId?: string): any[][] {
  switch (entityType) {
    case 'matter':
      return entityId
        ? [
            [...QUERY_KEYS.matters.detail(entityId)],
            [...QUERY_KEYS.activity.matter(entityId)],
            [...QUERY_KEYS.stats.matter(entityId)],
          ]
        : [
            [...QUERY_KEYS.matters.all],
            [...QUERY_KEYS.activity.all],
            [...QUERY_KEYS.stats.all],
          ]
    
    case 'kanban':
      return [
        [...QUERY_KEYS.kanban.all],
        [...QUERY_KEYS.stats.kanban()],
      ]
    
    case 'activity':
      return [
        [...QUERY_KEYS.activity.all],
      ]
    
    default:
      return []
  }
}

/**
 * Batch invalidation helper
 */
export async function batchInvalidate(
  queryClient: QueryClient,
  queryKeys: any[][]
): Promise<void> {
  await Promise.all(
    queryKeys.map(queryKey =>
      queryClient.invalidateQueries({ queryKey })
    )
  )
}
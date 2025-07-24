/**
 * IndexedDB Persister for TanStack Query
 * 
 * @description Provides persistent storage for TanStack Query cache using IndexedDB.
 * Implements compression, versioning, and automatic cleanup for optimal performance
 * in legal case management scenarios where offline access is critical.
 * 
 * @author Claude
 * @created 2025-06-26
 */

import type { PersistedClient, Persister } from '@tanstack/query-persist-client-core'
import { compress, decompress } from './compression'

/**
 * IndexedDB configuration for query persistence
 */
export interface IndexedDBPersisterConfig {
  /** Database name */
  dbName?: string
  /** Store name within the database */
  storeName?: string
  /** Database version */
  version?: number
  /** Maximum cache size in bytes (default: 50MB) */
  maxCacheSize?: number
  /** Enable compression for large data (default: true) */
  enableCompression?: boolean
  /** Compression threshold in bytes (default: 1KB) */
  compressionThreshold?: number
  /** Cache key for storing the persisted client */
  cacheKey?: string
  /** Enable debug logging */
  debug?: boolean
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Required<IndexedDBPersisterConfig> = {
  dbName: 'aster-query-cache',
  storeName: 'query-cache',
  version: 1,
  maxCacheSize: 50 * 1024 * 1024, // 50MB
  enableCompression: true,
  compressionThreshold: 1024, // 1KB
  cacheKey: 'tanstack-query-cache',
  debug: process.env.NODE_ENV === 'development'
}

/**
 * Cache entry structure in IndexedDB
 */
interface CacheEntry {
  key: string
  data: string
  compressed: boolean
  size: number
  timestamp: number
  version: number
}

/**
 * Opens or creates the IndexedDB database
 */
async function openDatabase(config: Required<IndexedDBPersisterConfig>): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(config.dbName, config.version)
    
    request.onerror = () => {
      reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`))
    }
    
    request.onsuccess = () => {
      resolve(request.result)
    }
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      
      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(config.storeName)) {
        const store = db.createObjectStore(config.storeName, { keyPath: 'key' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
        store.createIndex('size', 'size', { unique: false })
      }
    }
  })
}

/**
 * Calculate the size of serialized data in bytes
 */
function calculateSize(data: string): number {
  return new Blob([data]).size
}

/**
 * Cleanup old cache entries to stay within size limits
 */
async function cleanupCache(
  db: IDBDatabase,
  config: Required<IndexedDBPersisterConfig>,
  currentSize: number
): Promise<void> {
  if (currentSize <= config.maxCacheSize) {
    return
  }
  
  const transaction = db.transaction([config.storeName], 'readwrite')
  const store = transaction.objectStore(config.storeName)
  const index = store.index('timestamp')
  
  // Get all entries sorted by timestamp (oldest first)
  const entries: CacheEntry[] = []
  const cursorRequest = index.openCursor()
  
  return new Promise((resolve, reject) => {
    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result
      if (cursor) {
        entries.push(cursor.value as CacheEntry)
        cursor.continue()
      } else {
        // Calculate how much space to free
        let bytesToFree = currentSize - config.maxCacheSize
        let i = 0
        
        // Delete oldest entries until we're under the limit
        while (bytesToFree > 0 && i < entries.length) {
          const entry = entries[i]
          store.delete(entry.key)
          bytesToFree -= entry.size
          i++
          
          if (config.debug) {
            console.debug(`[IndexedDB] Deleted old cache entry: ${entry.key}`)
          }
        }
        
        resolve()
      }
    }
    
    cursorRequest.onerror = () => {
      reject(new Error('Failed to cleanup cache'))
    }
  })
}

/**
 * Get the total size of all cache entries
 */
async function getCacheSize(
  db: IDBDatabase,
  config: Required<IndexedDBPersisterConfig>
): Promise<number> {
  const transaction = db.transaction([config.storeName], 'readonly')
  const store = transaction.objectStore(config.storeName)
  const request = store.getAll()
  
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const entries = request.result as CacheEntry[]
      const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0)
      resolve(totalSize)
    }
    
    request.onerror = () => {
      reject(new Error('Failed to calculate cache size'))
    }
  })
}

/**
 * Creates an IndexedDB persister for TanStack Query
 */
export function createIndexedDBPersister(
  userConfig: IndexedDBPersisterConfig = {}
): Persister {
  const config: Required<IndexedDBPersisterConfig> = {
    ...DEFAULT_CONFIG,
    ...userConfig
  }
  
  let db: IDBDatabase | null = null
  
  /**
   * Initialize the database connection
   */
  async function initDatabase(): Promise<IDBDatabase> {
    if (!db) {
      db = await openDatabase(config)
    }
    return db
  }
  
  /**
   * Persist the client data to IndexedDB
   */
  async function persistClient(client: PersistedClient): Promise<void> {
    try {
      const database = await initDatabase()
      const serialized = JSON.stringify(client)
      const size = calculateSize(serialized)
      
      // Determine if compression is needed
      const shouldCompress = config.enableCompression && size > config.compressionThreshold
      let dataToStore = serialized
      
      if (shouldCompress) {
        try {
          dataToStore = await compress(serialized)
          if (config.debug) {
            const compressedSize = calculateSize(dataToStore)
            const ratio = ((1 - compressedSize / size) * 100).toFixed(1)
            console.debug(`[IndexedDB] Compressed cache: ${size} → ${compressedSize} bytes (${ratio}% reduction)`)
          }
        } catch (error) {
          console.warn('[IndexedDB] Compression failed, storing uncompressed:', error)
          dataToStore = serialized
        }
      }
      
      // Store the cache entry
      const entry: CacheEntry = {
        key: config.cacheKey,
        data: dataToStore,
        compressed: shouldCompress && dataToStore !== serialized,
        size: calculateSize(dataToStore),
        timestamp: Date.now(),
        version: config.version
      }
      
      // Start transaction
      const transaction = database.transaction([config.storeName], 'readwrite')
      const store = transaction.objectStore(config.storeName)
      
      await new Promise<void>((resolve, reject) => {
        const request = store.put(entry)
        
        request.onsuccess = () => {
          if (config.debug) {
            console.debug(`[IndexedDB] Persisted cache (${entry.size} bytes, compressed: ${entry.compressed})`)
          }
          resolve()
        }
        
        request.onerror = () => {
          reject(new Error(`Failed to persist cache: ${request.error?.message}`))
        }
      })
      
      // Cleanup old entries if needed
      const currentSize = await getCacheSize(database, config)
      if (currentSize > config.maxCacheSize) {
        await cleanupCache(database, config, currentSize)
      }
      
    } catch (error) {
      console.error('[IndexedDB] Failed to persist client:', error)
      throw error
    }
  }
  
  /**
   * Restore the client data from IndexedDB
   */
  async function restoreClient(): Promise<PersistedClient | undefined> {
    try {
      const database = await initDatabase()
      const transaction = database.transaction([config.storeName], 'readonly')
      const store = transaction.objectStore(config.storeName)
      
      return new Promise((resolve, reject) => {
        const request = store.get(config.cacheKey)
        
        request.onsuccess = async () => {
          const entry = request.result as CacheEntry | undefined
          
          if (!entry) {
            if (config.debug) {
              console.debug('[IndexedDB] No cached data found')
            }
            resolve(undefined)
            return
          }
          
          // Check version compatibility
          if (entry.version !== config.version) {
            if (config.debug) {
              console.debug(`[IndexedDB] Cache version mismatch (${entry.version} !== ${config.version}), ignoring`)
            }
            resolve(undefined)
            return
          }
          
          try {
            let data = entry.data
            
            // Decompress if needed
            if (entry.compressed) {
              data = await decompress(data)
              if (config.debug) {
                console.debug('[IndexedDB] Decompressed cache data')
              }
            }
            
            const client = JSON.parse(data) as PersistedClient
            
            if (config.debug) {
              const age = Date.now() - entry.timestamp
              console.debug(`[IndexedDB] Restored cache (age: ${Math.round(age / 1000)}s)`)
            }
            
            resolve(client)
          } catch (error) {
            console.error('[IndexedDB] Failed to parse cached data:', error)
            // Delete corrupted data
            store.delete(config.cacheKey)
            resolve(undefined)
          }
        }
        
        request.onerror = () => {
          reject(new Error(`Failed to restore cache: ${request.error?.message}`))
        }
      })
    } catch (error) {
      console.error('[IndexedDB] Failed to restore client:', error)
      return undefined
    }
  }
  
  /**
   * Remove the persisted client data
   */
  async function removeClient(): Promise<void> {
    try {
      const database = await initDatabase()
      const transaction = database.transaction([config.storeName], 'readwrite')
      const store = transaction.objectStore(config.storeName)
      
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(config.cacheKey)
        
        request.onsuccess = () => {
          if (config.debug) {
            console.debug('[IndexedDB] Removed cached data')
          }
          resolve()
        }
        
        request.onerror = () => {
          reject(new Error(`Failed to remove cache: ${request.error?.message}`))
        }
      })
    } catch (error) {
      console.error('[IndexedDB] Failed to remove client:', error)
      throw error
    }
  }
  
  return {
    persistClient,
    restoreClient,
    removeClient
  }
}

/**
 * Check if IndexedDB is available in the current environment
 */
export function isIndexedDBAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  
  try {
    // Check basic availability
    if (!window.indexedDB) {
      return false
    }
    
    // Test if we can actually use it (might be blocked in some contexts)
    const testDb = indexedDB.open('test')
    testDb.onsuccess = () => {
      indexedDB.deleteDatabase('test')
    }
    
    return true
  } catch {
    return false
  }
}

/**
 * Get cache statistics for monitoring
 */
export async function getCacheStats(
  userConfig: IndexedDBPersisterConfig = {}
): Promise<{
  totalSize: number
  entryCount: number
  oldestEntry: number | null
  newestEntry: number | null
}> {
  const config: Required<IndexedDBPersisterConfig> = {
    ...DEFAULT_CONFIG,
    ...userConfig
  }
  
  try {
    const db = await openDatabase(config)
    const transaction = db.transaction([config.storeName], 'readonly')
    const store = transaction.objectStore(config.storeName)
    const request = store.getAll()
    
    return new Promise((resolve) => {
      request.onsuccess = () => {
        const entries = request.result as CacheEntry[]
        
        if (entries.length === 0) {
          resolve({
            totalSize: 0,
            entryCount: 0,
            oldestEntry: null,
            newestEntry: null
          })
          return
        }
        
        const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0)
        const timestamps = entries.map(e => e.timestamp)
        
        resolve({
          totalSize,
          entryCount: entries.length,
          oldestEntry: Math.min(...timestamps),
          newestEntry: Math.max(...timestamps)
        })
      }
      
      request.onerror = () => {
        resolve({
          totalSize: 0,
          entryCount: 0,
          oldestEntry: null,
          newestEntry: null
        })
      }
    })
  } catch {
    return {
      totalSize: 0,
      entryCount: 0,
      oldestEntry: null,
      newestEntry: null
    }
  }
}
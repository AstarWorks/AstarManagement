/**
 * Service Worker for Offline Capability
 * 
 * @description Provides offline functionality for the Kanban board mobile interface.
 * Caches critical resources and enables offline queue with sync on reconnection.
 */

const CACHE_NAME = 'aster-management-v1'
const STATIC_CACHE_NAME = 'aster-static-v1'
const DATA_CACHE_NAME = 'aster-data-v1'

// Resources to cache for offline functionality
const STATIC_RESOURCES = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
]

// API routes to cache
const API_ROUTES = [
  '/api/matters',
  '/api/matters/*/validate-transition'
]

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    Promise.all([
      // Cache static resources
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('Service Worker: Caching static resources')
        return cache.addAll(STATIC_RESOURCES)
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DATA_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      
      // Take control of all clients
      self.clients.claim()
    ])
  )
})

// Fetch event - handle offline requests
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request))
    return
  }
  
  // Handle static resources
  event.respondWith(handleStaticRequest(request))
})

/**
 * Handle API requests with cache-first strategy for GET requests
 * and network-first with offline queue for mutations
 */
async function handleApiRequest(request) {
  const isGETRequest = request.method === 'GET'
  
  if (isGETRequest) {
    // Cache-first strategy for GET requests
    try {
      const cachedResponse = await caches.match(request)
      if (cachedResponse) {
        // Return cached data and update cache in background
        updateCacheInBackground(request)
        return cachedResponse
      }
      
      // Fetch from network and cache
      const response = await fetch(request)
      if (response.ok) {
        const cache = await caches.open(DATA_CACHE_NAME)
        cache.put(request, response.clone())
      }
      return response
      
    } catch (error) {
      console.warn('Service Worker: API request failed, trying cache:', error)
      const cachedResponse = await caches.match(request)
      if (cachedResponse) {
        return cachedResponse
      }
      
      // Return offline response
      return new Response(
        JSON.stringify({ 
          error: 'Offline', 
          message: 'This data is not available offline' 
        }),
        { 
          status: 503, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }
  } else {
    // Handle POST/PUT/DELETE requests with offline queue
    return handleMutationRequest(request)
  }
}

/**
 * Handle mutation requests (POST/PUT/DELETE) with offline queue
 */
async function handleMutationRequest(request) {
  try {
    const response = await fetch(request)
    
    if (response.ok) {
      // Success - invalidate related cache entries
      await invalidateRelatedCache(request)
    }
    
    return response
    
  } catch (error) {
    console.warn('Service Worker: Mutation request failed, queueing for retry:', error)
    
    // Queue for later sync
    await queueRequestForSync(request)
    
    // Return optimistic response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Request queued for when you\'re back online',
        queued: true 
      }),
      { 
        status: 202, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }
}

/**
 * Handle static resource requests with cache-first strategy
 */
async function handleStaticRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Fetch from network
    const response = await fetch(request)
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME)
      cache.put(request, response.clone())
    }
    
    return response
    
  } catch (error) {
    // Try cache as fallback
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html') || new Response(
        '<!DOCTYPE html><html><body><h1>You are offline</h1><p>Please check your connection and try again.</p></body></html>',
        { headers: { 'Content-Type': 'text/html' } }
      )
    }
    
    throw error
  }
}

/**
 * Update cache in background for GET requests
 */
async function updateCacheInBackground(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(DATA_CACHE_NAME)
      await cache.put(request, response)
    }
  } catch (error) {
    console.warn('Service Worker: Background cache update failed:', error)
  }
}

/**
 * Invalidate cache entries related to a mutation
 */
async function invalidateRelatedCache(request) {
  const url = new URL(request.url)
  const cache = await caches.open(DATA_CACHE_NAME)
  
  // Invalidate related API cache entries
  if (url.pathname.includes('/matters')) {
    const cacheKeys = await cache.keys()
    const relatedKeys = cacheKeys.filter(key => 
      key.url.includes('/api/matters')
    )
    
    await Promise.all(
      relatedKeys.map(key => cache.delete(key))
    )
  }
}

/**
 * Queue request for sync when online
 */
async function queueRequestForSync(request) {
  const requestData = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: request.method !== 'GET' ? await request.text() : null,
    timestamp: Date.now()
  }
  
  // Store in IndexedDB for persistence
  const db = await openDB()
  const transaction = db.transaction(['sync_queue'], 'readwrite')
  const store = transaction.objectStore('sync_queue')
  await store.add(requestData)
}

/**
 * Open IndexedDB for offline queue
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('aster_offline_db', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('sync_queue')) {
        const store = db.createObjectStore('sync_queue', { 
          keyPath: 'id', 
          autoIncrement: true 
        })
        store.createIndex('timestamp', 'timestamp')
      }
    }
  })
}

// Background sync event
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncQueuedRequests())
  }
})

/**
 * Sync queued requests when back online
 */
async function syncQueuedRequests() {
  try {
    const db = await openDB()
    const transaction = db.transaction(['sync_queue'], 'readonly')
    const store = transaction.objectStore('sync_queue')
    const requests = await store.getAll()
    
    for (const requestData of requests) {
      try {
        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body
        })
        
        if (response.ok) {
          // Remove from queue on success
          const deleteTransaction = db.transaction(['sync_queue'], 'readwrite')
          const deleteStore = deleteTransaction.objectStore('sync_queue')
          await deleteStore.delete(requestData.id)
          
          console.log('Service Worker: Synced queued request:', requestData.url)
        }
      } catch (error) {
        console.warn('Service Worker: Failed to sync request:', error)
      }
    }
  } catch (error) {
    console.error('Service Worker: Sync failed:', error)
  }
}

// Message handling for client communication
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CACHE_MATTERS') {
    // Pre-cache matter data
    cacheMatters(event.data.matters)
  }
})

/**
 * Pre-cache matter data for offline access
 */
async function cacheMatters(matters) {
  try {
    const cache = await caches.open(DATA_CACHE_NAME)
    
    // Cache individual matter requests
    for (const matter of matters) {
      const request = new Request(`/api/matters/${matter.id}`)
      const response = new Response(JSON.stringify(matter), {
        headers: { 'Content-Type': 'application/json' }
      })
      await cache.put(request, response)
    }
    
    console.log('Service Worker: Cached matters for offline access')
  } catch (error) {
    console.error('Service Worker: Failed to cache matters:', error)
  }
}
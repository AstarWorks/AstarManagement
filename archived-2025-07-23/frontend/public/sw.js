/**
 * Service Worker for Aster Management
 * 
 * @description Implements offline support with strategic caching, background sync,
 * and network request interception. Optimized for legal case management scenarios
 * where reliable offline access is critical.
 * 
 * @author Claude
 * @created 2025-06-26
 */

// Import Workbox libraries
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

// Check if Workbox loaded successfully
if (!workbox) {
  console.error('Workbox failed to load');
} else {
  console.log('Workbox loaded successfully');
  
  // Set workbox config
  workbox.setConfig({
    debug: false // Set to true in development
  });
  
  // Configure Workbox modules
  const { precacheAndRoute, cleanupOutdatedCaches } = workbox.precaching;
  const { registerRoute, NavigationRoute } = workbox.routing;
  const { CacheFirst, NetworkFirst, StaleWhileRevalidate } = workbox.strategies;
  const { ExpirationPlugin } = workbox.expiration;
  const { CacheableResponsePlugin } = workbox.cacheableResponse;
  const { BackgroundSyncPlugin } = workbox.backgroundSync;
  const { Queue } = workbox.backgroundSync;
  
  // Cache version for manual cache management
  const CACHE_VERSION = 'v1';
  const CACHE_NAMES = {
    static: `aster-static-${CACHE_VERSION}`,
    api: `aster-api-${CACHE_VERSION}`,
    documents: `aster-documents-${CACHE_VERSION}`,
    images: `aster-images-${CACHE_VERSION}`
  };
  
  // API endpoints configuration
  const API_BASE = '/api';
  const API_PATTERNS = {
    matters: /\/api\/matters/,
    documents: /\/api\/documents/,
    users: /\/api\/users/,
    settings: /\/api\/settings/
  };
  
  // Skip waiting and claim clients immediately
  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });
  
  self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
  });
  
  // Precache static assets (populated by build process)
  // In production, this would be populated by workbox-webpack-plugin
  precacheAndRoute(self.__WB_MANIFEST || []);
  
  // Clean up old caches
  cleanupOutdatedCaches();
  
  // ====================
  // Caching Strategies
  // ====================
  
  // 1. Static Assets (JS, CSS) - Cache First
  registerRoute(
    ({ request }) => 
      request.destination === 'script' ||
      request.destination === 'style' ||
      request.url.includes('/_nuxt/'),
    new CacheFirst({
      cacheName: CACHE_NAMES.static,
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200]
        }),
        new ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          purgeOnQuotaError: true
        })
      ]
    })
  );
  
  // 2. Images - Cache First with expiration
  registerRoute(
    ({ request }) => request.destination === 'image',
    new CacheFirst({
      cacheName: CACHE_NAMES.images,
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200]
        }),
        new ExpirationPlugin({
          maxEntries: 200,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          purgeOnQuotaError: true
        })
      ]
    })
  );
  
  // 3. API - Matters (Network First with cache fallback)
  registerRoute(
    ({ url }) => url.pathname.match(API_PATTERNS.matters),
    new NetworkFirst({
      cacheName: CACHE_NAMES.api,
      networkTimeoutSeconds: 5,
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200]
        }),
        new ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 5 * 60, // 5 minutes
          purgeOnQuotaError: true
        })
      ]
    })
  );
  
  // 4. API - Documents (Cache First for immutable documents)
  registerRoute(
    ({ url }) => url.pathname.match(API_PATTERNS.documents) && url.pathname.includes('/download'),
    new CacheFirst({
      cacheName: CACHE_NAMES.documents,
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200]
        }),
        new ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          purgeOnQuotaError: true
        })
      ]
    })
  );
  
  // 5. API - Other endpoints (Stale While Revalidate)
  registerRoute(
    ({ url }) => url.pathname.startsWith(API_BASE),
    new StaleWhileRevalidate({
      cacheName: CACHE_NAMES.api,
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200]
        }),
        new ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
          purgeOnQuotaError: true
        })
      ]
    })
  );
  
  // ====================
  // Background Sync
  // ====================
  
  // Queue for failed API mutations
  const bgSyncQueue = new Queue('aster-mutations', {
    onSync: async ({ queue }) => {
      let entry;
      while ((entry = await queue.shiftRequest())) {
        try {
          const response = await fetch(entry.request.clone());
          
          if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
          }
          
          // Notify client of successful sync
          const clients = await self.clients.matchAll();
          clients.forEach(client => {
            client.postMessage({
              type: 'MUTATION_SYNCED',
              payload: {
                url: entry.request.url,
                method: entry.request.method,
                timestamp: entry.timestamp
              }
            });
          });
          
        } catch (error) {
          console.error('Background sync failed:', error);
          // Put request back in queue
          await queue.unshiftRequest(entry);
          throw error;
        }
      }
    },
    maxRetentionTime: 24 * 60 // 24 hours
  });
  
  // Register background sync for POST/PUT/DELETE requests
  registerRoute(
    ({ url, request }) => 
      url.pathname.startsWith(API_BASE) &&
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method),
    async ({ event }) => {
      try {
        const response = await fetch(event.request.clone());
        return response;
      } catch (error) {
        // Queue failed mutation for background sync
        await bgSyncQueue.pushRequest({ request: event.request });
        
        // Return a custom response indicating the request was queued
        return new Response(
          JSON.stringify({
            error: 'offline',
            message: 'Request queued for sync',
            queued: true
          }),
          {
            status: 202, // Accepted
            headers: {
              'Content-Type': 'application/json',
              'X-Offline-Queue': 'true'
            }
          }
        );
      }
    },
    'POST'
  );
  
  // ====================
  // Offline Fallback
  // ====================
  
  // Navigation fallback for SPA
  const navigationRoute = new NavigationRoute(
    new NetworkFirst({
      cacheName: CACHE_NAMES.static,
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200]
        })
      ]
    })
  );
  
  registerRoute(navigationRoute);
  
  // ====================
  // Cache Management
  // ====================
  
  // Periodic cache cleanup
  self.addEventListener('message', async (event) => {
    if (event.data && event.data.type === 'CLEANUP_CACHE') {
      const cacheNames = await caches.keys();
      const validCacheNames = Object.values(CACHE_NAMES);
      
      await Promise.all(
        cacheNames
          .filter(name => !validCacheNames.includes(name))
          .map(name => caches.delete(name))
      );
      
      event.ports[0].postMessage({ type: 'CACHE_CLEANED' });
    }
  });
  
  // ====================
  // Update Detection
  // ====================
  
  self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    // Force the waiting service worker to become active
    self.skipWaiting();
  });
  
  self.addEventListener('activate', (event) => {
    console.log('Service Worker activated');
    // Clean up old caches
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              // Delete old version caches
              return cacheName.startsWith('aster-') && 
                     !Object.values(CACHE_NAMES).includes(cacheName);
            })
            .map(cacheName => {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
    );
  });
  
  // ====================
  // Debug Helpers
  // ====================
  
  if (process.env.NODE_ENV === 'development') {
    self.addEventListener('fetch', (event) => {
      console.log('[SW] Fetch:', event.request.url, event.request.method);
    });
    
    self.addEventListener('sync', (event) => {
      console.log('[SW] Background sync:', event.tag);
    });
  }
}

// Fallback for browsers without module support
self.addEventListener('fetch', function(event) {
  // This will be handled by Workbox if it loaded successfully
});
/* filepath: frontend/public/sw.js */
const CACHE_NAME = 'signalstack-v1.0.0';
const API_CACHE_NAME = 'signalstack-api-v1.0.0';
const STATIC_CACHE_NAME = 'signalstack-static-v1.0.0';

// Files to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/offline.html'
];

// API endpoints to cache
const API_CACHE_URLS = [
  '/api/portfolio',
  '/api/prices',
  '/api/user/profile'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_CACHE_URLS);
      }),
      
      // Cache API responses
      caches.open(API_CACHE_NAME).then((cache) => {
        return Promise.all(
          API_CACHE_URLS.map(url => {
            return fetch(url).then(response => {
              if (response.ok) {
                return cache.put(url, response);
              }
            }).catch(() => {
              // Ignore fetch errors during install
            });
          })
        );
      })
    ]).then(() => {
      // Force activation of new service worker
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME && name !== API_CACHE_NAME && name !== STATIC_CACHE_NAME)
            .map(name => caches.delete(name))
        );
      }),
      
      // Claim all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests with appropriate caching strategies
  if (url.pathname.startsWith('/api/')) {
    // API requests - Network First with API cache fallback
    event.respondWith(networkFirstStrategy(request, API_CACHE_NAME));
  } else if (url.pathname.startsWith('/static/')) {
    // Static assets - Cache First
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE_NAME));
  } else {
    // HTML pages - Network First with static cache fallback
    event.respondWith(networkFirstStrategy(request, STATIC_CACHE_NAME));
  }
});

// Caching Strategies

// Cache First - serve from cache, fallback to network
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Cache First strategy failed:', error);
    return new Response('Offline content not available', { status: 503 });
  }
}

// Network First - try network, fallback to cache
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Background Sync
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'portfolio-sync') {
    event.waitUntil(syncPortfolioData());
  } else if (event.tag === 'price-sync') {
    event.waitUntil(syncPriceData());
  }
});

async function syncPortfolioData() {
  try {
    // Get offline data from IndexedDB or localStorage
    const offlineData = await getOfflineData('portfolio');
    
    if (offlineData.length > 0) {
      // Send offline data to server
      const response = await fetch('/api/portfolio/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(offlineData)
      });
      
      if (response.ok) {
        // Clear offline data after successful sync
        await clearOfflineData('portfolio');
        console.log('Portfolio data synced successfully');
      }
    }
  } catch (error) {
    console.error('Portfolio sync failed:', error);
  }
}

async function syncPriceData() {
  try {
    // Fetch latest price data
    const response = await fetch('/api/prices/latest');
    
    if (response.ok) {
      const priceData = await response.json();
      
      // Update cache with latest prices
      const cache = await caches.open(API_CACHE_NAME);
      cache.put('/api/prices', new Response(JSON.stringify(priceData)));
      
      console.log('Price data synced successfully');
    }
  } catch (error) {
    console.error('Price sync failed:', error);
  }
}

// Push Notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  const options = {
    body: 'You have new updates in SignalStack',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'signalstack-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/icon-192x192.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      options.body = data.message || options.body;
      options.tag = data.tag || options.tag;
      options.data = data;
    } catch (error) {
      console.error('Failed to parse push data:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('SignalStack', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Message handler for commands from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

// Utility functions
async function getOfflineData(type) {
  // In a real app, use IndexedDB for better offline storage
  try {
    const data = await new Promise((resolve) => {
      // Mock offline data retrieval
      resolve([]);
    });
    return data;
  } catch (error) {
    console.error('Failed to get offline data:', error);
    return [];
  }
}

async function clearOfflineData(type) {
  try {
    // Mock offline data clearing
    console.log(`Clearing offline data for: ${type}`);
    return true;
  } catch (error) {
    console.error('Failed to clear offline data:', error);
    return false;
  }
}

// Performance monitoring
self.addEventListener('fetch', (event) => {
  const startTime = Date.now();
  
  event.respondWith(
    handleRequest(event.request).then((response) => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Log performance metrics
      console.log(`Request to ${event.request.url} took ${duration}ms`);
      
      return response;
    })
  );
});

async function handleRequest(request) {
  // Your existing fetch handling logic
  return fetch(request);
}
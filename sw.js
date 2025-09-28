// Later App Service Worker
// Advanced caching strategies for optimal offline experience

const CACHE_VERSION = 'later-v1.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const ARTICLE_CACHE = `${CACHE_VERSION}-articles`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Static assets that should always be cached
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/js/app.js',
  '/src/js/data.js',
  '/src/js/navigation.js',
  '/src/js/capture.js',
  '/src/js/items.js',
  '/src/js/enhanced-swipe.js',
  '/src/js/reader.js',
  '/src/js/context-detection.js',
  '/src/js/search.js',
  '/src/js/pattern-tracker.js',
  '/src/js/scoring-engine.js',
  '/src/js/moment-detector.js',
  '/src/js/suggestion-coordinator.js',
  '/src/js/card-factory.js',
  '/src/js/mock-data-generator.js',
  '/src/js/ai-service.js',
  '/src/styles/app.css',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest',
  'https://unpkg.com/@mozilla/readability/Readability.js'
];

// URLs that should always fetch from network first
const NETWORK_FIRST_URLS = [
  '/api/',
  '/share',
  '/handle-protocol'
];

// Maximum cache sizes
const MAX_CACHE_SIZES = {
  [DYNAMIC_CACHE]: 50,
  [ARTICLE_CACHE]: 100,
  [IMAGE_CACHE]: 200
};

self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Caching static assets...');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { credentials: 'same-origin' })));
      }),

      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      cleanupOldCaches(),

      // Claim all clients immediately
      self.clients.claim(),

      // Set up background sync
      setupBackgroundSync()
    ])
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle different types of requests with appropriate strategies
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isArticleContent(request)) {
    event.respondWith(handleArticleContent(request));
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else if (isNetworkFirst(request)) {
    event.respondWith(handleNetworkFirst(request));
  } else if (request.method === 'GET') {
    event.respondWith(handleDynamicContent(request));
  }
});

// Handle share target
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (url.pathname === '/share' && event.request.method === 'POST') {
    event.respondWith(handleShareTarget(event.request));
  }
});

// Background sync for offline captures
self.addEventListener('sync', event => {
  console.log('[SW] Background sync event:', event.tag);

  if (event.tag === 'background-capture') {
    event.waitUntil(syncOfflineCaptures());
  } else if (event.tag === 'background-article-fetch') {
    event.waitUntil(prefetchUserArticles());
  }
});

// Push notifications for reminders
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: data.tag || 'later-notification',
      renotify: true,
      requireInteraction: data.urgent || false,
      actions: data.actions || [
        {
          action: 'view',
          title: 'View',
          icon: '/icons/action-view.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icons/action-dismiss.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  const { notification, action } = event;

  if (action === 'dismiss') {
    notification.close();
    return;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      // Try to focus existing window
      const existingClient = clients.find(client => client.url.includes('index.html'));

      if (existingClient) {
        existingClient.focus();
        existingClient.postMessage({
          type: 'NOTIFICATION_CLICK',
          data: notification.data
        });
      } else {
        // Open new window
        self.clients.openWindow('/index.html?notification=' + encodeURIComponent(JSON.stringify(notification.data)));
      }

      notification.close();
    })
  );
});

// Caching strategies
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      // Serve from cache, update in background
      fetchAndUpdateCache(request, cache);
      return cachedResponse;
    }

    // Not in cache, fetch and cache
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Static asset fetch failed:', error);
    return new Response('Offline content not available', { status: 503 });
  }
}

async function handleArticleContent(request) {
  try {
    const cache = await caches.open(ARTICLE_CACHE);

    // Try network first for fresh content
    try {
      const response = await fetch(request);
      if (response.ok) {
        // Cache successful responses
        cache.put(request, response.clone());
        return response;
      }
    } catch (networkError) {
      console.log('[SW] Network failed for article, trying cache...');
    }

    // Fall back to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // No cache available
    return new Response('Article not available offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  } catch (error) {
    console.log('[SW] Article content error:', error);
    return new Response('Error loading article', { status: 500 });
  }
}

async function handleImageRequest(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Fetch and cache
    const response = await fetch(request);
    if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
      // Only cache if it's actually an image
      cache.put(request, response.clone());
      trimCache(IMAGE_CACHE, MAX_CACHE_SIZES[IMAGE_CACHE]);
    }

    return response;
  } catch (error) {
    console.log('[SW] Image fetch failed:', error);
    // Return a placeholder image
    return new Response(createPlaceholderSVG(), {
      headers: { 'Content-Type': 'image/svg+xml' }
    });
  }
}

async function handleNetworkFirst(request) {
  try {
    const response = await fetch(request);

    // Cache successful GET requests
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
      trimCache(DYNAMIC_CACHE, MAX_CACHE_SIZES[DYNAMIC_CACHE]);
    }

    return response;
  } catch (error) {
    console.log('[SW] Network first failed, trying cache...');

    if (request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE);
      const cachedResponse = await cache.match(request);

      if (cachedResponse) {
        return cachedResponse;
      }
    }

    return new Response('Service unavailable offline', { status: 503 });
  }
}

async function handleDynamicContent(request) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);

    // Try cache first for dynamic content
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      // Serve from cache, update in background
      fetchAndUpdateCache(request, cache);
      return cachedResponse;
    }

    // Not in cache, fetch and cache
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
      trimCache(DYNAMIC_CACHE, MAX_CACHE_SIZES[DYNAMIC_CACHE]);
    }

    return response;
  } catch (error) {
    console.log('[SW] Dynamic content error:', error);
    return new Response('Content not available offline', { status: 503 });
  }
}

async function handleShareTarget(request) {
  try {
    const formData = await request.formData();
    const title = formData.get('title') || '';
    const text = formData.get('text') || '';
    const url = formData.get('url') || '';

    // Store the shared content for the app to pick up
    const sharedContent = {
      title,
      text,
      url,
      timestamp: Date.now(),
      id: generateId()
    };

    // Store in IndexedDB or send via message
    await storeSharedContent(sharedContent);

    // Redirect to the app
    return Response.redirect('/?shared=' + sharedContent.id, 302);
  } catch (error) {
    console.log('[SW] Share target error:', error);
    return Response.redirect('/', 302);
  }
}

// Background sync functions
async function syncOfflineCaptures() {
  try {
    const offlineCaptures = await getOfflineCaptures();

    for (const capture of offlineCaptures) {
      try {
        // Try to sync the capture
        await fetch('/api/captures', {
          method: 'POST',
          body: JSON.stringify(capture),
          headers: { 'Content-Type': 'application/json' }
        });

        // Remove from offline storage on success
        await removeOfflineCapture(capture.id);
      } catch (error) {
        console.log('[SW] Failed to sync capture:', capture.id, error);
      }
    }
  } catch (error) {
    console.log('[SW] Background sync error:', error);
  }
}

async function prefetchUserArticles() {
  try {
    // Get user's reading patterns and prefetch likely articles
    const userData = await getUserData();
    const articlesToPrefetch = await getRecommendedArticles(userData);

    const cache = await caches.open(ARTICLE_CACHE);

    for (const articleUrl of articlesToPrefetch) {
      try {
        const response = await fetch(articleUrl);
        if (response.ok) {
          await cache.put(articleUrl, response);
        }
      } catch (error) {
        console.log('[SW] Failed to prefetch:', articleUrl);
      }
    }
  } catch (error) {
    console.log('[SW] Prefetch error:', error);
  }
}

// Utility functions
function isStaticAsset(request) {
  const url = new URL(request.url);
  return STATIC_ASSETS.some(asset => url.pathname.endsWith(asset) || asset.includes(url.pathname));
}

function isArticleContent(request) {
  const url = new URL(request.url);
  return url.pathname.includes('/article/') ||
         url.searchParams.has('url') ||
         request.headers.get('accept')?.includes('text/html');
}

function isImageRequest(request) {
  return request.destination === 'image' ||
         request.headers.get('accept')?.includes('image/');
}

function isNetworkFirst(request) {
  const url = new URL(request.url);
  return NETWORK_FIRST_URLS.some(pattern => url.pathname.startsWith(pattern));
}

async function fetchAndUpdateCache(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
  } catch (error) {
    // Silent background update failure
  }
}

async function trimCache(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    if (keys.length > maxItems) {
      // Remove oldest items (simple FIFO)
      const itemsToDelete = keys.slice(0, keys.length - maxItems);
      await Promise.all(itemsToDelete.map(key => cache.delete(key)));
    }
  } catch (error) {
    console.log('[SW] Cache trim error:', error);
  }
}

async function cleanupOldCaches() {
  try {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name => !name.startsWith(CACHE_VERSION));

    await Promise.all(oldCaches.map(name => caches.delete(name)));
    console.log('[SW] Cleaned up old caches:', oldCaches);
  } catch (error) {
    console.log('[SW] Cache cleanup error:', error);
  }
}

function createPlaceholderSVG() {
  return `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="#334155"/>
      <text x="200" y="150" text-anchor="middle" fill="#94a3b8" font-family="system-ui" font-size="16">
        Image unavailable offline
      </text>
    </svg>
  `;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

async function setupBackgroundSync() {
  // Register for background sync events
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    try {
      await self.registration.sync.register('background-capture');
      await self.registration.sync.register('background-article-fetch');
    } catch (error) {
      console.log('[SW] Background sync registration failed:', error);
    }
  }
}

// IndexedDB helpers for offline storage
async function storeSharedContent(content) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('LaterApp', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['sharedContent'], 'readwrite');
      const store = transaction.objectStore('sharedContent');

      store.add(content).onsuccess = () => resolve();
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('sharedContent')) {
        db.createObjectStore('sharedContent', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('offlineCaptures')) {
        db.createObjectStore('offlineCaptures', { keyPath: 'id' });
      }
    };
  });
}

async function getOfflineCaptures() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('LaterApp', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['offlineCaptures'], 'readonly');
      const store = transaction.objectStore('offlineCaptures');

      store.getAll().onsuccess = (event) => resolve(event.target.result);
    };
  });
}

async function removeOfflineCapture(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('LaterApp', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['offlineCaptures'], 'readwrite');
      const store = transaction.objectStore('offlineCaptures');

      store.delete(id).onsuccess = () => resolve();
    };
  });
}

// Mock functions for article prefetching (to be implemented based on user data)
async function getUserData() {
  // Return user reading patterns, preferences, etc.
  return {};
}

async function getRecommendedArticles(userData) {
  // Return URLs of articles likely to be read by user
  return [];
}
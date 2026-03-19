// Dhanveer Service Worker v9
// Enables offline support and app-like experience

const CACHE = 'dhanveer-v9';
const ASSETS = [
  '/dhanveer/',
  '/dhanveer/index.html',
  'https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400;700&display=swap'
];

// Install — cache core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => {
      // Cache what we can, ignore failures
      return Promise.allSettled(ASSETS.map(url => c.add(url).catch(() => {})));
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, cache fallback
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always fetch API calls fresh (never cache Dhan/Anthropic data)
  if (url.hostname.includes('dhan') ||
      url.hostname.includes('anthropic') ||
      url.hostname.includes('cloudflare') ||
      url.hostname.includes('fyers')) {
    return; // Pass through to network
  }

  // For app assets — network first, cache fallback
  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Cache successful responses
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Network failed — try cache
        return caches.match(e.request).then(cached => {
          if (cached) return cached;
          // Return offline page for navigation requests
          if (e.request.mode === 'navigate') {
            return caches.match('/dhanveer/index.html');
          }
        });
      })
  );
});

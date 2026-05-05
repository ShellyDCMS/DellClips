const CACHE_NAME = "dellclips-v1";

// Files to cache for offline app shell
const STATIC_ASSETS = ["/", "/login", "/feed", "/verify", "/icons/icon.svg"];

// Install: cache the app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// Fetch: network-first strategy for API, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip API routes and auth routes — always go to network
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/api/auth/")) {
    return;
  }

  // Skip video streams — don't cache HLS content
  if (
    url.pathname.includes(".m3u8") ||
    url.pathname.includes(".ts") ||
    url.hostname.includes("cloudflarestream") ||
    url.hostname.includes("mux.dev") ||
    url.hostname.includes("akamaihd") ||
    url.hostname.includes("unified-streaming")
  ) {
    return;
  }

  // For everything else: try network first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed — try cache
        return caches.match(event.request).then((cached) => {
          return cached || new Response("Offline", { status: 503 });
        });
      })
  );
});

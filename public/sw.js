const CACHE_NAME = "dellclips-v4";

// Files to cache for offline app shell (static assets only)
const STATIC_ASSETS = ["/icons/icon.svg", "/icons/icon-192.png", "/icons/icon-512.png"];

// ============================================
// INSTALL: Cache the static assets only
// ============================================
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Activate immediately — don't wait for old SW to finish
  self.skipWaiting();
});

// ============================================
// ACTIVATE: Clean up ALL old caches
// ============================================
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

// ============================================
// FETCH: Network-first for everything
// Only cache static assets (icons, fonts, CSS)
// NEVER cache pages, API calls, or video streams
// ============================================
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests entirely (POST, PUT, DELETE, etc.)
  if (event.request.method !== "GET") return;

  // ---- NEVER CACHE: Let browser handle directly ----

  // API routes — must always hit the server for fresh data
  if (url.pathname.startsWith("/api/")) return;

  // Next.js data routes — server-rendered page data
  if (url.pathname.startsWith("/_next/data/")) return;

  // App pages — must always get fresh content from server
  if (
    url.pathname === "/" ||
    url.pathname === "/feed" ||
    url.pathname === "/login" ||
    url.pathname === "/verify" ||
    url.pathname === "/upload" ||
    url.pathname === "/search" ||
    url.pathname.startsWith("/profile") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/confirm")
  ) {
    return;
  }

  // Video streams — HLS manifests and segments
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

  // Google Drive video URLs
  if (url.hostname.includes("drive.google.com")) return;

  // ---- CACHE-FIRST: Only for true static assets ----
  // Icons, fonts, CSS, JS bundles

  const isStaticAsset =
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".woff") ||
    url.pathname.endsWith(".css");

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;

        return fetch(event.request).then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // ---- NETWORK-FIRST: Everything else ----
  // JS bundles from _next that aren't in /static/
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          return cached || new Response("Offline", { status: 503 });
        });
      })
  );
});

// ============================================
// PUSH NOTIFICATIONS
// ============================================

// Handle incoming push messages
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();

    const options = {
      body: data.body || "",
      icon: data.icon || "/icons/icon-192.png",
      badge: data.badge || "/icons/icon-96.png",
      tag: data.tag || "dellclips-notification",
      renotify: true,
      data: data.data || { url: "/feed" },
      actions: [
        { action: "open", title: "Open" },
        { action: "dismiss", title: "Dismiss" },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "DellClips", options)
    );
  } catch (err) {
    console.error("[SW] Failed to show notification:", err);
  }
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/feed";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      return clients.openWindow(url);
    })
  );
});

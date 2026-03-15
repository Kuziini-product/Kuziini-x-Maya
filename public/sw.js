const CACHE_NAME = "kuziini-v2";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Never cache HTML pages or API calls — always fetch fresh
  if (event.request.mode === "navigate" || url.pathname.startsWith("/api/")) {
    return;
  }

  // Only cache static assets (images, audio, fonts, css, js)
  const isStatic = /\.(png|jpg|jpeg|webp|svg|mp3|woff2?|css|js)$/i.test(url.pathname);
  if (!isStatic) return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(event.request).then((cached) => {
        const fetched = fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
        return cached || fetched;
      })
    )
  );
});

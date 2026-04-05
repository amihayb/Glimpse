/**
 * Glimpse Service Worker — cache-first app shell, network-first Google Fonts.
 * Bump CACHE_VERSION when the app shell changes.
 */

const CACHE_VERSION = "v1";
const CACHE_NAME = `glimpse-${CACHE_VERSION}`;

const APP_SHELL = [
  "./",
  "./index.html",
  "./StyleSheet.css",
  "./manifest.json",
  "./vendor/plotly-latest.min.js",
  "./vendor/sweetalert2@11.js",
  "./vendor/font-awesome.min.css",
  "./js/config.js",
  "./js/dataTransforms.js",
  "./js/dataParser.js",
  "./js/plot.js",
  "./js/ui.js",
  "./js/fileIO.js",
  "./js/app.js",
  "./js/contextMenu.js",
  "./js/theme.js",
  "./js/views.js",
  "./images/logo-title.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn("SW install cache failed:", err);
        return self.skipWaiting();
      })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (
    url.hostname === "www.googletagmanager.com" ||
    url.hostname === "www.google-analytics.com"
  ) return;

  if (
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        fetch(request)
          .then(response => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cache.match(request))
      )
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(request).then(cached => {
        const networkFetch = fetch(request).then(response => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        });
        return cached || networkFetch;
      })
    )
  );
});

/* Crunchy & More service worker
   - app shell: network-first (updates arrive immediately when online), cache fallback offline
   - pinned CDN libraries / fonts / images: cache-first
   - Supabase REST GET: network-first with cache fallback (cleared on logout)
   - Supabase auth, realtime and all writes: network only */
const VERSION = "crunchy-v2";
const SHELL = VERSION + "-shell";
const STATIC = VERSION + "-static";
const API = "crunchy-api";
const SHELL_FILES = [
  "./", "./index.html", "./config.js", "./manifest.webmanifest", "./css/app.css",
  "./js/util.js", "./js/data.js", "./js/auth.js", "./js/views-sale.js", "./js/views-store.js",
  "./js/views-admin.js", "./js/events.js", "./js/pwa.js", "./js/main.js",
  "./img/logo-light.png", "./img/logo-dark.png", "./img/icons/icon-192.png", "./img/icons/favicon-32.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(k => k !== SHELL && k !== STATIC && k !== API)
    .map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("message", e => {
  if (e.data === "clear-api") e.waitUntil(caches.delete(API));
});

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req, { ignoreSearch: cacheName === SHELL && req.mode === "navigate" });
    if (hit) return hit;
    if (req.mode === "navigate") {
      const idx = await cache.match("./index.html");
      if (idx) return idx;
    }
    throw err;
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(STATIC);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
  return res;
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.hostname.endsWith(".supabase.co")) {
    if (url.pathname.startsWith("/rest/v1/")) e.respondWith(networkFirst(req, API));
    return; // auth / realtime / storage: straight to network
  }
  if (url.origin === self.location.origin) {
    e.respondWith(networkFirst(req, SHELL));
    return;
  }
  if (/^(cdn\.jsdelivr\.net|unpkg\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(url.hostname)) {
    e.respondWith(cacheFirst(req));
  }
});

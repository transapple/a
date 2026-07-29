/* Nova Mother App — service worker
   Network-first for the app shell (HTML/manifest) so an installed app
   always picks up the latest deploy when online, falling back to cache
   only when offline. Supabase/API calls always go straight to network. */

const CACHE_NAME = "nova-mother-app-v2"; // bump this string on every future deploy to bust old caches

const APP_SHELL = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL).catch(() => {}))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Only manage same-origin app-shell requests. Everything else (Supabase,
  // the logo CDN, etc.) is left completely untouched — straight to network.
  if (url.origin !== self.location.origin) return;

  // Network-first: always try to get the freshest copy first. Only fall
  // back to whatever's cached if the network request fails (offline).
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});

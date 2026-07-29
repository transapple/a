/* ---------------- Nova Mother App: service worker ----------------
   IMPORTANT: if you already have a sw.js in this project (e.g. for PWA
   offline caching), don't just overwrite it with this file — merge the
   "push" and "notificationclick" listeners below into your existing one.
   This version is intentionally minimal: no caching, just push support,
   so it's safe to drop in if you don't have one yet. */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Fired when the Edge Function sends a push. The service worker runs even
// when the app/tab is fully closed, which is what makes this a real push
// notification rather than an in-app banner.
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) {}
  const title = data.title || "Nova Mother App";
  const options = {
    body: data.body || "",
    icon: "https://i.postimg.cc/hvy7NPrV/20260729-202128.png",
    badge: "https://i.postimg.cc/hvy7NPrV/20260729-202128.png",
    data: { url: data.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Tapping the notification focuses an already-open tab if there is one,
// otherwise opens a new one.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});

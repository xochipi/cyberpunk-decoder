self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open("decoder-v1").then((cache) => {
      return cache.addAll([
        "/",
        "/index.html",
        "/app.js",
        "/manifest.json"
      ]);
    })
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("cyberpunk-decoder-v1").then((cache) => {
      return cache.addAll([
        "index.html",
        "app.js",
        "manifest.json",
        "sounds/track1.mp3",
        "sounds/track2.mp3",
        "sounds/track3.mp3"
      ]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

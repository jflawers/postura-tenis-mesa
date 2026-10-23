// sw.js: guarda en caché las librerías y el modelo para uso sin internet.
const CACHE = "postura-v4";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(
  Promise.all(["postura-v1", "postura-v2", "postura-v3"].map(k => caches.delete(k))).then(() => self.clients.claim())
));

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const esCDN = url.hostname === "cdn.jsdelivr.net" || url.hostname === "storage.googleapis.com";

  if (esCDN) {
    // Librerías y modelo: primero caché; si no están, se descargan y se guardan.
    e.respondWith(caches.open(CACHE).then(async c => {
      const guardado = await c.match(e.request);
      if (guardado) return guardado;
      const r = await fetch(e.request);
      if (r.ok) c.put(e.request, r.clone());
      return r;
    }));
  } else if (url.origin === self.location.origin) {
    // Página propia: red primero; si no hay internet, se usa la copia guardada.
    e.respondWith(
      fetch(e.request).then(r => {
        const copia = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copia));
        return r;
      }).catch(() => caches.match(e.request))
    );
  }
});

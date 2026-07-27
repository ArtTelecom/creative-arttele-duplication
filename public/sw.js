// Service Worker для PWA «АртТелеком — Тест скорости».
// Кэшируем только оболочку приложения. НИКОГДА не кэшируем данные замера
// (speedtest.bin, upload.php, облачные функции) — иначе скорость будет измерена неверно.

const CACHE = "arttele-speedtest-v1";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/pwa-192.png",
  "/pwa-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Что НЕ должно проходить через кэш ни при каких условиях
function isBypass(url) {
  return (
    url.pathname.startsWith("/speedtest.bin") ||
    url.pathname.startsWith("/upload.php") ||
    url.hostname.includes("functions.poehali.dev")
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Данные замера и любые POST — всегда напрямую в сеть, без кэша
  if (req.method !== "GET" || isBypass(url)) {
    return; // браузер обработает сам
  }

  // Навигация (открытие страниц) — сеть, при офлайне отдаём index.html
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Прочая статика — cache-first с фоновым обновлением
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

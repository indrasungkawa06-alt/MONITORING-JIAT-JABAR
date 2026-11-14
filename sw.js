/* Service worker: aplikasi tetap terbuka saat sinyal lemah (data terakhir dari cache). */
const CACHE = 'jiat-v3.1';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // API (POST) tidak di-cache
  const url = new URL(req.url);
  if (url.hostname.includes('script.google') || url.hostname.includes('googleusercontent') || url.hostname.includes('drive.google') || url.hostname.includes('openstreetmap') || url.hostname.includes('arcgisonline')) return;   // ubin peta tidak di-cache
  if (req.mode === 'navigate' || url.origin === location.origin) {
    // Network-first untuk file aplikasi agar selalu versi terbaru
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
    return;
  }
  // Cache-first untuk CDN (font, ikon, Chart.js)
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
    if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});

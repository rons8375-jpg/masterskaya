/* Мастерская: офлайн-работа. Само приложение и значки — из кэша сразу, шрифты и библиотеки — кэшируются при первом использовании. */
const V = 'masterskaya-v6.2.0', CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-mask-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting())) });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())) });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === location.origin) {
    /* страница: сначала сеть (чтобы приходили обновления), без сети — из кэша */
    if (r.mode === 'navigate') { e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(V).then(x => x.put('./index.html', c)); return res }).catch(() => caches.match('./index.html'))); return }
    e.respondWith(caches.match(r).then(m => m || fetch(r))); return;
  }
  if (/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|unpkg\.com/.test(u.host)) {
    e.respondWith(caches.open(V + '-ext').then(c => c.match(r).then(m => { const net = fetch(r).then(res => { if (res && (res.ok || res.type === 'opaque')) c.put(r, res.clone()); return res }).catch(() => m); return m || net })));
  }
});

/* Мастерская: офлайн-работа. Само приложение и значки — из кэша сразу, шрифты и библиотеки — кэшируются при первом использовании. */
const V = 'masterskaya-v6.7.0', CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-mask-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting())) });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== 'share-inbox' && !k.startsWith(V)).map(k => caches.delete(k)))).then(() => self.clients.claim())) });
/* «Поделиться → Мастерская»: файлы кладём во входящие, приложение заберёт их при открытии */
async function takeShare(r) {
  try {
    const f = await r.formData(), c = await caches.open('share-inbox'); let i = 0;
    for (const x of f.getAll('files')) { if (!x || typeof x === 'string') continue; await c.put('./inbox/' + Date.now() + '-' + (i++), new Response(x, { headers: { 'Content-Type': x.type || 'application/octet-stream', 'X-Name': encodeURIComponent(x.name || 'файл') } })) }
    const t = [f.get('title'), f.get('text'), f.get('url')].filter(Boolean).join('\n');
    if (t && !i) await c.put('./inbox/' + Date.now() + '-t', new Response(new Blob([t], { type: 'text/plain' }), { headers: { 'Content-Type': 'text/plain', 'X-Name': encodeURIComponent('Заметка.txt') } }));
  } catch (e) {}
  return Response.redirect('./?share=1', 303);
}
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method === 'POST' && u.origin === location.origin && u.pathname.endsWith('/share')) { e.respondWith(takeShare(r)); return }
  if (r.method !== 'GET') return;
  if (u.origin === location.origin) {
    /* страница: сначала сеть (чтобы приходили обновления), без сети — из кэша */
    if (r.mode === 'navigate') { e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(V).then(x => x.put('./index.html', c)); return res }).catch(() => caches.match('./index.html'))); return }
    e.respondWith(caches.match(r).then(m => m || fetch(r))); return;
  }
  if (/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|unpkg\.com/.test(u.host)) {
    e.respondWith(caches.open(V + '-ext').then(c => c.match(r).then(m => { const net = fetch(r).then(res => { if (res && (res.ok || res.type === 'opaque')) c.put(r, res.clone()); return res }).catch(() => m); return m || net })));
  }
});

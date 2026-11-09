/* Старая HTML-версия «Мастерской» переехала в /old/. Этот файл снимает её прежний service worker с корня сайта,
   чтобы вместо кэшированной старой версии открывалась новая страница. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (!k.startsWith('share-inbox')) await caches.delete(k);
  await self.registration.unregister();
  for (const c of await self.clients.matchAll({ type: 'window' })) c.navigate(c.url);
})()));

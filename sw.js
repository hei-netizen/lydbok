// Lagrer kapitler (krypterte) på telefonen, så lydboken virker uten nett.
const CACHE = 'lydbok';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  const varig = /\/data\/(k\d+|omslag|ikon)-[0-9a-f]+\.bin$/.test(url.pathname) || url.hostname.includes('fonts.g');
  if (varig) {  // innhold med hash i navnet endres aldri: cache først
    e.respondWith(caches.open(CACHE).then(async c => {
      const treff = await c.match(e.request);
      if (treff) return treff;
      const svar = await fetch(e.request);
      if (svar.ok) c.put(e.request, svar.clone());
      return svar;
    }));
  } else if (url.origin === location.origin) {  // side, bokliste: nett først, lagret versjon uten nett
    e.respondWith(fetch(e.request).then(svar => {
      if (svar.ok) caches.open(CACHE).then(c => c.put(url.pathname, svar.clone()));
      return svar;
    }).catch(() => caches.open(CACHE).then(c => c.match(url.pathname))));
  }
});

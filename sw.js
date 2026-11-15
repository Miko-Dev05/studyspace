const CACHE='studyspace-v2-20261115';
const ASSETS=['./','./index.html','./styles.css','./app.js','./cloud.js','./ai.js','./config.js','./manifest.webmanifest','./assets/icon-192.png','./assets/icon-512.png','./docs/philosophie-devoir.pdf'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const url=new URL(e.request.url);if(url.origin!==location.origin)return;
  const isCode=/\.(html|js|css|webmanifest)$/.test(url.pathname)||url.pathname.endsWith('/studyspace/');
  if(isCode){e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return r}).catch(()=>caches.match(e.request)));return}
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return r})));
});

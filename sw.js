const CACHE="mlbb-vault-v3";
const ASSETS=["./","./index.html","./styles.css","./app.js","./manifest.webmanifest","./icon.svg","./icon-192.png","./icon-512.png","./icon-512-maskable.png","./apple-touch-icon.png"];
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
// Stale-while-revalidate: responde rápido desde caché y actualiza en segundo plano.
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  event.respondWith(caches.open(CACHE).then(cache=>cache.match(event.request).then(cached=>{
    const network=fetch(event.request).then(response=>{cache.put(event.request,response.clone());return response}).catch(()=>cached||cache.match("./index.html"));
    return cached||network;
  })));
});

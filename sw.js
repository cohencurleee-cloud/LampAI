const CACHE_NAME='lampai-shell-v2';
const APP_SHELL=['/','/app.html','/index.html','/manifest.webmanifest','/icon-180.png','/icon-192.png','/icon-512.png'];

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).catch(()=>{})
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  const url=new URL(request.url);

  if(request.method!=='GET' || url.origin!==self.location.origin) return;
  if(url.pathname.startsWith('/api/')) return;

  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        return await fetch(request);
      }catch{
        return (await caches.match('/app.html')) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async()=>{
    try{
      const fresh=await fetch(request);
      const cache=await caches.open(CACHE_NAME);
      cache.put(request,fresh.clone());
      return fresh;
    }catch{
      return (await caches.match(request)) || Response.error();
    }
  })());
});

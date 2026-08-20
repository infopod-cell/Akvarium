var CACHE='aqua-v4';
var CORE=['/Akvarium/','/Akvarium/index.html','/Akvarium/app.js?v=8','/Akvarium/manifest.webmanifest','/Akvarium/bettafish.png'];
self.addEventListener('install',function(e){
e.waitUntil(caches.open(CACHE).then(function(c){
return Promise.all(CORE.map(function(u){return c.add(u).catch(function(){});}))
;}).then(function(){return self.skipWaiting();}));
});
self.addEventListener('activate',function(e){
e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));
});
self.addEventListener('fetch',function(e){
if(e.request.method!=='GET')return;
var url=new URL(e.request.url);
var mine=url.origin===self.location.origin;
if(!mine)return;
e.respondWith(
caches.match(e.request).then(function(cached){
var network=fetch(e.request,{cache:'no-store'}).then(function(r){
if(r&&r.ok){var copy=r.clone();caches.open(CACHE).then(function(c){c.put(e.request,copy);});}
return r;
}).catch(function(){return null;});
if(cached)return cached;
return network.then(function(r){return r||caches.match('/Akvarium/index.html');});
})
);
});

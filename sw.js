var CACHE='aqua-v1';
var CORE=['/Akvarium/','/Akvarium/index.html','/Akvarium/app.js','/Akvarium/manifest.webmanifest','/Akvarium/bettafish.png'];
self.addEventListener('install',function(e){
e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(CORE);}).then(function(){return self.skipWaiting();}));
});
self.addEventListener('activate',function(e){
e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));
});
self.addEventListener('fetch',function(e){
if(e.request.method!=='GET')return;
var url=new URL(e.request.url);
var mine=url.origin===self.location.origin;
var font=url.hostname.indexOf('fonts.googleapis.com')===0||url.hostname.indexOf('fonts.gstatic.com')===0;
if(!mine&&!font)return;
e.respondWith(
fetch(e.request, {cache:'no-store'}).then(function(r){
if(r&&r.ok){var copy=r.clone();caches.open(CACHE).then(function(c){c.put(e.request,copy);});}
return r;
}).catch(function(){
return caches.match(e.request).then(function(m){
return m||caches.match('/Akvarium/index.html');
});
})
);
});

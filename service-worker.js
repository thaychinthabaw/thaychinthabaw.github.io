
const STATIC_CACHE =
'thaychinthabaw-static-v1';

const AUDIO_CACHE =
'thaychinthabaw-audio-v1';

/* =========================
INSTALL
========================= */

self.addEventListener(
'install',
(event) => {

event.waitUntil(

caches.open(STATIC_CACHE)
.then((cache) => {

return cache.addAll([

'/',
'/index.html',
  '/paper.html',
  '/about.html',
  '/pati.html',
 
  '/style.css',
  '/darkmode.js',
  '/darkmode.css',
  '/script.js',
 '/service-worker.js',

  '/paper-text.js',
    '/paper-audio.js',
  '/paper-audio.css',
  '/paper-text.css',
'/ptext.js',
  '/ptext1.js',

'/pati-text.js',
    '/pati-audio.js',
  '/pati-audio.css',
  '/pati-text.css',
'/text.js',
  '/text1.js',

  
  '/robots.txt',
  '/README.md',
  '/_headers',
  '/sitemap.xml',

  '/bookphoto1.webp',
  '/bookphoto2.webp',
  '/bookphoto3.webp',
  
  '/portfolio.html',
'/portfolio.css',
'/portfolio.js',
  '/portfoliophoto1.webp',
'/portfoliophoto2.webp',
  '/portfoliophoto3.webp',
  '/thaychinthabawlogo1.webp',

'/quiz.html',
'/quiz.js',
  '/quiz.css',
  
  '/manifest.json'

]);

})

);

self.skipWaiting();

});

/* =========================
ACTIVATE
========================= */

self.addEventListener(
'activate',
(event) => {

event.waitUntil(

caches.keys().then((keys) => {

return Promise.all(

keys.map((key) => {

if (
key !== STATIC_CACHE &&
key !== AUDIO_CACHE
) {

return caches.delete(key);

}

})

);

})

);

self.clients.claim();

});

/* =========================
FETCH
========================= */

self.addEventListener(
'fetch',
(event) => {

const request =
event.request;

const url =
new URL(request.url);

/* =========================
AUDIO REQUEST
========================= */

const isAudio =

url.pathname.includes('/audio/')
||

request.destination === 'audio';

if (isAudio) {

event.respondWith(

handleAudioRequest(request)

);

return;

}

/* =========================
NORMAL FILES
========================= */

event.respondWith(

caches.match(request)
.then((cachedResponse) => {

if (cachedResponse) {

return cachedResponse;

}

return fetch(request)
.then((networkResponse) => {

/* clone response */

const responseClone =
networkResponse.clone();

/* save new file */

caches.open(STATIC_CACHE)
.then((cache) => {

cache.put(
request,
responseClone
);

});

return networkResponse;

});

})

);

});

/* =========================
AUDIO HANDLER
========================= */

async function handleAudioRequest(
request
) {

const cache =
await caches.open(AUDIO_CACHE);

/* cache first */

const cachedResponse =
await cache.match(request);

if (cachedResponse) {

return cachedResponse;

}

try {

/* internet fetch */

const networkResponse =
await fetch(request);

/* save audio */

if (
networkResponse &&
networkResponse.status === 200
) {

cache.put(
request,
networkResponse.clone()
);

limitCacheSize(
AUDIO_CACHE,
50
);

}

return networkResponse;

} catch (error) {

/* offline fallback */

return new Response(
'Offline Audio',
{
status: 404,
headers: {
'Content-Type':
'text/plain'
}
}
);

}

}

/* =========================
LIMIT AUDIO CACHE
========================= */

async function limitCacheSize(
cacheName,
maxItems
) {

const cache =
await caches.open(cacheName);

const keys =
await cache.keys();

if (
keys.length > maxItems
) {

await cache.delete(keys[0]);

limitCacheSize(
cacheName,
maxItems
);

}

}

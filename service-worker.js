const CACHE_NAME = 'thaychinthabaw-v1';
// အောက်က list ထဲမှာ offline ဖတ်ချင်တဲ့ ဖိုင်နာမည်တွေ အကုန်ထည့်ပါ
const urlsToCache = [
  '/',
  const urlsToCache = [
  '/',
  '/index.html',
  '/paper.html',
  '/about.html',
  '/style.css',
  '/paper.css',
  '/darkmode.css',
  '/script.js',
 '/service-worker.js'
  '/paper.js',
  '/robots.txt',
  '/README.md',
  '/sw.js',
  '/audio/',
  '/audio.html',
  '/audio.css',
  '/audio.js',
  '/_headers',
  '/sitemap.xml',
  '/darkmode.js',
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
  '/manifest.json'
];

  
// ဖိုင်တွေကို သိမ်းဆည်းခြင်း (Install)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// အင်တာနက်မရှိတဲ့အခါ သိမ်းထားတာတွေကို ပြန်ထုတ်ပြခြင်း (Fetch)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // သိမ်းထားတာရှိရင် ပြန်ပေးမယ်၊ မရှိရင် အင်တာနက်ကနေ ဆွဲမယ်
      return response || fetch(event.request);
    })
  );
});

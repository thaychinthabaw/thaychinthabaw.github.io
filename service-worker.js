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
  '/buttons.css',
  '/script.js',
  '/paper.js',
  '/darkmode.js',
  '/bookphoto1.jpg',
  '/bookphoto2.jpg',
  '/bookphoto3.jpg',
  '/portfolio.html',
'/portfolio.css',
'/portfolio.js',
  '/portfoliophoto1.jpg',
'/portfoliophoto2.jpg',
  '/portfoliophoto3.jpg',
  '/thaychinthabawlogo1.png',
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

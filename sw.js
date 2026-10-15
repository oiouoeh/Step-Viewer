// 새 버전을 올릴 때마다 CACHE 이름의 버전을 바꿔야 폰이 새 파일을 받습니다.
// (index.html 안의 APP_CACHE 값도 같은 이름으로 맞춰야 진단 화면이 정확합니다.)
const CACHE = 'step-viewer-v3.33';
const OPTIONAL = ['./manifest.webmanifest', './icon-192.png', './icon-512.png', './xlsx.full.min.js'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // 앱 본체는 필수: 받지 못하면 설치 자체를 실패시켜 반쪽짜리 서비스워커가 활성화되지 않게 한다.
    // (본체는 한 번만 저장한다 -- 11MB를 두 번 받으면 느린 망/저사양 폰에서 설치가 실패하기 쉽다)
    await cache.add(new Request('./index.html', { cache: 'reload' }));
    // 나머지는 하나가 실패해도 설치를 막지 않는다.
    await Promise.all(OPTIONAL.map(u => cache.add(new Request(u, { cache: 'reload' })).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // 페이지 이동 요청은 주소가 무엇이든(/step-viewer/, /step-viewer/index.html 등) 저장된 본체를 돌려준다.
  // 서버가 404를 주거나(파일 삭제) 인터넷이 없어도 앱은 열린다.
  if (req.mode === 'navigate') {
    e.respondWith(caches.match('./index.html').then(hit => hit || fetch(req)));
    return;
  }
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).catch(() => Response.error()))
  );
});

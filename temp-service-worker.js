
      import { clientsClaim } from 'workbox-core';
      import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
      import { setupRuntimeCaching, expectedCaches } from './runtimeCaching';

      const manifest = self.__WB_MANIFEST;
      clientsClaim();

      cleanupOutdatedCaches();
      precacheAndRoute(manifest);

      self.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SKIP_WAITING') {
          console.log('new service worker requested skip:');
          setTimeout(() => self.skipWaiting(), 400);
        }
      });

      self.addEventListener('install', (event) => {
        console.log('service worker installed:');
      });

      self.addEventListener('activate', (event) => {
        event.waitUntil(
          caches.keys().then((keys) => 
            Promise.all(keys.map((key) => {
              if (!expectedCaches.includes(key) && !key.includes('workbox-precache')) {
                return caches.delete(key);
              }
            }))
          ).then(() => {
            console.log('SW now ready to handle fetches!');
          })
        );
      });

      setupRuntimeCaching('1.0.0');
    
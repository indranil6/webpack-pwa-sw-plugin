const { InjectManifest } = require("workbox-webpack-plugin");
const fs = require("fs");
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

class WebpackPwaSwPlugin {
  constructor(options = {}) {
    this.options = options;
  }

  generateServiceWorker(version) {
    return `
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

      setupRuntimeCaching('${version || 0}');
    `;
  }

  apply(compiler) {
    const packageJsonPath = path.resolve(compiler.context, "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    const version = packageJson.version;

    compiler.hooks.emit.tapAsync(
      "WebpackPwaSwPlugin",
      (compilation, callback) => {
        const manifest = {
          ...this.options.manifest,
        };

        const manifestJson = JSON.stringify(manifest, null, 2);
        compilation.assets["manifest.json"] = {
          source: () => manifestJson,
          size: () => manifestJson.length,
        };

        const serviceWorkerContent = this.generateServiceWorker(version);
        compilation.assets["service-worker.js"] = {
          source: () => serviceWorkerContent,
          size: () => serviceWorkerContent.length,
        };

        callback();
      }
    );

    new InjectManifest({
      swSrc: path.resolve(__dirname, "temp-service-worker.js"),
      swDest: "service-worker.js",
      ...this.options.workboxOptions,
    }).apply(compiler);

    compiler.hooks.compilation.tap("WebpackPwaSwPlugin", (compilation) => {
      HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
        "WebpackPwaSwPlugin",
        (data, cb) => {
          const scriptContent = `
            if ('serviceWorker' in navigator) {
              import { Workbox } from 'workbox-window';
              const wb = new Workbox('/service-worker.js');

              const showSkipWaitingPrompt = async (event) => {
                wb.addEventListener('controlling', () => {
                  window.location.reload();
                });

                const result = confirm('New version available, reload?');
                if (result) {
                  wb.messageSkipWaiting();
                }
              };

              wb.addEventListener('waiting', (event) => {
                showSkipWaitingPrompt(event);
              });

              wb.register()
                .then((reg) => {
                  console.log('Service worker registered', reg);
                })
                .catch((err) => {
                  console.error('Service worker registration failed', err);
                });
            }
          `;

          data.html = data.html.replace(
            '</body>',
            `<script type="module">${scriptContent}</script></body>`
          );

          data.html = data.html.replace(
            '</head>',
            '<link rel="manifest" href="/manifest.json"></head>'
          );

          cb(null, data);
        }
      );
    });
  }
}

module.exports = WebpackPwaSwPlugin;

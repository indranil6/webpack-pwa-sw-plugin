const { InjectManifest } = require("workbox-webpack-plugin");
const fs = require("fs");
const path = require("path");

class WebpackPwaPlugin {
  constructor(options = {}) {
    this.options = options;
  }

  apply(compiler) {
    compiler.hooks.emit.tapAsync(
      "WebpackPwaPlugin",
      (compilation, callback) => {
        const manifest = {
          name: this.options.name || "PWA App",
          short_name: this.options.shortName || "PWA",
          start_url: this.options.startUrl || ".",
          display: this.options.display || "standalone",
          background_color: this.options.backgroundColor || "#ffffff",
          theme_color: this.options.themeColor || "#ffffff",
          icons: this.options.icons || [
            {
              src: "icons/icon-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "icons/icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        };

        const manifestJson = JSON.stringify(manifest, null, 2);
        compilation.assets["manifest.json"] = {
          source: () => manifestJson,
          size: () => manifestJson.length,
        };

        callback();
      }
    );

    compiler.hooks.make.tapAsync(
      "WebpackPwaPlugin",
      (compilation, callback) => {
        const serviceWorkerContent = `
        import { precacheAndRoute } from 'workbox-precaching';
        import { registerRoute } from 'workbox-routing';
        import { StaleWhileRevalidate } from 'workbox-strategies';

        precacheAndRoute(self.__WB_MANIFEST);

        registerRoute(
          ({ request }) => request.destination === 'document' || request.destination === 'script' || request.destination === 'style',
          new StaleWhileRevalidate()
        );
      `;

        const serviceWorkerPath = path.resolve(
          __dirname,
          "temp-service-worker.js"
        );
        fs.writeFile(serviceWorkerPath, serviceWorkerContent, (err) => {
          if (err) {
            compilation.errors.push(err);
          }
          callback();
        });
      }
    );

    new InjectManifest({
      swSrc: path.resolve(__dirname, "temp-service-worker.js"),
      swDest: "service-worker.js",
      ...this.options.workboxOptions,
    }).apply(compiler);
  }
}

module.exports = WebpackPwaPlugin;

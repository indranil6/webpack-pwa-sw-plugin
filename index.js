const { InjectManifest } = require("workbox-webpack-plugin");
const VirtualModulesPlugin = require("webpack-virtual-modules");
const path = require("path");
const webpack = require("webpack");

class WebpackPwaSwPlugin {
  constructor(options = {}) {
    this.options = options;
    this.virtualModules = new VirtualModulesPlugin();
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
          //console.log('new service worker requested skip:');
          setTimeout(() => self.skipWaiting(), 400);
        }
      });

      self.addEventListener('install', (event) => {
        //console.log('service worker installed:');
      });

      self.addEventListener('activate', (event) => {
        event.waitUntil(
          caches.keys().then((keys) => 
            Promise.all(keys.map((key) => {
              if (!expectedCaches('${
                version || 0
              }').includes(key) && !key.includes('workbox-precache')) {
                return caches.delete(key);
              }
            }))
          ).then(() => {
            //console.log('SW now ready to handle fetches!');
          })
        );
      });

      setupRuntimeCaching('${version || 0}', ${
      this.options?.runtimeCaching
        ? JSON.stringify(this.options?.runtimeCaching)
        : '""'
    });
    `;
  }

  apply(compiler) {
    const packageJsonPath = path.resolve(compiler.context, "package.json");
    const packageJson = require(packageJsonPath);
    const version = packageJson.version;
    if (this.options?.manifest) {
      compiler.hooks.emit.tapAsync(
        "WebpackPwaSwPlugin",
        (compilation, callback) => {
          const manifest = {
            ...this.options?.manifest,
          };

          const manifestJson = JSON.stringify(manifest, null, 2);
          compilation.assets["manifest.json"] = {
            source: () => manifestJson,
            size: () => manifestJson.length,
          };

          callback();
        }
      );
    }
    // Generate the service worker code as a virtual module
    compiler.hooks.beforeCompile.tap("WebpackPwaSwPlugin", () => {
      const serviceWorkerContent = this.generateServiceWorker(version);
      this.virtualModules.writeModule(
        path.resolve(__dirname, "virtual-service-worker.js"),
        serviceWorkerContent
      );
      //console.log('Virtual service worker module written.'); // Debugging line
    });

    // Apply the virtual modules and InjectManifest plugin
    this.virtualModules.apply(compiler);
    new InjectManifest({
      swSrc: path.resolve(__dirname, "virtual-service-worker.js"),
      swDest: "service-worker.js",
      maximumFileSizeToCacheInBytes: 15000000,
      exclude: [
        /manifest\.json$/,
        /\.(map|bcmap|png|jpg|jpeg|gif|webp|svg|txt|json)$/,
        /(well-known|googleapis|cmaps)/,
      ],
      ...(this.options?.workboxOptions || {}),
    }).apply(compiler);

    // Inject options via DefinePlugin
    compiler.options.plugins.push(
      new webpack.DefinePlugin({
        WEBPACK_PWA_SW_PLUGIN_OPTIONS: JSON.stringify(this.options),
      })
    );
    const serviceWorkerRegistrationPath = path.resolve(
      __dirname,
      "serviceWorkerRegistration.js"
    );

    compiler.hooks.entryOption.tap("WebpackPwaSwPlugin", (context, entry) => {
      //console.log('Original entry:', entry);

      if (typeof entry === "object" && !Array.isArray(entry)) {
        //console.log('Entry is an object:', entry);

        // Iterate over each key in the entry object
        Object.keys(entry).forEach((key) => {
          const entryValue = entry[key];

          // Check if entry[key] has an `import` array
          if (
            entryValue &&
            entryValue.import &&
            Array.isArray(entryValue.import)
          ) {
            entryValue.import.push(serviceWorkerRegistrationPath);
          } else if (Array.isArray(entryValue)) {
            entry[key].push(serviceWorkerRegistrationPath);
          } else if (typeof entryValue === "string") {
            entry[key] = [entryValue, serviceWorkerRegistrationPath];
          }
        });
      } else if (typeof entry === "string") {
        //console.log('Entry is a string:', entry);
        compiler.options.entry = [entry, serviceWorkerRegistrationPath];
      } else if (Array.isArray(entry)) {
        //console.log('Entry is an array:', entry);
        compiler.options.entry.push(serviceWorkerRegistrationPath);
      }

      //console.log('Modified entry:', compiler.options.entry);
    });
  }
}

module.exports = WebpackPwaSwPlugin;

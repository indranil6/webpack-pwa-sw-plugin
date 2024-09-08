# WebpackPwaSwPlugin

## Overview

`WebpackPwaSwPlugin` is a highly customizable Webpack plugin that simplifies the integration of service workers in Progressive Web Applications (PWAs). It facilitates the auto-registration of service workers and enables various caching strategies, including runtime caching, background synchronization, and broadcast updates. With this plugin, users can effortlessly enhance their web applications with offline capabilities and ensure their assets are served efficiently.

## Features

- **Automatic Service Worker Registration**: Automatically registers a service worker in your application.
- **Customizable Runtime Caching**: Supports multiple caching strategies for specific URL patterns, including `CacheFirst`, `StaleWhileRevalidate`, `NetworkFirst`, and `NetworkOnly`.
- **Manifest Injection**: Automatically injects the `manifest.json` file into your HTML.
- **Background Sync**: Supports background synchronization for offline scenarios.
- **Broadcast Updates**: Allows synchronization of updates between different tabs or clients using `BroadcastUpdatePlugin`.
- **Versioned Caches**: Automatically handles cache versioning and cache cleanup.
- **Auto-Reload on Reconnect**: Optionally reloads the application when the network connection is restored.

## Installation

```bash
npm install --save-dev webpack-pwa-sw-plugin workbox-webpack-plugin webpack-virtual-modules
```

## Usage

In your `webpack.config.js`:

```js
const WebpackPwaSwPlugin = require("webpack-pwa-sw-plugin");

module.exports = {
  // Other webpack configuration
  plugins: [
    new WebpackPwaSwPlugin({
      manifest: {
        name: "My PWA",
        short_name: "PWA",
        icons: [{ src: "/icon.png", sizes: "192x192", type: "image/png" }],
        start_url: ".",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#000000",
      },
      workboxOptions :{
        // Other workbox options for InjectManifest. visit : https://developer.chrome.com/docs/workbox/modules/workbox-webpack-plugin#injectmanifest_plugin
      }
      runtimeCaching: [
        {
          urlPattern: /\/api\//,
          handler: "NetworkFirst",
          options: {
            cacheName: "api-cache",
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 24, // 1 day
            },
            syncStrategies: ["broadcastUpdate"],
          },
        },
      ],
      autoRegisterServiceWorker: true,
      reloadOnConnectionRestored: true,
      showPromptOnUpdate: true,
      promptText: "New content is available, reload now?",
      onNeedRefresh : () => { console.log("Need to refresh") }
    }),
  ],
};
```

## Configuration Options

### manifest

An object that represents your PWA's manifest file. This is automatically injected into the build output as `manifest.json`.

### workboxOptions

Additional options to pass to the InjectManifest plugin

### reloadOnConnectionRestored

Enables automatic reloading of the application when the internet connection is restored after going offline.

### showPromptOnUpdate

If set to true, the user will be shown a confirmation prompt to reload the page when a new version of the service worker is available.

### promptText

Customizes the prompt text shown when showPromptOnUpdate is enabled.

### onNeedRefresh

Custom function to run when a new service worker is ready to activate.

### runtimeCaching

An array of objects defining runtime caching strategies for specific URL patterns.This plugin option supports various caching strategies for different resource types. The configuration is defined in [runtimeCachingConfig.js](runtimeCachingConfig.js). It includes built-in patterns for Google Fonts, static assets, and APIs. You can customize it by providing your own runtime caching rules.

- **urlPattern**: A regex pattern or a function to match requests for which this caching strategy should apply.

- **handler**: The caching strategy to use, can be one of the following:

  1. `CacheFirst`: Prioritizes the cache over the network. Useful for static assets.

  2. `StaleWhileRevalidate`: Serves cached content while updating the cache in the background. Useful for frequently changing resources like JavaScript and CSS files.

  3. `NetworkFirst`: Tries the network first, falls back to cache if the network is unavailable.

  4. `NetworkOnly`: Uses the network exclusively, no caching. Each object includes:

- **options**: Additional options for each strategy, including cache names, expiration rules, and plugins.

#### _(Unique to this plugin is the syncStrategies configuration)_:

- **syncStrategies**: An array that can include the following two options:

  - `backgroundSync`: Ensures that failed `POST` requests are retried when the app is back online using the `BackgroundSyncPlugin`.
  - `broadcastUpdate`: Updates all open tabs or clients when a cached response is updated by utilizing the `BroadcastUpdatePlugin`.

#### Example of `syncStrategies`:

```js
{
  urlPattern: /\/api\//,
  handler: 'NetworkFirst',
  options: {
    cacheName: 'api-cache',
    syncStrategies: ['backgroundSync', 'broadcastUpdate'],
    expiration: {
      maxEntries: 16,
      maxAgeSeconds: 60 * 60 * 24, // 1 day
    },
  },
}

```

## Service Worker Registration

The service worker registration script [(serviceWorkerRegistration.js)](serviceWorkerRegistration.js) is automatically injected into your Webpack entries. The plugin handles:

- Automatic service worker registration using the Workbox window.
- Connection status monitoring to reload the app when the connection is restored if offline.
- Automatic cache management using precacheAndRoute from Workbox.

## License

This project is licensed under the [MIT License](LICENSE).

## Support

If you encounter any issues or have any questions, feel free to open an issue on the [GitHub repository](https://github.com/indranil6/webpack-pwa-sw-plugin).

## Acknowledgments

- Thanks to the JavaScript & Webpack community for their valuable feedback and contributions.

## Contact

For any inquiries or support, you can reach out to the maintainer at [indranilkundu6@gmail.com](mailto:indranilkundu6@gmail.com).

### Happy Coding!

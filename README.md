# WebpackPwaSwPlugin

`WebpackPwaSwPlugin` is a Webpack plugin that simplifies the process of creating and registering a service worker for your Progressive Web Application (PWA). It automatically injects the service worker and manifest file into your application, provides flexible caching strategies, and offers advanced features like background sync and auto-reloading when the network connection is re-established.

## Features

- **Automatic Service Worker Registration**: Automatically registers a service worker in your application.
- **Custom Caching Strategies**: Allows you to define runtime caching strategies for your app's assets.
- **Manifest Injection**: Automatically injects the `manifest.json` file into your HTML.
- **Background Sync**: Supports background synchronization for offline scenarios.
- **Auto-Reload on Reconnect**: Optionally reloads the application when the network connection is restored.

## Installation

```bash
npm install --save-dev webpack-pwa-sw-plugin workbox-webpack-plugin webpack-virtual-modules
```

module.exports = [
  {
    urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
    handler: "CacheFirst",
    options: {
      cacheName: "google-fonts-webfonts",
      expiration: {
        maxEntries: 4,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 365 days
      },
      cacheableStatuses: [0, 200],
      isBackgroundSyncEnabled: false,
    },
  },
  {
    urlPattern: /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
    handler: "CacheFirst",
    options: {
      cacheName: "google-fonts-stylesheets",
      expiration: {
        maxEntries: 4,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      },
      cacheableStatuses: [0, 200],
      isBackgroundSyncEnabled: false,
    },
  },
  // Add more configurations as needed
];

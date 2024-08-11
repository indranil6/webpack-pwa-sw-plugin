import { registerRoute } from "workbox-routing";
import {
  CacheFirst,
  StaleWhileRevalidate,
  NetworkFirst,
  NetworkOnly,
} from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { BackgroundSyncPlugin } from "workbox-background-sync";
import runtimeCachingConfig from "./runtimeCachingConfig";
import { BroadcastUpdatePlugin } from "workbox-broadcast-update";
import { RangeRequestsPlugin } from "workbox-range-requests";

export function setupRuntimeCaching(version = 0, customConfig = "") {
  let cachingConfig = customConfig
    ? JSON.parse(customConfig)
    : runtimeCachingConfig;
  cachingConfig.forEach(({ urlPattern, method = "GET", handler, options }) => {
    let strategy;
    const plugins = [];

    // Add expiration plugin if defined
    if (options.expiration) {
      plugins.push(new ExpirationPlugin(options.expiration));
    }

    // Add cacheable response plugin if cacheableStatuses is defined
    if (options.cacheableStatuses) {
      plugins.push(
        new CacheableResponsePlugin({ statuses: options.cacheableStatuses })
      );
    }

    if (options.syncStrategies.includes("backgroundSync")) {
      // Add background sync plugin if isBackgroundSyncEnabled is true
      const bgSyncPlugin = new BackgroundSyncPlugin(
        "api-post-queue" + "v" + version,
        {
          maxRetentionTime: 10, // Retry for max of 5 minutes (specified in minutes),
          onSync: async ({ queue }) => {
            console.log("...Synchronizing " + queue.name);
            let entry;
            while ((entry = await queue.shiftRequest())) {
              try {
                const { url, body, headers, method } = entry.request;
                await fetch(entry.request);
              } catch (error) {
                console.error("Replay failed for request", url, error);
                await queue.unshiftRequest(entry);
                return;
              }
            }
            console.log("Replay complete!");
          },
        }
      );
      const statusPlugin = {
        fetchDidSucceed: ({ response }) => {
          if (response.status > 500) {
            // Throwing anything here will trigger fetchDidFail.
            throw new Error("Server error.");
          }
          // If it's not 5xx, use the response as-is.
          return response;
        },
      };
      plugins.push(bgSyncPlugin);
      plugins.push(statusPlugin);
    }

    if (options.syncStrategies.includes("broadcastUpdate")) {
      plugins.push(
        new BroadcastUpdatePlugin({
          channelName: "api-channel" + "v" + version,
        })
      );
    }

    if (options.useRangeRequests) {
      plugins.push(new RangeRequestsPlugin());
    }

    // Create the appropriate caching strategy
    switch (handler) {
      case "CacheFirst":
        strategy = new CacheFirst({
          cacheName: options.cacheName + "v" + version,
          plugins,
        });
        break;

      case "StaleWhileRevalidate":
        strategy = new StaleWhileRevalidate({
          cacheName: options.cacheName + "v" + version,
          plugins,
        });
        break;

      case "NetworkFirst":
        strategy = new NetworkFirst({
          cacheName: options.cacheName + "v" + version,
          networkTimeoutSeconds: options.networkTimeoutSeconds,
          plugins,
        });
        break;

      case "NetworkOnly":
        strategy = new NetworkOnly({ plugins });
        break;

      default:
        throw new Error(`Unknown handler: ${handler}`);
    }

    registerRoute(urlPattern, strategy, method);
  });
}
export const expectedCaches = (version) =>
  runtimeCachingConfig.map(({ options }) => options.cacheName + "v" + version);

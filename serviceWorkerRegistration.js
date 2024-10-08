const { Workbox } = require("workbox-window");
// Access the injected options
const options = WEBPACK_PWA_SW_PLUGIN_OPTIONS;
if (
  "serviceWorker" in navigator &&
  typeof options?.autoRegisterServiceWorker == "boolean" &&
  options?.autoRegisterServiceWorker
) {
  const wb = new Workbox("/service-worker.js");

  const reloadPage = () => {
    window.location.reload();
  };

  const checkConnectionAndReload = () => {
    if (!navigator.onLine) {
      console.log("You are offline. Cached content will be displayed.");
    } else {
      console.log("Connection restored. Reloading the application...");
      if (
        options &&
        typeof options?.reloadOnConnectionRestored == "boolean" &&
        options?.reloadOnConnectionRestored
      ) {
        reloadPage();
      }
    }
  };

  // Listen for the `waiting` event from the service worker
  wb.addEventListener("waiting", () => {
    wb.addEventListener("controlling", () =>
      options?.onNeedRefresh && typeof options?.onNeedRefresh == "function"
        ? options?.onNeedRefresh()
        : window.location.reload()
    );
    if (
      typeof options?.showPromptOnUpdate == "boolean" &&
      options?.showPromptOnUpdate
    ) {
      if (
        confirm(
          options?.promptText
            ? options?.promptText
            : "New Version available. Reload?"
        )
      ) {
        wb.messageSkipWaiting();
      }
    } else {
      wb.messageSkipWaiting();
    }
  });

  // Register service worker
  wb.register()
    .then((reg) => {
      console.log("Service worker registered", reg);
    })
    .catch((err) => {
      console.error("Service worker registration failed", err);
    });

  // Listen for connection status changes
  window.addEventListener("online", checkConnectionAndReload);
  window.addEventListener("offline", checkConnectionAndReload);
}

const { Workbox } = require("workbox-window");
// Access the injected options
const options = WEBPACK_PWA_SW_PLUGIN_OPTIONS;
if ("serviceWorker" in navigator) {
  const wb = new Workbox("/service-worker.js");

  const reloadPage = () => {
    window.location.reload();
  };

  const checkConnectionAndReload = () => {
    if (!navigator.onLine) {
      console.log("You are offline. Cached content will be displayed.");
    } else {
      console.log("Connection restored. Reloading the application...");
      if (options && options.reloadOnConnectionRestored) {
        reloadPage();
      }
    }
  };

  // Listen for the `waiting` event from the service worker
  wb.addEventListener("waiting", () => {
    wb.addEventListener("controlling", () => window.location.reload());
    if (confirm("New version available, reload?")) {
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

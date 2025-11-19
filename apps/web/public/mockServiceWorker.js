// Empty mock service worker stub to avoid 404 logs during local development.
// If you add MSW later, this file can be replaced by the generated worker script.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // no-op
});

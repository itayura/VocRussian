// Privyetik Progressive Web App Service Worker
const CACHE_NAME = "voc-russian-cache-v42";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./logo.jpeg",
  "./privacy.html",
  "./delete-account.html",
  "./css/styles.css?v=36",
  "./js/config.js",
  "./js/build-info.js",
  "./js/app.js",
  "./js/audio.js",
  "./js/db.js",
  "./js/db_expanded.js",
  "./js/srs.js",
  "./js/supabase.js",
  "./js/grammar.js",
  "./js/alphabet.js",
  "./js/placement.js"
];

// Install Event
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Pre-caching core assets");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME && name !== "voc-russian-user-data") {
            console.log("[Service Worker] Removing old cache:", name);
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event (Network-First for code/styles to guarantee instant updates)
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);
  const isSupabaseCdn = requestUrl.hostname === "cdn.jsdelivr.net" && requestUrl.pathname.includes("@supabase/supabase-js");
  if (requestUrl.origin !== self.location.origin && !isSupabaseCdn) return;

  if (isSupabaseCdn) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match(event.request);
        const network = fetch(event.request).then(response => {
          if (response.ok || response.type === "opaque") cache.put(event.request, response.clone());
          return response;
        }).catch(() => null);
        return cached || await network || new Response("Offline dependency unavailable", { status: 503 });
      })
    );
    return;
  }

  // Intercept the virtual user streak status request
  if (event.request.url.includes("/user-streak-status")) {
    event.respondWith(
      caches.open("voc-russian-user-data").then((cache) => {
        return cache.match("/user-streak-status").then((res) => {
          return res || new Response(JSON.stringify({}), { headers: { "Content-Type": "application/json" } });
        });
      })
    );
    return;
  }

  // Network-First for HTML, CSS, JS
  if (
    event.request.destination === "style" ||
    event.request.destination === "script" ||
    event.request.destination === "document" ||
    event.request.mode === "navigate"
  ) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          if (event.request.mode === "navigate") return caches.match("./index.html");
          return new Response("Offline", { status: 503, statusText: "Offline" });
        })
    );
    return;
  }

  // Stale-while-revalidate for images & static assets
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // If network fetch fails (e.g. offline), just let it resolve silently since we might have cached response
        });
        
        return cachedResponse || fetchPromise.then(response => response || new Response("Offline", { status: 503, statusText: "Offline" }));
      });
    })
  );
});

// Periodic Background Sync Event
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "daily-reminder") {
    event.waitUntil(showDailyReminderNotification());
  }
});

// Helper function to check state and show notification
async function showDailyReminderNotification() {
  try {
    const cache = await caches.open("voc-russian-user-data");
    const response = await cache.match("/user-streak-status");
    if (!response) return;

    const data = await response.json();
    if (!data.enabled) return;

    // Check if user has already studied today
    const lastActiveDate = data.lastActiveDate || "";
    const today = getTodayDateString();
    if (lastActiveDate === today) return;

    // Check if we have already notified today
    const lastNotified = data.lastNotifiedDate || "";
    if (lastNotified === today) return;

    // Check target reminder time
    const reminderTime = data.reminderTime || "19:00";
    const [targetHour, targetMinute] = reminderTime.split(":").map(Number);
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Trigger notification if it's the right time or later
    if (currentHour > targetHour || (currentHour === targetHour && currentMinute >= targetMinute)) {
      // Show notification
      await self.registration.showNotification("Keep your streak active! 🇷🇺", {
        body: `Keep your ${data.streak || 0}-day streak alive! Take a few minutes to review your Russian vocabulary today.`,
        icon: "./logo.jpeg",
        tag: "daily-reminder-bg",
        requireInteraction: true
      });

      // Update lastNotifiedDate in Cache to prevent spamming
      data.lastNotifiedDate = today;
      await cache.put(
        new Request("/user-streak-status"),
        new Response(JSON.stringify(data), {
          headers: { "Content-Type": "application/json" }
        })
      );
    }
  } catch (e) {
    console.error("[Service Worker] Failed to handle daily reminder periodicsync:", e);
  }
}

// Notification Click Handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // Focus an existing client or open a new window
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow("./");
      }
    })
  );
});

function getTodayDateString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const date = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${date}`;
}

// Push Event (Remote Notifications)
self.addEventListener("push", (event) => {
  let data = { title: "Privyetik", body: "Practice your Russian today!" };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: "Privyetik", body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: new URL("./logo.jpeg", self.location.href).href,
    badge: new URL("./logo.jpeg", self.location.href).href,
    tag: data.tag || `remote-push-${Date.now()}`,
    renotify: true,
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// VocRussian Progressive Web App Service Worker
const CACHE_NAME = "voc-russian-cache-v13";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./logo.png",
  "./css/styles.css",
  "./js/app.js",
  "./js/audio.js",
  "./js/db.js",
  "./js/db_expanded.js",
  "./js/srs.js",
  "./js/supabase.js"
];

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching app assets...");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
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

// Fetch Event (Offline Fallback)
self.addEventListener("fetch", (event) => {
  // Avoid interception for third-party API calls (like Wiktionary) so that they get live updates
  if (!event.request.url.startsWith(self.location.origin)) {
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

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        // Cache newly requested local items dynamically if needed
        return response;
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
        icon: "./logo.png",
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
  let data = { title: "VocRussian", body: "Practice your Russian words today!" };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: "VocRussian", body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: "./logo.png",
    badge: "./logo.png",
    tag: "remote-push",
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

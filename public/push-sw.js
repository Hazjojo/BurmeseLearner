// Imported into the app's service worker: shows daily reminder notifications and opens the app when tapped.
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (e) {
    data = { notification: { title: 'BurmeseLearner', body: event.data && event.data.text() } }
  }
  const n = data.notification || data.data || {}
  event.waitUntil(
    self.registration.showNotification(n.title || 'Time for Burmese 🔥', {
      body: n.body || 'A few minutes keeps your streak going.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'daily-reminder',
      data: { link: (data.fcmOptions && data.fcmOptions.link) || n.link || '/' },
    }),
  )
})
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const link = (event.notification.data && event.notification.data.link) || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) if ('focus' in w) return w.focus()
      return self.clients.openWindow(link)
    }),
  )
})

// 태권도 플랫폼 Service Worker — 웹 푸시 알림 처리

self.addEventListener('push', (event) => {
  if (!event.data) return
  let data
  try {
    data = event.data.json()
  } catch {
    data = { title: '태권도 플랫폼', body: event.data.text(), url: '/' }
  }

  const options = {
    body: data.body,
    icon: data.icon ?? '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url ?? '/' },
    requireInteraction: false,
  }

  event.waitUntil(
    self.registration.showNotification(data.title ?? '태권도 플랫폼', options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus()
      }
      return clients.openWindow(url)
    })
  )
})

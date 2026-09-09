import { createResource, For } from 'solid-js'
import { api } from '../lib/api/client.js'
async function loadNotifications() {
  const result = await api.GET('/api/users/@me/notifications', {
    params: { query: { limit: 50 } },
  })
  if (!result.data) throw result
  return result.data.notifications
}
export function NotificationsPage() {
  const [items, { refetch }] = createResource(loadNotifications)
  return (
    <section class="notifications-view">
      <header>
        <h1>Notifications</h1>
        <button
          onClick={() =>
            void api
              .POST('/api/users/@me/notifications/read-all')
              .then(() => refetch())
          }
        >
          Mark all read
        </button>
      </header>
      <div class="notification-list">
        <For
          each={items()}
          fallback={<p class="empty-copy">You’re all caught up.</p>}
        >
          {(item) => (
            <article classList={{ unread: !item.readAt }}>
              <strong>{item.type.replaceAll('_', ' ')}</strong>
              <time>{new Date(item.createdAt).toLocaleString()}</time>
            </article>
          )}
        </For>
      </div>
    </section>
  )
}

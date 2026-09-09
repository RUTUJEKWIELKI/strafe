import { createResource, For } from 'solid-js'
import { api } from '../lib/api/client.js'
import { useTranslation } from 'solid-i18next'
async function loadNotifications() {
  const result = await api.GET('/api/users/@me/notifications', {
    params: { query: { limit: 50 } },
  })
  if (!result.data) throw result
  return result.data.notifications
}
export function NotificationsPage() {
  const [t] = useTranslation()
  const [items, { refetch }] = createResource(loadNotifications)
  return (
    <section class="notifications-view">
      <header>
        <h1>{t('workspace.navigation.notifications')}</h1>
        <button
          onClick={() =>
            void api
              .POST('/api/users/@me/notifications/read-all')
              .then(() => refetch())
          }
        >
          {t('workspace.notifications.readAll')}
        </button>
      </header>
      <div class="notification-list">
        <For
          each={items()}
          fallback={
            <p class="empty-copy">{t('workspace.notifications.empty')}</p>
          }
        >
          {(item) => (
            <article classList={{ unread: !item.readAt }}>
              <strong>
                {t(
                  `workspace.notifications.types.${item.type.replaceAll('.', '_')}`,
                  { defaultValue: t('workspace.notifications.types.default') },
                )}
              </strong>
              <time>{new Date(item.createdAt).toLocaleString()}</time>
            </article>
          )}
        </For>
      </div>
    </section>
  )
}

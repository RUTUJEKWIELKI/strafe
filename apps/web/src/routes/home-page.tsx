import { Bell, LockKeyhole, MessageCircle, UsersRound } from 'lucide-solid'
import { useTranslation } from 'solid-i18next'
export function HomePage() {
  const [t] = useTranslation()
  return (
    <div class="home-view">
      <header>
        <span class="kicker">{t('workspace.home.kicker')}</span>
        <h1>{t('workspace.home.title')}</h1>
        <p>{t('workspace.home.description')}</p>
      </header>
      <section class="home-grid">
        <a href="/@me/friends">
          <UsersRound />
          <strong>{t('workspace.navigation.friends')}</strong>
          <span>{t('workspace.home.friends')}</span>
        </a>
        <a href="/@me/notifications">
          <Bell />
          <strong>{t('workspace.navigation.notifications')}</strong>
          <span>{t('workspace.home.notifications')}</span>
        </a>
      </section>
      <section class="home-empty">
        <MessageCircle />
        <h2>{t('workspace.home.emptyTitle')}</h2>
        <p>{t('workspace.home.emptyText')}</p>
      </section>
      <footer>
        <LockKeyhole size={16} /> {t('workspace.home.encryption')}
      </footer>
    </div>
  )
}

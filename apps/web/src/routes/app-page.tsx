import { useNavigate } from '@solidjs/router'
import { LogOut, Settings } from 'lucide-solid'
import { onMount } from 'solid-js'
import { useTranslation } from 'solid-i18next'

import { TurtleMark } from '../components/brand/turtle-mark.js'
import { currentUser, logout } from '../lib/auth/session.js'

export function AppPage() {
  const [t] = useTranslation()
  const navigate = useNavigate()
  onMount(() => {
    if (!currentUser()) navigate('/login', { replace: true })
  })

  return (
    <main class="account-page">
      <header>
        <a class="wordmark" href="/">
          <TurtleMark />
          <span>strafe</span>
        </a>
        <nav>
          <a href="/settings">
            <Settings size={16} />
            {t('account.settings')}
          </a>
          <button onClick={() => void logout().then(() => navigate('/'))}>
            <LogOut size={16} />
            {t('account.signOut')}
          </button>
        </nav>
      </header>
      <section>
        <span class="kicker">{t('account.title')}</span>
        <h1>
          {t('account.greeting', { name: currentUser()?.displayName ?? '' })}
        </h1>
        <p>@{currentUser()?.handle}</p>
      </section>
    </main>
  )
}

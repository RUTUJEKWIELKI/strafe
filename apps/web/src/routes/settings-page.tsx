import { useNavigate } from '@solidjs/router'
import { ArrowLeft } from 'lucide-solid'
import { createSignal, onMount, Show } from 'solid-js'
import { useTranslation } from 'solid-i18next'

import { LanguageSelect } from '../components/language-select.js'
import { currentUser } from '../lib/auth/session.js'

export function SettingsPage() {
  const [t] = useTranslation()
  const navigate = useNavigate()
  const [status, setStatus] = createSignal<'error' | 'idle' | 'saved'>('idle')
  onMount(() => {
    if (!currentUser()) navigate('/login', { replace: true })
  })

  return (
    <main class="settings-page">
      <header>
        <a href="/app">
          <ArrowLeft size={16} />
          {t('account.title')}
        </a>
      </header>
      <section>
        <span class="kicker">{t('account.settings')}</span>
        <h1>{t('account.localeTitle')}</h1>
        <p>{t('account.localeDescription')}</p>
        <div class="settings-row">
          <LanguageSelect
            persistAccount
            onSaved={() => setStatus('saved')}
            onSaveError={() => setStatus('error')}
          />
        </div>
        <Show when={status() !== 'idle'}>
          <p
            class={
              status() === 'error' ? 'field-message--error' : 'settings-success'
            }
            role="status"
          >
            {status() === 'error'
              ? t('account.saveFailed')
              : t('account.saved')}
          </p>
        </Show>
      </section>
    </main>
  )
}

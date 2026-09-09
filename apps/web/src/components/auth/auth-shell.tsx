import { ArrowLeft } from 'lucide-solid'
import type { ParentProps } from 'solid-js'
import { useTranslation } from 'solid-i18next'

import { TurtleMark } from '../brand/turtle-mark.js'
import { LanguageSelect } from '../language-select.js'

interface AuthShellProps extends ParentProps {
  description: string
  eyebrow: string
  title: string
}

export function AuthShell(props: AuthShellProps) {
  const [t] = useTranslation()
  return (
    <main class="auth-page">
      <header class="auth-header">
        <a class="wordmark" href="/" aria-label={t('brand.home')}>
          <TurtleMark />
          <span>strafe</span>
        </a>
        <LanguageSelect />
      </header>
      <section class="auth-layout">
        <aside class="auth-context" aria-hidden="true">
          <p>{t('auth.common.context')}</p>
          <div class="auth-context__line" />
          <span>01</span>
        </aside>
        <div class="auth-content">
          <a class="auth-back" href="/">
            <ArrowLeft size={15} />
            {t('auth.common.back')}
          </a>
          <span class="kicker">{props.eyebrow}</span>
          <h1>{props.title}</h1>
          <p class="auth-description">{props.description}</p>
          {props.children}
        </div>
      </section>
    </main>
  )
}

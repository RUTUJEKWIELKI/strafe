import { Languages } from 'lucide-solid'
import { useLanguage, useTranslation } from 'solid-i18next'

import { changeLanguage, type SupportedLocale } from '../lib/i18n/i18n.js'
import { currentUser, saveAccountLocale } from '../lib/auth/session.js'

interface LanguageSelectProps {
  onSaveError?: () => void
  onSaved?: () => void
  persistAccount?: boolean
}

export function LanguageSelect(props: LanguageSelectProps) {
  const [t, instance] = useTranslation()
  const [language] = useLanguage(instance)

  const selectLanguage = async (locale: SupportedLocale) => {
    await changeLanguage(locale)
    if (props.persistAccount && currentUser()) {
      try {
        await saveAccountLocale(locale)
        props.onSaved?.()
      } catch {
        props.onSaveError?.()
      }
    }
  }

  return (
    <label class="language-select">
      <Languages aria-hidden="true" size={15} />
      <span class="sr-only">{t('language.label')}</span>
      <select
        aria-label={t('language.label')}
        onChange={(event) =>
          void selectLanguage(event.currentTarget.value as SupportedLocale)
        }
        value={language()}
      >
        <option value="pl">{t('language.polish')}</option>
        <option value="en">{t('language.english')}</option>
      </select>
    </label>
  )
}

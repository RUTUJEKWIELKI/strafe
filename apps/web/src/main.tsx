import { render } from 'solid-js/web'
import { I18nextProvider } from 'solid-i18next'

import { i18n, initializeI18n } from './lib/i18n/i18n.js'
import { LandingPage } from './routes/landing-page.js'
import './styles.css'

const root = document.querySelector('#root')

if (!root) {
  throw new Error('Root element not found')
}

await initializeI18n()

render(
  () => (
    <I18nextProvider i18n={i18n}>
      <LandingPage />
    </I18nextProvider>
  ),
  root,
)

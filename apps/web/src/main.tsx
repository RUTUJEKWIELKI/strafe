import { render } from 'solid-js/web'
import { I18nextProvider } from 'solid-i18next'
import { Route, Router } from '@solidjs/router'

import { restoreSession } from './lib/auth/session.js'
import { i18n, initializeI18n } from './lib/i18n/i18n.js'
import { AppPage } from './routes/app-page.js'
import { LandingPage } from './routes/landing-page.js'
import { LoginPage } from './routes/login-page.js'
import { RegisterPage } from './routes/register-page.js'
import { SettingsPage } from './routes/settings-page.js'
import { installGlobalTwemoji } from './lib/twemoji.js'
import './styles.css'

const root = document.querySelector('#root')

if (!root) {
  throw new Error('Root element not found')
}

await initializeI18n()
await restoreSession()

render(
  () => (
    <I18nextProvider i18n={i18n}>
      <Router>
        <Route path="/" component={LandingPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/app" component={AppPage} />
        <Route path="/settings" component={SettingsPage} />
      </Router>
    </I18nextProvider>
  ),
  root,
)

installGlobalTwemoji(root as HTMLElement)

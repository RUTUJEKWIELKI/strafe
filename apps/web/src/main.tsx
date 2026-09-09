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
import { MeLayout } from './routes/me-layout.js'
import { HomePage } from './routes/home-page.js'
import { FriendsPage } from './routes/friends-page.js'
import { ChatPage } from './routes/chat-page.js'
import { NotificationsPage } from './routes/notifications-page.js'
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
        <Route path="/@me" component={MeLayout}>
          <Route path="/" component={HomePage} />
          <Route path="/friends" component={FriendsPage} />
          <Route path="/friends/pending" component={FriendsPage} />
          <Route path="/friends/blocked" component={FriendsPage} />
          <Route path="/dm/:conversationId" component={ChatPage} />
          <Route path="/groups/:conversationId" component={ChatPage} />
          <Route path="/notifications" component={NotificationsPage} />
          <Route path="/settings" component={SettingsPage} />
        </Route>
      </Router>
    </I18nextProvider>
  ),
  root,
)

installGlobalTwemoji(root as HTMLElement)

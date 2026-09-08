import { useNavigate } from '@solidjs/router'
import { createSignal, onMount, Show } from 'solid-js'
import { useTranslation } from 'solid-i18next'

import { AuthShell } from '../components/auth/auth-shell.js'
import { PasswordField } from '../components/auth/password-field.js'
import { authErrorKey } from '../lib/auth/errors.js'
import { currentUser, login } from '../lib/auth/session.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function LoginPage() {
  const [t] = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [emailError, setEmailError] = createSignal('')
  const [passwordError, setPasswordError] = createSignal('')
  const [formError, setFormError] = createSignal('')
  const [submitting, setSubmitting] = createSignal(false)

  onMount(() => {
    if (currentUser()) navigate('/app', { replace: true })
  })

  const submit = async (event: SubmitEvent) => {
    event.preventDefault()
    const nextEmailError = emailPattern.test(email().trim())
      ? ''
      : t('auth.login.emailInvalid')
    const nextPasswordError = password() ? '' : t('auth.login.passwordRequired')
    setEmailError(nextEmailError)
    setPasswordError(nextPasswordError)
    setFormError('')
    if (nextEmailError || nextPasswordError) return

    setSubmitting(true)
    try {
      await login(email().trim(), password())
      navigate('/app', { replace: true })
    } catch (error) {
      const key = authErrorKey(error)
      setFormError(
        t(
          key === 'invalidCredentials'
            ? 'auth.login.invalidCredentials'
            : `auth.common.${key}`,
        ),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      eyebrow={t('auth.login.eyebrow')}
      title={t('auth.login.title')}
      description={t('auth.login.description')}
    >
      <form class="auth-form" onSubmit={submit} novalidate>
        <div class="form-field">
          <label for="login-email">{t('auth.common.email')}</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autocomplete="email"
            inputmode="email"
            disabled={submitting()}
            aria-invalid={Boolean(emailError())}
            aria-describedby={emailError() ? 'login-email-error' : undefined}
            value={email()}
            onInput={(event) => setEmail(event.currentTarget.value)}
          />
          <Show when={emailError()}>
            <p
              class="field-message field-message--error"
              id="login-email-error"
            >
              {emailError()}
            </p>
          </Show>
        </div>
        <PasswordField
          autocomplete="current-password"
          disabled={submitting()}
          error={passwordError()}
          onInput={setPassword}
          value={password()}
        />
        <Show when={formError()}>
          <p class="form-error" role="alert">
            {formError()}
          </p>
        </Show>
        <button class="auth-submit" type="submit" disabled={submitting()}>
          {submitting() ? t('auth.login.submitting') : t('auth.login.submit')}
        </button>
      </form>
      <p class="auth-alternate">
        {t('auth.login.noAccount')}{' '}
        <a href="/register">{t('auth.login.register')}</a>
      </p>
    </AuthShell>
  )
}

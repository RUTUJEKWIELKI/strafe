import { useNavigate } from '@solidjs/router'
import { createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js'
import { useTranslation } from 'solid-i18next'

import { AuthShell } from '../components/auth/auth-shell.js'
import { PasswordField } from '../components/auth/password-field.js'
import { Turnstile } from '../components/auth/turnstile.js'
import { authErrorKey } from '../lib/auth/errors.js'
import {
  checkHandleAvailability,
  currentUser,
  register,
} from '../lib/auth/session.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const handlePattern = /^[A-Za-z0-9_.]{3,32}$/
type HandleStatus =
  'available' | 'checking' | 'idle' | 'invalid' | 'taken' | 'unavailable'

export function isOldEnough(birthDate: string, now = new Date()): boolean {
  const [year, month, day] = birthDate.split('-').map(Number)
  if (!year || !month || !day) return false
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date > now
  )
    return false
  return new Date(year + 13, month - 1, day) <= now
}

export function RegisterPage() {
  const [t, i18n] = useTranslation()
  const navigate = useNavigate()
  const [handle, setHandle] = createSignal('')
  const [displayName, setDisplayName] = createSignal('')
  const [birthDate, setBirthDate] = createSignal('')
  const [email, setEmail] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [handleStatus, setHandleStatus] = createSignal<HandleStatus>('idle')
  const [errors, setErrors] = createSignal<Record<string, string>>({})
  const [formError, setFormError] = createSignal('')
  const [submitting, setSubmitting] = createSignal(false)
  const [captchaToken, setCaptchaToken] = createSignal('')

  onMount(() => {
    if (currentUser()) navigate('/app', { replace: true })
  })

  createEffect(() => {
    const staticValue = handle().trim()
    if (!staticValue) {
      setHandleStatus('idle')
      return
    }
    if (!handlePattern.test(staticValue)) {
      setHandleStatus('invalid')
      return
    }
    setHandleStatus('checking')
    const timer = window.setTimeout(async () => {
      try {
        const result = await checkHandleAvailability(staticValue)
        if (handle().trim() === staticValue)
          setHandleStatus(result.available ? 'available' : 'taken')
      } catch {
        if (handle().trim() === staticValue) setHandleStatus('unavailable')
      }
    }, 450)
    onCleanup(() => window.clearTimeout(timer))
  })

  const handleMessage = () =>
    ({
      available: t('auth.register.handleAvailable'),
      checking: t('auth.register.handleChecking'),
      invalid: t('auth.register.handleInvalid'),
      taken: t('auth.register.handleTaken'),
      unavailable: t('auth.register.handleCheckFailed'),
      idle: t('auth.register.handleHint'),
    })[handleStatus()]

  const validate = () => {
    const next: Record<string, string> = {}
    if (!handlePattern.test(handle().trim()))
      next.handle = t('auth.register.handleInvalid')
    else if (handleStatus() === 'taken')
      next.handle = t('auth.register.handleTaken')
    const name = displayName().trim()
    if (!name || name.length > 64)
      next.displayName = t('auth.register.displayNameInvalid')
    if (!birthDate()) next.birthDate = t('auth.register.birthDateInvalid')
    else if (!isOldEnough(birthDate()))
      next.birthDate = t('auth.register.ageInvalid')
    if (!emailPattern.test(email().trim()))
      next.email = t('auth.login.emailInvalid')
    if (password().length < 12 || password().length > 128)
      next.password = t('auth.register.passwordInvalid')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (event: SubmitEvent) => {
    event.preventDefault()
    setFormError('')
    if (!validate()) return
    setSubmitting(true)
    try {
      await register({
        birthDate: birthDate(),
        ...(captchaToken() ? { captchaToken: captchaToken() } : {}),
        displayName: displayName().trim(),
        email: email().trim(),
        handle: handle().trim(),
        locale: i18n().resolvedLanguage === 'pl' ? 'pl' : 'en',
        password: password(),
      })
      navigate('/app', { replace: true })
    } catch (error) {
      const key = authErrorKey(error)
      if (key === 'handleTaken') {
        setHandleStatus('taken')
        setErrors((value) => ({
          ...value,
          handle: t('auth.register.handleTaken'),
        }))
      } else if (key === 'emailTaken')
        setErrors((value) => ({
          ...value,
          email: t('auth.register.emailTaken'),
        }))
      else setFormError(t(`auth.common.${key}`))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      eyebrow={t('auth.register.eyebrow')}
      title={t('auth.register.title')}
      description={t('auth.register.description')}
    >
      <form class="auth-form auth-form--register" onSubmit={submit} novalidate>
        <div class="form-field">
          <label for="register-handle">{t('auth.register.handle')}</label>
          <div class="handle-input">
            <span>@</span>
            <input
              id="register-handle"
              name="username"
              autocomplete="username"
              disabled={submitting()}
              aria-invalid={Boolean(
                errors().handle ||
                handleStatus() === 'invalid' ||
                handleStatus() === 'taken',
              )}
              aria-describedby="handle-status"
              value={handle()}
              onInput={(event) => setHandle(event.currentTarget.value)}
            />
          </div>
          <p
            class={`field-message field-message--${handleStatus()}`}
            id="handle-status"
            aria-live="polite"
          >
            {errors().handle ?? handleMessage()}
          </p>
        </div>
        <div class="form-field">
          <label for="display-name">{t('auth.register.displayName')}</label>
          <input
            id="display-name"
            name="name"
            autocomplete="name"
            maxlength="64"
            disabled={submitting()}
            aria-invalid={Boolean(errors().displayName)}
            aria-describedby={
              errors().displayName ? 'display-name-error' : 'display-name-hint'
            }
            value={displayName()}
            onInput={(event) => setDisplayName(event.currentTarget.value)}
          />
          <p
            class={`field-message${errors().displayName ? 'field-message--error' : ''}`}
            id={
              errors().displayName ? 'display-name-error' : 'display-name-hint'
            }
          >
            {errors().displayName ?? t('auth.register.displayNameHint')}
          </p>
        </div>
        <div class="form-field">
          <label for="birth-date">{t('auth.register.birthDate')}</label>
          <input
            id="birth-date"
            name="bday"
            type="date"
            autocomplete="bday"
            disabled={submitting()}
            aria-invalid={Boolean(errors().birthDate)}
            aria-describedby="birth-date-message"
            value={birthDate()}
            onInput={(event) => setBirthDate(event.currentTarget.value)}
          />
          <p
            class={`field-message${errors().birthDate ? 'field-message--error' : ''}`}
            id="birth-date-message"
          >
            {errors().birthDate ?? t('auth.register.birthDateHint')}
          </p>
        </div>
        <div class="form-field">
          <label for="register-email">{t('auth.common.email')}</label>
          <input
            id="register-email"
            name="email"
            type="email"
            autocomplete="email"
            inputmode="email"
            disabled={submitting()}
            aria-invalid={Boolean(errors().email)}
            aria-describedby={
              errors().email ? 'register-email-error' : undefined
            }
            value={email()}
            onInput={(event) => setEmail(event.currentTarget.value)}
          />
          <Show when={errors().email}>
            <p
              class="field-message field-message--error"
              id="register-email-error"
            >
              {errors().email}
            </p>
          </Show>
        </div>
        <PasswordField
          autocomplete="new-password"
          disabled={submitting()}
          error={errors().password ?? ''}
          hint={t('auth.register.passwordHint')}
          onInput={setPassword}
          value={password()}
        />
        <Turnstile onToken={setCaptchaToken} />
        <Show when={formError()}>
          <p class="form-error" role="alert">
            {formError()}
          </p>
        </Show>
        <button class="auth-submit" type="submit" disabled={submitting()}>
          {submitting()
            ? t('auth.register.submitting')
            : t('auth.register.submit')}
        </button>
        <p class="auth-terms">{t('auth.register.terms')}</p>
      </form>
      <p class="auth-alternate">
        {t('auth.register.hasAccount')}{' '}
        <a href="/login">{t('auth.register.login')}</a>
      </p>
    </AuthShell>
  )
}

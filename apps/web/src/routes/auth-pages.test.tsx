import { Route, Router } from '@solidjs/router'
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { I18nextProvider } from 'solid-i18next'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { changeLanguage, i18n } from '../lib/i18n/i18n.js'
import { LoginPage } from './login-page.js'
import { RegisterPage } from './register-page.js'

afterEach(cleanup)
beforeEach(async () => {
  sessionStorage.clear()
  await changeLanguage('en')
})

function renderPage(Page: typeof LoginPage | typeof RegisterPage) {
  return render(() => (
    <I18nextProvider i18n={i18n}>
      <Router>
        <Route path="/" component={Page} />
      </Router>
    </I18nextProvider>
  ))
}

describe('authentication pages', () => {
  it('associates login validation errors with their fields', async () => {
    renderPage(LoginPage)
    await fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(
      screen.getByLabelText('Email address').getAttribute('aria-invalid'),
    ).toBe('true')
    expect(screen.getByLabelText('Password').getAttribute('aria-invalid')).toBe(
      'true',
    )
    expect(screen.getByText('Enter a valid email address.')).toBeTruthy()
  })

  it('validates registration age and nickname before submitting', async () => {
    renderPage(RegisterPage)
    await fireEvent.input(screen.getByLabelText('Nickname'), {
      target: { value: 'bad handle' },
    })
    await fireEvent.input(screen.getByLabelText('Date of birth'), {
      target: { value: '2020-01-01' },
    })
    await fireEvent.click(
      screen.getByRole('button', { name: 'Create account' }),
    )

    expect(
      screen.getByText('Use 3–32 letters, numbers, underscores, or dots.'),
    ).toBeTruthy()
    expect(screen.getByText('You must be at least 13 years old.')).toBeTruthy()
  })
})

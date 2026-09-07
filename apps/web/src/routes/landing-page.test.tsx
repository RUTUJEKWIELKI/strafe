import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@solidjs/testing-library'
import { I18nextProvider } from 'solid-i18next'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { changeLanguage, i18n, languageStorageKey } from '../lib/i18n/i18n.js'
import { LandingPage } from './landing-page.js'

afterEach(cleanup)
beforeEach(async () => {
  localStorage.clear()
  await changeLanguage('pl')
})

function renderLandingPage() {
  return render(() => (
    <I18nextProvider i18n={i18n}>
      <LandingPage />
    </I18nextProvider>
  ))
}

describe('LandingPage', () => {
  it('presents the product and its privacy promise', () => {
    renderLandingPage()

    expect(
      screen.getByRole('heading', {
        name: /Twoje miejsce\.\s*Twoi ludzie\./,
      }),
    ).toBeTruthy()
    expect(screen.getByText('Bez reklam')).toBeTruthy()
    expect(
      screen.getByRole('heading', {
        name: /To, co prywatne,\s*zostaje prywatne\./,
      }),
    ).toBeTruthy()
  })

  it('opens and closes the mobile navigation', async () => {
    renderLandingPage()
    const menuButton = screen.getByRole('button', { name: 'Otwórz menu' })

    expect(
      screen.queryByRole('navigation', { name: 'Nawigacja mobilna' }),
    ).toBeNull()
    await fireEvent.click(menuButton)
    const mobileNavigation = screen.getByRole('navigation', {
      name: 'Nawigacja mobilna',
    })
    expect(mobileNavigation).toBeTruthy()
    expect(menuButton.getAttribute('aria-expanded')).toBe('true')
    await fireEvent.click(
      within(mobileNavigation).getByRole('link', { name: 'Możliwości' }),
    )
    expect(
      screen.queryByRole('navigation', { name: 'Nawigacja mobilna' }),
    ).toBeNull()
  })

  it('switches to English and remembers the explicit choice', async () => {
    renderLandingPage()

    await fireEvent.click(screen.getAllByRole('button', { name: 'EN' })[0]!)

    expect(
      screen.getByRole('heading', {
        name: /Your place\.\s*Your people\./,
      }),
    ).toBeTruthy()
    expect(localStorage.getItem(languageStorageKey)).toBe('en')
    await waitFor(() => expect(document.documentElement.lang).toBe('en'))
  })
})

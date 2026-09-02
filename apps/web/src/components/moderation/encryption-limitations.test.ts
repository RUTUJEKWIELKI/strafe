import { cleanup, render, screen } from '@solidjs/testing-library'
import { createComponent } from 'solid-js'
import { afterEach, describe, expect, it } from 'vitest'

import { EncryptionLimitations } from './encryption-limitations.js'

afterEach(cleanup)

describe('EncryptionLimitations', () => {
  it('states which moderation is unavailable for an encrypted space', () => {
    render(() => createComponent(EncryptionLimitations, { encrypted: true }))

    expect(screen.getByText(/Serwer nie ma dostępu do treści/)).toBeTruthy()
    expect(screen.getByText(/tempo wiadomości/)).toBeTruthy()
    expect(screen.getByText(/świadomie dołączy/)).toBeTruthy()
  })
})

import { cleanup, render, screen } from '@solidjs/testing-library'
import { createComponent } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Button } from './button.js'

afterEach(cleanup)

describe('Button', () => {
  it('renders an accessible button and handles interaction', () => {
    const onClick = vi.fn()

    render(() =>
      createComponent(Button, {
        children: 'Continue',
        onClick,
      }),
    )
    const button = screen.getByRole('button', { name: 'Continue' })

    button.click()

    expect(onClick).toHaveBeenCalledOnce()
    expect(button.getAttribute('type')).toBe('button')
  })
})

import { describe, expect, it } from 'vitest'

import { renderSafeMarkdown } from './markdown'

describe('renderSafeMarkdown', () => {
  it('renders safe markdown correctly', () => {
    const input = '**Hello** *world*'
    const output = renderSafeMarkdown(input)
    expect(output).toBe('<p><strong>Hello</strong> <em>world</em></p>')
  })

  it('escapes/removes malicious script tags', () => {
    const input = '<script>alert("XSS")</script>'
    const output = renderSafeMarkdown(input)
    // As long as it is escaped or stripped, it's safe from XSS.
    expect(output.includes('<script>')).toBe(false)
  })

  it('removes javascript: links', () => {
    const input = '[click me](javascript:alert("XSS"))'
    const output = renderSafeMarkdown(input)
    // DOMPurify strips the malicious payload leaving href empty
    expect(output).toBe('<p><a href="">click me</a></p>')
  })

  it('allows safe links', () => {
    const input = '[click me](https://example.com)'
    const output = renderSafeMarkdown(input)
    expect(output).toBe('<p><a href="https://example.com">click me</a></p>')
  })

  it('renders GitHub Flavored Markdown (strikethrough)', () => {
    const input = '~~deleted~~'
    const output = renderSafeMarkdown(input)
    expect(output).toBe('<p><del>deleted</del></p>')
  })
})

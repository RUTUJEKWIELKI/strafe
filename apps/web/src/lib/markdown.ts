import DOMPurify from 'dompurify'
import { micromark } from 'micromark'
import { gfm, gfmHtml } from 'micromark-extension-gfm'

/**
 * Parses Markdown to HTML and sanitizes it to prevent XSS.
 * All user-generated rich text must pass through this function.
 */
export function renderSafeMarkdown(rawMarkdown: string): string {
  const rawHtml = micromark(rawMarkdown, {
    allowDangerousHtml: true,
    extensions: [gfm()],
    htmlExtensions: [gfmHtml()],
  })

  const sanitized = DOMPurify.sanitize(rawHtml, {
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOWED_TAGS: [
      'b',
      'i',
      'em',
      'strong',
      'a',
      'p',
      'br',
      'ul',
      'ol',
      'li',
      'code',
      'pre',
      'blockquote',
      'del',
    ],
  })

  return sanitized.trim()
}

import { onCleanup, onMount, Show } from 'solid-js'

interface TurnstileProps {
  onToken: (token: string) => void
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          callback: (token: string) => void
          'error-callback': () => void
          sitekey: string
          theme: 'light'
        },
      ) => string
      remove: (widgetId: string) => void
    }
  }
}

export function Turnstile(props: TurnstileProps) {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY
  let container: HTMLDivElement | undefined
  let widgetId: string | undefined

  onMount(() => {
    if (!siteKey || !container) return
    const render = () => {
      if (!container || !window.turnstile || widgetId) return
      widgetId = window.turnstile.render(container, {
        callback: props.onToken,
        'error-callback': () => props.onToken(''),
        sitekey: siteKey,
        theme: 'light',
      })
    }
    const existing = document.querySelector<HTMLScriptElement>(
      '[data-strafe-turnstile]',
    )
    if (existing) {
      existing.addEventListener('load', render, { once: true })
      render()
      return
    }
    const script = document.createElement('script')
    script.src =
      'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.dataset.strafeTurnstile = ''
    script.addEventListener('load', render, { once: true })
    document.head.append(script)
  })

  onCleanup(() => {
    if (widgetId) window.turnstile?.remove(widgetId)
  })
  return (
    <Show when={siteKey}>
      <div class="turnstile" ref={(element) => (container = element)} />
    </Show>
  )
}

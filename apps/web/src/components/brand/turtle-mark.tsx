import { clsx } from 'clsx'
import { useTranslation } from 'solid-i18next'

interface TurtleMarkProps {
  class?: string
}

export function TurtleMark(props: TurtleMarkProps) {
  const [t] = useTranslation()

  return (
    <svg
      aria-label={t('brand.turtle')}
      class={clsx('turtle-mark', props.class)}
      role="img"
      viewBox="0 0 52 52"
    >
      <path
        d="M12 33c-3.8 0-6.4 1.9-7.5 5.1 3.3 1.6 6.5 1.5 9.2-.6M39 33c3.8 0 6.4 1.9 7.5 5.1-3.3 1.6-6.5 1.5-9.2-.6"
        fill="#ffd84a"
        stroke="#123d2a"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2.4"
      />
      <path
        d="M14 41.5c-1.6 2.6-1.4 4.5.5 5.8 2.7-1 4.4-2.7 5-5.2m18.5-.6c1.6 2.6 1.4 4.5-.5 5.8-2.7-1-4.4-2.7-5-5.2"
        fill="#ffd84a"
        stroke="#123d2a"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2.4"
      />
      <path
        d="M39.5 26.8c5.7-.2 8.3 2.2 7.7 6.1-.5 3.4-4.2 4.7-8.6 3.6"
        fill="#ffd84a"
        stroke="#123d2a"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2.4"
      />
      <path
        d="M25.8 8.2c10 0 17.7 7.3 17.7 17.7 0 11.7-7.7 17.5-17.7 17.5S8.2 37.6 8.2 25.9c0-10.4 7.6-17.7 17.6-17.7Z"
        fill="#ffd84a"
        stroke="#123d2a"
        stroke-width="2.6"
      />
      <path
        d="m25.8 9.4-6.9 8.1 6.9 8.4 7-8.4-7-8.1Zm0 16.5-10 4.5 3.2 10.5m6.8-15 10.1 4.5-3.3 10.5M9.5 22.9l9.4-5.4m23.2 5.4-9.3-5.4"
        fill="none"
        stroke="#123d2a"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.8"
      />
      <circle cx="43.2" cy="31.1" r="1.15" fill="#123d2a" />
      <path
        d="M42.5 33.4c.8.8 1.7.8 2.5 0"
        fill="none"
        stroke="#123d2a"
        stroke-linecap="round"
        stroke-width="1.3"
      />
    </svg>
  )
}

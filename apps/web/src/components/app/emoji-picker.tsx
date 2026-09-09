import { For } from 'solid-js'
import { useTranslation } from 'solid-i18next'
const emojis = [
  '😀',
  '😂',
  '🥰',
  '😎',
  '🤔',
  '👍',
  '👏',
  '❤️',
  '🔥',
  '🎉',
  '🐢',
  '✨',
]
export function EmojiPicker(props: { onSelect: (emoji: string) => void }) {
  const [t] = useTranslation()
  return (
    <div
      class="emoji-picker"
      role="listbox"
      aria-label={t('workspace.emoji.title')}
    >
      <For each={emojis}>
        {(emoji) => (
          <button
            role="option"
            aria-label={emoji}
            onClick={() => props.onSelect(emoji)}
          >
            {emoji}
          </button>
        )}
      </For>
    </div>
  )
}

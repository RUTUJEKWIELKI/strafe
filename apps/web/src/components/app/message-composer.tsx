import { createSignal, Show } from 'solid-js'
import { SmilePlus } from 'lucide-solid'
import { useTranslation } from 'solid-i18next'
import { EmojiPicker } from './emoji-picker.js'

export function MessageComposer(props: {
  encryptionReady: boolean
  onSend: (value: string) => Promise<void>
  onTyping: () => void
}) {
  const [t] = useTranslation()
  const [value, setValue] = createSignal('')
  const [pickerOpen, setPickerOpen] = createSignal(false)
  return (
    <form
      class="message-composer"
      onSubmit={(event) => {
        event.preventDefault()
        const message = value().trim()
        if (!message) return
        void props.onSend(message).then(() => setValue(''))
      }}
    >
      <button
        type="button"
        onClick={() => setPickerOpen(!pickerOpen())}
        aria-label={t('workspace.emoji.open')}
      >
        <SmilePlus />
      </button>
      <Show when={pickerOpen()}>
        <EmojiPicker
          onSelect={(emoji) => {
            setValue(value() + emoji)
            setPickerOpen(false)
          }}
        />
      </Show>
      <label class="sr-only" for="message-content">
        {t('workspace.chat.message')}
      </label>
      <textarea
        id="message-content"
        value={value()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            event.currentTarget.form?.requestSubmit()
          }
        }}
        onInput={(event) => {
          setValue(event.currentTarget.value.slice(0, 4000))
          props.onTyping()
        }}
        disabled={!props.encryptionReady}
        placeholder={
          props.encryptionReady
            ? t('workspace.chat.placeholder')
            : t('workspace.encryption.setupRequired')
        }
      />
      <button disabled={!props.encryptionReady || !value().trim()}>
        {t('workspace.actions.send')}
      </button>
    </form>
  )
}

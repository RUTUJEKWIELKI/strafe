import { createSignal, For, Show } from 'solid-js'
import type { Message } from '@strafe/shared'
import { SmilePlus } from 'lucide-solid'
import { useTranslation } from 'solid-i18next'
import { api } from '../../lib/api/client.js'
import { EmojiPicker } from './emoji-picker.js'

export function MessageList(props: { messages: Message[]; loading: boolean }) {
  const [t] = useTranslation()
  const [reacting, setReacting] = createSignal<string>()
  return (
    <div class="message-list">
      <Show
        when={!props.loading}
        fallback={<p>{t('workspace.chat.loading')}</p>}
      >
        <For
          each={props.messages}
          fallback={
            <div class="chat-empty">
              <h2>{t('workspace.chat.emptyTitle')}</h2>
              <p>{t('workspace.chat.emptyText')}</p>
            </div>
          }
        >
          {(message, index) => {
            const grouped = () =>
              index() > 0 &&
              props.messages[index() - 1]?.authorId === message.authorId
            return (
              <article
                classList={{
                  'message-row': true,
                  'message-row--grouped': grouped(),
                }}
              >
                <Show when={!grouped()}>
                  <button
                    class="avatar"
                    aria-label={message.author?.displayName}
                  >
                    {message.author?.displayName[0] ?? '·'}
                  </button>
                </Show>
                <div>
                  <Show when={!grouped()}>
                    <strong>
                      {message.author?.displayName ??
                        t('workspace.chat.system')}{' '}
                      <time>
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </strong>
                  </Show>
                  <p classList={{ deleted: Boolean(message.deletedAt) }}>
                    {message.deletedAt
                      ? t('workspace.chat.deleted')
                      : message.envelope
                        ? t('workspace.chat.encryptedLocked')
                        : t('workspace.chat.unavailable')}
                  </p>
                  {message.editedAt && (
                    <small>{t('workspace.chat.edited')}</small>
                  )}
                </div>
                <button
                  onClick={() =>
                    setReacting(
                      reacting() === message.id ? undefined : message.id,
                    )
                  }
                  aria-label={t('workspace.reactions.add')}
                >
                  <SmilePlus size={17} />
                </button>
                {reacting() === message.id && (
                  <EmojiPicker
                    onSelect={(emoji) =>
                      void api
                        .PUT('/api/messages/{messageId}/reactions', {
                          params: { path: { messageId: message.id } },
                          body: { emojiKey: emoji },
                        })
                        .then(() => setReacting())
                    }
                  />
                )}
              </article>
            )
          }}
        </For>
      </Show>
    </div>
  )
}

import { useParams } from '@solidjs/router'
import { createResource, For, Show } from 'solid-js'
import { LockKeyhole, SmilePlus } from 'lucide-solid'
import { api } from '../lib/api/client.js'
import { EncryptionNotice } from '../components/app/encryption-notice.js'

async function loadMessages(channelId: string) {
  const result = await api.GET('/api/channels/{channelId}/messages', {
    params: { path: { channelId }, query: { limit: 50 } },
  })
  if (!result.data) throw result
  return result.data.messages.toReversed()
}
export function ChatPage() {
  const params = useParams()
  const [messages] = createResource(() => params.conversationId, loadMessages)
  return (
    <section class="chat-view">
      <header>
        <div>
          <h1>Private conversation</h1>
          <span>
            <LockKeyhole size={14} /> Security status is verified per device
          </span>
        </div>
      </header>
      <EncryptionNotice />
      <div class="message-list">
        <Show
          when={!messages.loading}
          fallback={<p>Loading encrypted history…</p>}
        >
          <For
            each={messages()}
            fallback={
              <div class="chat-empty">
                <h2>No messages yet</h2>
                <p>
                  Encrypted messages sent here will appear on every authorized
                  device.
                </p>
              </div>
            }
          >
            {(message) => (
              <article class="message-row">
                <div class="avatar">
                  {message.author?.displayName[0] ?? '·'}
                </div>
                <div>
                  <strong>
                    {message.author?.displayName ?? 'System'}{' '}
                    <time>
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </strong>
                  <p>
                    {message.deletedAt
                      ? 'Message deleted'
                      : message.envelope
                        ? 'Encrypted message — unlock this device to read'
                        : 'Unavailable legacy message'}
                  </p>
                </div>
                <button aria-label="Add reaction">
                  <SmilePlus size={17} />
                </button>
              </article>
            )}
          </For>
        </Show>
      </div>
      <form
        class="message-composer"
        onSubmit={(event) => event.preventDefault()}
      >
        <button type="button" aria-label="Open emoji picker">
          <SmilePlus />
        </button>
        <label class="sr-only" for="message-content">
          Message
        </label>
        <textarea
          id="message-content"
          disabled
          placeholder="Set up encryption keys to send messages"
        />
        <button disabled>Send</button>
      </form>
    </section>
  )
}

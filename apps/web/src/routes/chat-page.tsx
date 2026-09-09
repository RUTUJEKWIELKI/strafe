import type { Message } from '@strafe/shared'
import { useParams } from '@solidjs/router'
import {
  createEffect,
  createResource,
  createSignal,
  onCleanup,
  Show,
} from 'solid-js'
import { useTranslation } from 'solid-i18next'
import { ConversationHeader } from '../components/app/conversation-header.js'
import { EncryptionNotice } from '../components/app/encryption-notice.js'
import { GroupMemberPanel } from '../components/app/group-member-panel.js'
import { MessageComposer } from '../components/app/message-composer.js'
import { MessageList } from '../components/app/message-list.js'
import { api } from '../lib/api/client.js'
import { currentDeviceId, currentUser } from '../lib/auth/session.js'
import { useConversations } from '../lib/conversations/context.js'
import {
  conversationKeyStore,
  ensureDeviceKeyBundle,
} from '../lib/e2ee/key-store.js'
import { encryptMessage } from '../lib/messages/encryption.js'
import { realtime } from '../lib/realtime/client.js'
import { useRealtime } from '../lib/realtime/context.js'

async function loadMessages(channelId: string) {
  const result = await api.GET('/api/channels/{channelId}/messages', {
    params: { path: { channelId }, query: { limit: 50 } },
  })
  if (!result.data) throw result
  return result.data.messages.toReversed()
}

export function ChatPage() {
  const [t] = useTranslation()
  const params = useParams<{ conversationId: string }>()
  const conversations = useConversations()
  const realtimeState = useRealtime()
  const conversation = () =>
    conversations
      .conversations()
      .find((item) => item.id === params.conversationId)
  const [messages, { mutate, refetch }] = createResource(
    () => params.conversationId,
    loadMessages,
  )
  const [membersOpen, setMembersOpen] = createSignal(false)
  const [encryptionReady, setEncryptionReady] = createSignal(false)
  const [sendError, setSendError] = createSignal(false)
  createEffect(() => {
    const active = conversation()
    const deviceId = currentDeviceId()
    if (!active || !deviceId) return
    setEncryptionReady(false)
    void ensureDeviceKeyBundle(deviceId)
      .then(() =>
        conversationKeyStore.ensureConversationKey(
          active.id,
          active.currentEncryptionEpoch,
        ),
      )
      .then(() => setEncryptionReady(true))
      .catch(() => setEncryptionReady(false))
  })
  createEffect(() => {
    const unsubscribe = realtime.subscribe(params.conversationId)
    onCleanup(unsubscribe)
  })
  createEffect(() => {
    const event = realtimeState.lastEvent()
    if (!event) return
    if (
      event.aggregateId === params.conversationId &&
      /^(message\.|channel\.)/.test(event.type)
    )
      void refetch()
  })
  createEffect(() => {
    const last = messages()?.at(-1)
    if (!last || document.visibilityState !== 'visible') return
    void api.PUT('/api/channels/{channelId}/read-state', {
      params: { path: { channelId: params.conversationId } },
      body: { lastReadMessageId: last.id },
    })
  })
  const send = async (plaintext: string) => {
    const active = conversation()
    const deviceId = currentDeviceId()
    const user = currentUser()
    if (!active || !deviceId || !user || !encryptionReady()) return
    setSendError(false)
    const clientNonce = crypto.randomUUID()
    const envelope = await encryptMessage(plaintext, conversationKeyStore, {
      conversationId: active.id,
      epoch: active.currentEncryptionEpoch,
      senderDeviceId: deviceId,
    })
    const optimistic: Message = {
      attachmentEnvelopes: [],
      attachmentIds: [],
      author: user,
      authorId: user.id,
      channelId: active.id,
      createdAt: new Date().toISOString(),
      deletedAt: null,
      editedAt: null,
      envelope,
      flags: 0,
      id: clientNonce,
      migrationState: 'encrypted',
      replyToMessageId: null,
      type: 'default',
    }
    mutate([...(messages() ?? []), optimistic])
    const result = await api.POST('/api/channels/{channelId}/messages', {
      params: { path: { channelId: active.id } },
      body: { clientNonce, envelope },
    })
    if (!result.data) {
      mutate((messages() ?? []).filter((message) => message.id !== clientNonce))
      setSendError(true)
      throw result
    }
    mutate(
      (messages() ?? []).map((message) =>
        message.id === clientNonce ? result.data! : message,
      ),
    )
  }
  return (
    <Show
      when={conversation()}
      fallback={
        <section class="chat-view">
          <p class="app-loading">{t('workspace.chat.unavailable')}</p>
        </section>
      }
    >
      {(active) => (
        <section
          classList={{
            'chat-view': true,
            'chat-view--group': active().type === 'group_dm',
          }}
        >
          <div class="chat-column">
            <ConversationHeader
              conversation={active()}
              onMembers={() => setMembersOpen(true)}
            />
            <EncryptionNotice />
            <MessageList
              messages={messages() ?? []}
              loading={messages.loading}
              keyStore={conversationKeyStore}
            />
            {sendError() && (
              <p class="composer-error">{t('workspace.chat.sendFailed')}</p>
            )}
            <MessageComposer
              encryptionReady={encryptionReady()}
              onSend={send}
              onTyping={() => realtime.typing(params.conversationId)}
            />
          </div>
          {active().type === 'group_dm' && (
            <GroupMemberPanel
              conversation={active()}
              onChanged={conversations.refetch}
            />
          )}
          <Show when={membersOpen()}>
            <div
              class="member-drawer-backdrop"
              onClick={() => setMembersOpen(false)}
            >
              <div onClick={(event) => event.stopPropagation()}>
                <GroupMemberPanel
                  conversation={active()}
                  mobile
                  onClose={() => setMembersOpen(false)}
                  onChanged={conversations.refetch}
                />
              </div>
            </div>
          </Show>
        </section>
      )}
    </Show>
  )
}

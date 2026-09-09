import { useParams } from '@solidjs/router'
import { createResource, createSignal, Show } from 'solid-js'
import { useTranslation } from 'solid-i18next'

import { ConversationHeader } from '../components/app/conversation-header.js'
import { EncryptionNotice } from '../components/app/encryption-notice.js'
import { GroupMemberPanel } from '../components/app/group-member-panel.js'
import { MessageComposer } from '../components/app/message-composer.js'
import { MessageList } from '../components/app/message-list.js'
import { api } from '../lib/api/client.js'
import { useConversations } from '../lib/conversations/context.js'

async function loadMessages(channelId: string) {
  const result = await api.GET('/api/channels/{channelId}/messages', {
    params: { path: { channelId }, query: { limit: 50 } },
  })
  if (!result.data) throw result
  return result.data.messages.toReversed()
}

export function ChatPage() {
  const [t] = useTranslation()
  const params = useParams()
  const conversations = useConversations()
  const conversation = () =>
    conversations
      .conversations()
      .find((item) => item.id === params.conversationId)
  const [messages] = createResource(() => params.conversationId, loadMessages)
  const [membersOpen, setMembersOpen] = createSignal(false)
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
            />
            <MessageComposer encryptionReady={false} />
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

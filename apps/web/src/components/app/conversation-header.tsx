import { LockKeyhole, UsersRound } from 'lucide-solid'
import type { Conversation } from '@strafe/shared'
import { useTranslation } from 'solid-i18next'
import { currentUser } from '../../lib/auth/session.js'

export function ConversationHeader(props: {
  conversation: Conversation
  onMembers: () => void
}) {
  const [t] = useTranslation()
  const peer = () =>
    props.conversation.members.find(
      (member) => member.user.id !== currentUser()?.id,
    )
  const title = () =>
    props.conversation.type === 'dm'
      ? (peer()?.user.displayName ?? t('workspace.chat.directMessage'))
      : props.conversation.name
  return (
    <header class="chat-header">
      <span class="avatar">{title()[0]}</span>
      <div>
        <h1>{title()}</h1>
        <span>
          {props.conversation.type === 'group_dm'
            ? t('workspace.chat.memberCount', {
                count: props.conversation.members.length,
              })
            : `@${peer()?.user.handle ?? ''}`}
        </span>
      </div>
      <span class="chat-security">
        <LockKeyhole size={14} />
        {t('workspace.encryption.status')}
      </span>
      {props.conversation.type === 'group_dm' && (
        <button
          onClick={props.onMembers}
          aria-label={t('workspace.members.open')}
        >
          <UsersRound />
        </button>
      )}
    </header>
  )
}

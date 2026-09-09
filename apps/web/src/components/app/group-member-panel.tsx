import { Crown, UserMinus, X } from 'lucide-solid'
import { createSignal, For } from 'solid-js'
import type { Conversation } from '@strafe/shared'
import { useTranslation } from 'solid-i18next'
import { UserProfilePanel } from './user-profile-panel.js'
import { api } from '../../lib/api/client.js'
import { currentUser } from '../../lib/auth/session.js'

export function GroupMemberPanel(props: {
  conversation: Conversation
  mobile?: boolean
  onClose?: () => void
  onChanged?: () => void
}) {
  const [t] = useTranslation()
  const [selected, setSelected] =
    createSignal<Conversation['members'][number]>()
  const isOwner = () =>
    props.conversation.members.some(
      (member) =>
        member.user.id === currentUser()?.id && member.role === 'owner',
    )
  const remove = async (userId: string) => {
    await api.DELETE('/api/conversations/{conversationId}/members/{userId}', {
      params: {
        path: { conversationId: props.conversation.id, userId },
      },
    })
    props.onChanged?.()
  }
  return (
    <aside
      classList={{
        'group-members': true,
        'group-members--mobile': props.mobile,
      }}
      aria-label={t('workspace.members.title')}
    >
      <header>
        <strong>{t('workspace.members.title')}</strong>
        <span>{props.conversation.members.length}</span>
        {props.mobile && (
          <button
            onClick={() => props.onClose?.()}
            aria-label={t('workspace.actions.close')}
          >
            <X />
          </button>
        )}
      </header>
      <For each={props.conversation.members}>
        {(member) => (
          <div class="member-row">
            <button class="member-profile" onClick={() => setSelected(member)}>
              <span class="avatar">{member.user.displayName[0]}</span>
              <span>
                <strong>{member.user.displayName}</strong>
                <small>@{member.user.handle}</small>
              </span>
              <span class="member-role">
                {member.role === 'owner' && <Crown size={14} />}{' '}
                {t(`workspace.roles.${member.role}`)}
              </span>
            </button>
            {isOwner() && member.role !== 'owner' && (
              <button
                class="member-remove"
                aria-label={t('workspace.members.remove', {
                  name: member.user.displayName,
                })}
                onClick={() => void remove(member.user.id)}
              >
                <UserMinus size={15} />
              </button>
            )}
          </div>
        )}
      </For>
      {selected() && (
        <UserProfilePanel member={selected()!} onClose={() => setSelected()} />
      )}
    </aside>
  )
}

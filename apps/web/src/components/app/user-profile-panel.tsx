import { MessageCircle, ShieldBan, X } from 'lucide-solid'
import type { ConversationMember } from '@strafe/shared'
import { useTranslation } from 'solid-i18next'

export function UserProfilePanel(props: {
  member: ConversationMember
  onClose: () => void
  onMessage?: () => void
}) {
  const [t] = useTranslation()
  return (
    <div
      class="profile-panel"
      role="dialog"
      aria-modal="true"
      aria-label={t('workspace.profile.title')}
    >
      <button
        class="panel-close"
        onClick={() => props.onClose()}
        aria-label={t('workspace.actions.close')}
      >
        <X />
      </button>
      <div class="profile-avatar">{props.member.user.displayName[0]}</div>
      <h2>{props.member.user.displayName}</h2>
      <p>@{props.member.user.handle}</p>
      <dl>
        <div>
          <dt>{t('workspace.profile.role')}</dt>
          <dd>{t(`workspace.roles.${props.member.role}`)}</dd>
        </div>
      </dl>
      <div class="profile-actions">
        <button disabled={!props.onMessage} onClick={() => props.onMessage?.()}>
          <MessageCircle />
          {t('workspace.actions.message')}
        </button>
        <button disabled>
          <ShieldBan />
          {t('workspace.actions.block')}
        </button>
      </div>
    </div>
  )
}

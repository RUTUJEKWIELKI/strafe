import { fireEvent, render, screen } from '@solidjs/testing-library'
import { I18nextProvider } from 'solid-i18next'
import { describe, expect, it } from 'vitest'
import type { Conversation } from '@strafe/shared'

import { i18n } from '../../lib/i18n/i18n.js'
import { GroupMemberPanel } from './group-member-panel.js'
import { MessageComposer } from './message-composer.js'

const conversation: Conversation = {
  archivedAt: null,
  currentEncryptionEpoch: 1,
  flags: 0,
  id: '018f0f50-c0f2-7bd1-8000-000000000001',
  members: [
    {
      joinedAt: '2026-09-09T00:00:00.000Z',
      role: 'owner',
      user: {
        avatarUrl: null,
        displayName: 'Ada 🐢',
        handle: 'ada',
        id: '018f0f50-c0f2-7bd1-8000-000000000002',
      },
    },
  ],
  name: 'Private group',
  parentId: null,
  positionKey: '000000',
  serverId: null,
  slowmodeSeconds: 0,
  topic: null,
  type: 'group_dm',
}

describe('private chat controls', () => {
  it('renders real group members and opens their profile', async () => {
    render(() => (
      <I18nextProvider i18n={i18n}>
        <GroupMemberPanel conversation={conversation} />
      </I18nextProvider>
    ))
    expect(screen.getByText('Ada 🐢')).toBeTruthy()
    await fireEvent.click(screen.getByRole('button', { name: /Ada/ }))
    expect(screen.getByRole('dialog', { name: 'User profile' })).toBeTruthy()
  })

  it('keeps the composer disabled until E2EE is available', () => {
    render(() => (
      <I18nextProvider i18n={i18n}>
        <MessageComposer
          encryptionReady={false}
          onSend={async () => {}}
          onTyping={() => {}}
        />
      </I18nextProvider>
    ))
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).disabled).toBe(
      true,
    )
    expect(
      (screen.getByRole('button', { name: 'Send' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
  })
})

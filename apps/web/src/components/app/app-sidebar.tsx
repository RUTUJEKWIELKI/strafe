import { A, useLocation, useNavigate } from '@solidjs/router'
import { Bell, Home, LogOut, Settings, UserRound } from 'lucide-solid'
import { For } from 'solid-js'
import type { Conversation } from '@strafe/shared'

import { currentUser, logout } from '../../lib/auth/session.js'

export function AppSidebar(props: { conversations: Conversation[] }) {
  const location = useLocation()
  const navigate = useNavigate()
  const links = [
    { href: '/@me', icon: Home, label: 'Home' },
    { href: '/@me/friends', icon: UserRound, label: 'Friends' },
    { href: '/@me/notifications', icon: Bell, label: 'Notifications' },
  ]
  return (
    <aside class="app-sidebar" aria-label="Private navigation">
      <A class="app-brand" href="/@me">
        strafe
      </A>
      <nav>
        <For each={links}>
          {(item) => (
            <A
              classList={{ active: location.pathname === item.href }}
              href={item.href}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </A>
          )}
        </For>
      </nav>
      <div class="sidebar-section">
        <span>DIRECT MESSAGES</span>
        <For each={props.conversations.filter((item) => item.type === 'dm')}>
          {(conversation) => (
            <A href={`/@me/dm/${conversation.id}`}>
              {conversation.members.find(
                (member) => member.user.id !== currentUser()?.id,
              )?.user.displayName ?? 'Direct message'}
            </A>
          )}
        </For>
      </div>
      <div class="sidebar-section">
        <span>GROUPS</span>
        <For
          each={props.conversations.filter((item) => item.type === 'group_dm')}
        >
          {(conversation) => (
            <A href={`/@me/groups/${conversation.id}`}>{conversation.name}</A>
          )}
        </For>
      </div>
      <div class="sidebar-user">
        <div>
          <strong>{currentUser()?.displayName}</strong>
          <small>@{currentUser()?.handle}</small>
        </div>
        <A href="/@me/settings" aria-label="Settings">
          <Settings size={18} />
        </A>
        <button
          aria-label="Sign out"
          onClick={() => void logout().then(() => navigate('/'))}
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  )
}

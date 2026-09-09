import { Navigate } from '@solidjs/router'
import { Show } from 'solid-js'
import type { JSX } from 'solid-js'
import { currentUser } from '../lib/auth/session.js'
import { AppSidebar } from '../components/app/app-sidebar.js'
import {
  ConversationProvider,
  useConversations,
} from '../lib/conversations/context.js'

function Workspace(props: { children?: JSX.Element }) {
  const conversations = useConversations()
  return (
    <div class="private-app">
      <AppSidebar conversations={conversations.conversations()} />
      <main class="private-main">
        <Show
          when={!conversations.loading()}
          fallback={<div class="app-loading">Loading…</div>}
        >
          {props.children}
        </Show>
      </main>
    </div>
  )
}

export function MeLayout(props: { children?: JSX.Element }) {
  return (
    <Show when={currentUser()} fallback={<Navigate href="/login" />}>
      <ConversationProvider>
        <Workspace>{props.children}</Workspace>
      </ConversationProvider>
    </Show>
  )
}

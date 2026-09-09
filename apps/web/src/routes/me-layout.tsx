import { Navigate } from '@solidjs/router'
import { createResource, Show } from 'solid-js'
import type { JSX } from 'solid-js'
import type { Conversation } from '@strafe/shared'
import { api } from '../lib/api/client.js'
import { currentUser } from '../lib/auth/session.js'
import { AppSidebar } from '../components/app/app-sidebar.js'

async function loadConversations(): Promise<Conversation[]> {
  const result = await api.GET('/api/users/@me/conversations')
  if (!result.data) throw new Error('Unable to load conversations')
  return result.data.conversations
}

export function MeLayout(props: { children?: JSX.Element }) {
  const [conversations] = createResource(loadConversations)
  return <Show when={currentUser()} fallback={<Navigate href="/login" />}>
    <div class="private-app">
      <AppSidebar conversations={conversations() ?? []} />
      <main class="private-main">
        <Show
          when={!conversations.loading}
          fallback={<div class="app-loading">Loading your conversations…</div>}
        >
          {props.children}
        </Show>
      </main>
    </div>
  </Show>
}

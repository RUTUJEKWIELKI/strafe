import {
  createContext,
  createResource,
  useContext,
  type Accessor,
  type JSX,
} from 'solid-js'
import type { Conversation } from '@strafe/shared'
import { api } from '../api/client.js'

interface ConversationContextValue {
  conversations: Accessor<Conversation[]>
  loading: Accessor<boolean>
  refetch: () => void
}

const ConversationContext = createContext<ConversationContextValue>()

async function loadConversations() {
  const result = await api.GET('/api/users/@me/conversations')
  if (!result.data) throw new Error('Unable to load conversations')
  return result.data.conversations
}

export function ConversationProvider(props: { children?: JSX.Element }) {
  const [conversations, { refetch }] = createResource(loadConversations)
  return (
    <ConversationContext.Provider
      value={{
        conversations: () => conversations() ?? [],
        loading: () => conversations.loading,
        refetch: () => void refetch(),
      }}
    >
      {props.children}
    </ConversationContext.Provider>
  )
}

export function useConversations() {
  const value = useContext(ConversationContext)
  if (!value) throw new Error('ConversationProvider is missing')
  return value
}

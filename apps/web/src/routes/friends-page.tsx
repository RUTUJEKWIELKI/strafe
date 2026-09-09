import { createResource, For, Show } from 'solid-js'
import { useLocation } from '@solidjs/router'
import { api } from '../lib/api/client.js'
import { currentUser } from '../lib/auth/session.js'

async function loadRelationships() {
  const result = await api.GET('/api/users/@me/relationships')
  if (!result.data) throw result
  return result.data.relationships
}
async function loadBlocks() {
  const result = await api.GET('/api/users/@me/blocks')
  if (!result.data) throw result
  return Promise.all(
    result.data.blocks.map(async (block) => {
      const profile = await api.GET('/api/users/{userId}', {
        params: { path: { userId: block.blockedId } },
      })
      if (!profile.data) throw profile
      return { ...block, user: profile.data }
    }),
  )
}

export function FriendsPage() {
  const location = useLocation()
  const blocked = () => location.pathname.endsWith('/blocked')
  const pending = () => location.pathname.endsWith('/pending')
  const [relationships, { refetch }] = createResource(loadRelationships)
  const [blocks, { refetch: refetchBlocks }] = createResource(loadBlocks)
  const shown = () =>
    (relationships() ?? []).filter((relationship) =>
      pending()
        ? relationship.status === 'pending'
        : relationship.status === 'accepted',
    )
  return (
    <section class="friends-view">
      <header>
        <h1>Friends</h1>
        <nav>
          <a href="/@me/friends">All</a>
          <a href="/@me/friends/pending">Pending</a>
          <a href="/@me/friends/blocked">Blocked</a>
        </nav>
      </header>
      <Show
        when={!blocked()}
        fallback={
          <div class="user-list">
            <For
              each={blocks()}
              fallback={<p class="empty-copy">No blocked users.</p>}
            >
              {(block) => (
                <article>
                  <div class="avatar">{block.user.displayName[0]}</div>
                  <div>
                    <strong>{block.user.displayName}</strong>
                    <span>@{block.user.handle}</span>
                  </div>
                  <button
                    onClick={() =>
                      void api
                        .DELETE('/api/users/@me/blocks/{userId}', {
                          params: { path: { userId: block.user.id } },
                        })
                        .then(() => refetchBlocks())
                    }
                  >
                    Unblock
                  </button>
                </article>
              )}
            </For>
          </div>
        }
      >
        <div class="user-list">
          <For
            each={shown()}
            fallback={<p class="empty-copy">Nothing here yet.</p>}
          >
            {(relationship) => (
              <article>
                <div class="avatar">{relationship.user.displayName[0]}</div>
                <div>
                  <strong>{relationship.user.displayName}</strong>
                  <span>@{relationship.user.handle}</span>
                </div>
                <Show
                  when={
                    relationship.status === 'pending' &&
                    relationship.addresseeId === currentUser()?.id
                  }
                >
                  <button
                    onClick={() =>
                      void api
                        .PUT('/api/users/@me/relationships/{id}/accept', {
                          params: { path: { id: relationship.user.id } },
                        })
                        .then(() => refetch())
                    }
                  >
                    Accept
                  </button>
                </Show>
                <button
                  class="quiet"
                  onClick={() =>
                    void api
                      .PUT('/api/users/@me/blocks/{userId}', {
                        params: { path: { userId: relationship.user.id } },
                        body: {},
                      })
                      .then(() => {
                        refetch()
                        refetchBlocks()
                      })
                  }
                >
                  Block
                </button>
              </article>
            )}
          </For>
        </div>
      </Show>
    </section>
  )
}

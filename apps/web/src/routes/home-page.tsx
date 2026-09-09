import { Bell, LockKeyhole, MessageCircle, UsersRound } from 'lucide-solid'
export function HomePage() {
  return (
    <div class="home-view">
      <header>
        <span class="kicker">YOUR SPACE</span>
        <h1>Good to see you.</h1>
        <p>
          Pick up a private conversation or check what changed while you were
          away.
        </p>
      </header>
      <section class="home-grid">
        <a href="/@me/friends">
          <UsersRound />
          <strong>Friends</strong>
          <span>Requests, connections and blocked users</span>
        </a>
        <a href="/@me/notifications">
          <Bell />
          <strong>Notifications</strong>
          <span>Updates that need your attention</span>
        </a>
      </section>
      <section class="home-empty">
        <MessageCircle />
        <h2>Your conversations live here</h2>
        <p>
          Choose a direct message from the sidebar or start one from Friends.
        </p>
      </section>
      <footer>
        <LockKeyhole size={16} /> Message contents are end-to-end encrypted on
        your device.
      </footer>
    </div>
  )
}

import { KeyRound } from 'lucide-solid'

export function EncryptionNotice() {
  return (
    <aside class="encryption-notice">
      <KeyRound size={17} />
      <div>
        <strong>Encryption setup required</strong>
        <p>
          Messages are accepted only as client-encrypted envelopes. Add this
          device’s keys before sending.
        </p>
      </div>
      <a href="/@me/settings">View devices</a>
    </aside>
  )
}

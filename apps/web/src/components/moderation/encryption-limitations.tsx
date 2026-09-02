interface EncryptionLimitationsProps {
  encrypted: boolean
}

export function EncryptionLimitations(props: EncryptionLimitationsProps) {
  return (
    <aside
      aria-live="polite"
      class="rounded-lg border border-amber-400/40 bg-amber-950/30 p-4 text-amber-100"
    >
      <h2 class="font-semibold">
        Ograniczenia moderacji szyfrowanej przestrzeni
      </h2>
      {props.encrypted ? (
        <div class="mt-2 space-y-2 text-sm">
          <p>
            Serwer nie ma dostępu do treści. Reguły słów kluczowych, linków i
            zawartości nie są tutaj uruchamiane.
          </p>
          <p>
            Dostępne są reguły metadanych (np. tempo wiadomości i wykrywanie
            rajdów). Moderator zobaczy treść tylko wtedy, gdy zgłaszający
            świadomie dołączy wybraną wiadomość i kontekst.
          </p>
        </div>
      ) : (
        <p class="mt-2 text-sm">
          Ta przestrzeń umożliwia moderację treści po stronie serwera.
        </p>
      )}
    </aside>
  )
}

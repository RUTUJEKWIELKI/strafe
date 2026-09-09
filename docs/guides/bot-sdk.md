# Klient TypeScript dla botów

Pakiet `@strafe/bot-sdk` jest typowany bezpośrednio z dedykowanej specyfikacji OpenAPI botów. W repozytorium Strafe dodaj go do konkretnego workspace bota:

```bash
pnpm --filter @twoj-scope/release-bot add @strafe/bot-sdk@workspace:*
```

Pakiet nie szyfruje treści za aplikację. Transportuje kontrakty REST i obsługuje protokół Realtime Gateway. Zarządzanie kluczami E2EE pozostaje odpowiedzialnością procesu bota.

## Konfiguracja

Sekret podawaj wyłącznie przez środowisko uruchomieniowe:

```bash
export STRAFE_BOT_TOKEN='strafe_bot_…'
export STRAFE_API_URL='https://strafe.app'
```

```ts
import { StrafeBot } from '@strafe/bot-sdk'

const token = process.env.STRAFE_BOT_TOKEN
if (!token) throw new Error('STRAFE_BOT_TOKEN is required')

const bot = new StrafeBot({
  baseUrl: process.env.STRAFE_API_URL,
  token,
})
```

Konstruktor odrzuca niepoprawny format tokenu przed wykonaniem połączenia. `baseUrl` nie powinien zawierać `/api`; SDK dodaje ścieżki zgodne z OpenAPI.

## REST: tożsamość, serwery i kanały

```ts
const me = await bot.getMe()
const servers = await bot.listServers()

for (const server of servers) {
  const channels = await bot.listChannels(server.id)
  console.info(`${server.name}: ${channels.length} channels`)
}
```

Dostępne metody wysokiego poziomu:

| Metoda                            | Wymagany scope         |
| --------------------------------- | ---------------------- |
| `getMe()`                         | brak dodatkowego scope |
| `listServers()`, `getServer(id)`  | `servers:read`         |
| `listChannels(serverId)`          | `channels:read`        |
| `getMessages(channelId, options)` | `messages:read`        |
| `sendMessage(channelId, body)`    | `messages:write`       |
| `updateMessage(messageId, body)`  | `messages:write`       |
| `deleteMessage(messageId)`        | `messages:write`       |

Surowy, w pełni typowany klient OpenAPI jest dostępny jako `bot.api`, gdy potrzebna operacja nie ma jeszcze wygodnej metody SDK.

## Paginacja historii

Historia używa kursora `before`, a nie numerów stron:

```ts
let before: string | undefined

do {
  const page = await bot.getMessages(channelId, { before, limit: 100 })
  for (const message of page.messages) {
    await processMessage(message)
  }
  before = page.nextCursor ?? undefined
} while (before)
```

Nie zapisuj odszyfrowanej historii w logach. Jeśli bot utrzymuje lokalny indeks, zaszyfruj go kluczem przechowywanym poza bazą aplikacji.

## Wysyłanie wiadomości

`sendMessage` przyjmuje dokładny kontrakt wygenerowany z API. Strafe wymaga stabilnego `clientNonce` i koperty zgodnej z bieżącym protokołem wiadomości:

```ts
const created = await bot.sendMessage(channelId, {
  clientNonce: crypto.randomUUID(),
  envelope: encryptedEnvelope,
})
```

`encryptedEnvelope` musi powstać z aktualnego klucza konwersacji i epoki. Nie używaj stałego nonce kryptograficznego i nie wysyłaj plaintextu w polu `ciphertext`. Metoda `sendRawMessage` pozostaje aliasem kompatybilności i jest oznaczona jako deprecated.

## Ustandaryzowane błędy

```ts
import { StrafeApiError } from '@strafe/bot-sdk'

try {
  await bot.sendMessage(channelId, body)
} catch (error) {
  if (!(error instanceof StrafeApiError)) throw error

  console.error({
    code: error.code,
    requestId: error.requestId,
    status: error.status,
  })

  if (error.status === 429 && error.retryAfter) {
    await wait(error.retryAfter * 1000 + Math.random() * 250)
  }
}
```

`StrafeApiError` zachowuje status HTTP, kod domenowy, `requestId` do diagnostyki i liczbę sekund `retryAfter`. Nie loguj całego requestu ani nagłówka Authorization.

## Realtime Gateway

Połączenie rozwiązuje promise dopiero po ramce `ready`. SDK odpowiada na `hello`, identyfikuje token, utrzymuje heartbeat oraz obsługuje timeout i `AbortSignal`.

```ts
const controller = new AbortController()

bot.on('ready', ({ userId }) => {
  console.info(`Gateway ready for ${userId}`)
})

bot.on('message.created', async (event) => {
  await handleEncryptedMessage(event.data)
})

bot.on('gatewayError', (error) => {
  console.error('Gateway rejected a command', error.code)
})

bot.on('resyncRequired', async () => {
  await rebuildStateFromRest()
})

bot.on('disconnect', ({ code }) => {
  console.warn(`Gateway disconnected with ${code}`)
})

await bot.connect({
  lastStreamId: await loadLastStreamId(),
  signal: controller.signal,
  timeoutMs: 15_000,
})
```

Po odebraniu zdarzenia zapisz `streamId` dopiero po trwałym przetworzeniu. Przy ponownym połączeniu przekaż go jako `lastStreamId`. Jeśli serwer wyśle `resync_required`, odtwórz stan przez REST zamiast zakładać, że wszystkie zdarzenia są nadal dostępne.

### Subskrypcje i obecność

```ts
bot.subscribe(channelId)
bot.startTyping(channelId)
bot.setPresence('online')

// Gdy kanał nie jest już potrzebny:
bot.unsubscribe(channelId)
```

Komendy wymagają gotowego połączenia i rzucą błąd, jeśli Gateway nie jest połączony. Nie wysyłaj `startTyping` w pętli — serwer dodatkowo ogranicza częstotliwość tych zdarzeń.

## Poprawne zamykanie procesu

```ts
async function shutdown(signal: string) {
  console.info(`Received ${signal}; closing Gateway`)
  bot.disconnect(1000, 'Process shutdown')
  await flushPendingWork()
  process.exitCode = 0
}

process.once('SIGINT', () => void shutdown('SIGINT'))
process.once('SIGTERM', () => void shutdown('SIGTERM'))
```

## Checklista produkcyjna

- trzymaj token w menedżerze sekretów i rotuj go cyklicznie;
- nadaj tylko wymagane scopes i minimalną rolę serwerową;
- ustaw obsługę `gatewayError`, `disconnect` i `resyncRequired`;
- zapisuj ostatni przetworzony `streamId`;
- respektuj `Retry-After` i dodawaj jitter;
- monitoruj `401`, `403`, `429` oraz wzrost reconnectów;
- nie loguj tokenów, plaintextu wiadomości ani materiału kluczowego E2EE;
- aktualizuj SDK razem ze zmianami dedykowanej specyfikacji botów.

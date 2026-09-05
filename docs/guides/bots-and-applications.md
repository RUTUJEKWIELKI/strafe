# Tworzenie Botów i Aplikacji w Strafe

Strafe oferuje potężne API i oficjalne wsparcie dla botów, umożliwiając deweloperom automatyzację, budowę integracji i rozszerzanie funkcjonalności kanałów. Ponieważ architektura Strafe opiera się na szyfrowaniu End-to-End (E2EE), boty w naszym systemie są traktowane jako pełnoprawni obywatele (first-class citizens) z własnymi kluczami tożsamości.

## Wstęp i Architektura

W przeciwieństwie do tradycyjnych komunikatorów, bot w Strafe to nie tylko "skrypt uderzający po API".
Boty posiadają własne ID użytkownika (`botUserId`) oraz korzystają z tych samych węzłów Realtime Gateway. Kiedy dodajesz bota do serwera, inni członkowie wymieniają z nim klucze kryptograficzne, aby bot mógł odszyfrować wiadomości.

### Główne różnice między botem a zwykłym użytkownikiem:

1. **Brak logowania hasłem:** Boty nie posiadają loginu i hasła. Uwierzytelniają się wyłącznie przez kryptograficznie bezpieczne tokeny dostępowe (np. `strafe_bot_XYZ...`).
2. **Uprawnienia i Scopes:** Każdy token bota posiada zdefiniowane `scopes` (zakresy dostępu, np. `messages:read`, `messages:write`). Bot nie przeczyta wiadomości, jeśli właściciel nie nadał mu na to odpowiedniego uprawnienia przy generowaniu tokenu.
3. **Limitowanie ruchu (Rate Limiting):** API Strafe posiada dedykowane koszyki limitów zapobiegania nadużyciom (Abuse Prevention) skonfigurowane specjalnie pod boty, aby umożliwić im płynną, automatyczną pracę (np. szybkie wysyłanie kilkudziesięciu powiadomień).

---

## Zarządzanie aplikacjami (Bot Management API)

Aby stworzyć bota, musisz zarejestrować aplikację. Twój zwykły użytkownik będzie jej właścicielem (`ownerId`).

### Tworzenie nowej aplikacji Bota

```http
POST /api/bots
Authorization: Bearer <twój_token_użytkownika>
Content-Type: application/json

{
  "name": "Mój Pierwszy Bot",
  "handle": "my_first_bot",
  "description": "Ten bot wita nowych użytkowników.",
  "scopes": ["messages:read", "messages:write"]
}
```

Odpowiedź zawiera identyfikator bota oraz jego początkowy token (np. `strafe_bot_...`), który należy skopiować, gdyż jest ukazywany **tylko raz**.

### Zarządzanie (Z poziomu właściciela)

Możesz listować wszystkie swoje boty wywołując `GET /api/bots`, obracać tokenem (generować nowy, niszcząc stary) przy pomocy `POST /api/bots/:botId/token`, lub całkowicie zawiesić boty i cofnąć im uprawnienia przez `DELETE /api/bots/:botId/token`.

Dzięki tej architekturze, jeśli token bota wycieknie (np. wrzucisz go przez pomyłkę do publicznego repozytorium), możesz natychmiast go unieważnić w API.

---

## Instalacja na serwerze

Aby bot mógł cokolwiek zrobić na serwerze, musisz go zainstalować (właściciel bota i właściciel serwera muszą mieć odpowiednie prawa).

```http
POST /api/servers/:serverId/bots/:botId
Authorization: Bearer <twój_token_użytkownika>
```

Po tej operacji, serwer wymusi proces E2EE Key Exchange na podłączonych użytkownikach – zaczną oni automatycznie szyfrować nowe wiadomości również dla kluczy publicznych Twojego bota.

---

## Oficjalne SDK dla TypeScript: `@strafe/bot-sdk`

Dla twórców aplikacji, przygotowaliśmy wbudowany pakiet `@strafe/bot-sdk`. Jest to lekki i silnie typowany klient komunikujący się z API, zapewniający autouzupełnianie w oparciu o naszą specyfikację OpenAPI.

### Instalacja i szybki start

Pakiet ten można zainstalować bezpośrednio z pnpm. Skonstruowanie klienta ogranicza się do przekazania mu wygenerowanego tokenu bota:

```typescript
import { StrafeBot } from '@strafe/bot-sdk'

// Inicjalizacja SDK
const bot = new StrafeBot({
  token: process.env.STRAFE_BOT_TOKEN!, // np. strafe_bot_8a2f...
  baseUrl: 'https://api.strafe.app',
})

// Przykładowe wywołanie - sprawdzenie tożsamości bota
async function start() {
  const me = await bot.getMe()
  console.log(`Zalogowano jako bot: ${me.displayName} (${me.handle})`)
}

start()
```

### Wysyłanie i Odczytywanie Wiadomości (E2EE)

Ze względu na to, że Strafe jest aplikacją End-to-End Encrypted, bot przed wysłaniem wiadomości na kanał musi utworzyć cyfrową "kopertę" (Envelope) zaszyfrowaną wynegocjowanym z uczestnikami kluczem sesyjnym.

Dlatego w SDK nie wysyłamy płaskiego tekstu. Deweloper budujący bota musi najpierw przetworzyć wiadomość algorytmem AES-256-GCM. SDK akceptuje przygotowaną, bezpieczną kopertę:

```typescript
// Uwaga: Zakładamy, że bot przechowuje swoje klucze tożsamości oraz klucze grupowe z serwera.

import { createCipheriv, randomBytes } from 'node:crypto'
import { randomUUID } from 'node:crypto'

async function sendEncrypted(
  channelId: string,
  plainText: string,
  groupKey: Buffer,
) {
  // 1. Wygenerowanie wektora inicjującego (IV) i przygotowanie wiadomości
  const nonce = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', groupKey, nonce)

  // 2. Szyfrowanie
  let ciphertext = cipher.update(plainText, 'utf8', 'base64')
  ciphertext += cipher.final('base64')
  const authTag = cipher.getAuthTag()

  // 3. Wysłanie zaszyfrowanej koperty przez Bot SDK
  await bot.sendRawMessage(channelId, {
    clientNonce: randomUUID(),
    envelope: {
      protocolVersion: 1,
      contentType: 'text/plain',
      nonce: nonce.toString('base64'),
      ciphertext: ciphertext,
      authenticationTag: authTag.toString('base64'),
      senderDeviceId: 'bot-device-id',
      epoch: 0,
    },
  })
}
```

### Dokumentacja API i Scalar

Wszystkie dostępne metody, struktury danych REST i parametry uwierzytelniania dla botów znajdują się na naszej oficjalnej zakładce **[Interactive API Reference](/api/reference)**.
Korzystamy z silnika **Scalar**, aby umożliwić deweloperom swobodne, wbudowane zapytania HTTP bezpośrednio z przeglądarki. Wystarczy podać `Bearer strafe_bot_XYZ` w prawym górnym rogu podstrony dokumentacji API!

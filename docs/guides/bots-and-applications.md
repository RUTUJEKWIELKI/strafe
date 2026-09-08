# Boty i aplikacje

Bot w Strafe ma własną tożsamość użytkownika, członkostwa na serwerach i jawnie ograniczony token. Token bota nie jest tokenem właściciela i nie może korzystać z endpointów, które nie zostały oznaczone jako dostępne dla botów.

> [!IMPORTANT]
> Token `strafe_bot_…` jest wyświetlany tylko podczas utworzenia lub rotacji. API przechowuje wyłącznie jego skrót. Traktuj token jak hasło i nigdy nie umieszczaj go w kodzie, logach ani obrazie kontenera.

## Model bezpieczeństwa

Dostęp bota jest przecięciem trzech niezależnych warstw:

1. **Scope tokenu** określa klasę operacji, np. `messages:read`.
2. **Członkostwo bota** określa serwery i kanały widoczne dla tożsamości.
3. **Role i nadpisania kanału** obowiązują bota tak samo jak pozostałych członków.

Posiadanie scope `messages:write` nie daje automatycznie prawa wysyłania do każdego kanału. Endpoint musi również obsługiwać boty, a rola bota musi zawierać odpowiednie uprawnienie.

### Dostępne scopes

| Scope                              | Zastosowanie                                    |
| ---------------------------------- | ----------------------------------------------- |
| `servers:read` / `servers:write`   | Odczyt serwerów i zarządzanie ich ustawieniami  |
| `channels:read` / `channels:write` | Odczyt i zarządzanie kanałami                   |
| `messages:read` / `messages:write` | Historia, wysyłanie, edycja, usuwanie i reakcje |
| `members:read` / `members:write`   | Członkowie i działania moderacyjne              |
| `roles:read` / `roles:write`       | Role oraz przypisania                           |
| `users:read` / `users:write`       | Profile widoczne dla bota                       |

Wybieraj najmniejszy możliwy zestaw. Utworzenie i rotacja tokenu akceptują od 1 do 10 unikalnych scopes.

## Utworzenie aplikacji

Endpointy zarządzania aplikacjami wymagają zwykłego tokenu użytkownika. Bot nie może tworzyć ani rotować własnych credentials.

```bash
curl --fail-with-body \
  --request POST \
  --url "$STRAFE_API_URL/api/bots" \
  --header "Authorization: Bearer $STRAFE_USER_TOKEN" \
  --header 'Content-Type: application/json' \
  --data '{
    "name": "Release Assistant",
    "handle": "release_assistant",
    "description": "Publikuje informacje o wdrożeniach.",
    "scopes": ["servers:read", "channels:read", "messages:write"]
  }'
```

Odpowiedź `201` zawiera obiekt `bot` i jednorazowy `token`. Nickname jest normalizowany bez rozróżniania wielkości liter, a jego unikalność wymusza baza danych.

```json
{
  "bot": {
    "botUserId": "019…",
    "createdAt": "2026-09-08T07:00:00.000Z",
    "description": "Publikuje informacje o wdrożeniach.",
    "id": "019…",
    "isPublic": false,
    "name": "Release Assistant"
  },
  "token": "strafe_bot_…",
  "tokenExpiresAt": "2026-10-08T07:00:00.000Z"
}
```

Zapisz identyfikator aplikacji oddzielnie od sekretu. Lista `GET /api/bots` celowo nie zwraca tokenów.

## Instalacja na serwerze

Instalujący musi mieć `ManageServer`. Prywatną aplikację może zainstalować tylko jej właściciel; publiczną aplikację może zainstalować uprawniony administrator innego serwera.

```bash
curl --fail-with-body \
  --request POST \
  --url "$STRAFE_API_URL/api/servers/$SERVER_ID/bots/$BOT_ID" \
  --header "Authorization: Bearer $STRAFE_USER_TOKEN"
```

Operacja jest idempotentna. `installed: false` oznacza, że aktywne członkostwo już istniało. Po instalacji przypisz botowi rolę odpowiednią do jego zadania.

## Rotacja i unieważnienie

Rotacja atomowo unieważnia wszystkie aktywne tokeny aplikacji i wydaje nowy wraz z polem `expiresAt`. Tokeny są obecnie ważne przez 30 dni:

```bash
curl --fail-with-body \
  --request POST \
  --url "$STRAFE_API_URL/api/bots/$BOT_ID/token" \
  --header "Authorization: Bearer $STRAFE_USER_TOKEN" \
  --header 'Content-Type: application/json' \
  --data '{"scopes":["servers:read","channels:read","messages:write"]}'
```

Po rotacji stare procesy zaczną otrzymywać `401`. Wdróż nowy sekret, zrestartuj instancje, a dopiero później usuń poprzednią wersję sekretu z menedżera secrets. Awaryjne `DELETE /api/bots/:botId/token` natychmiast unieważnia wszystkie aktywne credentials.

## Limity i błędy

API zwraca ujednoliconą strukturę błędu z `code`, bezpiecznym `message` i `requestId`. Odpowiedź `429` zawiera `Retry-After`; klient powinien odczekać wskazaną liczbę sekund i zastosować jitter. Nie ponawiaj automatycznie `400`, `401` ani `403`.

Wysyłanie wiadomości jest ograniczone do 30 żądań na 10 sekund. Używaj unikalnego `clientNonce`, dzięki czemu bezpieczne ponowienie żądania nie utworzy duplikatu.

## Następny krok

Przejdź do przewodnika [Klient TypeScript dla botów](./bot-sdk), aby skonfigurować REST, Gateway, obsługę błędów i bezpieczne zamykanie procesu. Operacje dostępne dla botów można też sprawdzić w [interaktywnym API](/api/reference) oraz w dedykowanej specyfikacji `apps/api/openapi/bot-openapi.json`.

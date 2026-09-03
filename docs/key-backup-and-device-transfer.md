# Backup kluczy i transfer urządzenia

Ten dokument jest normatywnym opisem protokołu. Materiał kluczowy powstaje,
jest szyfrowany i odszyfrowywany wyłącznie na urządzeniach użytkownika. Serwer
nie otrzymuje kodu odzyskiwania, klucza wyprowadzonego przez KDF, tekstu jawnego
backupu ani kluczy używanych do transferu urządzeń.

## Format backupu

Klient generuje lokalnie 256 bitów losowości jako kod odzyskiwania i pokazuje
go dokładnie raz. Interfejs musi wyświetlić ostrzeżenie:

> Zapisz kod odzyskiwania poza tym urządzeniem. Strafe go nie zna i nie może go
> odtworzyć. Utrata kodu oraz wszystkich zatwierdzonych urządzeń może oznaczać
> bezpowrotną utratę historii.

Kod nie jest hasłem konta i nigdy nie trafia do telemetrii, logów, schowka bez
jawnej czynności użytkownika ani do API. Klient wyprowadza 256-bitowy klucz za
pomocą Argon2id (co najmniej 64 MiB, trzy iteracje, równoległość 1 i nowa
128-bitowa sól dla każdego backupu), a następnie szyfruje kanoniczny pakiet
kluczy AES-256-GCM z nowym 96-bitowym nonce. Wszystkie pola metadanych są AAD,
więc zmiana wersji, łańcucha, urządzenia lub odcisku klucza tożsamości powoduje
błąd uwierzytelnienia.

API przechowuje wyłącznie wersjonowaną kopertę: szyfrogram z tagiem AEAD, nonce,
parametry i sól KDF, numer wersji, skrót poprzedniej koperty, odcisk klucza
tożsamości, identyfikator urządzenia oraz czas utworzenia. Serwer nie może z
tych danych odtworzyć kluczy. `PUT /api/users/@me/key-backup` jest operacją
compare-and-swap: `version` musi być równe `expectedPreviousVersion + 1`.
Historia jest tylko dopisywana, a konflikt zwraca `KEY_BACKUP_ROLLBACK`.

Po poprawnym odczycie klient zapisuje w chronionym magazynie lokalnym parę
`(version, SHA-256(całej koperty))`. Wersja niższa niż zapamiętana albo inny
skrót dla tej samej wersji blokuje automatyczne odtworzenie. Łańcuch
`previousDigest` jest sprawdzany podczas każdej aktualizacji. Lokalnego pinu
nie wolno nadpisywać odpowiedzią serwera przed zakończeniem tych kontroli.

## Transfer na nowe urządzenie

Aktywna sesja i dostęp do poczty pozwalają jedynie zalogować konto — **nie są
dowodem posiadania kluczy**. Transfer wymaga poniższego kanału uwierzytelnionego:

1. Nowe urządzenie tworzy jednorazową parę ECDH, 256-bitowy nonce i żądanie z
   krótkim czasem ważności. Kod QR zawiera identyfikator żądania, klucz publiczny
   i nonce; nie zawiera materiału kluczowego.
2. Istniejące, nieusunięte urządzenie skanuje QR, pobiera żądanie i pokazuje
   nazwę nowego urządzenia oraz krótki kod SAS wyprowadzony z obu kluczy
   publicznych i nonce. Użytkownik jawnie wybiera „Zatwierdź”.
3. Istniejące urządzenie podpisuje transkrypt swoim kluczem tożsamości
   urządzenia. Z ECDH i transkryptu obie strony wyprowadzają klucz kanału przez
   HKDF-SHA-256. Pakiet kluczy jest szyfrowany AEAD, z całym transkryptem jako
   AAD, i może być przekazany przez serwer jako nieprzezroczysty, jednorazowy
   komunikat.
4. Nowe urządzenie sprawdza podpis względem znanego, zatwierdzonego klucza
   urządzenia, zgodność SAS, czas ważności i jednorazowość przed odszyfrowaniem.
   Potwierdza odbiór podpisem nowego klucza. Dopiero wtedy istniejące urządzenie
   oznacza je jako zatwierdzone i tworzy kolejną wersję backupu.

Żądanie wygasa po pięciu minutach, jest konsumowane tylko raz i jest odrzucane
po wylogowaniu urządzenia inicjującego. Alternatywny kanał jest dopuszczalny
tylko, jeśli daje te same własności: świeży ECDH, porównanie SAS lub fizyczne
skanowanie, podpis z istniejącego klucza i jawne potwierdzenie użytkownika.
Sam e-mail, hasło, token resetu lub aktywna sesja nigdy nie spełniają warunku.

## Zdarzenia bezpieczeństwa

### Reset hasła

Reset hasła unieważnia sesje, ale nie zmienia kodu odzyskiwania, kluczy E2EE ani
backupu. Po zalogowaniu użytkownik musi podać kod odzyskiwania albo przeprowadzić
transfer z istniejącego urządzenia. API nie wydaje kluczy na podstawie resetu.
Jeśli żadna z tych dróg nie jest dostępna, konto może zacząć nową historię po
jawnym zaakceptowaniu nieodwracalnej utraty starej.

### Usunięcie urządzenia

Usunięcie natychmiast unieważnia sesje urządzenia, oczekujące transfery i jego
status zaufania. Pozostałe urządzenie rotuje klucze sesyjne/grupowe, usuwa
opakowania przeznaczone dla usuniętego urządzenia i publikuje nową wersję
backupu. Stare zaszyfrowane wiadomości, które urządzenie już poznało, nie stają
się ponownie tajne. Odtworzenie z wersji utworzonej przez usunięte urządzenie
wymaga ostrzeżenia i potwierdzenia zaufanego urządzenia.

### Zmiana klucza tożsamości

Planowana rotacja jest podpisana jednocześnie starym i nowym kluczem, zwiększa
epokę tożsamości, ponownie opakowuje klucze oraz publikuje kolejny backup z
nowym odciskiem. Niespodziewana zmiana bez podpisu starego klucza blokuje
wysyłanie i odtwarzanie, wyświetla alarm oraz wymaga porównania SAS z istniejącym
urządzeniem lub użycia kodu odzyskiwania. Nigdy nie akceptuje się jej wyłącznie
na podstawie sesji.

### Wykrycie rollbacku

Klient przerywa odszyfrowanie i nie aktualizuje lokalnego pinu. Pokazuje wersję
oczekiwaną i otrzymaną, pobiera ponownie przez niezależne połączenie i prosi
istniejące urządzenie o porównanie ostatniego skrótu. Nie wolno automatycznie
publikować na bazie cofniętej koperty. Jeśli rollback potwierdzono, urządzenie
rotuje zagrożone klucze, publikuje wersję wyższą od najwyższej znanej i zapisuje
zdarzenie bezpieczeństwa. Brak drugiego urządzenia wymaga kodu odzyskiwania i
jawnej decyzji użytkownika; niepewnej historii nie scala się automatycznie.

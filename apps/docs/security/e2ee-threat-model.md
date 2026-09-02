# Model zagrożeń szyfrowania end-to-end

> **Status:** dokument projektowy, wersja 0.1 (2 września 2026). E2EE nie jest
> jeszcze funkcją produkcyjną. Opis nie stanowi obietnicy bezpieczeństwa obecnej
> wersji Strafe.

## Cel i granice

E2EE ma sprawić, że treść wiadomości jest dostępna wyłącznie na urządzeniach
uczestników. TLS nadal chroni transport, ale serwer Strafe nie jest odbiorcą
zaufanym dla treści. Nie projektujemy własnego protokołu kryptograficznego:

- kanały grupowe mają używać **Messaging Layer Security (MLS), RFC 9420**;
- rozmowy bezpośrednie mają używać sprawdzonego stosu **X3DH + Double Ratchet**;
- implementacja może zostać wybrana dopiero po testach interoperacyjności,
  przeglądzie historii audytów i niezależnym audycie integracji Strafe.

Model obejmuje wiadomości tekstowe, edycje, reakcje, nazwy i zawartość
załączników oraz klucze do nich. Nie obejmuje głosu i wideo na żywo, botów,
wyszukiwania po stronie serwera ani powiadomień zawierających podgląd treści.
Takie funkcje muszą być wyłączone dla zaszyfrowanego kanału albo otrzymać
oddzielny model zagrożeń.

## Aktywa i widoczne metadane

### Dane chronione kryptograficznie

- treść, formatowanie, edycje, usunięcia, reakcje i odpowiedzi;
- nazwa pliku, typ deklarowany przez klienta, podpis i miniatura załącznika;
- losowy klucz pliku i skrót plaintextu; serwer przechowuje wyłącznie szyfrogram;
- stan protokołu: sekrety epoki MLS, klucze łańcuchów Double Ratchet, prywatne
  klucze tożsamości urządzenia, jednorazowe prekeys i usunięte klucze wiadomości;
- opcjonalne, zaszyfrowane lokalnie nazwy kanałów i tematów. W pierwszej wersji
  nazwa kanału pozostaje metadaną serwera, aby routing i uprawnienia działały.

### Metadane pozostające po stronie serwera

Serwer musi routować dane i egzekwować członkostwo, dlatego zna co najmniej:

- identyfikatory kont, urządzeń, społeczności, kanałów i bieżący skład grupy;
- role/uprawnienia, zaproszenia, blokady oraz momenty zmian członkostwa;
- nadawcę urządzeniowego, odbiorców/kanał, typ i wersję pakietu protokołu;
- czas przyjęcia, kolejność, rozmiar szyfrogramu, liczbę i rozmiary załączników;
- adres IP, dane sesji, user-agent, token push, wzorce obecności i dostarczenia;
- publiczne klucze tożsamości urządzeń, pakiety MLS KeyPackage, podpisane prekeys
  X3DH i pulę publicznych jednorazowych prekeys;
- szyfrogramy wiadomości i plików, identyfikatory obiektów, retencję oraz logi
  antyspamowe i audytowe bez plaintextu.

E2EE **nie ukrywa grafu społecznego, czasu ani rozmiaru komunikacji**. Padding,
anonimowy routing i prywatne potwierdzenia odbioru nie wchodzą do pierwszej
wersji. Logi i telemetria nie mogą zawierać kluczy, plaintextu, odszyfrowanych
wyjątków ani pełnych pakietów protokołu.

## Zaufane komponenty i założenia

Zaufane są: kod klienta dostarczony użytkownikowi, audytowana biblioteka
protokołu i jej generator liczb losowych, system operacyjny, magazyn kluczy
urządzenia oraz urządzenia jawnie zweryfikowane przez użytkownika. Web dodatkowo
ufa kodowi JavaScript/Wasm pobranemu przy danej sesji, przeglądarce, polityce CSP
i łańcuchowi dostaw. Tauri ufa podpisanej paczce aplikacji, updaterowi i
platformowemu keystore; sam WebView nie stanowi granicy bezpieczeństwa.

Niezaufane są API, baza, Redis, storage, CDN, gateway, push provider, sieć i
administrator usługi. Serwer tożsamości może odmówić usługi, wstrzymać lub
powtórzyć pakiet. Nie może jednak niezauważenie podmienić urządzenia: klient
wiąże klucze z kontem, pokazuje zmianę użytkownikowi i wymaga jawnej weryfikacji.
Docelowo potrzebny jest audytowalny dziennik przejrzystości kluczy; bez niego
złośliwy serwer może wykonać ukierunkowany atak podmiany klucza.

## Analiza scenariuszy

| Scenariusz | Oczekiwana ochrona | Ograniczenia i reakcja |
| --- | --- | --- |
| Przejęcie odblokowanego urządzenia | Atakujący odczyta bieżący stan i wiadomości dostępne na urządzeniu, ale nie powinien odzyskać bezpowrotnie usuniętych kluczy wiadomości. | Natychmiastowe usunięcie urządzenia rozpoczyna nową epokę/grupę sesji. Klient kasuje sekrety, tokeny i lokalną bazę; FS nie chroni plaintextu zachowanego w cache lub backupie. |
| Złośliwy serwer | Nie odszyfruje poprawnych szyfrogramów ani nie sfałszuje podpisanego członka. | Może analizować metadane, cenzurować, opóźniać, cofać stan albo podawać różne widoki kluczy. Klient odrzuca replay, rollback epoki i nieautoryzowane commity, ostrzega o zmianach urządzeń; key transparency jest warunkiem pełniejszej ochrony. |
| Kradzież bazy/storage | Snapshot nie ujawnia treści ani prywatnych kluczy urządzeń. | Ujawnia wymienione metadane, szyfrogramy i publiczne materiały inicjalizacyjne. Prekeys są jednorazowo konsumowane atomowo; retencja i backupy są minimalizowane. Sekrety serwera i hasła nadal podlegają osobnej ochronie. |
| Zmiana członkostwa grupy | MLS commit tworzy nową epokę. Usunięty członek nie czyta nowych wiadomości, a nowy nie otrzymuje automatycznie historii. | Serwer nie może sam dopisać członka. Klient porównuje propozycję ze stanem autoryzacji Strafe, pokazuje zmianę i wstrzymuje wysyłanie przy konflikcie/forku. Członek może wcześniej skopiować plaintext; kryptografia tego nie cofnie. |
| Odzyskiwanie konta | Reset hasła nie odzyskuje kluczy E2EE i nie czyni nowego urządzenia zaufanym. | Użytkownik zatwierdza nowe urządzenie z istniejącego lub używa zaszyfrowanego klucza odzyskiwania. Bez obu traci starą historię. Po recovery wszystkie grupy usuwają stare urządzenia, rotują epoki/sesje i pokazują zdarzenie bezpieczeństwa. Support nie omija tej reguły. |

## Wybór standardów i bibliotek

Ocena jest punktem w czasie, a nie zatwierdzeniem zależności. Każdy kandydat
musi mieć przypiętą wersję i commit, SBOM, politykę zgłoszeń bezpieczeństwa,
utrzymywane wydania oraz publiczny raport audytu obejmujący używaną konfigurację.

| Kandydat | Rust/native | TypeScript | Przeglądarka/Wasm | Ocena dojrzałości dla Strafe |
| --- | --- | --- | --- | --- |
| OpenMLS | Główna, utrzymywana implementacja | Brak stabilnego, wysokopoziomowego API TS | Feature `js`; Wasm jest budowany, ale nie testowany w CI projektu | Silny kandydat MLS dla Tauri, eksperymentalny dla web do czasu audytu i własnej macierzy przeglądarek |
| mls-rs | Główna implementacja i kilka providerów kryptografii | Brak zatwierdzonych, stabilnych bindingów aplikacyjnych TS | Dostępny provider WebCrypto; zakres i interoperacyjność trzeba zweryfikować w PoC | Kandydat porównawczy MLS, jeszcze nie decyzja produkcyjna |
| libsignal | Rdzeń Rust, lecz publiczne użycie poza Signal nie jest wspierane | Publikowane API TS dla środowiska Node/Signal Desktop | Brak wspieranego API dla zwykłej przeglądarki | Dojrzałe wdrożenie referencyjne DM, słabe dopasowanie do wspólnego web/Tauri API |
| vodozemac | Utrzymywana biblioteka Rust używana przez Matrix | Bindingi są dostępne przez ekosystem Matrix | Ekosystem Matrix dostarcza build Wasm | Audytowany i wdrożony, ale realizuje Olm/Megolm, a nie wymagany profil X3DH + Double Ratchet |

„Dostępny” nie oznacza „audytowany” ani „wspierany”. Przed PoC sprawdzamy
aktualne release notes, licencję, zakres API, targety CI i raporty audytowe;
binding wygenerowany lokalnie nie podnosi dojrzałości biblioteki.

### Kanały grupowe: MLS

[MLS (RFC 9420)](https://www.rfc-editor.org/rfc/rfc9420.html) zapewnia zmiany
składu grupy, forward secrecy i post-compromise security przez kolejne epoki.
Preferowanym kandydatem jest
[OpenMLS](https://github.com/openmls/openmls): implementacja Rust ma dostawców
kryptografii i opcję kompilacji do Wasm. Projekt deklaruje jednak Wasm jako cel
budowany, ale nietestowany w CI, więc nie traktujemy obsługi przeglądarki jako
dojrzałej bez własnych testów. Alternatywnym kandydatem do porównania jest
[mls-rs](https://github.com/awslabs/mls-rs), w tym provider WebCrypto.

Nie ma obecnie zatwierdzonej, audytowanej biblioteki MLS dla Strafe. Biblioteka
z publicznym audytem o właściwym zakresie jest warunkiem wejścia do produkcji;
sam audyt prymitywów lub zgodność z RFC nie wystarcza. Czyste implementacje
TypeScript bez porównywalnej historii wdrożeń i audytu nie będą używane.

### Rozmowy bezpośrednie: X3DH i Double Ratchet

[X3DH](https://signal.org/docs/specifications/x3dh/) inicjuje sesję asynchroniczną,
a [Double Ratchet](https://signal.org/docs/specifications/doubleratchet/) wyprowadza
nowy klucz dla każdej wiadomości. Kandydatem referencyjnym jest
[libsignal](https://github.com/signalapp/libsignal): rdzeń jest w Rust, a projekt
udostępnia API TypeScript używane przez Signal Desktop. Repozytorium wyraźnie
zastrzega jednak brak wsparcia dla użycia poza Signal, niestabilność API i
wiąże TS z natywnym dodatkiem Node, więc nie jest to gotowa biblioteka
przeglądarkowa ani bezpośredni wspólny komponent web/Tauri.

[vodozemac](https://github.com/matrix-org/vodozemac) jest dojrzałą implementacją
Rust ratchetów Olm/Megolm, używaną przez Matrix, z opublikowanym
[audytem Least Authority](https://matrix.org/media/Least%20Authority%20-%20Matrix%20vodozemac%20Final%20Audit%20Report.pdf).
Nie implementuje jednak dokładnie profilu X3DH + Double Ratchet wymaganego w tym
projekcie, więc nie wolno przedstawiać go jako zamiennika bez zmiany jawnie
wersjonowanej specyfikacji i ponownej analizy protokołu.

Wniosek: wykonujemy ograniczony proof-of-concept libsignal oraz co najmniej
jednego kandydata działającego w Wasm, ale nie piszemy brakującego X3DH/ratcheta.
Jeżeli żadna audytowana implementacja nie obsłuży obu runtime'ów, funkcja DM
pozostaje eksperymentalna lub wyłączona zamiast otrzymać autorski protokół.

### Interoperacyjność web/Tauri

Jeden przypięty rdzeń Rust powinien generować identyczne komunikaty binarne:
native Rust w komendach Tauri i `wasm32-unknown-unknown` w przeglądarce. Cienka,
własna warstwa TypeScript może jedynie walidować wersjonowane envelope'y i
wywoływać rdzeń; nie implementuje prymitywów ani maszyny stanów. Materiały
sekretne w Tauri pozostają za komendą IPC i trafiają do OS keystore. Web zapisuje
zaszyfrowany stan w IndexedDB, a klucz opakowujący jest nieeksportowalnym kluczem
WebCrypto, o ile przeglądarka to wspiera.

CI uruchamia te same wektory RFC i corpus sekwencji (utworzenie, add/remove,
fork, wiadomości poza kolejnością, utrata stanu) przeciw native i Wasm. Każdy
pakiet utworzony w web musi zostać odczytany w Tauri i odwrotnie. Rozbieżność
serializacji, zestawu szyfrów lub zachowania przy błędzie blokuje wydanie.

## Wersjonowane pakiety i algorytmy

Warstwa transportowa używa kanonicznego binarnego envelope'u, nigdy swobodnego
JSON dla danych kryptograficznych:

```text
E2eeEnvelope {
  magic: "STFE",
  envelope_version: uint16,
  protocol: MLS | X3DH_PREKEY | DOUBLE_RATCHET | ATTACHMENT,
  protocol_version: uint16,
  suite_id: uint16,
  conversation_id: 32 bytes,
  sender_device_id: 16 bytes,
  epoch_or_session: bytes,
  message_id: 16 random bytes,
  payload: opaque bytes,
  signature_or_auth_data: opaque bytes
}
```

Wersja `1` profilu proponuje:

- MLS 1.0: `MLS_128_DHKEMX25519_AES128GCM_SHA256_Ed25519` (obowiązkowy
  zestaw RFC 9420), format TLS Presentation Language z RFC;
- DM: X3DH z X25519, HKDF-SHA-256, Ed25519 dla tożsamości urządzenia i Double
  Ratchet z HKDF-SHA-256 oraz AEAD AES-256-GCM; dokładne kodowanie musi pochodzić
  z wybranej biblioteki i opublikowanego profilu, nie z powyższego skrótu;
- załączniki: losowy klucz 256-bitowy, strumieniowe AEAD z unikalnymi nonce'ami;
  konkretny format chunków zostanie wybrany z audytowanej biblioteki.

Nieznana wersja, suite lub krytyczne rozszerzenie powoduje bezpieczne odrzucenie,
nie downgrade. Klient podpisuje negocjowane możliwości urządzenia; serwer nie
wybiera algorytmu. Zmiana zestawu jest nową wersją profilu, ma wektory migracji
i okres dwuczytania, ale zapis zawsze używa najnowszej wspólnej wersji. Stare
wersje mają datę wyłączenia; wyjątek wymaga jawnej decyzji bezpieczeństwa.

## Rotacja, FS i PCS

- Każde urządzenie ma odrębną tożsamość i pakiety inicjalizacyjne; prywatny klucz
  nie opuszcza urządzenia w plaintext. Podpisany prekey X3DH rotuje co 7 dni,
  jednorazowe prekeys są uzupełniane przed spadkiem poniżej 100 i nigdy używane
  ponownie. Poprzedni podpisany prekey jest zachowany tylko przez czas dostawy.
- Double Ratchet wykonuje DH ratchet po odpowiedzi drugiej strony i kasuje stare
  message/chain keys. Limit pominiętych kluczy i ich TTL są ograniczone (np. 1000
  kluczy i 30 dni), aby opóźnione wiadomości nie powodowały trwałego magazynu.
- MLS tworzy nową epokę na każdy add, remove i update. Aktywny członek publikuje
  `Update` co najwyżej co 7 dni oraz niezwłocznie po podejrzeniu kompromitacji.
  KeyPackage jest jednorazowy i wygasa po 30 dniach.
- FS oznacza, że przejęcie bieżących sekretów nie odsłania skasowanych kluczy
  wcześniejszych wiadomości. PCS oznacza odzyskanie bezpieczeństwa dopiero po
  uczciwym wkładzie świeżej entropii (DH ratchet albo MLS update/commit) i
  usunięciu atakującego; nie chroni podczas ciągłej kontroli urządzenia.
- Kasowanie jest best-effort: GC, swap, crash dump, backup i kopie użytkownika
  mogą osłabić gwarancje. Dokumentacja produktu nie może obiecywać absolutnego
  usunięcia. Zegar serwera nie decyduje samodzielnie o ważności klucza.

## Odzyskiwanie i wiele urządzeń

Nowe urządzenie jest nowym członkiem kryptograficznym, nie kopią starego klucza.
Istniejące zweryfikowane urządzenie podpisuje transfer i przekazuje historię
przez kanał urządzenie–urządzenie. Alternatywny recovery key o co najmniej 128
bitach entropii opakowuje wersjonowany backup E2EE; serwer widzi wyłącznie AEAD
szyfrogram, salt/KDF parameters i licznik wersji. Hasło konta ani kod e-mail/SMS
nie może sam odszyfrować backupu. KDF i limity prób podlegają osobnej specyfikacji
i audytowi.

Recovery wyświetla wszystkie urządzenia i wymusza ponowną weryfikację. Rotacja
tożsamości oznacza ostrzeżenie dla kontaktów, usunięcie poprzednich urządzeń,
nowe sesje DM i commity MLS. Historia jest przywracana tylko z backupu lub
zaufanego urządzenia; brak recovery key oznacza jej nieodwracalną utratę.

## Bramy wdrożenia i niezależny audyt

Funkcja pozostaje za flagą i bez etykiety „bezpieczna” do spełnienia wszystkich
warunków:

1. Zamrożenie modelu zagrożeń, profilu protokołu, UX weryfikacji i odzyskiwania
   oraz mapy przepływu danych. Publikujemy wersje/commity zależności i SBOM.
2. Udokumentowany publiczny audyt wybranej biblioteki obejmuje użyte ścieżki,
   platformy i provider kryptograficzny. Zespół usuwa lub formalnie akceptuje
   każde znalezisko; krytyczne/wysokie blokują wdrożenie.
3. Niezależna firma bez udziału autorów przeprowadza przegląd projektu i kodu
   integracji Strafe: serializacja, RNG, storage, IPC Tauri, Wasm, recovery,
   aktualizacje, key transparency, membership, załączniki i supply chain.
4. Testy obejmują oficjalne wektory, interoperacyjność native/Wasm, property i
   fuzz testing parserów/maszyn stanów, chaos kolejności/replay/fork, rollback
   storage oraz testy na wielu urządzeniach i wersjach klienta.
5. Powtórny test potwierdza poprawki. Publikujemy raport, zakres, wyłączenia i
   odpowiedź zespołu przed ograniczonym rolloutem; nie publikujemy exploitów
   przed dostępnością poprawionej wersji.
6. Pilotaż ma kill switch, telemetrykę wyłącznie niesensytywną, playbook
   incydentu, prywatny kanał zgłoszeń zgodny z `SECURITY.md` i plan wymuszonej
   migracji. Audyt powtarzamy po zmianie protokołu/providerów/recovery oraz co
   najmniej raz w roku dla istotnie zmienionego kodu.

Po wdrożeniu kompatybilność nie ma pierwszeństwa przed bezpieczeństwem. W razie
luki można zablokować tworzenie podatnych pakietów, wymusić aktualizację i nową
epokę/sesję, lecz nie wolno po cichu przełączyć rozmowy na plaintext.

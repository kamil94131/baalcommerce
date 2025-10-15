# Dokument wymagań produktu (PRD) - BaalCommerce

## 1. Przegląd produktu

BaalCommerce to prosty system handlu bagiennym zielem działający w kolonii górniczej. Umożliwia rejestrację użytkowników (zarządzaną przez Supabase Auth — szczegóły w 3.1), tworzenie i wystawianie ofert sprzedaży bagiennego ziela, wybór kuriera i finalizację zamówienia z płatnością jedynie gotówką przy odbiorze (waluta: magiczna ruda). System zawiera mechanikę zarządzania kurierami (dostępna wyłącznie dla specjalnej roli 'gomez' przyznawanej ręcznie w bazie danych) oraz historię zamówień (Kupione / Sprzedane). Kluczowe wymogi to silna walidacja pól (client + server), zachowanie historii zamówień oraz blokowanie zakupów gdy brak kurierów.

Główne założenia techniczno-domenowe:

* Rola gomez nadawana ręcznie bezpośrednio w DB.
* Trzy obozy występują jako wartości kodowe w aplikacji: `OLD_CAMP`, `NEW_CAMP`, `SWAMP_CAMP`. W bazie przechowujemy je jako pole tekstowe `camp` (string) o długości 5–15 znaków; domyślna wartość logiczna po stronie aplikacji: `SWAMP_CAMP`.
* Format timestampa: `yyyy-MM-dd HH:mm:ss` (serwerowy timestamp, jednostka wyświetlana: dni kolonii).
* Wszystkie encje mają pole `id` typu `bigint`, unikalne, chyba że zaznaczono inaczej (np. `userId` z Supabase to string/UUID).
* Płatność: tylko "gotówka przy odbiorze" (opis tylko do odczytu w formularzu zakupu).

## 2. Problem użytkownika

Sprzedający potrzebuje prostego, bezpiecznego sposobu na wystawienie do sprzedaży bagiennego ziela z jasnym określeniem ceny i ilości. Kupujący potrzebuje szybkiego przeglądu dostępnych ofert, łatwego zamówienia oraz pewności, że przesyłka będzie obsłużona przez kuriera. Administrator (gomez) potrzebuje narzędzia do zarządzania kurierami, aby odblokować możliwość zakupów. System musi:

* Zapewniać jednoznaczne reguły walidacji danych (np. długości, zakresy liczbowe, unikalności).
* Blokować zakup jeśli nie ma dostępnych kurierów (widoczne w UI i wymuszane po stronie serwera).
* Zachować historię zamówień (brak możliwości usunięcia historii).
* Zapewnić proste reguły uprawnień (autoryzacja tworzenia/edycji/usuwania ofert, zarządzanie kurierami).

## 3. Wymagania funkcjonalne

### 3.1 Autoryzacja i uwierzytelnianie

* **Mechanizm uwierzytelniania:** Cała obsługa kont użytkowników (rejestracja, logowanie, przechowywanie credentiali, hashowanie haseł, reset hasła) realizowana jest przez **Supabase Auth** (zewnętrzny moduł). Aplikacja korzysta z tożsamości dostarczonej przez Supabase (UID) jako źródła prawdziwego identyfikatora użytkownika.
* **Rejestracja / Logowanie:** Rejestracja i logowanie odbywają się przez Supabase Auth (lub interfejs dostarczony przez aplikację, który deleguje do Supabase). Dane weryfikacyjne i mechanizmy hashowania są poza zakresem tej aplikacji — konfiguracja i polityki bezpieczeństwa haseł ustalane są w konfiguracji Supabase.
* **Profile użytkownika (metadane):** Po uwierzytelnieniu aplikacja zarządza oddzielną encją **Profil** (opis w 3.2), która przechowuje metadane użytkownika powiązane z `userId` z Supabase. To na podstawie profilu aplikacja podejmuje decyzje domenowe (np. domyślny kurier, name, camp).
* **Uprawnienia / role:** Aplikacja interpretuje role/claims przekazane przez Supabase (jeśli wykorzystywane). Rola `gomez` jest przypisywana ręcznie w DB i widok do zarządzania kurierami jest dostępny tylko dla kont z tą rolą. Uprawnienia tworzenia/edycji/usuwania ofert są egzekwowane po stronie serwera na podstawie powiązania tworzącego (profilu) i kontekstu autoryzacji.
* **Sesje / tokeny:** Mechanizm sesji/tokens zależny od implementacji Supabase; aplikacja powinna respektować tokeny i odświeżanie dostarczane przez Supabase.

### 3.2 Dane i walidacja (kanoniczne schematy)

Wszystkie pola walidowane po stronie klienta i serwera. Format dat: `yyyy-MM-dd HH:mm:ss`.

Oferta (Offer)

```json
{
  "id": "bigint (unique)",
  "title": "string, length 5-20",
  "description": "string, length 0-200",
  "price": "int, 0-999 (jednostka: magiczna ruda)",
  "quantity": "int, 1-99",
  "createdAt": "timestamp yyyy-MM-dd HH:mm:ss (server)",
  "sellerId": "Supabase Auth UID, unique, wskazuje autora oferty)",
  "sellerName": "string, length 5-50, pochodzi z Profil.name",
  "sellerCamp": "string, length 5-15, pochodzi z Profil,camp",
  "status": "enum(CREATED, DONE)"
}
```

Kurier (Courier)

```json
{
  "id": "bigint (unique)",
  "name": "string, length 5-20 (unique across couriers)",
  "camp": "string, length 5-15"
}
```

Profil (Profile) - metadane użytkownika, powiązana z Supabase Auth

```json
{
  "id": "bigint (unique)",
  "userId": "string (Supabase Auth UID, unique)", 
  "name": "string, length 5-50 (unique)",
  "camp": "string, length 5-15",
  "defaultCourierId": "bigint (nullable, odniesienie do Courier.id)"
}
```

Zamówienie (Order)

```json
{
  "id": "bigint (unique)",
  "offerId": "bigint (id oferty)",
  "title": "string (zapisane z oferty w chwili zakupu)",
  "quantity": "int (zapisane z oferty w chwili zakupu)",
  "price": "int (zapisane z oferty w chwili zakupu)",
  "sellerName": "string (zapisane z oferty)",
  "sellerCamp": "string, length 5-15 (zapisane z oferty)",
  "sellerId": "UID (Profil.userId — identyfikator sprzedawcy w momencie zakupu)",
  "buyerId": "UID (Profil.userId)",
  "buyerName": "string (zapisane z profilu kupującego w chwili zakupu)",
  "buyerCamp": "string, length 5-15 (zapisane z profilu kupującego w chwili zakupu)",
  "courierId": "bigint (Courier.id)",
  "deliveredAt": "timestamp yyyy-MM-dd HH:mm:ss"
}
```

Reguły walidacji / domenowe:

* Statusy ofert ograniczone do `CREATED` → `DONE` (brak innych przejść).
* Po przejściu do `DONE` oferta jest ukrywana z listy ofert, ale zachowywana w DB.
* Edycja/usunięcie oferty możliwe tylko przez autora (porównać `sellerId` oferty z `Profil.userId` użytkownika) i tylko zanim `status == DONE`.
* Kupno wymaga wyboru kuriera; gdy brak kurierów zakup zablokowany (UI: pole kuriera wyróżnione i przycisk Kup disabled). Wymuszane również na serwerze.
* Wszędzie gdzie w modelu pojawiało się pole `camp` — jest to `string` o długości min 5, max 15. Wartości semantyczne (`OLD_CAMP`, `NEW_CAMP`, `SWAMP_CAMP`) są trzymane jako enum/konstanty po stronie kodu, natomiast w DB zapisywana jest ich tekstowa reprezentacja zgodna z ograniczeniem długości.

### 3.3 Funkcje użytkownika

* Rejestracja i logowanie: odbywają się przez Supabase Auth; aplikacja przy rejestracji tworzy (lub wymusza u użytkownika utworzenie) rekord `Profil` powiązany z `userId` (Supabase UID) gdzie zapisujemy `name`, `camp`, `defaultCourierId` (opcjonalnie).
* Tworzenie, edycja, usuwanie ofert (sprzedający): operacje autoryzowane po stronie serwera — autor określony przez `sellerId`.
* Przegląd listy ofert: wyświetlane pola: `title`, `description`, `price`, `quantity`, `sellerName`, `sellerCamp`, `createdAt`.
* Zamówienie: wybór oferty → przycisk Zamów → formularz zamawiania → wybór kuriera z dropdown (wyświetlane tylko imiona kurierów) → Kup (po kliknięciu serwer tworzy zamówienie z atrybutami oferty zapisanymi bezpośrednio w zamówieniu, `sellerId` = id profilu sprzedawcy, `buyerId` = id profilu kupującego, `deliveredAt` = teraz) → oferta znika z listy.
* Widok Kupione (dla kupującego): lista zamówień z `title`, `quantity`, `sellerName`, `sellerCamp`, `deliveredAt`.
* Widok Sprzedane (dla sprzedającego): lista zamówień gdzie `sellerId = moja Profil.userId`, pokazuje `title`, `quantity`, `deliveredAt`.
* Preferencje zakupowe: pole `defaultCourierId` (opcjonalne) w `Profil` — metryka sukcesu będzie z tym powiązana.
* Zarządzanie kurierami: tylko `gomez` może tworzyć i usuwać kurierów (pola: `name` 5–20, `camp` string 5–15). Kurier nie jest użytkownikiem systemu.

### 3.4 Reguły UI / UX krytyczne

* Walidacja natychmiastowa po stronie klienta; serwer zawsze waliduje ponownie.
* W formularzu zakupu pole płatności jest tylko do odczytu i pokazuje "gotówka przy odbiorze (magiczna ruda)".
* W miejscach gdzie występuje czas w formacie `yyyy-MM-dd HH:mm:ss` widnieje informacja "(liczony w dniach kolonii)".
* Dropdown kurierów pokazuje tylko `name` kurierów.
* Jeśli nie ma kurierów: pole wyboru kuriera wyróżnione na czerwono z komunikatem "proszę wybrać kuriera" i przycisk Kup jest disabled.
* Błędy walidacji (client + server) widoczne przy polach i zwracane jako struktura błędu (pole → komunikat).

### 3.5 Persystencja i operacje

* Wszystkie encje przechowywane są w relacyjnej bazie danych Postgresql (Supabase) z indeksami dla unikalności `name` i `title` (gdzie wymagane).
* Profil przechowuje powiązanie do tożsamości Supabase (`userId`) — to pozwala na autoryzację i łączenie działań użytkownika z metadanymi.
* Historia zamówień nieusuwalna z poziomu UI.
* Implementować mechanizm transakcyjny przy finalizacji zakupu (utworzenie `Order` + aktualizacja `Offer.status`) — atomowość.

## 4. Granice produktu (Out of scope / ograniczenia)

Wyraźnie poza zakresem PRD:

* Płatności online i integracje z zewnętrznymi bramkami płatniczymi (tylko gotówka przy odbiorze).
* Kurier jako użytkownik systemu (kurier jest odrębną encją, nie ma konta logowania).
* UI/UX design (szczegóły layoutów, kolory itp.) — zostawione do oddzielnego zadania designu.
* Automatyczne nadawanie roli gomez ani workflow aprobat (nadawanie gomez wykonywane ręcznie w DB; procedura produkcyjna do dopracowania).
* Implementacja mechanizmów przechowywania credentiali (hasła, salt, work factor) — to obsługuje Supabase Auth.

Niejasne / wymagające decyzji (do backlogu):

* Konkretne algorytmy i parametry hashowania haseł — konfigurowane/zarządzane w Supabase.

## 5. Historyjki użytkowników

Wszystkie historyjki są testowalne, zawierają jasne kryteria akceptacji i obejmują podstawowe, alternatywne i skrajne scenariusze.

### US-001

Tytuł: Rejestracja nowego użytkownika
Opis: Jako nowy użytkownik chcę się zarejestrować (przez Supabase Auth) i uzupełnić swój profil w aplikacji, aby otrzymać dostęp do funkcji kupujący/sprzedający.
Kryteria akceptacji:

1. Rejestracja i logowanie wykonywane przez Supabase Auth.
2. Po rejestracji użytkownik tworzy/uzupełnia `Profil` z następującymi walidacjami: `name` 5–50 i unikalne; `camp` string 5–15 (wartość domyślna logiczna: `SWAMP_CAMP`).
3. `Profil` powiązany jest z `userId` (UID Supabase) i ma przypisane `id` w aplikacyjnej DB.
4. Po utworzeniu profilu użytkownik ma dostęp do tworzenia ofert (jeśli aplikacja nadaje domyślne role BUYER/SELLER — implementacja po stronie aplikacji/Supabase).
5. Wszystkie walidacje wykonywane są po stronie klienta i serwera; serwer zwraca strukturę błędów (pole → komunikat).

### US-002

Tytuł: Logowanie użytkownika
Opis: Jako zarejestrowany użytkownik chcę się zalogować za pomocą mechanizmu Supabase Auth, aby korzystać z funkcji systemu.
Kryteria akceptacji:

1. Dla poprawnych danych logowanie zakończone sukcesem (kod 200 + token/sesja po stronie Supabase).
2. Dla niepoprawnych danych Supabase odrzuca żądanie; aplikacja przekazuje odpowiedni komunikat.
3. Aplikacja nie przechowuje haseł w jasnym tekście ani nie zarządza ich hashowaniem lokalnie.

### US-003

Tytuł: Ustawienie preferencji zakupowych (domyślny kurier)
Opis: Jako kupujący chcę ustawić domyślnego kuriera w profilu, aby szybciej składać zamówienia.
Kryteria akceptacji:

1. Pole `defaultCourierId` w `Profil` może być puste lub wskazywać `courierId`.
2. Można zapisać i zaktualizować preferencję z widoku profilu (walidacja na serwerze).
3. Metryka sukcesu będzie liczyć konta z niepustym `defaultCourierId`.

### US-004

Tytuł: Tworzenie oferty (sprzedający)
Opis: Jako sprzedający chcę utworzyć ofertę z tytułem, opisem, ceną i ilością, aby wystawić zioła na sprzedaż.
Kryteria akceptacji:

1. `title` 5–20 znaków; `description` 0–200 znaków; `price` int 0–999; `quantity` int 1–99.
2. `sellerCamp` (w zapisie: `sellerCamp` jako pole tekstowe) zapisuje obóz sprzedającego automatycznie (wartość tekstowa 5–15).
3. `createdAt` jest generowane serwerowo w formacie `yyyy-MM-dd HH:mm:ss`.
4. Po zapisie oferta ma `status = CREATED` i `id`.
5. Autor oferty jest zapisywany w `sellerId` (Profil.userId). Uprawnienia do edycji/usunięcia opierają się na porównaniu `sellerId` z Profil.userId zalogowanego użytkownika.
6. Błędy walidacji zwracane są po stronie serwera i wyświetlane w UI.

### US-005

Tytuł: Edycja oferty (sprzedający)
Opis: Jako autor oferty chcę móc edytować ofertę dopóki nie zostanie sprzedana.
Kryteria akceptacji:

1. Edycja możliwa tylko jeśli `offer.status == CREATED` oraz `sellerId` oferty == Profil.userId zalogowanego użytkownika.
2. Edytować można `title`, `description`, `price`, `quantity`; wykonane walidacje jak przy tworzeniu.
3. Próba edycji oferty ze statusem `DONE` lub oferty niebędącej mojego autorstwa zwraca błąd (HTTP 400/403) i odpowiedni komunikat.

### US-006

Tytuł: Usuwanie oferty (sprzedający)
Opis: Jako autor oferty chcę móc usunąć moją ofertę jeśli nie została sprzedana.
Kryteria akceptacji:

1. Usuwanie możliwe tylko jeśli `status == CREATED` i `sellerId` oferty == Profil.userId użytkownika.
2. Po usunięciu oferta nie jest widoczna w liście ofert; UI potwierdza usunięcie.
3. Próba usunięcia oferty innego autora lub ofertę ze statusem `DONE` zwraca błąd.

### US-007

Tytuł: Przegląd listy ofert (kupujący)
Opis: Jako kupujący chcę przeglądać aktualne oferty, aby znaleźć produkty do kupienia.
Kryteria akceptacji:

1. Widok listy pokazuje tylko oferty ze statusem `CREATED`.
2. Dla każdej oferty widoczne: `title`, `description`, `price`, `quantity`, `sellerName`, `sellerCamp`, `createdAt` (format `yyyy-MM-dd HH:mm:ss`).
3. Oferta ze statusem `DONE` nie pojawia się na liście.

### US-008

Tytuł: Rozpoczęcie zamówienia (kupujący)
Opis: Jako kupujący chcę otworzyć formularz zamówienia dla konkretnej oferty.
Kryteria akceptacji:

1. Formularz pokazuje pola oferty (`title`, `price`, `quantity`) w trybie tylko do odczytu.
2. Pole wyboru kuriera (dropdown z imionami), w którym można wybrać kuriera.
3. Pole płatności jest tylko do odczytu i zawiera tekst "gotówka przy odbiorze (magiczna ruda)".

### US-009

Tytuł: Finalizacja zakupu (kupujący)
Opis: Jako kupujący chcę zakończyć zakup, wybrać kuriera i zapłacić przy odbiorze.
Kryteria akceptacji:

1. Jeśli w systemie istnieje co najmniej jeden kurier → dropdown aktywny, kup możliwy.
2. Po kliknięciu Kup serwer tworzy zamówienie z:
   a. zapisanymi atrybutami oferty (`title`, `quantity`, `price`, `sellerName`, `sellerCamp`) oraz kupującego (`buyerName`, `buyerCamp`) jako pola w zamówieniu,
   b. `buyerId` (Profil.userId), `courierId`,
   c. `sellerId` (Profil.userId sprzedawcy, zapisane w zamówieniu),
   d. `deliveredAt` = czas serwera w formacie `yyyy-MM-dd HH:mm:ss`.
3. Po sukcesie `offer.status` zmienia się na `DONE`; oferta znika z listy ofert `CREATED`.
4. Zamówienie pojawia się w widoku Kupione (dla kupującego) i Sprzedane (dla sprzedającego).
5. Transakcja atomowa: albo zamówienie tworzone i status oferty ustawiony, albo żadna zmiana nie jest zapisywana.

### US-010

Tytuł: Blokada zakupu gdy brak kurierów
Opis: Jako system chcę uniemożliwić zakup jeśli w DB nie ma żadnych kurierów.
Kryteria akceptacji:

1. Jeśli liczba kurierów = 0 → w formularzu zamówienia dropdown kuriera wyróżnione na czerwono z tekstem "proszę wybrać kuriera", przycisk Kup disabled.
2. Serwer odrzuca próby stworzenia zamówienia jeśli nie wskazano `courierId` lub jeśli `courierId` nie istnieje (HTTP 400 + komunikat).
3. Po dodaniu co najmniej jednego kuriera zakup staje się dostępny natychmiast.

### US-011

Tytuł: Zarządzanie kurierami (gomez)
Opis: Jako użytkownik z rolą gomez chcę tworzyć i usuwać kurierów, aby umożliwić zakupy.
Kryteria akceptacji:

1. Widok Kurier dostępny tylko dla konta z rolą gomez (autoryzacja po serwerze).
2. Tworzenie kuriera wymaga `name` 5–20 oraz `camp` (string 5–15); po sukcesie kurier ma `id`.
3. Usuwanie kuriera możliwe tylko z poziomu widoku gomez; usunięcie kuriera powoduje, że ten kurier nie będzie więcej dostępny w dropdown.
4. Jeśli po usunięciu kurierów liczba = 0 → zakupy zablokowane zgodnie z US-010.

### US-012

Tytuł: Widok Kupione (kupujący)
Opis: Jako kupujący chcę zobaczyć historię moich zamówień.
Kryteria akceptacji:

1. Widok pokazuje listę zamówień z: `title`, `quantity`, `sellerName`, `sellerCamp`, `deliveredAt`.
2. Dane pochodzą z tabeli zamówień i są nieusuwalne przez zwykłego użytkownika.

### US-013

Tytuł: Widok Sprzedane (sprzedający)
Opis: Jako sprzedający chcę zobaczyć historię sprzedaży moich ofert.
Kryteria akceptacji:

1. Widok pokazuje zamówienia, gdzie `sellerId = Profil.userId`, pola: `title`, `quantity`, `deliveredAt`.
2. Rekordy nieusuwalne przez sprzedającego.

### US-014

Tytuł: Unikalność login i name
Opis: Jako system chcę wymusić unikalność `name` profilu i (tam gdzie dotyczy) loginów w Supabase.
Kryteria akceptacji:

1. Próba utworzenia profilu z istniejącym `name` kończy się błędem walidacji.
2. Serwer sprawdza kolizję i odrzuca konkurencyjne zapisy (unikalny indeks DB).

### US-015

Tytuł: Zapobieganie kupna własnej oferty (edge case)
Opis: Jako system chcę blokować sytuację, w której użytkownik kupuje własną ofertę.
Kryteria akceptacji:

1. Jeśli `buyerId` == `sellerId` → próbę zakupu blokuje serwer (HTTP 400 + komunikat "nie można kupić własnej oferty").
2. UI dodatkowo nie pokazuje przycisku Kup dla ofert, których autorem jest zalogowany użytkownik (opcjonalnie, dodatkowe zabezpieczenie po stronie serwera obowiązkowe).

### US-016

Tytuł: Obsługa błędów walidacji (client + server)
Opis: Jako użytkownik chcę widzieć czytelne komunikaty walidacyjne po stronie UI oraz serwera.
Kryteria akceptacji:

1. Walidacja pól odbywa się zarówno po stronie klienta, jak i serwera; serwer zwraca strukturę błędów z nazwą pola i komunikatem.
2. UI pokazuje błędy blisko pól i uniemożliwia wysłanie formularza jeśli są błędy klienta.

### US-017

Tytuł: Zarządzanie rolą gomez w DB (operacyjna historia)
Opis: Jako operator chcę wiedzieć, jak nadawana jest rola gomez i mieć proces przydzielania tej roli.
Kryteria akceptacji:

1. Dokumentacja procesu (backlog action): role gomez nadawana ręcznie w DB przez operatora z uprawnieniami do bazy.
2. W DB zapisane jest, kto wykonał zmianę (audit).

## 6. Metryki sukcesu

Metryki, sposób pomiaru i cele.

1. Metryka: Wypełnienie preferencji zakupowych

    * Definicja: odsetek aktywnych użytkowników, którzy ustawili `defaultCourierId` w swoim `Profil`.
    * Wskaźnik = (liczba kont z ustawionym `defaultCourierId`) / (liczba aktywnych kont) * 100%
    * Cel: ≥ 90% w ciągu 3 miesięcy od wdrożenia.
    * Źródło danych: tabela `Profil`, pole `defaultCourierId` + definicja aktywności (logowanie w ostatnich 30 dniach).

2. Metryka: Aktywność zakupowa

    * Definicja: odsetek użytkowników realizujących ≥1 zamówienie w ostatnich 30 dniach.
    * Wskaźnik = (liczba użytkowników z min. 1 zamówieniem w ostatnich 30 dni) / (liczba aktywnych użytkowników) * 100%
    * Cel: ≥ 75% miesięcznie.
    * Źródło danych: tabela `Order`, filtr `deliveredAt` w ostatnich 30 dniach + lista aktywnych użytkowników.

3. Metryka: Błędy walidacji krytycznych pól

    * Cel: zmniejszyć liczbę odrzuconych formularzy z powodu złej walidacji po stronie klienta (wskaźnik błędów serwera wskutek braku client-side validation < 1%).

## Lista kontrolna PRD (weryfikacja)

* Czy każdą historię użytkownika można przetestować?

    * Tak. Każde US zawiera konkretne wejścia i oczekiwane rezultaty (statusy HTTP, zmiany w DB, widoki), z uwzględnieniem, że rejestracja/logowanie odbywają się przez Supabase, a profil aplikacyjny przechowuje metadane.

* Czy kryteria akceptacji są jasne i konkretne?

    * Tak. Zawierają zakresy walidacji, format timestampa, warunki blokady itp.

* Czy mamy wystarczająco dużo historyjek, aby zbudować w pełni funkcjonalną aplikację?

    * Tak. Pokryte są rejestracja (przez Supabase) i profil (lokalnie), logowanie, CRUD ofert, przepływ zakupu, zarządzanie kurierami, widoki historii i walidacje.

* Czy uwzględniliśmy wymagania dotyczące uwierzytelniania i autoryzacji?

    * Tak. Autoryzacja oparta jest na tożsamości Supabase + logicznych przypisaniach roli `gomez` w DB; operacje zapisu/edycji sprawdzają zgodność `Profil.userId` z danymi encji (np. `sellerId`).

## Dodatkowe uwagi i zalecenia implementacyjne

1. Walidacja powinna być wspólna: client-side (UX) + server-side (definitywna). Pola `camp` są przechowywane jako `string` (5–15) — aplikacja powinna wystawić enum/konstanty po stronie kodu dla możliwych wartości i mapować je do wartości tekstowych w DB.
2. Unikalność pól wymaga indeksów DB (`Profil.name`, `Courier.name` etc.) i obsługi błędów konkurencyjnych.
3. Implementować mechanizm transakcyjny przy finalizacji zakupu (utworzenie `Order` + update `Offer.status`).
4. Autoryzacja akcji CRUD ofert powinna bazować na `sellerId` w ofercie i `Profil.userId` wynikającym z uwierzytelnienia Supabase.
5. Konfiguracja bezpieczeństwa kont (hasła, polityki, reset) powinna być zrobiona w Supabase — PRD nie definiuje parametrów kryptograficznych.

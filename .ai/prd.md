# Dokument wymagań produktu (PRD) - BaalCommerce

## 1. Przegląd produktu

BaalCommerce to prosty system handlu bagiennym zielem działający w kolonii górniczej. Umożliwia rejestrację użytkowników (domyślnie z rolami kupujący i sprzedający), tworzenie i wystawianie ofert sprzedaży bagiennego ziela, wybór kuriera i finalizację zamówienia z płatnością jedynie gotówką przy odbiorze (waluta: magiczna ruda). System zawiera mechanikę zarządzania kurierami (dostępna wyłącznie dla specjalnej roli 'gomez' przyznawanej ręcznie w bazie danych) oraz historię zamówień (Kupione / Sprzedane). Kluczowe wymogi to silna walidacja pól (client + server), zachowanie historii zamówień oraz blokowanie zakupów gdy brak kurierów.

Główne założenia techniczno-domenowe:

* Rola gomez nadawana ręcznie bezpośrednio w DB (procedura produkcyjna do doprecyzowania).
* Trzy obozy (enum): OLD_CAMP (stary obóz), NEW_CAMP (nowy obóz), SWAMP_CAMP (obóz na bagnie). Przy rejestracji użytkownik wybiera obóz; domyślnie SWAMP_CAMP.
* Format timestampa: `yyyy-MM-dd HH:mm:ss` (serwerowy timestamp, jednostka wyświetlana: dni kolonii).
* Wszystkie encje mają pole `id` typu bigint, unikalne.
* Płatność: tylko "gotówka przy odbiorze" (opis tylko do odczytu w formularzu zakupu).

## 2. Problem użytkownika

Sprzedający potrzebuje prostego, bezpiecznego sposobu na wystawienie do sprzedaży bagiennego ziela z jasnym określeniem ceny i ilości. Kupujący potrzebuje szybkiego przeglądu dostępnych ofert, łatwego zamówienia oraz pewności, że przesyłka będzie obsłużona przez kuriera. Administrator (gomez) potrzebuje narzędzia do zarządzania kurierami, aby odblokować możliwość zakupów. System musi:

* Zapewniać jednoznaczne reguły walidacji danych (np. długości, zakresy liczbowe, unikalności).
* Blokować zakup jeśli nie ma dostępnych kurierów (widoczne w UI i wymuszane po stronie serwera).
* Zachować historię zamówień (brak możliwości usunięcia historii).
* Zapewnić proste reguły uprawnień (autoryzacja tworzenia/edycji/usuwania ofert, zarządzanie kurierami).

## 3. Wymagania funkcjonalne

### 3.1 Autoryzacja i uwierzytelnianie

* Rejestracja: pola `login` (unique, 5–20 znaków), `password` (5–20), `name` (unikalne, 5–50), `camp` (enum; default SWAMP_CAMP). Po rejestracji użytkownik dostaje role: kupujący i sprzedający.
* Logowanie: `login` + `password`. Sesje mechanizmem zależnym od implementacji (do doprecyzowania).
* Bezpieczeństwo haseł: hasła muszą być przechowywane w formie hashowanej (np. bcrypt/Argon2) — wymaganie implementacyjne; szczegóły (salt/work factor) do wyboru i opisania w specyfikacji bezpieczeństwa.
* Rola gomez: nie występuje UI do nadawania; przypisanie ręczne w DB. Widok do zarządzania kurierami dostępny tylko dla konta z rola gomez.

### 3.2 Dane i walidacja (kanoniczne schematy)

Wszystkie pola walidowane po stronie klienta i serwera. Format dat: `yyyy-MM-dd HH:mm:ss`.

Oferta (Offer)

```json
{
  "id": "bigint (unique)",
  "title": "string, length 5-20",
  "description": "string, length 5-200",
  "price": "int, 0-999 (jednostka: magiczna ruda)",
  "quantity": "int, 1-99",
  "createdAt": "timestamp yyyy-MM-dd HH:mm:ss (server)",
  "sellerId": "bigint",
  "sellerCamp": "enum(OLD_CAMP, NEW_CAMP, SWAMP_CAMP)",
  "status": "enum(CREATED, DONE)"
}
```

Kurier (Courier)

```json
{
  "id": "bigint (unique)",
  "name": "string, length 5-20 (unique across couriers)",
  "camp": "enum(OLD_CAMP, NEW_CAMP, SWAMP_CAMP)"
}
```

Użytkownik (User)

```json
{
  "id": "bigint (unique)",
  "login": "string, length 5-20 (unique)",
  "passwordHash": "string",
  "name": "string, length 5-50 (unique)",
  "camp": "enum(OLD_CAMP, NEW_CAMP, SWAMP_CAMP)",
  "roles": "enum(BUYER, SELLER, GOMEZ)"
}
```

Zamówienie (Order)

```json
{
  "id": "bigint (unique)",
  "offerSnapshot": {
    "title": "string",
    "quantity": "int",
    "price": "int",
    "sellerName": "string",
    "sellerCamp": "enum"
  },
  "buyerId": "bigint",
  "courierId": "bigint",
  "deliveredAt": "timestamp yyyy-MM-dd HH:mm:ss"
}
```

Reguły walidacji / domenowe:

* Statusy ofert ograniczone do CREATED → DONE (brak innych przejść).
* Po przejściu do DONE oferta jest ukrywana z listy ofert, ale zachowywana w DB.
* Edycja/usunięcie oferty możliwe tylko przez autora i tylko zanim status = DONE.
* Kupno wymaga wyboru kuriera; gdy brak kurierów zakup zablokowany (UI: pole kuriera czerwone i przycisk Kup disabled). Wymuszane również na serwerze.

### 3.3 Funkcje użytkownika

* Rejestracja i logowanie (walidacja, unikalność).
* Tworzenie, edycja, usuwanie ofert (sprzedający).
* Przegląd listy ofert: wyświetlane pola: title, description, price, quantity, sellerName, sellerCamp, createdAt.
* Zamówienie: wybór oferty → przycisk Zamów → formularz zamawiania → wybór kuriera z dropdown (wyświetlane tylko imiona kurierów) → Kup (po kliknięciu serwer tworzy zamówienie z domyślnymi wartosciami dla deliveredAt = teraz, status -> DONE) → oferta znika z listy.
* Widok Kupione (dla kupującego): lista zamówień z title, quantity, sellerName, sellerCamp, deliveredAt.
* Widok Sprzedane (dla sprzedającego): lista zamówień gdzie sprzedający = ja, pokazuje title, quantity, deliveredAt.
* Preferencje zakupowe: pole `defaultCourier` (opcjonalne) w profilu użytkownika — metryka sukcesu będzie z tym powiązana.
* Zarządzanie kurierami: tylko gomez może tworzyć i usuwać kurierów (pola: name 5–20, camp). Kurier nie jest użytkownikiem systemu.

### 3.4 Reguły UI / UX krytyczne

* Walidacja natychmiastowa po stronie klienta; serwer zawsze waliduje ponownie.
* W formularzu zakupu pole płatności jest tylko do odczytu i pokazuje "gotówka przy odbiorze (magiczna ruda)".
* W miejscach gdzie wystepuje czas w formacie yyyy-MM-dd HH:mm:ss widnieje informacje "(liczony w dniach kolonii).
* Dropdown kurierów pokazuje tylko `name` kurierów.
* Jeśli nie ma kurierów: pole wyboru kuriera wyróżnione na czerwono z komunikatem "proszę wybrać kuriera" i przycisk Kup jest disabled.
* Błędy walidacji (client + server) widoczne przy polach i zwracane jako struktura błędu (pole → komunikat).

### 3.5 Persystencja i operacje

* Wszystkie encje przechowywane w relacyjnej/NoSQL DB z indeksami dla unikalności `name`.
* Historia zamówień nieusuwalna z poziomu UI.

## 4. Granice produktu (Out of scope / ograniczenia)

Wyraźnie poza zakresem PRD:

* Płatności online i integracje z zewnętrznymi bramkami płatniczymi (tylko gotówka przy odbiorze).
* Kurier jako użytkownik systemu (kurier jest odrębną encją, nie ma konta logowania).
* UI/UX design (szczegóły layoutów, kolory itp.) — zostawione do oddzielnego zadania designu.
* Automatyczne nadawanie roli gomez ani workflow aprobat (nadawanie gomez wykonywane ręcznie w DB; procedura produkcyjna do dopracowania).

Niejasne / wymagające decyzji (do backlogu):

* Procedura produkcyjna nadawania roli gomez (kto, approval, logika).
* Konkretne algorytmy i parametry hashowania haseł, procedura resetu hasła, zdecentralizowane sesje.

## 5. Historyjki użytkowników

Wszystkie historyjki są testowalne, zawierają jasne kryteria akceptacji i obejmują podstawowe, alternatywne i skrajne scenariusze.

### US-001

Tytuł: Rejestracja nowego użytkownika
Opis: Jako nowy użytkownik chcę się zarejestrować podając login, hasło, imię i obóz, aby otrzymać dostęp do funkcji kupujący/sprzedający.
Kryteria akceptacji:

1. Pole `login` przyjmuje 5–20 znaków i musi być unikalne; przy próbie rejestracji z istniejącym loginem system odrzuca żądanie z komunikatem.
2. Pole `password` przyjmuje 5–20 znaków; przy krótszym/dłuższym haśle natychmiastowy błąd walidacji.
3. Pole `name` przyjmuje 5–50 znaków i musi być unikalne; duplikat powoduje błąd.
4. `camp` przyjmuje jedną z wartości enum; jeśli nie podano, domyślnie SWAMP_CAMP.
5. Po pomyślnej rejestracji konto ma przypisane role BUYER i SELLER oraz jest widoczne w DB z `id`.
6. Wszystkie walidacje wykonywane są po stronie klienta i serwera; serwer zwraca strukturę błędów (pole→komunikat).

### US-002

Tytuł: Logowanie użytkownika
Opis: Jako zarejestrowany użytkownik chcę się zalogować za pomocą loginu i hasła, aby korzystać z funkcji systemu.
Kryteria akceptacji:

1. Dla poprawnych danych sesja/logowanie zakończone sukcesem (kod 200 + token/sesja).
2. Dla niepoprawnych danych login zwraca błąd autoryzacji.
3. Nie podajemy haseł w prostym tekście w logach; serwer nie zwraca hashów.

### US-003

Tytuł: Ustawienie preferencji zakupowych (domyślny kurier)
Opis: Jako kupujący chcę ustawić domyślnego kuriera w profilu, aby szybciej składać zamówienia.
Kryteria akceptacji:

1. Pole `defaultCourier` w profilu może być puste lub wskazywać `courierId`.
2. Można zapisać i zaktualizować preferencję z widoku profilu.
3. Metryka sukcesu będzie liczyć konta z niepustym `defaultCourier`.

### US-004

Tytuł: Tworzenie oferty (sprzedający)
Opis: Jako sprzedający chcę utworzyć ofertę z tytułem, opisem, ceną i ilością, aby wystawić zioła na sprzedaż.
Kryteria akceptacji:

1. `title` 5–20 znaków; `description` 5–200; `price` int 0–999; `quantity` int 1–99.
2. Pole `sellerCamp` zapisuje obóz sprzedającego automatycznie.
3. `createdAt` jest generowane serwerowo w formacie `yyyy-MM-dd HH:mm:ss`.
4. Po zapisie oferta ma status CREATED i `id`.
5. Błędy walidacji zwracane są po stronie serwera i wyświetlane w UI.

### US-005

Tytuł: Edycja oferty (sprzedający)
Opis: Jako autor oferty chcę móc edytować ofertę dopóki nie zostanie sprzedana.
Kryteria akceptacji:

1. Edycja możliwa tylko jeśli `offer.status == CREATED`.
2. Edytować można `title`, `description`, `price`, `quantity`; wykonane walidacje jak przy tworzeniu.
3. Próba edycji oferty ze statusem DONE zwraca błąd (HTTP 400/403) i treść "oferta nie może być edytowana po sprzedaży".

### US-006

Tytuł: Usuwanie oferty (sprzedający)
Opis: Jako autor oferty chcę móc usunąć moją ofertę jeśli nie została sprzedana.
Kryteria akceptacji:

1. Usuwanie możliwe tylko jeśli `status == CREATED` i użytkownik jest autorem.
2. Po usunięciu oferta nie jest widoczna w liście ofert, oferta zostaje usunięta z bazy danych na podstawie id. UI potwierdza usunięcie.
3. Próba usunięcia oferty innego autora lub ofertę ze statusem DONE zwraca błąd.

### US-007

Tytuł: Przegląd listy ofert (kupujący)
Opis: Jako kupujący chcę przeglądać aktualne oferty, aby znaleźć produkty do kupienia.
Kryteria akceptacji:

1. Widok listy pokazuje tylko oferty ze statusem CREATED.
2. Dla każdej oferty widoczne: title, description, price, quantity, sellerName, sellerCamp, createdAt (format yyyy-MM-dd HH:mm:ss).
3. Oferta ze statusem DONE nie pojawia się na liście.

### US-008

Tytuł: Rozpoczęcie zamówienia (kupujący)
Opis: Jako kupujący chcę otworzyć formularz zamówienia dla konkretnej oferty.
Kryteria akceptacji:

1. Formularz pokazuje pola oferty (title, price, quantity) w trybie tylko do odczytu
2. Pole wyboru kuriera (dropdown z imionami), w którym można wybrać kuriera.
3. Pole płatności jest tylko do odczytu i zawiera tekst "gotówka przy odbiorze (magiczna ruda)".

### US-009

Tytuł: Finalizacja zakupu (kupujący)
Opis: Jako kupujący chcę zakończyć zakup, wybrać kuriera i zapłacić przy odbiorze.
Kryteria akceptacji:

1. Jeśli w systemie istnieje co najmniej jeden kurier → dropdown aktywny, kup możliwy.
2. Po kliknięciu Kup serwer tworzy zamówienie z:
   a. `offerSnapshot` (title, quantity, price, sellerName, sellerCamp),
   b. `buyerId`, `courierId`,
   c. `deliveredAt` = czas serwera w formacie yyyy-MM-dd HH:mm:ss.
3. Po sukcesie `offer.status` zmienia się na DONE; oferta znika z listy ofert CREATED.
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
2. Tworzenie kuriera wymaga `name` 5–20 oraz `camp`; po sukcesie kurier ma `id`.
3. Usuwanie kuriera możliwe tylko z poziomu widoku gomez; usunięcie kuriera powoduje, że ten kurier nie będzie więcej dostępny w dropdown.
4. Jeśli po usunięciu kurierów liczba = 0 → zakupy zablokowane zgodnie z US-010.

### US-012

Tytuł: Widok Kupione (kupujący)
Opis: Jako kupujący chcę zobaczyć historię moich zamówień.
Kryteria akceptacji:

1. Widok pokazuje listę zamówień z: title, quantity, sellerName, sellerCamp, deliveredAt.
2. Dane pochodzą z tabeli zamówień i są nieusuwalne przez zwykłego użytkownika.

### US-013

Tytuł: Widok Sprzedane (sprzedający)
Opis: Jako sprzedający chcę zobaczyć historię sprzedaży moich ofert.
Kryteria akceptacji:

1. Widok pokazuje zamówienia, gdzie sellerId = ja, pola: title, quantity, deliveredAt.
2. Rekordy nieusuwalne przez sprzedającego.

### US-014

Tytuł: Unikalność login i name
Opis: Jako system chcę wymusić unikalność `login` i `name` użytkownika.
Kryteria akceptacji:

1. Próba rejestracji z istniejącym `login` lub `name` kończy się błędem walidacji.
2. Dodatkowo serwer sprawdza kolizję i odrzuca konkurencyjne zapisy (unikalny indeks DB).

### US-015

Tytuł: Zapobieganie kupna własnej oferty (edge case)
Opis: Jako system chcę blokować sytuację, w której użytkownik kupuje własną ofertę.
Kryteria akceptacji:

1. Jeśli buyerId == sellerId → próbę zakupu blokuje serwer (HTTP 400 + komunikat "nie można kupić własnej oferty").
2. UI nie pokazuje przycisku Kup dla ofert, których autorem jest zalogowany użytkownik (opcjonalnie, dodatkowe zabezpieczenie po stronie serwera obowiązkowe).

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

1. Dokumentacja procesu (backlog action): role gomez nadawana ręcznie w DB przez użytkownika, które ma bezpośredni dostęp do bazy danych.
2. W DB zapisane jest, kto wykonał zmianę (audit).

## 6. Metryki sukcesu

Metryki, sposób pomiaru i cele.

1. Metryka: Wypełnienie preferencji zakupowych

    * Definicja: odsetek aktywnych użytkowników, którzy ustawili `defaultCourier`.
    * Wskaźnik = (liczba kont z ustawionym defaultCourier) / (liczba aktywnych kont) * 100%
    * Cel: ≥ 90% w ciągu 3 miesięcy od wdrożenia.
    * Źródło danych: tabela użytkowników, pola `defaultCourier` + definicja aktywności (logowanie w ostatnich 30 dniach).

2. Metryka: Aktywność zakupowa

    * Definicja: odsetek użytkowników realizujących ≥1 zamówienie w ostatnich 30 dniach.
    * Wskaźnik = (liczba użytkowników z min. 1 zamówieniem w ostatnich 30 dni) / (liczba aktywnych użytkowników) * 100%
    * Cel: ≥ 75% miesięcznie.
    * Źródło danych: tabela zamówień, filtr deliveredAt w ostatnich 30 dniach + lista aktywnych użytkowników.

3. Metryka: Błędy walidacji krytycznych pól

    * Cel: zmniejszyć liczbę odrzuconych formularzy z powodu złej walidacji po stronie klienta (wskaźnik błędów serwera wskutek braku klient-side validation < 1%).

## Lista kontrolna PRD (weryfikacja)

* Czy każdą historię użytkownika można przetestować?

    * Tak. Każde US zawiera konkretne wejścia i oczekiwane rezultaty (statusy HTTP, zmiany w DB, widoki).
* Czy kryteria akceptacji są jasne i konkretne?

    * Tak. Zawierają zakresy walidacji, format timestampa, warunki blokady itp.
* Czy mamy wystarczająco dużo historyjek, aby zbudować w pełni funkcjonalną aplikację?

    * Tak. Pokryte są rejestracja, logowanie, CRUD ofert, przepływ zakupu, zarządzanie kurierami, widoki historii i walidacje.
* Czy uwzględniliśmy wymagania dotyczące uwierzytelniania i autoryzacji?

    * Tak. US-001, US-002 określają rejestrację/logowanie; US-011, US-017 definiuje role i operacje gomez.

## Dodatkowe uwagi i zalecenia implementacyjne

1. Walidacja powinna być wspólna: client-side (UX) + server-side (definitywna).
2. Unikalność pól wymaga indeksów DB i obsługi błędów konkurencyjnych.
3. Implementować mechanizm transakcyjny przy finalizacji zakupu (utworzenie order + update offer.status).
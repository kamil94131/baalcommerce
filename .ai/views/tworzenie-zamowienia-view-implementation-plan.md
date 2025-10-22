# Plan implementacji widoku Tworzenie Zamówienia

## 1. Przegląd
Widok "Tworzenie Zamówienia" jest ostatnim krokiem w procesie zakupu. Użytkownik jest na niego kierowany po wybraniu oferty z listy. Widok ten prezentuje podsumowanie wybranej oferty (w trybie tylko do odczytu) i wymaga od użytkownika wyboru kuriera z listy rozwijanej. Kluczowym elementem jest obsługa przypadku brzegowego, w którym w systemie nie ma dostępnych kurierów, co uniemożliwia złożenie zamówienia.

## 2. Routing widoku
Widok będzie dostępny pod ścieżką z parametrem zapytania:
- `/orders/new?offerId={id}`

## 3. Struktura komponentów
```
/orders/new.astro (Astro Page)
└── TworzenieZamowieniaView (React Component)
    ├── SkeletonLoader (dla ładowania danych)
    ├── ErrorAlert (dla błędów krytycznych, np. oferta nie istnieje)
    ├── NoCouriersAlert (specjalny alert, gdy brak kurierów)
    └── OrderCreationForm (główny formularz)
        ├── OfferSummaryCard (karta z danymi oferty)
        ├── Form (właściwy formularz z react-hook-form)
        │   ├── Select (dla wyboru Kuriera)
        │   └── div (statyczny tekst o metodzie płatności)
        └── Button ("Kup", warunkowo wyłączony)
```
- **`TworzenieZamowieniaView`**: Komponent-kontener, który pobiera `offerId` z URL, orkiestruje pobieranie wszystkich potrzebnych danych (oferta, kurierzy, profil użytkownika) i zarządza logiką UI.
- **`OrderCreationForm`**: Komponent prezentujący formularz, w tym podsumowanie oferty i pole wyboru kuriera.
- **`NoCouriersAlert`**: Komponent `Alert` z Shadcn/ui, wyświetlany, gdy lista kurierów jest pusta.

## 4. Szczegóły komponentów
### `TworzenieZamowieniaView`
- **Opis komponentu**: Główny komponent widoku, który używa dedykowanego hooka do pobrania wszystkich danych. Implementuje kluczową logikę biznesową, taką jak blokowanie UI w przypadku braku kurierów.
- **Główne elementy**: Wyświetla warunkowo `SkeletonLoader`, `ErrorAlert`, `NoCouriersAlert` lub `OrderCreationForm`.
- **Obsługiwane interakcje**: Inicjuje pobieranie danych oraz submisję zamówienia do API.
- **Typy**: `OrderCreationViewModel`, `CreateOrderCommand`.
- **Propsy**: `offerId: string`.

### `OrderCreationForm`
- **Opis komponentu**: Formularz, który pozwala użytkownikowi sfinalizować transakcję. Wyświetla dane oferty i umożliwia wybór kuriera.
- **Główne elementy**: `Card` do podsumowania oferty, `Form`, `Select`, `Button` z Shadcn/ui.
- **Obsługiwana walidacja** (client-side, `zod`):
    - `courierId`: `number().positive("Musisz wybrać kuriera.")`
- **Typy**: `OrderCreationViewModel`
- **Propsy**:
    - `viewModel: OrderCreationViewModel`: Obiekt zawierający wszystkie potrzebne dane (ofertę, kurierów, profil).
    - `onSubmit: (data) => void`: Funkcja zwrotna wywoływana po pomyślnej walidacji.
    - `isSubmitting: boolean`: Flaga do blokowania przycisku podczas wysyłania.

## 5. Typy
- **`OrderCreationViewModel`** (nowy typ, do zdefiniowania w komponencie lub `types.ts`):
    ```typescript
    type OrderCreationViewModel = {
      offer: OfferDto;
      couriers: CourierDto[];
      profile: ProfileDto;
    };
    ```
- **`CreateOrderCommand`** (z `src/types.ts`): Typ danych (`{ offerId, courierId }`) wysyłanych w ciele żądania `POST`.
- **`CreateOrderSchema`** (z `src/pages/api/orders/order.schema.ts`): Schemat `zod` używany do walidacji formularza.

## 6. Zarządzanie stanem
- **Stan danych**: Zarządzany przez niestandardowy hook `useOrderCreationData(offerId)`, który będzie odpowiedzialny za:
    - Równoległe pobranie danych z `GET /api/offers/{id}`, `GET /api/couriers` i `GET /api/profiles/me`.
    - Zarządzanie stanami `isLoading` i `error`.
    - Zwrócenie zagregowanych danych jako `OrderCreationViewModel`.
- **Stan formularza**: Zarządzany przez `react-hook-form`.
- **Stan submisji**: Prosty stan `isSubmitting: boolean` w `TworzenieZamowieniaView`.

## 7. Integracja API
- **Pobieranie danych (przy ładowaniu widoku)**:
    1.  `GET /api/offers/{id}`: Pobranie danych oferty, której dotyczy zamówienie.
    2.  `GET /api/couriers`: Pobranie listy kurierów do `Select`.
    3.  `GET /api/profiles/me`: Pobranie `defaultCourierId` użytkownika.
- **Tworzenie zamówienia (przy submisji formularza)**:
    - `POST /api/orders`:
        - **Ciało żądania**: `CreateOrderCommand` (`{ offerId, courierId }`).
        - **Po sukcesie**: Użytkownik jest przekierowywany do widoku `Kupione` (`/orders?view=bought`).

## 8. Interakcje użytkownika
- **Użytkownik wchodzi na stronę**: Widok ładuje wszystkie potrzebne dane. Wyświetlany jest `SkeletonLoader`.
- **Dane załadowane (są kurierzy)**: Wyświetlany jest formularz z podsumowaniem oferty. Pole wyboru kuriera jest preselekcjonowane, jeśli użytkownik ma ustawionego domyślnego kuriera.
- **Dane załadowane (brak kurierów)**: Wyświetlany jest `NoCouriersAlert`, a formularz i przycisk "Kup" są zablokowane.
- **Użytkownik klika "Kup"**: Formularz jest walidowany. Jeśli wybrano kuriera, wysyłane jest żądanie `POST`. Po sukcesie następuje przekierowanie.

## 9. Warunki i walidacja
- **Warunek zakupu**: Musi istnieć co najmniej jeden kurier w systemie. Ta logika jest implementowana w `TworzenieZamowieniaView` po stronie klienta, blokując UI.
- **Walidacja formularza**: Pole `courierId` jest wymagane. `react-hook-form` z `zodResolver` zapewni, że formularz nie zostanie wysłany bez wybranego kuriera.

## 10. Obsługa błędów
- **Błąd ładowania danych**: Jeśli `GET /api/offers/{id}` zwróci `404`, użytkownik powinien zobaczyć błąd "Oferta nie istnieje" i zostać przekierowany z powrotem do listy ofert.
- **Brak kurierów**: To nie jest błąd, a przypadek brzegowy. Musi być obsłużony przez dedykowany, czytelny komunikat `NoCouriersAlert`.
- **Błąd submisji (np. 409 Conflict)**: Jeśli oferta została w międzyczasie sprzedana, API zwróci błąd. Użytkownik powinien zobaczyć komunikat (np. Toast) "Ta oferta nie jest już aktywna" i zostać przekierowany do listy ofert.
- **Brak autoryzacji (401)**: Przekierowanie na stronę logowania.

## 11. Kroki implementacji
1.  **Stworzenie hooka `useOrderCreationData(offerId)`**: Zaimplementuj hook do równoległego pobierania i agregacji danych oferty, kurierów i profilu użytkownika.
2.  **Stworzenie strony `/orders/new.astro`**: Strona pobierze `offerId` z URL i wyrenderuje komponent `TworzenieZamowieniaView`.
3.  **Stworzenie komponentu `TworzenieZamowieniaView`**:
    - Użyj hooka `useOrderCreationData`.
    - Zaimplementuj logikę warunkowego renderowania dla stanów: ładowania, błędu, braku kurierów i stanu aktywnego formularza.
    - Zaimplementuj handler `onSubmit`, który wywoła `POST /api/orders` i obsłuży przekierowanie.
4.  **Stworzenie komponentu `OrderCreationForm`**:
    - Zintegruj `react-hook-form` z `zod` dla walidacji pola `courierId`.
    - Wyświetl podsumowanie oferty w komponencie `OfferSummaryCard`.
    - Wypełnij `Select` danymi kurierów i ustaw wartość domyślną na podstawie `profile.defaultCourierId`.
    - Wyłącz formularz, jeśli `couriers.length === 0` lub `isSubmitting` jest `true`.
5.  **Testowanie**: Sprawdź wszystkie ścieżki: pomyślne złożenie zamówienia, preselekcję kuriera, blokadę UI przy braku kurierów oraz obsługę błędów API (np. próba zakupu nieaktywnej oferty).

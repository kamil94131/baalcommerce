# Plan implementacji widoku Panel Główny / Lista Ofert

## 1. Przegląd
"Panel Główny / Lista Ofert" to domyślny widok aplikacji po zalogowaniu, dostępny pod ścieżką `/offers`. Jego głównym celem jest wyświetlenie listy wszystkich aktywnych ofert (`status: CREATED`) w formie tabeli z paginacją. Widok ten musi wizualnie odróżniać oferty należące do zalogowanego użytkownika, blokując możliwość ich zakupu. Kliknięcie oferty innego użytkownika inicjuje proces składania zamówienia.

## 2. Routing widoku
Widok będzie dostępny pod główną ścieżką dla ofert:
- `/offers`

## 3. Struktura komponentów
```
/offers.astro (Astro Page)
└── ListaOfertView (React Component)
    ├── div (kontener na przycisk)
    │   └── Button ("Stwórz nową ofertę")
    ├── SkeletonLoader (dla ładowania danych tabeli)
    ├── ErrorAlert (dla błędów ładowania)
    └── OffersDataTable (komponent tabeli)
        ├── DataTableHeader
        ├── DataTableBody
        │   └── DataTableRow (z logiką warunkową dla każdej oferty)
        └── DataTablePagination (do nawigacji między stronami)
```
- **`ListaOfertView`**: Główny komponent React, który zarządza pobieraniem danych (ofert i profilu użytkownika) oraz stanami UI.
- **`OffersDataTable`**: Komponent tabeli, który renderuje dane i implementuje logikę warunkową dla wierszy.

## 4. Szczegóły komponentów
### `ListaOfertView`
- **Opis komponentu**: Komponent-kontener, który orkiestruje cały widok. Używa niestandardowego hooka do pobrania danych i zarządza stanem paginacji.
- **Główne elementy**: Wyświetla przycisk do tworzenia nowej oferty oraz, w zależności od stanu, `SkeletonLoader`, `ErrorAlert` lub `OffersDataTable`.
- **Obsługiwane interakcje**: 
    - Kliknięcie przycisku "Stwórz nową ofertę" nawiguje do `/offers/new`.
    - Zarządza zmianami paginacji, przekazując nowe wartości `limit` i `offset` do hooka pobierającego dane.
- **Typy**: `PaginatedOffersDto`, `ProfileDto`
- **Propsy**: Brak.

### `OffersDataTable`
- **Opis komponentu**: Tabela danych oparta na Shadcn/ui, dostosowana do wyświetlania ofert. Implementuje kluczową logikę biznesową dotyczącą ofert własnych użytkownika.
- **Główne elementy**: `Table`, `TableRow`, `TableCell`, `Badge`.
- **Obsługiwane interakcje**:
    - `onRowClick`: Po kliknięciu wiersza, sprawdza czy `offer.sellerId` jest różny od `currentUserId`. Jeśli tak, nawiguje do `/orders/new?offerId={offer.id}`.
- **Logika warunkowa**: 
    - Dla wierszy, gdzie `offer.sellerId === currentUserId`, dodawany jest komponent `Badge` z tekstem "(Twoja oferta)", a wiersz otrzymuje stylizację wskazującą na brak aktywności (np. `opacity-50`, `cursor-not-allowed`).
- **Typy**: `OfferDto`
- **Propsy**:
    - `offers: OfferDto[]`: Tablica obiektów ofert do wyświetlenia.
    - `currentUserId: string`: ID zalogowanego użytkownika do porównania z `sellerId` oferty.

## 5. Typy
- **`OfferDto`** (z `src/types.ts`): Główny obiekt danych dla każdej oferty.
- **`PaginatedOffersDto`** (z `src/types.ts`): Struktura odpowiedzi z API dla listy ofert.
- **`ProfileDto`** (z `src/types.ts`): Potrzebny do uzyskania ID zalogowanego użytkownika (`userId`).

## 6. Zarządzanie stanem
- **Stan danych**: Zarządzany przez niestandardowy hook `useOffersData`, który będzie odpowiedzialny za:
    - Równoległe pobieranie danych z `GET /api/offers` (z parametrami paginacji) i `GET /api/profiles/me`.
    - Zarządzanie stanami `isLoading` i `error`.
    - Zwracanie obiektu `{ offersData, profileData }`.
- **Stan paginacji**: Zarządzany w komponencie `ListaOfertView` za pomocą `useState` dla `offset` i `limit`. Zmiany w tym stanie powodują ponowne wywołanie hooka `useOffersData`.

## 7. Integracja API
- **Pobieranie danych (przy ładowaniu widoku i zmianie strony)**:
    1.  `GET /api/offers`: Pobranie listy ofert. Przyjmuje parametry `limit` i `offset`.
    2.  `GET /api/profiles/me`: Pobranie profilu zalogowanego użytkownika w celu identyfikacji jego ofert.
- **Logika**: Hook `useOffersData` wykona oba zapytania równolegle za pomocą `Promise.all`.

## 8. Interakcje użytkownika
- **Użytkownik wchodzi na stronę `/offers`**: Widok ładuje pierwszą stronę ofert i dane użytkownika, a następnie wyświetla tabelę.
- **Użytkownik klika na ofertę innego użytkownika**: Następuje przekierowanie do ścieżki `/orders/new?offerId={id_oferty}`.
- **Użytkownik klika na własną ofertę**: Brak akcji. Wiersz jest wizualnie nieaktywny.
- **Użytkownik zmienia stronę w paginacji**: Wywoływane jest ponowne pobranie danych z API z nowymi parametrami `offset`.
- **Użytkownik klika "Stwórz nową ofertę"**: Następuje przekierowanie do `/offers/new`.

## 9. Warunki i walidacja
- **Warunek dostępu**: Użytkownik musi być zalogowany.
- **Pusta lista ofert**: Jeśli API zwróci pustą tablicę `data`, `OffersDataTable` powinien wyświetlić komunikat, np. "Brak aktywnych ofert. Stwórz pierwszą!", wraz z przyciskiem prowadzącym do tworzenia oferty.

## 10. Obsługa błędów
- **Błąd ładowania danych**: Jeśli którekolwiek z zapytań API zawiedzie, `ListaOfertView` wyświetli komponent `ErrorAlert` z komunikatem "Nie udało się załadować ofert. Spróbuj ponownie później."
- **Brak autoryzacji (401)**: Globalny handler zapytań powinien przechwycić ten błąd i przekierować użytkownika na stronę logowania.

## 11. Kroki implementacji
1.  **Stworzenie hooka `useOffersData`**: Zaimplementuj hook, który przyjmuje obiekt z parametrami paginacji i wykonuje równoległe zapytania do `/api/offers` i `/api/profiles/me`.
2.  **Stworzenie strony `/offers.astro`**: Strona będzie renderować komponent `ListaOfertView`.
3.  **Stworzenie komponentu `ListaOfertView`**:
    - Zaimplementuj zarządzanie stanem paginacji (`offset`, `limit`).
    - Użyj hooka `useOffersData` do pobrania danych.
    - Zaimplementuj renderowanie warunkowe dla stanów UI.
    - Dodaj przycisk "Stwórz nową ofertę" z odpowiednią nawigacją.
4.  **Stworzenie komponentu `OffersDataTable`**:
    - Skonfiguruj `DataTable` z kolumnami: `Tytuł`, `Cena`, `Ilość`, `Sprzedawca`, `Obóz sprzedawcy`, `Data utworzenia`.
    - Zaimplementuj logikę renderowania wierszy, która dodaje `Badge` i zmienia styl dla ofert własnych użytkownika.
    - Dodaj obsługę `onRowClick` z warunkiem blokującym nawigację dla własnych ofert.
    - Zaimplementuj komponent `DataTablePagination` i połącz go ze stanem paginacji w `ListaOfertView`.
    - Zadbaj o wyświetlenie stanu pustego.
5.  **Testowanie**: Sprawdź wszystkie kluczowe funkcjonalności: paginację, poprawne renderowanie ofert własnych, blokadę kliknięcia, nawigację do tworzenia oferty i zamówienia, a także obsługę błędów i stanu pustego.

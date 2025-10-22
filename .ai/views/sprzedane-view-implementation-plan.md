# Plan implementacji widoku Sprzedane

## 1. Przegląd
Widok "Sprzedane" ma na celu wyświetlenie użytkownikowi historii jego sprzedaży. Będzie to tabela zawierająca listę wszystkich zamówień pochodzących z ofert zalogowanego użytkownika. Dane w widoku są historyczne i przeznaczone tylko do odczytu. Kliknięcie w dowolny wiersz tabeli przekieruje użytkownika do widoku szczegółów danego zamówienia.

## 2. Routing widoku
Widok będzie dostępny pod ścieżką:
- `/orders?view=sold`

## 3. Struktura komponentów
Struktura jest analogiczna do widoku "Kupione", ale skonfigurowana dla danych o sprzedaży.
```
/orders (Astro route)
└── SprzedaneView (React Component)
    ├── SkeletonLoader (wyświetlany podczas ładowania)
    ├── ErrorAlert (wyświetlany przy błędzie API)
    └── SprzedaneDataTable (wyświetla dane)
        ├── DataTableHeader
        ├── DataTableBody
        │   └── DataTableRow (dla każdego zamówienia)
        └── DataTableEmptyState (gdy brak danych)
```
- **`SprzedaneView`**: Główny komponent React, który jest renderowany przez stronę Astro. Odpowiada za logikę pobierania danych o sprzedanych przedmiotach.
- **`SprzedaneDataTable`**: Komponent oparty na `DataTable` z biblioteki Shadcn/ui, odpowiedzialny za renderowanie danych zamówień w formie tabeli, z kolumnami istotnymi dla sprzedawcy.

## 4. Szczegóły komponentów
### `SprzedaneView`
- **Opis komponentu**: Komponent-kontener, który zarządza pobieraniem danych dla widoku "Sprzedane". Wykorzystuje niestandardowy hook `useSoldOrders` do komunikacji z API i obsługuje stany ładowania, błędu oraz pomyślnego załadowania danych.
- **Główne elementy**: Wyświetla warunkowo komponent `SkeletonLoader`, `ErrorAlert` lub `SprzedaneDataTable` w zależności od aktualnego stanu.
- **Obsługiwane interakcje**: Brak bezpośrednich interakcji. Inicjuje pobieranie danych przy montowaniu komponentu.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `OrderDto[]`
- **Propsy**: Brak.

### `SprzedaneDataTable`
- **Opis komponentu**: Komponent tabeli, który renderuje listę sprzedanych przedmiotów. Każdy wiersz jest interaktywny i prowadzi do szczegółów zamówienia.
- **Główne elementy**: Zbudowany z użyciem komponentów `Table` z Shadcn/ui.
- **Obsługiwane interakcje**:
    - `onRowClick`: Po kliknięciu wiersza, użytkownik jest przekierowywany na stronę szczegółów zamówienia (`/orders/{order.id}`).
- **Obsługiwana walidacja**: Brak.
- **Typy**: `OrderDto`
- **Propsy**:
    - `data: OrderDto[]`: Tablica obiektów zamówień do wyświetlenia.

## 5. Typy
Podobnie jak w widoku "Kupione", wykorzystany zostanie istniejący typ `OrderDto`, który zawiera wszystkie wymagane pola, w tym dane kupującego (`buyerName`, `buyerCamp`, `buyerId`).

- **`OrderDto`** (zdefiniowany w `src/types.ts`)
    ```typescript
    export type OrderDto = {
      id: number;
      // ... inne pola
      buyerId: string;
      buyerName: string;
      buyerCamp: string;
      deliveredAt: string; // "RRRR-MM-DD GG:mm:ss"
    };
    ```

## 6. Zarządzanie stanem
Zarządzanie stanem będzie realizowane poprzez dedykowany niestandardowy hook `useSoldOrders`.

- **`useSoldOrders` hook**:
    - **Cel**: Abstrakcja logiki pobierania danych dla sprzedanych przedmiotów.
    - **Zarządzane stany**:
        - `data: OrderDto[] | null`
        - `isLoading: boolean`
        - `error: Error | null`
    - **Funkcjonalność**: Wykonuje żądanie `fetch` do `/api/orders?view=sold` po zamontowaniu komponentu.

## 7. Integracja API
Integracja z API opiera się na tym samym punkcie końcowym co widok "Kupione", ale z innym parametrem.
- **Endpoint**: `GET /api/orders`
- **Parametry zapytania**: `view=sold`
- **Typ żądania**: Brak ciała (body).
- **Typ odpowiedzi (sukces)**: Identyczny jak w przypadku widoku "Kupione", zawierający listę `OrderDto`.
- **Typ odpowiedzi (błąd)**: `401 Unauthorized`, `500 Internal Server Error`.

## 8. Interakcje użytkownika
- **Nawigacja do widoku**: Użytkownik wybiera opcję "Sprzedane" z menu nawigacyjnego.
    - **Wynik**: Aplikacja renderuje widok `/orders?view=sold`, pokazując stan ładowania, a następnie tabelę z danymi.
- **Kliknięcie wiersza tabeli**: Użytkownik klika na wiersz reprezentujący sprzedany przedmiot.
    - **Wynik**: Aplikacja przechodzi na stronę szczegółów zamówienia `/orders/{id}`.

## 9. Warunki i walidacja
- **Warunek dostępu**: Użytkownik musi być zalogowany. Należy obsłużyć błąd `401 Unauthorized`.
- **Walidacja na poziomie komponentu**: Brak. Należy obsłużyć przypadek, gdy API zwróci pustą tablicę, wyświetlając stosowny komunikat.

## 10. Obsługa błędów
- **Błąd API (np. 500)**: Wyświetlenie `ErrorAlert` z komunikatem "Nie udało się załadować historii sprzedaży. Spróbuj ponownie później."
- **Brak uwierzytelnienia (401)**: Przekierowanie na stronę logowania `/login`.
- **Brak danych**: `SprzedaneDataTable` powinien wyświetlić komunikat "Nie masz jeszcze żadnych sprzedanych przedmiotów.".

## 11. Kroki implementacji
1.  **Stworzenie hooka `useSoldOrders`**: Zaimplementuj hook, który będzie wysyłał żądanie `GET` do `/api/orders?view=sold`.
2.  **Stworzenie komponentu `SprzedaneView`**: Stwórz komponent, który użyje hooka `useSoldOrders` i będzie zarządzał renderowaniem warunkowym.
3.  **Stworzenie komponentu `SprzedaneDataTable`**:
    - Skonfiguruj `DataTable` z Shadcn/ui.
    - Zdefiniuj kolumny: `Tytuł` (`title`), `Ilość` (`quantity`), `Nazwa kupującego` (`buyerName`), `Obóz kupującego` (`buyerCamp`), `Data dostawy` (`deliveredAt`).
    - Zaimplementuj formatowanie daty dla kolumny `Data dostawy`.
    - Dodaj obsługę zdarzenia `onClick` dla wierszy.
    - Zaimplementuj wyświetlanie stanu pustego.
4.  **Aktualizacja routingu Astro**: Upewnij się, że strona `/orders.astro` poprawnie identyfikuje parametr `view=sold` i renderuje komponent `SprzedaneView`.
5.  **Refaktoryzacja (opcjonalnie, zalecane)**: Po zaimplementowaniu obu widoków ("Kupione" i "Sprzedane"), rozważ stworzenie jednego, generycznego komponentu `OrdersHistoryView`, który przyjmowałby `view: 'bought' | 'sold'` jako prop i dynamicznie konfigurował zapytanie API oraz kolumny tabeli, aby uniknąć duplikacji kodu.
6.  **Testowanie**: Sprawdź działanie obu widoków, w tym nawigację, obsługę błędów i stanów pustych.

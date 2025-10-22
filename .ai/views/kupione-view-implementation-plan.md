# Plan implementacji widoku Kupione

## 1. Przegląd
Widok "Kupione" ma na celu wyświetlenie użytkownikowi historii jego zakupów. Będzie to tabela zawierająca listę wszystkich zamówień, w których zalogowany użytkownik jest kupującym. Dane w widoku są historyczne i przeznaczone tylko do odczytu. Kliknięcie w dowolny wiersz tabeli przekieruje użytkownika do widoku szczegółów danego zamówienia.

## 2. Routing widoku
Widok będzie dostępny pod ścieżką:
- `/orders?view=bought`

## 3. Struktura komponentów
```
/orders (Astro route)
└── KupioneView (React Component)
    ├── SkeletonLoader (wyświetlany podczas ładowania)
    ├── ErrorAlert (wyświetlany przy błędzie API)
    └── KupioneDataTable (wyświetla dane)
        ├── DataTableHeader
        ├── DataTableBody
        │   └── DataTableRow (dla każdego zamówienia)
        └── DataTableEmptyState (gdy brak danych)
```
- **`KupioneView`**: Główny komponent React, który jest renderowany przez stronę Astro. Odpowiada za logikę pobierania danych, obsługę stanu ładowania i błędów.
- **`KupioneDataTable`**: Komponent oparty na `DataTable` z biblioteki Shadcn/ui, odpowiedzialny za renderowanie danych zamówień w formie tabeli.
- **`SkeletonLoader` / `ErrorAlert`**: Komponenty pomocnicze do obsługi stanów pośrednich UI.

## 4. Szczegóły komponentów
### `KupioneView`
- **Opis komponentu**: Komponent-kontener, który zarządza pobieraniem danych dla widoku "Kupione". Wykorzystuje niestandardowy hook `useBoughtOrders` do komunikacji z API i obsługuje stany ładowania, błędu oraz pomyślnego załadowania danych.
- **Główne elementy**: Wyświetla warunkowo komponent `SkeletonLoader`, `ErrorAlert` lub `KupioneDataTable` w zależności od aktualnego stanu.
- **Obsługiwane interakcje**: Brak bezpośrednich interakcji. Inicjuje pobieranie danych przy montowaniu komponentu.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `OrderDto[]`
- **Propsy**: Brak.

### `KupioneDataTable`
- **Opis komponentu**: Komponent tabeli, który renderuje listę zakupionych przedmiotów. Jest skonfigurowany do wyświetlania konkretnych kolumn zgodnie z wymaganiami. Każdy wiersz jest interaktywny.
- **Główne elementy**: Zbudowany z użyciem `Table`, `TableHeader`, `TableRow`, `TableHead`, `TableBody`, `TableCell` z Shadcn/ui.
- **Obsługiwane interakcje**:
    - `onRowClick`: Po kliknięciu wiersza, użytkownik jest przekierowywany na stronę szczegółów zamówienia (`/orders/{order.id}`).
- **Obsługiwana walidacja**: Brak.
- **Typy**: `OrderDto`
- **Propsy**:
    - `data: OrderDto[]`: Tablica obiektów zamówień do wyświetlenia.

## 5. Typy
Do implementacji tego widoku wykorzystany zostanie bezpośrednio istniejący typ `OrderDto`, który dokładnie odzwierciedla strukturę danych zwracaną przez API.

- **`OrderDto`** (zdefiniowany w `src/types.ts`)
    ```typescript
    export type OrderDto = {
      id: number;
      offerId: number;
      title: string;
      quantity: number;
      price: number;
      sellerName: string;
      sellerCamp: string;
      sellerId: string;
      buyerId: string;
      buyerName: string;
      buyerCamp: string;
      courierId: number;
      deliveredAt: string; // "RRRR-MM-DD GG:mm:ss"
    };
    ```

## 6. Zarządzanie stanem
Zarządzanie stanem będzie realizowane wewnątrz komponentu `KupioneView` przy użyciu hooków `useState` i `useEffect` lub, co jest rekomendowane, poprzez dedykowany niestandardowy hook `useBoughtOrders`.

- **`useBoughtOrders` hook**:
    - **Cel**: Abstrakcja logiki pobierania danych, w tym obsługi stanów ładowania i błędów.
    - **Zarządzane stany**:
        - `data: OrderDto[] | null`: Przechowuje pobrane dane zamówień.
        - `isLoading: boolean`: Informuje, czy żądanie API jest w toku.
        - `error: Error | null`: Przechowuje obiekt błędu, jeśli wystąpił.
    - **Funkcjonalność**: Wykonuje żądanie `fetch` do `/api/orders?view=bought` po zamontowaniu komponentu.

## 7. Integracja API
Integracja z API opiera się na jednym punkcie końcowym:
- **Endpoint**: `GET /api/orders`
- **Parametry zapytania**: `view=bought`
- **Typ żądania**: Brak ciała (body).
- **Typ odpowiedzi (sukces)**:
    ```json
    {
      "data": OrderDto[],
      "pagination": {
        "total": number,
        "limit": number,
        "offset": number
      }
    }
    ```
- **Typ odpowiedzi (błąd)**:
    - `401 Unauthorized`: W przypadku braku uwierzytelnienia. Frontend powinien przekierować użytkownika do strony logowania.
    - `500 Internal Server Error`: W przypadku błędu serwera. Frontend powinien wyświetlić komunikat o błędzie.

## 8. Interakcje użytkownika
- **Nawigacja do widoku**: Użytkownik wybiera opcję "Kupione" z menu nawigacyjnego.
    - **Wynik**: Aplikacja renderuje widok `/orders?view=bought`. Wyświetlany jest stan ładowania (`SkeletonLoader`), a następnie tabela z danymi lub komunikat o braku danych.
- **Kliknięcie wiersza tabeli**: Użytkownik klika na wiersz reprezentujący konkretne zamówienie.
    - **Wynik**: Aplikacja przechodzi na stronę szczegółów zamówienia, np. `/orders/123`, gdzie `123` to `id` klikniętego zamówienia. Zostanie to zrealizowane za pomocą `window.location.href`.

## 9. Warunki i walidacja
- **Warunek dostępu**: Użytkownik musi być zalogowany. Komponent powinien obsłużyć błąd `401 Unauthorized` z API, przekierowując na stronę logowania.
- **Walidacja na poziomie komponentu**: Brak, ponieważ widok jest tylko do odczytu i nie zawiera formularzy. Komponent musi jednak poprawnie obsługiwać przypadki, gdy API zwróci pustą tablicę (`data: []`), wyświetlając odpowiedni komunikat w tabeli.

## 10. Obsługa błędów
- **Błąd API (np. 500)**: W przypadku problemów z serwerem, komponent `KupioneView` powinien wyświetlić komponent `ErrorAlert` z komunikatem, np. "Nie udało się załadować historii zakupów. Spróbuj ponownie później."
- **Brak uwierzytelnienia (401)**: Globalny mechanizm obsługi zapytań lub hook `useBoughtOrders` powinien przechwycić ten status i przekierować użytkownika na stronę `/login`.
- **Brak danych**: Jeśli API zwróci pustą listę zamówień, `KupioneDataTable` powinien wyświetlić w ciele tabeli komunikat "Nie masz jeszcze żadnych zakupionych przedmiotów.".

## 11. Kroki implementacji
1.  **Stworzenie hooka `useBoughtOrders`**: Zaimplementuj hook, który będzie wysyłał żądanie `GET` do `/api/orders?view=bought`, zarządzał stanami `data`, `isLoading` i `error`.
2.  **Stworzenie komponentu `KupioneView`**: Stwórz główny komponent, który użyje hooka `useBoughtOrders` do pobrania danych. Zaimplementuj warunkowe renderowanie dla stanów ładowania, błędu i sukcesu.
3.  **Stworzenie komponentu `KupioneDataTable`**:
    - Skonfiguruj komponent `DataTable` z Shadcn/ui.
    - Zdefiniuj kolumny: `Tytuł` (`title`), `Ilość` (`quantity`), `Nazwa sprzedawcy` (`sellerName`), `Obóz sprzedawcy` (`sellerCamp`), `Data dostawy` (`deliveredAt`).
    - Zaimplementuj formatowanie daty dla kolumny `Data dostawy`, dodając informację `(liczony w dniach kolonii)`.
    - Dodaj obsługę zdarzenia `onClick` dla wierszy, aby nawigować do `/orders/{id}`.
    - Zaimplementuj wyświetlanie stanu pustego, gdy `data` jest pustą tablicą.
4.  **Aktualizacja routingu Astro**: Upewnij się, że strona `/orders.astro` poprawnie identyfikuje parametr `view=bought` i renderuje komponent `KupioneView`.
5.  **Stylowanie i testowanie**: Dopracuj wygląd, upewnij się, że stany ładowania i błędu wyglądają poprawnie, a nawigacja działa zgodnie z oczekiwaniami.

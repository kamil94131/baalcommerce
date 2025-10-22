# Plan implementacji widoku Szczegóły Zamówienia

## 1. Przegląd
Widok "Szczegóły Zamówienia" ma na celu prezentację wszystkich szczegółowych informacji o pojedynczym, historycznym zamówieniu w trybie tylko do odczytu. Użytkownik trafia na ten widok po kliknięciu w element na liście w widokach "Kupione" lub "Sprzedane". Widok ten jest kluczowy dla zapewnienia pełnego wglądu w zakończone transakcje.

## 2. Routing widoku
Widok będzie dostępny pod dynamiczną ścieżką:
- `/orders/{id}` (gdzie `{id}` to unikalny identyfikator zamówienia)

## 3. Struktura komponentów
```
/orders/[id].astro (Astro Page)
└── SzczegolyZamowieniaView (React Component)
    ├── SkeletonLoader (wyświetlany podczas ładowania)
    ├── ErrorAlert (wyświetlany przy błędzie lub gdy zamówienie nie zostanie znalezione)
    └── OrderDetailsCard (wyświetla dane)
        ├── CardHeader
        │   └── CardTitle (np. "Szczegóły zamówienia #{order.id}")
        └── CardContent
            └── DescriptionList (prezentacja danych w formie "klucz: wartość")
```
- **`SzczegolyZamowieniaView`**: Główny komponent React, który pobiera `id` zamówienia z URL, zarządza pobieraniem danych i renderuje odpowiedni stan UI.
- **`OrderDetailsCard`**: Komponent prezentacyjny, który w estetyczny sposób (używając komponentów `Card` i `DescriptionList` z Shadcn/ui) wyświetla wszystkie szczegóły zamówienia.

## 4. Szczegóły komponentów
### `SzczegolyZamowieniaView`
- **Opis komponentu**: Komponent-kontener, który orkiestruje wyświetlanie szczegółów zamówienia. Używa niestandardowego hooka `useOrderDetails` do pobrania wszystkich niezbędnych danych.
- **Główne elementy**: Wyświetla warunkowo `SkeletonLoader`, `ErrorAlert` lub `OrderDetailsCard`.
- **Obsługiwane interakcje**: Inicjuje pobieranie danych na podstawie `id` z URL.
- **Obsługiwana walidacja**: Sprawdza, czy zwrócone dane zamówienia istnieją. Jeśli nie, wyświetla błąd "Nie znaleziono zamówienia".
- **Typy**: `OrderDetailsViewModel`
- **Propsy**: `orderId: number`

### `OrderDetailsCard`
- **Opis komponentu**: Komponent czysto prezentacyjny, odpowiedzialny za renderowanie danych zamówienia. Używa stylizowanego kontenera `Card` do grupowania informacji.
- **Główne elementy**: `Card`, `CardHeader`, `CardTitle`, `CardContent`. Wewnątrz `CardContent` dane są wyświetlane w formie listy definicji (`dl`, `dt`, `dd`) dla czytelności.
- **Obsługiwane interakcje**: Brak.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `OrderDetailsViewModel`
- **Propsy**: `order: OrderDetailsViewModel`

## 5. Typy
Ze względu na konieczność agregacji danych z dwóch różnych źródeł (`Orders` i `Couriers`), definiujemy dedykowany ViewModel.

- **`OrderDto`** (z `src/types.ts`): Podstawowy obiekt zamówienia.
- **`CourierDto`** (z `src/types.ts`): Obiekt kuriera.
- **`OrderDetailsViewModel`** (nowy typ, do zdefiniowania w komponencie lub w pliku `types.ts`):
    ```typescript
    import type { OrderDto } from './types';

    // Łączy dane zamówienia z nazwą kuriera
    export type OrderDetailsViewModel = OrderDto & {
      courierName: string;
    };
    ```

## 6. Zarządzanie stanem
Logika pobierania i agregacji danych zostanie zamknięta w dedykowanym hooku `useOrderDetails`.

- **`useOrderDetails` hook**:
    - **Cel**: Abstrakcja złożonej logiki pobierania danych zamówienia i nazwy kuriera.
    - **Parametry**: `orderId: number`
    - **Zarządzane stany**:
        - `data: OrderDetailsViewModel | null`
        - `isLoading: boolean`
        - `error: string | null`
    - **Funkcjonalność**:
        1.  Wysyła równolegle dwa żądania: `GET /api/orders` (aby pobrać wszystkie zamówienia użytkownika) oraz `GET /api/couriers`.
        2.  Po otrzymaniu odpowiedzi, filtruje listę zamówień, aby znaleźć to o zadanym `orderId`.
        3.  Jeśli zamówienie zostanie znalezione, wyszukuje nazwę kuriera na liście kurierów na podstawie `courierId` z obiektu zamówienia.
        4.  Tworzy obiekt `OrderDetailsViewModel`.
        5.  Obsługuje stany błędu (np. gdy zamówienie o danym `id` nie należy do użytkownika lub nie istnieje).

## 7. Integracja API
**UWAGA**: Bieżąca implementacja API nie dostarcza endpointu `GET /api/orders/{id}`. Poniższy plan zakłada obejście tego problemu. Jest to rozwiązanie nieefektywne i powinno zostać zastąpione dedykowanym endpointem w przyszłości.

- **Endpointy**:
    1.  `GET /api/orders` - do pobrania wszystkich zamówień zalogowanego użytkownika.
    2.  `GET /api/couriers` - do pobrania listy wszystkich kurierów w celu znalezienia nazwy po `courierId`.
- **Logika po stronie klienta**: Hook `useOrderDetails` wykona oba zapytania za pomocą `Promise.all`, a następnie połączy wyniki w celu zbudowania `OrderDetailsViewModel`.

## 8. Interakcje użytkownika
- **Nawigacja do widoku**: Użytkownik nawiguje do ścieżki `/orders/{id}`.
    - **Wynik**: Aplikacja wyświetla `SkeletonLoader`, wykonuje zapytania do API, a następnie renderuje `OrderDetailsCard` z pełnymi danymi zamówienia lub `ErrorAlert`, jeśli dane nie mogą zostać załadowane.

## 9. Warunki i walidacja
- **Warunek dostępu**: Użytkownik musi być zalogowany. Hook `useOrderDetails` musi obsłużyć błąd `401 Unauthorized`.
- **Walidacja `id`**: Logika w `useOrderDetails` musi zweryfikować, czy zamówienie o `id` z URL istnieje na liście zamówień użytkownika. Jeśli nie, powinien zostać ustawiony stan błędu z komunikatem "Nie znaleziono zamówienia".

## 10. Obsługa błędów
- **Błąd API**: Jeśli którekolwiek z zapytań (`/api/orders`, `/api/couriers`) zakończy się błędem serwera (np. 500), `ErrorAlert` powinien wyświetlić ogólny komunikat o błędzie.
- **Zamówienie nie znalezione**: Jeśli `id` z URL nie odpowiada żadnemu zamówieniu użytkownika, `ErrorAlert` powinien wyświetlić komunikat "Nie znaleziono zamówienia lub nie masz do niego dostępu."
- **Kurier nie znaleziony**: Jeśli `courierId` w zamówieniu nie odpowiada żadnemu kurierowi (np. został usunięty), nazwa kuriera powinna być wyświetlona jako "Nieznany" lub "Usunięty kurier".

## 11. Kroki implementacji
1.  **Stworzenie hooka `useOrderDetails(orderId)`**:
    - Zaimplementuj logikę równoległego pobierania zamówień i kurierów.
    - Dodaj logikę filtrowania i łączenia danych w celu stworzenia `OrderDetailsViewModel`.
    - Zaimplementuj solidną obsługę błędów i stanu ładowania.
2.  **Stworzenie strony `[id].astro` w `src/pages/orders/`**:
    - Pobierz `id` z parametrów URL (`Astro.params.id`).
    - Wyrenderuj komponent `SzczegolyZamowieniaView`, przekazując `id` jako prop.
3.  **Stworzenie komponentu `SzczegolyZamowieniaView`**:
    - Użyj hooka `useOrderDetails`.
    - Zaimplementuj renderowanie warunkowe (`SkeletonLoader`, `ErrorAlert`, `OrderDetailsCard`).
4.  **Stworzenie komponentu `OrderDetailsCard`**:
    - Przyjmij `order: OrderDetailsViewModel` jako prop.
    - Wyświetl wszystkie wymagane pola w czytelny sposób, używając `Card` i listy definicji.
    - Sformatuj datę `deliveredAt`.
5.  **Zgłoszenie długu technicznego**: Zarejestruj w backlogu zadanie na stworzenie dedykowanego endpointu `GET /api/orders/{id}`, który będzie zwracał zagregowane dane (`OrderDetailsViewModel`), aby w przyszłości uprościć i zoptymalizować logikę po stronie frontendu.

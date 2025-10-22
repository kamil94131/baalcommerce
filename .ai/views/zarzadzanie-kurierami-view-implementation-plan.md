# Plan implementacji widoku Zarządzanie Kurierami

## 1. Przegląd
Widok "Zarządzanie Kurierami" to panel administracyjny przeznaczony wyłącznie dla użytkowników z rolą 'gomez'. Umożliwia on pełen cykl życia encji kuriera: tworzenie nowych, przeglądanie listy istniejących oraz ich usuwanie. Widok ten jest kluczowy dla funkcjonowania systemu handlu, ponieważ dostępność kurierów jest warunkiem koniecznym do składania zamówień.

## 2. Routing widoku
Widok będzie dostępny pod ścieżką:
- `/couriers`

**Krytyczne wymaganie bezpieczeństwa**: Dostęp do tej ścieżki musi być chroniony na poziomie routingu (w pliku `.astro`). Przed wyrenderowaniem komponentu, należy zweryfikować rolę użytkownika. W przypadku braku uprawnień, użytkownik musi zostać przekierowany lub zobaczyć stronę błędu 403 Forbidden.

## 3. Struktura komponentów
```
/couriers.astro (Astro Page with Role Check)
└── ZarzadzanieKurieramiView (React Component)
    ├── h2 ("Dodaj nowego kuriera")
    ├── AddCourierForm (formularz dodawania)
    ├── Separator
    ├── h2 ("Lista istniejących kurierów")
    ├── SkeletonLoader
    ├── ErrorAlert
    └── CouriersDataTable (tabela z listą i akcjami)
```
- **`ZarzadzanieKurieramiView`**: Główny, stateful komponent React, który zarządza całym stanem widoku: listą kurierów, formularzem dodawania i logiką usuwania.
- **`AddCourierForm`**: Komponent formularza do tworzenia nowego kuriera, z walidacją.
- **`CouriersDataTable`**: Tabela wyświetlająca kurierów, z przyciskiem do usuwania przy każdym wierszu.

## 4. Szczegóły komponentów
### `ZarzadzanieKurieramiView`
- **Opis komponentu**: Komponent-kontener, który integruje wszystkie funkcjonalności. Używa niestandardowego hooka `useCouriers` do zarządzania danymi i interakcji z API.
- **Główne elementy**: Renderuje formularz dodawania oraz tabelę z listą.
- **Obsługiwane interakcje**: Przekazuje akcje `addCourier` i `deleteCourier` z hooka do odpowiednich komponentów potomnych.
- **Typy**: `CourierDto`, `CreateCourierCommand`.
- **Propsy**: Brak.

### `AddCourierForm`
- **Opis komponentu**: Formularz oparty na `react-hook-form` i `zod` do walidacji danych nowego kuriera.
- **Główne elementy**: `Form`, `Input` (dla nazwy), `Select` (dla obozu), `Button`.
- **Obsługiwana walidacja** (client-side):
    - `name`: `string().min(5).max(20)`
    - `camp`: `enum(["OLD_CAMP", "NEW_CAMP", "SWAMP_CAMP"])`
- **Typy**: `CreateCourierCommand`.
- **Propsy**: `onSubmit: (data: CreateCourierCommand) => void`, `isSubmitting: boolean`.

### `CouriersDataTable`
- **Opis komponentu**: Tabela danych z Shadcn/ui, wyświetlająca listę kurierów.
- **Główne elementy**: `Table`, `TableRow`, `Button` (dla akcji usuwania).
- **Obsługiwane interakcje**: `onDelete(courierId: number)`: wywołuje funkcję usuwania przekazaną z komponentu nadrzędnego, zazwyczaj po otwarciu i potwierdzeniu w `AlertDialog`.
- **Typy**: `CourierDto`.
- **Propsy**: `couriers: CourierDto[]`, `onDelete: (id: number) => void`.

## 5. Typy
- **`CreateCourierSchema`** (z `src/pages/api/couriers/courier.schema.ts`): Schemat `zod` do walidacji formularza dodawania.
- **`CourierDto`** (z `src/types.ts`): Główny obiekt danych dla listy kurierów.
- **`CreateCourierCommand`** (z `src/types.ts`): Typ danych dla `POST /couriers`.

## 6. Zarządzanie stanem
Zarządzanie stanem zostanie scentralizowane w niestandardowym hooku `useCouriers`.
- **`useCouriers` hook**:
    - **Cel**: Abstrakcja całej logiki CRUD dla kurierów.
    - **Zarządzane stany**: `couriers: CourierDto[]`, `isLoading: boolean`, `error: any`.
    - **Funkcjonalność**:
        - **`fetchCouriers`**: Wywołuje `GET /api/couriers` przy inicjalizacji.
        - **`addCourier`**: Wywołuje `POST /api/couriers`. Po sukcesie, odświeża listę kurierów.
        - **`deleteCourier`**: Wywołuje `DELETE /api/couriers/{id}`. Po sukcesie, odświeża listę.
    - **Rekomendacja**: Użycie biblioteki takiej jak `SWR` lub `React Query` uprościłoby logikę odświeżania danych po mutacjach.

## 7. Integracja API
- `GET /api/couriers`: Pobieranie listy kurierów przy ładowaniu widoku.
- `POST /api/couriers`: Tworzenie nowego kuriera. Wymaga roli 'gomez'.
- `DELETE /api/couriers/{id}`: Usuwanie kuriera. Wymaga roli 'gomez'.

## 8. Interakcje użytkownika
- **Użytkownik bez roli 'gomez' wchodzi na `/couriers`**: Zostaje natychmiast przekierowany lub widzi stronę błędu 403.
- **Użytkownik 'gomez' wchodzi na `/couriers`**: Widzi formularz i listę kurierów.
- **Użytkownik wypełnia formularz i klika "Dodaj"**: Nowy kurier jest tworzony i pojawia się na liście. Formularz zostaje wyczyszczony.
- **Użytkownik klika "Usuń" przy kurierze**: Pojawia się okno dialogowe z prośbą o potwierdzenie. Po potwierdzeniu, kurier znika z listy.

## 9. Warunki i walidacja
- **Kontrola dostępu (Front-end)**: Strona `/couriers.astro` musi zawierać logikę sprawdzającą rolę użytkownika przed renderowaniem jakiejkolwiek treści. To pierwsza linia obrony.
- **Kontrola dostępu (Back-end)**: Wszystkie endpointy (`POST`, `DELETE`) muszą weryfikować rolę 'gomez'.
- **Walidacja formularza**: Walidacja po stronie klienta (`zod`) i serwera musi być spójna.

## 10. Obsługa błędów
- **Błąd ładowania listy**: `ErrorAlert` z komunikatem "Nie udało się załadować listy kurierów."
- **Błąd dodawania (409 Conflict)**: Jeśli kurier o tej nazwie już istnieje, formularz powinien wyświetlić błąd przy polu `name`.
- **Błąd usuwania (409 Conflict)**: Jeśli kurier jest powiązany z zamówieniami, użytkownik powinien zobaczyć czytelny komunikat (np. w formie Toasta/Alertu), że operacja nie może być wykonana.
- **Brak uprawnień (403 Forbidden)**: Chociaż użytkownik nie powinien widzieć tego widoku, w razie bezpośredniego wywołania API, aplikacja powinna obsłużyć ten błąd, np. wylogowując użytkownika lub pokazując stronę błędu.

## 11. Kroki implementacji
1.  **Zabezpieczenie ścieżki**: W pliku `/src/pages/couriers.astro`, dodaj skrypt, który pobierze dane sesji/profilu użytkownika i sprawdzi rolę 'gomez'. Jeśli jej brak, wykonaj `Astro.redirect('/offers')`.
2.  **Stworzenie hooka `useCouriers`**: Zaimplementuj hook, który będzie zarządzał stanem listy kurierów oraz zawierał funkcje `addCourier` i `deleteCourier` do interakcji z API.
3.  **Stworzenie komponentu `ZarzadzanieKurieramiView`**:
    - Użyj hooka `useCouriers` do pobrania danych i funkcji.
    - Przekaż dane i funkcje do komponentów `AddCourierForm` i `CouriersDataTable`.
4.  **Stworzenie komponentu `AddCourierForm`**: Zintegruj `react-hook-form` z `zod` i `CreateCourierSchema`. Po submisji wywołaj `addCourier` z hooka.
5.  **Stworzenie komponentu `CouriersDataTable`**: Wyświetl dane. Dla każdego wiersza dodaj przycisk "Usuń", który po kliknięciu otworzy `AlertDialog` i po potwierdzeniu wywoła `deleteCourier(id)`.
6.  **Obsługa stanu ładowania i błędów**: Użyj `SkeletonLoader` podczas ładowania listy i `ErrorAlert` do wyświetlania błędów z hooka `useCouriers`.
7.  **Testowanie**: Sprawdź kontrolę dostępu dla zwykłego użytkownika i 'gomeza'. Przetestuj dodawanie, usuwanie, oraz obsługę błędów (duplikat nazwy, usuwanie używanego kuriera).
